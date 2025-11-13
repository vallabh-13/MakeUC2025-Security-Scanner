const PDFDocument = require('pdfkit');

/**
 * Generate PDF report from scan results
 *
 * CRITICAL FIX NOTES:
 * - Always reset fillColor() to darkGray after any fill() operations on boxes/shapes
 * - Reset fillColor() after addPage() to prevent white-on-white text
 * - Reset font and fontSize after section headers
 * - This ensures all text remains visible and prevents blank PDF pages
 *
 * @param {Object} scanResults - Complete scan results
 * @param {string} url - Target URL that was scanned
 * @returns {Buffer} - PDF file as buffer
 */
async function generatePDF(scanResults, url) {
  return new Promise((resolve, reject) => {
    try {
      // Use console.error to ensure logs appear in CloudWatch
      console.error('[PDF] Starting PDF generation for URL:', url);
      console.error('[PDF] Scan results keys:', Object.keys(scanResults));
      console.error('[PDF] Findings count:', scanResults.findings?.length || 0);
      console.error('[PDF] Score:', scanResults.score);
      console.error('[PDF] Grade:', scanResults.grade);

      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        bufferPages: true
      });

      // Set default font immediately - CRITICAL for Lambda
      doc.font('Helvetica');
      console.error('[PDF] Default font set to Helvetica');

      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        console.error('[PDF] PDF generation complete. Size:', pdfBuffer.length, 'bytes');
        resolve(pdfBuffer);
      });
      doc.on('error', (err) => {
        console.error('[PDF] PDF generation error:', err);
        reject(err);
      });

      const { score, grade, severityCounts, findings, detectedTechnology, scannedAt } = scanResults;

      if (!score && score !== 0) {
        console.error('[PDF] ERROR: Missing score in scan results!');
      }
      if (!findings || !Array.isArray(findings)) {
        console.error('[PDF] ERROR: Missing or invalid findings array!');
      }

      // Define colors
      const colors = {
        primary: '#4f46e5',
        secondary: '#7c3aed',
        critical: '#dc2626',
        high: '#ea580c',
        medium: '#ca8a04',
        low: '#2563eb',
        info: '#0891b2', // Changed from gray to cyan for better visibility
        success: '#16a34a',
        gray: '#6b7280',
        lightGray: '#e5e7eb',
        darkGray: '#374151'
      };

      const scoreColor = score >= 80 ? colors.success : score >= 60 ? colors.medium : colors.critical;

      // Helper function to add a section with padding
      const addSection = (title, topMargin = 20) => {
        if (doc.y > 700) {
          doc.addPage();
          // Reset font and color after new page
          doc.font('Helvetica');
          doc.fillColor(colors.darkGray);
        }
        doc.moveDown(topMargin / 12);
        doc.font('Helvetica-Bold').fontSize(18).fillColor(colors.primary).text(title, 50, doc.y, {
          align: 'center',
          width: doc.page.width - 100,
          underline: true,
          continued: false
        });
        doc.moveDown(0.8);
        // Reset font, font size, and fill color to dark after each section title
        doc.font('Helvetica').fontSize(10).fillColor(colors.darkGray);
      };

      // === HEADER ===
      doc.rect(0, 0, doc.page.width, 120).fill(colors.primary);

      // Title - removed emoji to fix encoding issues
      doc.font('Helvetica-Bold').fontSize(28).fillColor('white').text('Security Scan Report', 50, 30, {
        align: 'center',
        width: doc.page.width - 100
      });

      // URL
      doc.font('Helvetica').fontSize(12).fillColor('white').text(url, 50, 68, {
        align: 'center',
        width: doc.page.width - 100
      });

      // Scan date
      const scanDate = new Date(scannedAt).toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      doc.font('Helvetica').fontSize(10).fillColor('white').text(`Generated on ${scanDate}`, 50, 92, {
        align: 'center',
        width: doc.page.width - 100
      });

      // Reset Y position and color after header - CRITICAL FIX
      doc.y = 140;
      doc.fillColor(colors.darkGray); // Reset to dark color for body text
      console.error('[PDF] Header complete, fill color reset to', colors.darkGray);

      // === EXECUTIVE SUMMARY ===
      addSection('Executive Summary', 0);
      console.error('[PDF] Rendering executive summary...');

      // Summary boxes
      const summaryY = doc.y;
      const boxWidth = 150;
      const boxHeight = 80;
      const spacing = 20;
      const startX = (doc.page.width - (boxWidth * 3 + spacing * 2)) / 2;

      // Security Score Box
      doc.rect(startX, summaryY, boxWidth, boxHeight)
        .fillAndStroke(colors.lightGray, colors.darkGray);
      doc.font('Helvetica-Bold').fontSize(32).fillColor(scoreColor)
        .text(score.toString(), startX, summaryY + 15, {
          width: boxWidth,
          align: 'center',
          continued: false
        });
      doc.font('Helvetica').fontSize(10).fillColor(colors.gray)
        .text('Security Score', startX, summaryY + 55, {
          width: boxWidth,
          align: 'center',
          continued: false
        });

      // Grade Box
      const gradeX = startX + boxWidth + spacing;
      doc.rect(gradeX, summaryY, boxWidth, boxHeight)
        .fillAndStroke(colors.lightGray, colors.darkGray);
      doc.font('Helvetica-Bold').fontSize(32).fillColor(scoreColor)
        .text(grade, gradeX, summaryY + 15, {
          width: boxWidth,
          align: 'center',
          continued: false
        });
      doc.font('Helvetica').fontSize(10).fillColor(colors.gray)
        .text('Overall Grade', gradeX, summaryY + 55, {
          width: boxWidth,
          align: 'center',
          continued: false
        });

      // Total Issues Box
      const issuesX = startX + (boxWidth + spacing) * 2;
      doc.rect(issuesX, summaryY, boxWidth, boxHeight)
        .fillAndStroke(colors.lightGray, colors.darkGray);
      doc.font('Helvetica-Bold').fontSize(32).fillColor(colors.primary)
        .text(findings.length.toString(), issuesX, summaryY + 15, {
          width: boxWidth,
          align: 'center',
          continued: false
        });
      doc.font('Helvetica').fontSize(10).fillColor(colors.gray)
        .text('Total Issues', issuesX, summaryY + 55, {
          width: boxWidth,
          align: 'center',
          continued: false
        });

      doc.y = summaryY + boxHeight + 30;

      // Reset color after summary boxes
      doc.fillColor(colors.darkGray);

      console.error('[PDF] Executive summary complete');

      // === SEVERITY BREAKDOWN ===
      addSection('Severity Breakdown');
      console.error('[PDF] Rendering severity breakdown...');

      const severities = ['critical', 'high', 'medium', 'low', 'info'];
      const severityY = doc.y;
      const severityBoxWidth = 90;
      const severityBoxHeight = 70;
      const severitySpacing = 15;
      const severityStartX = (doc.page.width - (severityBoxWidth * 5 + severitySpacing * 4)) / 2;

      severities.forEach((severity, index) => {
        const x = severityStartX + (severityBoxWidth + severitySpacing) * index;
        const count = severityCounts[severity] || 0;
        const color = colors[severity] || colors.gray;

        doc.rect(x, severityY, severityBoxWidth, severityBoxHeight)
          .fillAndStroke('#f9fafb', color);

        doc.font('Helvetica-Bold').fontSize(24).fillColor(color)
          .text(count.toString(), x, severityY + 12, {
            width: severityBoxWidth,
            align: 'center',
            continued: false
          });

        doc.font('Helvetica').fontSize(9).fillColor(colors.gray)
          .text(severity.toUpperCase(), x, severityY + 48, {
            width: severityBoxWidth,
            align: 'center',
            continued: false
          });
      });

      doc.y = severityY + severityBoxHeight + 25;

      // Reset color after severity boxes
      doc.fillColor(colors.darkGray);

      console.error('[PDF] Severity breakdown complete');

      // === DETECTED TECHNOLOGIES ===
      addSection('Detected Technologies');
      console.error('[PDF] Rendering detected technologies...');

      doc.fontSize(10);

      let techDetected = false;

      if (detectedTechnology && detectedTechnology.webServer) {
        techDetected = true;
        doc.fillColor(colors.gray).text('Web Server: ', { continued: true });
        const serverName = detectedTechnology.webServer.name || 'Unknown';
        const serverVersion = detectedTechnology.webServer.version && detectedTechnology.webServer.version !== 'unknown' && detectedTechnology.webServer.version !== 'hidden'
          ? detectedTechnology.webServer.version
          : '';
        doc.fillColor(colors.darkGray).text(`${serverName} ${serverVersion}`.trim(), {
          continued: false
        });
      }

      if (detectedTechnology && detectedTechnology.cms) {
        techDetected = true;
        const cmsName = typeof detectedTechnology.cms === 'string' ? detectedTechnology.cms : detectedTechnology.cms.name;
        const cmsVersion = typeof detectedTechnology.cms === 'object' ? detectedTechnology.cms.version || '' : '';
        doc.fillColor(colors.gray).text('CMS: ', { continued: true });
        doc.fillColor(colors.darkGray).text(`${cmsName} ${cmsVersion}`.trim(), { continued: false });
      }

      if (detectedTechnology && detectedTechnology.backend && detectedTechnology.backend.length > 0) {
        techDetected = true;
        const backendStr = Array.isArray(detectedTechnology.backend)
          ? detectedTechnology.backend.map(b => typeof b === 'string' ? b : `${b.name || ''} ${b.version || ''}`.trim()).join(', ')
          : detectedTechnology.backend;
        doc.fillColor(colors.gray).text('Backend: ', { continued: true });
        doc.fillColor(colors.darkGray).text(backendStr, { continued: false });
      }

      if (detectedTechnology && detectedTechnology.frameworks && detectedTechnology.frameworks.length > 0) {
        techDetected = true;
        const frameworkStr = detectedTechnology.frameworks.map(f => f.name || f).join(', ');
        doc.fillColor(colors.gray).text('Frameworks: ', { continued: true });
        doc.fillColor(colors.darkGray).text(frameworkStr, { continued: false });
      }

      if (detectedTechnology && detectedTechnology.libraries && detectedTechnology.libraries.length > 0) {
        techDetected = true;
        const libStr = detectedTechnology.libraries.slice(0, 5).map(l => l.name).join(', ');
        doc.fillColor(colors.gray).text('Libraries: ', { continued: true });
        doc.fillColor(colors.darkGray).text(libStr, { continued: false });
      }

      if (detectedTechnology && detectedTechnology.services && detectedTechnology.services.length > 0) {
        techDetected = true;
        try {
          const serviceStr = detectedTechnology.services.slice(0, 5).map(s => `Port ${s.port}/${s.protocol} - ${s.service}`).join(', ');
          doc.fillColor(colors.gray).text('Services: ', { continued: true });
          doc.fillColor(colors.darkGray).text(serviceStr, { continued: false });
        } catch (err) {
          console.error('[PDF] Error rendering services:', err);
          doc.fillColor(colors.gray).text('Services: Found ' + detectedTechnology.services.length + ' open ports', { continued: false });
        }
      }

      if (!techDetected) {
        doc.fillColor(colors.gray).text('No specific technologies detected. The server may be hiding version information for security reasons.', {
          align: 'left'
        });
      }

      doc.moveDown(1.5);

      console.error('[PDF] Technology section complete');

      // === SECURITY FINDINGS ===
      addSection('Security Findings');

      console.error('[PDF] Rendering findings section, count:', findings ? findings.length : 0);

      if (!findings || findings.length === 0) {
        // Removed checkmark emoji to fix encoding
        doc.fontSize(12).fillColor(colors.success).text('No security issues found!', {
          align: 'center'
        });
        doc.fontSize(10).fillColor(colors.gray).text('Your website appears to be secure based on our scans.', {
          align: 'center'
        });
        doc.moveDown();
        console.error('[PDF] No findings to display');
      } else {
        console.error('[PDF] Rendering', findings.length, 'findings');
        findings.forEach((finding, index) => {
          try {
            console.error('[PDF] Rendering finding', index + 1, ':', finding.title);
          // Check if we need a new page
          if (doc.y > 650) {
            doc.addPage();
            // Reset font and color after new page
            doc.font('Helvetica').fillColor(colors.darkGray);
          }

          const findingY = doc.y;
          const findingColor = colors[finding.severity] || colors.gray;
          const findingHeight = 70;

          // Left border
          doc.rect(50, findingY, 5, findingHeight).fill(findingColor);

          // Finding box
          doc.rect(55, findingY, doc.page.width - 110, findingHeight)
            .fillAndStroke('#ffffff', colors.lightGray);

          // Reset fill color to dark after drawing box
          doc.fillColor(colors.darkGray);

          // Finding number and title
          doc.fontSize(12).fillColor(colors.darkGray)
            .text(`${index + 1}. ${finding.title}`, 65, findingY + 12, {
              width: doc.page.width - 220,
              continued: false
            });

          // Severity badge
          const badgeWidth = 80;
          const badgeX = doc.page.width - 100 - badgeWidth;
          doc.roundedRect(badgeX, findingY + 10, badgeWidth, 20, 3).fill(findingColor);
          doc.fontSize(9).fillColor('white')
            .text(finding.severity.toUpperCase(), badgeX, findingY + 14, {
              width: badgeWidth,
              align: 'center',
              continued: false
            });

          // Reset fill color to dark after severity badge
          doc.fillColor(colors.darkGray);

          // Description
          doc.fontSize(9).fillColor(colors.darkGray)
            .text(finding.description, 65, findingY + 35, {
              width: doc.page.width - 130,
              continued: false
            });

          doc.y = findingY + findingHeight + 5;

          // Recommendation
          if (finding.recommendation) {
            if (doc.y > 700) {
              doc.addPage();
              // Reset font and color after new page
              doc.font('Helvetica').fillColor(colors.darkGray);
            }

            const recY = doc.y;
            const recHeight = 50;

            doc.rect(55, recY, doc.page.width - 110, recHeight)
              .fillAndStroke('#f0fdf4', colors.success);

            // Removed emoji to fix encoding
            doc.fontSize(9).fillColor(colors.success)
              .text('Recommendation:', 65, recY + 10, { continued: false });

            doc.fontSize(8).fillColor('#166534')
              .text(finding.recommendation, 65, recY + 25, {
                width: doc.page.width - 130,
                continued: false
              });

            doc.y = recY + recHeight + 5;

            // Reset fill color to dark after recommendation box
            doc.fillColor(colors.darkGray);
          }

          // Metadata
          const metaItems = [];
          if (finding.cve) metaItems.push(`CVE: ${finding.cve}`);
          if (finding.cwe) metaItems.push(`CWE: ${finding.cwe}`);
          if (finding.owasp) metaItems.push(`OWASP: ${finding.owasp}`);
          if (finding.cvss) metaItems.push(`CVSS: ${finding.cvss}`);
          if (finding.component) metaItems.push(`Component: ${finding.component} ${finding.componentVersion || ''}`);

          if (metaItems.length > 0) {
            if (doc.y > 720) {
              doc.addPage();
              // Reset font and color after new page
              doc.font('Helvetica').fillColor(colors.darkGray);
            }

            doc.fontSize(8).fillColor(colors.gray)
              .text(metaItems.join(' | '), 55, doc.y, {
                width: doc.page.width - 110,
                continued: false
              });
            doc.moveDown(0.5);
          }

          doc.moveDown(1);
          } catch (err) {
            console.error('[PDF] Error rendering finding', index + 1, ':', err);
            // Continue with next finding
          }
        });
        console.error('[PDF] All findings rendered successfully');
      }

      // === FOOTER ===
      console.error('[PDF] Adding footer...');
      const pageCount = doc.bufferedPageRange().count;
      console.error('[PDF] Total pages:', pageCount);
      for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);
        doc.fontSize(8).fillColor(colors.gray).text(
          `Page ${i + 1} of ${pageCount} | Report ID: ${Date.now()} | ${new Date(scannedAt).toISOString()}`,
          50,
          doc.page.height - 50,
          { align: 'center', width: doc.page.width - 100 }
        );
      }

      console.error('[PDF] Footer complete, finalizing document...');
      doc.end();
      console.error('[PDF] doc.end() called, waiting for buffers...');

    } catch (error) {
      console.error('[PDF] CRITICAL ERROR in PDF generation:', error);
      console.error('[PDF] Error stack:', error.stack);
      reject(new Error(`Failed to generate PDF: ${error.message}`));
    }
  });
}

module.exports = { generatePDF };
