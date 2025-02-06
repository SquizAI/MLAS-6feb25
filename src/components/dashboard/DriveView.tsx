import React, { useState, useEffect } from 'react';
import { 
  File, 
  Folder, 
  MoreVertical, 
  Upload, 
  Grid, 
  List,
  Search,
  Filter,
  Plus,
  Download,
  Trash,
  Share2
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { logger } from '../../lib/logger';
import DocumentUpload from './DocumentUpload';

interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  created_at: string;
  metadata?: Record<string, any>;
}

export default function DriveView() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showUpload, setShowUpload] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [deletingFolder, setDeletingFolder] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const { data: links, error: linksError } = await supabase
        .from('document_links')
        .select('*')
        .order('created_at', { ascending: false });

      if (linksError) throw linksError;

      const { data: files, error: filesError } = await supabase
        .storage
        .from('documents')
        .list();

      if (filesError) throw filesError;

      // Combine and format documents
      const allDocs: Document[] = [
        ...(links || []).map(link => ({
          id: link.id,
          name: new URL(link.url).pathname.split('/').pop() || 'Untitled',
          type: 'link',
          size: 0,
          url: link.url,
          created_at: link.created_at,
          metadata: link.metadata
        })),
        ...(files || []).map(file => ({
          id: file.id,
          name: file.name,
          type: file.metadata?.mimetype || 'application/octet-stream',
          size: file.metadata?.size || 0,
          url: supabase.storage.from('documents').getPublicUrl(file.name).data.publicUrl,
          created_at: file.created_at,
          metadata: file.metadata
        }))
      ];

      setDocuments(allDocs);
    } catch (err) {
      logger.error({ error: err }, 'Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadComplete = () => {
    setShowUpload(false);
    fetchDocuments();
  };

  const handleDelete = async (doc: Document) => {
    try {
      if (doc.type === 'link') {
        await supabase
          .from('document_links')
          .delete()
          .eq('id', doc.id);
      } else {
        await supabase.storage
          .from('documents')
          .remove([doc.name]);
      }
      
      setDocuments(prev => prev.filter(d => d.id !== doc.id));
      logger.info({ documentId: doc.id }, 'Document deleted successfully');
    } catch (err) {
      logger.error({ error: err }, 'Failed to delete document');
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    try {
      // First check if folder has contents
      const { data: documents, error: docError } = await supabase
        .from('documents')
        .select('id')
        .eq('folder_id', folderId);

      if (docError) throw docError;

      const { data: subfolders, error: folderError } = await supabase
        .from('folders')
        .select('id')
        .eq('parent_id', folderId);

      if (folderError) throw folderError;

      // If folder has contents, show confirmation
      if ((documents?.length || 0) > 0 || (subfolders?.length || 0) > 0) {
        setDeletingFolder(folderId);
        setShowDeleteConfirm(true);
        return;
      }

      // Otherwise delete directly
      await deleteFolder(folderId);

    } catch (error) {
      logger.error({ error, folderId }, 'Failed to check folder contents');
      setError(error instanceof Error ? error.message : 'Failed to delete folder');
    }
  };

  const deleteFolder = async (folderId: string) => {
    try {
      // Delete all documents in folder
      const { error: docError } = await supabase
        .from('documents')
        .delete()
        .eq('folder_id', folderId);

      if (docError) throw docError;

      // Delete all subfolders recursively
      const { data: subfolders, error: subError } = await supabase
        .from('folders')
        .select('id')
        .eq('parent_id', folderId);

      if (subError) throw subError;

      for (const subfolder of subfolders || []) {
        await deleteFolder(subfolder.id);
      }

      // Finally delete the folder itself
      const { error: folderError } = await supabase
        .from('folders')
        .delete()
        .eq('id', folderId);

      if (folderError) throw folderError;

      setDeletingFolder(null);
      setShowDeleteConfirm(false);
      await loadFolderContents();

      logger.info({ folderId }, 'Folder deleted successfully');

    } catch (error) {
      logger.error({ error, folderId }, 'Failed to delete folder');
      setError(error instanceof Error ? error.message : 'Failed to delete folder');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Documents</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setViewMode(prev => prev === 'grid' ? 'list' : 'grid')}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            {viewMode === 'grid' ? (
              <List className="w-5 h-5" />
            ) : (
              <Grid className="w-5 h-5" />
            )}
          </button>
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            Upload
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search documents..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
          <Filter className="w-5 h-5" />
          Filters
        </button>
      </div>

      {/* Documents Grid/List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 rounded-lg h-32"></div>
            </div>
          ))}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {documents.map(doc => (
            <div
              key={doc.id}
              className="group relative bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
            >
              <div className="aspect-square rounded-lg bg-gray-100 flex items-center justify-center mb-4">
                <File className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="font-medium text-gray-900 truncate">{doc.name}</h3>
              <p className="text-sm text-gray-500">
                {new Date(doc.created_at).toLocaleDateString()}
              </p>
              
              {/* Actions */}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-white shadow-lg rounded-lg p-2 flex gap-2">
                  <button
                    onClick={() => window.open(doc.url, '_blank')}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <Download className="w-4 h-4 text-gray-600" />
                  </button>
                  <button
                    onClick={() => handleDelete(doc)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <Trash className="w-4 h-4 text-gray-600" />
                  </button>
                  <button className="p-1 hover:bg-gray-100 rounded">
                    <Share2 className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {documents.map(doc => (
            <div
              key={doc.id}
              className="group flex items-center justify-between bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-4">
                <File className="w-8 h-8 text-gray-400" />
                <div>
                  <h3 className="font-medium text-gray-900">{doc.name}</h3>
                  <p className="text-sm text-gray-500">
                    {new Date(doc.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <button
                  onClick={() => window.open(doc.url, '_blank')}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  <Download className="w-5 h-5 text-gray-600" />
                </button>
                <button
                  onClick={() => handleDelete(doc)}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  <Trash className="w-5 h-5 text-gray-600" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded">
                  <Share2 className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-2xl">
            <DocumentUpload
              onClose={() => setShowUpload(false)}
              onUploadComplete={handleUploadComplete}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && deletingFolder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Folder?</h3>
            <p className="text-gray-600 mb-6">
              This folder contains files and/or subfolders. Deleting it will permanently remove all its contents.
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeletingFolder(null);
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteFolder(deletingFolder)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}