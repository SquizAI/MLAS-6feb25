import React, { useState, useCallback } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import { Search, Filter, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import GraphControls from './GraphControls';
import GraphLegend from './GraphLegend';
import GraphSearch from './GraphSearch';
import { GraphData, GraphNode, GraphLink } from './types';

export default function GraphExplorer() {
  const [graphData, setGraphData] = useState<GraphData>({
    nodes: [],
    links: [],
  });
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [filters, setFilters] = useState({
    ideas: true,
    tasks: true,
    agents: true,
    skills: true,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [emotionalContext, setEmotionalContext] = useState<boolean>(false);
  const [xpData, setXpData] = useState<boolean>(false);

  const handleNodeClick = useCallback((node: GraphNode) => {
    setSelectedNode(node);
    // Fetch node details and related nodes
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // Filter nodes based on search
  };

  const toggleFilter = (key: keyof typeof filters) => {
    setFilters(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className="h-screen flex">
      {/* Controls Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 p-6">
        <div className="space-y-6">
          {/* Search */}
          <GraphSearch onSearch={handleSearch} />

          {/* Filters */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Filters</h3>
            <div className="space-y-2">
              {/* Existing filters */}
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.ideas}
                  onChange={() => toggleFilter('ideas')}
                  className="rounded text-blue-600"
                />
                <span className="text-sm">Ideas</span>
              </label>
              {/* New filters */}
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={emotionalContext}
                  onChange={(e) => setEmotionalContext(e.target.checked)}
                  className="rounded text-blue-600"
                />
                <span className="text-sm">Emotional Context</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={xpData}
                  onChange={(e) => setXpData(e.target.checked)}
                  className="rounded text-blue-600"
                />
                <span className="text-sm">XP Data</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.tasks}
                  onChange={() => toggleFilter('tasks')}
                  className="rounded text-blue-600"
                />
                <span className="text-sm">Tasks</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.agents}
                  onChange={() => toggleFilter('agents')}
                  className="rounded text-blue-600"
                />
                <span className="text-sm">Agents</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.skills}
                  onChange={() => toggleFilter('skills')}
                  className="rounded text-blue-600"
                />
                <span className="text-sm">Skills</span>
              </label>
            </div>
          </div>

          {/* Legend */}
          <GraphLegend />

          {/* Controls */}
          <GraphControls />
        </div>
      </div>

      {/* Graph Visualization */}
      <div className="flex-1 relative">
        <ForceGraph3D
          graphData={graphData}
          nodeLabel="label"
          nodeAutoColorBy="group"
          nodeRelSize={6}
          linkDirectionalParticles={2}
          linkDirectionalParticleSpeed={0.01}
          onNodeClick={handleNodeClick}
          enableNodeDrag={false}
          enableNavigationControls={true}
          showNavInfo={false}
        />

        {/* Zoom Controls */}
        <div className="absolute bottom-6 right-6 flex flex-col gap-2">
          <button className="p-2 bg-white rounded-lg shadow-lg hover:bg-gray-50">
            <ZoomIn className="w-5 h-5" />
          </button>
          <button className="p-2 bg-white rounded-lg shadow-lg hover:bg-gray-50">
            <ZoomOut className="w-5 h-5" />
          </button>
          <button className="p-2 bg-white rounded-lg shadow-lg hover:bg-gray-50">
            <Maximize2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Node Details Panel */}
      {selectedNode && (
        <div className="w-96 bg-white border-l border-gray-200 p-6">
          <NodeDetails node={selectedNode} onClose={() => setSelectedNode(null)} />
        </div>
      )}
    </div>
  );
}