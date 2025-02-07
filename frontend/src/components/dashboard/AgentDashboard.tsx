import React, { useState } from 'react';
import { Brain, Activity, Zap, GitBranch, Search, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AgentCard from './AgentCard';
import AgentProgress from './AgentProgress';
import { useRealtimeMetrics } from '../../hooks/useRealtimeMetrics';

export default function AgentDashboard() {
  const { metrics, loading } = useRealtimeMetrics();
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'idle'>('all');

  const agents = [
    {
      id: 'data-analyzer',
      name: 'Data Analyzer',
      role: 'Analysis Specialist',
      status: 'working' as const,
      specializations: ['Analysis', 'Pattern Recognition', 'Data Processing'],
      performance: {
        successRate: 94,
        tasksCompleted: 156,
        avgResponseTime: '1.2s'
      },
      level: 8,
      xp: 750,
      currentTask: {
        name: 'Analyzing customer feedback',
        progress: 65,
        estimatedTime: 300,
        elapsedTime: 180
      }
    },
    {
      id: 'task-coordinator',
      name: 'Task Coordinator',
      role: 'Workflow Manager',
      status: 'idle' as const,
      specializations: ['Task Planning', 'Resource Allocation', 'Optimization'],
      performance: {
        successRate: 91,
        tasksCompleted: 89,
        avgResponseTime: '0.8s'
      },
      level: 6,
      xp: 450
    },
    {
      id: 'research-agent',
      name: 'Research Agent',
      role: 'Research Specialist',
      status: 'thinking' as const,
      specializations: ['Research', 'Analysis', 'Documentation'],
      performance: {
        successRate: 88,
        tasksCompleted: 72,
        avgResponseTime: '2.1s'
      },
      level: 5,
      xp: 320,
      currentTask: {
        name: 'Researching market trends',
        progress: 30,
        estimatedTime: 600,
        elapsedTime: 180
      }
    }
  ];

  const filteredAgents = agents.filter(agent => {
    if (filter === 'active') return agent.status === 'working' || agent.status === 'thinking';
    if (filter === 'idle') return agent.status === 'idle';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Agents</h1>
          <p className="text-gray-600">Monitor and manage your AI workforce</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search agents..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Agents</option>
            <option value="active">Active</option>
            <option value="idle">Idle</option>
          </select>
        </div>
      </div>

      {/* System Metrics */}
      <div className="grid grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Agents</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.activeAgents}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Brain className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Success Rate</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.successRate}%</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <Activity className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">System Health</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.systemHealth}%</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Zap className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Knowledge Nodes</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.knowledgeNodes}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
              <GitBranch className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Agent Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredAgents.map(agent => (
            <motion.div
              key={agent.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <AgentCard
                agent={agent}
                onClick={() => setSelectedAgent(agent.id)}
              />
              {agent.currentTask && (
                <div className="mt-4">
                  <AgentProgress
                    agentId={agent.id}
                    progress={agent.currentTask.progress}
                    status={agent.status}
                    estimatedTime={agent.currentTask.estimatedTime}
                    elapsedTime={agent.currentTask.elapsedTime}
                  />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}