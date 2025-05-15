import React from 'react';

interface ScoreProps {
  score: number; // 0-100
  label: string;
}

const getGradeColor = (score: number): string => {
  if (score >= 90) return 'bg-green-500';
  if (score >= 80) return 'bg-green-400';
  if (score >= 70) return 'bg-yellow-400';
  if (score >= 60) return 'bg-orange-400';
  return 'bg-red-500';
};

const getGrade = (score: number): string => {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'E';
};

export const CodeScoreDisplay: React.FC<ScoreProps> = ({ score, label }) => {
  const gradeColor = getGradeColor(score);
  const grade = getGrade(score);

  return (
    <div className="flex items-center space-x-4 p-4 bg-white rounded-lg shadow-sm border border-gray-100">
      <div className={`w-16 h-16 ${gradeColor} rounded-full flex items-center justify-center text-white text-2xl font-bold`}>
        {grade}
      </div>
      <div>
        <h3 className="text-lg font-medium text-gray-900">{label}</h3>
        <p className="text-sm text-gray-500">Score: {score}/100</p>
      </div>
    </div>
  );
};

interface CodeScoresProps {
  scores: {
    releasability: number;
    reliability: number;
    securityVulnerabilities: number;
    securityReview: number;
    maintainability: number;
  };
}

export const CodeScores: React.FC<CodeScoresProps> = ({ scores }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <CodeScoreDisplay score={scores.releasability} label="Releasability" />
      <CodeScoreDisplay score={scores.reliability} label="Reliability" />
      <CodeScoreDisplay score={scores.securityVulnerabilities} label="Security Vulnerabilities" />
      <CodeScoreDisplay score={scores.securityReview} label="Security Review" />
      <CodeScoreDisplay score={scores.maintainability} label="Maintainability" />
    </div>
  );
}; 