const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

// NVD API Configuration
const NVD_API_BASE = 'https://services.nvd.nist.gov/rest/json/cves/2.0';
const CACHE_DIR = path.join(__dirname, '../cache');
const CACHE_FILE = path.join(CACHE_DIR, 'cve-cache.json');

// In-memory cache for CVE data
let cveCache = new Map();

/**
 * Initialize CVE cache from disk
 */
async function initCache() {
  try {
    // Create cache directory if it doesn't exist
    await fs.mkdir(CACHE_DIR, { recursive: true });
    
    // Load existing cache
    try {
      const cacheData = await fs.readFile(CACHE_FILE, 'utf-8');
      const cached = JSON.parse(cacheData);
      cveCache = new Map(Object.entries(cached));
      console.log(`✓ Loaded ${cveCache.size} CVEs from cache`);
    } catch (error) {
      console.log('No existing CVE cache found, starting fresh');
    }
  } catch (error) {
    console.error('Failed to initialize CVE cache:', error);
  }
}

/**
 * Search for CVEs related to a specific product and version
 * @param {string} product - Software product name
 * @param {string} version - Software version
 * @returns {Array} - Array of CVE findings
 */
async function searchCVEs(product, version) {
  const cacheKey = `${product}-${version}`.toLowerCase();
  
  // Check cache first
  if (cveCache.has(cacheKey)) {
    console.log(`Cache hit for ${product} ${version}`);
    return cveCache.get(cacheKey);
  }
  
  try {
    // Query NVD API
    const keyword = `${product} ${version}`;
    const response = await axios.get(NVD_API_BASE, {
      params: {
        keywordSearch: keyword,
        resultsPerPage: 20
      },
      timeout: 15000,
      headers: {
        'User-Agent': 'SecurityScanner/1.0',
        ...(process.env.NVD_API_KEY && {
          'apiKey': process.env.NVD_API_KEY
        })
      }
    });
    
    const vulnerabilities = response.data.vulnerabilities || [];
    const findings = [];
    
    vulnerabilities.forEach(vuln => {
      const cve = vuln.cve;
      const cveId = cve.id;
      
      // Extract CVSS score (prefer v3.1, fallback to v2)
      const cvssData = cve.metrics?.cvssMetricV31?.[0] || 
                       cve.metrics?.cvssMetricV2?.[0];
      const cvssScore = cvssData?.cvssData?.baseScore || 'N/A';
      const severity = cvssData?.cvssData?.baseSeverity || 
                      mapCvssScoreToSeverity(cvssScore);
      
      // Extract description
      const description = cve.descriptions?.find(d => d.lang === 'en')?.value || 
                         'No description available';
      
      // Extract CWE IDs
      const weaknesses = cve.weaknesses?.[0]?.description || [];
      const cweIds = weaknesses
        .filter(w => w.lang === 'en')
        .map(w => w.value)
        .join(', ');
      
      findings.push({
        cveId,
        severity: severity.toLowerCase(),
        cvssScore,
        description: truncateDescription(description, 200),
        cwe: cweIds || 'N/A',
        publishedDate: cve.published,
        lastModifiedDate: cve.lastModified,
        references: cve.references?.slice(0, 3).map(ref => ref.url) || []
      });
    });
    
    // Cache the results
    cveCache.set(cacheKey, findings);
    await saveCacheToFile();
    
    // Rate limiting: NVD allows 5 requests per 30 seconds without API key
    // Wait 6 seconds between requests to be safe
    await sleep(6000);
    
    return findings;
    
  } catch (error) {
    console.error(`CVE search failed for ${product}:`, error.message);
    
    // Handle rate limiting
    if (error.response?.status === 403 || error.response?.status === 429) {
      console.log('NVD rate limit reached, using cached data only');
    }
    
    return [];
  }
}

/**
 * Check vulnerabilities for all detected software components
 * @param {Object} detectedSoftware - Object containing detected software
 * @returns {Array} - Array of vulnerability findings
 */
async function checkVulnerabilities(detectedSoftware) {
  const findings = [];
  const componentsToCheck = [];
  
  // Collect web server
  if (detectedSoftware.webServer && 
      detectedSoftware.webServer.version !== 'unknown') {
    componentsToCheck.push({
      name: detectedSoftware.webServer.name,
      version: detectedSoftware.webServer.version,
      type: 'Web Server'
    });
  }
  
  // Collect backend languages/frameworks
  detectedSoftware.backend?.forEach(backend => {
    if (backend.version && backend.version !== 'unknown') {
      componentsToCheck.push({
        name: backend.name,
        version: backend.version,
        type: 'Backend'
      });
    }
  });
  
  // Collect JavaScript libraries
  detectedSoftware.libraries?.forEach(lib => {
    if (lib.version && lib.version !== 'unknown') {
      componentsToCheck.push({
        name: lib.name,
        version: lib.version,
        type: 'Library'
      });
    }
  });
  
  // Collect CMS
  if (detectedSoftware.cms?.version && 
      detectedSoftware.cms.version !== 'unknown') {
    componentsToCheck.push({
      name: detectedSoftware.cms.name || detectedSoftware.cms,
      version: detectedSoftware.cms.version,
      type: 'CMS'
    });
  }
  
  // Check each component for CVEs
  for (const component of componentsToCheck) {
    console.log(`Checking CVEs for ${component.name} ${component.version}...`);
    
    const cves = await searchCVEs(component.name, component.version);
    
    cves.forEach(cve => {
      findings.push({
        severity: cve.severity,
        title: `${cve.cveId}: ${component.name} ${component.version}`,
        description: cve.description,
        component: component.name,
        componentVersion: component.version,
        componentType: component.type,
        cve: cve.cveId,
        cvss: cve.cvssScore,
        cwe: cve.cwe,
        publishedDate: cve.publishedDate,
        lastModifiedDate: cve.lastModifiedDate,
        references: cve.references,
        owasp: 'A06:2021 - Vulnerable and Outdated Components',
        recommendation: `Update ${component.name} to the latest patched version to resolve ${cve.cveId}`
      });
    });
  }
  
  console.log(`Found ${findings.length} CVE matches`);
  return findings;
}

