import React from 'react';
import { ScanResult } from '../services/ai-scanner';

interface ImpactEffortMatrixProps {
  results: ScanResult[];
}

export const ImpactEffortMatrix: React.FC<ImpactEffortMatrixProps> = ({ results }) => {
  return (
    <div className="w-full flex flex-col items-center">
      <div className="relative flex flex-row items-center">
        {/* Y-axis label */}
        <div className="flex flex-col items-center justify-center mr-2" style={{height: 480}}>
          <span className="text-sm font-medium text-gray-700" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
            Aufwand: 1 = sehr gering, 10 = enorm
          </span>
        </div>
        {/* Y-axis numbers and plot */}
        <div className="flex flex-row items-start">
          {/* Y-axis numbers */}
          <div className="flex flex-col justify-between h-[480px] mr-2" style={{height: 480}}>
            {Array.from({ length: 10 }, (_, i) => (
              <div key={i} className="text-sm text-gray-600" style={{height: 48, display: 'flex', alignItems: 'center', justifyContent: 'flex-end'}}>
                {10 - i}
              </div>
            ))}
          </div>
          {/* Main coordinate system */}
          <div className="relative w-[480px] h-[480px] border-2 border-gray-400 bg-white">
            {/* Grid lines */}
            {Array.from({ length: 9 }, (_, i) => (
              <React.Fragment key={i}>
                {/* Horizontal grid lines */}
                <div 
                  className="absolute w-full border-t border-gray-200" 
                  style={{ top: `${((i + 1) * 48)}px` }} 
                />
                {/* Vertical grid lines */}
                <div 
                  className="absolute h-full border-l border-gray-200" 
                  style={{ left: `${((i + 1) * 48)}px` }} 
                />
              </React.Fragment>
            ))}
            {/* Points for each issue */}
            {results.map((result, index) => {
              const x = ((result.impact - 1) / 9) * 432 + 24; // 24px padding for axis
              const y = ((10 - result.effort) / 9) * 432 + 24;
              return (
                <div
                  key={index}
                  className="absolute w-4 h-4 bg-blue-600 rounded-full transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                  style={{ left: `${x}px`, top: `${y}px`, zIndex: 10 }}
                  onMouseEnter={e => (e.currentTarget.style.zIndex = '50')}
                  onMouseLeave={e => (e.currentTarget.style.zIndex = '10')}
                >
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-50">
                    <div className="bg-white p-2 rounded-lg shadow-lg border border-gray-200 w-64">
                      <div className="text-xs font-medium text-gray-700 mb-1">
                        Impact: {result.impact.toFixed(1)}, Effort: {result.effort.toFixed(1)}
                      </div>
                      <div className="text-xs text-gray-600">
                        {result.message}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {/* X-axis numbers */}
      <div className="flex flex-row justify-between w-[480px] ml-[62px] mt-1">
        {Array.from({ length: 10 }, (_, i) => (
          <div key={i} className="text-sm text-gray-600 w-[48px] text-center">
            {i + 1}
          </div>
        ))}
      </div>
      {/* X-axis label */}
      <div className="w-[480px] ml-[62px] mt-1 flex justify-center">
        <span className="text-sm font-medium text-gray-700">
          Schweregrad (Impact): 1 = vernachlässigbar, 10 = katastrophal
        </span>
      </div>
    </div>
  );
}; 