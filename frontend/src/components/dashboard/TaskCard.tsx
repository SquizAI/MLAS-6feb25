import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Clock, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';

interface TaskCardProps {
  task: {
    id: string;
    title: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    priority: 'low' | 'medium' | 'high';
    progress: number;
    agent_id?: string;
    deadline?: string;
    metadata: {
      emotionalContext?: {
        urgency: number;
        sensitivity: number;
      };
    };
  };
  onStatusChange: (status: string) => void;
  onAgentAssign: (agentId: string) => void;
}

export default function TaskCard({ task, onStatusChange, onAgentAssign }: TaskCardProps) {
  const getPriorityColor = () => {
    switch (task.priority) {
      case 'high': return 'bg-red-100 text-red-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'low': return 'bg-green-100 text-green-700';
    }
  };

  const getStatusColor = () => {
    switch (task.status) {
      case 'pending': return 'bg-gray-100 text-gray-700';
      case 'in_progress': return 'bg-blue-100 text-blue-700';
      case 'completed': return 'bg-green-100 text-green-700';
      case 'failed': return 'bg-red-100 text-red-700';
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:border-blue-500 transition-all"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          <div className={`w-2 h-2 mt-2 rounded-full ${getPriorityColor()}`} />
          <div>
            <h3 className="font-medium text-gray-900">{task.title}</h3>
            {task.agent_id && (
              <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                <Brain className="w-4 h-4" />
                <span>{task.agent_id}</span>
              </div>
            )}
          </div>
        </div>
        <div className={`px-2 py-1 rounded-full text-xs ${getStatusColor()}`}>
          {task.status}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Progress</span>
          <span className="font-medium">{Math.round(task.progress)}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-blue-500"
            initial={{ width: 0 }}
            animate={{ width: `${task.progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Metadata */}
      <div className="flex items-center gap-4 text-sm text-gray-500">
        {task.deadline && (
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{new Date(task.deadline).toLocaleDateString()}</span>
          </div>
        )}
        {task.metadata.emotionalContext?.urgency > 0.7 && (
          <div className="flex items-center gap-1 text-amber-600">
            <AlertTriangle className="w-4 h-4" />
            <span>High Urgency</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-4 flex items-center justify-between">
        <select
          value={task.status}
          onChange={(e) => onStatusChange(e.target.value)}
          className="px-3 py-1 bg-gray-100 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
        >
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>

        {!task.agent_id && (
          <button
            onClick={() => onAgentAssign('data-analyzer')}
            className="flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-sm hover:bg-blue-100"
          >
            <Brain className="w-4 h-4" />
            Assign Agent
          </button>
        )}
      </div>
    </motion.div>
  );
}