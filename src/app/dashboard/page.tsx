'use client'
export const dynamic = 'force-dynamic'

import React, { useState, useEffect, useRef } from 'react'
import dynamicImport from 'next/dynamic'
import { CodeEditor } from '@/components/CodeEditor'
import { ProblemsPanel } from '@/components/ProblemsPanel'
import { MetricsDashboard } from '@/components/MetricsDashboard'
import { Issue } from '@/types/Issue'

// Nur SettingsPanel-Komponente aus dem Modul laden:
const SettingsPanel = dynamicImport(
  () => import('@/components/SettingsPanel').then(mod => mod.SettingsPanel),
  { ssr: false, loading: () => <p>Lade Einstellungen…</p> }
)

// Nur NotificationCenter-Komponente aus dem Modul laden:
const NotificationCenter = dynamicImport(
  () => import('@/components/NotificationCenter').then(mod => mod.NotificationCenter),
  { ssr: false, loading: () => null }
)

const DEMO_CODE = `function helloWorld() {
  console.log('Hello, world!')
  let unused = 42;
  if (true) {
    // TODO: remove this
    console.log('Always true!')
  }
}
`;

const DEMO_ISSUES: Issue[] = [
  {
    file: 'src/app/dashboard/page.tsx',
    line: 2,
    column: 3,
    length: 5,
    severity: 'error',
    message: 'Unexpected console statement.',
    ruleId: 'no-console',
    quickFix: '// console.log removed',
    documentationUrl: 'https://eslint.org/docs/latest/rules/no-console'
  },
  {
    file: 'src/app/dashboard/page.tsx',
    line: 3,
    column: 7,
    length: 6,
    severity: 'warning',
    message: 'Unused variable: unused',
    ruleId: 'no-unused-vars',
    quickFix: '',
    documentationUrl: 'https://eslint.org/docs/latest/rules/no-unused-vars'
  },
  {
    file: 'src/app/dashboard/page.tsx',
    line: 5,
    column: 5,
    length: 7,
    severity: 'info',
    message: 'TODO found: remove this',
    ruleId: 'no-todo',
    quickFix: '',
    documentationUrl: 'https://example.com/rules/no-todo'
  }
];

const DEMO_METRICS = {
  errors: 1,
  warnings: 1,
  infos: 1
};

export default function Dashboard() {
  const [selectedFile, setSelectedFile] = useState<string>('src/app/dashboard/page.tsx');
  const [issues, setIssues] = useState<Issue[]>(DEMO_ISSUES);
  const [metrics, setMetrics] = useState(DEMO_METRICS);
  const editorRef = useRef<any>(null);

  // Jump-to-Issue: Scroll Editor to Issue
  const handleIssueSelect = (issue: Issue) => {
    if (editorRef.current) {
      editorRef.current.revealLineInCenter(issue.line);
      editorRef.current.setPosition({ lineNumber: issue.line, column: issue.column });
      editorRef.current.focus();
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 flex">
          <div className="w-3/4 p-4">
            <CodeEditor
              selectedFile={selectedFile}
              onFileSelect={setSelectedFile}
              issues={issues}
              code={DEMO_CODE}
              editorRef={editorRef}
            />
          </div>
          {/* Problems Panel */}
          <div className="w-1/4 border-l border-gray-200 dark:border-gray-700">
            <ProblemsPanel issues={issues} onIssueSelect={handleIssueSelect} />
          </div>
        </div>
        {/* Metrics Dashboard */}
        <div className="h-1/3 border-t border-gray-200 dark:border-gray-700">
          <MetricsDashboard metrics={metrics} />
        </div>
      </div>
      {/* Settings Panel */}
      <div className="w-64 border-l border-gray-200 dark:border-gray-700">
        <SettingsPanel />
      </div>
      {/* Notification Center */}
      <NotificationCenter />
    </div>
  );
} 