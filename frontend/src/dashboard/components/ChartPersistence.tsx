import React, { useState } from 'react';
import { ChartData } from '../types/chart';
import { useCosmosCharts } from '../hooks/useCosmosDB';
import { Save, Cloud, Database, AlertCircle } from 'lucide-react';

interface ChartPersistenceProps {
  chart: ChartData;
  onSave?: (savedChart: any) => void;
  onError?: (error: string) => void;
  className?: string;
}

export const ChartPersistence: React.FC<ChartPersistenceProps> = ({
  chart,
  onSave,
  onError,
  className = ''
}) => {
  const { saveChart, loading, error } = useCosmosCharts();
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const handleSaveChart = async () => {
    setIsSaving(true);
    setSaveStatus('saving');
    
    try {
      const savedChart = await saveChart({
        chartData: chart,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: ['frontend-generated'],
        isPublic: false
      });
      
      setSaveStatus('saved');
      onSave?.(savedChart);
      
      // Reset status after 2 seconds
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      setSaveStatus('error');
      onError?.(err instanceof Error ? err.message : 'Failed to save chart');
      
      // Reset status after 3 seconds
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusIcon = () => {
    switch (saveStatus) {
      case 'saving':
        return <Database className="w-4 h-4 text-blue-600 animate-spin" />;
      case 'saved':
        return <Cloud className="w-4 h-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Save className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusText = () => {
    switch (saveStatus) {
      case 'saving':
        return 'Saving to CosmosDB...';
      case 'saved':
        return 'Saved to CosmosDB';
      case 'error':
        return 'Save failed';
      default:
        return 'Save to CosmosDB';
    }
  };

  const getButtonClass = () => {
    const baseClass = "inline-flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200";
    
    switch (saveStatus) {
      case 'saving':
        return `${baseClass} bg-blue-100 text-blue-700 cursor-not-allowed`;
      case 'saved':
        return `${baseClass} bg-green-100 text-green-700`;
      case 'error':
        return `${baseClass} bg-red-100 text-red-700`;
      default:
        return `${baseClass} bg-gray-100 text-gray-700 hover:bg-gray-200`;
    }
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-900">Chart Persistence</h3>
          <p className="text-xs text-gray-500">Save chart data to CosmosDB</p>
        </div>
        
        <button
          onClick={handleSaveChart}
          disabled={isSaving || loading}
          className={getButtonClass()}
        >
          {getStatusIcon()}
          <span>{getStatusText()}</span>
        </button>
      </div>
      
      {error && (
        <div className="mt-2 text-xs text-red-600 flex items-center space-x-1">
          <AlertCircle className="w-3 h-3" />
          <span>Error: {error.message}</span>
        </div>
      )}
      
      <div className="mt-3 text-xs text-gray-500">
        <div className="flex items-center space-x-4">
          <span>Chart ID: {chart.id}</span>
          <span>Type: {chart.type}</span>
          <span>Data Points: {chart.data?.length || 0}</span>
        </div>
      </div>
    </div>
  );
};

export default ChartPersistence;
