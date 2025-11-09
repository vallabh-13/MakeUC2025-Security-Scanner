import React, { useState, useEffect } from 'react';
    import { motion } from 'framer-motion';
    import Header from '../components/Header';
    import Footer from '../components/Footer';
    import { Shield, Search, AlertTriangle, Bug, ExternalLink } from 'lucide-react';

    const Tools: React.FC = () => {
      const [isDarkMode, setIsDarkMode] = useState(true);

      useEffect(() => {
        if (isDarkMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }, [isDarkMode]);

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
                <h1 className={`text-4xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-zinc-800'}`}>Tools Used</h1>
                <p className={`text-xl ${isDarkMode ? 'text-slate-400' : 'text-slate-600'} max-w-3xl mx-auto`}>
                  Our Security Scanner leverages industry-standard tools for comprehensive security analysis.
                </p>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {tools.map((tool, index) => (
                  <motion.div
                    key={index}
                    className={`${isDarkMode ? 'bg-zinc-800' : 'bg-white'} rounded-lg shadow-lg p-6`}
                    initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                  >
                    <div className="flex items-start space-x-4">
                      <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-indigo-600' : 'bg-indigo-500'} text-white`}>
                        {tool.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-zinc-800'}`}>{tool.name}</h3>
                          <a
                            href={tool.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`p-2 rounded-full transition-colors ${isDarkMode ? 'text-slate-400 hover:text-indigo-400' : 'text-slate-600 hover:text-indigo-600'}`}
                          >
                            <ExternalLink className="h-5 w-5" />
                          </a>
                        </div>
                        <p className={`${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{tool.description}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </main>

          <Footer isDarkMode={isDarkMode} />
        </div>
      );
    };

    export default Tools;