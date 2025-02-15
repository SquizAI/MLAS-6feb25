import React from 'react';
import { X } from 'lucide-react'; // Make sure lucide-react is installed

interface DriveViewProps {
  onClose: () => void;
}

const DriveView: React.FC<DriveViewProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-8 z-50">
      <div className="w-full max-w-6xl bg-white rounded-xl shadow-xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Documents</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-6">
          {/* Your drive content here */}
        </div>
      </div>
    </div>
  );
};

export default DriveView;