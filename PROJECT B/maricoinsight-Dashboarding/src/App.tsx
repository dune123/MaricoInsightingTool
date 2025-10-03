import React, { useState } from 'react';
import { FileUpload } from './components/FileUpload';
import { InsightsChatbot } from './components/InsightsChatbot';
import { ChartingChatbot } from './components/ChartingChatbot';
import { Settings } from './components/Settings';
import { DashboardCharts } from './components/DashboardCharts';
import { AzureOpenAIService } from './lib/azure-openai';
import { AnalysisResult, DashboardHistoryItem, Dashboard, ChartData } from './types/chart';
import { 
  FileText, 
  Settings as SettingsIcon, 
  MessageCircle, 
  Plus,
  Menu,
  X,
  BarChart3,
  Brain,
  Home,
  Folder,
  History,
  HelpCircle,
  LayoutDashboard
} from 'lucide-react';
import { DashboardBot } from './components/DashboardBot';
import { AddChartToDashboardModal } from './components/AddChartToDashboardModal';

export interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadDate: Date;
  status: 'uploading' | 'ready' | 'analyzing' | 'completed' | 'error';
  assistantId?: string;
  threadId?: string;
  file?: File;
  analysis?: AnalysisResult;
}

function App() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [activePanel, setActivePanel] = useState<'insightsBot' | 'documents' | 'history' | 'settings' | 'dashboardBot'>('insightsBot');
  const [insightsAssistantId, setInsightsAssistantId] = useState<string | null>(null);
  const [insightsThreadId, setInsightsThreadId] = useState<string | null>(null);
  const [dashboardHistory, setDashboardHistory] = useState<DashboardHistoryItem[]>([]);
  const [selectedDashboardIndex, setSelectedDashboardIndex] = useState<number | null>(null);
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [showAddChartModal, setShowAddChartModal] = useState(false);
  const [chartToAdd, setChartToAdd] = useState<ChartData | null>(null);
  const [azureConfig, setAzureConfig] = useState({
    apiKey: import.meta.env.VITE_AZURE_API_KEY || 'REPLACE_WITH_YOUR_API_KEY',
    endpoint: import.meta.env.VITE_AZURE_ENDPOINT || 'https://your-resource.cognitiveservices.azure.com/',
    deploymentName: import.meta.env.VITE_AZURE_DEPLOYMENT_NAME || 'gpt-4o-mini'
  });

  const handleDocumentUpload = (file: File) => {
    const newDoc: Document = {
      id: crypto.randomUUID(),
      name: file.name,
      type: file.type,
      size: file.size,
      uploadDate: new Date(),
      status: 'ready',
      file: file
    };
    
    setDocuments(prev => [...prev, newDoc]);
    setSelectedDocument(newDoc);
    // Don't auto-switch panels - let user stay in current bot
  };

  const handleDocumentUpdate = (updatedDoc: Document) => {
    setDocuments(prev => prev.map(doc => 
      doc.id === updatedDoc.id ? updatedDoc : doc
    ));
    
    if (selectedDocument?.id === updatedDoc.id) {
      setSelectedDocument(updatedDoc);
      
      // If document just completed analysis, add to dashboard history
      if (updatedDoc.status === 'completed' && updatedDoc.analysis && 
          !dashboardHistory.some(item => item.question === 'Initial Analysis' && item.analysis === updatedDoc.analysis)) {
        console.log('Adding initial analysis to dashboard history:', updatedDoc.analysis);
        const newHistoryItem: DashboardHistoryItem = {
          question: 'Initial Analysis',
          analysis: updatedDoc.analysis,
          timestamp: new Date()
        };
        setDashboardHistory(prev => [newHistoryItem, ...prev]);
        setSelectedDashboardIndex(0);
      }
    }
  };

  const handleNewAnalysis = (question: string, analysis: AnalysisResult) => {
    const newHistoryItem: DashboardHistoryItem = {
      question,
      analysis,
      timestamp: new Date()
    };
    setDashboardHistory(prev => [newHistoryItem, ...prev]);
    setSelectedDashboardIndex(0);
  };

  const handleCreateNewDashboard = (name: string, initialChart?: ChartData) => {
    const newDashboard: Dashboard = {
      id: crypto.randomUUID(),
      name,
      charts: initialChart ? [initialChart] : [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setDashboards(prev => [...prev, newDashboard]);
    return newDashboard.id;
  };

  const handleAddChartToDashboard = (dashboardId: string, chart: ChartData) => {
    // Add layout properties to the chart if not present
    const chartWithLayout = {
      ...chart,
      id: chart.id || crypto.randomUUID(),
      layout: chart.layout || {
        x: 0,
        y: 0,
        w: chart.type === 'kpi' ? 3 : 6,
        h: chart.type === 'kpi' ? 2 : 4
      }
    };
    
    setDashboards(prev => prev.map(dashboard => 
      dashboard.id === dashboardId 
        ? { 
            ...dashboard, 
            charts: [...dashboard.charts, chartWithLayout],
            updatedAt: new Date()
          }
        : dashboard
    ));
  };

  const handleUpdateDashboardCharts = (dashboardId: string, updatedCharts: ChartData[]) => {
    setDashboards(prev => prev.map(dashboard => 
      dashboard.id === dashboardId 
        ? { ...dashboard, charts: updatedCharts, updatedAt: new Date() }
        : dashboard
    ));
  };

  const handleDeleteDashboard = (dashboardId: string) => {
    setDashboards(prev => prev.filter(dashboard => dashboard.id !== dashboardId));
  };

  const handleAddChartRequest = (chart: ChartData) => {
    setChartToAdd(chart);
    setShowAddChartModal(true);
  };

  const sidebarButtons = [
    { id: 'insightsBot', icon: Brain, label: 'Insights Bot' },
    { id: 'dashboardBot', icon: LayoutDashboard, label: 'Dashboards' },
    { id: 'documents', icon: Folder, label: 'Documents' },
    { id: 'history', icon: History, label: 'History' },
    { id: 'settings', icon: SettingsIcon, label: 'Settings' }
  ];

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* Left Side Panel - Narrow */}
      <div className="w-16 bg-white border-r border-gray-200 flex flex-col items-center py-4 flex-shrink-0">
        {/* Menu Button */}
        <button className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-lg mb-6">
          <Menu className="w-5 h-5" />
        </button>

        {/* Create/Upload Button */}
        <label className="cursor-pointer mb-8">
          <input
            type="file"
            className="sr-only"
            accept=".pdf,.csv,.xlsx,.xls,.txt,.docx"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleDocumentUpload(e.target.files[0]);
              }
            }}
          />
          <div className="w-10 h-10 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center justify-center transition-colors duration-200 group">
            <Plus className="w-5 h-5 text-white" />
          </div>
          <div className="text-xs text-center text-gray-600 mt-1">Create</div>
        </label>

        {/* Navigation Buttons */}
        <div className="flex flex-col space-y-4 flex-1">
          {sidebarButtons.map((button) => {
            const Icon = button.icon;
            const isActive = activePanel === button.id;
            return (
              <button
                key={button.id}
                onClick={() => {
                  setActivePanel(button.id as any);
                  if (button.id === 'settings') {
                    setShowSettings(true);
                  }
                }}
                className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors duration-200 ${
                  isActive 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                title={button.label}
              >
                <Icon className="w-5 h-5" />
              </button>
            );
          })}
        </div>

        {/* Help Button */}
        <button className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-lg mt-4">
          <HelpCircle className="w-5 h-5" />
        </button>
      </div>

      {/* Middle Chat Panel */}
      <div className={`${activePanel === 'insightsBot' || activePanel === 'dashboardBot' ? 'flex-1' : 'w-96'} bg-white ${activePanel !== 'insightsBot' && activePanel !== 'dashboardBot' ? 'border-r border-gray-200' : ''} flex flex-col flex-shrink-0 h-screen overflow-hidden`}>
        {/* Chat Header */}
        <div className="p-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              {activePanel === 'insightsBot' ? (
                <Brain className="w-5 h-5 text-white" />
              ) : activePanel === 'dashboardBot' ? (
                <LayoutDashboard className="w-5 h-5 text-white" />
              ) : (
                <MessageCircle className="w-5 h-5 text-white" />
              )}
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                {activePanel === 'insightsBot' ? 'Business Insights' : 
                 activePanel === 'dashboardBot' ? 'Custom Dashboards' : 'AI Assistant'}
              </h1>
              <p className="text-xs text-gray-500">
                {activePanel === 'insightsBot' 
                  ? 'Strategic advice and market intelligence'
                  : activePanel === 'dashboardBot'
                  ? 'Create and manage your custom dashboards'
                  : selectedDocument ? selectedDocument.name : 'Select a document to start'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Document List - Only show when documents panel is active */}
        {activePanel === 'documents' && (
          <div className="p-4 border-b border-gray-100 flex-shrink-0">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Recent Documents</h3>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDocument(doc)}
                  className={`p-3 rounded-lg cursor-pointer transition-all duration-200 border ${
                    selectedDocument?.id === doc.id
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{doc.name}</p>
                      <p className="text-xs text-gray-500">{doc.uploadDate.toLocaleDateString()}</p>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${
                      doc.status === 'completed' ? 'bg-green-500' :
                      doc.status === 'analyzing' ? 'bg-yellow-500' :
                      doc.status === 'error' ? 'bg-red-500' : 'bg-gray-300'
                    }`} />
                  </div>
                </div>
              ))}
              
              {documents.length === 0 && (
                <div className="text-center py-8">
                  <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No documents yet</p>
                  <p className="text-xs text-gray-400">Click + to upload</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Chat Interface */}
        <div className="flex-1 flex flex-col min-h-0">
          {activePanel === 'insightsBot' ? (
            <InsightsChatbot 
              azureConfig={azureConfig}
              selectedDocument={selectedDocument}
              documents={documents}
              onSelectDocument={setSelectedDocument}
              onDocumentUpload={handleDocumentUpload}
              onDocumentUpdate={handleDocumentUpdate}
            />
          ) : activePanel === 'dashboardBot' ? (
            <DashboardBot 
              dashboards={dashboards}
              onCreateNewDashboard={handleCreateNewDashboard}
              onAddChartToDashboard={handleAddChartToDashboard}
              onUpdateDashboardCharts={handleUpdateDashboardCharts}
              onDeleteDashboard={handleDeleteDashboard}
              onAddChartRequest={handleAddChartRequest}
              chartToAdd={chartToAdd}
              onClearChartToAdd={() => setChartToAdd(null)}
            />
          ) : (
            <ChartingChatbot 
              azureConfig={azureConfig}
              selectedDocument={selectedDocument}
              documents={documents}
              onSelectDocument={setSelectedDocument}
              onDocumentUpload={handleDocumentUpload}
              onDocumentUpdate={handleDocumentUpdate}
              onNewAnalysis={handleNewAnalysis}
            />
          )}
        </div>
      </div>

      {/* Right Visualization Panel */}
      {activePanel !== 'insightsBot' && activePanel !== 'dashboardBot' && (
        <div className="flex-1 bg-white flex flex-col h-full overflow-hidden">
        {/* Visualization Header */}
        <div className="p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Data Visualizations</h2>
                <p className="text-sm text-gray-500">
                  {dashboardHistory.length > 0 ? `${dashboardHistory.length} analysis available` : 'Select a document to view insights'}
                </p>
              </div>
            </div>
            
            {dashboardHistory.length > 0 && selectedDashboardIndex !== null && (
              <div className="flex items-center space-x-2">
                <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                  {dashboardHistory[selectedDashboardIndex].analysis.charts.length} Charts
                </div>
              </div>
            )}
          </div>
          
          {/* Question History Dropdown */}
          {dashboardHistory.length > 0 && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Analysis History
              </label>
              <select
                value={selectedDashboardIndex ?? ''}
                onChange={(e) => setSelectedDashboardIndex(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="">Select an analysis...</option>
                {dashboardHistory.map((item, index) => (
                  <option key={index} value={index}>
                    {item.question} ({item.timestamp.toLocaleTimeString()})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Charts Content */}
        <div className="flex-1 overflow-y-auto p-6 min-h-0">
          {dashboardHistory.length > 0 && selectedDashboardIndex !== null ? (
            <DashboardCharts 
              analysis={dashboardHistory[selectedDashboardIndex].analysis}
              isLoading={false}
              onAddChartRequest={handleAddChartRequest}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Analysis Available</h3>
                <p className="text-gray-600 mb-6">Upload a document and ask questions to see AI-powered visualizations here.</p>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    className="sr-only"
                    accept=".pdf,.csv,.xlsx,.xls,.txt,.docx"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleDocumentUpload(e.target.files[0]);
                      }
                    }}
                  />
                  <div className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 inline-flex items-center space-x-2">
                    <Plus className="w-4 h-4" />
                    <span>Upload Document</span>
                  </div>
                </label>
              </div>
            </div>
          )}
        </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Settings</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <Settings 
                azureConfig={azureConfig}
                onConfigChange={setAzureConfig}
              />
            </div>
          </div>
        </div>
      )}

      {/* Add Chart to Dashboard Modal */}
      {showAddChartModal && chartToAdd && (
        <AddChartToDashboardModal
          chartToAdd={chartToAdd}
          dashboards={dashboards}
          onClose={() => { setShowAddChartModal(false); setChartToAdd(null); }}
          onAddChartToDashboard={handleAddChartToDashboard}
          onCreateNewDashboard={handleCreateNewDashboard}
        />
      )}
    </div>
  );
}

export default App;