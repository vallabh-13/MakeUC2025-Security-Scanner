import React, { useState, useEffect } from 'react';
    import Header from '../components/Header';
    import Footer from '../components/Footer';

    const About: React.FC = () => {
      const [isDarkMode, setIsDarkMode] = useState(false);

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
              <div className={`${isDarkMode ? 'bg-zinc-800' : 'bg-white'} rounded-lg shadow-lg p-8`}>
                <h1 className={`text-3xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-zinc-800'}`}>About Security Scanner</h1>
                <div className="prose prose-slate max-w-none">
                  <p className={`text-lg ${isDarkMode ? 'text-slate-400' : 'text-slate-600'} mb-6`}>
                    Coming soon... Ask Meku to generate content for this page.
                  </p>
                </div>
              </div>
            </div>
          </main>

          <Footer isDarkMode={isDarkMode} />
        </div>
      );
    };

    export default About;