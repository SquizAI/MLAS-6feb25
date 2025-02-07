import React, { useState } from 'react';
import { Plus, Search, Filter, Brain, MessageSquare, Calendar, Loader, MessageCircle, FileText } from 'lucide-react';
import DataInput from './DataInput';
import AgentChat from './AgentChat';
import DriveView from './DriveView';
import { useDataCapture } from '../../hooks/useDataCapture';

interface Idea {
  id: string;
  title: string;
  description: string;
  status: 'new' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  assignedTo?: string;
}

export default function IdeasPage() {
  const [ideas] = useState<Idea[]>([
    {
      id: '1',
      title: 'Automated Email Response System',
      description: 'Create an AI system that can automatically draft and send email responses based on content analysis.',
      status: 'in_progress',
      priority: 'high',
      createdAt: new Date('2024-01-15'),
      assignedTo: 'Email Assistant'
    },
    {
      id: '2',
      title: 'Meeting Summary Generator',
      description: 'Develop a tool that can generate concise meeting summaries from recorded conversations.',
      status: 'new',
      priority: 'medium',
      createdAt: new Date('2024-01-20')
    },
    {
      id: '3',
      title: 'Task Prioritization Algorithm',
      description: 'Implement an intelligent algorithm for automatically prioritizing daily tasks.',
      status: 'completed',
      priority: 'high',
      createdAt: new Date('2024-01-10'),
      assignedTo: 'Task Manager'
    }
  ]);
  const { captureData, loading } = useDataCapture();
  const [showDataInput, setShowDataInput] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showDrive, setShowDrive] = useState(false);
  const [researchMode, setResearchMode] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Ideas</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowDrive(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            title="Access your research documents"
          >
            <FileText className="w-5 h-5" />
            My Documents
          </button>
          <button
            onClick={() => setShowChat(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            title="Discuss ideas with AI agents"
          >
            <MessageCircle className="w-5 h-5" />
            Chat with Agents
          </button>
          <button
            onClick={() => setResearchMode(!researchMode)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              researchMode 
                ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            title="Toggle research mode for in-depth analysis"
          >
            <Brain className="w-5 h-5" />
            Research Mode
          </button>
          <button 
            onClick={() => setShowDataInput(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            title="Add new data or research"
          >
            <Plus className="w-5 h-5" />
            Add Data
          </button>
        </div>
      </div>

      {/* Research Mode Info */}
      {researchMode && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Brain className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-yellow-800">Research Mode Active</h3>
              <p className="text-sm text-yellow-700 mt-1">
                Documents will be analyzed in-depth with:
                <span className="block mt-2 ml-4">
                  • Automatic topic detection and categorization
                  <br />
                  • Entity extraction and relationship mapping
                  <br />
                  • Cross-reference with existing knowledge
                  <br />
                  • AI-powered summaries and insights
                </span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Data Input Modal */}
      {showDataInput && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-2xl">
            <DataInput 
              onDataSubmit={async (data) => {
                await captureData({
                  ...data,
                  metadata: {
                    ...data.metadata,
                    researchMode,
                    analysisRequired: researchMode,
                    analysisType: researchMode ? 'comprehensive' : 'basic'
                  }
                });
                setShowDataInput(false);
              }}
              onClose={() => setShowDataInput(false)}
              researchMode={researchMode}
            />
          </div>
        </div>
      )}

      {/* Agent Chat Modal */}
      {showChat && <AgentChat onClose={() => setShowChat(false)} />}

      {/* Drive View Modal */}
      {showDrive && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-6xl bg-white rounded-lg shadow-xl">
            <DriveView />
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search ideas..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
          <Filter className="w-5 h-5" />
          Filters
        </button>
      </div>

      {/* Ideas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ideas.map(idea => (
          <div key={idea.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-blue-600" />
                <span className={`
                  px-2 py-1 text-xs font-medium rounded-full
                  ${idea.priority === 'high' ? 'bg-red-100 text-red-700' :
                    idea.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'}
                `}>
                  {idea.priority.charAt(0).toUpperCase() + idea.priority.slice(1)}
                </span>
              </div>
              <span className={`
                px-2 py-1 text-xs font-medium rounded-full
                ${idea.status === 'new' ? 'bg-blue-100 text-blue-700' :
                  idea.status === 'in_progress' ? 'bg-purple-100 text-purple-700' :
                  'bg-green-100 text-green-700'}
              `}>
                {idea.status.split('_').map(word => 
                  word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ')}
              </span>
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{idea.title}</h3>
            <p className="text-gray-600 mb-4">{idea.description}</p>
            
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                <span>3 comments</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{idea.createdAt.toLocaleDateString()}</span>
              </div>
            </div>
            
            {idea.assignedTo && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                    <Brain className="w-4 h-4 text-blue-600" />
                  </div>
                  <span>Assigned to {idea.assignedTo}</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}