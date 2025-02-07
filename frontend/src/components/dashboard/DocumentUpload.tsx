import React, { useState, useRef } from 'react';
import { Upload, Link, FileText, X, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { logger } from '../../lib/logger';
import { googleService } from '../../lib/google';

interface DocumentUploadProps {
  onClose: () => void;
  onUploadComplete: (documentUrl: string) => void;
}

export default function DocumentUpload({ onClose, onUploadComplete }: DocumentUploadProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [documentLink, setDocumentLink] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      // Create documents bucket if it doesn't exist
      const { data: bucket, error: bucketError } = await supabase
        .storage
        .getBucket('documents');

      if (!bucket) {
        await supabase.storage.createBucket('documents', { public: true });
      }

      // Upload file to Supabase storage
      const { data, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(`${crypto.randomUUID()}-${file.name}`, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(data.path);
      
      onUploadComplete(publicUrl);
      logger.info({ fileName: file.name }, 'Document uploaded successfully');
    } catch (err) {
      logger.error({ error: err }, 'Failed to upload document');
      setError('Failed to upload document. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleDriveUpload = async () => {
    try {
      setLoading(true);
      const files = await googleService.listDriveFiles();
      if (files && files.length > 0) {
        onUploadComplete(files[0].webViewLink);
      }
    } catch (err) {
      logger.error({ error: err }, 'Failed to access Google Drive');
      setError('Failed to access Google Drive. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleDriveCallback = async (data: any) => {
    if (data.action === 'picked') {
      const file = data.docs[0];
      onUploadComplete(file.url);
      logger.info({ fileName: file.name }, 'Google Drive document linked successfully');
    }
  };

  const handleLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!documentLink) return;

    setLoading(true);
    setError(null);

    try {
      // Validate and store document link
      const { error: insertError } = await supabase
        .from('document_links')
        .insert({
          url: documentLink,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          created_at: new Date().toISOString()
        });

      if (insertError) throw insertError;

      onUploadComplete(documentLink);
      logger.info({ url: documentLink }, 'Document link added successfully');
    } catch (err) {
      logger.error({ error: err }, 'Failed to add document link');
      setError('Failed to add document link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Add Document</h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="space-y-6">
        {/* Direct Upload */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Upload Document</h3>
          <div className="flex items-center gap-4">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              accept=".pdf,.doc,.docx,.txt"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Upload className="w-5 h-5" />
              )}
              Choose File
            </button>
            <p className="text-sm text-gray-500">
              Supported formats: PDF, DOC, DOCX, TXT
            </p>
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or</span>
          </div>
        </div>

        {/* Google Drive */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Import from Google Drive</h3>
          <button
            onClick={handleGoogleDriveUpload}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <FileText className="w-5 h-5 text-gray-500" />
            Select from Google Drive
          </button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or</span>
          </div>
        </div>

        {/* Document Link */}
        <form onSubmit={handleLinkSubmit}>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Add Document Link</h3>
          <div className="flex gap-2">
            <input
              type="url"
              value={documentLink}
              onChange={(e) => setDocumentLink(e.target.value)}
              placeholder="Enter document URL"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <button
              type="submit"
              disabled={loading || !documentLink}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Link className="w-5 h-5" />
              )}
              Add Link
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}