import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAIAssistant } from './useAIAssistant';
import { useErrorRecovery } from './useErrorRecovery';
import { logger } from '../lib/logger';

interface FeatureEvent {
  type: string;
  data: any;
  metadata?: Record<string, unknown>;
}

export function useFeatureEvents(feature: string) {
  const { processTask } = useAIAssistant();
  const { recover } = useErrorRecovery({
    maxRetries: 3,
    onRecoveryComplete: () => logger.info({ feature }, 'Feature recovered from error')
  });

  useEffect(() => {
    const channel = supabase.channel(`${feature}-events`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: `${feature}_events` },
        async (payload) => {
          try {
            await handleFeatureEvent(payload.new as FeatureEvent);
          } catch (error) {
            logger.error({ error, feature, payload }, 'Failed to handle feature event');
            await recover(
              error instanceof Error ? error : new Error('Event handling failed'),
              { feature, payload }
            );
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [feature]);

  const handleFeatureEvent = async (event: FeatureEvent) => {
    logger.debug({ feature, event }, 'Processing feature event');

    // Process event with AI
    const analysis = await processTask(
      `Process ${feature} event: ${JSON.stringify(event)}`
    );

    // Store AI response
    await supabase
      .from('agent_interactions')
      .insert({
        agent_id: 'task-coordinator',
        content: analysis.content,
        metadata: {
          feature,
          event_type: event.type,
          confidence: analysis.confidence
        }
      });

    // Update feature state
    await supabase
      .from(`${feature}_state`)
      .upsert({
        event_id: event.type,
        state: analysis.metadata?.state,
        updated_at: new Date().toISOString()
      });

    logger.info({ feature, eventType: event.type }, 'Feature event processed');
  };
}