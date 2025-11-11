import React from 'react';
    import { useForm } from 'react-hook-form';
    import { zodResolver } from '@hookform/resolvers/zod';
    import { z } from 'zod';
    import { Search } from 'lucide-react';
    import { motion } from 'framer-motion';
    import { toast } from 'react-toastify';

    const scanSchema = z.object({
      url: z.string().url('Please enter a valid URL')
    });

    type ScanFormData = z.infer<typeof scanSchema>;

    interface ScanFormProps {
      onScanStart: (url: string) => void;
      isScanning: boolean;
      scanProgress?: number;
      scanMessage?: string;
    }

    const ScanForm: React.FC<ScanFormProps> = ({ onScanStart, isScanning, scanProgress = 0, scanMessage = '' }) => {
      const { register, handleSubmit } = useForm<ScanFormData>({
        resolver: zodResolver(scanSchema)
      });

      const onSubmit = async (data: ScanFormData) => {
        try {
          onScanStart(data.url);
        } catch {
          toast.error('Failed to start scan');
        }
      };

      return (
        <motion.div 
          className="bg-zinc-800 rounded-lg shadow-lg p-8 max-w-2xl mx-auto transition-colors duration-300"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4 text-white">Scan Your Website</h2>
            <p className="text-slate-400 text-lg">Enter a URL to perform security analysis</p>
          </div>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label htmlFor="url" className="block text-sm font-medium mb-2 text-white">
                Website URL
              </label>
              <div className="relative">
                <input
                  {...register('url')}
                  type="url"
                  id="url"
                  placeholder="https://example.com"
                  className="w-full px-4 py-3 pl-12 border rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-colors bg-zinc-700 border-zinc-600 text-white placeholder-zinc-400"
                  disabled={isScanning}
                />
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-zinc-400" />
              </div>
            </div>
            
            <button
              type="submit"
              disabled={isScanning}
              className="w-full font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {isScanning ? (
                <motion.div
                  className="flex items-center space-x-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Scanning...</span>
                </motion.div>
              ) : (
                <>
                  <Search className="h-5 w-5" />
                  <span>Scan Now</span>
                </>
              )}
            </button>

            {/* Progress Bar - Shown below button when scanning */}
            {isScanning && (
              <motion.div
                className="mt-4 space-y-2"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="w-full bg-zinc-700 rounded-full h-3 overflow-hidden">
                  <motion.div
                    className="bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 h-full rounded-full flex items-center justify-end px-2"
                    initial={{ width: 0 }}
                    animate={{ width: `${scanProgress}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  >
                    {scanProgress > 10 && (
                      <span className="text-xs font-semibold text-white">{scanProgress}%</span>
                    )}
                  </motion.div>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">{scanMessage}</span>
                  <span className="text-indigo-400 font-semibold">{scanProgress}%</span>
                </div>
              </motion.div>
            )}
          </form>
        </motion.div>
      );
    };

    export default ScanForm;