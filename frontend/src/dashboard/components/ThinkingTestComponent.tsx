import React, { useState } from 'react';
import { useThinking } from '../hooks/useThinking';
import ThinkingDisplay from './ThinkingDisplay';

const ThinkingTestComponent: React.FC = () => {
  const [testMessage, setTestMessage] = useState('');
  
  const {
    thinkingState,
    toggleExpanded,
    clearThinking,
    createThinkingCompletion
  } = useThinking({
    apiKey: import.meta.env.VITE_AZURE_API_KEY || 'test-key',
    endpoint: import.meta.env.VITE_AZURE_ENDPOINT || 'https://test.openai.azure.com/',
    deploymentName: import.meta.env.VITE_AZURE_DEPLOYMENT_NAME || 'gpt-4o-mini',
    model: 'gpt-4o-mini'
  });

  const handleTestThinking = async () => {
    if (!testMessage.trim()) return;
    
    try {
      const result = await createThinkingCompletion([
        { role: 'user', content: testMessage }
      ]);
      console.log('Thinking completed:', result);
    } catch (error) {
      console.error('Thinking failed:', error);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">ChatGPT-like Thinking Test</h2>
      
      <div className="mb-4">
        <input
          type="text"
          value={testMessage}
          onChange={(e) => setTestMessage(e.target.value)}
          placeholder="Enter a test message..."
          className="w-full p-3 border border-gray-300 rounded-lg"
        />
        <button
          onClick={handleTestThinking}
          disabled={!testMessage.trim() || thinkingState.isThinking}
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
        >
          {thinkingState.isThinking ? 'Thinking...' : 'Test Thinking'}
        </button>
        <button
          onClick={clearThinking}
          className="mt-2 ml-2 px-4 py-2 bg-gray-600 text-white rounded-lg"
        >
          Clear
        </button>
      </div>

      <div className="mb-4">
        <ThinkingDisplay
          thinkingState={thinkingState}
          onToggleExpanded={toggleExpanded}
        />
      </div>

      <div className="text-sm text-gray-600">
        <p>This component tests the ChatGPT-like thinking process.</p>
        <p>Enter a message and click "Test Thinking" to see the AI reasoning process.</p>
      </div>
    </div>
  );
};

export default ThinkingTestComponent;
