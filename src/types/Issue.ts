export interface Issue {
  file: string;
  line: number;
  column: number;
  length?: number;
  severity: 'error' | 'warning' | 'info';
  message: string;
  ruleId: string;
  quickFix?: string;
  documentationUrl?: string;
} 