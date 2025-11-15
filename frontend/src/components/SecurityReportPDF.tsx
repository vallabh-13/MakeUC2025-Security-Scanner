import React from 'react';
import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer';

interface ScanResult {
  score: number;
  grade: string;
  severityCounts: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
  findings: Array<{
    severity: string;
    title: string;
    description: string;
    recommendation: string;
  }>;
  detectedTechnology: {
    webServer: { name: string; version: string } | null;
    backend: any[];
    cms: any | null;
    frameworks: any[];
    libraries: Array<{ name: string; version: string; issue: string }>;
    technologies: any[];
    services: any[];
  };
  sslGrade: string;
  totalIssues: number;
  scannedAt: string;
  url?: string;
  scanErrors: {
    ssl: string | null;
    nmap: string | null;
    nuclei: string | null;
    detection: string | null;
  };
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 30,
    borderBottom: '2 solid #3b82f6',
    paddingBottom: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
    borderBottom: '1 solid #e2e8f0',
    paddingBottom: 6,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    gap: 10,
  },
  summaryBox: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 4,
    border: '1 solid #e2e8f0',
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 9,
    color: '#64748b',
    textTransform: 'uppercase',
  },
  severityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 4,
    marginBottom: 15,
  },
  severityItem: {
    alignItems: 'center',
  },
  severityValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  severityLabel: {
    fontSize: 9,
    color: '#64748b',
    textTransform: 'uppercase',
  },
  finding: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#fef2f2',
    borderLeft: '3 solid #dc2626',
    borderRadius: 4,
  },
  findingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    alignItems: 'center',
  },
  findingTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e293b',
    flex: 1,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 3,
    fontSize: 8,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  findingDescription: {
    fontSize: 10,
    color: '#475569',
    marginBottom: 6,
    lineHeight: 1.4,
  },
  findingRecommendation: {
    fontSize: 10,
    color: '#475569',
    lineHeight: 1.4,
  },
  recommendationLabel: {
    fontWeight: 'bold',
    color: '#1e293b',
  },
  techBox: {
    marginBottom: 12,
    padding: 10,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
  },
  techTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 6,
  },
  techItem: {
    fontSize: 10,
    color: '#475569',
    marginBottom: 3,
    paddingLeft: 8,
  },
  noDataText: {
    fontSize: 10,
    color: '#64748b',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 9,
    color: '#94a3b8',
    borderTop: '1 solid #e2e8f0',
    paddingTop: 10,
  },
  pageNumber: {
    fontSize: 8,
    color: '#94a3b8',
  },
});

const getSeverityColor = (severity: string) => {
  switch (severity.toLowerCase()) {
    case 'critical':
      return { color: '#dc2626', backgroundColor: '#fef2f2' };
    case 'high':
      return { color: '#ea580c', backgroundColor: '#fff7ed' };
    case 'medium':
      return { color: '#ca8a04', backgroundColor: '#fefce8' };
    case 'low':
      return { color: '#2563eb', backgroundColor: '#eff6ff' };
    case 'info':
      return { color: '#0891b2', backgroundColor: '#ecfeff' };
    default:
      return { color: '#64748b', backgroundColor: '#f8fafc' };
  }
};

interface SecurityReportPDFProps {
  results: ScanResult;
  targetUrl: string;
}

