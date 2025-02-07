import React, { useState, useEffect } from 'react';
import { Brain, Clock, MoreVertical, GitBranch, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { logger } from '../../lib/logger';

interface Task {
  id: string;
  content: string;
  agent_id: string;
  progress: number;
  deadline: string;
  status: 'pending' | 'in_progress' | 'completed';
  created_at: string;
  metadata: {
    priority: 'high' | 'medium' | 'low';
    dependencies?: string[];
    assignedTo?: string;
    emotional?: {
      urgency: number;
      sensitivity: number;
    };
  };
}

interface TaskListProps {
  status: 'pending' | 'in_progress' | 'completed';
}

export default function TaskList({ status }: TaskListProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const { data, error } = await supabase
          .from('agent_interactions')
          .select('*')
          .eq('status', status)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setTasks(data || []);
      } catch (err) {
        logger.error({ error: err }, 'Failed to fetch tasks');
      } finally {
        setLoading(false);
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
          table: 'agent_interactions',
          filter: `status=eq.${status}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setTasks(prev => [payload.new as Task, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setTasks(prev => prev.map(task => 
              task.id === payload.new.id ? payload.new as Task : task
            ));
          } else if (payload.eventType === 'DELETE') {
            setTasks(prev => prev.filter(task => task.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [status]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-20 bg-gray-800/30 rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400">No {status} tasks</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tasks.map(task => (
        <div key={task.id} className="bg-gray-800/50 rounded-lg p-6 border border-gray-700/50 hover:border-blue-500/50 transition-all">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-medium text-white mb-2">{task.content}</h4>
              {/* Show actual task progress */}
              {task.steps && (
                <div className="space-y-2 mt-4">
                  <h5 className="text-sm font-medium text-gray-300">Progress:</h5>
                  {task.steps.map((step, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center
                        ${step.completed ? 'bg-green-500' : 'bg-gray-700'}`}>
                        {step.completed && <CheckCircle2 className="w-3 h-3 text-white" />}
                      </div>
                      <span className={step.completed ? 'text-gray-300' : 'text-gray-500'}>
                        {step.description}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Show agent's analysis */}
              {task.analysis && (
                <div className="mt-4 p-4 bg-gray-900/50 rounded-lg">
                  <h5 className="text-sm font-medium text-gray-300 mb-2">Analysis:</h5>
                  <p className="text-sm text-gray-400">{task.analysis}</p>
                </div>
              )}
              <div className="space-y-2 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>Waiting since: {new Date(task.created_at).toLocaleString()}</span>
                </div>
                {task.metadata?.dependencies?.length > 0 && (
                  <div className="flex items-center gap-2">
                    <GitBranch className="w-4 h-4" />
                    <span>Waiting for {task.metadata.dependencies.length} dependencies</span>
                  </div>
                )}
                {task.metadata?.assignedTo && (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>Assigned to: {task.metadata.assignedTo}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Progress Bar */}
              <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-full transition-all duration-500 group-hover:from-blue-500 group-hover:to-purple-500"
                  style={{ width: `${task.progress}%` }}
                />
              </div>
              <button className="p-1 hover:bg-gray-700 rounded transition-colors">
                <MoreVertical className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}