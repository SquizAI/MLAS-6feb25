import React, { useState, useEffect } from 'react';
import { File, FileText, X, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { logger } from '../../lib/logger';

interface DocumentPreviewProps {
  url: string;
  onClose: () => void;
}

export default function DocumentPreview({ url, onClose }: DocumentPreviewProps) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(null);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        // Get file extension
        const ext = url.split('.').pop()?.toLowerCase();
        
        // Fetch content
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch document');
        
        // Get mime type
        const contentType = response.headers.get('content-type');
        setMimeType(contentType);

        // Handle different file types
        if (ext === 'txt' || ext === 'md') {
          const text = await response.text();
          // Show first 500 characters
          setContent(text.slice(0, 500) + (text.length > 500 ? '...' : ''));
        } else if (contentType?.startsWith('image/')) {
          setContent(url); // Use URL directly for images
        } else {
          setContent(`Preview not available for ${ext?.toUpperCase()} files`);
        }
      } catch (err) {
        logger.error({ error: err }, 'Failed to fetch document preview');
        setError('Failed to load preview');
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [url]);

  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          <span className="font-medium text-gray-900">Document Preview</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-200 rounded"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
        </div>
      ) : error ? (
        <div className="text-red-600 text-sm py-4">{error}</div>
      ) : (
        mimeType?.startsWith('image/') ? (
          <div className="flex items-center justify-center">
            <img 
              src={content!} 
              alt="Document preview" 
              className="max-w-full max-h-96 object-contain"
            />
          </div>
        ) : (
          <div className="prose prose-sm max-w-none">
            <pre className="whitespace-pre-wrap text-sm text-gray-600 font-mono">
              {content}
            </pre>
          </div>
        )
      )}
    </div>
  );
}