import React from 'react';
import { Download, Share2, RefreshCw } from 'lucide-react';

export default function GraphControls() {
  return (
    <div className="space-y-3">
      <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
        <Download className="w-4 h-4" />
        Export Graph
      </button>
      
      <button className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
        <Share2 className="w-4 h-4" />
        Share View
      </button>

      <button className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
        <RefreshCw className="w-4 h-4" />
        Reset View
      </button>
    </div>
  );
}