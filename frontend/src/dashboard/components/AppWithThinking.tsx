import React, { useState } from 'react';
import { ChartingChatbotWithThinking } from './ChartingChatbotWithThinking'; // Use the thinking version
import { Settings } from './Settings';
import { DashboardCharts } from './DashboardCharts';
import { AnalysisResult, DashboardHistoryItem, Dashboard, ChartData } from '../types/chart';
import { 
  FileText, 
  Settings as SettingsIcon, 
  MessageCircle, 
  Plus,
  BarChart3,
  Folder,
  History,
  HelpCircle,
  LayoutDashboard
} from 'lucide-react';
import { DashboardBot } from './DashboardBot';
import { AddChartToDashboardModal } from './AddChartToDashboardModal';
import DebugThinkingTest from './DebugThinkingTest';

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

function AppWithThinking() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [activePanel, setActivePanel] = useState<'insightsBot' | 'documents' | 'history' | 'settings' | 'dashboardBot' | 'thinkingTest'>('documents');
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
    const newDocument: Document = {
      id: crypto.randomUUID(),
      name: file.name,
      type: file.type,
      size: file.size,
      uploadDate: new Date(),
      status: 'uploading',
      file: file
    };

    setDocuments(prev => [...prev, newDocument]);
    setSelectedDocument(newDocument);

    // Simulate upload completion
    setTimeout(() => {
      setDocuments(prev => 
        prev.map(doc => 
          doc.id === newDocument.id 
            ? { ...doc, status: 'ready' as const }
            : doc
        )
      );
      setSelectedDocument(prev => 
        prev?.id === newDocument.id 
          ? { ...prev, status: 'ready' as const }
          : prev
      );
    }, 1000);
  };

  const handleDocumentUpdate = (updatedDoc: Document) => {
    setDocuments(prev => 
      prev.map(doc => doc.id === updatedDoc.id ? updatedDoc : doc)
    );
    setSelectedDocument(updatedDoc);
  };

  const handleNewAnalysis = (question: string, analysis: AnalysisResult) => {
    const newHistoryItem: DashboardHistoryItem = {
      id: crypto.randomUUID(),
      question,
      analysis,
      timestamp: new Date(),
      charts: analysis.charts
    };
    setDashboardHistory(prev => [newHistoryItem, ...prev]);
  };

  const handleAddChartToDashboard = (chart: ChartData) => {
    setChartToAdd(chart);
    setShowAddChartModal(true);
  };

  const handleCreateDashboard = (name: string, description: string, charts: ChartData[]) => {
    const newDashboard: Dashboard = {
      id: crypto.randomUUID(),
      name,
      description,
      charts,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setDashboards(prev => [...prev, newDashboard]);
  };

  const handleUpdateDashboard = (dashboardId: string, updates: Partial<Dashboard>) => {
    setDashboards(prev => 
      prev.map(dashboard => 
        dashboard.id === dashboardId 
          ? { ...dashboard, ...updates, updatedAt: new Date() }
          : dashboard
      )
    );
  };

  const handleDeleteDashboard = (dashboardId: string) => {
    setDashboards(prev => prev.filter(dashboard => dashboard.id !== dashboardId));
  };

  return (
    <div className="h-screen bg-gray-50 flex">
      {/* COMPACT LEFT SIDEBAR */}
      <div className="w-56 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-3 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-semibold text-gray-900">BrandBloom</span>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          <button
            onClick={() => setActivePanel('documents')}
            className={`w-full flex items-center space-x-2 px-2 py-1.5 rounded-md text-left transition-colors text-sm ${
              activePanel === 'documents' 
                ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Folder className="w-4 h-4" />
            <span>Documents</span>
          </button>

          <button
            onClick={() => setActivePanel('insightsBot')}
            className={`w-full flex items-center space-x-2 px-2 py-1.5 rounded-md text-left transition-colors text-sm ${
              activePanel === 'insightsBot' 
                ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            <span>AI Insights</span>
          </button>

          <button
            onClick={() => setActivePanel('dashboardBot')}
            className={`w-full flex items-center space-x-2 px-2 py-1.5 rounded-md text-left transition-colors text-sm ${
              activePanel === 'dashboardBot' 
                ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setActivePanel('history')}
            className={`w-full flex items-center space-x-2 px-2 py-1.5 rounded-md text-left transition-colors text-sm ${
              activePanel === 'history' 
                ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <History className="w-4 h-4" />
            <span>History</span>
          </button>

          <button
            onClick={() => setActivePanel('thinkingTest')}
            className={`w-full flex items-center space-x-2 px-2 py-1.5 rounded-md text-left transition-colors text-sm ${
              activePanel === 'thinkingTest' 
                ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Thinking Test</span>
          </button>

          <button
            onClick={() => setActivePanel('settings')}
            className={`w-full flex items-center space-x-2 px-2 py-1.5 rounded-md text-left transition-colors text-sm ${
              activePanel === 'settings' 
                ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <SettingsIcon className="w-4 h-4" />
            <span>Settings</span>
          </button>
        </nav>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col">
        {/* COMPACT HEADER */}
        <div className="bg-white border-b border-gray-200 px-4 py-2">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-sm font-semibold text-gray-900">
                {activePanel === 'insightsBot' 
                  ? 'Strategic Insights & Analysis'
                  : activePanel === 'dashboardBot'
                  ? 'Interactive Dashboard Builder'
                  : activePanel === 'history'
                  ? 'Analysis History'
                  : activePanel === 'thinkingTest'
                  ? 'ChatGPT-like Thinking Test'
                  : activePanel === 'settings'
                  ? 'Settings & Configuration'
                  : 'Document Management'
                }
              </h1>
              <p className="text-xs text-gray-500">
                {activePanel === 'insightsBot' 
                  ? 'Strategic advice and market intelligence'
                  : activePanel === 'dashboardBot'
                  ? 'Create and manage your custom dashboards'
                  : activePanel === 'history'
                  ? 'View and manage your analysis history'
                  : activePanel === 'thinkingTest'
                  ? 'Test the ChatGPT-like thinking process'
                  : activePanel === 'settings'
                  ? 'Configure your AI assistant and preferences'
                  : selectedDocument ? selectedDocument.name : 'Upload a file to start'
                }
              </p>
            </div>
          </div>
        </div>

        {/* OPTIMIZED CONTENT AREA */}
        <div className="flex-1 flex">
          {/* COMPACT LEFT PANEL - Documents/History */}
          <div className="w-72 border-r border-gray-200 bg-white">
            {activePanel === 'documents' && (
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-medium text-gray-900">Documents</h2>
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
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center hover:bg-blue-700 transition-colors">
                      <Plus className="w-4 h-4" />
                    </div>
                  </label>
                </div>

                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      onClick={() => setSelectedDocument(doc)}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedDocument?.id === doc.id
                          ? 'bg-blue-50 border-blue-200'
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <FileText className="w-4 h-4 text-gray-500" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {doc.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {doc.status === 'uploading' && 'Uploading...'}
                            {doc.status === 'ready' && 'Ready for analysis'}
                            {doc.status === 'analyzing' && 'Analyzing...'}
                            {doc.status === 'completed' && 'Analysis complete'}
                            {doc.status === 'error' && 'Error occurred'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activePanel === 'history' && (
              <div className="p-4">
                <h2 className="text-sm font-medium text-gray-900 mb-4">Analysis History</h2>
                <div className="space-y-2">
                  {dashboardHistory.map((item, index) => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedDashboardIndex(index)}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedDashboardIndex === index
                          ? 'bg-blue-50 border-blue-200'
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {item.question}
                      </p>
                      <p className="text-xs text-gray-500">
                        {item.timestamp.toLocaleDateString()} • {item.charts.length} charts
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* MIDDLE PANEL - Chat Interface */}
          <div className="flex-1 flex flex-col">
            {activePanel === 'insightsBot' && (
              <ChartingChatbotWithThinking
                azureConfig={azureConfig}
                selectedDocument={selectedDocument}
                documents={documents}
                onSelectDocument={setSelectedDocument}
                onDocumentUpload={handleDocumentUpload}
                onDocumentUpdate={handleDocumentUpdate}
                onNewAnalysis={handleNewAnalysis}
              />
            )}

            {activePanel === 'dashboardBot' && (
              <DashboardBot
                azureConfig={azureConfig}
                selectedDocument={selectedDocument}
                documents={documents}
                onSelectDocument={setSelectedDocument}
                onDocumentUpload={handleDocumentUpload}
                onDocumentUpdate={handleDocumentUpdate}
                onNewAnalysis={handleNewAnalysis}
                dashboards={dashboards}
                onCreateDashboard={handleCreateDashboard}
                onUpdateDashboard={handleUpdateDashboard}
                onDeleteDashboard={handleDeleteDashboard}
                onAddChartToDashboard={handleAddChartToDashboard}
              />
            )}

            {activePanel === 'thinkingTest' && (
              <DebugThinkingTest />
            )}
          </div>

          {/* COMPACT RIGHT PANEL - Dashboard/Charts */}
          <div className="w-80 border-l border-gray-200 bg-white">
            {activePanel === 'dashboardBot' && (
              <div className="h-full flex flex-col">
                <div className="p-3 border-b border-gray-200">
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="w-4 h-4 text-blue-600" />
                    <div>
                      <h2 className="text-sm font-medium text-gray-900">Data Visualizations</h2>
                      <p className="text-xs text-gray-500">
                        {dashboardHistory.length > 0 ? `${dashboardHistory.length} analysis available` : 'Upload another file'}
                      </p>
                    </div>
                  </div>
                </div>
                
                {dashboardHistory.length > 0 && selectedDashboardIndex !== null && (
                  <DashboardCharts
                    analysis={dashboardHistory[selectedDashboardIndex].analysis}
                    onAddChartToDashboard={handleAddChartToDashboard}
                  />
                )}

                {dashboardHistory.length === 0 && (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <BarChart3 className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Analysis Available</h3>
                      <p className="text-gray-600 mb-6">Upload a file and ask questions to see AI-powered visualizations here.</p>
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
                          <span>Upload File</span>
                        </div>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODALS */}
      {showAddChartModal && chartToAdd && (
        <AddChartToDashboardModal
          chart={chartToAdd}
          dashboards={dashboards}
          onClose={() => {
            setShowAddChartModal(false);
            setChartToAdd(null);
          }}
          onAddToDashboard={(dashboardId) => {
            // Handle adding chart to dashboard
            console.log('Adding chart to dashboard:', dashboardId);
            setShowAddChartModal(false);
            setChartToAdd(null);
          }}
        />
      )}

      {activePanel === 'settings' && (
        <Settings
          azureConfig={azureConfig}
          onConfigUpdate={setAzureConfig}
          onClose={() => setActivePanel('documents')}
        />
      )}
    </div>
  );
}

export default AppWithThinking;
