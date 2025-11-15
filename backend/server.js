const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { validateURL } = require('./services/urlValidator');
const { detectSoftware } = require('./services/softwareDetector');
const { scanSSL } = require('./services/SSLLabsScanner');
const { scanPorts } = require('./services/nmapScanner');
const { scanWithNuclei, initializeNucleiTemplates } = require('./services/nucleiScanner');
const { checkVulnerabilities, quickVulnerabilityCheck } = require('./services/cveDatabase');
const { aggregateResults } = require('./utils/aggregator');
const logger = require('./utils/logger');
const { errorHandler, asyncHandler } = require('./middleware/errorHandler');
const helmet = require('helmet');

const app = express();
const server = http.createServer(app);

// Disable x-powered-by header
app.disable('x-powered-by');

// Use helmet for security headers
app.use(helmet());
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'"],
    objectSrc: ["'none'"],
    upgradeInsecureRequests: [],
  }
}));

// Add cache-control header
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});


// Trust proxy setting - REQUIRED for Lambda/API Gateway and rate limiting
// This allows Express to trust X-Forwarded-* headers from proxies
app.set('trust proxy', true);

// Socket.IO configuration (optional - fallback support)
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS']
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  connectTimeout: 45000,
  transports: ['websocket', 'polling']
});

// Use cors middleware properly
app.use(cors({ origin: '*', credentials: false }));
app.use(express.json());

// Rate limiting - only for POST /api/scan (not for status polling)
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 5,
  message: { error: 'Too many scan requests. Please try again in 15 minutes.' }
});

// Store active scans
const activeScans = new Map();

// Store scan progress for polling (in-memory cache)
const scanProgressStore = new Map();

// Concurrency limiter - configurable based on available memory
let runningScansCount = 0;
const MAX_CONCURRENT_SCANS = parseInt(process.env.MAX_CONCURRENT_SCANS) || 3; // Default: 3 concurrent scans for Lambda (1GB memory)

// Root route
app.get('/', (req, res) => {
  res.json({
    service: 'Security Scanner API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/api/health',
      scan: 'POST /api/scan',
      scanStatus: 'GET /api/scan/:scanId/status'
    },
    documentation: 'https://github.com/vallabh-13/MakeUC2025-Security-Scanner'
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    activeScans: activeScans.size,
    runningScans: runningScansCount,
    maxConcurrentScans: MAX_CONCURRENT_SCANS,
    version: '1.0.0'
  });
});

// Polling endpoint for scan status
app.get('/api/scan/:scanId/status', (req, res) => {
  const { scanId } = req.params;

  const scanData = scanProgressStore.get(scanId);

  if (!scanData) {
    return res.status(404).json({
      error: 'Scan not found',
      scanId
    });
  }

  res.json(scanData);
});

// WebSocket connection handler
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);

  socket.on('disconnect', (reason) => {
    logger.info(`Client disconnected: ${socket.id}, reason: ${reason}`);
    const scanId = activeScans.get(socket.id);
    if (scanId) {
      logger.warn(`Active scan ${scanId} lost connection - scan will continue but results may not be delivered`);
    }
    activeScans.delete(socket.id);
  });

  socket.on('error', (error) => {
    logger.error(`Socket error for ${socket.id}:`, error);
  });
});

// Main scan endpoint - with rate limiting
app.post('/api/scan', limiter, asyncHandler(async (req, res) => {
  const scanId = Date.now().toString();

  const { url, socketId } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  // Check if we've reached the concurrent scan limit
  if (runningScansCount >= MAX_CONCURRENT_SCANS) {
    logger.warn(`Scan rejected: ${scanId} - Max concurrent scans reached (${runningScansCount}/${MAX_CONCURRENT_SCANS})`);
    return res.status(503).json({
      error: 'Server is currently processing another scan. Please try again in a few minutes.',
      runningScans: runningScansCount,
      maxScans: MAX_CONCURRENT_SCANS
    });
  }

  logger.info(`Starting scan: ${scanId} for ${url}`);
  
  // Validate URL
  const validation = await validateURL(url);
  if (!validation.valid) {
    logger.warn(`Invalid URL: ${url} - ${validation.error}`);
    return res.status(400).json({ error: validation.error });
  }
  
  const hostname = validation.hostname;
  
  // Initialize progress store for polling
  scanProgressStore.set(scanId, {
    scanId,
    status: 'processing',
    progress: 5,
    message: 'Scan initiated...',
    step: 'start',
    results: null,
    error: null,
    startedAt: new Date().toISOString()
  });

  // Send initial response
  res.json({
    message: 'Scan started',
    scanId,
    status: 'processing',
    estimatedTime: '2-5 minutes'
  });

  // Get socket for real-time updates (optional - fallback for WebSocket)
  const clientSocket = socketId ? io.sockets.sockets.get(socketId) : null;

  if (clientSocket) {
    activeScans.set(socketId, scanId);
  }

  // Emit progress updates (supports both Socket.IO and polling)
  const emit = (event, data) => {
    // Update progress store for polling
    const currentProgress = scanProgressStore.get(scanId) || {};
    scanProgressStore.set(scanId, {
      ...currentProgress,
      ...data,
      lastUpdated: new Date().toISOString()
    });

    // Also emit via Socket.IO if client is connected
    if (clientSocket && clientSocket.connected) {
      clientSocket.emit(event, { scanId, ...data });
    }
  };

  emit('scan:progress', { step: 'start', message: 'Scan initiated...', progress: 5 });

  // Increment running scans counter
  runningScansCount++;
  logger.info(`[${scanId}] Running scans: ${runningScansCount}/${MAX_CONCURRENT_SCANS}`);

  // Run scans with progress updates
  runScanWithProgress(url, hostname, scanId, emit, socketId);
}));

