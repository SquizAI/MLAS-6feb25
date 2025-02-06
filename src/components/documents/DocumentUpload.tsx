import React, { useState, useRef } from 'react';
import { Upload, Link, FileText, X, Loader2, Image, File } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { logger } from '../../lib/logger';
import { googleService } from '../../lib/google';

interface DocumentUploadProps {
  onClose: () => void;
  onUploadComplete: (documentUrl: string) => void;
  analysisMode?: 'basic' | 'comprehensive' | 'custom';
}

interface AnalysisOptions {
  extractText: boolean;
  detectTopics: boolean;
  extractEntities: boolean;
  analyzeSentiment: boolean;
  generateSummary: boolean;
  crossReference: boolean;
  extractKeywords: boolean;
  findRelationships: boolean;
}

export default function DocumentUpload({ onClose, onUploadComplete, analysisMode = 'basic' }: DocumentUploadProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [documentLink, setDocumentLink] = useState('');
  const [showAnalysisOptions, setShowAnalysisOptions] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analysisStatus, setAnalysisStatus] = useState<'idle' | 'analyzing' | 'complete'>('idle');
  const [analysisOptions, setAnalysisOptions] = useState<AnalysisOptions>({
    extractText: analysisMode !== 'basic',
    detectTopics: analysisMode === 'comprehensive',
    extractEntities: analysisMode === 'comprehensive',
    analyzeSentiment: analysisMode === 'comprehensive',
    generateSummary: analysisMode === 'comprehensive',
    crossReference: analysisMode === 'comprehensive',
    extractKeywords: true,
    findRelationships: analysisMode === 'comprehensive',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fileTypes = {
    'application/pdf': {
      name: 'PDF',
      icon: 'file-text',
      analysisSupport: ['extractText', 'detectTopics', 'extractEntities', 'analyzeSentiment', 'generateSummary'],
    },
    'application/msword': {
      name: 'DOC',
      icon: 'file-text',
      analysisSupport: ['extractText', 'detectTopics', 'extractEntities', 'analyzeSentiment', 'generateSummary'],
    },
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
      name: 'DOCX',
      icon: 'file-text',
      analysisSupport: ['extractText', 'detectTopics', 'extractEntities', 'analyzeSentiment', 'generateSummary'],
    },
    'text/plain': {
      name: 'TXT',
      icon: 'file-text',
      analysisSupport: ['detectTopics', 'extractEntities', 'analyzeSentiment', 'generateSummary'],
    },
    'text/markdown': {
      name: 'MD',
      icon: 'file-text',
      analysisSupport: ['detectTopics', 'extractEntities', 'analyzeSentiment', 'generateSummary'],
    },
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files?.[0]) {
      setSelectedFile(files[0]);
      if (files[0].type.startsWith('image/')) {
        setPreviewUrl(URL.createObjectURL(files[0]));
      }
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setSelectedFile(file);
    if (file.type.startsWith('image/')) {
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    // Check file type support
    if (!fileTypes[selectedFile.type]) {
      setError('Unsupported file type. Please upload a supported document format.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Upload file to Supabase storage
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');
      
      const filePath = `${user.user.id}/${selectedFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, selectedFile, {
          onUploadProgress: (progress) => {
            setUploadProgress((progress.loaded / progress.total) * 100);
          }
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = await supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      // Create document record
      const { error: dbError } = await supabase
        .from('documents')
        .insert({
          name: selectedFile.name,
          file_path: filePath,
          mime_type: selectedFile.type,
          size: selectedFile.size,
          owner_id: user.user.id,
        });

      if (dbError) throw dbError;
      
      onUploadComplete(publicUrl);
      logger.info({ fileName: selectedFile.name }, 'Document uploaded successfully');
      onClose();
    } catch (err) {
      logger.error({ error: err }, 'Failed to upload document');
      setError('Failed to upload document. Please try again.');
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold">Upload Document</h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <div 
        className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive 
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="space-y-4">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
          />
          <div className="w-16 h-16 mx-auto mb-4">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-full object-cover rounded"
              />
            ) : dragActive ? (
              <Upload className="w-full h-full text-blue-500" />
            ) : (
              <File className="w-full h-full text-gray-400" />
            )}
          </div>
          <div className="text-sm text-gray-600">
            <p>{dragActive ? 'Drop your file here' : 'Drag and drop your file here, or'}</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-blue-500 hover:text-blue-600 font-medium"
            >
              browse
            </button>
          </div>
          <p className="text-xs text-gray-500">
            Supported formats: PDF, DOC, DOCX, TXT, JPG, PNG, GIF
          </p>
        </div>
      </div>

      {/* Selected File Preview */}
      {selectedFile && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <File className="w-5 h-5 text-gray-500" />
              <div>
                <p className="font-medium text-gray-900">{selectedFile.name}</p>
                <p className="text-sm text-gray-500">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setSelectedFile(null);
                setPreviewUrl(null);
              }}
              className="p-1 hover:bg-gray-200 rounded"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {loading && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-600">Uploading...</span>
            <span className="text-gray-900 font-medium">{Math.round(uploadProgress)}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-lg">
          {error}
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-6 flex justify-end gap-3">
        <button
          onClick={onClose}
          className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleUpload}
          disabled={!selectedFile || loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-5 h-5" />
              Upload
            </>
          )}
        </button>
      </div>
    </div>
  );
}