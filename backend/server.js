const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { validateURL } = require('./services/urlValidator');
const { detectSoftware } = require('./services/softwareDetector');
const { scanSSL } = require('./services/SSLLabsScanner');
const { scanPorts } = require('./services/nmapScanner');
const { scanWithNuclei } = require('./services/nucleiScanner');
const { checkVulnerabilities, quickVulnerabilityCheck } = require('./services/cveDatabase');
const { generatePDF } = require('./services/pdfGenerator');
const { aggregateResults } = require('./utils/aggregator');
const logger = require('./utils/logger');
const { errorHandler, asyncHandler } = require('./middleware/errorHandler');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 5,
  message: { error: 'Too many scan requests. Please try again in 15 minutes.' }
});

app.use('/api/scan', limiter);

// Store active scans
const activeScans = new Map();

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    activeScans: activeScans.size,
    version: '1.0.0'
  });
});

// WebSocket connection handler
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);
  
  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
    activeScans.delete(socket.id);
  });
});

// Main scan endpoint
app.post('/api/scan', asyncHandler(async (req, res) => {
  const scanId = Date.now().toString();
  
  const { url, socketId } = req.body;
  
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }
  
  logger.info(`Starting scan: ${scanId} for ${url}`);
  
  // Validate URL
  const validation = await validateURL(url);
  if (!validation.valid) {
    logger.warn(`Invalid URL: ${url} - ${validation.error}`);
    return res.status(400).json({ error: validation.error });
  }
  
  const hostname = validation.hostname;
  
  // Send initial response
  res.json({ 
    message: 'Scan started',
    scanId,
    status: 'processing',
    estimatedTime: '2-5 minutes'
  });
  
  // Get socket for real-time updates
  const clientSocket = socketId ? io.sockets.sockets.get(socketId) : null;
  
  if (clientSocket) {
    activeScans.set(socketId, scanId);
  }
  
  // Emit progress updates
  const emit = (event, data) => {
    if (clientSocket) {
      clientSocket.emit(event, { scanId, ...data });
    }
  };
  
  emit('scan:progress', { step: 'start', message: 'Scan initiated...', progress: 5 });
  
  // Run scans with progress updates
  runScanWithProgress(url, hostname, scanId, emit);
}));

