import React from 'react';
    import { Shield, Github, Sun, Moon } from 'lucide-react';
    import { motion } from 'framer-motion';

    interface HeaderProps {
      scrollToSection: (sectionId: string) => void;
      isDarkMode: boolean;
      toggleDarkMode: () => void;
    }

    const Header: React.FC<HeaderProps> = ({ scrollToSection, isDarkMode, toggleDarkMode }) => {
      const navItems = [
        { name: 'Home', id: 'home' },
        { name: 'Demo', id: 'demo' },
        { name: 'Workflow', id: 'working' },
        { name: 'Team', id: 'team' },
        { name: 'Tools', id: 'tools' },
      ];

      return (
        <header className="bg-zinc-800 border-slate-700 border-b transition-colors duration-300 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-3">
                <Shield className="h-8 w-8 text-indigo-400" />
                <h1 className="text-2xl font-bold text-white">Security Scanner</h1>
              </div>
              <nav className="hidden md:flex space-x-8">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => scrollToSection(item.id)}
                    className="font-medium transition-colors hover:text-indigo-400 text-slate-400"
                  >
                    {item.name}
                  </button>
                ))}
              </nav>
              <div className="flex items-center space-x-4">
                <motion.a
                  href="https://github.com/vallabh-13/MakeUC2025-Security-Scanner"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg transition-colors hover:bg-zinc-700 text-slate-400 hover:text-white"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Github className="h-5 w-5" />
                </motion.a>
                <button
                  onClick={toggleDarkMode}
                  className="p-2 rounded-lg transition-colors hover:bg-zinc-700 text-slate-400 hover:text-white"
                >
                  {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </button>
              </div>
            </div>
            <div className="md:hidden flex justify-center space-x-4 py-2 border-t border-slate-700">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className="font-medium transition-colors hover:text-indigo-400 text-slate-400"
                >
                  {item.name}
                </button>
              ))}
            </div>
          </div>
        </header>
      );
    };

    export default Header;