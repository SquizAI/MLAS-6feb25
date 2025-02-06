import React, { useState, useRef, useEffect } from 'react';
import { Send, Brain, Bot, User, X, ThumbsUp, ThumbsDown, Loader2, Activity, Sparkles } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { logger } from '../../lib/logger';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  role: 'user' | 'agent';
  content: string;
  agentId?: string;
  timestamp: Date;
  status?: 'thinking' | 'processing' | 'complete';
  feedback?: {
    rating: number;
    comment?: string;
  };
}

interface AgentThought {
  type: 'analysis' | 'planning' | 'execution';
  content: string;
}

export default function AgentChat({ onClose }: AgentChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentThought, setCurrentThought] = useState<AgentThought | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  const agents = [
    { id: 'data-analyzer', name: 'Data Analyzer', role: 'Analysis Specialist' },
    { id: 'task-coordinator', name: 'Task Coordinator', role: 'Workflow Manager' },
    { id: 'research-agent', name: 'Research Agent', role: 'Research Specialist' },
  ];

  // Simulate agent thinking process
  const simulateAgentThinking = async () => {
    const thoughts = [
      { type: 'analysis', content: 'Analyzing input...' },
      { type: 'planning', content: 'Planning response strategy...' },
      { type: 'execution', content: 'Generating response...' }
    ];

    for (const thought of thoughts) {
      setCurrentThought(thought);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    setCurrentThought(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !selectedAgent) return;

    setLoading(true);
    try {
      // Add user message
      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content: input,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, userMessage]);
      setInput('');

      await simulateAgentThinking();

      // Process with selected agent
      const { data, error } = await supabase
        .from('agent_interactions')
        .insert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          agent_id: selectedAgent,
          content: input,
        })
        .select('response')
        .single();

      if (error) throw error;

      // Add agent response
      const agentMessage: Message = {
        id: crypto.randomUUID(),
        role: 'agent',
        content: data.response || "I'm processing your request...",
        agentId: selectedAgent,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, agentMessage]);

    } catch (err) {
      logger.error({ error: err }, 'Failed to process message');
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (messageId: string, rating: number, comment?: string) => {
    try {
      // Update message locally
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, feedback: { rating, comment } }
          : msg
      ));

      // Store feedback in database
      await supabase
        .from('agent_interactions')
        .update({
          feedback_rating: rating,
          feedback_comment: comment,
          metadata: {
            feedback_timestamp: new Date().toISOString()
          }
        })
        .eq('id', messageId);

    } catch (error) {
      logger.error({ error }, 'Failed to submit feedback');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-3xl bg-white rounded-lg shadow-xl flex flex-col h-[80vh]">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Brain className="w-6 h-6 text-blue-600" />
            <h2 className="text-lg font-semibold">Chat with AI Agents</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Agent Selection */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex gap-2">
            {agents.map(agent => (
              <button
                key={agent.id}
                onClick={() => setSelectedAgent(agent.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  selectedAgent === agent.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Bot className="w-5 h-5" />
                {agent.name}
              </button>
            ))}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map(message => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex items-start gap-3 ${
                message.role === 'user' ? 'flex-row-reverse' : ''
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  message.role === 'user'
                    ? 'bg-blue-100'
                    : 'bg-purple-100'
                }`}
              >
                {message.role === 'user' ? (
                  <User className="w-5 h-5 text-blue-600" />
                ) : (
                  <Bot className="w-5 h-5 text-purple-600" />
                )}
              </div>
              <div className="space-y-2 max-w-[80%]">
                <div
                  className={`px-4 py-2 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  {message.content}
                </div>
                {message.role === 'agent' && !message.feedback && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleFeedback(message.id, 1)}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <ThumbsUp className="w-4 h-4 text-gray-400" />
                    </button>
                    <button
                      onClick={() => handleFeedback(message.id, -1)}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <ThumbsDown className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                )}
                {message.feedback && (
                  <div className={`text-sm ${
                    message.feedback.rating > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {message.feedback.rating > 0 ? 'Helpful' : 'Not helpful'}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
          {/* Agent Thinking Indicator */}
          <AnimatePresence>
            {currentThought && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex items-start gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                  {currentThought.type === 'analysis' ? (
                    <Brain className="w-5 h-5 text-purple-600 animate-pulse" />
                  ) : currentThought.type === 'planning' ? (
                    <Activity className="w-5 h-5 text-purple-600 animate-pulse" />
                  ) : (
                    <Sparkles className="w-5 h-5 text-purple-600 animate-pulse" />
                  )}
                </div>
                <div className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg">
                  {currentThought.content}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={selectedAgent ? "Type your message..." : "Select an agent to start chatting"}
              disabled={!selectedAgent || loading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              type="submit"
              disabled={!selectedAgent || !input.trim() || loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}