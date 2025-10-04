import React, { useState } from 'react';
import { 
  Database, 
  Cloud, 
  BarChart3, 
  MessageSquare, 
  Layout, 
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Loader
} from 'lucide-react';
import { useCosmosChatHistory, useCosmosCharts, useCosmosDashboards, useCosmosAnalysis } from '../hooks/useCosmosDB';
import { ChartData, AnalysisResult } from '../types/chart';
import { ChatHistoryDocument, ChartDocument, DashboardDocument, AnalysisDocument } from '../types/cosmosdb';

export const CosmosDBDemo: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'chats' | 'charts' | 'dashboards' | 'analysis'>('chats');
  
  // Hooks for different data types
  const { 
    chats, 
    saveChat, 
    loading: chatsLoading, 
    error: chatsError 
  } = useCosmosChatHistory();
  
  const { 
    charts, 
    saveChart, 
    loading: chartsLoading, 
    error: chartsError 
  } = useCosmosCharts();
  
  const { 
    dashboards, 
    saveDashboard, 
    loading: dashboardsLoading, 
    error: dashboardsError 
  } = useCosmosDashboards();
  
  const { 
    analyses, 
    saveAnalysis, 
    loading: analysesLoading, 
    error: analysesError 
  } = useCosmosAnalysis();

  // Demo data creation functions
  const createDemoChat = async () => {
    const demoChat: Omit<ChatHistoryDocument, 'id' | 'type'> = {
      title: `Demo Chat ${Date.now()}`,
      summary: 'This is a demo chat created for testing CosmosDB integration',
      timestamp: new Date().toISOString(),
      chatType: 'analysis',
      messageCount: 3,
      lastMessage: 'What are the key insights from this data?',
      messages: [
        {
          id: 'msg_1',
          role: 'user',
          content: 'Can you analyze this sales data?',
          timestamp: new Date().toISOString()
        },
        {
          id: 'msg_2',
          role: 'assistant',
          content: 'I can see several interesting trends in your sales data...',
          timestamp: new Date().toISOString()
        },
        {
          id: 'msg_3',
          role: 'user',
          content: 'What are the key insights from this data?',
          timestamp: new Date().toISOString()
        }
      ],
      userId: 'demo-user',
      sessionId: 'demo-session'
    };
    
    try {
      await saveChat(demoChat);
    } catch (error) {
      console.error('Failed to create demo chat:', error);
    }
  };

  const createDemoChart = async () => {
    const demoChartData: ChartData = {
      id: `chart_${Date.now()}`,
      type: 'bar',
      title: 'Demo Sales Chart',
      description: 'A demo chart showing sales performance',
      data: [
        { month: 'Jan', sales: 4000 },
        { month: 'Feb', sales: 3000 },
        { month: 'Mar', sales: 5000 },
        { month: 'Apr', sales: 4500 },
        { month: 'May', sales: 6000 }
      ],
      config: {
        xKey: 'month',
        yKey: 'sales',
        colors: ['#3B82F6'],
        showLegend: true,
        showGrid: true,
        showTooltip: true
      }
    };

    const demoChart: Omit<ChartDocument, 'id' | 'type'> = {
      chartData: demoChartData,
      userId: 'demo-user',
      sessionId: 'demo-session',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: ['demo', 'sales'],
      isPublic: false
    };
    
    try {
      await saveChart(demoChart);
    } catch (error) {
      console.error('Failed to create demo chart:', error);
    }
  };

  const createDemoDashboard = async () => {
    const demoCharts: ChartData[] = [
      {
        id: 'chart_1',
        type: 'kpi',
        title: 'Total Sales',
        data: [],
        config: { value: 125000, unit: '$', trend: 12, trendDirection: 'up' }
      },
      {
        id: 'chart_2',
        type: 'line',
        title: 'Sales Trend',
        data: [
          { month: 'Jan', sales: 4000 },
          { month: 'Feb', sales: 3000 },
          { month: 'Mar', sales: 5000 }
        ],
        config: { xKey: 'month', yKey: 'sales' }
      }
    ];

    const demoDashboard: Omit<DashboardDocument, 'id' | 'type'> = {
      name: `Demo Dashboard ${Date.now()}`,
      description: 'A demo dashboard created for testing CosmosDB integration',
      charts: demoCharts,
      layout: demoCharts.map((chart, index) => ({
        chartId: chart.id,
        x: 0,
        y: index * 4,
        w: 6,
        h: 4
      })),
      userId: 'demo-user',
      sessionId: 'demo-session',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: ['demo', 'sales'],
      isPublic: false
    };
    
    try {
      await saveDashboard(demoDashboard);
    } catch (error) {
      console.error('Failed to create demo dashboard:', error);
    }
  };

  const createDemoAnalysis = async () => {
    const demoAnalysisResult: AnalysisResult = {
      summary: 'This is a demo analysis result showing key insights from sales data',
      insights: [
        'Sales increased by 12% compared to last quarter',
        'Top performing product category is Electronics',
        'Customer acquisition cost decreased by 8%'
      ],
      charts: [],
      metadata: {
        confidence: 0.85,
        dataPoints: 1250,
        timeRange: 'Q4 2023'
      }
    };

    const demoAnalysis: Omit<AnalysisDocument, 'id' | 'type'> = {
      analysisResult: demoAnalysisResult,
      userId: 'demo-user',
      sessionId: 'demo-session',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: ['demo', 'sales', 'analysis'],
      isPublic: false
    };
    
    try {
      await saveAnalysis(demoAnalysis);
    } catch (error) {
      console.error('Failed to create demo analysis:', error);
    }
  };

  const getCurrentData = () => {
    switch (activeTab) {
      case 'chats': return { data: chats, loading: chatsLoading, error: chatsError };
      case 'charts': return { data: charts, loading: chartsLoading, error: chartsError };
      case 'dashboards': return { data: dashboards, loading: dashboardsLoading, error: dashboardsError };
      case 'analysis': return { data: analyses, loading: analysesLoading, error: analysesError };
      default: return { data: [], loading: false, error: null };
    }
  };

  const getCreateFunction = () => {
    switch (activeTab) {
      case 'chats': return createDemoChat;
      case 'charts': return createDemoChart;
      case 'dashboards': return createDemoDashboard;
      case 'analysis': return createDemoAnalysis;
      default: return () => {};
    }
  };

  const { data, loading, error } = getCurrentData();

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Database className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">CosmosDB Integration Demo</h1>
              <p className="text-sm text-gray-500">Test saving and retrieving data from Azure CosmosDB</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'chats', label: 'Chats', icon: MessageSquare },
              { id: 'charts', label: 'Charts', icon: BarChart3 },
              { id: 'dashboards', label: 'Dashboards', icon: Layout },
              { id: 'analysis', label: 'Analysis', icon: TrendingUp }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as 'chats' | 'charts' | 'dashboards' | 'analysis')}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
                <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                  {data.length}
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Status and Actions */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              {loading ? (
                <div className="flex items-center space-x-2 text-blue-600">
                  <Loader className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Loading...</span>
                </div>
              ) : error ? (
                <div className="flex items-center space-x-2 text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">Error: {error.message}</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm">Connected to CosmosDB</span>
                </div>
              )}
            </div>
            
            <button
              onClick={getCreateFunction()}
              disabled={loading}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Cloud className="w-4 h-4" />
              <span>Create Demo {activeTab.slice(0, -1)}</span>
            </button>
          </div>

          {/* Data Display */}
          <div className="space-y-4">
            {data.length === 0 ? (
              <div className="text-center py-12">
                <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No {activeTab} found</h3>
                <p className="text-gray-500 mb-4">Create some demo data to test the CosmosDB integration</p>
                <button
                  onClick={getCreateFunction()}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Cloud className="w-4 h-4" />
                  <span>Create Demo {activeTab.slice(0, -1)}</span>
                </button>
              </div>
            ) : (
              data.map((item, index: number) => (
                <div key={item.id || index} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {'title' in item ? item.title : 'name' in item ? item.name : `Item ${index + 1}`}
                      </h4>
                      <p className="text-sm text-gray-500">
                        ID: {item.id} | Created: {new Date(('createdAt' in item ? item.createdAt : 'timestamp' in item ? item.timestamp : new Date()) as string).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {'type' in item ? item.type : activeTab.slice(0, -1)}
                      </span>
                    </div>
                  </div>
                  
                  {'summary' in item && item.summary && (
                    <p className="mt-2 text-sm text-gray-600">{item.summary}</p>
                  )}
                  
                  {'tags' in item && item.tags && Array.isArray(item.tags) && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {(item.tags as string[]).map((tag: string, tagIndex: number) => (
                        <span
                          key={tagIndex}
                          className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-200 text-gray-700"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CosmosDBDemo;
