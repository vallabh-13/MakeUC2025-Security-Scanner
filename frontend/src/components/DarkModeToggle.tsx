import React from 'react';
    import { Moon, Sun } from 'lucide-react';

    interface DarkModeToggleProps {
      isDarkMode: boolean;
      setIsDarkMode: (isDark: boolean) => void;
    }

    const DarkModeToggle: React.FC<DarkModeToggleProps> = ({ isDarkMode, setIsDarkMode }) => {
      return (
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'bg-zinc-700 hover:bg-zinc-600' : 'bg-slate-200 hover:bg-slate-300'}`}
          aria-label="Toggle dark mode"
        >
          {isDarkMode ? <Sun className="h-5 w-5 text-yellow-400" /> : <Moon className="h-5 w-5 text-slate-600" />}
        </button>
      );
    };

    export default DarkModeToggle;