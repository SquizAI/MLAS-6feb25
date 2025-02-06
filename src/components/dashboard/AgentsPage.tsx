import React, { useState } from 'react';
import { Plus, Search, Filter, Brain, Activity, Zap, CheckCircle2, XCircle } from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  role: string;
  status: 'online' | 'busy' | 'offline';
  skills: string[];
  performance: {
    tasksCompleted: number;
    successRate: number;
    averageResponseTime: string;
  };
  xp: number;
  level: number;
}

export default function AgentsPage() {
  const [agents] = useState<Agent[]>([
    {
      id: '1',
      name: 'Data Analyzer',
      role: 'Analysis Specialist',
      status: 'online',
      skills: ['Data Analysis', 'Pattern Recognition', 'Report Generation'],
      performance: {
        tasksCompleted: 156,
        successRate: 0.94,
        averageResponseTime: '1.2s'
      },
      xp: 2450,
      level: 12
    },
    {
      id: '2',
      name: 'Email Assistant',
      role: 'Communication Manager',
      status: 'busy',
      skills: ['Email Processing', 'Natural Language', 'Template Management'],
      performance: {
        tasksCompleted: 342,
        successRate: 0.96,
        averageResponseTime: '0.8s'
      },
      xp: 3200,
      level: 15
    },
    {
      id: '3',
      name: 'Task Coordinator',
      role: 'Workflow Manager',
      status: 'online',
      skills: ['Task Planning', 'Resource Allocation', 'Priority Management'],
      performance: {
        tasksCompleted: 89,
        successRate: 0.91,
        averageResponseTime: '1.5s'
      },
      xp: 1850,
      level: 9
    }
  ]);

  const createAgent = async (formData: any) => {
    try {
      // Initialize agent with OpenAI
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `Initialize a new AI agent with the following configuration:
                     Type: ${formData.type}
                     Specializations: ${formData.specializations.join(", ")}
                     Create a personality and working style optimized for these tasks.`
          }
        ]
      });

      // Create agent record
      const { data, error } = await supabase
        .from('agent_emotional_traits')
        .insert({
          agent_id: formData.id,
          empathy: formData.type === 'communication' ? 0.9 : 0.7,
          patience: formData.type === 'research' ? 0.9 : 0.7,
          assertiveness: formData.type === 'coordinator' ? 0.8 : 0.6,
          adaptability: 0.8,
          status: 'idle'
        })
        .select()
        .single();

      if (error) throw error;
      
      // Update UI
      setAgents(prev => [...prev, data]);
      
    } catch (error) {
      logger.error({ error }, 'Failed to create agent');
      throw error;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Agents</h1>
          <p className="text-gray-600">Manage and monitor your AI workforce</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="w-5 h-5" />
          New Agent
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Agents</p>
              <p className="text-2xl font-bold text-gray-900">12</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Brain className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Now</p>
              <p className="text-2xl font-bold text-gray-900">8</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <Activity className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Success Rate</p>
              <p className="text-2xl font-bold text-gray-900">94%</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total XP</p>
              <p className="text-2xl font-bold text-gray-900">24.5K</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
              <Zap className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search agents..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
          <Filter className="w-5 h-5" />
          Filters
        </button>
      </div>

      {/* Agents Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {agents.map(agent => (
          <div key={agent.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Brain className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{agent.name}</h3>
                  <p className="text-sm text-gray-600">{agent.role}</p>
                </div>
              </div>
              <div className={`
                flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium
                ${agent.status === 'online' ? 'bg-green-100 text-green-700' :
                  agent.status === 'busy' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-700'}
              `}>
                <span className={`
                  w-2 h-2 rounded-full
                  ${agent.status === 'online' ? 'bg-green-600' :
                    agent.status === 'busy' ? 'bg-yellow-600' :
                    'bg-gray-600'}
                `} />
                {agent.status.charAt(0).toUpperCase() + agent.status.slice(1)}
              </div>
            </div>

            {/* Skills */}
            <div className="mb-4">
              <div className="flex flex-wrap gap-2">
                {agent.skills.map(skill => (
                  <span key={skill} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">Tasks</p>
                <p className="text-lg font-semibold text-gray-900">{agent.performance.tasksCompleted}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Success Rate</p>
                <p className="text-lg font-semibold text-gray-900">
                  {(agent.performance.successRate * 100).toFixed(0)}%
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Avg Response</p>
                <p className="text-lg font-semibold text-gray-900">{agent.performance.averageResponseTime}</p>
              </div>
            </div>

            {/* XP Progress */}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm font-medium">Level {agent.level}</span>
                </div>
                <span className="text-sm text-gray-600">{agent.xp} XP</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full">
                <div 
                  className="h-full bg-yellow-500 rounded-full"
                  style={{ width: `${(agent.xp % 1000) / 10}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}