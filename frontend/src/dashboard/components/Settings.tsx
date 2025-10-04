import React, { useState } from 'react';
import { Key, Server, Shield, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { AzureOpenAIService } from '../lib/azure-openai';

interface SettingsProps {
  azureConfig: {
    apiKey: string;
    endpoint: string;
    deploymentName: string;
  };
  onConfigChange: (config: any) => void;
}

export const Settings: React.FC<SettingsProps> = ({ azureConfig, onConfigChange }) => {
  const [showApiKey, setShowApiKey] = useState(false);
  const [settings, setSettings] = useState({
    ...azureConfig,
    maxFileSize: '50',
    autoAnalyze: true,
    enableNotifications: true
  });

  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  const handleInputChange = (field: string, value: string | boolean) => {
    setSettings(prev => ({ ...prev, [field]: value }));
    
    // Update Azure config if it's one of the Azure fields
    if (['apiKey', 'endpoint', 'deploymentName'].includes(field)) {
      onConfigChange({
        ...azureConfig,
        [field]: value
      });
    }
  };

  const testConnection = async () => {
    setConnectionStatus('testing');
    
    try {
      const azureService = new AzureOpenAIService(azureConfig);
      const isConnected = await azureService.testConnection();
      setConnectionStatus(isConnected ? 'success' : 'error');
    } catch (error) {
      console.error('Connection test failed:', error);
      setConnectionStatus('error');
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* API Configuration */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <Key className="w-4 h-4 text-blue-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Azure OpenAI Configuration</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API Key
            </label>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={settings.apiKey}
                onChange={(e) => handleInputChange('apiKey', e.target.value)}
                placeholder="Enter your Azure OpenAI API key"
                className="w-full pr-10 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Endpoint URL
            </label>
            <div className="relative">
              <Server className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={settings.endpoint}
                onChange={(e) => handleInputChange('endpoint', e.target.value)}
                placeholder="https://your-resource.openai.azure.com/"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Deployment Name
            </label>
            <input
              type="text"
              value={settings.deploymentName}
              onChange={(e) => handleInputChange('deploymentName', e.target.value)}
              placeholder="Your GPT-4 deployment name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-gray-200">
            <div className="flex items-center space-x-2">
              {connectionStatus === 'success' && <CheckCircle className="w-4 h-4 text-green-600" />}
              {connectionStatus === 'error' && <AlertCircle className="w-4 h-4 text-red-600" />}
              <span className={`text-sm ${
                connectionStatus === 'success' ? 'text-green-600' :
                connectionStatus === 'error' ? 'text-red-600' : 'text-gray-500'
              }`}>
                {connectionStatus === 'success' ? 'Connection successful' :
                 connectionStatus === 'error' ? 'Connection failed' :
                 connectionStatus === 'testing' ? 'Testing connection...' : 'Not tested'}
              </span>
            </div>
            <button
              onClick={testConnection}
              disabled={connectionStatus === 'testing' || !settings.apiKey || !settings.endpoint}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {connectionStatus === 'testing' ? 'Testing...' : 'Test Connection'}
            </button>
          </div>
        </div>
      </div>

      {/* General Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
            <Shield className="w-4 h-4 text-green-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">General Settings</h2>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maximum File Size (MB)
            </label>
            <select
              value={settings.maxFileSize}
              onChange={(e) => handleInputChange('maxFileSize', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="10">10 MB</option>
              <option value="25">25 MB</option>
              <option value="50">50 MB</option>
              <option value="100">100 MB</option>
            </select>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Auto-analyze documents</h3>
                <p className="text-sm text-gray-500">Automatically start analysis when documents are uploaded</p>
              </div>
              <button
                onClick={() => handleInputChange('autoAnalyze', !settings.autoAnalyze)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  settings.autoAnalyze ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    settings.autoAnalyze ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Enable notifications</h3>
                <p className="text-sm text-gray-500">Get notified when analysis is complete</p>
              </div>
              <button
                onClick={() => handleInputChange('enableNotifications', !settings.enableNotifications)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  settings.enableNotifications ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    settings.enableNotifications ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Help Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-blue-900 mb-1">Getting Your Azure OpenAI Credentials</h3>
            <div className="text-sm text-blue-700 space-y-1">
              <p>1. Go to the <a href="https://portal.azure.com" target="_blank" rel="noopener noreferrer" className="underline">Azure Portal</a></p>
              <p>2. Navigate to your Azure OpenAI resource</p>
              <p>3. Go to "Keys and Endpoint" to find your API key and endpoint</p>
              <p>4. Ensure your deployment has Code Interpreter enabled</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};