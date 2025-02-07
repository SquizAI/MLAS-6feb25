import React, { useState } from 'react';
import { Plus, Search, Filter, CheckCircle2, Clock, BarChart2 } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  dueDate: Date;
  progress: number;
  assignedTo: string;
}

export default function TasksPage() {
  const [tasks] = useState<Task[]>([
    {
      id: '1',
      title: 'Analyze Customer Feedback',
      description: 'Process and categorize recent customer feedback for insights.',
      status: 'in_progress',
      priority: 'high',
      dueDate: new Date('2024-02-01'),
      progress: 65,
      assignedTo: 'Data Analyzer'
    },
    {
      id: '2',
      title: 'Generate Weekly Report',
      description: 'Create comprehensive report of system performance and insights.',
      status: 'pending',
      priority: 'medium',
      dueDate: new Date('2024-02-03'),
      progress: 0,
      assignedTo: 'Report Generator'
    },
    {
      id: '3',
      title: 'Optimize Email Responses',
      description: 'Fine-tune email response templates based on recent feedback.',
      status: 'completed',
      priority: 'high',
      dueDate: new Date('2024-01-30'),
      progress: 100,
      assignedTo: 'Email Assistant'
    }
  ]);

  return (
    <div className="space-y-6">
      {/* Task Categories */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-blue-500/10 backdrop-blur-sm rounded-xl p-6 border border-blue-500/20">
          <h3 className="text-lg font-semibold text-white mb-4">Analysis Tasks</h3>
          <p className="text-gray-400">Data processing and insight generation tasks</p>
        </div>
        <div className="bg-purple-500/10 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20">
          <h3 className="text-lg font-semibold text-white mb-4">Communication Tasks</h3>
          <p className="text-gray-400">Email responses and message handling</p>
        </div>
        <div className="bg-green-500/10 backdrop-blur-sm rounded-xl p-6 border border-green-500/20">
          <h3 className="text-lg font-semibold text-white mb-4">Research Tasks</h3>
          <p className="text-gray-400">Information gathering and synthesis</p>
        </div>
        <div className="bg-pink-500/10 backdrop-blur-sm rounded-xl p-6 border border-pink-500/20">
          <h3 className="text-lg font-semibold text-white mb-4">Learning Tasks</h3>
          <p className="text-gray-400">Model training and skill improvement</p>
        </div>
      </div>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-600">Track and manage AI agent tasks</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="w-5 h-5" />
          New Task
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Tasks</p>
              <p className="text-2xl font-bold text-gray-900">12</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed Today</p>
              <p className="text-2xl font-bold text-gray-900">8</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Success Rate</p>
              <p className="text-2xl font-bold text-gray-900">94%</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <BarChart2 className="w-6 h-6 text-purple-600" />
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
            placeholder="Search tasks..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
          <Filter className="w-5 h-5" />
          Filters
        </button>
      </div>

      {/* Tasks List */}
      <div className="space-y-4">
        {tasks.map(task => (
          <div key={task.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
                  <span className={`
                    px-2 py-1 text-xs font-medium rounded-full
                    ${task.priority === 'high' ? 'bg-red-100 text-red-700' :
                      task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'}
                  `}>
                    {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                  </span>
                  <span className={`
                    px-2 py-1 text-xs font-medium rounded-full
                    ${task.status === 'pending' ? 'bg-gray-100 text-gray-700' :
                      task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                      'bg-green-100 text-green-700'}
                  `}>
                    {task.status.split('_').map(word => 
                      word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ')}
                  </span>
                </div>
                
                <p className="text-gray-600 mb-4">{task.description}</p>
                
                <div className="flex items-center gap-6 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>Due {task.dueDate.toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-xs font-medium text-blue-600">AI</span>
                    </div>
                    <span>{task.assignedTo}</span>
                  </div>
                </div>
              </div>

              <div className="w-32">
                <div className="text-right text-sm font-medium text-gray-900 mb-1">
                  {task.progress}%
                </div>
                <div className="h-2 bg-gray-200 rounded-full">
                  <div 
                    className="h-full bg-blue-600 rounded-full transition-all duration-500"
                    style={{ width: `${task.progress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}