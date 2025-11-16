const express = require('express');
const http = require('http');
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

// Store scan progress for polling (in-memory cache only)
// Lambda containers don't share /tmp, so file-based caching won't work
// For production, consider DynamoDB or ElastiCache for shared state
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
    logger.warn(`Scan ${scanId} not found in memory`);
    return res.status(404).json({
      error: 'Scan not found or expired',
      scanId
    });
  }

  res.json(scanData);
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

  // Increment running scans counter
  runningScansCount++;
  logger.info(`[${scanId}] Running scans: ${runningScansCount}/${MAX_CONCURRENT_SCANS}`);

  // Return scanId immediately - client will poll for progress
  res.json({
    status: 'processing',
    scanId,
    message: 'Scan started. Poll /api/scan/' + scanId + '/status for progress.'
  });

  // Run scan asynchronously with progress updates
  (async () => {
    try {
      const finalResults = await runScanWithProgress(url, hostname, scanId);

      // Update progress store with final results
      scanProgressStore.set(scanId, {
        scanId,
        status: 'completed',
        progress: 100,
        message: 'Scan completed successfully!',
        step: 'complete',
        results: finalResults,
        error: null,
        completedAt: new Date().toISOString()
      });

      // Clean up after 10 minutes
      setTimeout(() => {
        scanProgressStore.delete(scanId);
        logger.info(`[${scanId}] Progress data cleaned up`);
      }, 600000);

    } catch (error) {
      logger.error(`[${scanId}] Scan failed:`, error);

      // Update progress store with error
      scanProgressStore.set(scanId, {
        scanId,
        status: 'failed',
        progress: 0,
        message: 'Scan failed',
        step: 'error',
        results: null,
        error: error.message,
        failedAt: new Date().toISOString()
      });
    } finally {
      runningScansCount--;
      logger.info(`[${scanId}] Scan finished. Running scans: ${runningScansCount}/${MAX_CONCURRENT_SCANS}`);
    }
  })();
}));

// Synchronous scan function - returns results directly without polling
async function runScanSync(url, hostname, scanId) {
  const results = {
    detectedSoftware: null,
    ssl: null,
    nmap: null,
    nuclei: null,
    cve: null
  };

  try {
    // Step 1: Software Detection
    logger.info(`[${scanId}] Step 1/5: Detecting technologies...`);
    try {
      results.detectedSoftware = await detectSoftware(url);
      logger.info(`[${scanId}] Software detection complete`);
    } catch (error) {
      logger.error(`[${scanId}] Software detection failed:`, error);
    }

    // Step 2: Quick Vulnerability Check
    logger.info(`[${scanId}] Step 2/5: Checking known vulnerabilities...`);
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

    // Step 3: Run main scans in parallel (SSL, Nmap, Nuclei)
    logger.info(`[${scanId}] Step 3/5: Running parallel scans (SSL, Nmap, Nuclei)...`);
    const scanPromises = [];

    // SSL Scan Promise
    scanPromises.push(
      (async () => {
        try {
          const sslResults = await scanSSL(hostname);
          results.ssl = sslResults;
          logger.info(`[${scanId}] SSL scan complete`);
        } catch (error) {
          logger.error(`[${scanId}] SSL scan failed:`, error);
          results.ssl = { findings: [], error: error.message };
        }
      })()
    );

    // Nmap Scan Promise
    scanPromises.push(
      (async () => {
        try {
          const nmapResults = await scanPorts(hostname);
          results.nmap = nmapResults;
          logger.info(`[${scanId}] Nmap scan complete`);
        } catch (error) {
          logger.error(`[${scanId}] Nmap scan failed:`, error);
          results.nmap = { findings: [], detectedServices: [], error: error.message };
        }
      })()
    );

    // Nuclei Scan Promise
    scanPromises.push(
      (async () => {
        try {
          const nucleiResults = await scanWithNuclei(url);
          results.nuclei = nucleiResults;
          logger.info(`[${scanId}] Nuclei scan complete - Found ${nucleiResults.findings?.length || 0} issues`);
        } catch (error) {
          logger.error(`[${scanId}] Nuclei scan failed:`, error.message, error.stack);
          results.nuclei = { findings: [], error: error.message };
        }
      })()
    );

    await Promise.all(scanPromises);

    // Step 4: CVE Check
    logger.info(`[${scanId}] Step 4/5: Checking CVE database...`);
    try {
      if (results.detectedSoftware) {
        results.cve = await checkVulnerabilities(results.detectedSoftware);
      } else {
        results.cve = [];
      }
      logger.info(`[${scanId}] CVE check complete`);
    } catch (error) {
      logger.error(`[${scanId}] CVE check failed:`, error);
      results.cve = [];
    }

    // Step 5: Aggregate results
    logger.info(`[${scanId}] Step 5/5: Generating final report...`);
    const finalResults = aggregateResults(
      results.ssl || { findings: [] },
      results.nmap || { findings: [] },
      results.nuclei || { findings: [] },
      results.detectedSoftware || {},
      [...quickVulns, ...(results.cve || [])],
      url  // Pass URL to check for HTTP vs HTTPS
    );

    // Add the scanned URL to results
    finalResults.url = url;

    logger.info(`[${scanId}] Scan complete - Score: ${finalResults.score}/100, Issues: ${finalResults.totalIssues}`);

    return finalResults;

  } catch (error) {
    logger.error(`[${scanId}] Fatal scan error:`, error);
    throw error;
  }
}

