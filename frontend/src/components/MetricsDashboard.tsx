'use client';

import { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Line, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface Metrics {
  errors: number;
  warnings: number;
  infos: number;
}

interface MetricsDashboardProps {
  metrics: Metrics;
}

export function MetricsDashboard({ metrics }: MetricsDashboardProps) {
  const [trendData, setTrendData] = useState<any>({
    labels: [],
    datasets: []
  });

  // Pie chart data for current metrics
  const pieData = {
    labels: ['Errors', 'Warnings', 'Info'],
    datasets: [{
      data: [metrics.errors, metrics.warnings, metrics.infos],
      backgroundColor: [
        'rgba(255, 99, 132, 0.8)',
        'rgba(255, 206, 86, 0.8)',
        'rgba(54, 162, 235, 0.8)'
      ],
      borderColor: [
        'rgba(255, 99, 132, 1)',
        'rgba(255, 206, 86, 1)',
        'rgba(54, 162, 235, 1)'
      ],
      borderWidth: 1
    }]
  };

  // Heatmap data
  const heatmapData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{
      label: 'Error Rate',
      data: [65, 59, 80, 81, 56, 55, 40],
      fill: false,
      borderColor: 'rgb(75, 192, 192)',
      tension: 0.1
    }]
  };

  useEffect(() => {
    // Simulate fetching trend data
    const fetchTrendData = async () => {
      // In a real app, this would be an API call
      const mockData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [
          {
            label: 'Errors',
            data: [12, 19, 3, 5, 2, 3],
            borderColor: 'rgb(255, 99, 132)',
            tension: 0.1
          },
          {
            label: 'Warnings',
            data: [8, 15, 5, 7, 4, 6],
            borderColor: 'rgb(255, 206, 86)',
            tension: 0.1
          }
        ]
      };
      setTrendData(mockData);
    };

    fetchTrendData();
  }, []);

  return (
    <div className="p-4 bg-white dark:bg-gray-800">
      <h2 className="text-lg font-semibold mb-4">Metrics Dashboard</h2>
      
      <div className="grid grid-cols-3 gap-4">
        {/* Current Metrics */}
        <div className="col-span-1">
          <h3 className="text-md font-medium mb-2">Current Distribution</h3>
          <div className="h-64">
            <Pie data={pieData} options={{ maintainAspectRatio: false }} />
          </div>
        </div>

        {/* Trend Analysis */}
        <div className="col-span-1">
          <h3 className="text-md font-medium mb-2">Trend Analysis</h3>
          <div className="h-64">
            <Line data={trendData} options={{ maintainAspectRatio: false }} />
          </div>
        </div>

        {/* Heatmap */}
        <div className="col-span-1">
          <h3 className="text-md font-medium mb-2">Error Rate Heatmap</h3>
          <div className="h-64">
            <Line data={heatmapData} options={{ maintainAspectRatio: false }} />
          </div>
        </div>
      </div>
    </div>
  );
} 