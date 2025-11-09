import React, { useState, useEffect } from 'react';
    import { motion } from 'framer-motion';
    import Header from '../components/Header';
    import Footer from '../components/Footer';

    const Demo: React.FC = () => {
      const [isDarkMode, setIsDarkMode] = useState(true);

      useEffect(() => {
        if (isDarkMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }, [isDarkMode]);

      return (
        <div className={`min-h-screen ${isDarkMode ? 'bg-zinc-900' : 'bg-slate-50'} transition-colors duration-300`}>
          <Header isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
          
          <main className="py-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div 
                className={`${isDarkMode ? 'bg-zinc-800' : 'bg-white'} rounded-lg shadow-lg p-8`}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <h1 className={`text-3xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-zinc-800'}`}>Demo Video</h1>
                <div className="aspect-video mb-6">
                  <iframe
                    src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                    title="Security Scanner Demo"
                    className="w-full h-full rounded-lg"
                    allowFullScreen
                  ></iframe>
                </div>
                <p className={`${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  Watch this demo video to see the Security Scanner in action. It showcases the full scanning process, from URL input to detailed results display.
                </p>
              </motion.div>
            </div>
          </main>

          <Footer isDarkMode={isDarkMode} />
        </div>
      );
    };

    export default Demo;