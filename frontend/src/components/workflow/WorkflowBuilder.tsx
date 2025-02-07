import React, { useState, useRef } from 'react';
import ReactFlow, { 
  Background, 
  Controls,
  Connection,
  Edge,
  Node,
  addEdge,
  Handle,
  Position,
} from 'reactflow';
import { 
  Boxes,
  Brain,
  Workflow,
  Plus,
  Save,
  Play,
  Settings,
  XCircle
} from 'lucide-react';
import { NodeData, WorkflowData } from './types';
import NodeToolbar from './NodeToolbar';
import WorkflowControls from './WorkflowControls';
import 'reactflow/dist/style.css';

const nodeTypes = {
  idea: IdeaNode,
  task: TaskNode,
  agent: AgentNode,
  condition: ConditionNode,
};

export default function WorkflowBuilder() {
  const [nodes, setNodes] = useState<Node<NodeData>[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [templates, setTemplates] = useState([
    {
      id: 'email-processing',
      name: 'Email Processing',
      description: 'Automatically process and categorize emails',
      nodes: [/* Template nodes */],
      emotionalContext: { priority: 'medium', urgency: 0.6 }
    },
    {
      id: 'task-decomposition',
      name: 'Task Decomposition',
      description: 'Break down complex tasks into manageable subtasks',
      nodes: [/* Template nodes */],
      emotionalContext: { priority: 'high', urgency: 0.8 }
    }
  ]);
  const [showTemplates, setShowTemplates] = useState(false);

  const onConnect = (params: Connection) => {
    setEdges(prev => addEdge({ ...params, animated: true }, prev));
  };

  const onDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };

  const onDrop = (event: React.DragEvent) => {
    event.preventDefault();

    if (!reactFlowWrapper.current) return;

    const type = event.dataTransfer.getData('application/reactflow');
    const position = {
      x: event.clientX - reactFlowWrapper.current.getBoundingClientRect().left,
      y: event.clientY - reactFlowWrapper.current.getBoundingClientRect().top,
    };

    const newNode: Node<NodeData> = {
      id: `${type}-${Date.now()}`,
      type,
      position,
      data: { label: `New ${type}`, type },
    };

    setNodes(prev => [...prev, newNode]);
  };

  const onSave = () => {
    const workflow: WorkflowData = {
      id: Date.now().toString(),
      name: 'New Workflow',
      nodes,
      edges,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    // Save workflow logic here
  };

  return (
    <div className="h-screen flex">
      {/* Toolbar */}
      <div className="w-64 bg-white border-r border-gray-200 p-4">
        <div className="space-y-6">
          {/* Templates Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Templates</h3>
            <button
              onClick={() => setShowTemplates(true)}
              className="w-full flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
            >
              <Plus className="w-5 h-5" />
              Use Template
            </button>
          </div>

          {/* Node Types */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700">Elements</h3>
            <div className="space-y-2">
              <NodeToolbar.Item
                type="idea"
                icon={Boxes}
                label="Idea"
                description="Starting point for workflows"
              />
              <NodeToolbar.Item
                type="task"
                icon={Workflow}
                label="Task"
                description="Work to be completed"
              />
              <NodeToolbar.Item
                type="agent"
                icon={Brain}
                label="Agent"
                description="AI agent assignment"
              />
              <NodeToolbar.Item
                type="condition"
                icon={Settings}
                label="Condition"
                description="Branch based on criteria"
              />
            </div>
          </div>

          {/* Controls */}
          <WorkflowControls
            onSave={onSave}
            onClear={() => {
              setNodes([]);
              setEdges([]);
            }}
          />
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={changes => setNodes(prev => applyNodeChanges(changes, prev))}
          onEdgesChange={changes => setEdges(prev => applyEdgeChanges(changes, prev))}
          onConnect={onConnect}
          onNodeClick={(_, node) => setSelectedNode(node)}
          nodeTypes={nodeTypes}
          onDragOver={onDragOver}
          onDrop={onDrop}
          fitView
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>

      {/* Properties Panel */}
      {selectedNode && (
        <div className="w-80 bg-white border-l border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Properties</h3>
            <button
              onClick={() => setSelectedNode(null)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
          <NodeProperties node={selectedNode} onChange={updateNodeData} />
        </div>
      )}

      {/* Templates Modal */}
      {showTemplates && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Workflow Templates</h2>
              <div className="grid grid-cols-2 gap-4">
                {templates.map(template => (
                  <button
                    key={template.id}
                    onClick={() => {
                      // Load template
                      setNodes(template.nodes);
                      setShowTemplates(false);
                    }}
                    className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 text-left"
                  >
                    <h3 className="font-medium mb-2">{template.name}</h3>
                    <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                    <div className="flex items-center gap-2 text-sm">
                      <span className={`px-2 py-1 rounded-full ${
                        template.emotionalContext.priority === 'high' 
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {template.emotionalContext.priority}
                      </span>
                      <span className="text-gray-500">Urgency: {template.emotionalContext.urgency}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Custom Node Components
function IdeaNode({ data }: { data: NodeData }) {
  return (
    <div className="px-4 py-2 shadow-lg rounded-lg bg-white border-2 border-purple-200">
      <Handle type="source" position={Position.Bottom} />
      <div className="flex items-center gap-2">
        <Boxes className="w-4 h-4 text-purple-500" />
        <span className="font-medium">{data.label}</span>
      </div>
    </div>
  );
}

function TaskNode({ data }: { data: NodeData }) {
  return (
    <div className="px-4 py-2 shadow-lg rounded-lg bg-white border-2 border-blue-200">
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
      <div className="flex items-center gap-2">
        <Workflow className="w-4 h-4 text-blue-500" />
        <span className="font-medium">{data.label}</span>
      </div>
    </div>
  );
}

function AgentNode({ data }: { data: NodeData }) {
  return (
    <div className="px-4 py-2 shadow-lg rounded-lg bg-white border-2 border-green-200">
      <Handle type="target" position={Position.Top} />
      <div className="flex items-center gap-2">
        <Brain className="w-4 h-4 text-green-500" />
        <span className="font-medium">{data.label}</span>
      </div>
    </div>
  );
}

function ConditionNode({ data }: { data: NodeData }) {
  return (
    <div className="px-4 py-2 shadow-lg rounded-lg bg-white border-2 border-yellow-200">
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} id="true" />
      <Handle type="source" position={Position.Right} id="false" />
      <div className="flex items-center gap-2">
        <Settings className="w-4 h-4 text-yellow-500" />
        <span className="font-medium">{data.label}</span>
      </div>
    </div>
  );
}