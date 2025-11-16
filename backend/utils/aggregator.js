/**
 * Aggregate scan results from multiple sources and calculate security score
 */

/**
 * Aggregate results from all scanners
 * @param {Object} sslResults - SSL Labs scan results
 * @param {Object} nmapResults - Nmap scan results
 * @param {Object} nucleiResults - Nuclei scan results
 * @param {Object} detectedSoftware - Detected software/technologies
 * @param {Array} cveFindings - CVE vulnerability findings
 * @param {string} url - The scanned URL (to check for HTTP vs HTTPS)
 * @returns {Object} - Aggregated results with score and grade
 */
function aggregateResults(sslResults, nmapResults, nucleiResults, detectedSoftware, cveFindings = [], url = '') {
  // Combine all findings from different sources
  const allFindings = [
    ...(sslResults.findings || []),
    ...(nmapResults.findings || []),
    ...(nucleiResults.findings || []),
    ...(cveFindings || [])
  ];

  // Check if site is using HTTP (not HTTPS) - this is a critical security issue
  const isHttpOnly = url && url.startsWith('http://');
  if (isHttpOnly) {
    allFindings.push({
      severity: 'critical',
      title: 'Unencrypted HTTP Connection',
      description: 'This site uses HTTP instead of HTTPS, which means all data transmitted between the browser and server is sent in plain text. Attackers can intercept and read sensitive information like passwords, credit card numbers, and personal data.',
      cwe: 'CWE-319',
      owasp: 'A02:2021 - Cryptographic Failures',
      recommendation: 'Immediately implement HTTPS with a valid SSL/TLS certificate. You can get free certificates from Let\'s Encrypt (https://letsencrypt.org/). This is the most critical security issue that must be fixed.'
    });
  }
  
  // Add findings from vulnerable components detected in HTML/headers
  if (detectedSoftware && detectedSoftware.vulnerableComponents) {
    detectedSoftware.vulnerableComponents.forEach(comp => {
      allFindings.push({
        severity: 'high',
        title: `Vulnerable ${comp.component} ${comp.version}`,
        description: comp.issue,
        component: comp.component,
        componentVersion: comp.version,
        cwe: 'CWE-1104',
        owasp: 'A06:2021 - Vulnerable and Outdated Components',
        recommendation: `Update ${comp.component} to the latest secure version`
      });
    });
  }
  
  // Deduplicate findings (same title + severity = duplicate)
  const uniqueFindings = deduplicateFindings(allFindings);
  
  // Count findings by severity
  const severityCounts = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0
  };
  
  uniqueFindings.forEach(finding => {
    const severity = (finding.severity || 'info').toLowerCase();
    if (severityCounts.hasOwnProperty(severity)) {
      severityCounts[severity]++;
    } else {
      severityCounts.info++; // Default to info for unknown severity
    }
  });
  
  // Calculate security score (0-100)
  const score = calculateSecurityScore(severityCounts, uniqueFindings.length);
  
  // Assign letter grade
  const grade = getSecurityGrade(score);
  
  // Sort findings by severity (critical first, info last)
  const sortedFindings = sortFindingsBySeverity(uniqueFindings);
  
  // Build final results object
  return {
    score,
    grade,
    severityCounts,
    findings: sortedFindings,
    detectedTechnology: {
      webServer: detectedSoftware?.webServer || null,
      backend: detectedSoftware?.backend || [],
      cms: detectedSoftware?.cms || null,
      frameworks: detectedSoftware?.frameworks || [],
      libraries: detectedSoftware?.libraries || [],
      technologies: detectedSoftware?.technologies || [],
      services: nmapResults?.detectedServices || []
    },
    sslGrade: sslResults?.grade || 'Unknown',
    totalIssues: sortedFindings.length,
    scannedAt: new Date().toISOString(),
    scanErrors: {
      ssl: sslResults?.error || null,
      nmap: nmapResults?.error || null,
      nuclei: nucleiResults?.error || null,
      detection: detectedSoftware?.error || null
    }
  };
}

