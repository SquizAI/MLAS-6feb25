import React, { useState, useCallback, useRef, useEffect } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import { Search, Filter, ZoomIn, ZoomOut, Maximize2, Brain, FileText, Lightbulb, Workflow } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRealtimeUpdates } from '../../hooks/useRealtimeUpdates';
import { logger } from '../../lib/logger';

interface Node {
  id: string;
  name: string;
  type: 'idea' | 'task' | 'agent' | 'skill';
  group: string;
  val: number;
  color: string;
  data?: any;
}

interface Link {
  source: string;
  target: string;
  type: string;
  strength: number;
  color: string;
}

export default function KnowledgeGraphExplorer() {
  const graphRef = useRef<any>();
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [filters, setFilters] = useState({
    ideas: true,
    tasks: true,
    agents: true,
    skills: true,
    emotionalContext: false,
    xpData: false
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [graphData, setGraphData] = useState<{ nodes: Node[]; links: Link[] }>({ nodes: [], links: [] });
  const [highlightNodes, setHighlightNodes] = useState(new Set<string>());
  const [highlightLinks, setHighlightLinks] = useState(new Set<string>());
  const [zoomLevel, setZoomLevel] = useState(1);

  // Subscribe to real-time updates
  const { data: updates } = useRealtimeUpdates({
    tables: ['agent_interactions', 'raw_data', 'agent_emotional_traits'],
    event: '*'
  });

  useEffect(() => {
    if (!updates) return;

    // Transform data into graph format
    const nodes: Node[] = [];
    const links: Link[] = [];

    // Process updates and update graph data
    updates.forEach(update => {
      if (update.type === 'agent_interactions') {
        // Add agent nodes
        nodes.push({
          id: update.agent_id,
          name: update.agent_id.split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' '),
          type: 'agent',
          group: 'agents',
          val: 20,
          color: '#3b82f6',
          data: update
        });

        // Add task nodes
        if (update.content) {
          nodes.push({
            id: update.id,
            name: update.content.substring(0, 20) + '...',
            type: 'task',
            group: 'tasks',
            val: 15,
            color: '#8b5cf6',
            data: update
          });

          // Link agent to task
          links.push({
            source: update.agent_id,
            target: update.id,
            type: 'assigned',
            strength: 1,
            color: '#4b5563'
          });
        }
      }
    });

    setGraphData({ nodes, links });
    
    logger.debug({ 
      nodeCount: nodes.length,
      linkCount: links.length 
    }, 'Graph data updated');

  }, [updates]);

  const handleNodeClick = useCallback((node: Node) => {
    setSelectedNode(node);
    
    // Highlight connected nodes and links
    const connectedNodes = new Set<string>();
    const connectedLinks = new Set<string>();
    
    graphData.links.forEach(link => {
      if (link.source === node.id || link.target === node.id) {
        connectedNodes.add(link.source as string);
        connectedNodes.add(link.target as string);
        connectedLinks.add(`${link.source}-${link.target}`);
      }
    });

    setHighlightNodes(connectedNodes);
    setHighlightLinks(connectedLinks);

    // Center and zoom on node
    if (graphRef.current) {
      const distance = 40;
      const distRatio = 1 + distance/Math.hypot(node.x || 0, node.y || 0);
      graphRef.current.centerAt(node.x, node.y, 1000);
      graphRef.current.zoom(2, 1000);
    }
  }, [graphData]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query) {
      setHighlightNodes(new Set());
      setHighlightLinks(new Set());
      return;
    }

    // Highlight matching nodes
    const matchingNodes = new Set<string>();
    graphData.nodes.forEach(node => {
      if (node.name.toLowerCase().includes(query.toLowerCase())) {
        matchingNodes.add(node.id);
      }
    });
    setHighlightNodes(matchingNodes);
  };

  const getNodeColor = (node: Node) => {
    if (highlightNodes.size && !highlightNodes.has(node.id)) {
      return '#718096'; // Dimmed color for non-highlighted nodes
    }
    return node.color;
  };

  const getLinkColor = (link: Link) => {
    if (highlightLinks.size && !highlightLinks.has(`${link.source}-${link.target}`)) {
      return '#2d3748'; // Dimmed color for non-highlighted links
    }
    return link.color;
  };

  const handleZoom = (direction: 'in' | 'out') => {
    if (graphRef.current) {
      const currentZoom = graphRef.current.zoom();
      const newZoom = direction === 'in' ? currentZoom * 1.2 : currentZoom / 1.2;
      graphRef.current.zoom(newZoom, 1000);
      setZoomLevel(newZoom);
    }
  };

  return (
    <div className="h-screen flex">
      {/* Controls Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 p-6">
        <div className="space-y-6">
          {/* Search */}
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search nodes..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Filters */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Filters</h3>
            <div className="space-y-2">
              {Object.entries(filters).map(([key, value]) => (
                <label key={key} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={() => setFilters(prev => ({
                      ...prev,
                      [key]: !prev[key]
                    }))}
                    className="rounded text-blue-600"
                  />
                  <span className="text-sm capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Legend</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-blue-500" />
                <span className="text-sm">Agents</span>
              </div>
              <div className="flex items-center gap-2">
                <Workflow className="w-4 h-4 text-purple-500" />
                <span className="text-sm">Tasks</span>
              </div>
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-pink-500" />
                <span className="text-sm">Ideas</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-green-500" />
                <span className="text-sm">Skills</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Graph Visualization */}
      <div className="flex-1 relative bg-gray-900">
        <ForceGraph3D
          ref={graphRef}
          graphData={graphData}
          nodeLabel="name"
          nodeColor={node => getNodeColor(node as Node)}
          linkColor={link => getLinkColor(link as Link)}
          nodeRelSize={6}
          linkDirectionalParticles={2}
          linkDirectionalParticleSpeed={0.01}
          onNodeClick={handleNodeClick}
          enableNodeDrag={false}
          enableNavigationControls={true}
          showNavInfo={false}
          nodeThreeObject={(node: Node) => {
            const sprite = new SpriteText(node.name);
            sprite.color = node.color;
            sprite.textHeight = 8;
            return sprite;
          }}
        />

        {/* Zoom Controls */}
        <div className="absolute bottom-6 right-6 flex flex-col gap-2">
          <button
            onClick={() => handleZoom('in')}
            className="p-2 bg-white rounded-lg shadow-lg hover:bg-gray-50"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleZoom('out')}
            className="p-2 bg-white rounded-lg shadow-lg hover:bg-gray-50"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              if (graphRef.current) {
                graphRef.current.zoomToFit(1000);
              }
            }}
            className="p-2 bg-white rounded-lg shadow-lg hover:bg-gray-50"
          >
            <Maximize2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Node Details Panel */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 100, opacity: 0 }}
            className="w-96 bg-white border-l border-gray-200 p-6 overflow-y-auto"
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">{selectedNode.name}</h2>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Type</h3>
                <div className="flex items-center gap-2">
                  {selectedNode.type === 'agent' && <Brain className="w-4 h-4 text-blue-500" />}
                  {selectedNode.type === 'task' && <Workflow className="w-4 h-4 text-purple-500" />}
                  {selectedNode.type === 'idea' && <Lightbulb className="w-4 h-4 text-pink-500" />}
                  {selectedNode.type === 'skill' && <FileText className="w-4 h-4 text-green-500" />}
                  <span className="capitalize">{selectedNode.type}</span>
                </div>
              </div>

              {selectedNode.data && (
                <>
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Details</h3>
                    <pre className="text-sm bg-gray-50 p-3 rounded-lg overflow-x-auto">
                      {JSON.stringify(selectedNode.data, null, 2)}
                    </pre>
                  </div>

                  {selectedNode.data.emotionalContext && filters.emotionalContext && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">
                        Emotional Context
                      </h3>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Urgency</span>
                          <span>{selectedNode.data.emotionalContext.urgency}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Sentiment</span>
                          <span>{selectedNode.data.emotionalContext.sentiment}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedNode.data.xp && filters.xpData && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">
                        XP Data
                      </h3>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Current XP</span>
                          <span>{selectedNode.data.xp}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Level</span>
                          <span>{Math.floor(selectedNode.data.xp / 1000) + 1}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}