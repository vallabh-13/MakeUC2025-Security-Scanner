const PdfPrinter = require('pdfmake');
const path = require('path');

/**
 * Generate PDF report from scan results using pdfmake
 * Modern, Lambda-compatible PDF generation with reliable color handling
 *
 * @param {Object} scanResults - Complete scan results
 * @param {string} url - Target URL that was scanned
 * @returns {Promise<Buffer>} - PDF file as buffer
 */
async function generatePDF(scanResults, url) {
  return new Promise((resolve, reject) => {
    try {
      console.error('[PDF] Starting PDF generation with pdfmake for URL:', url);
      console.error('[PDF] Findings count:', scanResults.findings?.length || 0);
      console.error('[PDF] Score:', scanResults.score);
      console.error('[PDF] Grade:', scanResults.grade);

      const { score, grade, severityCounts, findings, detectedTechnology, scannedAt } = scanResults;

      // Define colors
      const colors = {
        primary: '#4f46e5',
        critical: '#dc2626',
        high: '#ea580c',
        medium: '#ca8a04',
        low: '#2563eb',
        info: '#0891b2',
        success: '#16a34a',
        textBlack: '#000000',
        textGray: '#6b7280',
        lightGray: '#e5e7eb',
        white: '#ffffff'
      };

      const scoreColor = score >= 80 ? colors.success : score >= 60 ? colors.medium : colors.critical;

      // Format scan date
      const scanDate = new Date(scannedAt).toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      // Build document definition
      const docDefinition = {
        pageSize: 'A4',
        pageMargins: [50, 120, 50, 60],

        // Header on every page
        header: function(currentPage, pageCount, pageSize) {
          if (currentPage === 1) {
            return {
              stack: [
                {
                  canvas: [
                    {
                      type: 'rect',
                      x: 0,
                      y: 0,
                      w: pageSize.width,
                      h: 100,
                      color: colors.primary
                    }
                  ]
                },
                {
                  text: 'Security Scan Report',
                  fontSize: 24,
                  bold: true,
                  color: colors.white,
                  alignment: 'center',
                  margin: [0, 25, 0, 5]
                },
                {
                  text: url,
                  fontSize: 11,
                  color: colors.white,
                  alignment: 'center',
                  margin: [0, 0, 0, 5]
                },
                {
                  text: `Generated on ${scanDate}`,
                  fontSize: 9,
                  color: colors.white,
                  alignment: 'center',
                  margin: [0, 0, 0, 10]
                }
              ]
            };
          }
          return null;
        },

        // Footer on every page
        footer: function(currentPage, pageCount) {
          return {
            text: `Page ${currentPage} of ${pageCount} | Report ID: ${Date.now()} | ${new Date(scannedAt).toISOString()}`,
            alignment: 'center',
            fontSize: 8,
            color: colors.textGray,
            margin: [0, 10, 0, 0]
          };
        },

        content: [
          // === EXECUTIVE SUMMARY ===
          {
            text: 'Executive Summary',
            fontSize: 18,
            bold: true,
            color: colors.primary,
            decoration: 'underline',
            alignment: 'center',
            margin: [0, 0, 0, 20]
          },

          // Summary boxes
          {
            columns: [
              {
                width: '*',
                stack: [
                  {
                    canvas: [
                      {
                        type: 'rect',
                        x: 0,
                        y: 0,
                        w: 150,
                        h: 80,
                        color: colors.lightGray,
                        lineColor: colors.textBlack,
                        lineWidth: 1
                      }
                    ]
                  },
                  {
                    text: score.toString(),
                    fontSize: 32,
                    bold: true,
                    color: scoreColor,
                    alignment: 'center',
                    margin: [0, -65, 0, 0]
                  },
                  {
                    text: 'Security Score',
                    fontSize: 10,
                    color: colors.textBlack,
                    alignment: 'center',
                    margin: [0, 5, 0, 0]
                  }
                ]
              },
              {
                width: '*',
                stack: [
                  {
                    canvas: [
                      {
                        type: 'rect',
                        x: 0,
                        y: 0,
                        w: 150,
                        h: 80,
                        color: colors.lightGray,
                        lineColor: colors.textBlack,
                        lineWidth: 1
                      }
                    ]
                  },
                  {
                    text: grade,
                    fontSize: 32,
                    bold: true,
                    color: scoreColor,
                    alignment: 'center',
                    margin: [0, -65, 0, 0]
                  },
                  {
                    text: 'Overall Grade',
                    fontSize: 10,
                    color: colors.textBlack,
                    alignment: 'center',
                    margin: [0, 5, 0, 0]
                  }
                ]
              },
              {
                width: '*',
                stack: [
                  {
                    canvas: [
                      {
                        type: 'rect',
                        x: 0,
                        y: 0,
                        w: 150,
                        h: 80,
                        color: colors.lightGray,
                        lineColor: colors.textBlack,
                        lineWidth: 1
                      }
                    ]
                  },
                  {
                    text: findings.length.toString(),
                    fontSize: 32,
                    bold: true,
                    color: colors.primary,
                    alignment: 'center',
                    margin: [0, -65, 0, 0]
                  },
                  {
                    text: 'Total Issues',
                    fontSize: 10,
                    color: colors.textBlack,
                    alignment: 'center',
                    margin: [0, 5, 0, 0]
                  }
                ]
              }
            ],
            columnGap: 15,
            margin: [0, 0, 0, 30]
          },

          // === SEVERITY BREAKDOWN ===
          {
            text: 'Severity Breakdown',
            fontSize: 18,
            bold: true,
            color: colors.primary,
            decoration: 'underline',
            alignment: 'center',
            margin: [0, 20, 0, 20]
          },

          // Severity boxes
          {
            columns: [
              buildSeverityBox('Critical', severityCounts.critical || 0, colors.critical, colors),
              buildSeverityBox('High', severityCounts.high || 0, colors.high, colors),
              buildSeverityBox('Medium', severityCounts.medium || 0, colors.medium, colors),
              buildSeverityBox('Low', severityCounts.low || 0, colors.low, colors),
              buildSeverityBox('Info', severityCounts.info || 0, colors.info, colors)
            ],
            columnGap: 10,
            margin: [0, 0, 0, 30]
          },

          // === DETECTED TECHNOLOGIES ===
          {
            text: 'Detected Technologies',
            fontSize: 18,
            bold: true,
            color: colors.primary,
            decoration: 'underline',
            alignment: 'center',
            margin: [0, 20, 0, 15],
            pageBreak: 'before'
          },

          ...buildTechnologySection(detectedTechnology, colors),

          // === SECURITY FINDINGS ===
          {
            text: 'Security Findings',
            fontSize: 18,
            bold: true,
            color: colors.primary,
            decoration: 'underline',
            alignment: 'center',
            margin: [0, 25, 0, 20]
          },

          ...buildFindingsSection(findings, colors)
        ],

        defaultStyle: {
          font: 'Roboto',
          fontSize: 10,
          color: colors.textBlack
        }
      };

      // Define fonts - use standard fonts that work in Lambda
      const fonts = {
        Roboto: {
          normal: 'Helvetica',
          bold: 'Helvetica-Bold',
          italics: 'Helvetica-Oblique',
          bolditalics: 'Helvetica-BoldOblique'
        }
      };

      // Create PDF
      const printer = new PdfPrinter(fonts);
      const pdfDoc = printer.createPdfKitDocument(docDefinition);

      const chunks = [];
      pdfDoc.on('data', (chunk) => chunks.push(chunk));
      pdfDoc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        console.error('[PDF] PDF generation complete. Size:', pdfBuffer.length, 'bytes');
        resolve(pdfBuffer);
      });
      pdfDoc.on('error', (err) => {
        console.error('[PDF] PDF generation error:', err);
        reject(err);
      });

      pdfDoc.end();

    } catch (error) {
      console.error('[PDF] CRITICAL ERROR in PDF generation:', error);
      console.error('[PDF] Error stack:', error.stack);
      reject(new Error(`Failed to generate PDF: ${error.message}`));
    }
  });
}

