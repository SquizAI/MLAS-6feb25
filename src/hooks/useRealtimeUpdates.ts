import { useEffect, useState, useCallback, useRef } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { usePerformanceOptimization } from './usePerformanceOptimization';
import { logger } from '../lib/logger';

interface RealtimeOptions {
  tables?: string[];
  filter?: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  batchSize?: number;
  debounceMs?: number;
}

export function useRealtimeUpdates<T = any>(options: RealtimeOptions = {}) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { memoize, trackRenderTime } = usePerformanceOptimization();
  const batchSize = options.batchSize || 50;
  const debounceMs = options.debounceMs || 500;  // Increased debounce time
  
  // Batch updates for better performance
  const updateQueue = useRef<any[]>([]);
  const updateTimeout = useRef<NodeJS.Timeout>();

  const processBatch = useCallback(() => {
    if (updateQueue.current.length === 0) return;

    setData(prev => {
      const updates = updateQueue.current;
      updateQueue.current = [];

      return updates.reduce((acc, update) => {
        switch (update.eventType) {
          case 'INSERT':
            return [...acc, update.new];
          case 'UPDATE':
            return acc.map(item => 
              item.id === update.new.id ? update.new : item
            );
          case 'DELETE':
            return acc.filter(item => item.id !== update.old.id);
          default:
            return acc;
        }
      }, prev);
    });
  }, []);

  // Memoize channel setup to prevent unnecessary reconnections
  const setupChannel = useCallback(() => {
    const channel = supabase.channel('db-changes', {
      config: {
        broadcast: { self: true },
      },
    });

    // Set up listeners for each table
    (options.tables || []).forEach(table => {
      channel.on(
        'postgres_changes',
        {
          event: options.event || '*',
          schema: 'public',
          table,
          filter: options.filter,
        },
        payload => {
          // Queue update
          updateQueue.current.push(payload);
          
          // Debounce processing
          if (updateTimeout.current) {
            clearTimeout(updateTimeout.current);
          }
          
          if (updateQueue.current.length >= batchSize) {
            processBatch();
          } else {
            updateTimeout.current = setTimeout(processBatch, debounceMs);
          }
        }
      );
    });

    channel.subscribe(status => {
      if (status === 'SUBSCRIBED') {
        logger.info('Realtime connection established');
      }
    });

    return channel;
  }, [options.tables?.join(','), options.filter, options.event]);

  useEffect(() => {
    let channel: RealtimeChannel;
    const endRenderTracking = trackRenderTime();

    const initialize = async () => {
      try {
        setLoading(true);
        channel = setupChannel();

        // Initial data load
        const loadPage = async (table: string, from = 0) => {
          const { data, error, count } = await supabase
            .from(table)
            .select('id, agent_id, status, content', { count: 'exact' }) // Select only needed fields
            .order('updated_at', { ascending: false })
            .range(from, Math.min(from + batchSize - 1, 100));  // Limit total records

          if (error) throw error;
          
          if (data) {
            setData(prev => [...prev, ...data]);
            
            // Load next page if there's more data
            if (count && from + data.length < count) {
              await loadPage(table, from + batchSize);
              // Get full task details including agent status
              const { data: task } = await supabase
                .from('agent_interactions')
                .select(`
                  *,
                  agent:agent_emotional_traits(*)
                `)
                .eq('id', payload.new.id)
                .single();

              if (task) {
                // Update UI with rich task data
                setTasks(prev => {
                  const updated = [...prev];
                  const index = updated.findIndex(t => t.id === task.id);
                  
                  if (index >= 0) {
                    updated[index] = {
                      ...task,
                      progress: calculateProgress(task),
                      timeRemaining: estimateTimeRemaining(task),
                      bottlenecks: identifyBottlenecks(task)
                    };
                  }
                  
                  return updated;
                });
              }
            }
          }
        };

        if (options.tables) {
          await Promise.all(options.tables.map(table => loadPage(table)));
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to initialize'));
        logger.error({ error: err }, 'Realtime updates initialization failed');
      } finally {
        setLoading(false);
        endRenderTracking();
      }
    };

    initialize();

    return () => {
      channel?.unsubscribe();
    };
  }, [setupChannel, batchSize, trackRenderTime]);

  return { data, loading, error };
}