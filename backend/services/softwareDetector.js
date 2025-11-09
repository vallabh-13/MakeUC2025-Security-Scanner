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

    // ----------------------
    // HEADER-BASED DETECTION
    // ----------------------

    if (headers["server"]) {
      detected.webServer = parseServerHeader(headers["server"]);
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

    const html = response.data;
    const $ = cheerio.load(html);

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

module.exports = { detectSoftware };