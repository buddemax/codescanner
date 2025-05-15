import React from 'react';
import { ScanResult } from '../services/ai-scanner';

interface CodeDisplayProps {
  code: string;
  vulnerabilities: ScanResult[];
  filePath: string;
}

export function CodeDisplay({ code, vulnerabilities, filePath }: CodeDisplayProps) {
  // Split code into lines
  const lines = code.split('\n');

  // Create a map of line numbers to vulnerabilities
  const lineVulnerabilities = vulnerabilities.reduce((acc, vuln) => {
    const lineMatch = vuln.location?.match(/:(\d+)(?::(\d+))?/);
    if (lineMatch) {
      const lineNumber = parseInt(lineMatch[1]);
      const column = lineMatch[2] ? parseInt(lineMatch[2]) : 0;
      if (!acc[lineNumber]) {
        acc[lineNumber] = [];
      }
      acc[lineNumber].push({ ...vuln, column });
    }
    return acc;
  }, {} as { [key: number]: (ScanResult & { column: number })[] });

  const highlightErrorInLine = (line: string, lineNumber: number) => {
    const vulns = lineVulnerabilities[lineNumber] || [];
    if (vulns.length === 0) return line;

    // Sort vulnerabilities by column to handle overlapping highlights
    const sortedVulns = [...vulns].sort((a, b) => a.column - b.column);
    
    let result = line;
    let offset = 0;

    sortedVulns.forEach((vuln, index) => {
      const start = vuln.column - 1; // Convert to 0-based index
      const end = start + (vuln.length || 1);
      
      // Create hover tooltip content
      const tooltipContent = `
        <div class="p-2">
          <div class="font-medium text-red-700 mb-1">${vuln.type.toUpperCase()}</div>
          <div class="text-sm text-gray-700 mb-2">${vuln.message}</div>
          <div class="text-xs text-gray-500">
            <div>Severity: ${vuln.severity}</div>
            <div>Impact: ${vuln.impact}/10</div>
            <div>Effort: ${vuln.effort}/10</div>
          </div>
          ${vuln.recommendation ? `
            <div class="mt-2 text-xs">
              <div class="font-medium text-gray-700">Recommendation:</div>
              <div class="text-gray-600">${vuln.recommendation}</div>
            </div>
          ` : ''}
        </div>
      `;
      
      // Insert highlight spans with tooltip
      const before = result.slice(0, start + offset);
      const highlight = result.slice(start + offset, end + offset);
      const after = result.slice(end + offset);
      
      result = `${before}<span class="bg-red-200 text-red-900 px-0.5 rounded cursor-help group relative" data-tooltip="${encodeURIComponent(tooltipContent)}">${highlight}</span>${after}`;
      offset += 27; // Length of the added span tags
    });

    return result;
  };

  return (
    <div className="relative font-mono text-sm bg-gray-50 rounded-lg overflow-hidden">
      <div className="flex">
        {/* Line numbers and code */}
        <div className="flex-1 min-w-0">
          <div className="flex">
            <div className="w-12 bg-gray-100 border-r border-gray-200">
              {lines.map((_, index) => (
                <div
                  key={index}
                  className={`h-6 flex items-center justify-center text-xs text-gray-500 ${
                    lineVulnerabilities[index + 1] ? 'bg-red-50' : ''
                  }`}
                >
                  {index + 1}
                </div>
              ))}
            </div>
            <div className="flex-1">
              {lines.map((line, index) => {
                const lineNumber = index + 1;
                const lineVulns = lineVulnerabilities[lineNumber] || [];
                const highlightedLine = highlightErrorInLine(line, lineNumber);
                
                return (
                  <div
                    key={index}
                    className={`group relative h-6 leading-6 px-4 ${
                      lineVulns.length > 0 ? 'bg-red-50' : ''
                    }`}
                  >
                    <pre 
                      className="whitespace-pre-wrap"
                      dangerouslySetInnerHTML={{ __html: highlightedLine }}
                    />
                    {/* Tooltip container */}
                    <div className="absolute left-0 top-0 w-full h-full pointer-events-none">
                      {lineVulns.map((vuln, vulnIndex) => (
                        <div
                          key={vulnIndex}
                          className="absolute hidden group-hover:block z-50 bg-white shadow-lg rounded-lg border border-gray-200 max-w-md"
                          style={{
                            left: `${(vuln.column - 1) * 8}px`,
                            top: '100%',
                            marginTop: '4px'
                          }}
                        >
                          <div className="p-2">
                            <div className="font-medium text-red-700 mb-1">{vuln.type.toUpperCase()}</div>
                            <div className="text-sm text-gray-700 mb-2">{vuln.message}</div>
                            <div className="text-xs text-gray-500">
                              <div>Severity: {vuln.severity}</div>
                              <div>Impact: {vuln.impact}/10</div>
                              <div>Effort: {vuln.effort}/10</div>
                            </div>
                            {vuln.recommendation && (
                              <div className="mt-2 text-xs">
                                <div className="font-medium text-gray-700">Recommendation:</div>
                                <div className="text-gray-600">{vuln.recommendation}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Error messages */}
        <div className="w-96 border-l border-gray-200 bg-white overflow-y-auto max-h-[500px]">
          {Object.entries(lineVulnerabilities).map(([lineNumber, vulns]) => (
            <div key={lineNumber} className="p-4 border-b border-gray-100">
              <div className="text-xs text-gray-500 mb-2">
                Line {lineNumber}
              </div>
              {vulns.map((vuln, index) => (
                <div key={index} className="mb-4 last:mb-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      vuln.type === 'vulnerability' ? 'bg-purple-100 text-purple-800' :
                      vuln.type === 'error' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {vuln.type}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      vuln.severity === 'high' ? 'bg-red-100 text-red-800' :
                      vuln.severity === 'medium' ? 'bg-orange-100 text-orange-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {vuln.severity}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-900 mb-1">{vuln.message}</p>
                  <div className="text-xs text-gray-500 mb-2">
                    Impact: {vuln.impact}/10, Effort: {vuln.effort}/10
                  </div>
                  {vuln.recommendation && (
                    <div className="text-xs bg-gray-50 p-2 rounded">
                      <span className="font-medium text-gray-700">Recommendation:</span>
                      <p className="text-gray-600 mt-1">{vuln.recommendation}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 