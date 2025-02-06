import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { usePerformanceOptimization } from './usePerformanceOptimization';
import { logger } from '../lib/logger';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  priority: 'low' | 'medium' | 'high';
  progress: number;
  agent_id?: string;
  deadline?: string;
  dependencies?: string[];
  metadata: {
    emotionalContext?: {
      urgency: number;
      sensitivity: number;
    };
    xp?: number;
    complexity?: number;
  };
}

export function useTaskManagement() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { memoize, trackRenderTime } = usePerformanceOptimization();
  const taskCache = useRef(new Map<string, Task>());
  const updateQueue = useRef<any[]>([]);
  const updateTimeout = useRef<NodeJS.Timeout>();

  // Load tasks with real-time updates
  useEffect(() => {
    const endRenderTracking = trackRenderTime();

    const fetchTasks = async () => {
      try {
        const { data, error } = await supabase
          .from('agent_interactions')
          .select(`
            *,
            agent:agent_id (
              empathy,
              patience,
              assertiveness,
              adaptability,
              status
            )
          `)
          .order('created_at', { ascending: false })
          .limit(50); // Initial load limit
          .order('created_at', { ascending: false });

        if (error) throw error;
        // Cache tasks
        data?.forEach(task => {
          taskCache.current.set(task.id, task);
        });
        setTasks(data || []);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch tasks'));
        logger.error({ error: err }, 'Failed to fetch tasks');
      } finally {
        setLoading(false);
        endRenderTracking();
      }
    };

    fetchTasks();

    // Subscribe to real-time updates
    const channel = supabase.channel('task-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agent_interactions'
        },
        (payload) => {
          // Queue update
          updateQueue.current.push(payload);
          
          // Debounce processing
          if (updateTimeout.current) {
            clearTimeout(updateTimeout.current);
          }
          
          updateTimeout.current = setTimeout(() => {
            setTasks(prev => {
              const updates = updateQueue.current;
              updateQueue.current = [];

              return updates.reduce((acc, update) => {
                switch (update.eventType) {
                  case 'INSERT':
                    taskCache.current.set(update.new.id, update.new);
                    return [update.new, ...acc];
                  case 'UPDATE':
                    taskCache.current.set(update.new.id, update.new);
                    return acc.map(task => 
                      task.id === update.new.id ? update.new : task
                    );
                  case 'DELETE':
                    taskCache.current.delete(update.old.id);
                    return acc.filter(task => task.id !== update.old.id);
                  default:
                    return acc;
                }
              }, prev);
            });
          }, 100); // Debounce 100ms
        }
      )
      .subscribe();

    return () => {
      if (updateTimeout.current) {
        clearTimeout(updateTimeout.current);
      }
      channel.unsubscribe();
    };
  }, []);

  // Update task status
  const updateTaskStatus = async (
    taskId: string,
    status: Task['status'],
    progress: number
  ) => {
    try {
      const { error } = await supabase
        .from('agent_interactions')
        .update({
          status,
          progress,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId);

      if (error) throw error;
      logger.info({ taskId, status, progress }, 'Task status updated');
    } catch (err) {
      logger.error({ error: err }, 'Failed to update task status');
      throw err;
    }
  };

  // Assign task to agent
  const assignTask = async (taskId: string, agentId: string) => {
    try {
      const { error } = await supabase
        .from('agent_interactions')
        .update({
          agent_id: agentId,
          status: 'in_progress',
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId);

      if (error) throw error;
      logger.info({ taskId, agentId }, 'Task assigned to agent');
    } catch (err) {
      logger.error({ error: err }, 'Failed to assign task');
      throw err;
    }
  };

  // Update task priority
  const updateTaskPriority = async (taskId: string, priority: Task['priority']) => {
    try {
      const { error } = await supabase
        .from('agent_interactions')
        .update({
          metadata: {
            priority
          }
        })
        .eq('id', taskId);

      if (error) throw error;
      logger.info({ taskId, priority }, 'Task priority updated');
    } catch (err) {
      logger.error({ error: err }, 'Failed to update task priority');
      throw err;
    }
  };

  // Get task dependencies
  const getTaskDependencies = useCallback((taskId: string) => {
    return tasks
      .filter(task => task.dependencies?.includes(taskId))
      .map(task => ({
        id: task.id,
        title: task.title,
        status: task.status
      }));
  }, [tasks]);

  // Calculate task metrics
  const getTaskMetrics = useCallback(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const inProgress = tasks.filter(t => t.status === 'in_progress').length;
    const pending = tasks.filter(t => t.status === 'pending').length;

    return {
      total,
      completed,
      inProgress,
      pending,
      completionRate: total ? (completed / total) * 100 : 0,
      averageProgress: tasks.reduce((sum, t) => sum + t.progress, 0) / total || 0
    };
  }, [tasks]);

  return {
    tasks,
    loading,
    error,
    updateTaskStatus,
    assignTask,
    updateTaskPriority,
    getTaskDependencies,
    getTaskMetrics
  };
}