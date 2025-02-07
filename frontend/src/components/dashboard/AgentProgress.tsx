import React from 'react';
import { Brain, Clock, CheckCircle2, XCircle } from 'lucide-react';

interface AgentProgressProps {
  agentId: string;
  progress: number;
  status: 'idle' | 'thinking' | 'working' | 'complete' | 'error';
  estimatedTime?: number;
  elapsedTime?: number;
}

export default function AgentProgress({ 
  agentId, 
  progress, 
  status,
  estimatedTime,
  elapsedTime
}: AgentProgressProps) {
  const getStatusIcon = () => {
    switch (status) {
      case 'idle':
        return <Brain className="w-5 h-5 text-gray-400" />;
      case 'thinking':
        return <Brain className="w-5 h-5 text-yellow-400 animate-pulse" />;
      case 'working':
        return <Clock className="w-5 h-5 text-blue-400 animate-spin" />;
      case 'complete':
        return <CheckCircle2 className="w-5 h-5 text-green-400" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-400" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'idle': return 'bg-gray-100';
      case 'thinking': return 'bg-yellow-100';
      case 'working': return 'bg-blue-100';
      case 'complete': return 'bg-green-100';
      case 'error': return 'bg-red-100';
    }
  };

  const getTimeRemaining = () => {
    if (!estimatedTime || !elapsedTime) return null;
    const remaining = Math.max(0, estimatedTime - elapsedTime);
    return `${Math.round(remaining / 60)}m ${remaining % 60}s remaining`;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg ${getStatusColor()} flex items-center justify-center`}>
            {getStatusIcon()}
          </div>
          <div>
            <h3 className="font-medium text-gray-900">Agent {agentId}</h3>
            <p className="text-sm text-gray-500 capitalize">{status}</p>
          </div>
        </div>
        {getTimeRemaining() && (
          <div className="text-sm text-gray-500">
            {getTimeRemaining()}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Progress</span>
          <span className="font-medium">{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ${
              status === 'complete' 
                ? 'bg-green-500'
                : 'bg-blue-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}