async function runScanWithProgress(url, hostname, scanId, emit, socketId) {
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
    let completedScans = 0;
    const totalScans = 4; // Changed from 3 to 4

    // SSL Scan Promise
    // scanPromises.push(
    //   (async () => {
    //     try {
    //       const sslResults = await scanSSL(hostname);
    //       results.ssl = sslResults;
    //       emit('scan:step-complete', { step: 'ssl', data: sslResults });
    //       logger.info(`[${scanId}] SSL scan complete`);
    //     } catch (error) {
    //       logger.error(`[${scanId}] SSL scan failed:`, error);
    //       emit('scan:error', { step: 'ssl', error: error.message });
    //       results.ssl = { findings: [], error: error.message };
    //     } finally {
    //       completedScans++;
    //       const progress = 35 + Math.round((completedScans / totalScans) * 55);
    //       emit('scan:progress', { step: 'scans-update', message: `Completed ${completedScans}/${totalScans} scans...`, progress });
    //     }
    //   })()
    // );

    // Nmap Scan Promise
    scanPromises.push(
      (async () => {
        try {
          const nmapResults = await scanPorts(hostname);
          results.nmap = nmapResults;
          emit('scan:step-complete', { step: 'ports', data: nmapResults });
          logger.info(`[${scanId}] Nmap scan complete`);
        } catch (error) {
          logger.error(`[${scanId}] Nmap scan failed:`, error);
          emit('scan:error', { step: 'ports', error: error.message });
          results.nmap = { findings: [], detectedServices: [], error: error.message };
        } finally {
          completedScans++;
          const progress = 35 + Math.round((completedScans / totalScans) * 55);
          emit('scan:progress', { step: 'scans-update', message: `Completed ${completedScans}/${totalScans} scans...`, progress });
        }
      })()
    );

    // Nuclei Scan Promise
    scanPromises.push(
      (async () => {
        try {
          const nucleiResults = await scanWithNuclei(url);
          results.nuclei = nucleiResults;
          emit('scan:step-complete', { step: 'nuclei', data: nucleiResults });
          logger.info(`[${scanId}] Nuclei scan complete - Found ${nucleiResults.findings?.length || 0} issues`);
        } catch (error) {
          logger.error(`[${scanId}] Nuclei scan failed:`, error.message, error.stack);
          emit('scan:error', { step: 'nuclei', error: error.message });
          results.nuclei = { findings: [], error: error.message };
        } finally {
          completedScans++;
          const progress = 35 + Math.round((completedScans / totalScans) * 55);
          emit('scan:progress', { step: 'scans-update', message: `Completed ${completedScans}/${totalScans} scans...`, progress });
        }
      })()
    );

    await Promise.all(scanPromises);
    
    // Step 6: CVE Check
    emit('scan:progress', { step: 'cve', message: 'Checking CVE database...', progress: 90 });
    
    try {
      if (results.detectedSoftware) {
        results.cve = await checkVulnerabilities(results.detectedSoftware);
      } else {
        results.cve = [];
      }
      emit('scan:step-complete', { step: 'cve', data: { findings: results.cve } });
      logger.info(`[${scanId}] CVE check complete`);
    } catch (error) {
      logger.error(`[${scanId}] CVE check failed:`, error);
      emit('scan:error', { step: 'cve', error: error.message });
      results.cve = [];
    } finally {
        completedScans++;
        const progress = 35 + Math.round((completedScans / totalScans) * 55);
        emit('scan:progress', { step: 'scans-update', message: `Completed ${completedScans}/${totalScans} scans...`, progress: 95 });
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

    // Add the scanned URL to results
    finalResults.url = url;

    // Step 8: Complete
    emit('scan:complete', {
      status: 'completed',
      results: finalResults,
      progress: 100,
      message: 'Scan completed successfully!'
    });

    logger.info(`[${scanId}] Scan complete - Score: ${finalResults.score}/100, Issues: ${finalResults.totalIssues}`);

  } catch (error) {
    logger.error(`[${scanId}] Fatal scan error:`, error);
    emit('scan:failed', {
      status: 'failed',
      error: error.message,
      progress: 0,
      message: 'Scan failed'
    });
  } finally {
    // Always decrement running scans counter when scan finishes
    runningScansCount--;
    logger.info(`[${scanId}] Scan finished. Running scans: ${runningScansCount}/${MAX_CONCURRENT_SCANS}`);

    // Clean up after 5 minutes to prevent memory leaks
    setTimeout(() => {
      scanProgressStore.delete(scanId);
      logger.info(`[${scanId}] Cleaned up scan progress data`);
    }, 5 * 60 * 1000);

    // Clean up active scans map
    if (socketId) {
      activeScans.delete(socketId);
    }
  }
}

// PDF generation has been moved to the frontend using @react-pdf/renderer
// This eliminates Lambda compatibility issues and provides faster, more reliable PDFs

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

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', async () => {
  logger.info(`🚀 Security Scanner API running on port ${PORT}`);
  logger.info(`📍 Health check: http://localhost:${PORT}/api/health`);
  logger.info(`🔌 WebSocket server ready`);
  logger.info(`📊 Environment: ${process.env.NODE_ENV}`);

  // Initialize Nuclei templates in the background
  initializeNucleiTemplates().catch(err => {
    logger.warn('Nuclei template initialization failed:', err.message);
  });
});

module.exports = { app, server, io };
