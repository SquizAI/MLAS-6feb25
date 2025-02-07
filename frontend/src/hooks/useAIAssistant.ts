import { useState, useCallback } from 'react';
import { aiClient } from '../lib/ai/client';
import { logger } from '../lib/logger';

interface AIResponse {
  content: string;
  confidence: number;
  metadata?: Record<string, unknown>;
}

export function useAIAssistant() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const processTask = useCallback(async (task: string): Promise<AIResponse> => {
    setLoading(true);
    setError(null);

    try {
      const result = await aiClient.processTask(task);
      return {
        content: result.response,
        confidence: result.confidence || 0.8,
        metadata: result.metadata
      };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to process task');
      setError(error);
      logger.error({ error, task }, 'AI task processing failed');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const generateResponse = useCallback(async (context: string): Promise<string> => {
    setLoading(true);
    setError(null);

    try {
      const result = await aiClient.agentCommunication('assistant', context);
      return result.response || '';
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to generate response');
      setError(error);
      logger.error({ error, context }, 'AI response generation failed');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const analyzeContent = useCallback(async (content: string[]): Promise<any> => {
    setLoading(true);
    setError(null);

    try {
      return await aiClient.synthesizeKnowledge(content);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to analyze content');
      setError(error);
      logger.error({ error }, 'AI content analysis failed');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    processTask,
    generateResponse,
    analyzeContent,
    loading,
    error
  };
}