export interface ThinkingStep {
  id: string;
  type: 'reasoning' | 'tool_call' | 'code_execution' | 'analysis' | 'synthesis';
  content: string;
  timestamp: Date;
  status: 'active' | 'completed' | 'error';
  metadata?: {
    toolName?: string;
    codeLanguage?: string;
    confidence?: number;
    duration?: number;
  };
}

export interface ThinkingState {
  isThinking: boolean;
  currentStep: string | null;
  steps: ThinkingStep[];
  startTime: Date | null;
  endTime: Date | null;
  totalDuration: number | null;
  isExpanded: boolean;
  error?: string;
}

export interface ThinkingProgress {
  phase: 'initial' | 'processing' | 'tool_usage' | 'synthesis' | 'final';
  message: string;
  progress: number; // 0-100
  isToolActive: boolean;
  toolName?: string;
}

export interface StreamingResponse {
  content: string;
  thinking?: ThinkingStep[];
  toolCalls?: ToolCall[];
  isComplete: boolean;
  error?: string;
}

export interface ToolCall {
  id: string;
  type: string;
  function: {
    name: string;
    arguments: string;
  };
  status: 'pending' | 'running' | 'completed' | 'error';
  result?: any;
}

export interface ThinkingDisplayProps {
  thinkingState: ThinkingState;
  onToggleExpanded: () => void;
  onStepClick?: (step: ThinkingStep) => void;
  className?: string;
}

export interface AzureStreamingConfig {
  apiKey: string;
  endpoint: string;
  deploymentName: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}
