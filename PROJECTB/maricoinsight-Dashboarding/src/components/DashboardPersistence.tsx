import React, { useState } from 'react';
import { ChartData, Dashboard } from '../types/chart';
import { useCosmosDashboards } from '../hooks/useCosmosDB';
import { Save, Cloud, Database, AlertCircle, Layout, BarChart3 } from 'lucide-react';

interface DashboardPersistenceProps {
  dashboard: Dashboard;
  onSave?: (savedDashboard: any) => void;
  onError?: (error: string) => void;
  className?: string;
}

export const DashboardPersistence: React.FC<DashboardPersistenceProps> = ({
  dashboard,
  onSave,
  onError,
  className = ''
}) => {
  const { saveDashboard, loading, error } = useCosmosDashboards();
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const handleSaveDashboard = async () => {
    setIsSaving(true);
    setSaveStatus('saving');
    
    try {
      const savedDashboard = await saveDashboard({
        name: dashboard.name,
        charts: dashboard.charts,
        layout: dashboard.charts.map((chart, index) => ({
          chartId: chart.id,
          x: 0,
          y: index * 4,
          w: 6,
          h: 4
        })),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: ['frontend-generated'],
        isPublic: false
      });
      
      setSaveStatus('saved');
      onSave?.(savedDashboard);
      
      // Reset status after 2 seconds
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      setSaveStatus('error');
      onError?.(err instanceof Error ? err.message : 'Failed to save dashboard');
      
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
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <Layout className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-900">{dashboard.name}</h3>
            <p className="text-xs text-gray-500">Dashboard with {dashboard.charts.length} charts</p>
          </div>
        </div>
        
        <button
          onClick={handleSaveDashboard}
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
      
      <div className="mt-3">
        <div className="flex items-center space-x-4 text-xs text-gray-500">
          <span>ID: {dashboard.id}</span>
          <span>Charts: {dashboard.charts.length}</span>
          <span>Created: {dashboard.createdAt.toLocaleDateString()}</span>
        </div>
        
        {/* Chart Summary */}
        <div className="mt-2 flex flex-wrap gap-1">
          {dashboard.charts.map((chart) => (
            <div
              key={chart.id}
              className="inline-flex items-center space-x-1 px-2 py-1 bg-gray-100 rounded text-xs text-gray-600"
            >
              <BarChart3 className="w-3 h-3" />
              <span className="capitalize">{chart.type}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardPersistence;
