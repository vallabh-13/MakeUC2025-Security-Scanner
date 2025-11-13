
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@radix-ui/react-tabs';
import { AlertTriangle, Bug, Download, CheckCircle, BarChart } from 'lucide-react';
import { motion } from 'framer-motion';

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
  scanErrors: {
    ssl: string | null;
    nmap: string | null;
    nuclei: string | null;
    detection: string | null;
  };
}

interface ScanResultsProps {
  results: ScanResult | null;
  onDownloadReport: () => void;
}

const ScanResults: React.FC<ScanResultsProps> = ({ results, onDownloadReport }) => {
  if (!results) return null;

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'high': return 'text-red-500 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-blue-600 bg-blue-50';
      case 'info': return 'text-cyan-600 bg-cyan-50';
      default: return 'text-cyan-600 bg-cyan-50';
    }
  };

  return (
    <motion.div 
      className="max-w-6xl mx-auto bg-zinc-800 rounded-lg shadow-lg p-6 transition-colors duration-300"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Scan Results</h2>
        <button
          onClick={onDownloadReport}
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center space-x-2"
        >
          <Download className="h-4 w-4" />
          <span>Download Report</span>
        </button>
      </div>

      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-zinc-700">
          <TabsTrigger value="summary" className="text-white">Summary</TabsTrigger>
          <TabsTrigger value="findings" className="text-white">Findings</TabsTrigger>
          <TabsTrigger value="technology" className="text-white">Detected Technology</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="mt-6 bg-zinc-700 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <BarChart className="h-6 w-6 text-indigo-400" />
            <h3 className="text-xl font-semibold text-white">Scan Summary</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-zinc-600 p-4 rounded-lg text-center">
              <h4 className="text-4xl font-bold text-white">{results.score}</h4>
              <p className="text-slate-400">Security Score</p>
            </div>
            <div className="bg-zinc-600 p-4 rounded-lg text-center">
              <h4 className="text-4xl font-bold text-white">{results.grade}</h4>
              <p className="text-slate-400">Security Grade</p>
            </div>
            <div className="bg-zinc-600 p-4 rounded-lg text-center">
              <h4 className="text-4xl font-bold text-white">{results.totalIssues}</h4>
              <p className="text-slate-400">Total Issues</p>
            </div>
          </div>
          <div className="mt-6">
            <h4 className="text-lg font-semibold text-white mb-2">Issues by Severity</h4>
            <div className="flex justify-around bg-zinc-600 p-4 rounded-lg">
              {Object.entries(results.severityCounts).map(([severity, count]) => (
                <div key={severity} className="text-center">
                  <p className={`text-2xl font-bold ${getSeverityColor(severity).split(' ')[0]}`}>{count}</p>
                  <p className="text-sm text-slate-400 capitalize">{severity}</p>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="findings" className="mt-6 bg-zinc-700 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <AlertTriangle className="h-6 w-6 text-indigo-400" />
            <h3 className="text-xl font-semibold text-white">Findings</h3>
          </div>
          <div className="space-y-4">
            {results.findings.length > 0 ? (
              results.findings.map((finding, index) => (
                <div key={index} className="bg-zinc-600 rounded-lg p-4 border-l-4 border-red-400">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-white">{finding.title}</h4>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(finding.severity)}`}>
                      {finding.severity}
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm mb-2">{finding.description}</p>
                  <p className="text-slate-400 text-sm"><span className="font-semibold text-white">Recommendation:</span> {finding.recommendation}</p>
                </div>
              ))
            ) : (
              <div className="flex items-center space-x-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span>No vulnerabilities detected</span>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="technology" className="mt-6 bg-zinc-700 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Bug className="h-6 w-6 text-indigo-400" />
            <h3 className="text-xl font-semibold text-white">Detected Technology</h3>
          </div>
          <div className="space-y-4">
            {/* Web Server */}
            {results.detectedTechnology.webServer && (
              <div className="bg-zinc-600 rounded-lg p-4">
                <h4 className="font-semibold text-white mb-2">Web Server</h4>
                <p className="text-slate-400">{results.detectedTechnology.webServer.name} {results.detectedTechnology.webServer.version}</p>
              </div>
            )}

            {/* Backend Technologies */}
            {results.detectedTechnology.backend && results.detectedTechnology.backend.length > 0 && (
              <div className="bg-zinc-600 rounded-lg p-4">
                <h4 className="font-semibold text-white mb-2">Backend Technologies</h4>
                <ul className="list-disc list-inside space-y-1">
                  {results.detectedTechnology.backend.map((tech, index) => (
                    <li key={index} className="text-slate-400">{tech}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* CMS */}
            {results.detectedTechnology.cms && (
              <div className="bg-zinc-600 rounded-lg p-4">
                <h4 className="font-semibold text-white mb-2">Content Management System</h4>
                <p className="text-slate-400">{results.detectedTechnology.cms}</p>
              </div>
            )}

            {/* Frameworks */}
            {results.detectedTechnology.frameworks && results.detectedTechnology.frameworks.length > 0 && (
              <div className="bg-zinc-600 rounded-lg p-4">
                <h4 className="font-semibold text-white mb-2">Frameworks</h4>
                <ul className="list-disc list-inside space-y-1">
                  {results.detectedTechnology.frameworks.map((framework, index) => (
                    <li key={index} className="text-slate-400">{framework}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Libraries */}
            {results.detectedTechnology.libraries && results.detectedTechnology.libraries.length > 0 && (
              <div className="bg-zinc-600 rounded-lg p-4">
                <h4 className="font-semibold text-white mb-2">Libraries</h4>
                <ul className="list-disc list-inside space-y-1">
                  {results.detectedTechnology.libraries.map((lib, index) => (
                    <li key={index} className="text-slate-400">{lib.name} {lib.version}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Technologies */}
            {results.detectedTechnology.technologies && results.detectedTechnology.technologies.length > 0 && (
              <div className="bg-zinc-600 rounded-lg p-4">
                <h4 className="font-semibold text-white mb-2">Additional Technologies</h4>
                <ul className="list-disc list-inside space-y-1">
                  {results.detectedTechnology.technologies.map((tech, index) => (
                    <li key={index} className="text-slate-400">{tech}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Services (from port scan) */}
            {results.detectedTechnology.services && results.detectedTechnology.services.length > 0 && (
              <div className="bg-zinc-600 rounded-lg p-4">
                <h4 className="font-semibold text-white mb-2">Network Services</h4>
                <ul className="list-disc list-inside space-y-1">
                  {results.detectedTechnology.services.map((service, index) => (
                    <li key={index} className="text-slate-400">
                      Port {service.port}/{service.protocol} - {service.service}
                      {service.product && ` (${service.product}${service.version ? ' ' + service.version : ''})`}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* No technology detected message */}
            {!results.detectedTechnology.webServer &&
             (!results.detectedTechnology.backend || results.detectedTechnology.backend.length === 0) &&
             !results.detectedTechnology.cms &&
             (!results.detectedTechnology.frameworks || results.detectedTechnology.frameworks.length === 0) &&
             (!results.detectedTechnology.libraries || results.detectedTechnology.libraries.length === 0) &&
             (!results.detectedTechnology.technologies || results.detectedTechnology.technologies.length === 0) &&
             (!results.detectedTechnology.services || results.detectedTechnology.services.length === 0) && (
              <div className="bg-zinc-600 rounded-lg p-4 text-center">
                <p className="text-slate-400">No technologies were detected during the scan.</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default ScanResults;