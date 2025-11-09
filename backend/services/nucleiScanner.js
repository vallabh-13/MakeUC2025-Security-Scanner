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
    // Create temporary output file
    const outputFile = path.join('/tmp', `nuclei-${Date.now()}.json`);
    
    // Nuclei command:
    // -u: Target URL
    // -jsonl: Output in JSON Lines format
    // -severity: Only scan for critical, high, and medium severity issues
    // -o: Output file
    // -timeout: Request timeout (30 seconds)
    // -rate-limit: Max 50 requests per second
    // -silent: Reduce console noise
    const command = `nuclei -t ~/nuclei-templates -u "${url}" -jsonl -severity critical,high,medium -o ${outputFile} -timeout 30 -rate-limit 50 -silent`;
    
    console.log('Running Nuclei scan...');
    
    // Execute Nuclei
    await execPromise(command, { 
      timeout: 300000, // 5 minutes max
      maxBuffer: 20 * 1024 * 1024 // 20MB buffer
    });
    
    // Read results from output file
    const output = await fs.readFile(outputFile, 'utf-8');
    
    // Clean up temp file
    await fs.unlink(outputFile).catch(() => {});
    
    // Parse JSON Lines output
    const lines = output.trim().split('\n').filter(Boolean);
    
    lines.forEach(line => {
      try {
        const result = JSON.parse(line);
        
        // Extract relevant information
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
          remediation: result.info.remediation || generateRemediation(result.info.name)
        });
        
      } catch (e) {
        console.error('Failed to parse Nuclei result:', e.message);
      }
    });
    
    console.log(`Nuclei found ${findings.length} issues`);
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
    
    // Check if templates are missing
    if (error.message.includes('no templates')) {
      return {
        findings: [],
        error: 'Nuclei templates not found. Run: nuclei -update-templates'
      };
    }
    
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
  const lowerName = vulnerabilityName.toLowerCase();
  
  if (lowerName.includes('xss') || lowerName.includes('cross-site scripting')) {
    return 'Implement proper input validation and output encoding. Use Content Security Policy (CSP) headers.';
  }
  
  if (lowerName.includes('sql injection')) {
    return 'Use parameterized queries or prepared statements. Never concatenate user input into SQL queries.';
  }
  
  if (lowerName.includes('path traversal') || lowerName.includes('directory traversal')) {
    return 'Validate and sanitize file paths. Use whitelist of allowed paths. Avoid using user input in file operations.';
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
    const { stdout: templates } = await execPromise('ls ~/nuclei-templates/ | wc -l');
    
    return {
      installed: true,
      version: version.trim(),
      templateCount: parseInt(templates.trim()) || 0
    };
  } catch (error) {
    return {
      installed: false,
      error: 'Nuclei is not installed or not in PATH'
    };
  }
}

module.exports = { 
  scanWithNuclei,
  checkNucleiInstallation 
};
