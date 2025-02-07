import React, { useState } from 'react';
import { Mail, MessageSquare, Upload, FileText, Plus, X, MessageCircle, Link, Brain, Mic } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { logger } from '../../lib/logger';
import DocumentUpload from '../documents/DocumentUpload';
import VoiceMemo from '../voice/VoiceMemo';
import DocumentPreview from '../documents/DocumentPreview';
import FileList from '../documents/FileList';

interface DataInputProps {
  onClose: () => void;
  onDataSubmit: (data: {
    source: string;
    content: string;
    metadata?: Record<string, unknown>;
  }) => Promise<void>;
  researchMode?: boolean;
}

export default function DataInput({ onDataSubmit, onClose, researchMode = false }: DataInputProps) {
  const [source, setSource] = useState<'email' | 'slack' | 'discord' | 'text' | 'document'>('text');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDocumentUpload, setShowDocumentUpload] = useState(false);
  const [showVoiceMemo, setShowVoiceMemo] = useState(false);
  const [analysisPreferences, setAnalysisPreferences] = useState({
    extractKeywords: true,
    detectTopics: false,
    analyzeRelationships: false,
    generateSummary: false,
    crossReference: false
  });
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);

  const handleDocumentUpload = async (documentUrl: string) => {
    setShowDocumentUpload(false);
    setContent(documentUrl);
    setSource('document');
    setSelectedDocument(documentUrl);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await onDataSubmit({
        source,
        content,
        metadata: {
          timestamp: new Date().toISOString(),
          userId: supabase.auth.getUser()?.id,
          analysisPreferences,
          researchMode,
          analysisRequired: researchMode || Object.values(analysisPreferences).some(v => v)
        }
      });

      // Clear form on success
      setContent('');
      logger.info({ source }, 'Data submitted successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit data');
      logger.error({ error: err }, 'Failed to submit data');
    } finally {
      setLoading(false);
    }
  };

  const renderAnalysisOptions = () => (
    <div className="mb-6 space-y-4 bg-gray-50 rounded-lg p-4">
      <h3 className="text-sm font-medium text-gray-700">Analysis Options</h3>
      <div className="space-y-3">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={analysisPreferences.extractKeywords}
            onChange={(e) => setAnalysisPreferences(prev => ({
              ...prev,
              extractKeywords: e.target.checked
            }))}
            className="rounded text-blue-600"
          />
          <span className="ml-2 text-sm text-gray-600">Extract key terms and concepts</span>
        </label>
        
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={analysisPreferences.detectTopics}
            onChange={(e) => setAnalysisPreferences(prev => ({
              ...prev,
              detectTopics: e.target.checked
            }))}
            className="rounded text-blue-600"
          />
          <span className="ml-2 text-sm text-gray-600">Detect main topics and themes</span>
        </label>
        
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={analysisPreferences.analyzeRelationships}
            onChange={(e) => setAnalysisPreferences(prev => ({
              ...prev,
              analyzeRelationships: e.target.checked
            }))}
            className="rounded text-blue-600"
          />
          <span className="ml-2 text-sm text-gray-600">Analyze relationships between concepts</span>
        </label>
        
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={analysisPreferences.generateSummary}
            onChange={(e) => setAnalysisPreferences(prev => ({
              ...prev,
              generateSummary: e.target.checked
            }))}
            className="rounded text-blue-600"
          />
          <span className="ml-2 text-sm text-gray-600">Generate comprehensive summary</span>
        </label>
        
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={analysisPreferences.crossReference}
            onChange={(e) => setAnalysisPreferences(prev => ({
              ...prev,
              crossReference: e.target.checked
            }))}
            className="rounded text-blue-600"
          />
          <span className="ml-2 text-sm text-gray-600">Cross-reference with existing knowledge</span>
        </label>
      </div>
    </div>
  );
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Add New Data</h2>
        <button
          type="button"
          onClick={() => setShowVoiceMemo(true)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            source === 'voice'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Mic className="w-5 h-5" />
          Voice
        </button>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-white"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
          <div className="flex items-center gap-2 text-red-600">
            <X className="w-5 h-5" />
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Research Mode Indicator */}
      {researchMode && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-yellow-800">
            <Brain className="w-5 h-5" />
            <span className="font-medium">Research Mode Active</span>
          </div>
          <p className="mt-2 text-sm text-yellow-700">
            Enhanced analysis will be performed on all input data
          </p>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Source Selection */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setSource('text')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              source === 'text'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <FileText className="w-5 h-5" />
            Text
          </button>
          <button
            type="button"
            onClick={() => setShowDocumentUpload(true)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              source === 'document'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Link className="w-5 h-5" />
            Document
          </button>
          <button
            type="button"
            onClick={() => setSource('email')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              source === 'email'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Mail className="w-5 h-5" />
            Email
          </button>
          <button
            type="button"
            onClick={() => setSource('slack')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              source === 'slack'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <MessageSquare className="w-5 h-5" />
            Slack
          </button>
          <button
            type="button"
            onClick={() => setSource('discord')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              source === 'discord'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <MessageCircle className="w-5 h-5" />
            Discord
          </button>
        </div>

        {/* Analysis Options */}
        {renderAnalysisOptions()}

        {/* Content Input */}
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
            Content
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder={
              source === 'email'
                ? 'Paste email content here...'
                : source === 'slack'
                ? 'Paste Slack message here...'
                : source === 'discord'
                ? 'Paste Discord message here...'
                : 'Enter your text here...'
            }
            required
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                Add Data
              </>
            )}
          </button>
        </div>
      </form>

      {/* Document Upload Modal */}
      {showDocumentUpload && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-2xl">
            <DocumentUpload
              onClose={() => setShowDocumentUpload(false)}
              onUploadComplete={handleDocumentUpload}
              analysisMode={researchMode ? 'comprehensive' : 'basic'}
            />
          </div>
        </div>
      )}
      
      {selectedDocument && source === 'document' && (
        <DocumentPreview 
          url={selectedDocument} 
          onClose={() => {
            setSelectedDocument(null);
            setContent('');
          }}
        />
      )}
      
      {/* File List for Multiple Files */}
      {source === 'document' && content && content.includes('\n') && (
        <div className="mt-4">
          <FileList
            files={content.split('\n').map(url => ({
              name: url.split('/').pop() || '',
              type: url.endsWith('.txt') ? 'text/plain' : 'application/octet-stream',
              size: 0, // Size would be fetched from metadata in a real implementation
            }))}
            onSelect={(file) => setSelectedDocument(file.name)}
          />
        </div>
      )}

      {/* Voice Memo Modal */}
      {showVoiceMemo && (
        <VoiceMemo
          onClose={() => setShowVoiceMemo(false)}
          onMemoProcessed={async (text) => {
            setContent(text);
            setSource('voice');
            setShowVoiceMemo(false);
          }}
        />
      )}
    </div>
  );
}