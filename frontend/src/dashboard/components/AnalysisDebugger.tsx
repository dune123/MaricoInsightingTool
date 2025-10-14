import React, { useState } from 'react';
import { Bug, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface AnalysisDebuggerProps {
  analysis?: any;
  showDebug?: boolean;
}

export const AnalysisDebugger: React.FC<AnalysisDebuggerProps> = ({
  analysis,
  showDebug = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!showDebug || !analysis) return null;

  const getAnalysisStatus = () => {
    if (analysis.metadata?.error) {
      return {
        icon: <XCircle className="w-4 h-4 text-red-500" />,
        text: 'Analysis Failed',
        color: 'text-red-600',
        bgColor: 'bg-red-50'
      };
    }
    
    if (analysis.charts && analysis.charts.length > 0) {
      return {
        icon: <CheckCircle className="w-4 h-4 text-green-500" />,
        text: 'Analysis Successful',
        color: 'text-green-600',
        bgColor: 'bg-green-50'
      };
    }
    
    return {
      icon: <AlertTriangle className="w-4 h-4 text-yellow-500" />,
      text: 'Analysis Partial',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    };
  };

  const status = getAnalysisStatus();

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg max-w-md">
        <div 
          className="flex items-center space-x-2 p-3 cursor-pointer hover:bg-gray-50"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <Bug className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Analysis Debug</span>
          <div className={`ml-auto flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${status.bgColor}`}>
            {status.icon}
            <span className={status.color}>{status.text}</span>
          </div>
        </div>
        
        {isExpanded && (
          <div className="border-t border-gray-200 p-3 space-y-3">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Analysis Details</h4>
              <div className="space-y-1 text-xs text-gray-600">
                <div>Charts: {analysis.charts?.length || 0}</div>
                <div>Assistant ID: {analysis.assistantId || 'N/A'}</div>
                <div>Thread ID: {analysis.threadId || 'N/A'}</div>
                <div>Has Summary: {analysis.summary ? 'Yes' : 'No'}</div>
                <div>Has Insights: {analysis.insights?.length || 0}</div>
              </div>
            </div>
            
            {analysis.metadata?.error && (
              <div className="bg-red-50 border border-red-200 rounded p-2">
                <div className="text-xs font-medium text-red-800 mb-1">Error Details</div>
                <div className="text-xs text-red-600">
                  {String(analysis.metadata.errorMessage || 'Unknown error')}
                </div>
              </div>
            )}
            
            {analysis.charts && analysis.charts.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded p-2">
                <div className="text-xs font-medium text-green-800 mb-1">Generated Charts</div>
                <div className="space-y-1">
                  {analysis.charts.map((chart: any, index: number) => (
                    <div key={index} className="text-xs text-green-600">
                      {index + 1}. {chart.title || chart.type || 'Untitled Chart'}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
