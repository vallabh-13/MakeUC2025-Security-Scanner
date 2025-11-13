// services/softwareDetector.js

const axios = require("axios");
const cheerio = require("cheerio");

// ----------------------
// MAIN DETECTION LOGIC
// ----------------------
async function detectSoftware(url) {
  const detected = {
    webServer: null,
    backend: [],
    cms: null,
    frameworks: [],
    libraries: [],
    technologies: [],
    vulnerableComponents: []
  };

  try {
    const response = await axios.get(url, {
      maxRedirects: 5,
      timeout: 10000,
      validateStatus: () => true
    });

    const headers = response.headers;
    const html = response.data; // Move this up so it's available for inferServerFromContext
    const $ = cheerio.load(html);

    // ----------------------
    // HEADER-BASED DETECTION
    // ----------------------

    if (headers["server"]) {
      detected.webServer = parseServerHeader(headers["server"]);
    } else {
      // Try to infer server from other indicators
      detected.webServer = inferServerFromContext(headers, html);
    }

    if (headers["x-powered-by"]) {
      detected.backend.push(headers["x-powered-by"]);
    }

    if (headers["x-generator"]) {
      detected.cms = headers["x-generator"];
    }

    Object.keys(headers).forEach(header => {
      const h = header.toLowerCase();
      if (h.includes("x-drupal")) detected.cms = "Drupal";
      if (h.includes("x-wordpress")) detected.cms = "WordPress";
    });

    // ----------------------
    // HTML CONTENT SCANNING
    // ----------------------

    // Script tag analysis
    $("script[src]").each((_, el) => {
      const src = $(el).attr("src");

      if (!src) return;

      // jQuery detection
      if (/jquery/i.test(src)) {
        const match = src.match(/jquery[\.\-]([0-9\.]+)/i);
        const version = match ? match[1] : "unknown";
        detected.libraries.push({ name: "jQuery", version });

        if (version !== "unknown" && isVulnerableJQuery(version)) {
          detected.vulnerableComponents.push({
            component: "jQuery",
            version,
            issue: "Version is known vulnerable (<3.5)"
          });
        }
      }

      // React detection
      if (/react/i.test(src)) detected.frameworks.push("React");

      // Angular detection
      if (/angular/i.test(src)) detected.frameworks.push("Angular");

      // Vue detection
      if (/vue/i.test(src)) detected.frameworks.push("Vue.js");
    });

    // WordPress detection
    if (/wp-content|wp-includes/i.test(html)) {
      detected.cms = "WordPress";

      const versionMatch = html.match(/ver=([0-9\.]+)/i);
      if (versionMatch) {
        const version = versionMatch[1];
        if (isVulnerableWordPress(version)) {
          detected.vulnerableComponents.push({
            component: "WordPress",
            version,
            issue: "Outdated WordPress (<6.0)"
          });
        }
      }
    }

  } catch (err) {
    console.error("Software detection failed:", err.message);
  }

  return detected;
}

// ----------------------
// HELPER FUNCTIONS
// ----------------------

function parseServerHeader(serverHeader) {
  const match = serverHeader.match(/^([^\/]+)\/?([\d\.]+)?/);

  return {
    name: match ? match[1].toLowerCase() : serverHeader.toLowerCase(),
    version: match && match[2] ? match[2] : "unknown",
    raw: serverHeader
  };
}

function isVulnerableWordPress(version) {
  const n = parseFloat(version);
  return n < 6.0;
}

function isVulnerableJQuery(version) {
  const n = parseFloat(version);
  return n < 3.5;
}

/**
 * Infer web server from context clues when Server header is missing
 * @param {Object} headers - Response headers
 * @param {string} html - HTML content
 * @returns {Object} - Inferred server info
 */
function inferServerFromContext(headers, html) {
  // Check for common cloud platform indicators
  if (headers["x-amz-request-id"] || headers["x-amzn-requestid"]) {
    return {
      name: "Amazon CloudFront/ALB",
      version: "unknown",
      raw: "Inferred from AWS headers"
    };
  }

  if (headers["cf-ray"] || headers["cf-cache-status"]) {
    return {
      name: "Cloudflare",
      version: "unknown",
      raw: "Inferred from Cloudflare headers"
    };
  }

  if (headers["x-azure-ref"]) {
    return {
      name: "Microsoft Azure",
      version: "unknown",
      raw: "Inferred from Azure headers"
    };
  }

  if (headers["x-goog-generation"]) {
    return {
      name: "Google Cloud",
      version: "unknown",
      raw: "Inferred from GCP headers"
    };
  }

  if (headers["x-vercel-id"] || headers["x-vercel-cache"]) {
    return {
      name: "Vercel",
      version: "unknown",
      raw: "Inferred from Vercel headers"
    };
  }

  if (headers["x-netlify-id"]) {
    return {
      name: "Netlify",
      version: "unknown",
      raw: "Inferred from Netlify headers"
    };
  }

  // Check powered-by for server info
  if (headers["x-powered-by"]) {
    const poweredBy = headers["x-powered-by"].toLowerCase();
    if (poweredBy.includes("express")) {
      return { name: "Node.js/Express", version: "unknown", raw: headers["x-powered-by"] };
    }
    if (poweredBy.includes("php")) {
      return { name: "PHP", version: poweredBy.match(/[\d\.]+/)?.[0] || "unknown", raw: headers["x-powered-by"] };
    }
    if (poweredBy.includes("asp.net")) {
      return { name: "IIS/ASP.NET", version: "unknown", raw: headers["x-powered-by"] };
    }
  }

  // Default fallback
  return {
    name: "Web Server",
    version: "hidden",
    raw: "Server header not disclosed (security best practice)"
  };
}

module.exports = { detectSoftware };