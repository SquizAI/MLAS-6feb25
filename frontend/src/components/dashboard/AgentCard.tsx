import React from 'react';
import { Brain, Star, Activity, Zap, Shield, GitBranch, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';

interface AgentCardProps {
  agent: {
    id: string;
    name: string;
    role: string;
    status: 'idle' | 'thinking' | 'working' | 'complete';
    specializations: string[];
    performance: {
      successRate: number;
      tasksCompleted: number;
      avgResponseTime: string;
    };
    level: number;
    xp: number;
  };
  onClick?: () => void;
  onChat?: (agent: any) => void;
}

export default function AgentCard({ agent, onClick, onChat }: AgentCardProps) {
  const getStatusColor = () => {
    switch (agent.status) {
      case 'idle': return 'bg-gray-100 text-gray-600';
      case 'thinking': return 'bg-yellow-100 text-yellow-600';
      case 'working': return 'bg-blue-100 text-blue-600';
      case 'complete': return 'bg-green-100 text-green-600';
    }
  };

  const getSpecializationIcon = (specialization: string) => {
    switch (specialization.toLowerCase()) {
      case 'analysis': return Brain;
      case 'research': return GitBranch;
      case 'communication': return Activity;
      case 'security': return Shield;
      default: return Star;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:border-blue-500 transition-all group cursor-pointer"
      onClick={onClick}
    >
      {/* Quick Actions */}
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onChat?.(agent);
          }}
          className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
          title="Chat with agent"
        >
          <MessageSquare className="w-5 h-5" />
        </button>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
            <Brain className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{agent.name}</h3>
            <p className="text-sm text-gray-500">{agent.role}</p>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm ${getStatusColor()}`}>
          {agent.status}
        </div>
      </div>

      {/* Specializations */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Specializations</h4>
        <div className="flex flex-wrap gap-2">
          {agent.specializations.map((spec, index) => {
            const Icon = getSpecializationIcon(spec);
            return (
              <div
                key={index}
                className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-700"
              >
                <Icon className="w-3 h-3" />
                {spec}
              </div>
            );
          })}
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className="text-sm text-gray-500">Success Rate</div>
          <div className="font-semibold text-gray-900">{agent.performance.successRate}%</div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-500">Tasks</div>
          <div className="font-semibold text-gray-900">{agent.performance.tasksCompleted}</div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-500">Avg Response</div>
          <div className="font-semibold text-gray-900">{agent.performance.avgResponseTime}</div>
        </div>
      </div>

      {/* XP Progress */}
      <div>
        <div className="flex items-center justify-between text-sm mb-1">
          <div className="flex items-center gap-1 text-gray-600">
            <Zap className="w-4 h-4" />
            <span>Level {agent.level}</span>
          </div>
          <span className="text-gray-500">{agent.xp} / 1000 XP</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
            initial={{ width: 0 }}
            animate={{ width: `${(agent.xp % 1000) / 10}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>
    </motion.div>
  );
}