import React from 'react';
import { File, FileText, Image, FileArchive, Film, Music, Trash2, Download } from 'lucide-react';

interface FileListProps {
  files: Array<{
    name: string;
    type: string;
    size: number;
    url?: string;
  }>;
  onSelect?: (file: any) => void;
  onDelete?: (file: any) => void;
  onDownload?: (file: any) => void;
}

export default function FileList({ files, onSelect }: FileListProps) {
  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return Image;
    if (type.startsWith('video/')) return Film;
    if (type.startsWith('audio/')) return Music;
    if (type.includes('zip') || type.includes('tar') || type.includes('rar')) return FileArchive;
    if (type.includes('text/') || type.includes('document')) return FileText;
    return File;
  };

  const formatFileSize = (bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${Math.round(size * 10) / 10} ${units[unitIndex]}`;
  };

  return (
    <div className="space-y-2">
      {files.map((file, index) => {
        const Icon = getFileIcon(file.type);
        
        return (
          <div
            key={index}
            className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50"
          >
            <div 
              className="flex items-center gap-3 flex-1 cursor-pointer"
              onClick={() => onSelect?.(file)}
            >
              <Icon className="w-5 h-5 text-gray-500" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(file.size)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {onDownload && (
                <button
                  onClick={() => onDownload(file)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <Download className="w-4 h-4 text-gray-500" />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(file)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <Trash2 className="w-4 h-4 text-gray-500" />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}