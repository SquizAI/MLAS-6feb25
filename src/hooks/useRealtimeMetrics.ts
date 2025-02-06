import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';

interface SystemMetrics {
  activeAgents: number;
  successRate: number;
  systemHealth: number;
  knowledgeNodes: number;
  taskCounts: {
    pending: number;
    inProgress: number;
    completed: number;
  };
  performance: {
    avgResponseTime: number;
    errorRate: number;
    resourceUtilization: number;
  };
}

export function useRealtimeMetrics() {
  const [metrics, setMetrics] = useState<SystemMetrics>({
    activeAgents: 0,
    successRate: 0,
    systemHealth: 0,
    knowledgeNodes: 0,
    taskCounts: {
      pending: 0,
      inProgress: 0,
      completed: 0
    },
    performance: {
      avgResponseTime: 0,
      errorRate: 0,
      resourceUtilization: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        // Get active agents
        const { data: agents } = await supabase
          .from('agent_emotional_traits')
          .select('status')
          .neq('status', 'offline');

        const activeAgents = agents?.length || 0;

        // Get task counts and success rate
        const { data: tasks } = await supabase
          .from('agent_interactions')
          .select('status, metadata');

        const taskCounts = {
          pending: tasks?.filter(t => t.status === 'pending').length || 0,
          inProgress: tasks?.filter(t => t.status === 'in_progress').length || 0,
          completed: tasks?.filter(t => t.status === 'completed').length || 0
        };

        const totalTasks = tasks?.length || 0;
        const successRate = totalTasks > 0
          ? (taskCounts.completed / totalTasks) * 100
          : 0;

        // Calculate system health
        const systemHealth = Math.min(100, 
          ((activeAgents / 3) * 40) + // Agent availability
          (successRate * 0.4) + // Task success
          ((1 - (taskCounts.pending / Math.max(1, totalTasks))) * 20) // Task backlog
        );

        // Get knowledge node count
        const { count: knowledgeNodes } = await supabase
          .from('raw_data')
          .select('id', { count: 'exact' });

        // Calculate performance metrics
        const performance = {
          avgResponseTime: tasks?.reduce((sum, t) => sum + (t.metadata?.responseTime || 0), 0) / totalTasks || 0,
          errorRate: tasks?.filter(t => t.status === 'failed').length / totalTasks || 0,
          resourceUtilization: activeAgents / 3 // Assuming 3 total agents
        };

        setMetrics({
          activeAgents,
          successRate: Math.round(successRate),
          systemHealth: Math.round(systemHealth),
          knowledgeNodes: knowledgeNodes || 0,
          taskCounts,
          performance
        });

      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch metrics'));
        logger.error({ error: err }, 'Failed to fetch system metrics');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();

    // Subscribe to real-time updates
    const agentsChannel = supabase.channel('agents-status')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agent_emotional_traits'
        },
        () => fetchMetrics()
      )
      .subscribe();

    const tasksChannel = supabase.channel('tasks-status')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agent_interactions'
        },
        () => fetchMetrics()
      )
      .subscribe();

    // Periodic updates for performance metrics
    const interval = setInterval(fetchMetrics, 30000);

    return () => {
      agentsChannel.unsubscribe();
      tasksChannel.unsubscribe();
      clearInterval(interval);
    };
  }, []);

  return { metrics, loading, error };
}