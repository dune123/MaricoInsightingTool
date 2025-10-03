import React, { useState } from 'react';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Dashboard, ChartData } from '../types/chart';
import { LayoutDashboard, Plus, Trash2, CreditCard as Edit3, ChevronDown, ChevronRight, BarChart3, Calendar, Clock, GripVertical, X, Target, ArrowUp, ArrowDown, Minus } from 'lucide-react';

const ResponsiveGridLayout = WidthProvider(Responsive);

const DEFAULT_COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
  '#06B6D4', '#F97316', '#84CC16', '#EC4899', '#6366F1'
];

interface DashboardBotProps {
  dashboards: Dashboard[];
  onCreateNewDashboard: (name: string, initialChart?: ChartData) => string;
  onAddChartToDashboard: (dashboardId: string, chart: ChartData) => void;
  onUpdateDashboardCharts: (dashboardId: string, updatedCharts: ChartData[]) => void;
  onDeleteDashboard: (dashboardId: string) => void;
  onAddChartRequest: (chart: ChartData) => void;
  chartToAdd: ChartData | null;
  onClearChartToAdd: () => void;
}

export const DashboardBot: React.FC<DashboardBotProps> = ({
  dashboards,
  onCreateNewDashboard,
  onAddChartToDashboard,
  onUpdateDashboardCharts,
  onDeleteDashboard,
  onAddChartRequest,
  chartToAdd,
  onClearChartToAdd
}) => {
  const [expandedDashboards, setExpandedDashboards] = useState<Record<string, boolean>>({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newDashboardName, setNewDashboardName] = useState('');
  const [editingDashboard, setEditingDashboard] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [layouts, setLayouts] = useState<Record<string, Layout[]>>({});

  const renderSingleChart = (chart: ChartData) => {
    if (chart.type === 'kpi') {
      return renderKpiCard(chart);
    }
    return renderChart(chart);
  };

  const renderKpiCard = (chart: ChartData) => {
    // Extract KPI values from config or try to parse from description
    let { value, trend, trendDirection, period, unit, target } = chart.config;
    
    // If no value in config, try to extract from description
    if (!value && chart.description) {
      const valueMatch = chart.description.match(/\$?([\d,]+(?:\.\d+)?[KMB]?)/);
      if (valueMatch) {
        value = valueMatch[1];
        unit = chart.description.includes('$') ? '$' : '';
      }
    }
    
    // Extract trend from description if not in config
    if (trend === undefined && chart.description) {
      const trendMatch = chart.description.match(/(\d+)%\s*(increase|decrease|up|down|growth)/i);
      if (trendMatch) {
        trend = parseInt(trendMatch[1]);
        trendDirection = trendMatch[2].toLowerCase().includes('increase') || 
                        trendMatch[2].toLowerCase().includes('up') || 
                        trendMatch[2].toLowerCase().includes('growth') ? 'up' : 'down';
      }
    }
    
    // Extract target from description if not in config
    if (!target && chart.description) {
      const targetMatch = chart.description.match(/target[:\s]*\$?([\d,]+(?:\.\d+)?)/i);
      if (targetMatch) {
        target = parseFloat(targetMatch[1].replace(/,/g, ''));
      }
    }
    
    // Get a clean title (remove "Total" prefix if present)
    const cleanTitle = chart.title.replace(/^Total\s+/i, '');
    
    const getTrendIcon = () => {
      switch (trendDirection) {
        case 'up':
          return <ArrowUp className="w-4 h-4 text-green-600" />;
        case 'down':
          return <ArrowDown className="w-4 h-4 text-red-600" />;
        default:
          return <Minus className="w-4 h-4 text-gray-600" />;
      }
    };
    
    const getTrendColor = () => {
      switch (trendDirection) {
        case 'up':
          return 'text-green-600';
        case 'down':
          return 'text-red-600';
        default:
          return 'text-gray-600';
      }
    };
    
    return (
      <div className="h-full flex flex-col p-4 bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-600 truncate">{cleanTitle}</h3>
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Target className="w-4 h-4 text-blue-600" />
          </div>
        </div>
        
        <div className="flex-1 flex flex-col justify-center">
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {value ? (
              unit === '$' ? `$${typeof value === 'string' ? value : value.toLocaleString()}` :
              unit ? `${value} ${unit}` : 
              typeof value === 'string' ? value : value.toLocaleString()
            ) : 'N/A'}
          </div>
          
          {trend !== undefined && (
            <div className="flex items-center justify-between">
              <div className={`flex items-center space-x-1 ${getTrendColor()}`}>
                {getTrendIcon()}
                <span className="text-sm font-medium">
                  {Math.abs(trend)}%
                </span>
                {period && <span className="text-xs text-gray-500 ml-1">{period}</span>}
              </div>
              {target && (
                <div className="text-xs text-gray-500">
                  Target: {unit === '$' ? `$${target.toLocaleString()}` : target.toLocaleString()}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderChart = (chart: ChartData) => {
    const colors = chart.config.colors || DEFAULT_COLORS;
    
    const chartContent = () => {
      switch (chart.type) {
        case 'bar':
          return (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart.data} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                {chart.config.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />}
                <XAxis 
                  dataKey={chart.config.xKey} 
                  tick={{ fontSize: 10 }}
                  stroke="#6b7280"
                />
                <YAxis 
                  tick={{ fontSize: 10 }}
                  stroke="#6b7280"
                />
                {chart.config.showTooltip && (
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      fontSize: '12px'
                    }}
                  />
                )}
                {chart.config.showLegend && <Legend wrapperStyle={{ fontSize: '10px' }} />}
                {Array.isArray(chart.config.yKey) ? (
                  chart.config.yKey.map((key, index) => (
                    <Bar 
                      key={key} 
                      dataKey={key} 
                      fill={colors[index % colors.length]}
                      radius={[2, 2, 0, 0]}
                    />
                  ))
                ) : (
                  <Bar 
                    dataKey={chart.config.yKey} 
                    fill={colors[0]}
                    radius={[2, 2, 0, 0]}
                  />
                )}
              </BarChart>
            </ResponsiveContainer>
          );

        case 'line':
          return (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chart.data} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                {chart.config.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />}
                <XAxis 
                  dataKey={chart.config.xKey} 
                  tick={{ fontSize: 10 }}
                  stroke="#6b7280"
                />
                <YAxis 
                  tick={{ fontSize: 10 }}
                  stroke="#6b7280"
                />
                {chart.config.showTooltip && (
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      fontSize: '12px'
                    }}
                  />
                )}
                {chart.config.showLegend && <Legend wrapperStyle={{ fontSize: '10px' }} />}
                {Array.isArray(chart.config.yKey) ? (
                  chart.config.yKey.map((key, index) => (
                    <Line 
                      key={key} 
                      type="monotone" 
                      dataKey={key} 
                      stroke={colors[index % colors.length]}
                      strokeWidth={2}
                      dot={{ fill: colors[index % colors.length], strokeWidth: 1, r: 2 }}
                      activeDot={{ r: 4, stroke: colors[index % colors.length], strokeWidth: 1 }}
                    />
                  ))
                ) : (
                  <Line 
                    type="monotone" 
                    dataKey={chart.config.yKey} 
                    stroke={colors[0]}
                    strokeWidth={2}
                    dot={{ fill: colors[0], strokeWidth: 1, r: 2 }}
                    activeDot={{ r: 4, stroke: colors[0], strokeWidth: 1 }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          );

        case 'area':
          return (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chart.data} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                {chart.config.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />}
                <XAxis 
                  dataKey={chart.config.xKey} 
                  tick={{ fontSize: 10 }}
                  stroke="#6b7280"
                />
                <YAxis 
                  tick={{ fontSize: 10 }}
                  stroke="#6b7280"
                />
                {chart.config.showTooltip && (
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      fontSize: '12px'
                    }}
                  />
                )}
                {chart.config.showLegend && <Legend wrapperStyle={{ fontSize: '10px' }} />}
                {Array.isArray(chart.config.yKey) ? (
                  chart.config.yKey.map((key, index) => (
                    <Area 
                      key={key} 
                      type="monotone" 
                      dataKey={key} 
                      stackId="1"
                      stroke={colors[index % colors.length]}
                      fill={colors[index % colors.length]}
                      fillOpacity={0.6}
                    />
                  ))
                ) : (
                  <Area 
                    type="monotone" 
                    dataKey={chart.config.yKey} 
                    stroke={colors[0]}
                    fill={colors[0]}
                    fillOpacity={0.6}
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          );

        case 'pie':
        case 'donut':
          return (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chart.data}
                  cx="50%"
                  cy="50%"
                  outerRadius="70%"
                  innerRadius={chart.type === 'donut' ? "35%" : 0}
                  fill="#8884d8"
                  dataKey={chart.config.valueKey}
                  nameKey={chart.config.nameKey}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                  fontSize={10}
                >
                  {chart.data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                {chart.config.showTooltip && (
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      fontSize: '12px'
                    }}
                  />
                )}
              </PieChart>
            </ResponsiveContainer>
          );

        case 'scatter':
          return (
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart data={chart.data} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                {chart.config.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />}
                <XAxis 
                  dataKey={chart.config.xKey} 
                  tick={{ fontSize: 10 }}
                  stroke="#6b7280"
                />
                <YAxis 
                  dataKey={chart.config.yKey as string}
                  tick={{ fontSize: 10 }}
                  stroke="#6b7280"
                />
                {chart.config.showTooltip && (
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      fontSize: '12px'
                    }}
                  />
                )}
                <Scatter fill={colors[0]} />
              </ScatterChart>
            </ResponsiveContainer>
          );

        default:
          return (
            <div className="flex items-center justify-center h-full text-gray-500">
              <p>Unsupported chart type: {chart.type}</p>
            </div>
          );
      }
    };

    return (
      <div className="h-full flex flex-col bg-white">
        <div className="flex items-center justify-between p-3 border-b border-gray-200 flex-shrink-0">
          <h3 className="text-sm font-medium text-gray-900 truncate">{chart.title}</h3>
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize flex-shrink-0">
            {chart.type}
          </span>
        </div>
        <div className="flex-1 p-2">
          {chartContent()}
        </div>
      </div>
    );
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dashboardId: string) => {
    e.preventDefault();
    if (chartToAdd) {
      onAddChartToDashboard(dashboardId, chartToAdd);
      onClearChartToAdd();
    }
  };

  const toggleDashboard = (dashboardId: string) => {
    setExpandedDashboards(prev => ({
      ...prev,
      [dashboardId]: !prev[dashboardId]
    }));
  };

  const handleCreateDashboard = () => {
    if (newDashboardName.trim()) {
      const dashboardId = onCreateNewDashboard(newDashboardName.trim());
      // Initialize empty layout for new dashboard
      setLayouts(prev => ({
        ...prev,
        [dashboardId]: []
      }));
      setNewDashboardName('');
      setShowCreateModal(false);
    }
  };

  const handleShowCreateModal = () => {
    console.log('Opening create modal');
    setShowCreateModal(true);
  };

  const handleCloseCreateModal = () => {
    console.log('Closing create modal');
    setShowCreateModal(false);
    setNewDashboardName('');
  };

  const handleEditDashboard = (dashboardId: string, currentName: string) => {
    setEditingDashboard(dashboardId);
    setEditName(currentName);
  };

  const handleSaveEdit = (dashboardId: string) => {
    setEditingDashboard(null);
    setEditName('');
  };

  const handleLayoutChange = (layout: Layout[], dashboardId: string) => {
    // Update layouts state
    setLayouts(prev => ({
      ...prev,
      [dashboardId]: layout
    }));
    
    // Update chart positions in the dashboard
    const dashboard = dashboards.find(d => d.id === dashboardId);
    if (dashboard) {
      const updatedCharts = dashboard.charts.map(chart => {
        const layoutItem = layout.find(l => l.i === chart.id);
        if (layoutItem) {
          return {
            ...chart,
            layout: {
              x: layoutItem.x,
              y: layoutItem.y,
              w: layoutItem.w,
              h: layoutItem.h
            }
          };
        }
        return chart;
      });
      onUpdateDashboardCharts(dashboardId, updatedCharts);
    }
  };

  const getLayoutForDashboard = (dashboardId: string): Layout[] => {
    const dashboard = dashboards.find(d => d.id === dashboardId);
    if (!dashboard) return [];
    
    // If we have stored layouts, use them
    if (layouts[dashboardId]) {
      return layouts[dashboardId];
    }
    
    // Otherwise, generate layout from chart data
    const layout = dashboard.charts.map((chart, index) => ({
      i: chart.id,
      x: chart.layout?.x ?? (index % 2) * 6, // 2 columns by default
      y: chart.layout?.y ?? Math.floor(index / 2) * 4,
      w: chart.layout?.w ?? (chart.type === 'kpi' ? 3 : 6), // KPIs are smaller
      h: chart.layout?.h ?? (chart.type === 'kpi' ? 2 : 4),
      minW: chart.type === 'kpi' ? 2 : 3,
      minH: chart.type === 'kpi' ? 1 : 2,
      maxW: 12,
      maxH: 8
    }));
    
    // Store the generated layout
    setLayouts(prev => ({
      ...prev,
      [dashboardId]: layout
    }));
    
    return layout;
  };

  const addChartToLayout = (dashboardId: string, chart: ChartData) => {
    const currentLayout = getLayoutForDashboard(dashboardId);
    const maxY = currentLayout.length > 0 ? Math.max(...currentLayout.map(l => l.y + l.h)) : 0;
    
    const newLayoutItem: Layout = {
      i: chart.id,
      x: 0,
      y: maxY,
      w: chart.type === 'kpi' ? 3 : 6,
      h: chart.type === 'kpi' ? 2 : 4,
      minW: chart.type === 'kpi' ? 2 : 3,
      minH: chart.type === 'kpi' ? 1 : 2,
      maxW: 12,
      maxH: 8
    };
    
    setLayouts(prev => ({
      ...prev,
      [dashboardId]: [...currentLayout, newLayoutItem]
    }));
  };

  // Initialize layouts when dashboards change
  React.useEffect(() => {
    dashboards.forEach(dashboard => {
      if (!layouts[dashboard.id] && dashboard.charts.length > 0) {
        getLayoutForDashboard(dashboard.id);
      }
    });
  }, [dashboards]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Debug log
  console.log('DashboardBot render - showCreateModal:', showCreateModal);

  if (dashboards.length === 0) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <LayoutDashboard className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Dashboards Yet</h3>
          <p className="text-gray-600 mb-6">Create your first dashboard to organize and visualize your charts.</p>
          <button
            onClick={handleShowCreateModal}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 inline-flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Dashboard</span>
          </button>
          
          {/* Simple Modal - Always render when showCreateModal is true */}
          {showCreateModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Create New Dashboard</h3>
                    <button
                      onClick={handleCloseCreateModal}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dashboard Name
                    </label>
                    <input
                      type="text"
                      value={newDashboardName}
                      onChange={(e) => setNewDashboardName(e.target.value)}
                      placeholder="e.g., Sales Dashboard, Inventory Analysis"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      autoFocus
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && newDashboardName.trim()) {
                          handleCreateDashboard();
                        }
                      }}
                    />
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={handleCloseCreateModal}
                      className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateDashboard}
                      disabled={!newDashboardName.trim()}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Create Dashboard
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">My Dashboards</h2>
            <p className="text-sm text-gray-500">{dashboards.length} dashboard{dashboards.length !== 1 ? 's' : ''} created</p>
          </div>
          <button
            onClick={handleShowCreateModal}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 inline-flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Dashboard</span>
          </button>
        </div>
      </div>

      {/* Dashboards List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {dashboards.map((dashboard) => (
          <div
            key={dashboard.id}
            className="bg-white rounded-xl shadow-sm border border-gray-200"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, dashboard.id)}
          >
            {/* Dashboard Header */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div 
                  className="flex items-center space-x-3 cursor-pointer flex-1"
                  onClick={() => toggleDashboard(dashboard.id)}
                >
                  {expandedDashboards[dashboard.id] ? (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  )}
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <LayoutDashboard className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    {editingDashboard === dashboard.id ? (
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onBlur={() => handleSaveEdit(dashboard.id)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSaveEdit(dashboard.id)}
                        className="text-lg font-semibold text-gray-900 bg-transparent border-b border-blue-500 focus:outline-none"
                        autoFocus
                      />
                    ) : (
                      <h3 className="text-lg font-semibold text-gray-900">{dashboard.name}</h3>
                    )}
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <BarChart3 className="w-3 h-3" />
                        <span>{dashboard.charts.length} chart{dashboard.charts.length !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>Created {formatDate(dashboard.createdAt)}</span>
                      </div>
                      {dashboard.updatedAt.getTime() !== dashboard.createdAt.getTime() && (
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>Updated {formatDate(dashboard.updatedAt)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEditDashboard(dashboard.id, dashboard.name)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                    title="Edit Dashboard"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteDashboard(dashboard.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                    title="Delete Dashboard"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Dashboard Content */}
            {expandedDashboards[dashboard.id] && (
              <div className="p-4" style={{ minHeight: '400px' }}>
                {dashboard.charts.length > 0 ? (
                  <ResponsiveGridLayout
                    className="layout"
                    layouts={{ lg: getLayoutForDashboard(dashboard.id) }}
                    breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                    cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
                    rowHeight={60}
                    onLayoutChange={(layout) => handleLayoutChange(layout, dashboard.id)}
                    isDraggable={true}
                    isResizable={true}
                    margin={[16, 16]}
                    containerPadding={[0, 0]}
                  >
                    {dashboard.charts.map((chart) => (
                      <div
                        key={chart.id}
                        className="bg-white rounded-lg border border-gray-200 shadow-sm"
                        style={{ 
                          display: 'flex',
                          flexDirection: 'column',
                          height: '100%',
                          overflow: 'hidden'
                        }}
                      >
                        {renderSingleChart(chart)}
                      </div>
                    ))}
                  </ResponsiveGridLayout>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <BarChart3 className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-gray-500 text-sm">No charts in this dashboard yet</p>
                    <p className="text-gray-400 text-xs mt-1">Add charts from your analysis results</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal for when there are existing dashboards */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Create New Dashboard</h3>
                <button
                  onClick={handleCloseCreateModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dashboard Name
                </label>
                <input
                  type="text"
                  value={newDashboardName}
                  onChange={(e) => setNewDashboardName(e.target.value)}
                  placeholder="e.g., Sales Dashboard, Inventory Analysis"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  autoFocus
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && newDashboardName.trim()) {
                      handleCreateDashboard();
                    }
                  }}
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleCloseCreateModal}
                  className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateDashboard}
                  disabled={!newDashboardName.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};