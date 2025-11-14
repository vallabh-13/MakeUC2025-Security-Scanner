const { exec } = require('child_process');
const util = require('util');
const fs = require('fs').promises;
const path = require('path');
const execPromise = util.promisify(exec);

/**
 * Scan URL for vulnerabilities using Nuclei
 * @param {string} url - Target URL to scan
 * @returns {Object} - Scan findings
 */
async function scanWithNuclei(url) {
  const findings = [];

  try {
    // First check if Nuclei is installed
    try {
      await execPromise('nuclei -version', { timeout: 5000 });
    } catch (versionError) {
      console.error('Nuclei is not installed or not in PATH');
      return {
        findings: [],
        error: 'Nuclei scanner is not available. Other security scans completed successfully.'
      };
    }

    // Create temporary directories for Nuclei in /tmp (Lambda-compatible)
    const os = require('os');
    const tmpDir = os.tmpdir();
    const outputFile = path.join(tmpDir, `nuclei-${Date.now()}.json`);
    const nucleiConfigDir = path.join(tmpDir, '.nuclei-config');

    // Ensure temp directories exist and are writable
    try {
      await fs.mkdir(nucleiConfigDir, { recursive: true });
    } catch (mkdirError) {
      console.warn('Could not create Nuclei config directory:', mkdirError.message);
    }

    // Nuclei command with Lambda-compatible settings:
    // -u: Target URL
    // -t: Explicit templates directory (CRITICAL for Lambda)
    // -jsonl: Output in JSON Lines format
    // -severity: Only scan for critical, high, and medium severity issues
    // -o: Output file in /tmp
    // -timeout: Request timeout (30 seconds)
    // -rate-limit: Max 50 requests per second
    // -silent: Reduce console noise
    // -duc: Disable update check (prevents config file creation)
    // -nc: No color output
    // -disable-update-check: Extra safety to prevent updates
    const templatesDir = '/opt/nuclei-templates'; // Pre-downloaded during Docker build
    const command = `nuclei -u "${url}" -t "${templatesDir}" -jsonl -severity critical,high,medium,low,info -o "${outputFile}" -timeout 30 -rate-limit 50 -silent -duc -nc -disable-update-check`;

    console.log('[Nuclei] Starting scan in Lambda mode with pre-downloaded templates');
    console.log(`[Nuclei] Command: ${command}`);
    console.log(`[Nuclei] Templates directory: ${templatesDir}`);
    console.log(`[Nuclei] Output file: ${outputFile}`);
    console.log(`[Nuclei] Target URL: ${url}`);

    // Execute Nuclei with templates directory set via environment variable
    const { stdout, stderr } = await execPromise(command, {
      timeout: 300000, // 5 minutes max
      maxBuffer: 20 * 1024 * 1024, // 20MB buffer
      env: {
        ...process.env,
        HOME: tmpDir, // Force Nuclei to use /tmp for all config/cache
        TMPDIR: tmpDir,
        TEMP: tmpDir,
        TMP: tmpDir,
        NUCLEI_CONFIG_DIR: nucleiConfigDir,
        NUCLEI_TEMPLATES_DIRECTORY: templatesDir // Use pre-downloaded templates
      }
    });

    if (stderr) {
      console.warn('[Nuclei] stderr output:', stderr);
    }
    if (stdout) {
      console.log('[Nuclei] stdout output:', stdout);
    }

    console.log('[Nuclei] Scan execution completed, reading results...');

    // Read results from output file
    let output = '';
    try {
      // Check if file exists first
      try {
        const stats = await fs.stat(outputFile);
        console.log(`[Nuclei] Output file size: ${stats.size} bytes`);
      } catch (statError) {
        console.error(`[Nuclei] Output file does not exist: ${outputFile}`);
        return { findings: [], error: 'Nuclei did not create output file - may have found no vulnerabilities' };
      }

      output = await fs.readFile(outputFile, 'utf-8');
      console.log(`[Nuclei] Read ${output.length} characters from output file`);
    } catch (readError) {
      console.error('[Nuclei] Failed to read output file:', readError.message);
      // Clean up temp file
      await fs.unlink(outputFile).catch(() => {});
      return { findings: [], error: 'Failed to read scan results' };
    }

    // Clean up temp files
    await fs.unlink(outputFile).catch(() => {});

    // Parse JSON Lines output
    const lines = output.trim().split('\n').filter(Boolean);
    console.log(`[Nuclei] Parsing ${lines.length} result lines...`);

    if (lines.length === 0) {
      console.log('[Nuclei] No vulnerabilities found (empty output)');
      await fs.unlink(outputFile).catch(() => {});
      return { findings: [] };
    }

    lines.forEach(line => {
      try {
        const result = JSON.parse(line);
        
        // Extract relevant information
        // Handle remediation - ensure it's a string
        let recommendation = '';
        if (result.info.remediation) {
          if (typeof result.info.remediation === 'string') {
            recommendation = result.info.remediation.trim();
          } else if (Array.isArray(result.info.remediation)) {
            recommendation = result.info.remediation.join('. ').trim();
          }
        }
        // If still empty, generate a recommendation
        if (!recommendation) {
          recommendation = generateRemediation(result.info.name);
        }

        findings.push({
          severity: result.info.severity.toLowerCase(),
          title: result.info.name,
          description: result.info.description || result.info.name,
          type: result.type,
          matchedAt: result['matched-at'] || result.host,
          templateId: result['template-id'],
          cwe: extractCWE(result),
          cvss: extractCVSS(result),
          tags: result.info.tags || [],
          reference: result.info.reference || [],
          recommendation: recommendation
        });
        
      } catch (e) {
        console.error('[Nuclei] Failed to parse result line:', e.message);
        console.error('[Nuclei] Problematic line:', line.substring(0, 100));
      }
    });

    console.log(`[Nuclei] Successfully parsed ${findings.length} findings`);
    return { findings };
    
  } catch (error) {
    console.error('Nuclei scan failed:', error.message);

    // Check if Nuclei is installed
    if (error.message.includes('nuclei: not found') ||
        error.message.includes('command not found')) {
      return {
        findings: [],
        error: 'Nuclei is not installed on this server. Please install it: https://github.com/projectdiscovery/nuclei'
      };
    }

    // Check for read-only filesystem errors (Lambda)
    if (error.message.includes('read-only file system') ||
        error.message.includes('Could not create runner')) {
      console.log('Nuclei failed due to filesystem restrictions - this is expected in Lambda');
      return {
        findings: [],
        error: 'Nuclei scan skipped (Lambda filesystem restrictions). Other security scans completed successfully.'
      };
    }

    // Check if templates are missing
    if (error.message.includes('no templates')) {
      return {
        findings: [],
        error: 'Nuclei templates not found. Run: nuclei -update-templates'
      };
    }

    // Return error but don't fail the whole scan
    console.log('Nuclei scan completed with errors, continuing with other scans...');
    return { findings: [], error: error.message };
  }
}

