const { URL } = require('url');
const dns = require('dns').promises;
const logger = require('../utils/logger'); // Import logger

async function validateURL(urlString) {
  try {
    logger.info(`Validating URL: ${urlString}`);
    const url = new URL(urlString);
    
    if (!['http:', 'https:'].includes(url.protocol)) {
      logger.warn(`Invalid protocol for ${urlString}: ${url.protocol}`);
      return { valid: false, error: 'Only HTTP/HTTPS protocols allowed' };
    }
    
    const hostname = url.hostname;
    logger.info(`Extracted hostname: ${hostname}`);
    
    // Prevent SSRF attacks
    if (hostname === 'localhost' || 
        hostname.startsWith('127.') || 
        hostname.startsWith('192.168.') ||
        hostname.startsWith('10.') ||
        hostname.startsWith('172.16.') ||
        hostname.startsWith('172.17.') ||
        hostname.startsWith('172.18.') ||
        hostname.startsWith('172.19.') ||
        hostname.startsWith('172.20.') ||
        hostname.startsWith('172.21.') ||
        hostname.startsWith('172.22.') ||
        hostname.startsWith('172.23.') ||
        hostname.startsWith('172.24.') ||
        hostname.startsWith('172.25.') ||
        hostname.startsWith('172.26.') ||
        hostname.startsWith('172.27.') ||
        hostname.startsWith('172.28.') ||
        hostname.startsWith('172.29.') ||
        hostname.startsWith('172.30.') ||
        hostname.startsWith('172.31.')) {
      logger.warn(`Blocked private/local address: ${hostname}`);
      return { valid: false, error: 'Private/local addresses not allowed' };
    }
    
    logger.info(`Attempting DNS resolution for hostname: ${hostname}`);
    await dns.resolve(hostname);
    logger.info(`DNS resolution successful for hostname: ${hostname}`);
    
    return { valid: true, url: url.href, hostname: url.hostname };
  } catch (error) {
    logger.error(`URL validation failed for ${urlString}: ${error.message}`);
    return { valid: false, error: error.message };
  }
}

module.exports = { validateURL };
