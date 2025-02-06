import React from 'react';
import { Node } from 'reactflow';
import { Brain, AlertTriangle, Zap } from 'lucide-react';

interface NodePropertiesProps {
  node: Node;
  onChange: (nodeId: string, data: any) => void;
}

export default function NodeProperties({ node, onChange }: NodePropertiesProps) {
  const handleEmotionalContextChange = (value: number) => {
    onChange(node.id, {
      ...node.data,
      emotionalContext: {
        ...node.data.emotionalContext,
        urgency: value
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Basic Properties */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Label
        </label>
        <input
          type="text"
          value={node.data.label}
          onChange={(e) => onChange(node.id, { ...node.data, label: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Emotional Context */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
          <Brain className="w-4 h-4" />
          Emotional Context
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-2">Urgency</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={node.data.emotionalContext?.urgency || 0}
              onChange={(e) => handleEmotionalContextChange(parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-gray-500">
              <span>Low</span>
              <span>High</span>
            </div>
          </div>
        </div>
      </div>

      {/* XP Settings */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4" />
          XP Settings
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-2">Base XP</label>
            <input
              type="number"
              value={node.data.xp || 0}
              onChange={(e) => onChange(node.id, { ...node.data, xp: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Validation Warnings */}
      {!node.data.label && (
        <div className="flex items-start gap-2 p-3 bg-yellow-50 text-yellow-700 rounded-lg">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <p className="text-sm">Node label is required</p>
        </div>
      )}
    </div>
  );
}