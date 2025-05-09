'use client';

import { useEffect, useState } from 'react';
import { getRepositoryInfo, getCommitHistory, getCommitDetails, getRepositoryFiles, getFileContent, RepositoryInfo, Commit, FileChange, RepositoryFile } from '../services/github';
import { scanCode, ScanResult } from '../services/ai-scanner';
import { GITHUB_CONFIG } from '../config/github';
import { ImpactEffortMatrix } from '../components/ImpactEffortMatrix';
import { CodeDisplay } from '../components/CodeDisplay';
import { CodeScores } from '../components/CodeScoreDisplay';

export default function Dashboard() {
  const [repoInfo, setRepoInfo] = useState<RepositoryInfo | null>(null);
  const [commits, setCommits] = useState<Commit[]>([]);
  const [expandedCommit, setExpandedCommit] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);
  const [scanProgress, setScanProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
  const [scanError, setScanError] = useState<string | null>(null);
  const [repoUrl, setRepoUrl] = useState('');
  const [token, setToken] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<RepositoryFile[]>([]);
  const [availableFiles, setAvailableFiles] = useState<RepositoryFile[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const sendTelegramMessage = async (message: string) => {
    try {
      const response = await fetch('https://api.telegram.org/bot8129711950:AAGTFNloBPoreQoyl9g1UKTOoBMxg7N5fzI/sendMessage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          chat_id: '-4662919414',
          text: message,
        }),
      });
      const data = await response.json();
      if (!data.ok) {
        console.error('Failed to send Telegram message:', data);
      }
    } catch (error) {
      console.error('Error sending Telegram message:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Extract owner and repo from URL
      const urlParts = repoUrl.split('github.com/')[1]?.split('/');
      if (!urlParts || urlParts.length < 2) {
        throw new Error('Invalid GitHub repository URL');
      }
      
      const [owner, repo] = urlParts;
      
      // Update GitHub config in session storage
      GITHUB_CONFIG.setToken(token);
      GITHUB_CONFIG.setOwner(owner);
      GITHUB_CONFIG.setRepo(repo);

      // Fetch repository data
      const [repoData, commitData, files] = await Promise.all([
        getRepositoryInfo(),
        getCommitHistory(),
        getRepositoryFiles()
      ]);
      
      setRepoInfo(repoData);
      setCommits(commitData);
      setAvailableFiles(files);
      setIsConfigured(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch repository information');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [repoData, commitData, files] = await Promise.all([
          getRepositoryInfo(),
          getCommitHistory(),
          getRepositoryFiles()
        ]);
        setRepoInfo(repoData);
        setCommits(commitData);
        setAvailableFiles(files);
      } catch (err) {
        setError('Failed to fetch repository information');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCommitClick = async (sha: string) => {
    if (expandedCommit === sha) {
      setExpandedCommit(null);
      return;
    }

    try {
      const commitDetails = await getCommitDetails(sha);
      setCommits(commits.map(commit => 
        commit.sha === sha ? commitDetails : commit
      ));
      setExpandedCommit(sha);
    } catch (err) {
      console.error('Failed to fetch commit details:', err);
    }
  };

  const handleScan = async () => {
    setScanning(true);
    setScanResults([]);
    setScanError(null);
    setScanProgress({ current: 0, total: 0 });
    
    try {
      const filesToScan = selectedFiles.length > 0 ? selectedFiles : availableFiles;
      const fileCount = filesToScan.filter(file => file.type === 'file').length;
      setScanProgress({ current: 0, total: fileCount });
      
      const results: ScanResult[] = [];
      let processedCount = 0;

      for (const file of filesToScan) {
        try {
          if (file.type === 'file') {
            const content = await getFileContent(file.path);
            const fileResults = await scanCode(content, file.name);
            results.push(...fileResults.map(result => ({
              ...result,
              location: `${file.path}: ${result.location || 'unknown'}`
            })));
            processedCount++;
            setScanProgress(prev => ({ ...prev, current: processedCount }));
          }
        } catch (error) {
          console.error(`Error scanning file ${file.path}:`, error);
        }
      }

      setScanResults(results);

      // Create summary and send to Telegram
      const summary = createScanSummary(results);
      await sendTelegramMessage(summary);

    } catch (err) {
      console.error('Error during scan:', err);
      setScanError('Failed to complete code scan. Please try again.');
    } finally {
      setScanning(false);
    }
  };

  const createScanSummary = (results: ScanResult[]): string => {
    const totalIssues = results.length;
    const severityCounts = {
      high: results.filter(r => r.severity === 'high').length,
      medium: results.filter(r => r.severity === 'medium').length,
      low: results.filter(r => r.severity === 'low').length,
    };

    const typeCounts = {
      error: results.filter(r => r.type === 'error').length,
      vulnerability: results.filter(r => r.type === 'vulnerability').length,
      dependency: results.filter(r => r.type === 'dependency').length,
    };

    // Get specific high priority issues
    const highPriorityIssues = results
      .filter(r => r.severity === 'high')
      .map(r => r.message)
      .slice(0, 3); // Take top 3 most critical issues

    // Get specific vulnerabilities
    const vulnerabilities = results
      .filter(r => r.type === 'vulnerability')
      .map(r => r.message)
      .slice(0, 2); // Take top 2 vulnerabilities

    // Get specific dependency issues
    const dependencyIssues = results
      .filter(r => r.type === 'dependency')
      .map(r => r.message)
      .slice(0, 2); // Take top 2 dependency issues

    return `🔍 Code Scan Summary

📊 Total Issues: ${totalIssues}

Severity Breakdown:
⚠️ High: ${severityCounts.high}
⚠️ Medium: ${severityCounts.medium}
⚠️ Low: ${severityCounts.low}

Type Breakdown:
🔴 Errors: ${typeCounts.error}
🟣 Vulnerabilities: ${typeCounts.vulnerability}
🔵 Dependencies: ${typeCounts.dependency}

📋 Action Items (Prioritized):

1️⃣ Critical Security & Stability Issues:
${highPriorityIssues.map((issue, index) => `   ${index + 1}. ${issue}`).join('\n')}

2️⃣ Security Vulnerabilities to Address:
${vulnerabilities.map((vuln, index) => `   ${index + 1}. ${vuln}`).join('\n')}

3️⃣ Dependency Updates Required:
${dependencyIssues.map((dep, index) => `   ${index + 1}. ${dep}`).join('\n')}

4️⃣ Code Quality Improvements:
   • Review and fix any TypeScript type errors
   • Address ESLint warnings and errors
   • Improve code documentation where missing

5️⃣ Performance Optimizations:
   • Review and optimize database queries
   • Implement caching where beneficial
   • Optimize large file operations

6️⃣ Maintenance Tasks:
   • Update outdated dependencies
   • Clean up unused code and imports
   • Standardize code formatting

Please review the detailed results in the dashboard for complete information.`;
  };

  const handleFileSelection = (file: RepositoryFile) => {
    setSelectedFiles(prev => {
      const isSelected = prev.some(f => f.path === file.path);
      if (isSelected) {
        return prev.filter(f => f.path !== file.path);
      } else {
        return [...prev, file];
      }
    });
  };

  const handleFolderToggle = (folderPath: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderPath)) {
        newSet.delete(folderPath);
      } else {
        newSet.add(folderPath);
      }
      return newSet;
    });
  };

  const organizeFilesByFolder = (files: RepositoryFile[]) => {
    const folderStructure: { [key: string]: RepositoryFile[] } = {};
    
    files.forEach(file => {
      const pathParts = file.path.split('/');
      const folderPath = pathParts.slice(0, -1).join('/');
      
      if (!folderStructure[folderPath]) {
        folderStructure[folderPath] = [];
      }
      folderStructure[folderPath].push(file);
    });

    return folderStructure;
  };

  const renderFileTree = (files: RepositoryFile[], currentPath: string = '') => {
    const folderStructure = organizeFilesByFolder(files);
    const folders = Object.keys(folderStructure).sort();
    
    return (
      <div className="space-y-1">
        {folders.map(folderPath => {
          const folderName = folderPath.split('/').pop() || folderPath;
          const isExpanded = expandedFolders.has(folderPath);
          const filesInFolder = folderStructure[folderPath];
          
          return (
            <div key={folderPath} className="pl-4">
              <div
                className="flex items-center space-x-2 p-2 rounded-lg cursor-pointer hover:bg-gray-50"
                onClick={() => handleFolderToggle(folderPath)}
              >
                <svg
                  className={`w-4 h-4 text-gray-500 transform transition-transform ${
                    isExpanded ? 'rotate-90' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
                <span className="text-sm font-medium text-gray-700">{folderName}</span>
              </div>
              {isExpanded && (
                <div className="pl-4">
                  {filesInFolder.map(file => (
                    <div
                      key={file.path}
                      className={`flex items-center space-x-2 p-2 rounded-lg cursor-pointer hover:bg-gray-50 ${
                        selectedFiles.some(f => f.path === file.path) ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => handleFileSelection(file)}
                    >
                      <input
                        type="checkbox"
                        checked={selectedFiles.some(f => f.path === file.path)}
                        onChange={() => {}}
                        className="h-4 w-4 text-blue-600 rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700">{file.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderFileChanges = (file: FileChange) => {
    const statusColors = {
      added: 'bg-green-50 text-green-700',
      modified: 'bg-yellow-50 text-yellow-700',
      removed: 'bg-red-50 text-red-700',
      renamed: 'bg-blue-50 text-blue-700',
    };

    // Get vulnerabilities for this file
    const fileVulnerabilities = scanResults.filter(result => 
      result.location?.startsWith(file.filename)
    );

    return (
      <div key={file.filename} className="border-t border-gray-100 py-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[file.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-700'}`}>
              {file.status}
            </span>
            <a
              href={file.raw_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              {file.filename}
            </a>
          </div>
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span className="text-green-600">+{file.additions}</span>
            <span className="text-red-600">-{file.deletions}</span>
            <span>{file.changes} changes</span>
          </div>
        </div>
        {file.patch && (
          <div className="mt-4">
            <CodeDisplay
              code={file.patch}
              vulnerabilities={fileVulnerabilities}
              filePath={file.filename}
            />
          </div>
        )}
      </div>
    );
  };

  const calculateScores = (results: ScanResult[]) => {
    // Initialize base scores
    const scores = {
      releasability: 100,
      reliability: 100,
      securityVulnerabilities: 100,
      securityReview: 100,
      maintainability: 100,
    };

    // Calculate deductions based on scan results
    results.forEach(result => {
      const deduction = result.severity === 'high' ? 20 : result.severity === 'medium' ? 10 : 5;
      
      switch (result.type) {
        case 'error':
          scores.reliability -= deduction;
          scores.releasability -= deduction;
          break;
        case 'vulnerability':
          scores.securityVulnerabilities -= deduction;
          scores.securityReview -= deduction;
          break;
        case 'dependency':
          scores.maintainability -= deduction;
          break;
      }
    });

    // Ensure scores don't go below 0
    Object.keys(scores).forEach(key => {
      scores[key as keyof typeof scores] = Math.max(0, scores[key as keyof typeof scores]);
    });

    return scores;
  };

  const renderScanResults = () => {
    if (scanResults.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          No issues found in the codebase.
        </div>
      );
    }

    const scores = calculateScores(scanResults);

    return (
      <div className="space-y-8">
        {/* Code Scores */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-4">
            Code Quality Scores
          </h2>
          <CodeScores scores={scores} />
        </div>

        {/* Impact-Effort Matrix */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-4">
            Impact-Effort Analysis
          </h2>
          <ImpactEffortMatrix results={scanResults} />
        </div>

        {/* Detailed Results */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-4">
            Detailed Analysis
          </h2>
          <div className="space-y-4">
            {scanResults.map((result, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                <div className="flex items-center space-x-2 mb-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${result.type === 'error' ? 'bg-red-50 text-red-700' : result.type === 'vulnerability' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'}`}>
                    {result.type}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${result.severity === 'high' ? 'bg-red-50 text-red-700' : result.severity === 'medium' ? 'bg-orange-50 text-orange-700' : 'bg-yellow-50 text-yellow-700'}`}>
                    {result.severity}
                  </span>
                  <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">
                    Impact: {result.impact}/10
                  </span>
                  <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">
                    Effort: {result.effort}/10
                  </span>
                </div>
                <p className="text-gray-700 mb-2">{result.message}</p>
                {result.location && (
                  <p className="text-sm text-gray-500 mb-2">
                    Location: <span className="font-mono text-gray-700">{result.location}</span>
                  </p>
                )}
                {result.recommendation && (
                  <div className="mt-2 p-3 bg-white rounded border border-gray-100">
                    <p className="text-sm font-medium text-gray-700">Recommendation:</p>
                    <p className="text-sm text-gray-600">{result.recommendation}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderScanProgress = () => {
    if (!scanning) return null;
    
    const percentage = Math.round((scanProgress.current / scanProgress.total) * 100);
    
    return (
      <div className="mt-4">
        <div className="flex justify-between text-sm text-gray-500 mb-2">
          <span>Scanning repository files...</span>
          <span>{percentage}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Scanned {scanProgress.current} of {scanProgress.total} files
        </p>
      </div>
    );
  };

  const renderFileSelection = () => {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-6">
        <h2 className="text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-4">
          Select Files to Scan
        </h2>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {renderFileTree(availableFiles.filter(file => file.type === 'file'))}
        </div>
        <div className="mt-4 text-sm text-gray-500">
          {selectedFiles.length > 0
            ? `${selectedFiles.length} file(s) selected`
            : 'No files selected - all files will be scanned'}
        </div>
      </div>
    );
  };

  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100">
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-6">
              AI Code Scanner
            </h1>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="repoUrl" className="block text-sm font-medium text-gray-700 mb-1">
                  GitHub Repository URL
                </label>
                <input
                  type="text"
                  id="repoUrl"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="https://github.com/username/repo"
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label htmlFor="token" className="block text-sm font-medium text-gray-700 mb-1">
                  GitHub Access Token
                </label>
                <input
                  type="password"
                  id="token"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className={`w-full px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                  loading
                    ? 'bg-gray-100 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-blue-500/25'
                }`}
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                    <span>Loading...</span>
                  </div>
                ) : (
                  'Connect Repository'
                )}
              </button>
            </form>
            {error && (
              <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
          <p className="text-blue-600 font-medium">Initializing AI Scanner...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg shadow-sm">
          {error}
        </div>
      </div>
    );
  }

  if (!repoInfo) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Heading and subtitle always at the top */}
        <div className="flex flex-col items-start mb-8">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
            AI Code Scanner
          </h1>
          <p className="text-gray-600 mt-2">Intelligent code analysis and security scanning</p>
        </div>
        {/* Top cards row: Languages and Repository Info */}
        <div className="flex flex-col md:flex-row gap-6 mb-8">
          {/* Languages Card */}
          <div className="flex-1 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-4">
              Languages
            </h2>
            <div className="space-y-4">
              {Object.entries(repoInfo.languages).map(([language, bytes]) => (
                <div key={language}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{language}</span>
                    <span className="text-sm text-gray-500">{bytes} bytes</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${(bytes / Math.max(...Object.values(repoInfo.languages))) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Repository Info Card */}
          <div className="flex-1 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-4">
              {repoInfo.name}
            </h2>
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500">Stars</p>
                <p className="text-xl font-semibold text-blue-600">{repoInfo.stars}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500">Forks</p>
                <p className="text-xl font-semibold text-indigo-600">{repoInfo.forks}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500">Open Issues</p>
                <p className="text-xl font-semibold text-red-600">{repoInfo.openIssues}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500">Last Updated</p>
                <p className="text-xl font-semibold text-green-600">
                  {new Date(repoInfo.lastUpdated).toLocaleDateString()}
                </p>
              </div>
            </div>
            <p className="text-gray-600 mt-6">{repoInfo.description}</p>
          </div>
        </div>
        <div className="flex justify-between items-center mb-8">
          
          <button
            onClick={handleScan}
            disabled={scanning}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
              scanning
                ? 'bg-gray-100 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-blue-500/25'
            }`}
          >
            {scanning ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                <span>Analyzing...</span>
              </div>
            ) : (
              'Start AI Analysis'
            )}
          </button>
        </div>
        
        {isConfigured && renderFileSelection()}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Scan Results Card */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 lg:col-span-3">
            <h2 className="text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-4">
              AI Analysis Results
            </h2>
            {scanError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                {scanError}
              </div>
            )}
            {renderScanProgress()}
            {!scanning && renderScanResults()}
          </div>

          {/* Commit History Card */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 lg:col-span-3">
            <h2 className="text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-4">
              Recent Commits
            </h2>
            <div className="space-y-4">
              {commits.map((commit) => (
                <div key={commit.sha} className="border-b border-gray-100 pb-4 last:border-0">
                  <div 
                    className="cursor-pointer hover:bg-gray-50 rounded-lg p-4 transition-colors duration-200"
                    onClick={() => handleCommitClick(commit.sha)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-blue-600 hover:text-blue-700 font-medium">
                            {commit.message.split('\n')[0]}
                          </span>
                          <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-700">
                            {commit.sha.substring(0, 7)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          by {commit.author.name} ({commit.author.email})
                        </p>
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(commit.author.date).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  
                  {expandedCommit === commit.sha && commit.files && (
                    <div className="mt-4 pl-4 border-l-2 border-gray-100">
                      <div className="space-y-4">
                        {commit.files.map(renderFileChanges)}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
