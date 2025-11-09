// services/trivyScanner.js

const { exec } = require('child_process');
const util = require('util');
const axios = require('axios');
const execPromise = util.promisify(exec);

async function scanWithTrivy(hostname, detectedSoftware) {
  const findings = [];
  
  // Option 1: If we detected they're using a public Docker image
  if (detectedSoftware.dockerImage) {
    try {
      const command = `trivy image ${detectedSoftware.dockerImage} --format json`;
      const { stdout } = await execPromise(command);
      const results = JSON.parse(stdout);
      
      // Parse Trivy results
      results.Results?.forEach(result => {
        result.Vulnerabilities?.forEach(vuln => {
          findings.push({
            severity: vuln.Severity.toLowerCase(),
            title: `${vuln.VulnerabilityID}: ${vuln.PkgName}`,
            description: vuln.Description,
            cwe: vuln.CweIDs?.join(', ') || 'N/A',
            cvss: vuln.CVSS,
            fixedVersion: vuln.FixedVersion
          });
        });
      });
    } catch (error) {
      console.error('Trivy scan failed:', error);
    }
  }
  
  // Option 2: Check detected software versions against vulnerability DB
  if (detectedSoftware.webServer) {
    const vulns = await checkSoftwareVulnerabilities(
      detectedSoftware.webServer.name,
      detectedSoftware.webServer.version
    );
    findings.push(...vulns);
  }
  
  return { findings };
}

// Check if detected software has known vulnerabilities
async function checkSoftwareVulnerabilities(software, version) {
  const findings = [];
  
  // Use Trivy's vulnerability database (or NVD API)
  // Example: Check if Apache 2.4.29 has CVEs
  
  try {
    // Trivy DB query or NVD API
    // This is a simplified example
    const vulnDB = {
      'apache': {
        '2.4.29': ['CVE-2021-44790', 'CVE-2021-44224'],
        '2.4.49': ['CVE-2021-41773']
      },
      'nginx': {
        '1.18.0': ['CVE-2021-23017']
      }
    };
    
    const cves = vulnDB[software.toLowerCase()]?.[version] || [];
    
    for (const cve of cves) {
      // Fetch CVE details from NVD
      const details = await fetchCVEDetails(cve);
      findings.push({
        severity: details.severity,
        title: `${cve}: Vulnerability in ${software} ${version}`,
        description: details.description,
        cwe: details.cwe,
        recommendation: `Update ${software} to latest version`
      });
    }
  } catch (error) {
    console.error('Vulnerability check failed:', error);
  }
  
  return findings;
}

async function fetchCVEDetails(cveId) {
  // Use NVD API or Trivy DB
  try {
    const response = await axios.get(
      `https://services.nvd.nist.gov/rest/json/cves/2.0?cveId=${cveId}`
    );
    // Parse and return CVE details
    // This is simplified
    return {
      severity: 'high',
      description: 'Vulnerability description',
      cwe: 'CWE-79'
    };
  } catch {
    return {
      severity: 'unknown',
      description: 'Could not fetch CVE details',
      cwe: 'N/A'
    };
  }
}

module.exports = { scanWithTrivy };
```

## How This Would Work:
```
User enters: https://example.com
         ↓
1. Nmap scan detects: "Running Apache 2.4.29"
         ↓
2. Trivy check: "Does Apache 2.4.29 have known CVEs?"
         ↓
3. Query vulnerability database
         ↓
4. Report: "YES! CVE-2021-44790 affects this version"
         ↓
5. Show finding: "Apache 2.4.29 has critical vulnerability"
