import React, { useState, useEffect } from 'react';
    import { motion } from 'framer-motion';
    import Header from '../components/Header';
    import Footer from '../components/Footer';
    import { Shield, Search, AlertTriangle, Bug } from 'lucide-react';

    const Working: React.FC = () => {
      const [isDarkMode, setIsDarkMode] = useState(true);

      useEffect(() => {
        if (isDarkMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }, [isDarkMode]);

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
        <div className={`min-h-screen ${isDarkMode ? 'bg-zinc-900' : 'bg-slate-50'} transition-colors duration-300`}>
          <Header isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
          
          <main className="py-12">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div 
                className="text-center mb-12"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <h1 className={`text-4xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-zinc-800'}`}>How It Works</h1>
                <p className={`text-xl ${isDarkMode ? 'text-slate-400' : 'text-slate-600'} max-w-3xl mx-auto`}>
                  Our Security Scanner uses a multi-layered approach to provide comprehensive security analysis for web applications.
                </p>
              </motion.div>

              <div className="space-y-8">
                {steps.map((step, index) => (
                  <motion.div
                    key={index}
                    className={`${isDarkMode ? 'bg-zinc-800' : 'bg-white'} rounded-lg shadow-lg p-6`}
                    initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.2, duration: 0.5 }}
                  >
                    <div className="flex items-start space-x-4">
                      <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-indigo-600' : 'bg-indigo-500'} text-white`}>
                        {step.icon}
                      </div>
                      <div>
                        <h3 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-zinc-800'}`}>{step.title}</h3>
                        <p className={`${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{step.description}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <motion.div 
                className={`${isDarkMode ? 'bg-zinc-800' : 'bg-white'} rounded-lg shadow-lg p-8 mt-12`}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.5 }}
              >
                <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-zinc-800'}`}>Tools Used</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="text-center">
                    <Shield className={`h-12 w-12 mx-auto mb-2 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                    <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-zinc-800'}`}>SSL Labs</h3>
                    <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>SSL certificate analysis</p>
                  </div>
                  <div className="text-center">
                    <Search className={`h-12 w-12 mx-auto mb-2 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                    <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-zinc-800'}`}>Nmap</h3>
                    <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Port scanning</p>
                  </div>
                  <div className="text-center">
                    <AlertTriangle className={`h-12 w-12 mx-auto mb-2 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                    <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-zinc-800'}`}>Nuclei</h3>
                    <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Vulnerability scanning</p>
                  </div>
                  <div className="text-center">
                    <Bug className={`h-12 w-12 mx-auto mb-2 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                    <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-zinc-800'}`}>CVE Database</h3>
                    <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Software vulnerability matching</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </main>

          <Footer isDarkMode={isDarkMode} />
        </div>
      );
    };

    export default Working;