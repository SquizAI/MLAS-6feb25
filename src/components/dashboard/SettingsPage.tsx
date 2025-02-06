import React from 'react';
import { Save, Bell, Lock, Brain, Zap, Globe, Mail } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your preferences and system configuration</p>
      </div>

      {/* Settings Sections */}
      <div className="space-y-6">
        {/* General Settings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">General Settings</h2>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  System Name
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="My AI System"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time Zone
                </label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option>UTC-8 (Pacific Time)</option>
                  <option>UTC-5 (Eastern Time)</option>
                  <option>UTC+0 (GMT)</option>
                  <option>UTC+1 (Central European Time)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Language
              </label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option>English (US)</option>
                <option>Spanish</option>
                <option>French</option>
                <option>German</option>
              </select>
            </div>
          </div>
        </div>

        {/* AI Configuration */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">AI Configuration</h2>
          
          <div className="space-y-6">
            <div>
              <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-2">
                <span>Agent Autonomy Level</span>
                <span className="text-blue-600">75%</span>
              </label>
              <input
                type="range"
                min="0"
                max="100"
                defaultValue="75"
                className="w-full"
              />
              <p className="mt-1 text-sm text-gray-500">
                Higher autonomy allows agents to make more decisions independently
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Learning Rate
                </label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option>Aggressive</option>
                  <option>Balanced</option>
                  <option>Conservative</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Response Style
                </label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option>Concise</option>
                  <option>Balanced</option>
                  <option>Detailed</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Notifications</h2>
          
          <div className="space-y-4">
            <label className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-gray-400" />
                <span className="text-gray-700">Task Completion Alerts</span>
              </div>
              <input type="checkbox" className="rounded text-blue-600 focus:ring-blue-500" />
            </label>
            
            <label className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-gray-400" />
                <span className="text-gray-700">Performance Updates</span>
              </div>
              <input type="checkbox" className="rounded text-blue-600 focus:ring-blue-500" />
            </label>
            
            <label className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Brain className="w-5 h-5 text-gray-400" />
                <span className="text-gray-700">Agent Status Changes</span>
              </div>
              <input type="checkbox" className="rounded text-blue-600 focus:ring-blue-500" />
            </label>
            
            <label className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <span className="text-gray-700">Email Notifications</span>
              </div>
              <input type="checkbox" className="rounded text-blue-600 focus:ring-blue-500" />
            </label>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Save className="w-5 h-5" />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}