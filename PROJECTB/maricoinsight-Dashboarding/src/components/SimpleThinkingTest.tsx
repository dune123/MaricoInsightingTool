import React, { useState } from 'react';
import { useThinking } from '../hooks/useThinking';
import ThinkingDisplay from './ThinkingDisplay';

const SimpleThinkingTest: React.FC = () => {
  const [testMessage, setTestMessage] = useState('');
  const [result, setResult] = useState('');
  
  const {
    thinkingState,
    toggleExpanded,
    clearThinking,
    createThinkingCompletion
  } = useThinking({
    apiKey: 'test-key',
    endpoint: 'https://test.openai.azure.com/',
    deploymentName: 'gpt-4o-mini',
    model: 'gpt-4o-mini'
  });

  const handleTest = async () => {
    if (!testMessage.trim()) return;
    
    try {
      console.log('Starting thinking test...');
      console.log('Thinking state before:', thinkingState);
      const result = await createThinkingCompletion([
        { role: 'user', content: testMessage }
      ]);
      console.log('Thinking completed:', result);
      console.log('Thinking state after:', thinkingState);
      setResult(result.content);
    } catch (error) {
      console.error('Thinking failed:', error);
      setResult('Error: ' + (error as Error).message);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Simple Thinking Test</h2>
      
      <div className="mb-4">
        <input
          type="text"
          value={testMessage}
          onChange={(e) => setTestMessage(e.target.value)}
          placeholder="Enter a test message..."
          className="w-full p-3 border border-gray-300 rounded-lg"
        />
        <div className="mt-2 space-x-2">
          <button
            onClick={handleTest}
            disabled={!testMessage.trim() || thinkingState.isThinking}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
          >
            {thinkingState.isThinking ? 'Thinking...' : 'Test Thinking'}
          </button>
          <button
            onClick={clearThinking}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="mb-4">
        <ThinkingDisplay
          thinkingState={thinkingState}
          onToggleExpanded={toggleExpanded}
        />
      </div>

      {result && (
        <div className="mt-4 p-4 bg-gray-100 rounded-lg">
          <h3 className="font-bold mb-2">Result:</h3>
          <p className="whitespace-pre-wrap">{result}</p>
        </div>
      )}

      <div className="text-sm text-gray-600 mt-4">
        <p>This is a simple test of the ChatGPT-like thinking process.</p>
        <p>Enter a message and click "Test Thinking" to see the AI reasoning process.</p>
      </div>
    </div>
  );
};

export default SimpleThinkingTest;
