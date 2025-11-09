import React from 'react';
import { Twitter, Mail, Trophy } from 'lucide-react';

interface FooterProps {
  isDarkMode: boolean;
}

const Footer: React.FC<FooterProps> = ({ isDarkMode }) => {
  return (
    <footer className={`${isDarkMode ? 'bg-zinc-900' : 'bg-zinc-800'} text-white transition-colors duration-300 text-center`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/*
            This column is now set to span the full width (col-span-full),
            limited to a reasonable size (max-w-xl), and centered (mx-auto)
            to ensure all content is in the middle of the screen.
          */}
          <div className="col-span-full max-w-xl mx-auto">
            {/* Added justify-center to center the icon and title */}
            <div className="flex items-center space-x-3 mb-4 justify-center">
              <Trophy className={`h-8 w-8 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
              <h3 className="text-xl font-bold">Hackathon Security Scanner</h3>
            </div>
      
            <p className="text-slate-400 mb-4">
              <strong>Team:</strong> Logic Scapes | <strong>Project:</strong> Security-Scanner
            </p>
            <div className="flex space-x-4 justify-center">
            </div>
          </div>

        </div>
      
        {/* This block was already centered via inheritance from the footer tag */}
        <div className="border-t border-slate-700 mt-8 pt-8 flex-col md:flex-row justify-between items-center text-center">
          <p className="text-slate-400 text-sm ">
            © MAKEUC 2025 Hackathon - Security Scanner. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;