/**
 * Extract CWE IDs from Nuclei result
 * @param {Object} result - Nuclei scan result
 * @returns {string} - Comma-separated CWE IDs
 */
function extractCWE(result) {
  const cweIds = result.info.classification?.['cwe-id'];
  if (Array.isArray(cweIds) && cweIds.length > 0) {
    return cweIds.join(', ');
  }
  return 'N/A';
}

/**
 * Extract CVSS score from Nuclei result
 * @param {Object} result - Nuclei scan result
 * @returns {string} - CVSS score with metrics
 */
function extractCVSS(result) {
  const cvssMetrics = result.info.classification?.['cvss-metrics'];
  const cvssScore = result.info.classification?.['cvss-score'];
  
  if (cvssScore) {
    return `${cvssScore}${cvssMetrics ? ` (${cvssMetrics})` : ''}`;
  }
  
  return 'N/A';
}

/**
 * Generate generic remediation advice based on vulnerability name
 * @param {string} vulnerabilityName - Name of the vulnerability
 * @returns {string} - Remediation advice
 */
function generateRemediation(vulnerabilityName) {
  if (!vulnerabilityName) {
    return 'Review the vulnerability details and apply the recommended security patches. Consult security documentation for specific remediation steps.';
  }

  const lowerName = vulnerabilityName.toLowerCase();

  // XSS vulnerabilities
  if (lowerName.includes('xss') || lowerName.includes('cross-site scripting') || lowerName.includes('reflected') && lowerName.includes('script')) {
    return 'Implement proper input validation and output encoding. Sanitize all user inputs. Use Content Security Policy (CSP) headers to prevent script execution.';
  }

  // SQL Injection vulnerabilities
  if (lowerName.includes('sql') || lowerName.includes('sqli') || lowerName.includes('injection')) {
    return 'Use parameterized queries or prepared statements. Never concatenate user input into SQL queries. Implement proper input validation and use an ORM framework.';
  }

  // Path/Directory Traversal vulnerabilities
  if (lowerName.includes('path traversal') || lowerName.includes('directory traversal') || lowerName.includes('lfi') || lowerName.includes('file inclusion')) {
    return 'Validate and sanitize all file paths. Use a whitelist of allowed paths. Implement proper access controls. Avoid using user input directly in file operations.';
  }
  
  if (lowerName.includes('exposed') || lowerName.includes('disclosure')) {
    return 'Remove or restrict access to sensitive files and directories. Implement proper access controls.';
  }
  
  if (lowerName.includes('csrf') || lowerName.includes('cross-site request')) {
    return 'Implement anti-CSRF tokens for all state-changing operations. Validate the origin and referer headers.';
  }
  
  if (lowerName.includes('ssrf') || lowerName.includes('server-side request')) {
    return 'Validate and sanitize all URLs. Use allowlists for permitted domains. Disable unnecessary protocols.';
  }
  
  if (lowerName.includes('rce') || lowerName.includes('remote code execution')) {
    return 'Never execute user-supplied input. Update to the latest patched version immediately. Implement strict input validation.';
  }
  
  if (lowerName.includes('lfi') || lowerName.includes('local file inclusion')) {
    return 'Avoid including files based on user input. Use a whitelist of allowed files. Validate file paths strictly.';
  }
  
  return 'Review the vulnerability details and apply the recommended security patches. Consult the references for specific remediation steps.';
}

