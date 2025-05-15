'use client';

import { useState } from 'react';
import { Issue } from '../types/Issue';

interface ProblemsPanelProps {
  issues: Issue[];
  onIssueSelect: (issue: Issue) => void;
}

export function ProblemsPanel({ issues, onIssueSelect }: ProblemsPanelProps) {
  const [filter, setFilter] = useState({
    severity: 'all',
    file: 'all',
    search: ''
  });

  const filteredIssues = issues.filter(issue => {
    if (filter.severity !== 'all' && issue.severity !== filter.severity) return false;
    if (filter.file !== 'all' && issue.file !== filter.file) return false;
    if (filter.search && !issue.message.toLowerCase().includes(filter.search.toLowerCase())) return false;
    return true;
  });

  const uniqueFiles = [...new Set(issues.map(i => i.file))];
  const severityCounts = {
    error: issues.filter(i => i.severity === 'error').length,
    warning: issues.filter(i => i.severity === 'warning').length,
    info: issues.filter(i => i.severity === 'info').length
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold mb-4">Problems</h2>

        {/* Filters */}
        <div className="space-y-2">
          <select
            className="w-full p-2 rounded border dark:bg-gray-700 dark:border-gray-600"
            value={filter.severity}
            onChange={(e) => setFilter(f => ({ ...f, severity: e.target.value }))}
          >
            <option value="all">All Severities</option>
            <option value="error">Errors ({severityCounts.error})</option>
            <option value="warning">Warnings ({severityCounts.warning})</option>
            <option value="info">Info ({severityCounts.info})</option>
          </select>

          <select
            className="w-full p-2 rounded border dark:bg-gray-700 dark:border-gray-600"
            value={filter.file}
            onChange={(e) => setFilter(f => ({ ...f, file: e.target.value }))}
          >
            <option value="all">All Files</option>
            {uniqueFiles.map(file => (
              <option key={file} value={file}>{file}</option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Search issues..."
            className="w-full p-2 rounded border dark:bg-gray-700 dark:border-gray-600"
            value={filter.search}
            onChange={(e) => setFilter(f => ({ ...f, search: e.target.value }))}
          />
        </div>
      </div>

      {/* Issues List */}
      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-2 text-left">File</th>
              <th className="px-4 py-2 text-left">Line</th>
              <th className="px-4 py-2 text-left">Severity</th>
              <th className="px-4 py-2 text-left">Rule</th>
            </tr>
          </thead>
          <tbody>
            {filteredIssues.map((issue, index) => (
              <tr
                key={index}
                className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                onClick={() => onIssueSelect(issue)}
              >
                <td className="px-4 py-2">{issue.file}</td>
                <td className="px-4 py-2">{issue.line}</td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-1 rounded text-sm ${
                    issue.severity === 'error' ? 'bg-red-100 text-red-800' :
                    issue.severity === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {issue.severity}
                  </span>
                </td>
                <td className="px-4 py-2">{issue.ruleId}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

