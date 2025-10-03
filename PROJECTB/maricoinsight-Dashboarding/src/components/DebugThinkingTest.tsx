import React, { useState } from 'react';
import { useThinking } from '../hooks/useThinking';
import ThinkingDisplay from './ThinkingDisplay';

const DebugThinkingTest: React.FC = () => {
  const [testMessage, setTestMessage] = useState('');
  const [result, setResult] = useState('');
  
  const {
    thinkingState,
    toggleExpanded,
    clearThinking,
    createThinkingCompletion,
    addThinkingStep
  } = useThinking({
    apiKey: 'test-key',
    endpoint: 'https://test.openai.azure.com/',
    deploymentName: 'gpt-4o-mini',
    model: 'gpt-4o-mini'
  });

  const handleTest = async () => {
    if (!testMessage.trim()) return;
    
    try {
      console.log('=== DEBUG: Starting thinking test ===');
      console.log('Initial thinking state:', thinkingState);
      
      const result = await createThinkingCompletion([
        { role: 'user', content: testMessage }
      ]);
      
      console.log('=== DEBUG: Thinking completed ===');
      console.log('Final thinking state:', thinkingState);
      console.log('Result:', result);
      
      setResult(result.content);
    } catch (error) {
      console.error('=== DEBUG: Thinking failed ===', error);
      setResult('Error: ' + (error as Error).message);
    }
  };

  const handleManualStep = () => {
    console.log('=== DEBUG: Adding manual thinking step ===');
    addThinkingStep({
      type: 'reasoning',
      content: 'Manual thinking step added for testing...',
      status: 'active',
      metadata: { confidence: 0.9 }
    });
  };

  return (
    <div className="p-4 h-full flex flex-col">
      <div className="mb-3">
        <h2 className="text-lg font-bold mb-2">Debug Thinking Test</h2>
        
        {/* Compact Controls */}
        <div className="space-y-2">
          <input
            type="text"
            value={testMessage}
            onChange={(e) => setTestMessage(e.target.value)}
            placeholder="Enter a test message..."
            className="w-full p-2 border border-gray-300 rounded text-sm"
          />
          <div className="flex space-x-2">
            <button
              onClick={handleTest}
              disabled={!testMessage.trim() || thinkingState.isThinking}
              className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm disabled:opacity-50 flex-1"
            >
              {thinkingState.isThinking ? 'Thinking...' : 'Test Thinking'}
            </button>
            <button
              onClick={handleManualStep}
              className="px-3 py-1.5 bg-green-600 text-white rounded text-sm"
            >
              Add Step
            </button>
            <button
              onClick={clearThinking}
              className="px-3 py-1.5 bg-gray-600 text-white rounded text-sm"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Compact Thinking Display */}
      <div className="flex-1 flex flex-col min-h-0">
        <h3 className="font-semibold mb-2 text-sm">Thinking Display:</h3>
        <div className="flex-1 overflow-hidden">
          <ThinkingDisplay
            thinkingState={thinkingState}
            onToggleExpanded={toggleExpanded}
            className="h-full"
          />
        </div>
      </div>

      {/* Compact Result Display */}
      {result && (
        <div className="mt-3 p-3 bg-gray-50 rounded border max-h-32 overflow-y-auto">
          <h3 className="font-semibold mb-1 text-sm">Result:</h3>
          <p className="whitespace-pre-wrap text-xs">{result}</p>
        </div>
      )}

      {/* Compact Debug Info - Collapsible */}
      <details className="mt-2">
        <summary className="text-xs text-gray-600 cursor-pointer hover:text-gray-800">
          Debug State (Click to expand)
        </summary>
        <div className="mt-2 p-2 bg-gray-100 rounded">
          <pre className="text-xs bg-white p-2 rounded border max-h-24 overflow-y-auto">
            {JSON.stringify(thinkingState, null, 2)}
          </pre>
        </div>
      </details>

      <div className="text-sm text-gray-600 mt-4">
        <p>This debug component shows the thinking state and allows manual testing.</p>
        <p>Check the browser console for detailed logs.</p>
      </div>
    </div>
  );
};

export default DebugThinkingTest;
