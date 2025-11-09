import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, Shield, Download, Search } from 'lucide-react';
import { io } from 'socket.io-client'; // ← UNCOMMENTED!

export default function App() {
  const [url, setUrl] = useState('');
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [scanLogs, setScanLogs] = useState([]);
  const socketRef = useRef(null);

  // ✅ REAL WebSocket Setup - ACTIVE
  useEffect(() => {
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
    
    console.log('Connecting to WebSocket:', apiUrl);
    socketRef.current = io(apiUrl, {
      transports: ['websocket', 'polling']
    });

    socketRef.current.on('connect', () => {
      console.log('✓ Connected to WebSocket');
      addLog('Connected to server');
    });

    socketRef.current.on('disconnect', () => {
      console.log('✗ Disconnected from WebSocket');
    });

    socketRef.current.on('scan:progress', (data) => {
      console.log('Progress:', data);
      setProgress(data.progress);
      setCurrentStep(data.message);
      addLog(`[${data.progress}%] ${data.message}`);
    });

    socketRef.current.on('scan:step-complete', (data) => {
      console.log('Step complete:', data.step);
      addLog(`✓ ${data.step} completed`);
    });

    socketRef.current.on('scan:error', (data) => {
      console.error('Scan error:', data);
      addLog(`✗ Error in ${data.step}: ${data.error}`, 'error');
    });

    socketRef.current.on('scan:complete', (data) => {
      console.log('Scan complete:', data.results);
      setResults(data.results);
      setScanning(false);
      setProgress(100);
      addLog('✓ Scan completed successfully!');
    });

    socketRef.current.on('scan:failed', (data) => {
      console.error('Scan failed:', data);
      setError(`Scan failed: ${data.error}`);
      setScanning(false);
      addLog(`✗ Scan failed: ${data.error}`, 'error');
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const addLog = (message, type = 'info') => {
    setScanLogs(prev => [...prev, { 
      message, 
      type, 
      time: new Date().toLocaleTimeString() 
    }]);
  };

  // ✅ REAL API Call - ACTIVE
  const handleScan = async () => {
    setError('');
    setResults(null);
    setScanLogs([]);
    setProgress(0);
    
    if (!url) {
      setError('Please enter a URL');
      return;
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      setError('Please enter a valid URL (include http:// or https://)');
      return;
    }

    setScanning(true);
    addLog(`Starting full security scan...`);

    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
      
      console.log('Sending scan request to:', `${apiUrl}/api/scan`);
      console.log('Socket ID:', socketRef.current?.id);
      
      const response = await fetch(`${apiUrl}/api/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          url,
          socketId: socketRef.current?.id
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Scan failed');
      }

      console.log('Scan started:', data);
      addLog(`✓ Scan initiated with ID: ${data.scanId}`);
      addLog('This will take 2-5 minutes. Running Nmap, Nuclei, SSL Labs, and CVE checks...');
      
    } catch (err) {
      console.error('Scan error:', err);
      setError(err.message);
      setScanning(false);
      addLog(`✗ Failed to start scan: ${err.message}`, 'error');
    }
  };

  const downloadReport = (format = 'json') => {
    if (!results) return;
    
    const reportData = {
      url,
      ...results
    };
    
    if (format === 'json') {
      const blob = new Blob([JSON.stringify(reportData, null, 2)], { 
        type: 'application/json' 
      });
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `security-report-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(downloadUrl);
    } else if (format === 'pdf') {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
      const scanId = Date.now();
      const pdfUrl = `${apiUrl}/api/report/${scanId}/pdf?url=${encodeURIComponent(url)}&results=${encodeURIComponent(JSON.stringify(results))}`;
      window.open(pdfUrl, '_blank');
    }
  };

  const getSeverityColor = (severity) => {
    const colors = {
      critical: 'bg-red-100 text-red-800 border-red-300',
      high: 'bg-orange-100 text-orange-800 border-orange-300',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      low: 'bg-blue-100 text-blue-800 border-blue-300',
      info: 'bg-gray-100 text-gray-800 border-gray-300'
    };
    return colors[severity] || colors.info;
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Shield className="w-16 h-16 text-indigo-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            The Best Security Scanner
          </h1>
          <p className="text-gray-600">
            Real-time vulnerability scanning with Nmap, Nuclei & CVE detection
          </p>
        </div>

        {/* Connection Status */}
        <div className="bg-white rounded-lg shadow-lg p-4 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${socketRef.current?.connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-600">
              {socketRef.current?.connected ? 'Connected to backend' : 'Connecting to backend...'}
            </span>
          </div>
          <span className="text-xs text-gray-400">
            {process.env.REACT_APP_API_URL || 'http://localhost:3001'}
          </span>
        </div>

        {/* Input Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex gap-4">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleScan()}
              placeholder="https://example.com"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              disabled={scanning}
            />
            <button
              onClick={handleScan}
              disabled={scanning || !socketRef.current?.connected}
              className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 font-medium transition-colors"
            >
              {scanning ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Scanning...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Start Scan
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {error}
            </div>
          )}
          
          {/* Progress Bar */}
          {scanning && (
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>{currentStep || 'Initializing...'}</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-indigo-600 h-full transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Scan Logs */}
        {scanLogs.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Real-Time Scan Progress</h3>
            <div className="bg-gray-900 rounded-lg p-4 max-h-60 overflow-y-auto font-mono text-sm">
              {scanLogs.map((log, idx) => (
                <div 
                  key={idx} 
                  className={`${log.type === 'error' ? 'text-red-400' : 'text-green-400'} mb-1`}
                >
                  <span className="text-gray-500">{log.time}</span> {log.message}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Results Section */}
        {results && (
          <div className="space-y-6">
            {/* Score Card */}
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Security Score</h2>
                  <p className="text-gray-600">Scanned: {new Date(results.scannedAt).toLocaleString()}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => downloadReport('pdf')}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg transition-colors"
                  >
                    <Download className="w-5 h-5" />
                    PDF
                  </button>
                  <button
                    onClick={() => downloadReport('json')}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition-colors"
                  >
                    <Download className="w-5 h-5" />
                    JSON
                  </button>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-8 mb-8">
                {/* Score Circle */}
                <div className="flex items-center justify-center">
                  <div className="relative">
                    <svg className="w-48 h-48 transform -rotate-90">
                      <circle
                        cx="96"
                        cy="96"
                        r="80"
                        stroke="#e5e7eb"
                        strokeWidth="16"
                        fill="none"
                      />
                      <circle
                        cx="96"
                        cy="96"
                        r="80"
                        stroke="currentColor"
                        strokeWidth="16"
                        fill="none"
                        strokeDasharray={`${results.score * 5.03} 502.4`}
                        className={getScoreColor(results.score)}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className={`text-5xl font-bold ${getScoreColor(results.score)}`}>
                        {results.score}
                      </span>
                      <span className="text-gray-600 text-sm">out of 100</span>
                      <span className={`text-2xl font-bold ${getScoreColor(results.score)} mt-1`}>
                        Grade: {results.grade}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Detected Technologies */}
                {results.detectedTechnology && (
                  <div className="space-y-4">
                    <h3 className="font-bold text-gray-900 text-lg mb-3">Detected Technologies</h3>
                    {results.detectedTechnology.webServer && (
                      <div className="bg-gray-50 rounded p-3">
                        <div className="text-sm text-gray-600">Web Server</div>
                        <div className="font-semibold">
                          {results.detectedTechnology.webServer.name} {results.detectedTechnology.webServer.version}
                        </div>
                      </div>
                    )}
                    {results.detectedTechnology.cms && (
                      <div className="bg-gray-50 rounded p-3">
                        <div className="text-sm text-gray-600">CMS</div>
                        <div className="font-semibold">
                          {results.detectedTechnology.cms.name} {results.detectedTechnology.cms.version}
                        </div>
                      </div>
                    )}
                    {results.detectedTechnology.frameworks?.length > 0 && (
                      <div className="bg-gray-50 rounded p-3">
                        <div className="text-sm text-gray-600">Frameworks</div>
                        <div className="font-semibold">
                          {results.detectedTechnology.frameworks.map(f => f.name).join(', ')}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Severity Summary */}
              <div className="grid grid-cols-5 gap-4">
                {Object.entries(results.severityCounts).map(([severity, count]) => (
                  <div key={severity} className="text-center">
                    <div className={`text-2xl font-bold ${getSeverityColor(severity).split(' ')[1]}`}>
                      {count}
                    </div>
                    <div className="text-sm text-gray-600 capitalize">{severity}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Findings */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Security Findings ({results.totalIssues})
              </h2>
              <div className="space-y-4">
                {results.findings.map((finding, index) => (
                  <div
                    key={index}
                    className={`border-l-4 rounded-lg p-4 ${getSeverityColor(finding.severity)}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-lg flex-1">{finding.title}</h3>
                      <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase ml-4">
                        {finding.severity}
                      </span>
                    </div>
                    <p className="text-gray-700 mb-3">{finding.description}</p>
                    {finding.recommendation && (
                      <div className="bg-white bg-opacity-50 rounded p-3 mb-2">
                        <div className="font-semibold text-sm mb-1">💡 Recommendation:</div>
                        <div className="text-sm">{finding.recommendation}</div>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-4 text-xs text-gray-600">
                      {finding.cve && <span><strong>CVE:</strong> {finding.cve}</span>}
                      {finding.cwe && <span><strong>CWE:</strong> {finding.cwe}</span>}
                      {finding.owasp && <span><strong>OWASP:</strong> {finding.owasp}</span>}
                      {finding.cvss && <span><strong>CVSS:</strong> {finding.cvss}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Info Section */}
        {!results && !scanning && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Real Security Scanning</h2>
            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Search className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="font-semibold mb-2">1. Technology Detection</h3>
                <p className="text-sm text-gray-600">
                  HTTP headers & HTML parsing to identify technologies
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Shield className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="font-semibold mb-2">2. Nmap + Nuclei Scanning</h3>
                <p className="text-sm text-gray-600">
                  Port scanning + 5000+ vulnerability templates
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <AlertCircle className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="font-semibold mb-2">3. CVE Matching</h3>
                <p className="text-sm text-gray-600">
                  NVD database integration for known vulnerabilities
                </p>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-6 border border-indigo-200">
              <h4 className="font-bold text-indigo-900 mb-2">⚠️ Backend Required</h4>
              <p className="text-sm text-indigo-800 mb-3">
                The backend server must be running for real scans. Make sure you have:
              </p>
              <ul className="text-sm text-indigo-700 space-y-1 list-disc list-inside">
                <li>Node.js backend running on port 3001</li>
                <li>Nmap installed on the server</li>
                <li>Nuclei installed with updated templates</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