async function runScanWithProgress(url, hostname, scanId, emit) {
  const results = {
    detectedSoftware: null,
    ssl: null,
    nmap: null,
    nuclei: null,
    cve: null
  };
  
  try {
    // Step 1: Software Detection
    emit('scan:progress', { step: 'detection', message: 'Detecting technologies...', progress: 10 });
    
    try {
      results.detectedSoftware = await detectSoftware(url);
      emit('scan:step-complete', { step: 'detection', data: results.detectedSoftware, progress: 20 });
      logger.info(`[${scanId}] Software detection complete`);
    } catch (error) {
      logger.error(`[${scanId}] Software detection failed:`, error);
      emit('scan:error', { step: 'detection', error: error.message });
    }
    
    // Step 2: Quick Vulnerability Check
    emit('scan:progress', { step: 'quick-vuln', message: 'Checking known vulnerabilities...', progress: 25 });
    
    const quickVulns = [];
    if (results.detectedSoftware) {
      if (results.detectedSoftware.webServer) {
        const vuln = quickVulnerabilityCheck(
          results.detectedSoftware.webServer.name,
          results.detectedSoftware.webServer.version
        );
        if (vuln) quickVulns.push(vuln);
      }
      
      results.detectedSoftware.libraries?.forEach(lib => {
        if (lib.version) {
          const vuln = quickVulnerabilityCheck(lib.name, lib.version);
          if (vuln) quickVulns.push(vuln);
        }
      });
    }
    
    emit('scan:step-complete', { step: 'quick-vuln', data: { findings: quickVulns }, progress: 30 });

    // Steps 3, 4, 5: Run main scans in parallel
    emit('scan:progress', { step: 'parallel-scans', message: 'Running network and vulnerability scans...', progress: 35 });

    const scanPromises = [];

    // SSL Scan Promise
    scanPromises.push(
      (async () => {
        try {
          emit('scan:progress', { step: 'ssl', message: 'Analyzing SSL/TLS configuration...' });
          const sslResults = await scanSSL(hostname);
          results.ssl = sslResults;
          emit('scan:step-complete', { step: 'ssl', data: sslResults });
          logger.info(`[${scanId}] SSL scan complete`);
        } catch (error) {
          logger.error(`[${scanId}] SSL scan failed:`, error);
          emit('scan:error', { step: 'ssl', error: error.message });
          results.ssl = { findings: [], error: error.message };
        }
      })()
    );

    // Nmap Scan Promise
    scanPromises.push(
      (async () => {
        try {
          emit('scan:progress', { step: 'ports', message: 'Scanning ports and services...' });
          const nmapResults = await scanPorts(hostname);
          results.nmap = nmapResults;
          emit('scan:step-complete', { step: 'ports', data: nmapResults });
          logger.info(`[${scanId}] Nmap scan complete`);
        } catch (error) {
          logger.error(`[${scanId}] Nmap scan failed:`, error);
          emit('scan:error', { step: 'ports', error: error.message });
          results.nmap = { findings: [], detectedServices: [], error: error.message };
        }
      })()
    );

    // Nuclei Scan Promise
    scanPromises.push(
      (async () => {
        try {
          emit('scan:progress', { step: 'nuclei', message: 'Running vulnerability tests...' });
          const nucleiResults = await scanWithNuclei(url);
          results.nuclei = nucleiResults;
          emit('scan:step-complete', { step: 'nuclei', data: nucleiResults });
          logger.info(`[${scanId}] Nuclei scan complete`);
        } catch (error) {
          logger.error(`[${scanId}] Nuclei scan failed:`, error);
          emit('scan:error', { step: 'nuclei', error: error.message });
          results.nuclei = { findings: [], error: error.message };
        }
      })()
    );

    await Promise.all(scanPromises);

    emit('scan:progress', { step: 'parallel-scans', message: 'Network scans complete.', progress: 85 });
    
    // Step 6: CVE Check
    emit('scan:progress', { step: 'cve', message: 'Checking CVE database...', progress: 90 });
    
    try {
      if (results.detectedSoftware) {
        results.cve = await checkVulnerabilities(results.detectedSoftware);
      } else {
        results.cve = [];
      }
      emit('scan:step-complete', { step: 'cve', data: { findings: results.cve }, progress: 95 });
      logger.info(`[${scanId}] CVE check complete`);
    } catch (error) {
      logger.error(`[${scanId}] CVE check failed:`, error);
      emit('scan:error', { step: 'cve', error: error.message });
      results.cve = [];
    }
    
    // Step 7: Aggregate
    emit('scan:progress', { step: 'aggregate', message: 'Generating final report...', progress: 98 });
    
    const finalResults = aggregateResults(
      results.ssl || { findings: [] },
      results.nmap || { findings: [] },
      results.nuclei || { findings: [] },
      results.detectedSoftware || {},
      [...quickVulns, ...(results.cve || [])]
    );
    
    // Step 8: Complete
    emit('scan:complete', { results: finalResults, progress: 100 });
    
    logger.info(`[${scanId}] Scan complete - Score: ${finalResults.score}/100, Issues: ${finalResults.totalIssues}`);
    
  } catch (error) {
    logger.error(`[${scanId}] Fatal scan error:`, error);
    emit('scan:failed', { error: error.message });
  }
}

// PDF download endpoint
app.get('/api/report/:scanId/pdf', asyncHandler(async (req, res) => {
  const { scanId } = req.params;
  const results = req.query.results ? JSON.parse(decodeURIComponent(req.query.results)) : null;
  const url = req.query.url || 'Unknown URL';
  
  if (!results) {
    return res.status(404).json({ error: 'Scan results not found' });
  }
  
  logger.info(`Generating PDF for scan ${scanId}`);
  
  const pdfBuffer = await generatePDF(results, url);
  
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="security-report-${scanId}.pdf"`);
  res.send(pdfBuffer);
}));

// Error handler (must be last)
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  logger.info(`🚀 Security Scanner API running on port ${PORT}`);
  logger.info(`📍 Health check: http://localhost:${PORT}/api/health`);
  logger.info(`🔌 WebSocket server ready`);
  logger.info(`📊 Environment: ${process.env.NODE_ENV}`);
});

module.exports = { app, server, io };
