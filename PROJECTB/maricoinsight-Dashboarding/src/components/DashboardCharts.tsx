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
  Cell
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
          <p className="text-sm text-gray-700 leading-relaxed">{content}</p>
        </div>
      </div>
    </div>
  );
};

export const DashboardCharts: React.FC<DashboardChartsProps> = ({ analysis, isLoading, onAddChartRequest, isInGrid = false }) => {
  const charts = analysis?.charts || [];
  
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-600">{cleanTitle}</h3>
          <div className="flex items-center space-x-2">
            {onAddChartRequest && (
              <button
                onClick={() => onAddChartRequest(chart)}
                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                title="Add to Dashboard"
              >
                <Plus className="w-3 h-3" />
              </button>
            )}
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
    const colors = chart.config.colors || DEFAULT_COLORS;
    
    // For grid layout, we need to ensure proper height
    const chartHeight = isInGrid ? "calc(100% - 60px)" : 260;
    
    switch (chart.type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart data={chart.data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              {chart.config.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />}
              <XAxis 
                dataKey={chart.config.xKey} 
                tick={{ fontSize: 12 }}
                stroke="#6b7280"
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                stroke="#6b7280"
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
                  <Bar 
                    key={key} 
                    dataKey={key} 
                    fill={colors[index % colors.length]}
                    radius={[4, 4, 0, 0]}
                  />
                ))
              ) : (
                <Bar 
                  dataKey={chart.config.yKey} 
                  fill={colors[0]}
                  radius={[4, 4, 0, 0]}
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <LineChart data={chart.data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              {chart.config.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />}
              <XAxis 
                dataKey={chart.config.xKey} 
                tick={{ fontSize: 12 }}
                stroke="#6b7280"
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                stroke="#6b7280"
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
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <AreaChart data={chart.data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              {chart.config.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />}
              <XAxis 
                dataKey={chart.config.xKey} 
                tick={{ fontSize: 12 }}
                stroke="#6b7280"
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                stroke="#6b7280"
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
        );
      }

      case 'scatter':
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <ScatterChart data={chart.data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              {chart.config.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />}
              <XAxis 
                dataKey={chart.config.xKey} 
                tick={{ fontSize: 12 }}
                stroke="#6b7280"
              />
              <YAxis 
                dataKey={chart.config.yKey as string}
                tick={{ fontSize: 12 }}
                stroke="#6b7280"
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
              <Scatter fill={colors[0]} />
            </ScatterChart>
          </ResponsiveContainer>
        );

      default:
        return (
          <div className="flex items-center justify-center h-64 text-gray-500">
            <p>Unsupported chart type: {chart.type}</p>
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
  const kpiCards = charts.filter(chart => chart.type === 'kpi');
  const regularCharts = charts.filter(chart => chart.type !== 'kpi');

  return (
    <div className="space-y-4">
      {/* KPI Cards Row */}
      {kpiCards.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {kpiCards.map((chart) => (
            <div key={chart.id} data-chart-id={chart.id}>
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
              <div key={chart.id} data-chart-id={chart.id} className={`${isInGrid ? 'h-full flex flex-col' : 'bg-white rounded-xl shadow-sm border border-gray-200 w-full'} p-4`}>
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
                    {onAddChartRequest && (
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
                  <div className="flex gap-6 h-96">
                    {/* Chart Section - Left 2/3 */}
                    <div className="flex-1 flex flex-col">
                      {chart.type === 'kpi' ? (
                        <div className="mb-4">
                          {renderKpiCard(chart)}
                        </div>
                      ) : (
                        <div className="bg-gray-50 rounded-lg p-3 flex-1">
                          {renderChart(chart)}
                        </div>
                      )}
                      
                      {/* Chart Footer */}
                      <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                        <span>{chart.data?.length || 0} data points</span>
                        <span>Interactive • Responsive</span>
                      </div>
                    </div>

                    {/* Insights Section - Right 1/3 */}
                    <div className="w-1/3 flex flex-col space-y-4">
                      <div className="flex-1">
                        <InsightCard
                          icon={Lightbulb}
                          title="Key Finding"
                          content={parsedDescription.keyFinding}
                          color="text-amber-600"
                          bgColor="bg-amber-50"
                        />
                      </div>
                      
                      <div className="flex-1">
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