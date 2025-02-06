import React from 'react';
import { Save, Play, Trash2 } from 'lucide-react';

interface WorkflowControlsProps {
  onSave: () => void;
  onClear: () => void;
}

export default function WorkflowControls({ onSave, onClear }: WorkflowControlsProps) {
  return (
    <div className="space-y-3">
      <button
        onClick={onSave}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        <Save className="w-4 h-4" />
        Save Workflow
      </button>
      
      <button
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        <Play className="w-4 h-4" />
        Run Workflow
      </button>

      <button
        onClick={onClear}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
      >
        <Trash2 className="w-4 h-4" />
        Clear Canvas
      </button>
    </div>
  );
}