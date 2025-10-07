import React from 'react';
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
  Cell,
  ReferenceLine
} from 'recharts';
import { ChartData, AnalysisResult } from '../types/chart';
import { BarChart3, TrendingUp, PieChart as PieChartIcon, Activity, Target, ArrowUp, ArrowDown, Minus, Lightbulb, Plus } from 'lucide-react';

interface DashboardChartsProps {
  analysis: AnalysisResult | null;
  isLoading?: boolean;
  onAddChartRequest?: (chart: ChartData) => void;
  isInGrid?: boolean;
}

const DEFAULT_COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
  '#06B6D4', '#F97316', '#84CC16', '#EC4899', '#6366F1'
];

const parseChartDescription = (description: string) => {
  const sections = {
    keyFinding: '',
    businessImpact: '',
    recommendation: '',
    supportingData: ''
  };

  // Extract key finding
  const keyFindingMatch = description.match(/Key Finding[:\s]*([^.]*\.?[^.]*\.?)/i);
  if (keyFindingMatch) {
    sections.keyFinding = keyFindingMatch[1].trim();
  }

  // Extract business impact
  const businessImpactMatch = description.match(/Business Impact[:\s]*([^.]*\.?[^.]*\.?)/i);
  if (businessImpactMatch) {
    sections.businessImpact = businessImpactMatch[1].trim();
  }

  // Extract quantified recommendation
  const recommendationMatch = description.match(/(?:Quantified )?Recommendation[:\s]*([^.]*\.?[^.]*\.?)/i);
  if (recommendationMatch) {
    sections.recommendation = recommendationMatch[1].trim();
  }

  // Extract supporting data
  const supportingDataMatch = description.match(/Supporting Data[:\s]*([^.]*\.?[^.]*\.?)/i);
  if (supportingDataMatch) {
    sections.supportingData = supportingDataMatch[1].trim();
  }

  // Fallback: if no structured sections found, use first sentence as key finding
  if (!sections.keyFinding && !sections.recommendation) {
    const sentences = description.split(/[.!?]+/).filter(s => s.trim().length > 10);
    if (sentences.length > 0) {
      sections.keyFinding = sentences[0].trim();
    }
    if (sentences.length > 1) {
      sections.recommendation = sentences[1].trim();
    }
  }

  return sections;
};

const InsightCard: React.FC<{ 
  icon: React.ComponentType<any>, 
  title: string, 
  content: string, 
  color: string,
  bgColor: string 
}> = ({ icon: Icon, title, content, color, bgColor }) => {
  if (!content) return null;
  
  return (
    <div className={`${bgColor} border border-opacity-20 rounded-lg p-3 mb-3`}>
      <div className="flex items-start space-x-2">
        <div className={`w-5 h-5 ${color} mt-0.5 flex-shrink-0`}>
          <Icon className="w-full h-full" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className={`text-sm font-semibold ${color} mb-1`}>{title}</h4>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{content}</p>
        </div>
      </div>
    </div>
  );
};

