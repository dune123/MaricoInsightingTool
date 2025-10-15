import { useState } from 'react';
import { InsightsChatbot } from './components/InsightsChatbot';
import { ChartingChatbot } from './components/ChartingChatbot';
import { Settings } from './components/Settings';
import { DashboardCharts } from './components/DashboardCharts';
import DataPreview from './components/DataPreview';
import { AnalysisResult, DashboardHistoryItem, Dashboard, ChartData } from './types/chart';
import { 
  FileText, 
  Settings as SettingsIcon, 
  MessageCircle, 
  Plus,
  Menu,
  X,
  BarChart3,
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
  const [activePanel, setActivePanel] = useState<'insightsBot' | 'documents' | 'history' | 'settings' | 'dashboardBot'>('documents');
  const [dashboardHistory, setDashboardHistory] = useState<DashboardHistoryItem[]>([]);
  const [selectedDashboardIndex, setSelectedDashboardIndex] = useState<number | null>(null);
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [showAddChartModal, setShowAddChartModal] = useState(false);
  const [chartToAdd, setChartToAdd] = useState<ChartData | null>(null);
  const [firstUserMessage, setFirstUserMessage] = useState<string>('');
  const [azureConfig, setAzureConfig] = useState({
    apiKey: import.meta.env.VITE_AZURE_API_KEY || 'REPLACE_WITH_YOUR_API_KEY',
    endpoint: import.meta.env.VITE_AZURE_ENDPOINT || 'https://your-resource.cognitiveservices.azure.com/',
    deploymentName: import.meta.env.VITE_AZURE_DEPLOYMENT_NAME || 'gpt-4o-mini'
  });

  // NOTE: We intentionally avoid restoring any state on reload for demo. A fresh reload starts clean.

  const handleDocumentUpload = (file: File) => {
    // Allow only CSV or Excel files
    const fileName = file.name.toLowerCase();
    const isCsv = fileName.endsWith('.csv');
    const isXlsx = fileName.endsWith('.xlsx');
    const isXls = fileName.endsWith('.xls');

    if (!isCsv && !isXlsx && !isXls) {
      alert('Please upload only CSV or Excel files (.csv, .xlsx, .xls).');
      return;
    }

    const newDoc: Document = {
      id: crypto.randomUUID(),
      name: file.name,
      type: file.type,
      size: file.size,
      uploadDate: new Date(),
      status: 'ready',
      file: file
    };
    
    // Keep only one CSV/Excel document at a time: replace any existing
    setDocuments([newDoc]);
    setSelectedDocument(newDoc);
    // Set to initial analysis by default when uploading a new document
    setSelectedDashboardIndex(-1);
    // Don't auto-switch panels - let user stay in current bot
  };

  const handleDocumentUpdate = (updatedDoc: Document) => {
    setDocuments(prev => prev.map(doc => 
      doc.id === updatedDoc.id ? updatedDoc : doc
    ));
    
    if (selectedDocument?.id === updatedDoc.id) {
      setSelectedDocument(updatedDoc);
      // Do not auto-add initial generic "Data Analysis" to dashboard history.
      // The right panel should only reflect analyses explicitly triggered by user questions
      // via onNewAnalysis(question, analysis).
    }
  };

  const handleFirstUserMessage = (message: string) => {
    if (!firstUserMessage) {
      console.log('Capturing first user message:', message);
      setFirstUserMessage(message);
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

  // Disable upload/create after a file is uploaded
  const uploadDisabled = !!selectedDocument;

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
    // Normalize KPI charts so they render consistently in dashboards
    const normalizeKpi = (c: ChartData): ChartData => {
      if (c.type !== 'kpi') return c;
      const cfg = { ...(c.config || {}) } as Record<string, unknown>;
      // If value not set, try to parse from description
      if (!cfg.value) {
        const m = (c.description || '').match(/\$?([\d,]+(?:\.\d+)?)/);
        if (m) cfg.value = m[1];
      }
      // Clean string values (remove stray trailing commas/spaces)
      if (typeof cfg.value === 'string') {
        cfg.value = cfg.value.replace(/[,\s]+$/g, '');
      }
      // Default unit detection
      if (!cfg.unit) cfg.unit = (c.description || '').includes('$') ? '$' : cfg.unit;
      // Ensure trend fields exist (optional)
      if (cfg.trend === undefined) cfg.trend = undefined;
      return { ...c, config: cfg } as ChartData;
    };
    const normalized = normalizeKpi(chart);
    
    // Add layout properties to the chart if not present
    const chartWithLayout = {
      ...normalized,
      id: normalized.id || crypto.randomUUID(),
      layout: normalized.layout || {
        x: 0,
        y: 0,
        // Preserve perceived chat size by giving full-width and taller height by default
        // Users can resize later in the dashboard grid
        w: normalized.type === 'kpi' ? 3 : 12,
        h: normalized.type === 'kpi' ? 2 : 8
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

  const handleDeleteChart = (dashboardId: string, chartId: string) => {
    console.log('App handleDeleteChart called:', { dashboardId, chartId });
    setDashboards(prev => prev.map(dashboard => 
      dashboard.id === dashboardId 
        ? { 
            ...dashboard, 
            charts: dashboard.charts.filter(chart => chart.id !== chartId),
            updatedAt: new Date()
          }
        : dashboard
    ));
  };

  const handleDeleteInsight = (dashboardId: string, chartId: string, insightType: 'keyfinding' | 'recommendation') => {
    console.log('App handleDeleteInsight called:', { dashboardId, chartId, insightType });
    setDashboards(prev => prev.map(dashboard => 
      dashboard.id === dashboardId 
        ? { 
            ...dashboard, 
            charts: dashboard.charts.map(chart => 
              chart.id === chartId 
                ? {
                    ...chart,
                    insights: chart.insights ? (() => {
                      const newInsights = { ...chart.insights } as typeof chart.insights;
                      // Map incoming types to actual insight keys stored on chart
                      const keyMap: Record<'keyfinding' | 'recommendation', keyof NonNullable<typeof chart.insights>> = {
                        keyfinding: 'keyFinding',
                        recommendation: 'recommendation'
                      };
                      const keyToDelete = keyMap[insightType];
                      delete (newInsights as Record<string, unknown>)[keyToDelete];
                      return Object.keys(newInsights).length > 0 ? newInsights : undefined;
                    })() : undefined
                  }
                : chart
            ),
            updatedAt: new Date()
          }
        : dashboard
    ));
  };

  const handleAddChartRequest = (chart: ChartData) => {
    setChartToAdd(chart);
    setShowAddChartModal(true);
  };

  const sidebarButtons = [
    //{ id: 'insightsBot', icon: Brain, label: 'Insights Bot' },
    { id: 'documents', icon: Folder, label: 'Documents' },
    { id: 'dashboardBot', icon: LayoutDashboard, label: 'Dashboards' },
    { id: 'history', icon: History, label: 'History' }
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
        <label className={`mb-8 ${uploadDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`} title={uploadDisabled ? 'A file is already uploaded' : 'Upload a file'}>
          <input
            type="file"
            className="sr-only"
            accept=".pdf,.csv,.xlsx,.xls,.txt,.docx"
            disabled={uploadDisabled}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleDocumentUpload(e.target.files[0]);
              }
            }}
          />
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors duration-200 group ${uploadDisabled ? 'bg-gray-300' : 'bg-blue-600 hover:bg-blue-700'}`}>
            <Plus className={`w-5 h-5 ${uploadDisabled ? 'text-gray-500' : 'text-white'}`} />
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
                  setActivePanel(button.id as 'insightsBot' | 'documents' | 'history' | 'settings' | 'dashboardBot');
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

        {/* Settings Shortcut Button (replaces help) */}
        <button
          onClick={() => setShowSettings(true)}
          className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-lg mt-4"
          title="Settings"
        >
          <SettingsIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Middle Chat Panel */}
      <div className={`${activePanel === 'insightsBot' || activePanel === 'dashboardBot' ? 'flex-1' : 'w-[480px]'} bg-white ${activePanel !== 'insightsBot' && activePanel !== 'dashboardBot' ? 'border-r border-gray-200' : ''} flex flex-col flex-shrink-0 h-screen overflow-hidden`}>
        {/* Chat Header */}
        <div className="p-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              {/*activePanel === 'insightsBot' ? (
                <Brain className="w-5 h-5 text-white" />
              ) :*/ activePanel === 'dashboardBot' ? (
                <LayoutDashboard className="w-5 h-5 text-white" />
              ) : (
                <MessageCircle className="w-5 h-5 text-white" />
              )}
            </div>
            <div>
              <h1 className="text-base font-medium text-gray-900">
                {activePanel === 'insightsBot' ? 'Business Insights' : 
                 activePanel === 'dashboardBot' ? 'Custom Dashboards' : 'AI Assistant'}
              </h1>
              <p className="text-xs text-gray-500">
                {activePanel === 'insightsBot' 
                  ? 'Strategic advice and market intelligence'
                  : activePanel === 'dashboardBot'
                  ? 'Create and manage your custom dashboards'
                  : selectedDocument ? selectedDocument.name : 'Upload a file to start'
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

        {/* Chat Interface - keep mounted to preserve state; toggle visibility */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className={activePanel === 'insightsBot' ? 'block h-full min-h-0' : 'hidden h-full min-h-0'}>
            <InsightsChatbot 
              azureConfig={azureConfig}
              selectedDocument={selectedDocument}
              documents={documents}
              onSelectDocument={setSelectedDocument}
              onDocumentUpload={handleDocumentUpload}
              onDocumentUpdate={handleDocumentUpdate}
              onFirstUserMessage={handleFirstUserMessage}
            />
          </div>
          <div className={activePanel === 'dashboardBot' ? 'block h-full min-h-0' : 'hidden h-full min-h-0'}>
            <DashboardBot 
              dashboards={dashboards}
              onCreateNewDashboard={handleCreateNewDashboard}
              onAddChartToDashboard={handleAddChartToDashboard}
              onUpdateDashboardCharts={handleUpdateDashboardCharts}
              onDeleteDashboard={handleDeleteDashboard}
              onDeleteChart={handleDeleteChart}
              onDeleteInsight={handleDeleteInsight}
              chartToAdd={chartToAdd}
              onClearChartToAdd={() => setChartToAdd(null)}
            />
          </div>
          <div className={activePanel === 'documents' ? 'block h-full min-h-0' : 'hidden h-full min-h-0'}>
            <ChartingChatbot 
              azureConfig={azureConfig}
              selectedDocument={selectedDocument}
              documents={documents}
              onSelectDocument={setSelectedDocument}
              onDocumentUpload={handleDocumentUpload}
              onDocumentUpdate={handleDocumentUpdate}
              onNewAnalysis={handleNewAnalysis}
              onFirstUserMessage={handleFirstUserMessage}
            />
          </div>
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
                <h2 className="text-lg font-medium text-gray-900">Data Visualizations</h2>
                <p className="text-xs text-gray-500">
                  {dashboardHistory.length > 0 ? `${dashboardHistory.length} analysis available` : 'Upload another file'}
                </p>
              </div>
            </div>
            
            {selectedDocument && (
              <div className="flex items-center space-x-2">
                {selectedDashboardIndex === -1 ? (
                  <div className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                    📊 Initial Analysis
                  </div>
                ) : dashboardHistory.length > 0 && selectedDashboardIndex !== null && selectedDashboardIndex >= 0 ? (
                  <div className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                    {dashboardHistory[selectedDashboardIndex].analysis.charts.length} Charts
                  </div>
                ) : (
                  <div className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                    📊 Initial Analysis
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Question History Dropdown */}
          {selectedDocument && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Change Analysis
              </label>
              <select
                value={selectedDashboardIndex === -1 ? 'initial' : selectedDashboardIndex ?? ''}
                onChange={(e) => {
                  if (e.target.value === 'initial') {
                    setSelectedDashboardIndex(-1);
                  } else {
                    setSelectedDashboardIndex(e.target.value ? parseInt(e.target.value) : null);
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="initial">📊 Initial Analysis</option>
                {dashboardHistory.map((item, index) => (
                  <option key={index} value={index}>
                    {item.question}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Charts Content */}
        <div className="flex-1 overflow-y-auto p-6 min-h-0">
          {selectedDashboardIndex === -1 && selectedDocument ? (
            <DataPreview 
              selectedDocument={selectedDocument}
              azureConfig={azureConfig}
            />
          ) : dashboardHistory.length > 0 && selectedDashboardIndex !== null && selectedDashboardIndex >= 0 ? (
            <DashboardCharts 
              analysis={dashboardHistory[selectedDashboardIndex].analysis}
              isLoading={false}
              onAddChartRequest={handleAddChartRequest}
            />
          ) : selectedDocument ? (
            <DataPreview 
              selectedDocument={selectedDocument}
              azureConfig={azureConfig}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
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
          onClose={() => { 
            setShowAddChartModal(false); 
            setChartToAdd(null); 
          }}
          onAddChartToDashboard={handleAddChartToDashboard}
          onCreateNewDashboard={handleCreateNewDashboard}
        />
      )}
    </div>
  );
}

export default App;