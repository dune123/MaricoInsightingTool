import React from 'react';
import { CheckCircle, Loader2, XCircle, Brain, BarChart3 } from 'lucide-react';

interface AnalysisStatusIndicatorProps {
  status: 'idle' | 'analyzing' | 'completed' | 'error';
  analysisType?: 'quick' | 'comprehensive' | 'custom';
  chartCount?: number;
}

export const AnalysisStatusIndicator: React.FC<AnalysisStatusIndicatorProps> = ({
  status,
  analysisType = 'quick',
  chartCount = 0
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'analyzing':
        return {
          icon: <Loader2 className="w-4 h-4 animate-spin" />,
          text: 'Analyzing...',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100'
        };
      case 'completed':
        return {
          icon: <CheckCircle className="w-4 h-4" />,
          text: `Analysis Complete${chartCount > 0 ? ` (${chartCount} charts)` : ''}`,
          color: 'text-green-600',
          bgColor: 'bg-green-100'
        };
      case 'error':
        return {
          icon: <XCircle className="w-4 h-4" />,
          text: 'Analysis Failed',
          color: 'text-red-600',
          bgColor: 'bg-red-100'
        };
      default:
        return {
          icon: <Brain className="w-4 h-4" />,
          text: 'Ready for Analysis',
          color: 'text-gray-600',
          bgColor: 'bg-gray-100'
        };
    }
  };

  const config = getStatusConfig();
  const analysisTypeLabel = analysisType === 'quick' ? 'Quick' : 
                           analysisType === 'comprehensive' ? 'Comprehensive' : 'Custom';

  return (
    <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${config.bgColor}`}>
      {config.icon}
      <span className={config.color}>{config.text}</span>
      {status === 'completed' && (
        <span className="text-xs text-gray-500">({analysisTypeLabel})</span>
      )}
    </div>
  );
};
