import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAIAssistant } from './useAIAssistant';
import { useFeatureSync } from './useFeatureSync';
import { useFeatureEvents } from './useFeatureEvents';
import { useErrorRecovery } from './useErrorRecovery';
import { logger } from '../lib/logger';

interface FeatureConfig {
  id: string;
  type: 'schedule' | 'meals' | 'travel' | 'email';
  agentId: string;
  autoSync?: boolean;
  syncInterval?: number;
}

export function useFeatureManager(config: FeatureConfig) {
  const [processing, setProcessing] = useState(false);
  const { processTask, generateResponse } = useAIAssistant();
  const { sync, syncing } = useFeatureSync({
    feature: config.type,
    autoSync: config.autoSync,
    interval: config.syncInterval
  });
  const { recover } = useErrorRecovery({
    maxRetries: 3,
    onRecoveryComplete: () => sync()
  });

  // Use feature events
  useFeatureEvents(config.type);

  const handleAction = useCallback(async (action: string, data: any) => {
    setProcessing(true);
    try {
      // Process with AI
      const result = await processTask(
        `Handle ${config.type} action: ${action}\nData: ${JSON.stringify(data)}`
      );

      // Create agent interaction
      const { error: agentError } = await supabase
        .from('agent_interactions')
        .insert({
          agent_id: config.agentId,
          content: result.content,
          metadata: {
            feature: config.type,
            action,
            data,
            confidence: result.confidence
          }
        });

      if (agentError) throw agentError;

      // Generate response
      const response = await generateResponse(result.content);

      // Store result
      const { error: resultError } = await supabase
        .from(`${config.type}_results`)
        .insert({
          action,
          result: response,
          metadata: result.metadata
        });

      if (resultError) throw resultError;

      logger.info({ 
        feature: config.type,
        action,
        success: true
      }, 'Feature action completed');

      return response;

    } catch (error) {
      logger.error({ error, feature: config.type, action }, 'Feature action failed');
      await recover(
        error instanceof Error ? error : new Error('Action failed'),
        { feature: config.type, action, data }
      );
      throw error;
    } finally {
      setProcessing(false);
    }
  }, [config, processTask, generateResponse, recover]);

  return {
    handleAction,
    processing: processing || syncing,
    sync
  };
}