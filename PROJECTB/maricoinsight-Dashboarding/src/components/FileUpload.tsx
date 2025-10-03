import React, { useCallback, useState } from 'react';
import { Upload, FileText, File, Image, BarChart } from 'lucide-react';
import { Document } from '../App';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  documents: Document[];
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload, documents }) => {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileUpload(e.dataTransfer.files[0]);
    }
  }, [onFileUpload]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      onFileUpload(e.target.files[0]);
    }
  }, [onFileUpload]);

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return FileText;
    if (type.includes('csv') || type.includes('excel')) return BarChart;
    if (type.includes('image')) return Image;
    return File;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const recentDocuments = documents.slice(-3);

  return (
    <div className="space-y-8">
      {/* Upload Area */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Documents</h2>
          <p className="text-gray-600">Upload PDFs, Excel files, CSVs, or text documents to chat with AI</p>
        </div>

        <div
          className={`relative border-2 border-dashed rounded-xl p-8 transition-all duration-200 ${
            dragActive 
              ? 'border-blue-400 bg-blue-50' 
              : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            id="file-upload"
            type="file"
            className="sr-only"
            accept=".pdf,.csv,.xlsx,.xls,.txt,.docx"
            onChange={handleChange}
          />
          
          <div className="text-center">
            <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 transition-colors duration-200 ${
              dragActive ? 'bg-blue-100' : 'bg-gray-100'
            }`}>
              <Upload className={`w-6 h-6 transition-colors duration-200 ${
                dragActive ? 'text-blue-600' : 'text-gray-600'
              }`} />
            </div>
            
            <label htmlFor="file-upload" className="cursor-pointer">
              <span className="text-lg font-medium text-gray-900">
                {dragActive ? 'Drop your document here' : 'Click to upload or drag and drop'}
              </span>
            </label>
            
            <p className="text-sm text-gray-500 mt-2">
              PDF, Excel, CSV, TXT up to 50MB
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          <div className="flex items-center space-x-2 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
            <FileText className="w-4 h-4 text-red-500" />
            <span>PDF Reports</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
            <BarChart className="w-4 h-4 text-green-500" />
            <span>Excel/CSV</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
            <File className="w-4 h-4 text-blue-500" />
            <span>Text Files</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
            <Image className="w-4 h-4 text-purple-500" />
            <span>Documents</span>
          </div>
        </div>
      </div>

      {/* Recent Documents */}
      {recentDocuments.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Uploads</h3>
          <div className="space-y-3">
            {recentDocuments.map((doc) => {
              const Icon = getFileIcon(doc.type);
              return (
                <div key={doc.id} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Icon className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{doc.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(doc.size)} • {doc.uploadDate.toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      doc.status === 'ready' ? 'bg-green-500' :
                      doc.status === 'error' ? 'bg-red-500' : 'bg-gray-300'
                    }`} />
                    <span className="text-xs text-gray-500 capitalize">{doc.status}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};