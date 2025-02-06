import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface NodeToolbarItemProps {
  type: string;
  icon: LucideIcon;
  label: string;
  description: string;
}

function NodeToolbarItem({ type, icon: Icon, label, description }: NodeToolbarItemProps) {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 cursor-move hover:bg-gray-50"
      draggable
      onDragStart={e => onDragStart(e, type)}
    >
      <Icon className="w-5 h-5 mt-0.5 text-gray-500" />
      <div>
        <h4 className="font-medium text-sm">{label}</h4>
        <p className="text-xs text-gray-600">{description}</p>
      </div>
    </div>
  );
}

const NodeToolbar = {
  Item: NodeToolbarItem,
};

export default NodeToolbar;