/**
 * Compare two version strings (e.g., "2.4.51" vs "2.4.9").
 * @param {string} v1 - First version string.
 * @param {string} v2 - Second version string.
 * @returns {number} - -1 if v1 < v2, 1 if v1 > v2, 0 if v1 === v2.
 */
function compareVersions(v1, v2) {
  const parts1 = v1.split('.').map(part => parseInt(part, 10)).filter(part => !isNaN(part));
  const parts2 = v2.split('.').map(part => parseInt(part, 10)).filter(part => !isNaN(part));
  const len = Math.max(parts1.length, parts2.length);

  for (let i = 0; i < len; i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    if (p1 < p2) return -1;
    if (p1 > p2) return 1;
  }
  return 0;
}

/**
 * Quick vulnerability check using local knowledge base
 * @param {string} name - Software name
 * @param {string} version - Software version
 * @returns {Object|null} - Vulnerability finding or null
 */
function quickVulnerabilityCheck(name, version) {
  const knownVulnerable = {
    'jquery': {
      vulnerable: ['1.6.0', '1.6.1', '1.6.2', '1.11.3', '1.12.4', '2.1.4', '2.2.4', '3.0.0', '3.4.1'],
      safe: '3.5.0',
      cves: ['CVE-2020-11022', 'CVE-2020-11023'],
      description: 'jQuery XSS vulnerabilities in HTML parsing'
    },
    'wordpress': {
      vulnerable: (v) => compareVersions(v, '6.4') < 0,
      safe: '6.4.0',
      cves: ['CVE-2023-38000', 'CVE-2023-39999'],
      description: 'Multiple WordPress core vulnerabilities'
    },
    'apache': {
      vulnerable: (v) => compareVersions(v, '2.4.51') < 0,
      safe: '2.4.51',
      cves: ['CVE-2021-44790', 'CVE-2021-41773'],
      description: 'Apache HTTP Server buffer overflow and path traversal'
    },
    'nginx': {
      vulnerable: (v) => compareVersions(v, '1.20.1') < 0,
      safe: '1.20.1',
      cves: ['CVE-2021-23017'],
      description: 'Nginx DNS resolver off-by-one heap write'
    },
    'php': {
      vulnerable: (v) => compareVersions(v, '8.0') < 0,
      safe: '8.1.0',
      cves: ['Multiple CVEs in PHP < 8.0'],
      description: 'PHP versions below 8.0 have numerous security issues'
    },
    'openssl': {
      vulnerable: (v) => compareVersions(v, '1.1.1') < 0,
      safe: '1.1.1',
      cves: ['CVE-2022-0778', 'CVE-2014-0160 (Heartbleed)'],
      description: 'OpenSSL cryptographic vulnerabilities'
    },
    'drupal': {
      vulnerable: (v) => compareVersions(v, '9.4') < 0,
      safe: '9.4.0',
      cves: ['CVE-2022-25277'],
      description: 'Drupal core access bypass vulnerabilities'
    },
    'joomla': {
      vulnerable: (v) => compareVersions(v, '4.2') < 0,
      safe: '4.2.0',
      cves: ['Multiple CVEs'],
      description: 'Joomla CMS security vulnerabilities'
    }
  };
  
  const lowerName = name.toLowerCase();
  const vuln = knownVulnerable[lowerName];
  
  if (!vuln) return null;
  
  let isVulnerable = false;
  
  if (typeof vuln.vulnerable === 'function') {
    isVulnerable = vuln.vulnerable(version);
  } else if (Array.isArray(vuln.vulnerable)) {
    isVulnerable = vuln.vulnerable.includes(version);
  }
  
  if (isVulnerable) {
    return {
      severity: 'high',
      title: `Vulnerable ${name} ${version}`,
      description: `${vuln.description} - ${name} version ${version} has known security vulnerabilities`,
      component: name,
      componentVersion: version,
      cve: vuln.cves.join(', '),
      recommendation: `Update ${name} to version ${vuln.safe} or later immediately`,
      owasp: 'A06:2021 - Vulnerable and Outdated Components',
      cwe: 'CWE-1104'
    };
  }
  
  return null;
}

/**
 * Save CVE cache to disk
 */
async function saveCacheToFile() {
  try {
    const cacheObj = Object.fromEntries(cveCache);
    await fs.writeFile(CACHE_FILE, JSON.stringify(cacheObj, null, 2));
  } catch (error) {
    console.error('Failed to save CVE cache:', error);
  }
}

/**
 * Map CVSS score to severity level
 * @param {number|string} score - CVSS score
 * @returns {string} - Severity level
 */
function mapCvssScoreToSeverity(score) {
  const numScore = parseFloat(score);
  if (isNaN(numScore)) return 'UNKNOWN';
  
  if (numScore >= 9.0) return 'CRITICAL';
  if (numScore >= 7.0) return 'HIGH';
  if (numScore >= 4.0) return 'MEDIUM';
  if (numScore > 0) return 'LOW';
  return 'INFO';
}

/**
 * Truncate description to specified length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} - Truncated text
 */
function truncateDescription(text, maxLength) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Sleep utility function
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} - Promise that resolves after delay
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Initialize cache on module load
initCache();

module.exports = { 
  searchCVEs, 
  checkVulnerabilities, 
  quickVulnerabilityCheck,
  initCache 
};
