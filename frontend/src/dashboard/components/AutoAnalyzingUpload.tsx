import React, { useState } from 'react';
import { Upload, FileText, Loader2, CheckCircle, XCircle, Brain } from 'lucide-react';

interface AutoAnalyzingUploadProps {
  onFileUpload: (file: File) => Promise<void>;
  disabled?: boolean;
}

export const AutoAnalyzingUpload: React.FC<AutoAnalyzingUploadProps> = ({
  onFileUpload,
  disabled = false
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState<'idle' | 'analyzing' | 'success' | 'error'>('idle');
  const [progressText, setProgressText] = useState('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    setIsAnalyzing(true);
    setAnalysisStatus('analyzing');
    setProgressText('Uploading file...');

    try {
      // Simulate progress steps
      const progressSteps = [
        'Uploading file...',
        'Analyzing data structure...',
        'Generating insights...',
        'Creating visualizations...',
        'Finalizing analysis...'
      ];

      // Update progress text every 2 seconds
      let stepIndex = 0;
      const progressInterval = setInterval(() => {
        if (stepIndex < progressSteps.length - 1) {
          stepIndex++;
          setProgressText(progressSteps[stepIndex]);
        }
      }, 2000);

      await onFileUpload(file);
      
      clearInterval(progressInterval);
      setProgressText('Analysis complete!');
      setAnalysisStatus('success');
    } catch (error) {
      console.error('Upload failed:', error);
      setProgressText('Analysis failed');
      setAnalysisStatus('error');
    } finally {
      setIsAnalyzing(false);
      // Reset status after 4 seconds
      setTimeout(() => {
        setAnalysisStatus('idle');
        setProgressText('');
      }, 4000);
    }
  };

  const getIcon = () => {
    if (isAnalyzing) {
      return <Loader2 className="w-5 h-5 text-white animate-spin" />;
    }
    
    switch (analysisStatus) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-white" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-white" />;
      default:
        return <Upload className="w-5 h-5 text-white" />;
    }
  };

  const getButtonClass = () => {
    if (disabled || isAnalyzing) {
      return 'bg-gray-300 cursor-not-allowed';
    }
    
    switch (analysisStatus) {
      case 'success':
        return 'bg-green-600 hover:bg-green-700';
      case 'error':
        return 'bg-red-600 hover:bg-red-700';
      default:
        return 'bg-blue-600 hover:bg-blue-700';
    }
  };

  return (
    <div className="relative">
      <label className={`cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
        <input
          type="file"
          className="sr-only"
          accept=".csv,.xlsx,.xls"
          disabled={disabled || isAnalyzing}
          onChange={handleFileChange}
        />
        <div className={`
          w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200
          ${getButtonClass()}
        `}>
          {getIcon()}
        </div>
      </label>
      
      {/* Progress indicator */}
      {(isAnalyzing || analysisStatus !== 'idle') && (
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-gray-600 whitespace-nowrap min-w-max">
          <div className="flex items-center space-x-1">
            {isAnalyzing && <Brain className="w-3 h-3 animate-pulse" />}
            <span>{progressText || 'Processing...'}</span>
          </div>
        </div>
      )}

      {/* Tooltip */}
      <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 hover:opacity-100 transition-opacity duration-200 pointer-events-none">
        {disabled ? 'A file is already uploaded' : 
         isAnalyzing ? 'Analyzing your data...' :
         'Upload CSV/Excel for instant AI analysis'}
      </div>
    </div>
  );
};
