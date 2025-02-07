import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';

interface GraphNode {
  id: string;
  name: string;
  type: 'idea' | 'task' | 'agent' | 'skill';
  group: string;
  val: number;
  color: string;
  data?: any;
}

interface GraphLink {
  source: string;
  target: string;
  type: string;
  strength: number;
  color: string;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export function useGraphData() {
  const [data, setData] = useState<GraphData>({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Efficient data loading with pagination
  const loadData = useCallback(async (offset: number = 0, limit: number = 100) => {
    try {
      const [agentsResponse, tasksResponse, ideasResponse] = await Promise.all([
        supabase
          .from('agent_emotional_traits')
          .select('*')
          .range(offset, offset + limit - 1),
        supabase
          .from('agent_interactions')
          .select('*')
          .range(offset, offset + limit - 1),
        supabase
          .from('raw_data')
          .select('*')
          .eq('processed', true)
          .range(offset, offset + limit - 1)
      ]);

      // Transform data into graph format
      const nodes: GraphNode[] = [];
      const links: GraphLink[] = [];
      const nodeMap = new Map<string, boolean>();

      // Process agents
      agentsResponse.data?.forEach(agent => {
        if (!nodeMap.has(agent.agent_id)) {
          nodes.push({
            id: agent.agent_id,
            name: agent.agent_id.split('-').map(word => 
              word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' '),
            type: 'agent',
            group: 'agents',
            val: 20,
            color: '#3b82f6',
            data: agent
          });
          nodeMap.set(agent.agent_id, true);
        }
      });

      // Process tasks
      tasksResponse.data?.forEach(task => {
        if (!nodeMap.has(task.id)) {
          nodes.push({
            id: task.id,
            name: task.content?.substring(0, 20) + '...' || 'Task',
            type: 'task',
            group: 'tasks',
            val: 15,
            color: '#8b5cf6',
            data: task
          });
          nodeMap.set(task.id, true);

          if (task.agent_id) {
            links.push({
              source: task.agent_id,
              target: task.id,
              type: 'assigned',
              strength: 1,
              color: '#4b5563'
            });
          }
        }
      });

      // Process ideas
      ideasResponse.data?.forEach(idea => {
        if (!nodeMap.has(idea.id)) {
          nodes.push({
            id: idea.id,
            name: idea.content?.substring(0, 20) + '...' || 'Idea',
            type: 'idea',
            group: 'ideas',
            val: 10,
            color: '#ec4899',
            data: idea
          });
          nodeMap.set(idea.id, true);
        }
      });

      setData(prev => ({
        nodes: [...prev.nodes, ...nodes],
        links: [...prev.links, ...links]
      }));

      // Load more if needed
      if (nodes.length === limit) {
        loadData(offset + limit, limit);
      }

    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load graph data'));
      logger.error({ error: err }, 'Failed to load graph data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real-time updates
  useEffect(() => {
    const channel = supabase.channel('graph-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agent_interactions'
        },
        payload => {
          setData(prev => {
            const nodes = [...prev.nodes];
            const links = [...prev.links];

            if (payload.eventType === 'INSERT') {
              nodes.push({
                id: payload.new.id,
                name: payload.new.content?.substring(0, 20) + '...' || 'Task',
                type: 'task',
                group: 'tasks',
                val: 15,
                color: '#8b5cf6',
                data: payload.new
              });

              if (payload.new.agent_id) {
                links.push({
                  source: payload.new.agent_id,
                  target: payload.new.id,
                  type: 'assigned',
                  strength: 1,
                  color: '#4b5563'
                });
              }
            }

            return { nodes, links };
          });
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  return { data, loading, error };
}