import React, { useState, useEffect } from 'react';
    import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

    interface HealthBadgeProps {
      isDarkMode: boolean;
    }

    const HealthBadge: React.FC<HealthBadgeProps> = ({ isDarkMode }) => {
      const [status, setStatus] = useState<'checking' | 'healthy' | 'unhealthy'>('checking');

      useEffect(() => {
        const checkHealth = async () => {
          try {
            const response = await fetch('/api/health');
            if (response.ok) {
              setStatus('healthy');
            } else {
              setStatus('unhealthy');
            }
          } catch {
            setStatus('unhealthy');
          }
        };

        checkHealth();
        const interval = setInterval(checkHealth, 30000); // Check every 30 seconds
        return () => clearInterval(interval);
      }, []);

      const getStatusDisplay = () => {
        switch (status) {
          case 'checking':
            return { icon: <Loader2 className="h-4 w-4 animate-spin" />, text: 'Checking...', color: 'text-yellow-600' };
          case 'healthy':
            return { icon: <CheckCircle className="h-4 w-4" />, text: 'Backend Healthy', color: 'text-green-600' };
          case 'unhealthy':
            return { icon: <XCircle className="h-4 w-4" />, text: 'Backend Unhealthy', color: 'text-red-600' };
        }
      };

      const { icon, text, color } = getStatusDisplay();

      return (
        <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${isDarkMode ? 'bg-zinc-700' : 'bg-slate-100'} ${color}`}>
          {icon}
          <span>{text}</span>
        </div>
      );
    };

    export default HealthBadge;