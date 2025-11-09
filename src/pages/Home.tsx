import React, { useState, useEffect } from 'react';
    import { motion } from 'framer-motion';
    import Header from '../components/Header';
    import Footer from '../components/Footer';
    import ScanForm from '../components/ScanForm';
    import ScanResults from '../components/ScanResults';
    import { toast } from 'react-toastify';

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

    const Home: React.FC = () => {
      const [isScanning, setIsScanning] = useState(false);
      const [scanResults, setScanResults] = useState<ScanResult | null>(null);
      const [isDarkMode, setIsDarkMode] = useState(true);

      useEffect(() => {
        if (isDarkMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }, [isDarkMode]);

      const handleScanStart = async (url: string) => {
        setIsScanning(true);
        setScanResults(null);
        
        try {
          // Check backend health first
          const healthResponse = await fetch('/api/health');
          if (!healthResponse.ok) {
            throw new Error('Backend service unavailable');
          }

          // Start the scan
          const scanResponse = await fetch('/api/scan', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url }),
          });

          if (!scanResponse.ok) {
            throw new Error('Scan failed');
          }

          const results = await scanResponse.json();
          setScanResults(results);
          toast.success('Scan completed successfully!');
        } catch (error) {
          // Mock results for demo purposes when backend is not available
          toast.info('Using demo results - connect backend for live scanning');
          
          // Simulate scan delay
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          const mockResults: ScanResult = {
            url,
            sslLabs: {
              grade: 'A',
              score: 85,
              issues: ['Weak cipher suites detected']
            },
            nmap: {
              openPorts: [
                { port: 80, service: 'HTTP', state: 'open' },
                { port: 443, service: 'HTTPS', state: 'open' }
              ]
            },
            nuclei: {
              vulnerabilities: [
                {
                  severity: 'Medium',
                  title: 'Missing Security Headers',
                  description: 'The application is missing important security headers like X-Frame-Options and Content-Security-Policy.'
                }
              ]
            },
            software: {
              detected: [
                {
                  name: 'Apache',
                  version: '2.4.41',
                  cves: ['CVE-2021-44790', 'CVE-2021-44224']
                }
              ]
            }
          };
          
          setScanResults(mockResults);
        } finally {
          setIsScanning(false);
        }
      };

      const handleDownloadReport = () => {
        if (!scanResults) return;
        
        // Mock PDF download
        toast.info('PDF report generation - connect backend for full functionality');
        
        // Create a simple text report for demo
        const reportContent = `Security Scan Report
    URL: ${scanResults.url}
    SSL Grade: ${scanResults.sslLabs.grade}
    Open Ports: ${scanResults.nmap.openPorts.length}
    Vulnerabilities: ${scanResults.nuclei.vulnerabilities.length}
    Software Detected: ${scanResults.software.detected.length}`;
        
        const blob = new Blob([reportContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `security-report-${Date.now()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      };

      return (
        <div className={`min-h-screen ${isDarkMode ? 'bg-zinc-900' : 'bg-slate-50'} transition-colors duration-300`}>
          <Header isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
          
          <main className="py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div 
                className="text-center mb-12"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <motion.h1 
                  className={`text-4xl md:text-6xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-zinc-800'}`}
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                >
                  Security Scanner
                </motion.h1>
                <motion.p 
                  className={`text-xl ${isDarkMode ? 'text-slate-400' : 'text-slate-400'} max-w-3xl mx-auto`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                >
                  Comprehensive security analysis for your web applications. 
                  Detect vulnerabilities, analyze SSL configurations, scan for open ports, and identify software versions with CVE matching.
                </motion.p>
              </motion.div>

              <motion.div 
                className="mb-12"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
              >
                <ScanForm onScanStart={handleScanStart} isScanning={isScanning} isDarkMode={isDarkMode} />
              </motion.div>

              {scanResults && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8, duration: 0.5 }}
                >
                  <ScanResults 
                    results={scanResults} 
                    onDownloadReport={handleDownloadReport}
                    isDarkMode={isDarkMode}
                  />
                </motion.div>
              )}
            </div>
          </main>

          <Footer isDarkMode={isDarkMode} />
        </div>
      );
    };

    export default Home;