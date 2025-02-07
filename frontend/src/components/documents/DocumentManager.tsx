import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FolderOpen,
  File,
  Star,
  MoreVertical,
  Upload,
  FolderPlus,
  Search,
  Grid,
  List,
  Filter,
  SortAsc,
  Clock,
  Trash2,
  Share2,
  Download,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { logger } from '../../lib/logger';

interface Document {
  id: string;
  name: string;
  mime_type: string;
  size: number;
  folder_id: string | null;
  created_at: string;
  updated_at: string;
  starred: boolean;
}

interface Folder {
  id: string;
  name: string;
  parent_id: string | null;
  color?: string;
  icon?: string;
}

export default function DocumentManager() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { folderId } = useParams();
  
  const [documents, setDocuments] = useState<Document[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [currentFolder, setCurrentFolder] = useState<Folder | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'date'>('date');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user) {
      loadFolderContents();
    }
  }, [user, folderId]);

  const loadFolderContents = async () => {
    try {
      // Load current folder details
      const currentFolderId = folderId || null;
      
      if (currentFolderId) {
        const { data: folder } = await supabase
          .from('folders')
          .select('*')
          .eq('id', currentFolderId)
          .single();
        setCurrentFolder(folder);
      }

      // Load folders
      const { data: folderData, error: folderError } = await supabase
        .from('folders')
        .select('*')
        .is('parent_id', currentFolderId)
        .order('name');

      if (folderError) throw folderError;
      setFolders(folderData || []);

      // Load documents
      const { data: documentData, error: documentError } = await supabase
        .from('documents')
        .select('*')
        .is('folder_id', currentFolderId)
        .order(sortBy === 'date' ? 'updated_at' : 'name', { ascending: sortBy === 'name' });

      if (documentError) throw documentError;
      setDocuments(documentData || []);

    } catch (error) {
      logger.error({ error }, 'Failed to load folder contents');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !user) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const filePath = `${user.id}/${folderId || 'root'}/${file.name}`;

        // Upload file to storage
        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, file, {
            onUploadProgress: (progress) => {
              setUploadProgress((progress.loaded / progress.total) * 100);
            },
          });

        if (uploadError) throw uploadError;

        // Create document record
        const { error: dbError } = await supabase
          .from('documents')
          .insert({
            name: file.name,
            file_path: filePath,
            mime_type: file.type,
            size: file.size,
            folder_id: folderId || null,
            owner_id: user.id,
          });

        if (dbError) throw dbError;
      }

      await loadFolderContents();
      logger.info('Documents uploaded successfully');

    } catch (error) {
      logger.error({ error }, 'Failed to upload documents');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const createFolder = async (name: string) => {
    try {
      const { error } = await supabase
        .from('folders')
        .insert({
          name,
          parent_id: folderId || null,
          owner_id: user?.id,
        });

      if (error) throw error;
      await loadFolderContents();

    } catch (error) {
      logger.error({ error }, 'Failed to create folder');
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // Implement search logic here
  };

  const toggleStar = async (documentId: string, starred: boolean) => {
    try {
      const { error } = await supabase
        .from('documents')
        .update({ starred: !starred })
        .eq('id', documentId);

      if (error) throw error;
      await loadFolderContents();

    } catch (error) {
      logger.error({ error }, 'Failed to toggle star');
    }
  };

  const downloadDocument = async (document: Document) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(document.file_path);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = document.name;
      a.click();
      URL.revokeObjectURL(url);

    } catch (error) {
      logger.error({ error }, 'Failed to download document');
    }
  };

  return (
    <div className="h-full bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900">
            {currentFolder ? currentFolder.name : 'My Documents'}
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg ${
                viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'
              }`}
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg ${
                viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'
              }`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search documents..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>

          <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
            <Filter className="w-5 h-5" />
            Filters
          </button>

          <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
            <SortAsc className="w-5 h-5" />
            Sort
          </button>

          <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
            <Upload className="w-5 h-5" />
            Upload
            <input
              type="file"
              multiple
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>

          <button
            onClick={() => createFolder('New Folder')}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            <FolderPlus className="w-5 h-5" />
            New Folder
          </button>
        </div>
      </div>

      {/* Upload Progress */}
      {isUploading && (
        <div className="mb-6">
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Uploading... {Math.round(uploadProgress)}%
          </p>
        </div>
      )}

      {/* Content */}
      <div className={`grid ${viewMode === 'grid' ? 'grid-cols-4' : 'grid-cols-1'} gap-6`}>
        {/* Folders */}
        {folders.map((folder) => (
          <div
            key={folder.id}
            onClick={() => navigate(`/documents/${folder.id}`)}
            className={`
              bg-white rounded-lg border border-gray-200 p-4 cursor-pointer
              hover:border-blue-500 hover:shadow-md transition-all
              ${viewMode === 'list' ? 'flex items-center justify-between' : ''}
            `}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <FolderOpen className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">{folder.name}</h3>
                {viewMode === 'list' && (
                  <p className="text-sm text-gray-500">Folder</p>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Documents */}
        {documents.map((document) => (
          <div
            key={document.id}
            className={`
              bg-white rounded-lg border border-gray-200 p-4
              hover:border-blue-500 hover:shadow-md transition-all
              ${viewMode === 'list' ? 'flex items-center justify-between' : ''}
            `}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <File className="w-6 h-6 text-gray-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">{document.name}</h3>
                {viewMode === 'list' && (
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>{formatFileSize(document.size)}</span>
                    <span>•</span>
                    <span>{formatDate(document.updated_at)}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleStar(document.id, document.starred)}
                className={`p-2 rounded-lg hover:bg-gray-100 ${
                  document.starred ? 'text-yellow-500' : 'text-gray-400'
                }`}
              >
                <Star className="w-5 h-5" />
              </button>
              <button
                onClick={() => downloadDocument(document)}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-400"
              >
                <Download className="w-5 h-5" />
              </button>
              <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-400">
                <Share2 className="w-5 h-5" />
              </button>
              <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-400">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${Math.round(size * 10) / 10} ${units[unitIndex]}`;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}