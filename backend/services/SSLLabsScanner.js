const axios = require('axios');

async function scanSSL(hostname) {
  const API_URL = 'https://api.ssllabs.com/api/v3/';
  
  try {
    const startResponse = await axios.get(`${API_URL}analyze`, {
      params: {
        host: hostname,
        startNew: 'on',
        all: 'done'
      }
    });
    
    let status = startResponse.data.status;
    let attempts = 0;
    const maxAttempts = 60;
    
    while (status !== 'READY' && status !== 'ERROR' && attempts < maxAttempts) {
      await sleep(5000);
      const checkResponse = await axios.get(`${API_URL}analyze`, {
        params: { host: hostname, all: 'done' }
      });
      status = checkResponse.data.status;
      attempts++;
      
      if (status === 'READY') {
        return parseSSLResults(checkResponse.data);
      }
    }
    
    throw new Error('SSL scan timeout');
  } catch (error) {
    return { error: error.message, findings: [] };
  }
}

function parseSSLResults(data) {
  const findings = [];
  const endpoints = data.endpoints || [];
  
  endpoints.forEach(endpoint => {
    const grade = endpoint.grade;
    
    if (grade && ['A+', 'A', 'A-'].indexOf(grade) === -1) {
      findings.push({
        severity: 'high',
        title: `Weak SSL/TLS Configuration (Grade: ${grade})`,
        description: 'SSL/TLS configuration could be improved',
        cwe: 'CWE-326',
        owasp: 'A02:2021 - Cryptographic Failures',
        recommendation: 'Improve SSL/TLS configuration by enabling strong cipher suites, implementing HSTS, and ensuring proper certificate chain validation. Consider using modern TLS protocols only.'
      });
    }
    
    if (endpoint.details) {
      const protocols = endpoint.details.protocols || [];
      protocols.forEach(proto => {
        if (proto.name === 'TLS' && parseFloat(proto.version) < 1.2) {
          findings.push({
            severity: 'critical',
            title: `Outdated TLS Version: ${proto.version}`,
            description: 'TLS versions below 1.2 are insecure',
            cwe: 'CWE-327',
            owasp: 'A02:2021 - Cryptographic Failures',
            recommendation: 'Disable TLS 1.0 and 1.1. Configure your server to only support TLS 1.2 and TLS 1.3. Update server software to the latest version that supports modern TLS protocols.'
          });
        }
      });
    }
  });
  
  return { findings, grade: endpoints[0]?.grade || 'Unknown' };
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = { scanSSL };