/**
 * Build a severity box for the breakdown section
 */
function buildSeverityBox(label, count, color, colors) {
  return {
    width: '*',
    stack: [
      {
        canvas: [
          {
            type: 'rect',
            x: 0,
            y: 0,
            w: 90,
            h: 70,
            color: '#f9fafb',
            lineColor: color,
            lineWidth: 2
          }
        ]
      },
      {
        text: count.toString(),
        fontSize: 24,
        bold: true,
        color: color,
        alignment: 'center',
        margin: [0, -55, 0, 0]
      },
      {
        text: label.toUpperCase(),
        fontSize: 9,
        color: colors.textBlack,
        alignment: 'center',
        margin: [0, 8, 0, 0]
      }
    ]
  };
}

/**
 * Build technology section
 */
function buildTechnologySection(detectedTechnology, colors) {
  const techItems = [];
  let techDetected = false;

  if (detectedTechnology?.webServer) {
    techDetected = true;
    const serverName = detectedTechnology.webServer.name || 'Unknown';
    const serverVersion = detectedTechnology.webServer.version &&
                         detectedTechnology.webServer.version !== 'unknown' &&
                         detectedTechnology.webServer.version !== 'hidden'
      ? detectedTechnology.webServer.version
      : '';
    techItems.push({
      text: [
        { text: 'Web Server: ', color: colors.textGray },
        { text: `${serverName} ${serverVersion}`.trim(), color: colors.textBlack }
      ],
      margin: [0, 3, 0, 3]
    });
  }

  if (detectedTechnology?.cms) {
    techDetected = true;
    const cmsName = typeof detectedTechnology.cms === 'string'
      ? detectedTechnology.cms
      : detectedTechnology.cms.name;
    const cmsVersion = typeof detectedTechnology.cms === 'object'
      ? detectedTechnology.cms.version || ''
      : '';
    techItems.push({
      text: [
        { text: 'CMS: ', color: colors.textGray },
        { text: `${cmsName} ${cmsVersion}`.trim(), color: colors.textBlack }
      ],
      margin: [0, 3, 0, 3]
    });
  }

  if (detectedTechnology?.backend?.length > 0) {
    techDetected = true;
    const backendStr = Array.isArray(detectedTechnology.backend)
      ? detectedTechnology.backend.map(b =>
          typeof b === 'string' ? b : `${b.name || ''} ${b.version || ''}`.trim()
        ).join(', ')
      : detectedTechnology.backend;
    techItems.push({
      text: [
        { text: 'Backend: ', color: colors.textGray },
        { text: backendStr, color: colors.textBlack }
      ],
      margin: [0, 3, 0, 3]
    });
  }

  if (detectedTechnology?.frameworks?.length > 0) {
    techDetected = true;
    const frameworkStr = detectedTechnology.frameworks.map(f => f.name || f).join(', ');
    techItems.push({
      text: [
        { text: 'Frameworks: ', color: colors.textGray },
        { text: frameworkStr, color: colors.textBlack }
      ],
      margin: [0, 3, 0, 3]
    });
  }

  if (detectedTechnology?.libraries?.length > 0) {
    techDetected = true;
    const libStr = detectedTechnology.libraries.slice(0, 5).map(l => l.name).join(', ');
    techItems.push({
      text: [
        { text: 'Libraries: ', color: colors.textGray },
        { text: libStr, color: colors.textBlack }
      ],
      margin: [0, 3, 0, 3]
    });
  }

  if (detectedTechnology?.services?.length > 0) {
    techDetected = true;
    try {
      const serviceStr = detectedTechnology.services
        .slice(0, 5)
        .map(s => `Port ${s.port}/${s.protocol} - ${s.service}`)
        .join(', ');
      techItems.push({
        text: [
          { text: 'Services: ', color: colors.textGray },
          { text: serviceStr, color: colors.textBlack }
        ],
        margin: [0, 3, 0, 3]
      });
    } catch (err) {
      console.error('[PDF] Error rendering services:', err);
      techItems.push({
        text: [
          { text: 'Services: ', color: colors.textGray },
          { text: `Found ${detectedTechnology.services.length} open ports`, color: colors.textBlack }
        ],
        margin: [0, 3, 0, 3]
      });
    }
  }

  if (!techDetected) {
    techItems.push({
      text: 'No specific technologies detected. The server may be hiding version information for security reasons.',
      color: colors.textGray,
      margin: [0, 3, 0, 3]
    });
  }

  return techItems;
}

