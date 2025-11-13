const { exec } = require('child_process');
const util = require('util');
const xml2js = require('xml2js');
const net = require('net');
const execPromise = util.promisify(exec);

/**
 * Scan ports and detect services using Nmap
 * @param {string} hostname - Target hostname to scan
 * @returns {Object} - Scan results with findings and detected services
 */
async function scanPorts(hostname) {
  try {
    // Nmap command (non-privileged mode):
    // -sT: TCP connect scan (doesn't require root/raw sockets)
    // -Pn: Skip host discovery (no ping, avoids raw socket requirement)
    // -T4: Faster timing (aggressive)
    // --top-ports 100: Scan the most common 100 ports (reduced for speed)
    // -oX -: Output XML to stdout
    // Note: -sV removed as it requires elevated privileges on most systems
    const command = `nmap -sT -Pn -T4 --top-ports 100 ${hostname} -oX -`;

    console.log('Running Nmap scan (non-privileged mode)...');
    const { stdout } = await execPromise(command, {
      timeout: 180000 // 3 minutes timeout
    });

    return await parseNmapXML(stdout);

  } catch (error) {
    console.error('Nmap scan failed:', error.message);

    // Fallback: Return minimal findings based on common web ports
    console.log('Falling back to basic port check...');
    return fallbackPortCheck(hostname);
  }
}

/**
 * Fallback port checking when Nmap fails
 * Tests common web service ports using simple TCP connections
 * @param {string} hostname - Target hostname
 * @returns {Object} - Basic scan results
 */
async function fallbackPortCheck(hostname) {
  const findings = [];
  const detectedServices = [];

  console.log('Nmap unavailable - performing basic TCP port checks...');

  // Common ports to check
  const commonPorts = [
    { port: 80, service: 'http', name: 'HTTP' },
    { port: 443, service: 'https', name: 'HTTPS' },
    { port: 8080, service: 'http-alt', name: 'HTTP Alternative' },
    { port: 8443, service: 'https-alt', name: 'HTTPS Alternative' },
    { port: 22, service: 'ssh', name: 'SSH' },
    { port: 21, service: 'ftp', name: 'FTP' },
    { port: 3306, service: 'mysql', name: 'MySQL' },
    { port: 5432, service: 'postgresql', name: 'PostgreSQL' },
    { port: 3389, service: 'rdp', name: 'RDP' },
    { port: 6379, service: 'redis', name: 'Redis' }
  ];

  // Test each port
  const portTests = commonPorts.map(portInfo => testPort(hostname, portInfo.port, portInfo.service, portInfo.name));
  const results = await Promise.all(portTests);

  // Process results
  results.forEach(result => {
    if (result.open) {
      detectedServices.push({
        port: result.port,
        protocol: 'tcp',
        service: result.service,
        product: result.name,
        version: 'unknown'
      });

      // Check for dangerous ports
      const dangerousPorts = [21, 22, 23, 3306, 5432, 3389, 6379];
      if (dangerousPorts.includes(result.port)) {
        const severity = [23, 3389, 6379].includes(result.port) ? 'critical' : 'high';
        findings.push({
          severity: severity,
          title: `Exposed ${result.name} on Port ${result.port}`,
          description: `${result.name} service is exposed to the internet, which may pose security risks.`,
          port: result.port,
          service: result.service,
          cwe: 'CWE-16',
          owasp: 'A05:2021 - Security Misconfiguration',
          recommendation: `Restrict port ${result.port} access using firewall rules. Only allow connections from trusted IP addresses or VPN.`
        });
      }
    }
  });

  // Add info about scan method
  findings.push({
    severity: 'info',
    title: 'Basic Port Scan Performed',
    description: `Scanned ${commonPorts.length} common ports using TCP connection test. Found ${detectedServices.length} open port(s).`,
    recommendation: 'This is a basic scan. For comprehensive vulnerability assessment, use nmap with appropriate privileges.'
  });

  console.log(`Basic port scan complete: ${detectedServices.length} open ports found`);
  return { findings, detectedServices };
}

/**
 * Test if a specific port is open using TCP connection
 * @param {string} hostname - Target hostname
 * @param {number} port - Port number to test
 * @param {string} service - Service name
 * @param {string} name - Human readable name
 * @returns {Promise<Object>} - Test result
 */
function testPort(hostname, port, service, name) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const timeout = 3000; // 3 second timeout

    socket.setTimeout(timeout);

    socket.on('connect', () => {
      socket.destroy();
      resolve({ open: true, port, service, name });
    });

    socket.on('timeout', () => {
      socket.destroy();
      resolve({ open: false, port, service, name });
    });

    socket.on('error', () => {
      socket.destroy();
      resolve({ open: false, port, service, name });
    });

    socket.connect(port, hostname);
  });
}

/**
 * Parse Nmap XML output and extract findings
 * @param {string} xmlOutput - Raw XML output from Nmap
 * @returns {Object} - Parsed findings and detected services
 */
