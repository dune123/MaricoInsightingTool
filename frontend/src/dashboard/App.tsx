import { useState } from 'react';
import { InsightsChatbot } from './components/InsightsChatbot';
import { ChartingChatbot } from './components/ChartingChatbot';
import { Settings } from './components/Settings';
import { DashboardCharts } from './components/DashboardCharts';
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
  LayoutDashboard,
  Loader2,
  XCircle
} from 'lucide-react';
import { DashboardBot } from './components/DashboardBot';
import { AddChartToDashboardModal } from './components/AddChartToDashboardModal';
import { AutoAnalyzingUpload } from './components/AutoAnalyzingUpload';
import { AutoAnalysisService } from './lib/auto-analysis-service';
import { AnalysisDebugger } from './components/AnalysisDebugger';
import { DataPointDebugger } from './components/DataPointDebugger';
import { RateLimitStatus } from './components/RateLimitStatus';
import { NuclearProtectionStatus } from './components/NuclearProtectionStatus';


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
  autoAnalyzed?: boolean; // Track if auto-analyzed on upload
  analysisType?: 'quick' | 'comprehensive' | 'custom'; // Type of analysis performed
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
  const [rateLimitStatus, setRateLimitStatus] = useState<{ visible: boolean; waitTime: number }>({ visible: false, waitTime: 0 });
  const [nuclearProtectionStatus, setNuclearProtectionStatus] = useState<{ visible: boolean }>({ visible: true });
  const [firstUserMessage, setFirstUserMessage] = useState<string>('');
  const [azureConfig, setAzureConfig] = useState({
    apiKey: import.meta.env.VITE_AZURE_API_KEY || 'REPLACE_WITH_YOUR_API_KEY',
    endpoint: import.meta.env.VITE_AZURE_ENDPOINT || 'https://your-resource.cognitiveservices.azure.com/',
    deploymentName: import.meta.env.VITE_AZURE_DEPLOYMENT_NAME || 'gpt-4o-mini'
  });

  // NOTE: We intentionally avoid restoring any state on reload for demo. A fresh reload starts clean.

  const handleDocumentUpload = async (file: File) => {
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
      status: 'analyzing', // Start as analyzing
      file: file
    };
    
    // Keep only one CSV/Excel document at a time: replace any existing
    setDocuments([newDoc]);
    setSelectedDocument(newDoc);

    // NEW: Automatically analyze the document
    try {
      const autoAnalysisService = new AutoAnalysisService(azureConfig);
      
      // Analyze document immediately upon upload
      const analysisResult = await autoAnalysisService.analyzeFileOnUpload(file);
      
      // Check if analysis was successful
      if (analysisResult.metadata?.error) {
        console.warn('Analysis completed with errors:', analysisResult.metadata.errorMessage);
        // Still show the result but mark it as having issues
      }
      
      // Update document with analysis results
      const completedDoc = {
        ...newDoc,
        status: 'completed' as const,
        assistantId: analysisResult.assistantId || '',
        threadId: analysisResult.threadId || '',
        analysis: analysisResult,
        autoAnalyzed: true,
        analysisType: 'quick' as const
      };
      
      setDocuments([completedDoc]);
      setSelectedDocument(completedDoc);
      
      // Add initial analysis to dashboard history only if we have valid results
      if (analysisResult.charts && analysisResult.charts.length > 0) {
        handleNewAnalysis(
          "Automatic data analysis", 
          analysisResult
        );
      }
      
    } catch (error) {
      console.error('Auto-analysis failed:', error);
      const errorDoc = {
        ...newDoc,
        status: 'error' as const
      };
      setDocuments([errorDoc]);
      setSelectedDocument(errorDoc);
    }
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
        <div className="mb-8">
          <AutoAnalyzingUpload
            onFileUpload={handleDocumentUpload}
            disabled={uploadDisabled}
          />
          <div className="text-xs text-center text-gray-600 mt-1">Analyze</div>
        </div>

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
            
            {dashboardHistory.length > 0 && selectedDashboardIndex !== null && (
              <div className="flex items-center space-x-2">
                <div className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                  {dashboardHistory[selectedDashboardIndex]?.analysis?.charts?.length || 0} Charts
                </div>
              </div>
            )}
          </div>
          
          {/* Question History Dropdown */}
          {dashboardHistory.length > 0 && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Change File
              </label>
              <select
                value={selectedDashboardIndex ?? ''}
                onChange={(e) => setSelectedDashboardIndex(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
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
          {dashboardHistory.length > 0 && selectedDashboardIndex !== null ? (
            <DashboardCharts 
              analysis={dashboardHistory[selectedDashboardIndex].analysis}
              isLoading={false}
              onAddChartRequest={handleAddChartRequest}
            />
          ) : selectedDocument?.autoAnalyzed && selectedDocument?.analysis ? (
            <div className="space-y-6">
              {/* Auto-Analysis Header */}
              <div className={`border rounded-lg p-4 ${
                selectedDocument.analysis.metadata?.error 
                  ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200' 
                  : 'bg-gradient-to-r from-green-50 to-blue-50 border-green-200'
              }`}>
                <div className="flex items-center space-x-3 mb-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    selectedDocument.analysis.metadata?.error 
                      ? 'bg-yellow-100' 
                      : 'bg-green-100'
                  }`}>
                    <BarChart3 className={`w-4 h-4 ${
                      selectedDocument.analysis.metadata?.error 
                        ? 'text-yellow-600' 
                        : 'text-green-600'
                    }`} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {selectedDocument.analysis.metadata?.error ? 'Analysis Issues' : 'Auto-Generated Analysis'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {selectedDocument.analysis.metadata?.error 
                        ? 'Analysis encountered issues but your file is ready for questions'
                        : 'Your file has been automatically analyzed with AI insights'
                      }
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span className="flex items-center space-x-1">
                    <div className={`w-2 h-2 rounded-full ${
                      selectedDocument.analysis.metadata?.error 
                        ? 'bg-yellow-500' 
                        : 'bg-green-500'
                    }`}></div>
                    <span>{selectedDocument.analysis.metadata?.error ? 'Analysis Issues' : 'Analysis Complete'}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>{selectedDocument.analysis?.charts?.length || 0} Charts Generated</span>
                  </span>
                </div>
                {selectedDocument.analysis.metadata?.error && (
                  <div className="mt-3 p-3 bg-yellow-100 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <strong>Note:</strong> {String(selectedDocument.analysis.metadata.errorMessage || 'Analysis encountered issues. You can still ask specific questions about your data.')}
                    </p>
                  </div>
                )}
              </div>

              {/* Auto-Analysis Results - only show if we have charts */}
              {selectedDocument.analysis?.charts && selectedDocument.analysis.charts.length > 0 ? (
                <DashboardCharts 
                  analysis={selectedDocument.analysis}
                  isLoading={false}
                  onAddChartRequest={handleAddChartRequest}
                />
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BarChart3 className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready for Analysis</h3>
                  <p className="text-gray-600 mb-6">
                    Your file is uploaded and ready. Ask specific questions to generate visualizations and insights.
                  </p>
                </div>
              )}
            </div>
          ) : selectedDocument?.status === 'analyzing' ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-xl">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Loader2 className="w-8 h-8 text-yellow-600 animate-spin" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Analyzing Your Data</h3>
                <p className="text-gray-600 mb-6">
                  AI is analyzing your file and generating insights. This may take a few moments...
                </p>
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                  <span>Processing data structure and patterns</span>
                </div>
              </div>
            </div>
          ) : selectedDocument?.status === 'error' ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-xl">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <XCircle className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Analysis Failed</h3>
                <p className="text-gray-600 mb-6">
                  There was an error analyzing your file. Please try uploading again.
                </p>
                <button
                  onClick={() => {
                    setDocuments([]);
                    setSelectedDocument(null);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : selectedDocument ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-xl">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">File uploaded</h3>
                <p className="text-gray-600 mb-6">
                  Your CSV/Excel has been uploaded{selectedDocument?.name ? (<>
                  : <span className="font-medium"> {selectedDocument.name}</span></>) : null}. You can now ask a question to generate visualizations.
                </p>
                {/* Intentionally no CTA button here per requirement */}
              </div>
            </div>
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

      {/* Debug Components - Only show in development */}
      {import.meta.env.DEV && (
        <>
          <AnalysisDebugger 
            analysis={selectedDocument?.analysis}
            showDebug={true}
          />
          <DataPointDebugger 
            analysis={selectedDocument?.analysis}
            showDebug={true}
          />
        </>
      )}

      {/* Rate Limit Status */}
      <RateLimitStatus
        isVisible={rateLimitStatus.visible}
        waitTime={rateLimitStatus.waitTime}
        onClose={() => setRateLimitStatus({ visible: false, waitTime: 0 })}
      />

      {/* Nuclear Protection Status */}
      <NuclearProtectionStatus
        isVisible={nuclearProtectionStatus.visible}
        onClose={() => setNuclearProtectionStatus({ visible: false })}
      />
    </div>
  );
}

export default App;