import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { usePerformanceOptimization } from './usePerformanceOptimization';
import { logger } from '../lib/logger';
import { Task } from '../types/task';

export const useTaskManagement = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { memoize, trackRenderTime } = usePerformanceOptimization();
  const taskCache = useRef(new Map<string, Task>());
  const updateQueue = useRef<any[]>([]);
  const updateTimeout = useRef<NodeJS.Timeout>();

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setTasks(data || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const createTask = async (newTask: Omit<Task, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([newTask])
        .select()
        .single();

      if (error) {
        throw error;
      }

      setTasks(prev => [data, ...prev]);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task');
      throw err;
    }
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setTasks(prev => prev.map(task => 
        task.id === id ? { ...task, ...data } : task
      ));
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task');
      throw err;
    }
  };

  const deleteTask = async (id: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      setTasks(prev => prev.filter(task => task.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete task');
      throw err;
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

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

        if (error) throw error;
        
        // Cache tasks
        data?.forEach(task => {
          taskCache.current.set(task.id, task);
        });
        
        setTasks(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch tasks');
        logger.error({ error: err }, 'Failed to fetch tasks');
      } finally {
        setLoading(false);
        endRenderTracking();
      }
    };

    // Subscribe to real-time updates
    const channel = supabase
      .channel('agent_interactions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agent_interactions'
        },
        (payload) => {
          // Queue updates
          updateQueue.current.push(payload);

          // Debounce updates
          if (updateTimeout.current) {
            clearTimeout(updateTimeout.current);
          }

          updateTimeout.current = setTimeout(() => {
            setTasks(prev => {
              return updateQueue.current.reduce((acc, update) => {
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
            updateQueue.current = [];
          }, 100); // Debounce 100ms
        }
      )
      .subscribe();

    fetchTasks();

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
    const pending = tasks.filter(t => t.status === 'todo').length;

    return {
      total,
      completed,
      inProgress,
      pending,
      completionRate: total ? (completed / total) * 100 : 0,
      averageProgress: tasks.reduce((sum, t) => sum + (t.progress || 0), 0) / total || 0
    };
  }, [tasks]);

  return {
    tasks,
    loading,
    error,
    createTask,
    updateTask,
    deleteTask,
    refreshTasks: fetchTasks,
    updateTaskStatus,
    assignTask,
    updateTaskPriority,
    getTaskDependencies,
    getTaskMetrics
  };
};