async function parseNmapXML(xmlOutput) {
  const findings = [];
  const detectedServices = [];
  
  try {
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(xmlOutput);
    
    const hosts = result.nmaprun?.host || [];
    
    hosts.forEach(host => {
      const ports = host.ports?.[0]?.port || [];
      
      ports.forEach(port => {
        const state = port.state?.[0]?.$?.state;
        const portId = port.$?.portid;
        const protocol = port.$?.protocol;
        
        if (state === 'open') {
          const service = port.service?.[0];
          const serviceName = service?.$?.name || 'unknown';
          const product = service?.$?.product;
          const version = service?.$?.version;
          
          // Store detected service
          if (product) {
            detectedServices.push({
              port: portId,
              protocol: protocol,
              service: serviceName,
              product: product,
              version: version || 'unknown'
            });
          }
          
          // Check for dangerous exposed ports
          const dangerousPorts = {
            21: { 
              name: 'FTP', 
              risk: 'Unencrypted file transfer protocol exposed to internet' 
            },
            22: { 
              name: 'SSH', 
              risk: 'SSH exposed (ensure strong authentication is configured)' 
            },
            23: { 
              name: 'Telnet', 
              risk: 'Unencrypted remote access - extremely dangerous' 
            },
            25: { 
              name: 'SMTP', 
              risk: 'Mail server exposed - potential spam relay' 
            },
            3389: { 
              name: 'RDP', 
              risk: 'Remote Desktop Protocol exposed - high brute-force risk' 
            },
            3306: { 
              name: 'MySQL', 
              risk: 'MySQL database server exposed to internet' 
            },
            5432: { 
              name: 'PostgreSQL', 
              risk: 'PostgreSQL database server exposed to internet' 
            },
            27017: { 
              name: 'MongoDB', 
              risk: 'MongoDB database server exposed to internet' 
            },
            6379: { 
              name: 'Redis', 
              risk: 'Redis cache database exposed - often has no authentication' 
            },
            9200: { 
              name: 'Elasticsearch', 
              risk: 'Elasticsearch search engine exposed to internet' 
            },
            5984: { 
              name: 'CouchDB', 
              risk: 'CouchDB database exposed to internet' 
            },
            8080: { 
              name: 'HTTP Alt', 
              risk: 'Alternative HTTP port - may expose admin panels' 
            },
            8443: { 
              name: 'HTTPS Alt', 
              risk: 'Alternative HTTPS port - verify purpose' 
            }
          };
          
          if (dangerousPorts[portId]) {
            const severity = ['23', '3389', '6379'].includes(portId) ? 'critical' : 'high';
            
            findings.push({
              severity: severity,
              title: `Exposed ${dangerousPorts[portId].name} on Port ${portId}`,
              description: dangerousPorts[portId].risk,
              details: product ? `Running: ${product} ${version || ''}` : null,
              port: portId,
              service: serviceName,
              cwe: 'CWE-16',
              owasp: 'A05:2021 - Security Misconfiguration',
              recommendation: `Restrict port ${portId} access using firewall rules. Only allow connections from trusted IP addresses or VPN.`
            });
          }
          
          // Check for outdated service versions
          if (product && version && version !== 'unknown') {
            const vulnCheck = checkServiceVulnerability(product, version, portId);
            if (vulnCheck) {
              findings.push(vulnCheck);
            }
          }
        }
      });
    });
    
    console.log(`Nmap detected ${detectedServices.length} services, ${findings.length} issues`);
    return { findings, detectedServices };
    
  } catch (error) {
    console.error('Failed to parse Nmap XML:', error);
    return { findings: [], detectedServices: [] };
  }
}

/**
 * Check if a service version has known vulnerabilities
 * @param {string} product - Service product name
 * @param {string} version - Service version
 * @param {string} port - Port number
 * @returns {Object|null} - Vulnerability finding or null
 */
function checkServiceVulnerability(product, version, port) {
  // Known vulnerable versions (simplified checks)
  const vulnerableVersions = {
    'Apache httpd': {
      maxSafe: '2.4.51',
      cve: 'CVE-2021-44790',
      description: 'Apache versions below 2.4.51 have known buffer overflow vulnerabilities',
      recommendation: 'Update Apache to version 2.4.51 or later immediately'
    },
    'nginx': {
      maxSafe: '1.20.1',
      cve: 'CVE-2021-23017',
      description: 'Nginx versions below 1.20.1 have DNS resolver vulnerabilities',
      recommendation: 'Update nginx to version 1.20.1 or later'
    },
    'OpenSSH': {
      maxSafe: '8.0',
      cve: 'CVE-2019-6111',
      description: 'OpenSSH versions below 8.0 have known vulnerabilities',
      recommendation: 'Update OpenSSH to version 8.0 or later'
    },
    'MySQL': {
      maxSafe: '8.0.27',
      cve: 'Multiple CVEs',
      description: 'MySQL versions below 8.0.27 have multiple security vulnerabilities',
      recommendation: 'Update MySQL to version 8.0.27 or later'
    },
    'PostgreSQL': {
      maxSafe: '13.4',
      cve: 'Multiple CVEs',
      description: 'PostgreSQL versions below 13.4 have known vulnerabilities',
      recommendation: 'Update PostgreSQL to version 13.4 or later'
    }
  };
  
  const vuln = vulnerableVersions[product];
  if (!vuln) return null;
  
  // Simple version comparison (works for most cases)
  const currentVersion = parseVersion(version);
  const safeVersion = parseVersion(vuln.maxSafe);
  
  if (currentVersion && safeVersion && currentVersion < safeVersion) {
    return {
      severity: 'medium',
      title: `Outdated ${product} ${version} on Port ${port}`,
      description: vuln.description,
      cve: vuln.cve,
      cwe: 'CWE-1104',
      owasp: 'A06:2021 - Vulnerable and Outdated Components',
      recommendation: vuln.recommendation
    };
  }
  
  return null;
}

/**
 * Parse version string to comparable number
 * @param {string} versionString - Version string (e.g., "2.4.41")
 * @returns {number|null} - Comparable version number
 */
function parseVersion(versionString) {
  try {
    const parts = versionString.split('.').map(num => parseInt(num, 10));
    if (parts.some(isNaN)) return null;
    
    // Convert to single number: 2.4.41 -> 20441
    return parts[0] * 10000 + (parts[1] || 0) * 100 + (parts[2] || 0);
  } catch (error) {
    return null;
  }
}

module.exports = { scanPorts };
