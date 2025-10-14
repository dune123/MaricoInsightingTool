import React from 'react';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface DataPointDebuggerProps {
  analysis?: any;
  showDebug?: boolean;
}

export const DataPointDebugger: React.FC<DataPointDebuggerProps> = ({ 
  analysis, 
  showDebug = false 
}) => {
  if (!showDebug || !analysis?.charts) return null;

  const totalDataPoints = analysis.charts.reduce((total: number, chart: any) => {
    return total + (chart.data?.length || 0);
  }, 0);

  const scatterCharts = analysis.charts.filter((chart: any) => chart.type === 'scatter');
  const lowDataCharts = scatterCharts.filter((chart: any) => 
    chart.data && chart.data.length <= 10
  );

  const hasLowDataCharts = lowDataCharts.length > 0;
  const expectedDataPoints = 100; // Based on your CSV

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm z-50">
      <div className="flex items-center gap-2 mb-3">
        <Info className="w-4 h-4 text-blue-600" />
        <h3 className="font-semibold text-sm">Data Point Analysis</h3>
      </div>
      
      <div className="space-y-2 text-xs">
        <div className="flex justify-between">
          <span>Total Charts:</span>
          <span className="font-medium">{analysis.charts.length}</span>
        </div>
        
        <div className="flex justify-between">
          <span>Total Data Points:</span>
          <span className={`font-medium ${totalDataPoints < expectedDataPoints ? 'text-red-600' : 'text-green-600'}`}>
            {totalDataPoints}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>Expected Points:</span>
          <span className="font-medium">{expectedDataPoints}+</span>
        </div>
        
        <div className="flex justify-between">
          <span>Scatter Charts:</span>
          <span className="font-medium">{scatterCharts.length}</span>
        </div>
        
        {hasLowDataCharts && (
          <div className="flex items-center gap-1 text-red-600">
            <AlertTriangle className="w-3 h-3" />
            <span>⚠️ {lowDataCharts.length} chart(s) have ≤10 points</span>
          </div>
        )}
        
        {totalDataPoints >= expectedDataPoints && (
          <div className="flex items-center gap-1 text-green-600">
            <CheckCircle className="w-3 h-3" />
            <span>✅ Using full dataset</span>
          </div>
        )}
      </div>
      
      <div className="mt-3 pt-2 border-t border-gray-100">
        <div className="text-xs text-gray-600">
          <strong>Chart Details:</strong>
        </div>
        {analysis.charts.map((chart: any, index: number) => (
          <div key={index} className="text-xs text-gray-500 mt-1">
            {chart.title}: {chart.data?.length || 0} points
          </div>
        ))}
      </div>
    </div>
  );
};