export const DashboardCharts: React.FC<DashboardChartsProps> = ({ analysis, isLoading, onAddChartRequest, isInGrid = false }) => {
  const charts = analysis?.charts || [];
  
  // Filter out unsupported chart types to prevent "Unsupported chart type" messages
  const supportedChartTypes = ['bar', 'line', 'pie', 'area', 'scatter', 'donut', 'kpi'];
  const filteredCharts = charts.filter(chart => supportedChartTypes.includes(chart.type));
  
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
      <div data-chart-id={chart.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-600">{cleanTitle}</h3>
          <div className="flex items-center space-x-2">
            {/* KPI cards are view-only in analysis panel: no add button */}
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Target className="w-4 h-4 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="mb-4">
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {value ? (
              unit === '$' ? `$${typeof value === 'string' ? value : value.toLocaleString()}` :
              unit ? `${value} ${unit}` : 
              typeof value === 'string' ? value : value.toLocaleString()
            ) : 'N/A'}
          </div>
          {/* Show a brief summary instead of full description */}
          {chart.description && chart.description.includes('Key Finding:') && (
            <p className="text-sm text-gray-500 line-clamp-2">
              {chart.description.split('Key Finding:')[1]?.split('.')[0]?.trim() || chart.title}
            </p>
          )}
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
        
        {/* Show key insight at bottom if available */}
        {chart.description && chart.description.includes('Quantified Recommendation:') && (
          <div className="mt-3 p-2 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-700 font-medium">💡 {chart.description.split('Quantified Recommendation:')[1]?.split('.')[0]?.trim()}</p>
          </div>
        )}
      </div>
    );
  };
  
  const renderChart = (chart: ChartData) => {
    const safeConfig = chart.config || {} as any;
    const colors = (safeConfig.colors && Array.isArray(safeConfig.colors) ? safeConfig.colors : DEFAULT_COLORS);
    
    // Log data point count for debugging
    const dataPointCount = Array.isArray(chart.data) ? chart.data.length : 0;
    console.log(`🎨 Rendering chart "${chart.title}" (${chart.type}) with ${dataPointCount} data points`);
    
    if (dataPointCount === 0) {
      console.error(`❌ ERROR: Chart "${chart.title}" has NO data points to render!`);
    } else if (dataPointCount <= 5) {
      console.warn(`⚠️ WARNING: Chart "${chart.title}" has only ${dataPointCount} data points - this might be incomplete!`);
    }
    
    // For grid layout, we need to ensure proper height
    const chartHeight = isInGrid ? "calc(100% - 60px)" : 260;
    
    // Create a wrapper div with data-chart-id for export functionality
    const ChartWrapper = ({ children }: { children: React.ReactNode }) => (
      <div data-chart-id={chart.id} className="w-full h-full">
        {children}
      </div>
    );
    
    switch (chart.type) {
      case 'bar':
        // Sort data by x-axis values for proper ordering
        const sortedBarData = [...chart.data].sort((a, b) => {
          const aVal = a[safeConfig.xKey || 'category'];
          const bVal = b[safeConfig.xKey || 'category'];
          // Try numeric sorting first, then alphabetical
          if (!isNaN(Number(aVal)) && !isNaN(Number(bVal))) {
            return Number(aVal) - Number(bVal);
          }
          return String(aVal).localeCompare(String(bVal));
        });
        
        return (
          <ChartWrapper>
            <ResponsiveContainer width="100%" height={chartHeight}>
              <BarChart data={sortedBarData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                {safeConfig.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />}
                <XAxis 
                  dataKey={safeConfig.xKey} 
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                  label={{ 
                    value: safeConfig.xAxisLabel || (safeConfig.xKey || 'Categories'), 
                    position: 'insideBottom', 
                    offset: -5,
                    style: { textAnchor: 'middle', fontSize: '12px', fill: '#374151' }
                  }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                  label={{ 
                    value: safeConfig.yAxisLabel || 'Values', 
                    angle: -90, 
                    position: 'insideLeft',
                    style: { textAnchor: 'middle', fontSize: '12px', fill: '#374151' }
                  }}
                />
                {safeConfig.showTooltip && (
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                )}
                {safeConfig.showLegend && <Legend />}
                {Array.isArray(safeConfig.yKey) ? (
                  safeConfig.yKey.map((key: string, index: number) => (
                    <Bar 
                      key={key} 
                      dataKey={key} 
                      fill={colors[index % colors.length]}
                      radius={[4, 4, 0, 0]}
                    />
                  ))
                ) : (
                  <Bar 
                    dataKey={safeConfig.yKey} 
                    fill={colors[0]}
                    radius={[4, 4, 0, 0]}
                  />
                )}
              </BarChart>
            </ResponsiveContainer>
          </ChartWrapper>
        );

      case 'line':
        // Sort data by x-axis values for proper ordering
        const sortedLineData = [...chart.data].sort((a, b) => {
          const aVal = a[chart.config.xKey || 'x'];
          const bVal = b[chart.config.xKey || 'x'];
          // Try numeric sorting first, then alphabetical
          if (!isNaN(Number(aVal)) && !isNaN(Number(bVal))) {
            return Number(aVal) - Number(bVal);
          }
          return String(aVal).localeCompare(String(bVal));
        });
        
        return (
          <ChartWrapper>
            <ResponsiveContainer width="100%" height={chartHeight}>
              <LineChart data={sortedLineData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                {chart.config.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />}
                <XAxis 
                  dataKey={chart.config.xKey} 
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                  label={{ 
                    value: chart.config.xAxisLabel || (chart.config.xKey || 'X-Axis'), 
                    position: 'insideBottom', 
                    offset: -5,
                    style: { textAnchor: 'middle', fontSize: '12px', fill: '#374151' }
                  }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                  label={{ 
                    value: chart.config.yAxisLabel || (chart.config.yKey || 'Y-Axis'), 
                    angle: -90, 
                    position: 'insideLeft',
                    style: { textAnchor: 'middle', fontSize: '12px', fill: '#374151' }
                  }}
                />
                {chart.config.showTooltip && (
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                )}
                {chart.config.showLegend && <Legend />}
                {Array.isArray(chart.config.yKey) ? (
                  chart.config.yKey.map((key, index) => (
                    <Line 
                      key={key} 
                      type="monotone" 
                      dataKey={key} 
                      stroke={colors[index % colors.length]}
                      strokeWidth={3}
                      dot={{ fill: colors[index % colors.length], strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: colors[index % colors.length], strokeWidth: 2 }}
                    />
                  ))
                ) : (
                  <Line 
                    type="monotone" 
                    dataKey={chart.config.yKey} 
                    stroke={colors[0]}
                    strokeWidth={3}
                    dot={{ fill: colors[0], strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: colors[0], strokeWidth: 2 }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </ChartWrapper>
        );

      case 'area':
        // Sort data by x-axis values for proper ordering
        const sortedAreaData = [...chart.data].sort((a, b) => {
          const aVal = a[chart.config.xKey || 'x'];
          const bVal = b[chart.config.xKey || 'x'];
          // Try numeric sorting first, then alphabetical
          if (!isNaN(Number(aVal)) && !isNaN(Number(bVal))) {
            return Number(aVal) - Number(bVal);
          }
          return String(aVal).localeCompare(String(bVal));
        });
        
        return (
          <ChartWrapper>
            <ResponsiveContainer width="100%" height={chartHeight}>
              <AreaChart data={sortedAreaData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                {chart.config.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />}
                <XAxis 
                  dataKey={chart.config.xKey} 
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                  label={{ 
                    value: chart.config.xAxisLabel || (chart.config.xKey || 'X-Axis'), 
                    position: 'insideBottom', 
                    offset: -5,
                    style: { textAnchor: 'middle', fontSize: '12px', fill: '#374151' }
                  }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                  label={{ 
                    value: chart.config.yAxisLabel || (chart.config.yKey || 'Y-Axis'), 
                    angle: -90, 
                    position: 'insideLeft',
                    style: { textAnchor: 'middle', fontSize: '12px', fill: '#374151' }
                  }}
                />
                {chart.config.showTooltip && (
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                )}
                {chart.config.showLegend && <Legend />}
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
          </ChartWrapper>
        );

      case 'pie':
      case 'donut': {
        // Ensure data is properly formatted for pie chart
        const formattedData = chart.data.map((item, index) => ({
          ...item,
          fill: colors[index % colors.length]
        }));

        console.log('Pie chart data:', formattedData);
        console.log('Pie chart config:', chart.config);
        console.log('Original chart data:', chart.data);
        
        // Validate data structure
        if (!formattedData || formattedData.length === 0) {
          console.error('No data available for pie chart');
          return (
            <div className="flex items-center justify-center h-full text-gray-500">
              No data available for pie chart
            </div>
          );
        }
        
        // Check if data has required fields
        const hasValidData = formattedData.every((item: Record<string, unknown>) => 
          (item[chart.config.valueKey || 'value'] !== undefined) && 
          (item[chart.config.nameKey || 'name'] !== undefined)
        );
        
        if (!hasValidData) {
          console.error('Invalid data structure for pie chart:', formattedData);
          return (
            <div className="flex items-center justify-center h-full text-gray-500">
              Invalid data structure for pie chart
            </div>
          );
        }

        return (
          <ChartWrapper>
            <ResponsiveContainer width="100%" height={isInGrid ? "calc(100% - 60px)" : 300}>
              <PieChart>
                <Pie
                  data={formattedData}
                  cx="50%"
                  cy="50%"
                  outerRadius={isInGrid ? "60%" : (chart.type === 'donut' ? 90 : 100)}
                  innerRadius={isInGrid ? (chart.type === 'donut' ? "30%" : 0) : (chart.type === 'donut' ? 45 : 0)}
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
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
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
          </ChartWrapper>
        );
      }

      case 'scatter':
        // Sort data by x-axis values for proper ordering
        const sortedScatterData = [...chart.data].sort((a, b) => {
          const aVal = Number(a[safeConfig.xKey || 'x']);
          const bVal = Number(b[safeConfig.xKey || 'x']);
          return aVal - bVal;
        });
        
        return (
          <ChartWrapper>
            <ResponsiveContainer width="100%" height={chartHeight}>
              <ScatterChart data={sortedScatterData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                {chart.config.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />}
                <XAxis 
                  dataKey={chart.config.xKey} 
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                  label={{ 
                    value: chart.config.xAxisLabel || (chart.config.xKey || 'X-Axis'), 
                    position: 'insideBottom', 
                    offset: -5,
                    style: { textAnchor: 'middle', fontSize: '12px', fill: '#374151' }
                  }}
                />
                <YAxis 
                  dataKey={chart.config.yKey as string}
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                  label={{ 
                    value: chart.config.yAxisLabel || (chart.config.yKey || 'Y-Axis'), 
                    angle: -90, 
                    position: 'insideLeft',
                    style: { textAnchor: 'middle', fontSize: '12px', fill: '#374151' }
                  }}
                />
                {chart.config.showTooltip && (
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        const xValue = data[safeConfig.xKey || 'x'];
                        const yValue = data[safeConfig.yKey as string];
                        return (
                          <div className="p-2">
                            <p className="text-sm font-medium text-gray-900">
                              {safeConfig.xAxisLabel || (safeConfig.xKey || 'X')}: {xValue}
                            </p>
                            <p className="text-sm font-medium text-gray-900">
                              {safeConfig.yAxisLabel || (safeConfig.yKey || 'Y')}: {yValue}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                )}
                <Scatter fill={colors[0]} />
                {(chart.config.showTrendLine !== false) && (() => {
                  // Calculate linear regression for proper trend line
                  const xValues = sortedScatterData.map(d => Number(d[safeConfig.xKey || 'x']));
                  const yValues = sortedScatterData.map(d => Number(d[safeConfig.yKey as string]));
                  
                  if (xValues.length < 2) return null;
                  
                  // Calculate means
                  const xMean = xValues.reduce((a, b) => a + b, 0) / xValues.length;
                  const yMean = yValues.reduce((a, b) => a + b, 0) / yValues.length;
                  
                  // Calculate slope and intercept using least squares method
                  let numerator = 0;
                  let denominator = 0;
                  
                  for (let i = 0; i < xValues.length; i++) {
                    numerator += (xValues[i] - xMean) * (yValues[i] - yMean);
                    denominator += (xValues[i] - xMean) * (xValues[i] - xMean);
                  }
                  
                  const slope = denominator === 0 ? 0 : numerator / denominator;
                  const intercept = yMean - slope * xMean;
                  
                  // Calculate trend line points
                  const minX = Math.min(...xValues);
                  const maxX = Math.max(...xValues);
                  const trendY1 = slope * minX + intercept;
                  const trendY2 = slope * maxX + intercept;
                  
                  return (
                    <ReferenceLine 
                      segment={[
                        { x: minX, y: trendY1 },
                        { x: maxX, y: trendY2 }
                      ]}
                      stroke="#ef4444"
                      strokeWidth={3}
                      strokeDasharray="8 4"
                    />
                  );
                })()}
              </ScatterChart>
            </ResponsiveContainer>
          </ChartWrapper>
        );

      default:
        return (
          <div className="flex items-center justify-center h-64 text-gray-500 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-center">
              <p className="text-red-600 font-medium">Unsupported chart type: {chart.type}</p>
              <p className="text-sm text-red-500 mt-1">This chart type is not supported. Please try a different analysis.</p>
            </div>
          </div>
        );
    }
  };

  const getChartIcon = (type: string) => {
    switch (type) {
      case 'bar':
        return BarChart3;
      case 'line':
      case 'area':
        return TrendingUp;
      case 'pie':
      case 'donut':
        return PieChartIcon;
      case 'scatter':
        return Activity;
      case 'kpi':
        return Target;
      default:
        return BarChart3;
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="animate-pulse">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              </div>
              <div className="h-48 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!charts || charts.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <BarChart3 className="w-8 h-8 text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Analysis Selected</h3>
        <p className="text-gray-600">Select an analysis from the dropdown above to view charts and KPIs.</p>
      </div>
    );
  }

  // Separate KPIs and regular charts
  const kpiCards = filteredCharts.filter(chart => chart.type === 'kpi');
  const regularCharts = filteredCharts.filter(chart => chart.type !== 'kpi');

  return (
    <div className="space-y-4">
      {/* KPI Cards Row */}
      {kpiCards.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {kpiCards.map((chart) => (
            <div key={chart.id}>
              {/* KPI cards are view-only; they cannot be added to dashboards */}
              {renderKpiCard(chart)}
            </div>
          ))}
        </div>
      )}
      
      {/* Regular Charts - One per row */}
      {regularCharts.length > 0 && (
        <div className={`${isInGrid ? 'h-full' : 'space-y-6'}`}>
          {regularCharts.map((chart) => {
            const Icon = getChartIcon(chart.type);
            const parsedDescription = parseChartDescription(chart.description || '');
            return (
              <div key={chart.id} className={`${isInGrid ? 'h-full flex flex-col' : 'bg-white rounded-xl shadow-sm border border-gray-200 w-full'} p-4`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Icon className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">{chart.title}</h3>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {onAddChartRequest && chart.type !== 'kpi' && (
                      <button
                        onClick={() => {
                          // Create chart with insights data
                          const chartWithInsights = {
                            ...chart,
                            insights: {
                              keyFinding: parsedDescription.keyFinding,
                              recommendation: parsedDescription.recommendation
                            }
                          };
                          onAddChartRequest(chartWithInsights);
                        }}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                        title="Add to Dashboard"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    )}
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 capitalize">
                      {chart.type}
                    </span>
                  </div>
                </div>
                
                {/* Main Content - Side by Side Layout */}
                {!isInGrid && (
                  <div className="flex gap-6 items-start">
                    {/* Chart Section - Left 2/3 */}
                    <div className="flex-1">
                      {chart.type === 'kpi' ? (
                        <div className="mb-4">
                          {renderKpiCard(chart)}
                        </div>
                      ) : (
                        <div className="bg-gray-50 rounded-lg p-3">
                          {renderChart(chart)}
                        </div>
                      )}
                      
                      {/* Chart Footer */}
                      <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center space-x-2">
                          <span className={`font-medium ${(chart.data?.length || 0) <= 5 ? 'text-orange-600' : 'text-green-600'}`}>
                            ✓ {chart.data?.length || 0} data points
                          </span>
                          {(chart.data?.length || 0) > 20 && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                              Complete Dataset
                            </span>
                          )}
                        </div>
                        <span>Interactive • Responsive</span>
                      </div>
                    </div>

                    {/* Insights Section - Right 1/3 */}
                    <div className="w-1/3 flex flex-col space-y-4 max-h-96 overflow-y-auto">
                      <div>
                        <InsightCard
                          icon={Lightbulb}
                          title="Key Finding"
                          content={parsedDescription.keyFinding}
                          color="text-amber-600"
                          bgColor="bg-amber-50"
                        />
                      </div>
                      
                      <div>
                        <InsightCard
                          icon={Target}
                          title="Recommendation"
                          content={parsedDescription.recommendation}
                          color="text-green-600"
                          bgColor="bg-green-50"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Grid Layout (for dashboard view) */}
                {isInGrid && (
                  <>
                    {chart.type === 'kpi' ? (
                      <div className="mb-4">
                        {renderKpiCard(chart)}
                      </div>
                    ) : (
                      <div className="bg-gray-50 rounded-lg p-3 flex-1" style={{ height: 'auto' }}>
                        {renderChart(chart)}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};