import React, { useState } from 'react';
import { Mail, Star, Archive, Trash2, Plus, Tag } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Email {
  id: string;
  subject: string;
  from: string;
  to: string[];
  content: string;
  received_at: Date;
  priority: 'low' | 'medium' | 'high';
  status: 'unread' | 'read' | 'archived';
  labels: string[];
}

export default function EmailManager() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);

  const processEmail = async (email: Email) => {
    try {
      // Process email with AI
      const { data, error } = await supabase
        .from('agent_interactions')
        .insert({
          agent_id: 'data-analyzer',
          content: `Process email: ${email.subject}`,
          metadata: {
            email_id: email.id,
            priority: email.priority,
            content: email.content
          }
        })
        .select()
        .single();

      if (error) throw error;

      // Update email with AI suggestions
      const response = data.response ? JSON.parse(data.response) : null;
      if (response) {
        await supabase
          .from('emails')
          .update({
            ai_suggestions: response.suggestions,
            auto_labels: response.labels,
            priority: response.priority
          })
          .eq('id', email.id);
      }

    } catch (error) {
      console.error('Failed to process email:', error);
    }
  };

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Email List */}
      <div className="col-span-4 bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Inbox</h2>
            <button className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm">
              <Plus className="w-4 h-4" />
              Compose
            </button>
          </div>
          <div className="flex gap-2">
            <button className="flex-1 py-1.5 text-center text-sm text-gray-600 hover:bg-gray-50 rounded-lg">
              Primary
            </button>
            <button className="flex-1 py-1.5 text-center text-sm text-gray-600 hover:bg-gray-50 rounded-lg">
              Social
            </button>
            <button className="flex-1 py-1.5 text-center text-sm text-gray-600 hover:bg-gray-50 rounded-lg">
              Updates
            </button>
          </div>
        </div>
        <div className="divide-y divide-gray-200">
          {emails.map(email => (
            <button
              key={email.id}
              onClick={() => setSelectedEmail(email)}
              className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-gray-900">{email.from}</p>
                  <p className="text-sm text-gray-900">{email.subject}</p>
                  <p className="text-sm text-gray-500 line-clamp-1">{email.content}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="text-xs text-gray-500">
                    {email.received_at.toLocaleTimeString()}
                  </span>
                  {email.priority === 'high' && (
                    <span className="px-1.5 py-0.5 bg-red-100 text-red-600 rounded text-xs">
                      High
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Email Content */}
      <div className="col-span-8 bg-white rounded-lg shadow-sm border border-gray-200">
        {selectedEmail ? (
          <div className="h-full flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">{selectedEmail.subject}</h2>
                <div className="flex items-center gap-2">
                  <button className="p-2 hover:bg-gray-100 rounded-lg">
                    <Star className="w-5 h-5 text-gray-400" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg">
                    <Archive className="w-5 h-5 text-gray-400" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg">
                    <Trash2 className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-600">
                <div>
                  <p>From: {selectedEmail.from}</p>
                  <p>To: {selectedEmail.to.join(', ')}</p>
                </div>
                <div className="flex items-center gap-2">
                  {selectedEmail.labels.map(label => (
                    <div
                      key={label}
                      className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full"
                    >
                      <Tag className="w-3 h-3" />
                      <span className="text-xs">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex-1 p-6 overflow-auto">
              <div className="prose max-w-none">
                {selectedEmail.content}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            <p>Select an email to view</p>
          </div>
        )}
      </div>
    </div>
  );
}