import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';

interface VoiceMemo {
  id: string;
  transcript: string;
  processed_data: {
    summary: string;
    tasks: string[];
    keyPoints: string[];
    nextSteps: string[];
  };
  audio_url?: string;
  duration?: number;
  created_at: string;
}

export function useVoiceMemos() {
  const [memos, setMemos] = useState<VoiceMemo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchMemos = async () => {
      try {
        const { data, error } = await supabase
          .from('voice_memos')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setMemos(data || []);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch voice memos'));
        logger.error({ error: err }, 'Failed to fetch voice memos');
      } finally {
        setLoading(false);
      }
    };

    fetchMemos();

    // Subscribe to real-time updates
    const channel = supabase.channel('voice-memos')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'voice_memos'
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setMemos(prev => [payload.new as VoiceMemo, ...prev]);
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  const createMemo = async (memo: Omit<VoiceMemo, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('voice_memos')
        .insert(memo)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      logger.error({ error: err }, 'Failed to create voice memo');
      throw err;
    }
  };

  return {
    memos,
    loading,
    error,
    createMemo
  };
}