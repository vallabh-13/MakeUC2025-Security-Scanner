import React, { useState, useEffect } from 'react';
    import { motion } from 'framer-motion';
    import Header from '../components/Header';
    import Footer from '../components/Footer';
    import ScanForm from '../components/ScanForm';
    import ScanResults from '../components/ScanResults';
    import { toast } from 'react-toastify';
    import { Shield, Search, AlertTriangle, Bug, ExternalLink, Linkedin, Mail } from 'lucide-react';
    import io from 'socket.io-client';



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

        const MainPage: React.FC = () => {
      const [isScanning, setIsScanning] = useState(false);
      const [scanResults, setScanResults] = useState<ScanResult | null>(null);
      const [isDarkMode, setIsDarkMode] = useState(true);
      const [socket, setSocket] = useState<any>(null);

      useEffect(() => {
        document.documentElement.classList.add('dark');

        const socketUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
        const newSocket = io(socketUrl);
        setSocket(newSocket);

        newSocket.on('scan:progress', (data) => {
          // Only show toasts for key progress steps
          const importantSteps = ['start', 'detection', 'parallel-scans', 'aggregate'];
          if (importantSteps.includes(data.step)) {
            toast.info(data.message, {
              style: {
                background: '#000000',
                color: '#ffffff',
                border: '1px solid #333333'
              }
            });
          }
        });

        newSocket.on('scan:step-complete', (data) => {
          // Only show completion toasts for main scan steps
          const mainSteps = ['detection', 'ssl', 'ports', 'nuclei', 'cve'];
          if (mainSteps.includes(data.step)) {
            const stepNames = {
              'detection': 'Technology Detection',
              'ssl': 'SSL/TLS Analysis',
              'ports': 'Port Scanning',
              'nuclei': 'Vulnerability Scanning',
              'cve': 'CVE Database Check'
            };
            toast.success(`${stepNames[data.step]} complete!`, {
              style: {
                background: '#000000',
                color: '#ffffff',
                border: '1px solid #22c55e'
              }
            });
          }
        });

        newSocket.on('scan:complete', (data) => {
          setScanResults(data.results);
          setIsScanning(false);
          toast.success('Scan completed successfully!', {
            style: {
              background: '#000000',
              color: '#ffffff',
              border: '1px solid #22c55e'
            }
          });
        });

        newSocket.on('scan:failed', (data) => {
          setIsScanning(false);
          toast.error(data.error, {
            style: {
              background: '#000000',
              color: '#ffffff',
              border: '1px solid #ef4444'
            }
          });
        });

        return () => {
          newSocket.disconnect();
        };
      }, []);

      const toggleDarkMode = () => {
        setIsDarkMode(!isDarkMode);
        document.documentElement.classList.toggle('dark');
      };

      const handleScanStart = async (url: string) => {
        setIsScanning(true);
        setScanResults(null);

        try {
          // Check backend health first
          const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
          const healthResponse = await fetch(`${backendUrl}/api/health`);
          if (!healthResponse.ok) {
            throw new Error('Backend service unavailable');
          }

          // Start the scan
          const scanResponse = await fetch(`${backendUrl}/api/scan`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url, socketId: socket?.id }),
          });

          if (!scanResponse.ok) {
            const errorData = await scanResponse.json().catch(() => ({ error: 'Scan failed' }));
            throw new Error(errorData.error || 'Scan failed');
          }

        } catch (error: any) {
          setIsScanning(false);
          toast.error(error.message || 'An error occurred', {
            style: {
              background: '#000000',
              color: '#ffffff',
              border: '1px solid #ef4444'
            }
          });
        }
      };

      const handleDownloadReport = async () => {
        if (!scanResults) return;

        try {
          const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
          const targetUrl = scanResults.url || 'Unknown';
          const response = await fetch(`${backendUrl}/api/report/${Date.now()}/pdf?results=${encodeURIComponent(JSON.stringify(scanResults))}&url=${encodeURIComponent(targetUrl)}`);
          if (!response.ok) {
            throw new Error('Failed to download report');
          }
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `security-report-${Date.now()}.pdf`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          toast.success('Report downloaded successfully!', {
            style: {
              background: '#000000',
              color: '#ffffff',
              border: '1px solid #22c55e'
            }
          });
        } catch (error: any) {
          toast.error(error.message || 'Failed to download report', {
            style: {
              background: '#000000',
              color: '#ffffff',
              border: '1px solid #ef4444'
            }
          });
        }
      };

      const scrollToSection = (sectionId: string) => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      };

      const teamMembers = [
        {
          name: 'An Nguyen Le',
          role: 'Major: Computer Science',
          linkedin: 'https://www.linkedin.com/in/an-nguyen-le-782788342/',
          email: 'le2ne@mail.uc.com',
          image: 'https://media.licdn.com/dms/image/v2/D4E03AQHMXm6Cfrzk-Q/profile-displayphoto-shrink_200_200/B4EZX8Z84dHkAk-/0/1743696417484?e=1764201600&v=beta&t=vwqBb4lZR5KPhOOsPtk8NughTjc8LB0kAqRGBQPP38o'
        },
        {
          name: 'Nhi T.Le ',
          role: 'Major: Computer Science',
          linkedin: 'https://www.linkedin.com/in/nhiledn06/',
          email: 'le2nt@mail.uc.edu',
          image: 'https://media.licdn.com/dms/image/v2/D4E03AQEQnZxscjdWcw/profile-displayphoto-scale_200_200/B4EZlZUqW1IwAc-/0/1758140213294?e=1764201600&v=beta&t=MgMCSOP_5BvnxvorAAZvLWSoSm194Tjo5XPTY9rY5Qo'
        },
        {
          name: 'Bhanudas Mahadik',
          role: 'Major: Information technology',
          linkedin: 'https://www.linkedin.com/in/bhanudas-mahadik/',
          email: 'mahadibr@mail.uc.edu',
          image: 'https://media.licdn.com/dms/image/v2/D4D03AQGXK_1nT8f8Kg/profile-displayphoto-shrink_200_200/B4DZRHPxtCHYAY-/0/1736362106020?e=1764201600&v=beta&t=C_S-sDvdyvQSd78qEM97Fqhk-qsdDtrb0BQ8AIAEMT4'
        },
        {
          name: 'Ilyaas Kapadia',
          role: 'Major: Computer Science',
          linkedin: 'https://www.linkedin.com/in/ilyaask/',
          email: 'kapadiiy@mail.uc.edu',
          image: 'https://media.licdn.com/dms/image/v2/D5603AQGSgsjoxDe_Cg/profile-displayphoto-crop_800_800/B56Zot5UO0HIAI-/0/1761706591678?e=1764201600&v=beta&t=ox4X_vqtFDcNSI8_0CAVKFKGzQLwBO2pymsxrIea-VE'
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
          link: 'https://docs.projectdiscovery.io/opensource/nuclei/overview#what-is-nuclei'
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
          description: 'Performs comprehensive SSL certificate analysis using SSL Labs to check encryption strength and configuration.'
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
          title: 'Results',
          description: 'View the scan summary, access all security findings, and download the PDF report instantly.'
        }
      ];

      return (
        <div className={`min-h-screen ${isDarkMode ? 'bg-zinc-900' : 'bg-white'} transition-colors duration-300`}>
          <Header scrollToSection={scrollToSection} isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
          
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
                                  className={`text-4xl md:text-6xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}
                                  initial={{ scale: 0.8 }}
                                  animate={{ scale: 1 }}
                                  transition={{ delay: 0.2, duration: 0.5 }}
                                >                  Security Scanner
                </motion.h1>
                <motion.p 
                  className="text-xl text-slate-400 max-w-3xl mx-auto"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                >
                  Comprehensive security analysis for your web applications. <br/>
                  Detect vulnerabilities, analyze SSL configurations, scan for open ports, and identify common vulnerabilities and exposures.
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
                  Watch this demo video to see the security scanner workflow. It showcases the full scanning process, from URL input to detailed results display.
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
                  Our system runs Nmap for port scanning and Nuclei for vulnerability checks simultaneously, delivering security analysis.
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
                  Meet the individuals who build the security scanner project.
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
                  Our security scanner leverages following tools for security analysis.
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
          <Footer isDarkMode={isDarkMode} />
        </div>
      );
    };

    export default MainPage;