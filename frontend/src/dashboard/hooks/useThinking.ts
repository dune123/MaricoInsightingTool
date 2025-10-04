import { useState, useCallback, useRef } from 'react';
import { ThinkingState, ThinkingStep, AzureStreamingConfig } from '../types/thinking';
import { AzureThinkingService } from '../lib/azure-thinking-service';

export const useThinking = (config: AzureStreamingConfig) => {
  const [thinkingState, setThinkingState] = useState<ThinkingState>({
    isThinking: false,
    currentStep: null,
    steps: [],
    startTime: null,
    endTime: null,
    totalDuration: null,
    isExpanded: false
  });

  const thinkingService = useRef(new AzureThinkingService(config));

  const startThinking = useCallback(() => {
    setThinkingState({
      isThinking: true,
      currentStep: null,
      steps: [],
      startTime: new Date(),
      endTime: null,
      totalDuration: null,
      isExpanded: true
    });
  }, []);

  const stopThinking = useCallback(() => {
    setThinkingState(prev => ({
      ...prev,
      isThinking: false,
      endTime: new Date(),
      totalDuration: prev.startTime ? new Date().getTime() - prev.startTime.getTime() : null
    }));
  }, []);

  const addThinkingStep = useCallback((step: Omit<ThinkingStep, 'id' | 'timestamp'>) => {
    const newStep: ThinkingStep = {
      ...step,
      id: crypto.randomUUID(),
      timestamp: new Date()
    };

    setThinkingState(prev => ({
      ...prev,
      steps: [...prev.steps, newStep],
      currentStep: newStep.id,
      isExpanded: true // Ensure thinking display stays expanded
    }));
  }, []);

  const updateThinkingStep = useCallback((stepId: string, updates: Partial<ThinkingStep>) => {
    setThinkingState(prev => ({
      ...prev,
      steps: prev.steps.map(step => 
        step.id === stepId ? { ...step, ...updates } : step
      )
    }));
  }, []);

  const toggleExpanded = useCallback(() => {
    setThinkingState(prev => ({
      ...prev,
      isExpanded: !prev.isExpanded
    }));
  }, []);

  const clearThinking = useCallback(() => {
    setThinkingState({
      isThinking: false,
      currentStep: null,
      steps: [],
      startTime: null,
      endTime: null,
      totalDuration: null,
      isExpanded: false
    });
  }, []);

  const setError = useCallback((error: string) => {
    setThinkingState(prev => ({
      ...prev,
      error,
      isThinking: false
    }));
  }, []);

  // Stream with thinking
  const streamWithThinking = useCallback(async function* (
    messages: Array<{ role: string; content: string }>
  ) {
    startThinking();
    
    try {
      const stream = thinkingService.current.streamWithThinking(
        messages,
        (thinking) => setThinkingState(thinking)
      );

      for await (const chunk of stream) {
        yield chunk;
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error');
      throw error;
    } finally {
      stopThinking();
    }
  }, [startThinking, stopThinking, setError]);

  // Simple completion with thinking simulation
  const createThinkingCompletion = useCallback(async (
    messages: Array<{ role: string; content: string }>
  ) => {
    console.log('useThinking: createThinkingCompletion called');
    startThinking();
    
    try {
      console.log('useThinking: calling createAdvancedThinkingCompletion');
      const result = await thinkingService.current.createAdvancedThinkingCompletion(
        messages,
        (thinking) => {
          console.log('useThinking: onThinkingUpdate called with:', thinking);
          setThinkingState(thinking);
        }
      );
      console.log('useThinking: result received:', result);
      return result;
    } catch (error) {
      console.error('useThinking: error occurred:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
      throw error;
    } finally {
      // Don't stop thinking immediately, let the service handle it
      console.log('useThinking: finally block - not stopping thinking yet');
    }
  }, [startThinking, stopThinking, setError]);

  return {
    thinkingState,
    startThinking,
    stopThinking,
    addThinkingStep,
    updateThinkingStep,
    toggleExpanded,
    clearThinking,
    setError,
    streamWithThinking,
    createThinkingCompletion
  };
};
