import React, { useState } from 'react';
import { Dashboard, ChartData } from '../types/chart';
import { 
  X, 
  Plus, 
  LayoutDashboard, 
  BarChart3,
  Calendar,
  Check
} from 'lucide-react';

interface AddChartToDashboardModalProps {
  chartToAdd: ChartData;
  dashboards: Dashboard[];
  onClose: () => void;
  onAddChartToDashboard: (dashboardId: string, chart: ChartData) => void;
  onCreateNewDashboard: (name: string, initialChart?: ChartData) => string;
}

export const AddChartToDashboardModal: React.FC<AddChartToDashboardModalProps> = ({
  chartToAdd,
  dashboards,
  onClose,
  onAddChartToDashboard,
  onCreateNewDashboard
}) => {
  const [showCreateNew, setShowCreateNew] = useState(false);
  const [newDashboardName, setNewDashboardName] = useState('');
  const [selectedDashboard, setSelectedDashboard] = useState<string | null>(null);

  const handleAddToExisting = () => {
    if (selectedDashboard) {
      onAddChartToDashboard(selectedDashboard, chartToAdd);
      onClose();
    }
  };

  const handleCreateNew = () => {
    if (newDashboardName.trim()) {
      onCreateNewDashboard(newDashboardName.trim(), chartToAdd);
      onClose();
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Add Chart to Dashboard</h3>
            <p className="text-sm text-gray-500 mt-1">"{chartToAdd.title}"</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Chart Preview */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-900">{chartToAdd.title}</h4>
                <p className="text-xs text-gray-500 capitalize">{chartToAdd.type} chart</p>
              </div>
            </div>
          </div>

          {/* Existing Dashboards */}
          {dashboards.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Add to Existing Dashboard</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {dashboards.map((dashboard) => (
                  <div
                    key={dashboard.id}
                    onClick={() => setSelectedDashboard(dashboard.id)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                      selectedDashboard === dashboard.id
                        ? 'border-blue-300 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <LayoutDashboard className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <h5 className="text-sm font-medium text-gray-900">{dashboard.name}</h5>
                          <div className="flex items-center space-x-3 text-xs text-gray-500">
                            <span>{dashboard.charts.length} chart{dashboard.charts.length !== 1 ? 's' : ''}</span>
                            <span>•</span>
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-3 h-3" />
                              <span>{formatDate(dashboard.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      {selectedDashboard === dashboard.id && (
                        <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {selectedDashboard && (
                <button
                  onClick={handleAddToExisting}
                  className="w-full mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  Add to Selected Dashboard
                </button>
              )}
            </div>
          )}

          {/* Divider */}
          {dashboards.length > 0 && (
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or</span>
              </div>
            </div>
          )}

          {/* Create New Dashboard */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Create New Dashboard</h4>
            {!showCreateNew ? (
              <button
                onClick={() => setShowCreateNew(true)}
                className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 flex items-center justify-center space-x-2 text-gray-600 hover:text-blue-600"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Dashboard</span>
              </button>
            ) : (
              <div className="space-y-3">
                <input
                  type="text"
                  value={newDashboardName}
                  onChange={(e) => setNewDashboardName(e.target.value)}
                  placeholder="e.g., Sales Dashboard, Inventory Analysis"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateNew()}
                  autoFocus
                />
                <div className="flex space-x-2">
                  <button
                    onClick={() => { setShowCreateNew(false); setNewDashboardName(''); }}
                    className="flex-1 px-3 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateNew}
                    disabled={!newDashboardName.trim()}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    Create & Add
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};