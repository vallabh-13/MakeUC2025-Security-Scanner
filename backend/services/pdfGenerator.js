const PDFDocument = require('pdfkit');

/**
 * Generate PDF report from scan results
 * @param {Object} scanResults - Complete scan results
 * @param {string} url - Target URL that was scanned
 * @returns {Buffer} - PDF file as buffer
 */
async function generatePDF(scanResults, url) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        bufferPages: true
      });

      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      doc.on('error', reject);

      const { score, grade, severityCounts, findings, detectedTechnology, scannedAt } = scanResults;

      // Define colors
      const colors = {
        primary: '#4f46e5',
        secondary: '#7c3aed',
        critical: '#dc2626',
        high: '#ea580c',
        medium: '#ca8a04',
        low: '#2563eb',
        info: '#64748b',
        success: '#16a34a',
        gray: '#6b7280',
        lightGray: '#e5e7eb',
        darkGray: '#374151'
      };

      const scoreColor = score >= 80 ? colors.success : score >= 60 ? colors.medium : colors.critical;

      // Helper function to add a section with padding
      const addSection = (title, topMargin = 20) => {
        if (doc.y > 700) doc.addPage();
        doc.moveDown(topMargin / 15);
        doc.fontSize(18).fillColor(colors.primary).text(title, { underline: true });
        doc.moveDown(0.5);
      };

      // === HEADER ===
      doc.rect(0, 0, doc.page.width, 120).fill(colors.primary);
      doc.fontSize(28).fillColor('white').text('🛡️ Security Scan Report', 50, 30, { align: 'center' });
      doc.fontSize(12).fillColor('white').text(url, 50, 65, { align: 'center', width: doc.page.width - 100 });

      const scanDate = new Date(scannedAt).toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      doc.fontSize(10).fillColor('white').text(`Generated on ${scanDate}`, 50, 95, { align: 'center' });

      doc.y = 150;

      // === EXECUTIVE SUMMARY ===
      addSection('Executive Summary', 0);

      // Summary boxes
      const summaryY = doc.y;
      const boxWidth = 150;
      const boxHeight = 80;
      const spacing = 20;
      const startX = (doc.page.width - (boxWidth * 3 + spacing * 2)) / 2;

      // Security Score Box
      doc.rect(startX, summaryY, boxWidth, boxHeight).fillAndStroke(colors.lightGray, colors.darkGray);
      doc.fontSize(32).fillColor(scoreColor).text(score.toString(), startX, summaryY + 15, { width: boxWidth, align: 'center' });
      doc.fontSize(10).fillColor(colors.gray).text('Security Score', startX, summaryY + 55, { width: boxWidth, align: 'center' });

      // Grade Box
      doc.rect(startX + boxWidth + spacing, summaryY, boxWidth, boxHeight).fillAndStroke(colors.lightGray, colors.darkGray);
      doc.fontSize(32).fillColor(scoreColor).text(grade, startX + boxWidth + spacing, summaryY + 15, { width: boxWidth, align: 'center' });
      doc.fontSize(10).fillColor(colors.gray).text('Overall Grade', startX + boxWidth + spacing, summaryY + 55, { width: boxWidth, align: 'center' });

      // Total Issues Box
      doc.rect(startX + (boxWidth + spacing) * 2, summaryY, boxWidth, boxHeight).fillAndStroke(colors.lightGray, colors.darkGray);
      doc.fontSize(32).fillColor(colors.primary).text(findings.length.toString(), startX + (boxWidth + spacing) * 2, summaryY + 15, { width: boxWidth, align: 'center' });
      doc.fontSize(10).fillColor(colors.gray).text('Total Issues', startX + (boxWidth + spacing) * 2, summaryY + 55, { width: boxWidth, align: 'center' });

      doc.y = summaryY + boxHeight + 30;

      // === SEVERITY BREAKDOWN ===
      addSection('Severity Breakdown');

      const severities = ['critical', 'high', 'medium', 'low', 'info'];
      const severityY = doc.y;
      const severityBoxWidth = 90;
      const severityBoxHeight = 70;
      const severityStartX = (doc.page.width - (severityBoxWidth * 5 + spacing * 4)) / 2;

      severities.forEach((severity, index) => {
        const x = severityStartX + (severityBoxWidth + spacing) * index;
        const count = severityCounts[severity] || 0;
        const color = colors[severity] || colors.gray;

        doc.rect(x, severityY, severityBoxWidth, severityBoxHeight).fillAndStroke('#f9fafb', color);
        doc.fontSize(24).fillColor(color).text(count.toString(), x, severityY + 10, { width: severityBoxWidth, align: 'center' });
        doc.fontSize(9).fillColor(colors.gray).text(severity.toUpperCase(), x, severityY + 45, { width: severityBoxWidth, align: 'center' });
      });

      doc.y = severityY + severityBoxHeight + 20;

      // === DETECTED TECHNOLOGIES ===
      if (detectedTechnology && Object.keys(detectedTechnology).some(key => detectedTechnology[key] && (Array.isArray(detectedTechnology[key]) ? detectedTechnology[key].length > 0 : true))) {
        addSection('Detected Technologies');

        doc.fontSize(10).fillColor(colors.darkGray);

        if (detectedTechnology.webServer) {
          doc.fillColor(colors.gray).text('Web Server:', { continued: true });
          doc.fillColor(colors.darkGray).text(` ${detectedTechnology.webServer.name} ${detectedTechnology.webServer.version}`);
        }

        if (detectedTechnology.cms) {
          const cmsName = typeof detectedTechnology.cms === 'string' ? detectedTechnology.cms : detectedTechnology.cms.name;
          const cmsVersion = typeof detectedTechnology.cms === 'object' ? detectedTechnology.cms.version || '' : '';
          doc.fillColor(colors.gray).text('CMS:', { continued: true });
          doc.fillColor(colors.darkGray).text(` ${cmsName} ${cmsVersion}`);
        }

        if (detectedTechnology.backend && detectedTechnology.backend.length > 0) {
          doc.fillColor(colors.gray).text('Backend:', { continued: true });
          doc.fillColor(colors.darkGray).text(` ${detectedTechnology.backend.map(b => `${b.name} ${b.version}`).join(', ')}`);
        }

        if (detectedTechnology.frameworks && detectedTechnology.frameworks.length > 0) {
          doc.fillColor(colors.gray).text('Frameworks:', { continued: true });
          doc.fillColor(colors.darkGray).text(` ${detectedTechnology.frameworks.map(f => f.name || f).join(', ')}`);
        }

        if (detectedTechnology.libraries && detectedTechnology.libraries.length > 0) {
          doc.fillColor(colors.gray).text('Libraries:', { continued: true });
          doc.fillColor(colors.darkGray).text(` ${detectedTechnology.libraries.slice(0, 5).map(l => l.name).join(', ')}`);
        }

        doc.moveDown();
      }

      // === SECURITY FINDINGS ===
      addSection('Security Findings');

      if (findings.length === 0) {
        doc.fontSize(12).fillColor(colors.success).text('✓ No security issues found!', { align: 'center' });
        doc.fontSize(10).fillColor(colors.gray).text('Your website appears to be secure based on our scans.', { align: 'center' });
      } else {
        findings.forEach((finding, index) => {
          // Check if we need a new page
          if (doc.y > 650) doc.addPage();

          const findingY = doc.y;
          const findingColor = colors[finding.severity] || colors.gray;

          // Left border
          doc.rect(50, findingY, 5, 60).fill(findingColor);

          // Finding box
          doc.rect(55, findingY, doc.page.width - 110, 60).fillAndStroke('#ffffff', colors.lightGray);

          // Finding number and title
          doc.fontSize(12).fillColor(colors.darkGray).text(`${index + 1}. ${finding.title}`, 65, findingY + 10, { width: doc.page.width - 220 });

          // Severity badge
          const badgeWidth = 80;
          const badgeX = doc.page.width - 100 - badgeWidth;
          doc.roundedRect(badgeX, findingY + 8, badgeWidth, 20, 3).fill(findingColor);
          doc.fontSize(9).fillColor('white').text(finding.severity.toUpperCase(), badgeX, findingY + 12, { width: badgeWidth, align: 'center' });

          // Description
          doc.fontSize(9).fillColor(colors.darkGray).text(finding.description, 65, findingY + 30, { width: doc.page.width - 130 });

          doc.y = findingY + 65;

          // Recommendation
          if (finding.recommendation) {
            if (doc.y > 700) doc.addPage();

            doc.rect(55, doc.y, doc.page.width - 110, 40).fillAndStroke('#f0fdf4', colors.success);
            doc.fontSize(9).fillColor(colors.success).text('💡 Recommendation:', 65, doc.y + 8);
            doc.fontSize(8).fillColor('#166534').text(finding.recommendation, 65, doc.y + 22, { width: doc.page.width - 130 });
            doc.y += 45;
          }

          // Metadata
          const metaItems = [];
          if (finding.cve) metaItems.push(`CVE: ${finding.cve}`);
          if (finding.cwe) metaItems.push(`CWE: ${finding.cwe}`);
          if (finding.owasp) metaItems.push(`OWASP: ${finding.owasp}`);
          if (finding.cvss) metaItems.push(`CVSS: ${finding.cvss}`);
          if (finding.component) metaItems.push(`Component: ${finding.component} ${finding.componentVersion || ''}`);

          if (metaItems.length > 0) {
            doc.fontSize(8).fillColor(colors.gray).text(metaItems.join(' | '), 65, doc.y + 5, { width: doc.page.width - 130 });
            doc.y += 15;
          }

          doc.moveDown(0.5);
        });
      }

      // === FOOTER ===
      const pageCount = doc.bufferedPageRange().count;
      for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);
        doc.fontSize(8).fillColor(colors.gray).text(
          `Page ${i + 1} of ${pageCount} | Report ID: ${Date.now()} | ${new Date(scannedAt).toISOString()}`,
          50,
          doc.page.height - 50,
          { align: 'center', width: doc.page.width - 100 }
        );
      }

      doc.end();

    } catch (error) {
      console.error('PDF generation failed:', error);
      reject(new Error(`Failed to generate PDF: ${error.message}`));
    }
  });
}

module.exports = { generatePDF };