/**
 * Deduplicate findings based on title and severity
 * @param {Array} findings - Array of findings
 * @returns {Array} - Deduplicated findings
 */
function deduplicateFindings(findings) {
  const seen = new Set();
  const unique = [];
  
  findings.forEach(finding => {
    // Create unique key from title and severity
    const key = `${(finding.title || 'unknown').toLowerCase()}-${(finding.severity || 'info').toLowerCase()}`;
    
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(finding);
    }
  });
  
  return unique;
}

/**
 * Calculate security score from 0-100 based on findings
 * @param {Object} counts - Severity counts object
 * @param {number} total - Total number of findings
 * @returns {number} - Security score (0-100)
 */
function calculateSecurityScore(counts, total) {
  // Check if we have any real issues (excluding INFO findings)
  const realIssuesCount = (counts.critical || 0) + (counts.high || 0) + (counts.medium || 0) + (counts.low || 0);

  // If no real issues, return perfect score even if INFO findings exist
  if (realIssuesCount === 0) return 100;

  // Balanced weight system - reasonable scoring that reflects actual security posture
  // INFO findings do NOT affect the score (weight = 0)
  const weights = {
    critical: 12,  // Critical issues are serious but not devastating (e.g., no HTTPS)
    high: 5,       // High severity - meaningful but balanced
    medium: 2,     // Medium severity - noticeable but moderate impact
    low: 0.5,      // Low severity - minimal impact on score
    info: 0        // INFO findings are informational only - do NOT affect score
  };

  // Calculate total deductions (INFO findings excluded by 0 weight)
  const deductions =
    (counts.critical || 0) * weights.critical +
    (counts.high || 0) * weights.high +
    (counts.medium || 0) * weights.medium +
    (counts.low || 0) * weights.low +
    (counts.info || 0) * weights.info;

  // Calculate score (never below 0)
  const score = Math.max(0, 100 - deductions);

  return Math.round(score);
}

/**
 * Convert numeric score to letter grade
 * @param {number} score - Numeric score (0-100)
 * @returns {string} - Letter grade (A-F)
 */
function getSecurityGrade(score) {
  // More balanced grading scale that reflects real-world security posture
  if (score >= 85) return 'A';  // Excellent security - minor issues only
  if (score >= 70) return 'B';  // Good security - some issues to address
  if (score >= 55) return 'C';  // Fair security - moderate concerns
  if (score >= 40) return 'D';  // Poor security - significant issues
  return 'F';                   // Critical security failures
}

/**
 * Sort findings by severity (critical first)
 * @param {Array} findings - Array of findings
 * @returns {Array} - Sorted findings
 */
function sortFindingsBySeverity(findings) {
  const severityOrder = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
    info: 4
  };
  
  return findings.sort((a, b) => {
    const severityA = (a.severity || 'info').toLowerCase();
    const severityB = (b.severity || 'info').toLowerCase();
    
    const orderA = severityOrder[severityA] !== undefined ? severityOrder[severityA] : 5;
    const orderB = severityOrder[severityB] !== undefined ? severityOrder[severityB] : 5;
    
    return orderA - orderB;
  });
}

/**
 * Get statistics summary from aggregated results
 * @param {Object} results - Aggregated results
 * @returns {Object} - Statistics summary
 */
function getStatisticsSummary(results) {
  return {
    totalFindings: results.totalIssues,
    criticalCount: results.severityCounts.critical,
    highCount: results.severityCounts.high,
    mediumCount: results.severityCounts.medium,
    lowCount: results.severityCounts.low,
    infoCount: results.severityCounts.info,
    score: results.score,
    grade: results.grade,
    hasErrors: !!(
      results.scanErrors.ssl || 
      results.scanErrors.nmap || 
      results.scanErrors.nuclei || 
      results.scanErrors.detection
    )
  };
}

module.exports = { 
  aggregateResults,
  calculateSecurityScore,
  getSecurityGrade,
  getStatisticsSummary
};