async function runScanWithProgress(url, hostname, scanId) {
  // Helper function to update progress in scanProgressStore
  const updateProgress = (progress, message, step, data = null, error = null) => {
    scanProgressStore.set(scanId, {
      scanId,
      status: error ? 'error' : 'processing',
      progress,
      message,
      step,
      data,
      error,
      startedAt: scanProgressStore.get(scanId)?.startedAt || new Date().toISOString()
    });
  };

  const results = {
    detectedSoftware: null,
    ssl: null,
    nmap: null,
    nuclei: null,
    cve: null
  };

  try {
    // Step 1: Software Detection
    updateProgress(10, 'Detecting technologies...', 'detection');

    try {
      results.detectedSoftware = await detectSoftware(url);
      updateProgress(20, 'Technology detection complete', 'detection', results.detectedSoftware);
      logger.info(`[${scanId}] Software detection complete`);
    } catch (error) {
      logger.error(`[${scanId}] Software detection failed:`, error);
      updateProgress(20, `Detection error: ${error.message}`, 'detection', null, error.message);
    }

    // Step 2: Quick Vulnerability Check
    updateProgress(25, 'Checking known vulnerabilities...', 'quick-vuln');

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

    updateProgress(30, 'Quick vulnerability check complete', 'quick-vuln', { findings: quickVulns });

    // Steps 3, 4, 5: Run main scans in parallel
    updateProgress(35, 'Running network and vulnerability scans...', 'parallel-scans');

    const scanPromises = [];
    let completedScans = 0;
    const totalScans = 4;

    // SSL Scan Promise
    scanPromises.push(
      (async () => {
        try {
          const sslResults = await scanSSL(hostname);
          results.ssl = sslResults;
          logger.info(`[${scanId}] SSL scan complete`);
        } catch (error) {
          logger.error(`[${scanId}] SSL scan failed:`, error);
          results.ssl = { findings: [], error: error.message };
        } finally {
          completedScans++;
          const progress = 35 + Math.round((completedScans / totalScans) * 55);
          updateProgress(progress, `Completed ${completedScans}/${totalScans} scans...`, 'scans-update');
        }
      })()
    );

    // Nmap Scan Promise
    scanPromises.push(
      (async () => {
        try {
          const nmapResults = await scanPorts(hostname);
          results.nmap = nmapResults;
          logger.info(`[${scanId}] Nmap scan complete`);
        } catch (error) {
          logger.error(`[${scanId}] Nmap scan failed:`, error);
          results.nmap = { findings: [], detectedServices: [], error: error.message };
        } finally {
          completedScans++;
          const progress = 35 + Math.round((completedScans / totalScans) * 55);
          updateProgress(progress, `Completed ${completedScans}/${totalScans} scans...`, 'scans-update');
        }
      })()
    );

    // Nuclei Scan Promise
    scanPromises.push(
      (async () => {
        try {
          const nucleiResults = await scanWithNuclei(url);
          results.nuclei = nucleiResults;
          logger.info(`[${scanId}] Nuclei scan complete - Found ${nucleiResults.findings?.length || 0} issues`);
        } catch (error) {
          logger.error(`[${scanId}] Nuclei scan failed:`, error.message, error.stack);
          results.nuclei = { findings: [], error: error.message };
        } finally {
          completedScans++;
          const progress = 35 + Math.round((completedScans / totalScans) * 55);
          updateProgress(progress, `Completed ${completedScans}/${totalScans} scans...`, 'scans-update');
        }
      })()
    );

    await Promise.all(scanPromises);

    // Step 6: CVE Check
    updateProgress(90, 'Checking CVE database...', 'cve');

    try {
      if (results.detectedSoftware) {
        results.cve = await checkVulnerabilities(results.detectedSoftware);
      } else {
        results.cve = [];
      }
      logger.info(`[${scanId}] CVE check complete`);
    } catch (error) {
      logger.error(`[${scanId}] CVE check failed:`, error);
      results.cve = [];
    } finally {
        completedScans++;
        const progress = 35 + Math.round((completedScans / totalScans) * 55);
        updateProgress(95, `Completed ${completedScans}/${totalScans} scans...`, 'scans-update');
    }

    // Step 7: Aggregate
    updateProgress(98, 'Generating final report...', 'aggregate');

    const finalResults = aggregateResults(
      results.ssl || { findings: [] },
      results.nmap || { findings: [] },
      results.nuclei || { findings: [] },
      results.detectedSoftware || {},
      [...quickVulns, ...(results.cve || [])],
      url  // Pass URL to check for HTTP vs HTTPS
    );

    // Add the scanned URL to results
    finalResults.url = url;

    logger.info(`[${scanId}] Scan complete - Score: ${finalResults.score}/100, Issues: ${finalResults.totalIssues}`);

    // Return the final results
    return finalResults;

  } catch (error) {
    logger.error(`[${scanId}] Fatal scan error:`, error);
    throw error;
  } finally {
    // Always decrement running scans counter when scan finishes
    runningScansCount--;
    logger.info(`[${scanId}] Scan finished. Running scans: ${runningScansCount}/${MAX_CONCURRENT_SCANS}`);

    // Clean up after 5 minutes to prevent memory leaks
    setTimeout(() => {
      scanProgressStore.delete(scanId);
      logger.info(`[${scanId}] Cleaned up scan progress data`);
    }, 5 * 60 * 1000);
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
