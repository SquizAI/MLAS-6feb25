import React, { useEffect, useRef, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { useRealtimeUpdates } from '../../hooks/useRealtimeUpdates';
import { Brain, FileText, CheckCircle2, Lightbulb } from 'lucide-react';
import { logger } from '../../lib/logger';

interface Node {
  id: string;
  name: string;
  type: 'agent' | 'task' | 'idea' | 'skill';
  val: number;
}

interface Link {
  source: string;
  target: string;
  value: number;
}

export default function KnowledgePreview() {
  const graphRef = useRef<any>();
  const [graphData, setGraphData] = useState<{ nodes: Node[]; links: Link[] }>({ nodes: [], links: [] });
  
  // Subscribe to real-time updates
  const { data: updates } = useRealtimeUpdates({
    tables: ['agent_interactions'],
    event: '*'
  });

  useEffect(() => {
    if (!updates) return;

    // Create nodes map to ensure all nodes exist before creating links
    const nodesMap = new Map();
    
    // Transform data into graph format
    const nodes: Node[] = [];
    const links: Link[] = [];

    // Process updates and update graph data
    updates.forEach(update => {
      // First pass: create all nodes
      const agentNode = {
          id: update.agent_id,
          name: update.agent_id.split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' '),
          type: 'agent',
          group: 'agents',
          val: 20,
          color: '#3b82f6',
          data: update
      };
      
      if (!nodesMap.has(agentNode.id)) {
        nodesMap.set(agentNode.id, agentNode);
        nodes.push(agentNode);
      }

      if (update.content) {
        const taskNode = {
            id: update.id,
            name: update.content.substring(0, 20) + '...',
            type: 'task',
            val: 15,
            color: '#8b5cf6',
            data: update
        };

        if (!nodesMap.has(taskNode.id)) {
          nodesMap.set(taskNode.id, taskNode);
          nodes.push(taskNode);
        }

        // Only create links between existing nodes
        if (nodesMap.has(update.agent_id) && nodesMap.has(update.id)) {
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

  const getNodeColor = (node: Node) => {
    switch (node.type) {
      case 'agent': return '#3b82f6';  // blue
      case 'task': return '#8b5cf6';   // purple
      case 'idea': return '#ec4899';   // pink
      case 'skill': return '#10b981';  // green
      default: return '#6b7280';       // gray
    }
  };

  const getNodeIcon = (node: Node) => {
    switch (node.type) {
      case 'agent': return Brain;
      case 'task': return CheckCircle2;
      case 'idea': return Lightbulb;
      case 'skill': return FileText;
      default: return Brain;
    }
  };

  return (
    <div className="relative w-full h-full min-h-[300px] bg-gray-900/50 rounded-lg border border-gray-700/50">
      <ForceGraph2D
        ref={graphRef}
        graphData={graphData}
        nodeColor={node => getNodeColor(node as Node)}
        nodeLabel={node => (node as Node).name}
        linkColor={() => '#4b5563'}
        linkWidth={2}
        nodeCanvasObject={(node, ctx, globalScale) => {
          const { x, y } = node;
          const size = 12;
          
          // Draw node background
          ctx.beginPath();
          ctx.arc(x!, y!, size, 0, 2 * Math.PI);
          ctx.fillStyle = getNodeColor(node as Node);
          ctx.fill();

          // Draw icon (simplified representation)
          ctx.fillStyle = '#ffffff';
          ctx.font = '10px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText((node as Node).type[0].toUpperCase(), x!, y!);

          // Draw label if zoomed in
          if (globalScale >= 1.5) {
            ctx.font = '8px Arial';
            ctx.fillStyle = '#9ca3af';
            ctx.fillText((node as Node).name, x!, y! + size + 8);
          }
        }}
        linkDirectionalParticles={2}
        linkDirectionalParticleSpeed={0.005}
        cooldownTicks={100}
        onNodeClick={(node) => {
          const distance = 40;
          const distRatio = 1 + distance/Math.hypot(node.x || 0, node.y || 0);
          if (graphRef.current) {
            const fg = graphRef.current;
            fg.centerAt(node.x, node.y, 1000);
            fg.zoom(2, 1000);
          }
        }}
      />
    </div>
  );
}