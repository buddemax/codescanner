'use client';

import { useEffect, useRef } from 'react';
import { Editor } from '@monaco-editor/react';
import { Issue } from '@/types/Issue';

interface CodeEditorProps {
  selectedFile: string | null;
  onFileSelect: (file: string) => void;
  issues: Issue[];
  code: string;
  editorRef?: React.MutableRefObject<any>;
}

export function CodeEditor({ selectedFile, onFileSelect, issues, code, editorRef }: CodeEditorProps) {
  // Fallback auf internes Ref, falls kein editorRef übergeben
  const internalRef = useRef<any>(null);
  const ref = editorRef || internalRef;

  useEffect(() => {
    if (ref.current && issues.length > 0) {
      // Add inline decorations for issues
      const decorations = issues.map(issue => ({
        range: {
          startLineNumber: issue.line,
          startColumn: issue.column,
          endLineNumber: issue.line,
          endColumn: issue.column + 1
        },
        options: {
          isWholeLine: false,
          inlineClassName: `issue-${issue.severity}`,
          glyphMarginClassName: `gutter-${issue.severity}`,
          hoverMessage: {
            value: [
              { value: `**${issue.message}**` },
              { value: `Rule: ${issue.ruleId}` },
              { value: `[View Documentation](${issue.documentationUrl || `https://docs.example.com/rules/${issue.ruleId}`})` }
            ]
          }
        }
      }));
      ref.current.deltaDecorations([], decorations);
    }
  }, [issues, ref]);

  const handleEditorDidMount = (editor: any) => {
    ref.current = editor;
    // Add quick fix command
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Period, () => {
      const position = editor.getPosition();
      const issue = issues.find(i => i.line === position.lineNumber);
      if (issue?.quickFix) {
        editor.executeEdits('quick-fix', [{
          range: {
            startLineNumber: issue.line,
            startColumn: issue.column,
            endLineNumber: issue.line,
            endColumn: issue.column + (issue.length || 1)
          },
          text: issue.quickFix
        }]);
      }
    });
  };

  return (
    <div className="h-full">
      <Editor
        height="100%"
        defaultLanguage="typescript"
        theme="vs-dark"
        value={code}
        onMount={handleEditorDidMount}
        options={{
          minimap: { enabled: true },
          glyphMargin: true,
          lineNumbers: 'on',
          folding: true,
          lineDecorationsWidth: 5,
          lineNumbersMinChars: 3,
          quickSuggestions: true,
          suggestOnTriggerCharacters: true,
          wordBasedSuggestions: true,
          parameterHints: { enabled: true },
          hover: { enabled: true },
          contextmenu: true
        }}
      />
    </div>
  );
} 