/**
 * Build findings section
 */
function buildFindingsSection(findings, colors) {
  if (!findings || findings.length === 0) {
    return [
      {
        text: 'No security issues found!',
        fontSize: 12,
        color: colors.success,
        alignment: 'center',
        margin: [0, 0, 0, 5]
      },
      {
        text: 'Your website appears to be secure based on our scans.',
        fontSize: 10,
        color: colors.textGray,
        alignment: 'center',
        margin: [0, 0, 0, 20]
      }
    ];
  }

  const findingItems = [];

  findings.forEach((finding, index) => {
    const findingColor = colors[finding.severity] || colors.textBlack;

    // Add page break before finding if needed (every 3 findings after the first page)
    if (index > 0 && index % 3 === 0) {
      findingItems.push({ text: '', pageBreak: 'before' });
    }

    // Finding box
    findingItems.push({
      stack: [
        {
          canvas: [
            {
              type: 'rect',
              x: 0,
              y: 0,
              w: 5,
              h: 70,
              color: findingColor
            },
            {
              type: 'rect',
              x: 5,
              y: 0,
              w: 490,
              h: 70,
              color: colors.white,
              lineColor: colors.lightGray,
              lineWidth: 1
            }
          ]
        },
        {
          columns: [
            {
              width: '*',
              text: `${index + 1}. ${finding.title}`,
              fontSize: 12,
              color: colors.textBlack,
              margin: [15, -60, 0, 0]
            },
            {
              width: 80,
              canvas: [
                {
                  type: 'rect',
                  x: 0,
                  y: -50,
                  w: 80,
                  h: 20,
                  r: 3,
                  color: findingColor
                }
              ]
            }
          ]
        },
        {
          text: finding.severity.toUpperCase(),
          fontSize: 9,
          color: colors.white,
          bold: true,
          alignment: 'right',
          margin: [0, -30, 10, 0]
        },
        {
          text: finding.description,
          fontSize: 9,
          color: colors.textBlack,
          margin: [15, 5, 15, 0]
        }
      ],
      margin: [0, 0, 0, 5]
    });

    // Recommendation box
    if (finding.recommendation) {
      findingItems.push({
        stack: [
          {
            canvas: [
              {
                type: 'rect',
                x: 5,
                y: 0,
                w: 490,
                h: 50,
                color: '#f0fdf4',
                lineColor: colors.success,
                lineWidth: 1
              }
            ]
          },
          {
            text: 'Recommendation:',
            fontSize: 9,
            color: colors.success,
            margin: [15, -40, 0, 0]
          },
          {
            text: finding.recommendation,
            fontSize: 8,
            color: '#166534',
            margin: [15, 3, 15, 0]
          }
        ],
        margin: [0, 0, 0, 5]
      });
    }

    // Metadata
    const metaItems = [];
    if (finding.cve) metaItems.push(`CVE: ${finding.cve}`);
    if (finding.cwe) metaItems.push(`CWE: ${finding.cwe}`);
    if (finding.owasp) metaItems.push(`OWASP: ${finding.owasp}`);
    if (finding.cvss) metaItems.push(`CVSS: ${finding.cvss}`);
    if (finding.component) {
      metaItems.push(`Component: ${finding.component} ${finding.componentVersion || ''}`);
    }

    if (metaItems.length > 0) {
      findingItems.push({
        text: metaItems.join(' | '),
        fontSize: 8,
        color: colors.textGray,
        margin: [5, 0, 0, 15]
      });
    } else {
      findingItems.push({ text: '', margin: [0, 0, 0, 15] });
    }
  });

  return findingItems;
}

module.exports = { generatePDF };
