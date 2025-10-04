import React, { useState } from 'react';
import { Document } from '../App';
import { 
  FileText, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  Download, 
  Eye, 
  Code, 
  BarChart3,
  PieChart,
  LineChart,
  Calculator,
  Brain,
  Zap,
  FileSpreadsheet,
  Image as ImageIcon,
  ChevronDown,
  ChevronRight,
  Activity,
  Target,
  Lightbulb
} from 'lucide-react';

interface AnalysisResultsProps {
  documents: Document[];
  selectedDocument: Document | null;
  onSelectDocument: (doc: Document) => void;
}

export const AnalysisResults: React.FC<AnalysisResultsProps> = ({
  documents,
  selectedDocument,
  onSelectDocument
}) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    summary: true,
    insights: true,
    codeInterpreter: true,
    metadata: false
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const completedDocuments = documents.filter(doc => doc.status === 'completed');

  if (completedDocuments.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Analysis Results Yet</h3>
        <p className="text-gray-600 mb-6">Upload a document to see AI-powered analysis results here.</p>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200">
          Upload Your First Document
        </button>
      </div>
    );
  }

  const renderCodeInterpreterSection = (analysis: any) => {
    const hasCodeInterpreter = analysis.charts && analysis.charts.length > 0;
    const codeExecutions = analysis.metadata?.codeExecutions || 0;
    const dataProcessed = analysis.metadata?.dataProcessed || false;

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => toggleSection('codeInterpreter')}
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <Code className="w-4 h-4 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Code Interpreter Analysis</h3>
            <div className="flex items-center space-x-2">
              {hasCodeInterpreter && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <Zap className="w-3 h-3 mr-1" />
                  Active
                </span>
              )}
              {dataProcessed && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  <Calculator className="w-3 h-3 mr-1" />
                  Data Processed
                </span>
              )}
            </div>
          </div>
          {expandedSections.codeInterpreter ? 
            <ChevronDown className="w-5 h-5 text-gray-400" /> : 
            <ChevronRight className="w-5 h-5 text-gray-400" />
          }
        </div>

        {expandedSections.codeInterpreter && (
          <div className="mt-6 space-y-6">
            {/* Code Interpreter Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Brain className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-medium text-purple-900">AI Processing</span>
                </div>
                <div className="text-2xl font-bold text-purple-900">
                  {hasCodeInterpreter ? 'Enabled' : 'Not Used'}
                </div>
                <div className="text-xs text-purple-700">
                  {hasCodeInterpreter ? 'Code Interpreter was used for analysis' : 'Standard text analysis only'}
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Activity className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Executions</span>
                </div>
                <div className="text-2xl font-bold text-blue-900">{codeExecutions}</div>
                <div className="text-xs text-blue-700">Code blocks executed</div>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <FileSpreadsheet className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-green-900">Data Analysis</span>
                </div>
                <div className="text-2xl font-bold text-green-900">
                  {dataProcessed ? 'Yes' : 'No'}
                </div>
                <div className="text-xs text-green-700">
                  {dataProcessed ? 'Structured data was processed' : 'No data processing detected'}
                </div>
              </div>
            </div>

            {/* Generated Visualizations */}
            {hasCodeInterpreter && analysis.charts.length > 0 && (
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
                  <BarChart3 className="w-4 h-4 mr-2 text-blue-600" />
                  Generated Visualizations ({analysis.charts.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analysis.charts.map((chart: any, index: number) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center space-x-2 mb-2">
                        <ImageIcon className="w-4 h-4 text-gray-600" />
                        <span className="text-sm font-medium text-gray-900">
                          Visualization {index + 1}
                        </span>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          <Code className="w-3 h-3 mr-1" />
                          Generated
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">{chart.description}</p>
                      
                      {/* Display the actual chart image */}
                      {chart.url && chart.loaded ? (
                        <div className="mt-3">
                          <img 
                            src={chart.url} 
                            alt={`Visualization ${index + 1}`}
                            className="w-full h-auto rounded-lg border border-gray-300 shadow-sm"
                            onError={(e) => {
                              console.error('Failed to load chart image:', e);
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                          <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center space-x-2 text-green-700">
                              <CheckCircle className="w-3 h-3" />
                              <span className="text-xs font-medium">Chart loaded successfully</span>
                            </div>
                          </div>
                        </div>
                      ) : chart.error ? (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-center space-x-2 text-red-700">
                            <AlertCircle className="w-4 h-4" />
                            <span className="text-sm font-medium">Failed to Load Chart</span>
                          </div>
                          <p className="text-xs text-red-600 mt-1">{chart.error}</p>
                        </div>
                      ) : chart.file_id ? (
                        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center space-x-2 text-blue-700">
                            <Activity className="w-4 h-4 animate-spin" />
                            <span className="text-sm font-medium">Loading Chart...</span>
                          </div>
                          <p className="text-xs text-blue-600 mt-1">
                            File ID: {chart.file_id}
                          </p>
                        </div>
                      ) : (
                        <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                          <div className="flex items-center space-x-2 text-gray-600">
                            <AlertCircle className="w-4 h-4" />
                            <span className="text-sm font-medium">No Chart Data Available</span>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <span>Type: {chart.type}</span>
                        {chart.file_id && (
                          <>
                            <span>•</span>
                            <span>ID: {chart.file_id.substring(0, 12)}...</span>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2 text-green-700 mb-2">
                    <Zap className="w-4 h-4" />
                    <span className="text-sm font-medium">Code Interpreter Success!</span>
                  </div>
                  <p className="text-xs text-green-600">
                    The AI successfully used Python code to analyze your data and generate {analysis.charts.length} visualization{analysis.charts.length !== 1 ? 's' : ''}. 
                    This demonstrates advanced data processing capabilities beyond simple text analysis.
                  </p>
                </div>
              </div>
            )}

            {/* Code Interpreter Capabilities Used */}
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
                <Target className="w-4 h-4 mr-2 text-green-600" />
                Analysis Capabilities Detected
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { name: 'Data Processing', active: dataProcessed, icon: Calculator },
                  { name: 'Visualizations', active: hasCodeInterpreter, icon: PieChart },
                  { name: 'Statistical Analysis', active: analysis.metadata?.hasStatistics, icon: TrendingUp },
                  { name: 'Pattern Recognition', active: analysis.insights?.length > 3, icon: Brain }
                ].map((capability, index) => (
                  <div 
                    key={index}
                    className={`flex items-center space-x-2 p-3 rounded-lg border ${
                      capability.active 
                        ? 'bg-green-50 border-green-200 text-green-800' 
                        : 'bg-gray-50 border-gray-200 text-gray-500'
                    }`}
                  >
                    <capability.icon className="w-4 h-4" />
                    <span className="text-xs font-medium">{capability.name}</span>
                    {capability.active && <CheckCircle className="w-3 h-3 text-green-600" />}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Document List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Analyzed Documents</h3>
        <div className="space-y-3">
          {completedDocuments.map((doc) => (
            <div
              key={doc.id}
              onClick={() => onSelectDocument(doc)}
              className={`p-3 rounded-lg cursor-pointer transition-all duration-200 border ${
                selectedDocument?.id === doc.id
                  ? 'border-blue-300 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{doc.name}</p>
                  <p className="text-xs text-gray-500">{doc.uploadDate.toLocaleDateString()}</p>
                  {doc.analysis && (
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      <span>{doc.analysis.metadata.pages} pages</span>
                      <span>{doc.analysis.insights.length} insights</span>
                      {doc.analysis.charts?.length > 0 && (
                        <span className="text-purple-600 font-medium">
                          <Code className="w-3 h-3 inline mr-1" />
                          Code Interpreter
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Analysis Details */}
      <div className="lg:col-span-2 space-y-6">
        {selectedDocument?.analysis ? (
          <>
            {/* Summary Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => toggleSection('summary')}
              >
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-blue-600" />
                  Analysis Summary
                </h3>
                <div className="flex items-center space-x-2">
                  {expandedSections.summary ? 
                    <ChevronDown className="w-5 h-5 text-gray-400" /> : 
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  }
                  <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {expandedSections.summary && (
                <div className="mt-4">
                  <p className="text-gray-700 leading-relaxed">{selectedDocument.analysis.summary}</p>
                </div>
              )}
            </div>

            {/* Code Interpreter Section */}
            {renderCodeInterpreterSection(selectedDocument.analysis)}

            {/* Key Insights */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => toggleSection('insights')}
              >
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Key Insights</h3>
                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full font-medium">
                    {selectedDocument.analysis.insights.length} found
                  </span>
                </div>
                {expandedSections.insights ? 
                  <ChevronDown className="w-5 h-5 text-gray-400" /> : 
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                }
              </div>
              {expandedSections.insights && (
                <div className="mt-4 space-y-3">
                  {selectedDocument.analysis.insights.map((insight, index) => (
                    <div key={index} className="flex items-start space-x-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                      <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-700">{insight}</p>
                        <div className="flex items-center space-x-2 mt-2">
                          <Lightbulb className="w-3 h-3 text-yellow-500" />
                          <span className="text-xs text-gray-500">AI-generated insight</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Document Metadata */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => toggleSection('metadata')}
              >
                <h3 className="text-lg font-semibold text-gray-900">Document Details</h3>
                {expandedSections.metadata ? 
                  <ChevronDown className="w-5 h-5 text-gray-400" /> : 
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                }
              </div>
              {expandedSections.metadata && (
                <div className="mt-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(selectedDocument.analysis.metadata).map(([key, value]) => (
                      <div key={key} className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-gray-900">{value}</div>
                        <div className="text-xs text-gray-500 uppercase tracking-wide">{key}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a Document</h3>
            <p className="text-gray-600">Choose a document from the list to view its analysis results.</p>
          </div>
        )}
      </div>
    </div>
  );
};