const SecurityReportPDF: React.FC<SecurityReportPDFProps> = ({ results, targetUrl }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Security Scan Report</Text>
        <Text style={styles.subtitle}>Target: {targetUrl}</Text>
        <Text style={styles.subtitle}>
          Scanned: {new Date(results.scannedAt).toLocaleString()}
        </Text>
      </View>

      {/* Summary Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Executive Summary</Text>
        <View style={styles.summaryContainer}>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryValue}>{results.score}</Text>
            <Text style={styles.summaryLabel}>Security Score</Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryValue}>{results.grade}</Text>
            <Text style={styles.summaryLabel}>Grade</Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryValue}>{results.totalIssues}</Text>
            <Text style={styles.summaryLabel}>Total Issues</Text>
          </View>
        </View>

        {/* Severity Breakdown */}
        <View style={styles.severityContainer}>
          <View style={styles.severityItem}>
            <Text style={[styles.severityValue, { color: '#dc2626' }]}>
              {results.severityCounts.critical}
            </Text>
            <Text style={styles.severityLabel}>Critical</Text>
          </View>
          <View style={styles.severityItem}>
            <Text style={[styles.severityValue, { color: '#ea580c' }]}>
              {results.severityCounts.high}
            </Text>
            <Text style={styles.severityLabel}>High</Text>
          </View>
          <View style={styles.severityItem}>
            <Text style={[styles.severityValue, { color: '#ca8a04' }]}>
              {results.severityCounts.medium}
            </Text>
            <Text style={styles.severityLabel}>Medium</Text>
          </View>
          <View style={styles.severityItem}>
            <Text style={[styles.severityValue, { color: '#2563eb' }]}>
              {results.severityCounts.low}
            </Text>
            <Text style={styles.severityLabel}>Low</Text>
          </View>
          <View style={styles.severityItem}>
            <Text style={[styles.severityValue, { color: '#0891b2' }]}>
              {results.severityCounts.info}
            </Text>
            <Text style={styles.severityLabel}>Info</Text>
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text>Generated by Security Scanner - {new Date().toLocaleDateString()}</Text>
        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          fixed
        />
      </View>
    </Page>

    {/* Findings Section */}
    <Page size="A4" style={styles.page}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Security Findings</Text>
        {results.findings.length > 0 ? (
          results.findings.map((finding, index) => {
            const severityStyle = getSeverityColor(finding.severity);
            return (
              <View key={index} style={styles.finding}>
                <View style={styles.findingHeader}>
                  <Text style={styles.findingTitle}>{finding.title}</Text>
                  <View
                    style={[
                      styles.severityBadge,
                      { backgroundColor: severityStyle.backgroundColor, color: severityStyle.color },
                    ]}
                  >
                    <Text>{finding.severity.toUpperCase()}</Text>
                  </View>
                </View>
                <Text style={styles.findingDescription}>{finding.description}</Text>
                <Text style={styles.findingRecommendation}>
                  <Text style={styles.recommendationLabel}>Recommendation: </Text>
                  {finding.recommendation}
                </Text>
              </View>
            );
          })
        ) : (
          <Text style={styles.noDataText}>No vulnerabilities detected</Text>
        )}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text>Generated by Security Scanner - {new Date().toLocaleDateString()}</Text>
        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          fixed
        />
      </View>
    </Page>

    {/* Technology Section */}
    <Page size="A4" style={styles.page}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Detected Technologies</Text>

        {results.detectedTechnology.webServer && (
          <View style={styles.techBox}>
            <Text style={styles.techTitle}>Web Server</Text>
            <Text style={styles.techItem}>
              {results.detectedTechnology.webServer.name}{' '}
              {results.detectedTechnology.webServer.version}
            </Text>
          </View>
        )}

        {results.detectedTechnology.backend &&
          results.detectedTechnology.backend.length > 0 && (
            <View style={styles.techBox}>
              <Text style={styles.techTitle}>Backend Technologies</Text>
              {results.detectedTechnology.backend.map((tech, index) => (
                <Text key={index} style={styles.techItem}>
                  • {tech}
                </Text>
              ))}
            </View>
          )}

        {results.detectedTechnology.cms && (
          <View style={styles.techBox}>
            <Text style={styles.techTitle}>Content Management System</Text>
            <Text style={styles.techItem}>{results.detectedTechnology.cms}</Text>
          </View>
        )}

        {results.detectedTechnology.frameworks &&
          results.detectedTechnology.frameworks.length > 0 && (
            <View style={styles.techBox}>
              <Text style={styles.techTitle}>Frameworks</Text>
              {results.detectedTechnology.frameworks.map((framework, index) => (
                <Text key={index} style={styles.techItem}>
                  • {framework}
                </Text>
              ))}
            </View>
          )}

        {results.detectedTechnology.libraries &&
          results.detectedTechnology.libraries.length > 0 && (
            <View style={styles.techBox}>
              <Text style={styles.techTitle}>Libraries</Text>
              {results.detectedTechnology.libraries.map((lib, index) => (
                <Text key={index} style={styles.techItem}>
                  • {lib.name} {lib.version}
                </Text>
              ))}
            </View>
          )}

        {results.detectedTechnology.technologies &&
          results.detectedTechnology.technologies.length > 0 && (
            <View style={styles.techBox}>
              <Text style={styles.techTitle}>Additional Technologies</Text>
              {results.detectedTechnology.technologies.map((tech, index) => (
                <Text key={index} style={styles.techItem}>
                  • {tech}
                </Text>
              ))}
            </View>
          )}

        {results.detectedTechnology.services &&
          results.detectedTechnology.services.length > 0 && (
            <View style={styles.techBox}>
              <Text style={styles.techTitle}>Network Services</Text>
              {results.detectedTechnology.services.map((service: any, index) => (
                <Text key={index} style={styles.techItem}>
                  • Port {service.port}/{service.protocol} - {service.service}
                  {service.product &&
                    ` (${service.product}${service.version ? ' ' + service.version : ''})`}
                </Text>
              ))}
            </View>
          )}

        {!results.detectedTechnology.webServer &&
          (!results.detectedTechnology.backend ||
            results.detectedTechnology.backend.length === 0) &&
          !results.detectedTechnology.cms &&
          (!results.detectedTechnology.frameworks ||
            results.detectedTechnology.frameworks.length === 0) &&
          (!results.detectedTechnology.libraries ||
            results.detectedTechnology.libraries.length === 0) &&
          (!results.detectedTechnology.technologies ||
            results.detectedTechnology.technologies.length === 0) &&
          (!results.detectedTechnology.services ||
            results.detectedTechnology.services.length === 0) && (
            <Text style={styles.noDataText}>No technologies were detected during the scan.</Text>
          )}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text>Generated by Security Scanner - {new Date().toLocaleDateString()}</Text>
        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          fixed
        />
      </View>
    </Page>
  </Document>
);

export const generatePDF = async (results: ScanResult, targetUrl: string) => {
  const blob = await pdf(<SecurityReportPDF results={results} targetUrl={targetUrl} />).toBlob();
  return blob;
};

export default SecurityReportPDF;
