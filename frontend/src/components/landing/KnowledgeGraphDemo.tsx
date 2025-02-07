import React, { useEffect, useRef, useState } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import { useThree, extend } from '@react-three/fiber';
import * as THREE from 'three';

interface Node {
  id: string;
  name: string;
  val: number;
  color: string;
  group: string;
  visible?: boolean;
}

interface Link {
  source: string;
  target: string;
  value: number;
  visible?: boolean;
}

interface GraphData {
  nodes: Node[];
  links: Link[];
}

export default function KnowledgeGraphDemo() {
  const graphRef = useRef();
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleNodes, setVisibleNodes] = useState<Set<string>>(new Set());
  const [scrollProgress, setScrollProgress] = useState(0);
  
  // Full graph data
  const graphData: GraphData = {
    nodes: [
      // Core System Nodes
      { id: 'system', name: 'AI System', val: 25, color: '#8B5CF6', group: 'core', visible: true },
      { id: 'knowledge', name: 'Knowledge Base', val: 20, color: '#8B5CF6', group: 'core', visible: true },
      { id: 'agents', name: 'Agent Network', val: 20, color: '#8B5CF6', group: 'core', visible: true },
      
      // Data Processing Nodes
      { id: 'nlp', name: 'Natural Language Processing', val: 15, color: '#3B82F6', group: 'processing' },
      { id: 'ml', name: 'Machine Learning', val: 15, color: '#3B82F6', group: 'processing' },
      { id: 'analytics', name: 'Analytics Engine', val: 15, color: '#3B82F6', group: 'processing' },
      
      // Agent Nodes
      { id: 'agent1', name: 'Research Agent', val: 12, color: '#10B981', group: 'agent' },
      { id: 'agent2', name: 'Task Manager', val: 12, color: '#10B981', group: 'agent' },
      { id: 'agent3', name: 'Communication Agent', val: 12, color: '#10B981', group: 'agent' },
      
      // Task Nodes
      { id: 'task1', name: 'Data Analysis', val: 10, color: '#F59E0B', group: 'task' },
      { id: 'task2', name: 'Report Generation', val: 10, color: '#F59E0B', group: 'task' },
      { id: 'task3', name: 'Schedule Management', val: 10, color: '#F59E0B', group: 'task' },
      
      // Skill Nodes
      { id: 'skill1', name: 'Problem Solving', val: 8, color: '#EC4899', group: 'skill' },
      { id: 'skill2', name: 'Communication', val: 8, color: '#EC4899', group: 'skill' },
      { id: 'skill3', name: 'Data Analysis', val: 8, color: '#EC4899', group: 'skill' },
      
      // Integration Nodes
      { id: 'int1', name: 'Email Integration', val: 10, color: '#6366F1', group: 'integration' },
      { id: 'int2', name: 'Calendar Integration', val: 10, color: '#6366F1', group: 'integration' },
      { id: 'int3', name: 'Task Management', val: 10, color: '#6366F1', group: 'integration' },
    ],
    links: [
      // Core System Links
      { source: 'system', target: 'knowledge', value: 1 },
      { source: 'system', target: 'agents', value: 1 },
      { source: 'knowledge', target: 'agents', value: 1 },
      
      // Processing Links
      { source: 'system', target: 'nlp', value: 1 },
      { source: 'system', target: 'ml', value: 1 },
      { source: 'system', target: 'analytics', value: 1 },
      
      // Agent Links
      { source: 'agents', target: 'agent1', value: 1 },
      { source: 'agents', target: 'agent2', value: 1 },
      { source: 'agents', target: 'agent3', value: 1 },
      
      // Task Links
      { source: 'agent1', target: 'task1', value: 1 },
      { source: 'agent2', target: 'task2', value: 1 },
      { source: 'agent3', target: 'task3', value: 1 },
      
      // Skill Links
      { source: 'agent1', target: 'skill1', value: 1 },
      { source: 'agent2', target: 'skill2', value: 1 },
      { source: 'agent3', target: 'skill3', value: 1 },
      
      // Integration Links
      { source: 'system', target: 'int1', value: 1 },
      { source: 'system', target: 'int2', value: 1 },
      { source: 'system', target: 'int3', value: 1 },
    ],
  };

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      // Calculate how much of the container is visible
      const visibleHeight = Math.min(rect.bottom, windowHeight) - Math.max(rect.top, 0);
      const progress = Math.max(0, Math.min(1, visibleHeight / rect.height));
      
      setScrollProgress(progress);

      // Determine which nodes should be visible based on scroll progress
      const newVisibleNodes = new Set<string>();
      
      // Core nodes are always visible
      graphData.nodes
        .filter(node => node.group === 'core')
        .forEach(node => newVisibleNodes.add(node.id));
      
      if (progress > 0.2) {
        // Show processing nodes
        graphData.nodes
          .filter(node => node.group === 'processing')
          .forEach(node => newVisibleNodes.add(node.id));
      }
      
      if (progress > 0.4) {
        // Show agent nodes
        graphData.nodes
          .filter(node => node.group === 'agent')
          .forEach(node => newVisibleNodes.add(node.id));
      }
      
      if (progress > 0.6) {
        // Show task nodes
        graphData.nodes
          .filter(node => node.group === 'task')
          .forEach(node => newVisibleNodes.add(node.id));
      }
      
      if (progress > 0.8) {
        // Show all remaining nodes
        graphData.nodes.forEach(node => newVisibleNodes.add(node.id));
      }

      setVisibleNodes(newVisibleNodes);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Filter nodes and links based on visibility
  const visibleGraphData = {
    nodes: graphData.nodes.filter(node => visibleNodes.has(node.id)),
    links: graphData.links.filter(link => 
      visibleNodes.has(link.source as string) && 
      visibleNodes.has(link.target as string)
    ),
  };

  return (
    <div ref={containerRef} className="h-[800px] w-full bg-gray-900 rounded-xl overflow-hidden relative">
      <ForceGraph3D
        ref={graphRef}
        graphData={visibleGraphData}
        nodeLabel="name"
        nodeColor="color"
        nodeVal="val"
        linkWidth={2}
        linkColor={() => '#ffffff30'}
        backgroundColor="#111827"
        showNavInfo={false}
        enableNodeDrag={false}
        enableNavigationControls={true}
        nodeOpacity={1}
        linkOpacity={0.2}
        nodeResolution={16}
        linkDirectionalParticles={2}
        linkDirectionalParticleWidth={2}
        linkDirectionalParticleSpeed={0.005}
        d3VelocityDecay={0.3}
        onNodeClick={(node) => {
          const distance = 40;
          const distRatio = 1 + distance/Math.hypot(node.x, node.y, node.z);

          if (graphRef.current) {
            const { current: fg } = graphRef;
            fg.cameraPosition(
              { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio },
              node,
              1000
            );
          }
        }}
      />
      
      {/* Loading Overlay */}
      <div 
        className={`absolute inset-0 bg-gray-900 transition-opacity duration-1000 pointer-events-none
          ${scrollProgress > 0 ? 'opacity-0' : 'opacity-100'}`}
      >
        <div className="h-full flex items-center justify-center">
          <div className="text-gray-400 text-lg">Scroll to explore the knowledge graph</div>
        </div>
      </div>
    </div>
  );
}