import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';
import { EmotionalProcessingUnit } from '../services/EmotionalProcessing';
import { KnowledgeGraphService } from '../services/KnowledgeGraph';

interface DataInput {
  source: string;
  content: string;
  metadata?: Record<string, unknown>;
}

export function useDataCapture() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const knowledgeGraph = new KnowledgeGraphService();
  const epu = new EmotionalProcessingUnit(knowledgeGraph);

  const captureData = useCallback(async (data: DataInput) => {
    setLoading(true);
    setError(null);

    try {
      // Process emotional content
      const emotionalContext = await epu.processEmotionalContent(
        data.content,
        { source: data.source }
      );

      // Insert data into Supabase
      const { data: rawData, error: insertError } = await supabase
        .from('raw_data')
        .insert([{
          source: data.source,
          content: data.content,
          metadata: {
            ...data.metadata,
            emotional: {
              primaryEmotion: emotionalContext.primaryEmotion,
              temporalDynamics: emotionalContext.temporalDynamics,
              socialContext: emotionalContext.socialContext
            }
          },
          user_id: (await supabase.auth.getUser()).data.user?.id,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      // Store emotional state
      const { error: emotionalError } = await supabase
        .from('emotional_states')
        .insert({
          raw_data_id: rawData.id,
          valence: emotionalContext.emotionalState.valence,
          arousal: emotionalContext.emotionalState.arousal,
          dominance: emotionalContext.emotionalState.dominance,
          intensity: emotionalContext.emotionalState.intensity,
          confidence: emotionalContext.emotionalState.confidence,
          primary_emotion: emotionalContext.primaryEmotion,
          metadata: {
            secondaryEmotions: emotionalContext.secondaryEmotions,
            temporalDynamics: emotionalContext.temporalDynamics
          }
        });

      if (emotionalError) throw emotionalError;

      logger.info({ source: data.source }, 'Data captured successfully');
    } catch (err) {
      logger.error({ error: err }, 'Failed to capture data');
      setError(err instanceof Error ? err : new Error('Failed to capture data'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    captureData,
    loading,
    error
  };
}