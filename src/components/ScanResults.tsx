import React from 'react';
    import { Tabs, TabsContent, TabsList, TabsTrigger } from '@radix-ui/react-tabs';
    import { Shield, Server, AlertTriangle, Bug, Download, CheckCircle, XCircle } from 'lucide-react';
    import { motion } from 'framer-motion';

    interface ScanResult {
      url: string;
      sslLabs: {
        grade: string;
        score: number;
        issues: string[];
      };
      nmap: {
        openPorts: Array<{ port: number; service: string; state: string }>;
      };
      nuclei: {
        vulnerabilities: Array<{ severity: string; title: string; description: string }>;
      };
      software: {
        detected: Array<{ name: string; version: string; cves: string[] }>;
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
          default: return 'text-slate-600 bg-slate-50';
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
            <h2 className="text-2xl font-bold text-white">Scan Results for {results.url}</h2>
            <button
              onClick={onDownloadReport}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Download Report</span>
            </button>
          </div>

          <Tabs defaultValue="ssl" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-zinc-700">
              <TabsTrigger value="ssl" className="text-white">SSL Labs</TabsTrigger>
              <TabsTrigger value="nmap" className="text-white">Open Ports</TabsTrigger>
              <TabsTrigger value="nuclei" className="text-white">Vulnerabilities</TabsTrigger>
              <TabsTrigger value="software" className="text-white">Software</TabsTrigger>
            </TabsList>

            <TabsContent value="ssl" className="mt-6 bg-zinc-700 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Shield className="h-6 w-6 text-indigo-400" />
                <h3 className="text-xl font-semibold text-white">SSL Labs Analysis</h3>
              </div>
              <div className="space-y-4">
                {results.sslLabs.issues.length > 0 ? (
                  <div>
                    <h4 className="font-medium mb-2 text-white">Issues Found:</h4>
                    <ul className="space-y-1">
                      {results.sslLabs.issues.map((issue, index) => (
                        <li key={index} className="text-sm text-red-600 flex items-center space-x-2">
                          <XCircle className="h-4 w-4" />
                          <span>{issue}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span>No issues found</span>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="nmap" className="mt-6 bg-zinc-700 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Server className="h-6 w-6 text-indigo-400" />
                <h3 className="text-xl font-semibold text-white">Open Ports</h3>
              </div>
              <div className="space-y-3">
                {results.nmap.openPorts.length > 0 ? (
                  results.nmap.openPorts.map((port, index) => (
                    <div key={index} className="flex items-center justify-between bg-zinc-600 rounded p-3">
                      <div>
                        <span className="font-semibold text-white">Port {port.port}</span>
                        <span className="text-slate-400 ml-2">({port.service})</span>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        port.state === 'open' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                      }`}>
                        {port.state}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center space-x-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span>No open ports detected</span>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="nuclei" className="mt-6 bg-zinc-700 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-4">
                <AlertTriangle className="h-6 w-6 text-indigo-400" />
                <h3 className="text-xl font-semibold text-white">Vulnerability Scan</h3>
              </div>
              <div className="space-y-4">
                {results.nuclei.vulnerabilities.length > 0 ? (
                  results.nuclei.vulnerabilities.map((vuln, index) => (
                    <div key={index} className="bg-zinc-600 rounded-lg p-4 border-l-4 border-red-400">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-white">{vuln.title}</h4>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(vuln.severity)}`}>
                          {vuln.severity}
                        </span>
                      </div>
                      <p className="text-slate-400 text-sm">{vuln.description}</p>
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

            <TabsContent value="software" className="mt-6 bg-zinc-700 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Bug className="h-6 w-6 text-indigo-400" />
                <h3 className="text-xl font-semibold text-white">Software Detection & CVEs</h3>
              </div>
              <div className="space-y-4">
                {results.software.detected.length > 0 ? (
                  results.software.detected.map((software, index) => (
                    <div key={index} className="bg-zinc-600 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-white">{software.name}</h4>
                        <span className="text-slate-400 text-sm">v{software.version}</span>
                      </div>
                      {software.cves.length > 0 && (
                        <div>
                          <p className="text-sm mb-2 text-slate-400">Associated CVEs:</p>
                          <div className="flex flex-wrap gap-2">
                            {software.cves.map((cve, cveIndex) => (
                              <span key={cveIndex} className="px-2 py-1 bg-red-100 text-red-600 text-xs rounded">
                                {cve}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="flex items-center space-x-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span>No software detected</span>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      );
    };

    export default ScanResults;