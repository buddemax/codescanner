import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale);

interface CodeCoverageProps {
  coverage: number;
}

const CodeCoverage: React.FC<CodeCoverageProps> = ({ coverage }) => {
  const data = {
    labels: ['Covered', 'Not Covered'],
    datasets: [
      {
        data: [coverage, 100 - coverage],
        backgroundColor: [
          'rgba(34, 197, 94, 1)',
          'rgba(239, 68, 68, 1)',
        ],
        borderColor: [
          'rgba(34, 197, 94, 1)',
          'rgba(239, 68, 68, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      title: {
        display: true,
        text: 'Code Coverage',
        font: {
          size: 16,
        },
      },
    },
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-lg">
      <div className="w-64 h-64 mx-auto">
        <Doughnut data={data} options={options} />
      </div>
      <div className="text-center mt-4">
        <p className="text-2xl font-bold text-gray-800">{coverage}%</p>
        <p className="text-sm text-gray-600">Total Code Coverage</p>
      </div>
    </div>
  );
};

export default CodeCoverage; 