/**
 * Check if Nuclei is installed and templates are available
 * @returns {Object} - Status object
 */
async function checkNucleiInstallation() {
  try {
    const { stdout: version } = await execPromise('nuclei -version');

    return {
      installed: true,
      version: version.trim()
    };
  } catch (error) {
    return {
      installed: false,
      error: 'Nuclei is not installed or not in PATH'
    };
  }
}

/**
 * Initialize Nuclei templates on first startup
 * Downloads templates if not already present
 * @returns {Object} - Initialization status
 */
async function initializeNucleiTemplates() {
  try {
    console.log('Checking Nuclei templates...');

    // First check if Nuclei is installed
    try {
      const { stdout } = await execPromise('nuclei -version', { timeout: 5000 });
      console.log('Nuclei version:', stdout.trim());
    } catch (versionError) {
      console.warn('Nuclei is not installed, skipping template initialization');
      return { success: false, error: 'Nuclei not installed' };
    }

    // In Lambda, templates are pre-downloaded to /opt/nuclei-templates during Docker build
    // No need to update templates at runtime - just verify they exist
    const templatesDir = '/opt/nuclei-templates';

    try {
      const stats = await fs.stat(templatesDir);
      if (stats.isDirectory()) {
        console.log(`Nuclei templates found at ${templatesDir}`);
        const files = await fs.readdir(templatesDir);
        console.log(`Template directory contains ${files.length} items`);
        return { success: true, templatesDir, count: files.length };
      }
    } catch (statError) {
      console.warn(`Templates directory not found at ${templatesDir}:`, statError.message);
      console.warn('Nuclei will attempt to download templates on first scan');
    }

    return { success: false, error: 'Templates not pre-installed, will download on first scan' };
  } catch (error) {
    // Log warning but don't fail - Nuclei will work with built-in templates or download on first scan
    console.warn('Warning: Could not pre-download Nuclei templates:', error.message);
    console.warn('Nuclei will use built-in templates or download on first scan');
    return { success: false, error: error.message };
  }
}

module.exports = {
  scanWithNuclei,
  checkNucleiInstallation,
  initializeNucleiTemplates
};
