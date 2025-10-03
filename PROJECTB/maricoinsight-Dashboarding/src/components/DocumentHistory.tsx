import React from 'react';
import { Document } from '../App';
import { FileText, Calendar, Clock, CheckCircle, AlertCircle, Loader } from 'lucide-react';

interface DocumentHistoryProps {
  documents: Document[];
  onSelectDocument: (doc: Document) => void;
}

export const DocumentHistory: React.FC<DocumentHistoryProps> = ({
  documents,
  onSelectDocument
}) => {
  const getStatusIcon = (status: Document['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'analyzing':
        return <Loader className="w-4 h-4 text-blue-600 animate-spin" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: Document['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'analyzing':
        return 'bg-blue-100 text-blue-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (documents.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Calendar className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Documents Yet</h3>
        <p className="text-gray-600">Your document history will appear here once you upload files.</p>
      </div>
    );
  }

  const sortedDocuments = [...documents].sort((a, b) => 
    new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Document History</h2>
          <div className="text-sm text-gray-500">
            {documents.length} total documents
          </div>
        </div>
      </div>

      <div className="divide-y divide-gray-200">
        {sortedDocuments.map((doc) => (
          <div
            key={doc.id}
            onClick={() => onSelectDocument(doc)}
            className="p-6 hover:bg-gray-50 cursor-pointer transition-colors duration-200"
          >
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-900 truncate">{doc.name}</h3>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(doc.status)}`}>
                    {getStatusIcon(doc.status)}
                    <span className="ml-1 capitalize">{doc.status}</span>
                  </span>
                </div>
                
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <span>{formatFileSize(doc.size)}</span>
                  <span>•</span>
                  <span>{doc.uploadDate.toLocaleDateString()}</span>
                  <span>•</span>
                  <span>{doc.uploadDate.toLocaleTimeString()}</span>
                </div>
                
                {doc.analysis && (
                  <div className="mt-3 flex items-center space-x-6 text-xs text-gray-600">
                    <div className="flex items-center space-x-1">
                      <span className="font-medium">{doc.analysis.metadata.pages}</span>
                      <span>pages</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="font-medium">{doc.analysis.insights.length}</span>
                      <span>insights</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="font-medium">{doc.analysis.metadata.dataPoints || 0}</span>
                      <span>data points</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};