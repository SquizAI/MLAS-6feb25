import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { BarChart2, TrendingUp, Users, Brain, Clock, CheckCircle2 } from 'lucide-react';

const taskData = [
  { date: '2024-01-24', completed: 45, failed: 3 },
  { date: '2024-01-25', completed: 52, failed: 2 },
  { date: '2024-01-26', completed: 48, failed: 1 },
  { date: '2024-01-27', completed: 61, failed: 4 },
  { date: '2024-01-28', completed: 55, failed: 2 },
  { date: '2024-01-29', completed: 67, failed: 3 },
  { date: '2024-01-30', completed: 63, failed: 2 },
];

const performanceData = [
  { time: '00:00', efficiency: 92, tasks: 15 },
  { time: '04:00', efficiency: 88, tasks: 12 },
  { time: '08:00', efficiency: 95, tasks: 28 },
  { time: '12:00', efficiency: 97, tasks: 32 },
  { time: '16:00', efficiency: 94, tasks: 25 },
  { time: '20:00', efficiency: 91, tasks: 18 },
];

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600">Monitor system performance and trends</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Success Rate</p>
              <p className="text-2xl font-bold text-gray-900">94.8%</p>
              <p className="text-sm text-green-600">↑ 2.1% from last week</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
              <p className="text-2xl font-bold text-gray-900">1.2s</p>
              <p className="text-green-600 text-sm">↓ 0.3s from last week</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Agents</p>
              <p className="text-2xl font-bold text-gray-900">18</p>
              <p className="text-green-600 text-sm">↑ 3 from last week</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Brain className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Completion Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Task Completion</h2>
              <p className="text-sm text-gray-600">Last 7 days</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <BarChart2 className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={taskData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="completed" fill="#3B82F6" name="Completed" />
                <Bar dataKey="failed" fill="#EF4444" name="Failed" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Performance Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">System Performance</h2>
              <p className="text-sm text-gray-600">24-hour view</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
          
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="efficiency" 
                  stroke="#3B82F6" 
                  name="Efficiency %"
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="tasks" 
                  stroke="#10B981" 
                  name="Tasks"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}