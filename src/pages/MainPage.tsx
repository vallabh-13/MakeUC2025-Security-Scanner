import React, { useState, useEffect } from 'react';
    import { motion } from 'framer-motion';
    import Header from '../components/Header';
    import Footer from '../components/Footer';
    import ScanForm from '../components/ScanForm';
    import ScanResults from '../components/ScanResults';
    import { toast } from 'react-toastify';
    import { Shield, Search, AlertTriangle, Bug, ExternalLink, Linkedin, Mail } from 'lucide-react';

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

    const MainPage: React.FC = () => {
      const [isScanning, setIsScanning] = useState(false);
      const [scanResults, setScanResults] = useState<ScanResult | null>(null);

      useEffect(() => {
        document.documentElement.classList.add('dark');
      }, []);

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
    SSL Issues: ${scanResults.sslLabs.issues.length}
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

      const scrollToSection = (sectionId: string) => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      };

      const teamMembers = [
        {
          name: 'Alice Johnson',
          role: 'Lead Developer',
          linkedin: 'https://linkedin.com/in/alicejohnson',
          email: 'alice@securityscanner.com',
          image: 'https://via.placeholder.com/150'
        },
        {
          name: 'Bob Smith',
          role: 'Security Analyst',
          linkedin: 'https://linkedin.com/in/bobsmith',
          email: 'bob@securityscanner.com',
          image: 'https://via.placeholder.com/150'
        },
        {
          name: 'Carol Davis',
          role: 'UI/UX Designer',
          linkedin: 'https://linkedin.com/in/caroldavis',
          email: 'carol@securityscanner.com',
          image: 'https://via.placeholder.com/150'
        },
        {
          name: 'David Wilson',
          role: 'Backend Engineer',
          linkedin: 'https://linkedin.com/in/davidwilson',
          email: 'david@securityscanner.com',
          image: 'https://via.placeholder.com/150'
        }
      ];

      const tools = [
        {
          name: 'SSL Labs',
          description: 'Comprehensive SSL/TLS certificate analysis and grading.',
          icon: <Shield className="h-8 w-8" />,
          link: 'https://www.ssllabs.com/ssltest/'
        },
        {
          name: 'Nmap',
          description: 'Network discovery and security auditing tool for port scanning.',
          icon: <Search className="h-8 w-8" />,
          link: 'https://nmap.org/'
        },
        {
          name: 'Nuclei',
          description: 'Fast and customizable vulnerability scanner based on simple YAML-based DSL.',
          icon: <AlertTriangle className="h-8 w-8" />,
          link: 'https://nuclei.projectdiscovery.io/'
        },
        {
          name: 'CVE Database',
          description: 'Comprehensive database of known vulnerabilities and exposures.',
          icon: <Bug className="h-8 w-8" />,
          link: 'https://cve.mitre.org/'
        }
      ];

      const steps = [
        {
          icon: <Search className="h-8 w-8" />,
          title: 'URL Input & Validation',
          description: 'User enters a website URL, which is validated for proper format before scanning begins.'
        },
        {
          icon: <Shield className="h-8 w-8" />,
          title: 'SSL Labs Analysis',
          description: 'Performs comprehensive SSL certificate analysis using SSL Labs API to check encryption strength and configuration.'
        },
        {
          icon: <AlertTriangle className="h-8 w-8" />,
          title: 'Nmap Port Scanning',
          description: 'Scans for open ports on the target server using Nmap to identify potential security risks.'
        },
        {
          icon: <Bug className="h-8 w-8" />,
          title: 'Nuclei Vulnerability Scan',
          description: 'Runs Nuclei templates to detect known vulnerabilities and misconfigurations.'
        },
        {
          icon: <Shield className="h-8 w-8" />,
          title: 'Software Detection & CVE Matching',
          description: 'Identifies software versions and matches them against known CVEs for comprehensive risk assessment.'
        }
      ];

      return (
        <div className="min-h-screen bg-zinc-900 transition-colors duration-300">
          <Header scrollToSection={scrollToSection} />
          
          {/* Home Section */}
          <section id="home" className="py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div 
                className="text-center mb-12"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <motion.h1 
                  className="text-4xl md:text-6xl font-bold mb-6 text-white"
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                >
                  Security Scanner
                </motion.h1>
                <motion.p 
                  className="text-xl text-slate-400 max-w-3xl mx-auto"
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
                <ScanForm onScanStart={handleScanStart} isScanning={isScanning} />
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
                  />
                </motion.div>
              )}
            </div>
          </section>

          {/* Demo Section */}
          <section id="demo" className="py-12 bg-zinc-800">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div 
                className="bg-zinc-700 rounded-lg shadow-lg p-8"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
              >
                <h2 className="text-3xl font-bold mb-6 text-white">Demo Video</h2>
                <div className="aspect-video mb-6">
                  <iframe
                    src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                    title="Security Scanner Demo"
                    className="w-full h-full rounded-lg"
                    allowFullScreen
                  ></iframe>
                </div>
                <p className="text-slate-400">
                  Watch this demo video to see the Security Scanner in action. It showcases the full scanning process, from URL input to detailed results display.
                </p>
              </motion.div>
            </div>
          </section>

          {/* Working Section */}
          <section id="working" className="py-12">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div 
                className="text-center mb-12"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
              >
                <h2 className="text-4xl font-bold mb-6 text-white">How It Works</h2>
                <p className="text-xl text-slate-400 max-w-3xl mx-auto">
                  Our Security Scanner uses a multi-layered approach to provide comprehensive security analysis for web applications.
                </p>
              </motion.div>

              <div className="space-y-8">
                {steps.map((step, index) => (
                  <motion.div
                    key={index}
                    className="bg-zinc-800 rounded-lg shadow-lg p-6"
                    initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.2, duration: 0.5 }}
                    viewport={{ once: true }}
                  >
                    <div className="flex items-start space-x-4">
                      <div className="p-3 rounded-lg bg-indigo-600 text-white">
                        {step.icon}
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold mb-2 text-white">{step.title}</h3>
                        <p className="text-slate-400">{step.description}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <motion.div 
                className="bg-zinc-800 rounded-lg shadow-lg p-8 mt-12"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.5 }}
                viewport={{ once: true }}
              >
                <h3 className="text-2xl font-bold mb-4 text-white">Tools Used</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="text-center">
                    <Shield className="h-12 w-12 mx-auto mb-2 text-indigo-400" />
                    <h4 className="font-semibold text-white">SSL Labs</h4>
                    <p className="text-sm text-slate-400">SSL certificate analysis</p>
                  </div>
                  <div className="text-center">
                    <Search className="h-12 w-12 mx-auto mb-2 text-indigo-400" />
                    <h4 className="font-semibold text-white">Nmap</h4>
                    <p className="text-sm text-slate-400">Port scanning</p>
                  </div>
                  <div className="text-center">
                    <AlertTriangle className="h-12 w-12 mx-auto mb-2 text-indigo-400" />
                    <h4 className="font-semibold text-white">Nuclei</h4>
                    <p className="text-sm text-slate-400">Vulnerability scanning</p>
                  </div>
                  <div className="text-center">
                    <Bug className="h-12 w-12 mx-auto mb-2 text-indigo-400" />
                    <h4 className="font-semibold text-white">CVE Database</h4>
                    <p className="text-sm text-slate-400">Software vulnerability matching</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </section>

          {/* Team Section */}
          <section id="team" className="py-12 bg-zinc-800">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div 
                className="text-center mb-12"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
              >
                <h2 className="text-4xl font-bold mb-6 text-white">Our Team</h2>
                <p className="text-xl text-slate-400 max-w-3xl mx-auto">
                  Meet the talented individuals behind the Security Scanner project.
                </p>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {teamMembers.map((member, index) => (
                  <motion.div
                    key={index}
                    className="bg-zinc-700 rounded-lg shadow-lg p-6 text-center"
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    viewport={{ once: true }}
                  >
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
                    />
                    <h3 className="text-xl font-semibold mb-2 text-white">{member.name}</h3>
                    <p className="text-sm mb-4 text-slate-400">{member.role}</p>
                    <div className="flex justify-center space-x-4">
                      <a
                        href={member.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-full transition-colors text-slate-400 hover:text-blue-400"
                      >
                        <Linkedin className="h-5 w-5" />
                      </a>
                      <a
                        href={`mailto:${member.email}`}
                        className="p-2 rounded-full transition-colors text-slate-400 hover:text-red-400"
                      >
                        <Mail className="h-5 w-5" />
                      </a>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* Tools Section */}
          <section id="tools" className="py-12">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div 
                className="text-center mb-12"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
              >
                <h2 className="text-4xl font-bold mb-6 text-white">Tools Used</h2>
                <p className="text-xl text-slate-400 max-w-3xl mx-auto">
                  Our Security Scanner leverages industry-standard tools for comprehensive security analysis.
                </p>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {tools.map((tool, index) => (
                  <motion.div
                    key={index}
                    className="bg-zinc-800 rounded-lg shadow-lg p-6"
                    initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    viewport={{ once: true }}
                  >
                    <div className="flex items-start space-x-4">
                      <div className="p-3 rounded-lg bg-indigo-600 text-white">
                        {tool.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-xl font-semibold text-white">{tool.name}</h3>
                          <a
                            href={tool.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-full transition-colors text-slate-400 hover:text-indigo-400"
                          >
                            <ExternalLink className="h-5 w-5" />
                          </a>
                        </div>
                        <p className="text-slate-400">{tool.description}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          <Footer />
        </div>
      );
    };

    export default MainPage;