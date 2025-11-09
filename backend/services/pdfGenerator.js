const puppeteer = require('puppeteer');

/**
 * Generate PDF report from scan results
 * @param {Object} scanResults - Complete scan results
 * @param {string} url - Target URL that was scanned
 * @returns {Buffer} - PDF file as buffer
 */
async function generatePDF(scanResults, url) {
  let browser;
  
  try {
    // Launch headless Chrome
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu'
      ]
    });
    
    const page = await browser.newPage();
    
    // Generate HTML content
    const html = generateReportHTML(scanResults, url);
    
    // Set content with proper encoding
    await page.setContent(html, { 
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    
    // Generate PDF with options
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      },
      displayHeaderFooter: true,
      headerTemplate: '<div></div>',
      footerTemplate: `
        <div style="font-size: 10px; text-align: center; width: 100%; color: #666;">
          <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
        </div>
      `
    });
    
    await browser.close();
    
    return pdfBuffer;
    
  } catch (error) {
    if (browser) await browser.close();
    console.error('PDF generation failed:', error);
    throw new Error(`Failed to generate PDF: ${error.message}`);
  }
}

/**
 * Generate HTML report content
 * @param {Object} results - Scan results
 * @param {string} url - Target URL
 * @returns {string} - HTML content
 */
function generateReportHTML(results, url) {
  const { score, grade, severityCounts, findings, detectedTechnology, scannedAt } = results;
  
  const severityColors = {
    critical: '#dc2626',
    high: '#ea580c',
    medium: '#ca8a04',
    low: '#2563eb',
    info: '#64748b'
  };
  
  const scoreColor = score >= 80 ? '#16a34a' : score >= 60 ? '#ca8a04' : '#dc2626';
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Security Report - ${escapeHtml(url)}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background: white;
    }
    
    .header {
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      color: white;
      padding: 40px 30px;
      text-align: center;
      margin-bottom: 30px;
    }
    
    .header h1 {
      font-size: 32px;
      margin-bottom: 10px;
      font-weight: 700;
    }
    
    .header .url {
      font-size: 18px;
      opacity: 0.9;
      word-break: break-all;
      margin-top: 8px;
    }
    
    .header .date {
      font-size: 14px;
      opacity: 0.8;
      margin-top: 10px;
    }
    
    .container {
      padding: 0 30px 30px;
    }
    
    .score-section {
      background: #f9fafb;
      border-radius: 12px;
      padding: 30px;
      margin-bottom: 30px;
      text-align: center;
    }
    
    .score-circle {
      width: 200px;
      height: 200px;
      margin: 0 auto 20px;
      position: relative;
    }
    
    .score-value {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 64px;
      font-weight: bold;
      color: ${scoreColor};
    }
    
    .score-grade {
      font-size: 32px;
      font-weight: bold;
      color: ${scoreColor};
      margin-top: 10px;
    }
    
    .score-label {
      font-size: 16px;
      color: #6b7280;
      margin-bottom: 20px;
    }
    
    .severity-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 15px;
      margin-top: 30px;
    }
    
    .severity-card {
      background: white;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    
    .severity-count {
      font-size: 36px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    
    .severity-label {
      font-size: 14px;
      text-transform: uppercase;
      color: #6b7280;
      font-weight: 600;
    }
    
    .tech-section {
      background: #f9fafb;
      border-radius: 12px;
      padding: 25px;
      margin-bottom: 30px;
    }
    
    .section-title {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 20px;
      color: #111827;
      border-bottom: 3px solid #4f46e5;
      padding-bottom: 10px;
    }
    
    .tech-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
    }
    
    .tech-item {
      background: white;
      border-radius: 8px;
      padding: 15px;
      border-left: 4px solid #4f46e5;
    }
    
    .tech-label {
      font-size: 12px;
      color: #6b7280;
      text-transform: uppercase;
      margin-bottom: 5px;
      font-weight: 600;
    }
    
    .tech-value {
      font-size: 16px;
      font-weight: 600;
      color: #111827;
    }
    
    .findings-section {
      margin-top: 40px;
    }
    
    .finding {
      background: white;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      page-break-inside: avoid;
      border-left: 5px solid #e5e7eb;
    }
    
    .finding.critical {
      border-left-color: ${severityColors.critical};
    }
    
    .finding.high {
      border-left-color: ${severityColors.high};
    }
    
    .finding.medium {
      border-left-color: ${severityColors.medium};
    }
    
    .finding.low {
      border-left-color: ${severityColors.low};
    }
    
    .finding-header {
      display: flex;
      justify-content: space-between;
      align-items: start;
      margin-bottom: 15px;
    }
    
    .finding-title {
      font-size: 18px;
      font-weight: bold;
      color: #111827;
      flex: 1;
      margin-right: 15px;
    }
    
    .severity-badge {
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: bold;
      text-transform: uppercase;
      white-space: nowrap;
      color: white;
    }
    
    .severity-badge.critical {
      background-color: ${severityColors.critical};
    }
    
    .severity-badge.high {
      background-color: ${severityColors.high};
    }
    
    .severity-badge.medium {
      background-color: ${severityColors.medium};
    }
    
    .severity-badge.low {
      background-color: ${severityColors.low};
    }
    
    .severity-badge.info {
      background-color: ${severityColors.info};
    }
    
    .finding-description {
      color: #4b5563;
      margin-bottom: 15px;
      line-height: 1.7;
    }
    
    .recommendation {
      background: #f0fdf4;
      border-left: 4px solid #22c55e;
      padding: 12px 15px;
      border-radius: 6px;
      margin-bottom: 15px;
    }
    
    .recommendation-label {
      font-weight: bold;
      color: #15803d;
      margin-bottom: 5px;
      font-size: 14px;
    }
    
    .recommendation-text {
      color: #166534;
      font-size: 14px;
    }
    
    .finding-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 20px;
      font-size: 12px;
      color: #6b7280;
      padding-top: 10px;
      border-top: 1px solid #e5e7eb;
    }
    
    .finding-meta span {
      display: flex;
      align-items: center;
    }
    
    .finding-meta strong {
      color: #374151;
      margin-right: 4px;
    }
    
    .summary-box {
      background: white;
      border-radius: 12px;
      padding: 25px;
      margin-bottom: 30px;
      border: 2px solid #e5e7eb;
    }
    
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin-top: 20px;
    }
    
    .summary-item {
      text-align: center;
      padding: 15px;
      background: #f9fafb;
      border-radius: 8px;
    }
    
    .summary-number {
      font-size: 32px;
      font-weight: bold;
      color: #4f46e5;
      margin-bottom: 5px;
    }
    
    .summary-label {
      font-size: 14px;
      color: #6b7280;
    }
    
    .footer {
      margin-top: 40px;
      padding: 20px;
      text-align: center;
      color: #6b7280;
      font-size: 12px;
      border-top: 2px solid #e5e7eb;
    }
    
    .footer p {
      margin: 5px 0;
    }
    
    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🛡️ Security Scan Report</h1>
    <div class="url">${escapeHtml(url)}</div>
    <div class="date">Generated on ${new Date(scannedAt).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}</div>
  </div>
  
  <div class="container">
    <!-- Executive Summary -->
    <div class="summary-box">
      <h2 class="section-title">Executive Summary</h2>
      <div class="summary-grid">
        <div class="summary-item">
          <div class="summary-number">${score}</div>
          <div class="summary-label">Security Score</div>
        </div>
        <div class="summary-item">
          <div class="summary-number">${grade}</div>
          <div class="summary-label">Overall Grade</div>
        </div>
        <div class="summary-item">
          <div class="summary-number">${findings.length}</div>
          <div class="summary-label">Total Issues</div>
        </div>
      </div>
    </div>
    
    <!-- Score Section -->
    <div class="score-section">
      <h2 class="section-title">Security Score Breakdown</h2>
      <div class="score-circle">
        <svg width="200" height="200" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r="90" fill="none" stroke="#e5e7eb" stroke-width="20"/>
          <circle cx="100" cy="100" r="90" fill="none" stroke="${scoreColor}" stroke-width="20"
                  stroke-dasharray="${score * 5.65} 565" 
                  stroke-dashoffset="0"
                  transform="rotate(-90 100 100)"
                  stroke-linecap="round"/>
        </svg>
        <div class="score-value">${score}</div>
      </div>
      <div class="score-grade">Grade: ${grade}</div>
      <div class="score-label">out of 100</div>
      
      <div class="severity-grid">
        ${Object.entries(severityCounts).map(([severity, count]) => `
          <div class="severity-card">
            <div class="severity-count" style="color: ${severityColors[severity]}">${count}</div>
            <div class="severity-label">${severity}</div>
          </div>
        `).join('')}
      </div>
    </div>
    
    <!-- Detected Technologies -->
    ${detectedTechnology ? `
    <div class="tech-section">
      <h2 class="section-title">Detected Technologies</h2>
      <div class="tech-grid">
        ${detectedTechnology.webServer ? `
          <div class="tech-item">
            <div class="tech-label">Web Server</div>
            <div class="tech-value">${escapeHtml(detectedTechnology.webServer.name)} ${escapeHtml(detectedTechnology.webServer.version)}</div>
          </div>
        ` : ''}
        ${detectedTechnology.cms ? `
          <div class="tech-item">
            <div class="tech-label">Content Management System</div>
            <div class="tech-value">${escapeHtml(detectedTechnology.cms.name || detectedTechnology.cms)} ${detectedTechnology.cms.version || ''}</div>
          </div>
        ` : ''}
        ${detectedTechnology.backend && detectedTechnology.backend.length > 0 ? `
          <div class="tech-item">
            <div class="tech-label">Backend Technology</div>
            <div class="tech-value">${detectedTechnology.backend.map(b => `${escapeHtml(b.name)} ${escapeHtml(b.version)}`).join(', ')}</div>
          </div>
        ` : ''}
        ${detectedTechnology.frameworks && detectedTechnology.frameworks.length > 0 ? `
          <div class="tech-item">
            <div class="tech-label">Frameworks</div>
            <div class="tech-value">${detectedTechnology.frameworks.map(f => escapeHtml(f.name)).join(', ')}</div>
          </div>
        ` : ''}
        ${detectedTechnology.libraries && detectedTechnology.libraries.length > 0 ? `
          <div class="tech-item">
            <div class="tech-label">JavaScript Libraries</div>
            <div class="tech-value">${detectedTechnology.libraries.slice(0, 3).map(l => escapeHtml(l.name)).join(', ')}</div>
          </div>
        ` : ''}
        ${detectedTechnology.technologies && detectedTechnology.technologies.length > 0 ? `
          <div class="tech-item">
            <div class="tech-label">Additional Technologies</div>
            <div class="tech-value">${detectedTechnology.technologies.slice(0, 3).map(t => escapeHtml(t.name)).join(', ')}</div>
          </div>
        ` : ''}
      </div>
    </div>
    ` : ''}
    
    <!-- Security Findings -->
    <div class="findings-section">
      <h2 class="section-title">Security Findings (${findings.length} ${findings.length === 1 ? 'Issue' : 'Issues'})</h2>
      ${findings.length === 0 ? `
        <div style="text-align: center; padding: 40px; color: #16a34a;">
          <div style="font-size: 48px; margin-bottom: 10px;">✓</div>
          <div style="font-size: 20px; font-weight: bold;">No security issues found!</div>
          <div style="font-size: 14px; margin-top: 10px;">Your website appears to be secure based on our scans.</div>
        </div>
      ` : findings.map((finding, index) => `
        <div class="finding ${finding.severity}">
          <div class="finding-header">
            <div class="finding-title">${index + 1}. ${escapeHtml(finding.title)}</div>
            <span class="severity-badge ${finding.severity}">
              ${finding.severity}
            </span>
          </div>
          <div class="finding-description">${escapeHtml(finding.description)}</div>
          ${finding.recommendation ? `
            <div class="recommendation">
              <div class="recommendation-label">💡 Recommendation</div>
              <div class="recommendation-text">${escapeHtml(finding.recommendation)}</div>
            </div>
          ` : ''}
          <div class="finding-meta">
            ${finding.cve ? `<span><strong>CVE:</strong> ${escapeHtml(finding.cve)}</span>` : ''}
            ${finding.cwe ? `<span><strong>CWE:</strong> ${escapeHtml(finding.cwe)}</span>` : ''}
            ${finding.owasp ? `<span><strong>OWASP:</strong> ${escapeHtml(finding.owasp)}</span>` : ''}
            ${finding.cvss ? `<span><strong>CVSS:</strong> ${escapeHtml(finding.cvss)}</span>` : ''}
            ${finding.component ? `<span><strong>Component:</strong> ${escapeHtml(finding.component)} ${escapeHtml(finding.componentVersion || '')}</span>` : ''}
          </div>
        </div>
      `).join('')}
    </div>
  </div>
  
  <div class="footer">
    <p><strong>Security Scanner Report</strong></p>
    <p>This report was automatically generated by the Security Scanner System</p>
    <p>For questions or concerns about these findings, please contact your security team</p>
    <p style="margin-top: 10px; font-size: 11px; color: #9ca3af;">
      Report ID: ${Date.now()} | Scan Date: ${new Date(scannedAt).toISOString()}
    </p>
  </div>
</body>
</html>
  `;
}

/**
 * Escape HTML special characters
 * @param {string} text - Text to escape
 * @returns {string} - Escaped text
 */
function escapeHtml(text) {
  if (!text) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.toString().replace(/[&<>"']/g, m => map[m]);
}

module.exports = { generatePDF };
