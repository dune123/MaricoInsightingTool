 import React, { useState, useEffect } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  Brain, 
  Code, 
  Play, 
  CheckCircle, 
  XCircle, 
  Clock,
  Search,
  Lightbulb,
  Sparkles,
  Eye,
  EyeOff
} from 'lucide-react';
import { ThinkingStep, ThinkingDisplayProps } from '../types/thinking';

const ThinkingDisplay: React.FC<ThinkingDisplayProps> = ({
  thinkingState,
  onToggleExpanded,
  className = ''
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [typingText, setTypingText] = useState('');
  const [isStuck, setIsStuck] = useState(false);

  // Debug logging (reduced for performance)
  console.log('ThinkingDisplay: isThinking =', thinkingState.isThinking, 'steps =', thinkingState.steps.length);

  // Auto-scroll to latest step with performance optimization
  useEffect(() => {
    if (thinkingState.steps.length > 0) {
      const container = document.querySelector('.thinking-steps-container');
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }
  }, [thinkingState.steps.length]);

  // Improved typing animation with stuck detection
  useEffect(() => {
    let typingInterval: NodeJS.Timeout;
    let stuckTimeout: NodeJS.Timeout;
    
    if (thinkingState.isThinking && thinkingState.steps.length > 0) {
      const activeStep = thinkingState.steps.find(step => step.status === 'active');
      if (activeStep) {
        const text = activeStep.content;
        let index = 0;
        setTypingText('');
        setIsStuck(false);
        
        // Set up stuck detection (if no progress for 10 seconds)
        stuckTimeout = setTimeout(() => {
          setIsStuck(true);
          console.warn('Thinking process appears stuck');
        }, 10000);
        
        typingInterval = setInterval(() => {
          if (index < text.length) {
            setTypingText(text.slice(0, index + 1));
            index++;
            // Reset stuck timer on progress
            clearTimeout(stuckTimeout);
            stuckTimeout = setTimeout(() => setIsStuck(true), 10000);
          } else {
            clearInterval(typingInterval);
            clearTimeout(stuckTimeout);
          }
        }, 20); // Faster typing for better UX
      }
    } else {
      setIsStuck(false);
    }

    return () => {
      clearInterval(typingInterval);
      clearTimeout(stuckTimeout);
    };
  }, [thinkingState.isThinking, thinkingState.steps]);

  const getStepIcon = (step: ThinkingStep) => {
    switch (step.type) {
      case 'reasoning':
        return <Brain className="w-4 h-4 text-blue-500" />;
      case 'tool_call':
        return <Code className="w-4 h-4 text-green-500" />;
      case 'code_execution':
        return <Play className="w-4 h-4 text-orange-500" />;
      case 'analysis':
        return <Search className="w-4 h-4 text-purple-500" />;
      case 'synthesis':
        return <Lightbulb className="w-4 h-4 text-yellow-500" />;
      default:
        return <Brain className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStepStatusIcon = (status: ThinkingStep['status']) => {
    switch (status) {
      case 'active':
        return <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const getProgressMessage = () => {
    if (thinkingState.steps.length === 0) {
      return thinkingState.isThinking ? 'Starting to think...' : 'Ready';
    }
    
    const activeStep = thinkingState.steps.find(step => step.status === 'active');
    if (activeStep) {
      return activeStep.content;
    }
    
    const lastStep = thinkingState.steps[thinkingState.steps.length - 1];
    return lastStep?.content || 'Processing...';
  };

  // Always show the thinking display for debugging
  console.log('ThinkingDisplay: isThinking =', thinkingState.isThinking, 'steps =', thinkingState.steps.length);
  
  // Show thinking display if there are steps or if thinking is active
  if (!thinkingState.isThinking && thinkingState.steps.length === 0) {
    return (
      <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
        <p className="text-xs text-gray-500">No thinking process active. Click "Test Thinking" to start.</p>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-md shadow-sm w-full ${className}`}>
      {/* Compact Header */}
      <div 
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-100"
        onClick={onToggleExpanded}
      >
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1.5">
            {thinkingState.isThinking ? (
              isStuck ? (
                <div className="flex items-center space-x-1 thinking-stuck-indicator">
                  <XCircle className="w-3 h-3 text-red-500" />
                  <span className="text-xs text-red-600">Stuck?</span>
                </div>
              ) : (
                <div className="flex space-x-0.5">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              )
            ) : (
              <CheckCircle className="w-3 h-3 text-green-500" />
            )}
            <Brain className="w-3 h-3 text-blue-500" />
          </div>
          <div>
            <span className="text-xs font-medium text-gray-900">
              {thinkingState.isThinking ? (isStuck ? 'Thinking (Stuck?)' : 'Thinking...') : 'Analyzed'}
            </span>
            <p className="text-xs text-gray-500 max-w-48 truncate">
              {thinkingState.isThinking ? (typingText || getProgressMessage()) : 'Analysis complete'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {thinkingState.totalDuration && (
            <span className="text-xs text-gray-500">
              {formatDuration(thinkingState.totalDuration)}
            </span>
          )}
          {isStuck && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                window.location.reload(); // Simple recovery mechanism
              }}
              className="text-xs text-red-600 hover:text-red-800 px-2 py-1 rounded bg-red-50 hover:bg-red-100 transition-colors"
            >
              Restart
            </button>
          )}
          {thinkingState.isExpanded ? (
            <ChevronDown className="w-3 h-3 text-gray-500" />
          ) : (
            <ChevronRight className="w-3 h-3 text-gray-500" />
          )}
        </div>
      </div>

      {/* Full Width Expanded Content */}
      {thinkingState.isExpanded && (
        <div className="thinking-steps-container w-full">
          {thinkingState.steps.length === 0 ? (
            <div className="text-center py-4">
              <Brain className="w-6 h-6 text-gray-400 mx-auto mb-2" />
              <p className="text-xs text-gray-500">No thinking steps recorded yet</p>
            </div>
          ) : (
            <div className="space-y-0 w-full">
              {thinkingState.steps.map((step, index) => (
                <div key={step.id} className="border-b border-gray-100 last:border-b-0 thinking-fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
                  {/* Compact Step Header */}
                  <div className={`flex items-center justify-between p-2 thinking-smooth-transition ${
                    step.status === 'active' 
                      ? 'thinking-step-active bg-blue-50' 
                      : step.status === 'completed' 
                      ? 'thinking-step-completed bg-green-50' 
                      : 'bg-gray-50'
                  }`}>
                    <div className="flex items-center space-x-2">
                      {getStepIcon(step)}
                      <div>
                        <span className="text-xs font-medium text-gray-900">
                          {step.type.replace('_', ' ').toUpperCase()}
                        </span>
                        <div className="flex items-center space-x-1 mt-0.5">
                          {getStepStatusIcon(step.status)}
                          {step.metadata?.duration && (
                            <span className="text-xs text-gray-500">
                              {formatDuration(step.metadata.duration)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      {step.metadata?.toolName && (
                        <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded text-xs">
                          {step.metadata.toolName}
                        </span>
                      )}
                      {step.metadata?.confidence && (
                        <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-xs">
                          {Math.round(step.metadata.confidence * 100)}%
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Compact Step Content */}
                  <div className="p-2">
                    <div className="bg-gray-900 text-white rounded p-2 font-mono text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-400 uppercase">
                          {step.type === 'code_execution' ? 'python' : 'thinking'}
                        </span>
                      </div>
                      <pre className="whitespace-pre-wrap text-xs leading-relaxed">
                        {step.content}
                        {step.status === 'active' && (
                          <span className="thinking-typing-cursor text-blue-400">|</span>
                        )}
                      </pre>
                    </div>

                    {/* Compact Result Section */}
                    {step.status === 'completed' && (
                      <div className="mt-1 p-1.5 bg-green-50 border border-green-200 rounded">
                        <div className="flex items-center space-x-1">
                          <CheckCircle className="w-3 h-3 text-green-600" />
                          <span className="text-xs font-medium text-green-700">Completed</span>
                        </div>
                      </div>
                    )}

                    {step.status === 'error' && (
                      <div className="mt-1 p-1.5 bg-red-50 border border-red-200 rounded">
                        <div className="flex items-center space-x-1">
                          <XCircle className="w-3 h-3 text-red-600" />
                          <span className="text-xs font-medium text-red-700">Failed</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {thinkingState.error && (
            <div className="p-2 m-2 bg-red-50 border border-red-200 rounded">
              <div className="flex items-center space-x-1">
                <XCircle className="w-3 h-3 text-red-500" />
                <span className="text-xs text-red-700">Error in thinking process</span>
              </div>
              <p className="text-xs text-red-600 mt-1">{thinkingState.error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ThinkingDisplay;
