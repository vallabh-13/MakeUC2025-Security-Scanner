import React, { useState, useEffect } from 'react';
    import { motion } from 'framer-motion';
    import Header from '../components/Header';
    import Footer from '../components/Footer';
    import { Linkedin, Mail } from 'lucide-react';

    const Team: React.FC = () => {
      const [isDarkMode, setIsDarkMode] = useState(true);

      useEffect(() => {
        if (isDarkMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }, [isDarkMode]);

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
                <h1 className={`text-4xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-zinc-800'}`}>Our Team</h1>
                <p className={`text-xl ${isDarkMode ? 'text-slate-400' : 'text-slate-600'} max-w-3xl mx-auto`}>
                  Meet the talented individuals behind the Security Scanner project.
                </p>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {teamMembers.map((member, index) => (
                  <motion.div
                    key={index}
                    className={`${isDarkMode ? 'bg-zinc-800' : 'bg-white'} rounded-lg shadow-lg p-6 text-center`}
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                  >
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
                    />
                    <h3 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-zinc-800'}`}>{member.name}</h3>
                    <p className={`text-sm mb-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{member.role}</p>
                    <div className="flex justify-center space-x-4">
                      <a
                        href={member.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`p-2 rounded-full transition-colors ${isDarkMode ? 'text-slate-400 hover:text-blue-400' : 'text-slate-600 hover:text-blue-600'}`}
                      >
                        <Linkedin className="h-5 w-5" />
                      </a>
                      <a
                        href={`mailto:${member.email}`}
                        className={`p-2 rounded-full transition-colors ${isDarkMode ? 'text-slate-400 hover:text-red-400' : 'text-slate-600 hover:text-red-600'}`}
                      >
                        <Mail className="h-5 w-5" />
                      </a>
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

    export default Team;