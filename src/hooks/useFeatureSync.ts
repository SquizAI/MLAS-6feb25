import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAIAssistant } from './useAIAssistant';
import { logger } from '../lib/logger';

interface SyncOptions {
  feature: 'schedule' | 'meals' | 'travel' | 'email';
  interval?: number;
  autoSync?: boolean;
}

export function useFeatureSync(options: SyncOptions) {
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const { processTask } = useAIAssistant();

  const sync = async () => {
    if (syncing) return;
    setSyncing(true);
    setError(null);

    try {
      // Get latest data from feature table
      const { data: featureData, error: fetchError } = await supabase
        .from(getFeatureTable(options.feature))
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (fetchError) throw fetchError;

      // Process with AI
      const analysis = await processTask(
        `Analyze and optimize ${options.feature} data: ${JSON.stringify(featureData)}`
      );

      // Store AI suggestions
      await supabase
        .from('agent_interactions')
        .insert({
          agent_id: getAgentId(options.feature),
          content: analysis.content,
          metadata: {
            feature: options.feature,
            confidence: analysis.confidence,
            suggestions: analysis.metadata?.suggestions
          }
        });

      setLastSync(new Date());
      logger.info({ feature: options.feature }, 'Feature sync completed');

    } catch (err) {
      const error = err instanceof Error ? err : new Error(`Failed to sync ${options.feature}`);
      setError(error);
      logger.error({ error, feature: options.feature }, 'Feature sync failed');
    } finally {
      setSyncing(false);
    }
  };

  // Auto-sync if enabled
  useEffect(() => {
    if (!options.autoSync) return;

    const interval = setInterval(sync, options.interval || 300000); // Default 5 minutes
    return () => clearInterval(interval);
  }, [options.autoSync, options.interval]);

  return {
    sync,
    syncing,
    lastSync,
    error
  };
}

function getFeatureTable(feature: string): string {
  switch (feature) {
    case 'schedule': return 'events';
    case 'meals': return 'meal_plans';
    case 'travel': return 'travel_plans';
    case 'email': return 'agent_interactions';
    default: throw new Error(`Unknown feature: ${feature}`);
  }
}

function getAgentId(feature: string): string {
  switch (feature) {
    case 'schedule': return 'task-coordinator';
    case 'meals': return 'data-analyzer';
    case 'travel': return 'research-agent';
    case 'email': return 'data-analyzer';
    default: throw new Error(`Unknown feature: ${feature}`);
  }
}