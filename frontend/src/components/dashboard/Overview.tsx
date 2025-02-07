import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Brain, 
  Plus,
  MessageCircle,
  FileText,
  Loader2,
  ArrowRight,
  CheckCircle,
  Clock,
  AlertCircle,
  CheckCircle2,
  Zap,
  GitBranch
} from 'lucide-react';
import TaskList from './TaskList';
import DataInput from './DataInput';
import AgentChat from './AgentChat';
import DriveView from './DriveView';
import KnowledgePreview from './KnowledgePreview';
import { useRealtimeMetrics } from '../../hooks/useRealtimeMetrics';
import { useRealtimeUpdates } from '../../hooks/useRealtimeUpdates';
import { useAdaptiveLayout } from '../../hooks/useAdaptiveLayout';
import { usePerformanceOptimization } from '../../hooks/usePerformanceOptimization';
import MetricsCard from './MetricsCard';
import FeatureContainer from '../features/FeatureContainer';

export default function Overview() {
  const navigate = useNavigate();
  const [showDataInput, setShowDataInput] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showDrive, setShowDrive] = useState(false);
  const { metrics, loading } = useRealtimeMetrics();
  const { layout, setSystemStress, setUrgentTaskCount } = useAdaptiveLayout();
  const { trackRenderTime, getMetrics } = usePerformanceOptimization();

  // Track render performance
  const endRenderTracking = trackRenderTime();

  // Real-time updates for tasks
  const { data: tasks } = useRealtimeUpdates({
    tables: ['agent_interactions'],
    filter: "status=eq.pending",
  });

  useEffect(() => {
    // Update system stress based on task count and urgency
    const urgentTasks = tasks?.filter(t => t.metadata?.urgency > 0.8);
    setUrgentTaskCount(urgentTasks?.length || 0);
    setSystemStress(Math.min((tasks?.length || 0) / 20, 1));

    endRenderTracking();
  }, [tasks, setUrgentTaskCount, setSystemStress, endRenderTracking]);

  return (
    <div className={`min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 p-6 relative ${
      layout === 'compact' ? 'space-y-4' : 'space-y-8'
    }`}>
      {/* Global Stats Bar */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-4 mb-8">
        <div className={`grid ${
          layout === 'compact' 
            ? 'grid-cols-2 gap-4' 
            : 'grid-cols-2 md:grid-cols-4 gap-6'
        }`}>
          <MetricsCard
            title="Active Agents"
            value={metrics.activeAgents}
            icon="agents"
            loading={loading}
          />
          
          <MetricsCard
            title="Success Rate"
            value={`${metrics.successRate}%`}
            icon="success"
            loading={loading}
            trend={{
              value: 2.1,
              label: "from last week"
            }}
          />
          
          <MetricsCard
            title="System Health"
            value={`${metrics.systemHealth}%`}
            icon="health"
            loading={loading}
          />
          
          <MetricsCard
            title="Knowledge Nodes"
            value={metrics.knowledgeNodes.toLocaleString()}
            icon="nodes"
            loading={loading}
          />
        </div>
        
        {/* Performance Indicators */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="bg-gray-700/30 rounded-lg p-3">
            <p className="text-sm text-gray-400 mb-1">Avg Response Time</p>
            <p className="text-lg font-medium text-white">
              {loading ? '...' : `${Math.round(metrics.performance.avgResponseTime)}ms`}
            </p>
          </div>
          <div className="bg-gray-700/30 rounded-lg p-3">
            <p className="text-sm text-gray-400 mb-1">Error Rate</p>
            <p className="text-lg font-medium text-white">
              {loading ? '...' : `${(metrics.performance.errorRate * 100).toFixed(1)}%`}
            </p>
          </div>
          <div className="bg-gray-700/30 rounded-lg p-3">
            <p className="text-sm text-gray-400 mb-1">Resource Usage</p>
            <p className="text-lg font-medium text-white">
              {loading ? '...' : `${(metrics.performance.resourceUtilization * 100).toFixed(1)}%`}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome back!</h1>
          <p className="text-gray-400">Your AI team is actively processing tasks</p>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowDrive(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800/80 text-white rounded-lg hover:bg-gray-700 transition-all transform hover:scale-105 border border-gray-700/50"
          >
            <FileText className="w-5 h-5" />
            Documents
          </button>
          <button
            onClick={() => setShowChat(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-500 hover:to-purple-600 transition-all transform hover:scale-105 shadow-lg shadow-purple-600/20"
          >
            <MessageCircle className="w-5 h-5" />
            Chat
          </button>
          <button 
            onClick={() => setShowDataInput(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-500 hover:to-blue-600 transition-all transform hover:scale-105 shadow-lg shadow-blue-600/20"
          >
            <Plus className="w-5 h-5" />
            Add Data
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Task Management */}
        <div className="lg:col-span-2 space-y-8">
          {/* Feature Previews */}
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
              <h3 className="text-lg font-semibold text-white mb-4">Schedule</h3>
              <FeatureContainer type="schedule" />
            </div>
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
              <h3 className="text-lg font-semibold text-white mb-4">Meal Planning</h3>
              <FeatureContainer type="meals" />
            </div>
          </div>

          {/* Task Filters */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-4">
            <div className="flex items-center gap-4">
              <button className="px-4 py-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition-colors">
                All Tasks
              </button>
              <button className="px-4 py-2 text-gray-400 rounded-lg hover:bg-gray-700/50 transition-colors">
                High Priority
              </button>
              <button className="px-4 py-2 text-gray-400 rounded-lg hover:bg-gray-700/50 transition-colors">
                Due Soon
              </button>
              <button className="px-4 py-2 text-gray-400 rounded-lg hover:bg-gray-700/50 transition-colors">
                Emotional
              </button>
            </div>
          </div>

          {/* Pending Tasks */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-600/5 to-red-600/5"></div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-400" />
                <h2 className="text-lg font-semibold text-white">Pending</h2>
              </div>
              <span className="px-2 py-1 bg-yellow-400/10 text-yellow-400 rounded-lg text-sm">
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  `${metrics.taskCounts.pending} tasks`
                )}
              </span>
            </div>
            <TaskList status="pending" />
          </div>

          {/* In Progress Tasks */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-purple-600/5"></div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-blue-400" />
                <h2 className="text-lg font-semibold text-white">In Progress</h2>
              </div>
              <span className="px-2 py-1 bg-blue-400/10 text-blue-400 rounded-lg text-sm">
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  `${metrics.taskCounts.inProgress} tasks`
                )}
              </span>
            </div>
            <TaskList status="in_progress" />
          </div>

          {/* Completed Tasks */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-green-600/5 to-emerald-600/5"></div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                <h2 className="text-lg font-semibold text-white">Completed</h2>
              </div>
              <span className="px-2 py-1 bg-green-400/10 text-green-400 rounded-lg text-sm">
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  `${metrics.taskCounts.completed} tasks`
                )}
              </span>
            </div>
            <TaskList status="completed" />
          </div>
        </div>

        {/* Right Column - Agent Status & Knowledge Graph */}
        <div className="space-y-8">
          {/* Agent Performance */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">Top Agents</h2>
              <button className="text-sm text-blue-400 hover:text-blue-300">View All</button>
            </div>
            
            <div className="space-y-6">
              {['Data Analyzer', 'Task Coordinator', 'Research Agent'].map((agent, index) => (
                <div key={agent} className="relative">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center">
                      <Brain className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-white">{agent}</h3>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-green-400">Level 8</span>
                        <span className="text-gray-500">•</span>
                        <span className="text-gray-400">95% Success</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="ml-12">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-400">XP Progress</span>
                      <span className="text-blue-400">2,450 / 3,000</span>
                    </div>
                    <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                        style={{ width: '75%' }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Knowledge Graph Preview */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">Knowledge Network</h2>
              <button 
                onClick={() => navigate('/dashboard/knowledge')}
                className="text-sm text-blue-400 hover:text-blue-300"
              >
                Explore
              </button>
            </div>
            <KnowledgePreview />
          </div>
        </div>
      </div>

      {/* Modals */}
      {showDataInput && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-2xl">
            <DataInput 
              onClose={() => setShowDataInput(false)}
              onDataSubmit={() => {
                setShowDataInput(false);
                // Refresh tasks
              }}
            />
          </div>
        </div>
      )}

      {showChat && <AgentChat onClose={() => setShowChat(false)} />}

      {showDrive && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-6xl bg-white rounded-lg shadow-xl">
            <DriveView />
          </div>
        </div>
      )}
    </div>
  );
}