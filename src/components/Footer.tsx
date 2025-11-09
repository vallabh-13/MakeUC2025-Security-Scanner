import React from 'react';
    import { Twitter, Mail, Trophy } from 'lucide-react';

    interface FooterProps {
      isDarkMode: boolean;
    }

    const Footer: React.FC<FooterProps> = ({ isDarkMode }) => {
      return (
        <footer className={`${isDarkMode ? 'bg-zinc-900' : 'bg-zinc-800'} text-white transition-colors duration-300`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="col-span-1 md:col-span-2">
                <div className="flex items-center space-x-3 mb-4">
                  <Trophy className={`h-8 w-8 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                  <h3 className="text-xl font-bold">Hackathon Security Scanner</h3>
                </div>
                <p className="text-slate-400 mb-4">
                  Built for the ultimate hackathon challenge! Comprehensive security analysis for your web applications. 
                  Detect vulnerabilities, analyze SSL configurations, and ensure your site is secure.
                </p>
                <p className="text-slate-400 mb-4">
                  <strong>Team:</strong> Meku Dev Squad | <strong>Project:</strong> Security Scanner v1.0
                </p>
                <div className="flex space-x-4">
                  <a href="#" className="text-slate-400 hover:text-white transition-colors">
                    <Twitter className="h-5 w-5" />
                  </a>
                  <a href="#" className="text-slate-400 hover:text-white transition-colors">
                    <Mail className="h-5 w-5" />
                  </a>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-4">Features</h4>
                <ul className="space-y-2 text-slate-400">
                  <li><a href="#" className="hover:text-white transition-colors">SSL Analysis</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Port Scanning</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Vulnerability Detection</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Software Analysis</a></li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-4">Support</h4>
                <ul className="space-y-2 text-slate-400">
                  <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">API Reference</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                </ul>
              </div>
            </div>
            
            <div className="border-t border-slate-700 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
              <p className="text-slate-400 text-sm">
                © 2025 Hackathon Security Scanner. All rights reserved.
              </p>
              <p className="text-slate-400 text-sm mt-2 md:mt-0">
                Powered by <a rel="nofollow" target="_blank" href="https://meku.dev" className="text-indigo-400 hover:text-indigo-300">Meku.dev</a>
              </p>
            </div>
          </div>
        </footer>
      );
    };

    export default Footer;