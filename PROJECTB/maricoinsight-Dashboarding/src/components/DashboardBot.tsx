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
import { LayoutDashboard, Plus, Trash2, CreditCard as Edit3, ChevronDown, ChevronRight, BarChart3, Calendar, Clock, X, Target, ArrowUp, ArrowDown, Minus, Download, Lightbulb } from 'lucide-react';
import { useExportToPPT } from '../hooks/useExportToPPT';

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
  onDeleteChart: (dashboardId: string, chartId: string) => void;
  onDeleteInsight: (dashboardId: string, chartId: string, insightType: 'keyfinding' | 'recommendation') => void;
  chartToAdd: ChartData | null;
  onClearChartToAdd: () => void;
}

export const DashboardBot: React.FC<DashboardBotProps> = ({
  dashboards,
  onCreateNewDashboard,
  onAddChartToDashboard,
  onUpdateDashboardCharts,
  onDeleteDashboard,
  onDeleteChart,
  onDeleteInsight,
  chartToAdd,
  onClearChartToAdd
}) => {
  const [expandedDashboards, setExpandedDashboards] = useState<Record<string, boolean>>({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newDashboardName, setNewDashboardName] = useState('');
  const [editingDashboard, setEditingDashboard] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [layouts, setLayouts] = useState<Record<string, Layout[]>>({});
  const { isExporting, exportProgress, error, success, exportToPPT, resetExport } = useExportToPPT();

  const handleExportDashboard = async (dashboard: Dashboard) => {
    if (isExporting || dashboard.charts.length === 0) return;
    
    try {
      // Debug: Log dashboard charts and their layout
      console.log('Exporting dashboard:', dashboard.name);
      console.log('Dashboard charts:', dashboard.charts.map(c => ({ 
        id: c.id, 
        title: c.title, 
        type: c.type, 
        layout: c.layout 
      })));
      
      // Debug: Check for chart elements in DOM
      const chartElements = document.querySelectorAll('[data-chart-id]');
      console.log('Found chart elements in DOM:', chartElements.length);
      chartElements.forEach((el, index) => {
        const chartId = el.getAttribute('data-chart-id');
        const hasSvg = el.querySelector('svg');
        const hasRecharts = el.querySelector('.recharts-wrapper');
        const hasCanvas = el.querySelector('canvas');
        console.log(`Element ${index}: chart-id="${chartId}", hasSvg=${!!hasSvg}, hasRecharts=${!!hasRecharts}, hasCanvas=${!!hasCanvas}`);
      });
      
      // Debug: Check for any recharts elements
      const rechartsElements = document.querySelectorAll('.recharts-wrapper');
      console.log('Found recharts elements:', rechartsElements.length);
      
      // Debug: Check for any SVG elements
      const svgElements = document.querySelectorAll('svg');
      console.log('Found SVG elements:', svgElements.length);
      
      await exportToPPT(dashboard.charts, {
        fileName: `${dashboard.name.replace(/[^a-zA-Z0-9]/g, '_')}_Export_${new Date().toISOString().split('T')[0]}.pptx`,
        slideTitle: dashboard.name,
        includeInsights: true,
        includeRecommendations: true,
        includeActionItems: true,
        includeRiskFactors: true,
        includeOpportunities: true
      });
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const handleDeleteChart = (chartId: string, dashboardId: string) => {
    console.log('handleDeleteChart called:', { chartId, dashboardId });
    onDeleteChart(dashboardId, chartId);
    // Regenerate layout after deletion
    setTimeout(() => {
      const dashboard = dashboards.find(d => d.id === dashboardId);
      if (dashboard) {
        setLayouts(prev => ({
          ...prev,
          [dashboardId]: getLayoutForDashboard(dashboardId)
        }));
      }
    }, 100);
  };

  const handleDeleteInsight = (chartId: string, insightType: 'keyfinding' | 'recommendation', dashboardId: string) => {
    console.log('handleDeleteInsight called:', { chartId, insightType, dashboardId });
    onDeleteInsight(dashboardId, chartId, insightType);
    // Regenerate layout after deletion
    setTimeout(() => {
      const dashboard = dashboards.find(d => d.id === dashboardId);
      if (dashboard) {
        setLayouts(prev => ({
          ...prev,
          [dashboardId]: getLayoutForDashboard(dashboardId)
        }));
      }
    }, 100);
  };

  const renderSingleChart = (chart: ChartData, dashboardId?: string) => {
    console.log('renderSingleChart called with:', { chart, dashboardId });
    
    if (chart.type === 'kpi') {
      return renderKpiCard(chart, dashboardId);
    }
    
    // Always show delete button for charts, regardless of insights
    return (
      <div className="h-full flex flex-col">
        {/* Chart Section */}
        <div className="flex-1 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">{chart.title}</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => {
                  console.log('Delete chart button clicked!', { chartId: chart.id, dashboardId });
                  handleDeleteChart(chart.id, dashboardId || 'unknown');
                }}
                className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors duration-200"
                title="Delete Chart"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3" style={{ height: '300px' }}>
            {renderChart(chart)}
          </div>
        </div>
      </div>
    );
  };

  const renderKpiCard = (chart: ChartData, dashboardId?: string) => {
    // Extract KPI values from config or try to parse from description
    let { value, trend, trendDirection, unit, target } = chart.config;
    const period = chart.config.period;
    
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
          <div className="flex items-center space-x-2">
            {dashboardId && (
              <button
                onClick={() => {
                  console.log('Delete KPI chart button clicked!', { chartId: chart.id, dashboardId });
                  handleDeleteChart(chart.id, dashboardId);
                }}
                className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors duration-200"
                title="Delete KPI"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Target className="w-4 h-4 text-blue-600" />
            </div>
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
                    dataKey={chart.config.yKey || 'value'} 
                    stroke={colors[0]}
                    fill={colors[0]}
                    fillOpacity={0.6}
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          );

        case 'pie':
        case 'donut': {
          // Ensure data is properly formatted for pie chart
          const formattedData = chart.data.map((item, index) => ({
            ...item,
            fill: colors[index % colors.length]
          }));

          console.log('DashboardBot Pie chart data:', formattedData);
          console.log('DashboardBot Pie chart config:', chart.config);

          // Validate data structure
          if (!formattedData || formattedData.length === 0) {
            return (
              <div className="flex items-center justify-center h-full text-gray-500">
                No data available for pie chart
              </div>
            );
          }

          return (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={formattedData}
                  cx="50%"
                  cy="50%"
                  outerRadius="70%"
                  innerRadius={chart.type === 'donut' ? "35%" : 0}
                  fill="#8884d8"
                  dataKey={chart.config.valueKey || 'value'}
                  nameKey={chart.config.nameKey || 'name'}
                  label={false}
                  labelLine={false}
                  stroke="#fff"
                  strokeWidth={2}
                >
                  {formattedData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill || colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    fontSize: '12px'
                  }}
                  formatter={(value: number, name: string) => {
                    const total = formattedData.reduce((sum: number, item: Record<string, unknown>) => sum + (Number(item[chart.config.valueKey || 'value']) || 0), 0);
                    const percentage = ((value / total) * 100).toFixed(1);
                    return [`${value} (${percentage}%)`, name];
                  }}
                />
                <Legend 
                  verticalAlign="bottom"
                  height={40}
                  iconType="circle"
                  wrapperStyle={{ 
                    paddingTop: '15px',
                    fontSize: '12px'
                  }}
                  formatter={(value: string, entry: any) => {
                    if (entry.payload && entry.payload.value) {
                      const total = formattedData.reduce((sum: number, item: Record<string, unknown>) => sum + (Number(item[chart.config.valueKey || 'value']) || 0), 0);
                      const percentage = ((Number(entry.payload.value) / total) * 100).toFixed(0);
                      return `${value} ${percentage}%`;
                    }
                    return value;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          );
        }

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

  const handleSaveEdit = () => {
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

  const getLayoutForDashboard = React.useCallback((dashboardId: string): Layout[] => {
    const dashboard = dashboards.find(d => d.id === dashboardId);
    if (!dashboard) return [];
    
    // If we have stored layouts, use them
    if (layouts[dashboardId]) {
      return layouts[dashboardId];
    }
    
    // Generate layout for all components (charts + insights)
    const layout: Layout[] = [];
    let currentY = 0;
    
    dashboard.charts.forEach((chart) => {
      // Add main chart - takes up left 2/3 (8 columns out of 12)
      layout.push({
        i: chart.id,
        x: chart.layout?.x ?? 0, // Always start at left edge
        y: chart.layout?.y ?? currentY,
        w: chart.layout?.w ?? (chart.type === 'kpi' ? 4 : 8), // 8 columns for charts, 4 for KPIs
        h: chart.layout?.h ?? (chart.type === 'kpi' ? 2 : 6),
        minW: chart.type === 'kpi' ? 2 : 6,
        minH: chart.type === 'kpi' ? 1 : 4,
        maxW: 12,
        maxH: 10
      });
      
      // Add insights as separate components on the right 1/3 (4 columns)
      if (chart.insights?.keyFinding) {
        layout.push({
          i: `${chart.id}-keyfinding`,
          x: chart.layout?.x ?? 8, // Start at column 8 (right 1/3)
          y: chart.layout?.y ?? currentY,
          w: 4, // 4 columns for insights
          h: 3, // Height for key finding
          minW: 3,
          minH: 2,
          maxW: 6,
          maxH: 6
        });
      }
      
      if (chart.insights?.recommendation) {
        layout.push({
          i: `${chart.id}-recommendation`,
          x: chart.layout?.x ?? 8, // Start at column 8 (right 1/3)
          y: chart.layout?.y ?? currentY + (chart.insights?.keyFinding ? 3 : 0), // Below key finding if it exists
          w: 4, // 4 columns for insights
          h: 3, // Height for recommendation
          minW: 3,
          minH: 2,
          maxW: 6,
          maxH: 6
        });
      }
      
      // Move down for next chart - calculate based on chart height and insights
      const chartHeight = chart.type === 'kpi' ? 2 : 6;
      const insightsHeight = (chart.insights?.keyFinding ? 3 : 0) + (chart.insights?.recommendation ? 3 : 0);
      const maxHeight = Math.max(chartHeight, insightsHeight);
      currentY += maxHeight + 1; // Add 1 for spacing
    });
    
    // Store the generated layout
    setLayouts(prev => ({
      ...prev,
      [dashboardId]: layout
    }));
    
    return layout;
  }, [dashboards, layouts]);


  // Initialize layouts when dashboards change
  React.useEffect(() => {
    dashboards.forEach(dashboard => {
      if (!layouts[dashboard.id] && dashboard.charts.length > 0) {
        getLayoutForDashboard(dashboard.id);
      }
    });
  }, [dashboards, layouts, getLayoutForDashboard]);

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
                        onBlur={() => handleSaveEdit()}
                        onKeyPress={(e) => e.key === 'Enter' && handleSaveEdit()}
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
                  {dashboard.charts.length > 0 && (
                    <button
                      onClick={() => handleExportDashboard(dashboard)}
                      disabled={isExporting}
                      className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Export to PPT"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  )}
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
                    {dashboard.charts.flatMap((chart) => {
                      const components = [];
                      
                      // Add the main chart
                      components.push(
                        <div
                          key={chart.id}
                          data-chart-id={chart.id}
                          className="bg-white rounded-lg border border-gray-200 shadow-sm"
                          style={{ 
                            display: 'flex',
                            flexDirection: 'column',
                            height: '100%',
                            overflow: 'hidden'
                          }}
                        >
                          {renderSingleChart(chart, dashboard.id)}
                        </div>
                      );
                      
                      // Add insights as separate components if they exist
                      if (chart.insights?.keyFinding) {
                        components.push(
                          <div
                            key={`${chart.id}-keyfinding`}
                            data-chart-id={`${chart.id}-keyfinding`}
                            className="bg-white rounded-lg border border-gray-200 shadow-sm"
                            style={{ 
                              display: 'flex',
                              flexDirection: 'column',
                              height: '100%',
                              overflow: 'hidden'
                            }}
                          >
                            <div className="p-4 h-full flex flex-col">
                              <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-semibold text-gray-900">Key Finding</h3>
                                <button
                                  onClick={() => {
                                    console.log('Delete keyfinding button clicked!', { chartId: chart.id, dashboardId: dashboard.id });
                                    handleDeleteInsight(chart.id, 'keyfinding', dashboard.id);
                                  }}
                                  className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors duration-200"
                                  title="Delete Key Finding"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                              <div className="bg-amber-50 rounded-lg p-3 flex-1">
                                <div className="flex items-start space-x-2">
                                  <div className="w-5 h-5 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <Lightbulb className="w-3 h-3 text-amber-600" />
                                  </div>
                                  <div>
                                    <p className="text-sm text-amber-700">{chart.insights.keyFinding}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      
                      if (chart.insights?.recommendation) {
                        components.push(
                          <div
                            key={`${chart.id}-recommendation`}
                            data-chart-id={`${chart.id}-recommendation`}
                            className="bg-white rounded-lg border border-gray-200 shadow-sm"
                            style={{ 
                              display: 'flex',
                              flexDirection: 'column',
                              height: '100%',
                              overflow: 'hidden'
                            }}
                          >
                            <div className="p-4 h-full flex flex-col">
                              <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-semibold text-gray-900">Recommendation</h3>
                                <button
                                  onClick={() => {
                                    console.log('Delete recommendation button clicked!', { chartId: chart.id, dashboardId: dashboard.id });
                                    handleDeleteInsight(chart.id, 'recommendation', dashboard.id);
                                  }}
                                  className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors duration-200"
                                  title="Delete Recommendation"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                              <div className="bg-green-50 rounded-lg p-3 flex-1">
                                <div className="flex items-start space-x-2">
                                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <Target className="w-3 h-3 text-green-600" />
                                  </div>
                                  <div>
                                    <p className="text-sm text-green-700">{chart.insights.recommendation}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      
                      return components;
                    })}
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

      {/* Export Status Indicator */}
      {isExporting && (
        <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50">
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <div>
              <p className="text-sm font-medium text-gray-900">Exporting to PPT...</p>
              <p className="text-xs text-gray-500">{exportProgress}% complete</p>
            </div>
          </div>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-1">
            <div 
              className="bg-blue-600 h-1 rounded-full transition-all duration-300"
              style={{ width: `${exportProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Export Success/Error Messages */}
      {success && (
        <div className="fixed bottom-4 right-4 bg-green-50 border border-green-200 rounded-lg shadow-lg p-4 z-50">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
            <p className="text-sm text-green-700">PowerPoint exported successfully!</p>
          </div>
        </div>
      )}

      {error && (
        <div className="fixed bottom-4 right-4 bg-red-50 border border-red-200 rounded-lg shadow-lg p-4 z-50">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
            <div>
              <p className="text-sm text-red-700">Export failed</p>
              <p className="text-xs text-red-600">{error}</p>
            </div>
            <button
              onClick={resetExport}
              className="text-red-600 hover:text-red-800 text-xs underline ml-2"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

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