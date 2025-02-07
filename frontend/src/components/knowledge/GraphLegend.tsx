import React from 'react';
import { Circle } from 'lucide-react';

export default function GraphLegend() {
  const items = [
    { label: 'Ideas', color: 'text-purple-500' },
    { label: 'Tasks', color: 'text-blue-500' },
    { label: 'Agents', color: 'text-green-500' },
    { label: 'Skills', color: 'text-yellow-500' },
  ];

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-gray-700">Legend</h3>
      <div className="space-y-2">
        {items.map(item => (
          <div key={item.label} className="flex items-center gap-2">
            <Circle className={`w-4 h-4 ${item.color}`} />
            <span className="text-sm">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}