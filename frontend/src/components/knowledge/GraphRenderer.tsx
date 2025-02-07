import React, { useRef, useEffect, useMemo } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import { useGraphOptimization } from '../../hooks/useGraphOptimization';
import { logger } from '../../lib/logger';

interface GraphRendererProps {
  data: any;
  onNodeClick: (node: any) => void;
  highlightNodes: Set<string>;
  highlightLinks: Set<string>;
}

export default function GraphRenderer({
  data,
  onNodeClick,
  highlightNodes,
  highlightLinks
}: GraphRendererProps) {
  const graphRef = useRef<any>();
  const {
    cache,
    queueUpdate,
    processBatch,
    optimizeLayout,
    measurePerformance,
    cleanCache
  } = useGraphOptimization();

  // Memoize node objects
  const nodes = useMemo(() => {
    return data.nodes.map(node => {
      const cached = cache.nodes.get(node.id);
      if (cached) {
        cached.lastAccessed = Date.now();
        return cached;
      }

      const newNode = {
        ...node,
        __threeObj: null,
        lastAccessed: Date.now()
      };
      cache.nodes.set(node.id, newNode);
      return newNode;
    });
  }, [data.nodes, cache.nodes]);

  // Memoize link objects
  const links = useMemo(() => {
    return data.links.map(link => {
      const linkId = `${link.source}-${link.target}`;
      const cached = cache.links.get(linkId);
      if (cached) {
        cached.lastAccessed = Date.now();
        return cached;
      }

      const newLink = {
        ...link,
        lastAccessed: Date.now()
      };
      cache.links.set(linkId, newLink);
      return newLink;
    });
  }, [data.links, cache.links]);

  // Optimize layout
  useEffect(() => {
    const positions = optimizeLayout(nodes, links);
    positions.forEach((pos, nodeId) => {
      const node = cache.nodes.get(nodeId);
      if (node) {
        node.x = pos.x;
        node.y = pos.y;
        node.z = pos.z;
        queueUpdate(nodeId);
      }
    });
  }, [nodes, links, optimizeLayout, queueUpdate]);

  // Process updates in batches
  useEffect(() => {
    let animationFrame: number;
    
    const updateFrame = () => {
      const updates = processBatch();
      if (updates?.length) {
        updates.forEach(nodeId => {
          const node = cache.nodes.get(nodeId);
          if (node?.__threeObj) {
            node.__threeObj.position.set(node.x, node.y, node.z);
          }
        });
      }
      
      const fps = measurePerformance();
      if (fps && fps < 30) {
        cleanCache();
      }
      
      animationFrame = requestAnimationFrame(updateFrame);
    };

    animationFrame = requestAnimationFrame(updateFrame);
    return () => cancelAnimationFrame(animationFrame);
  }, [processBatch, measurePerformance, cleanCache]);

  return (
    <ForceGraph3D
      ref={graphRef}
      graphData={{ nodes, links }}
      nodeLabel="name"
      nodeColor={node => 
        highlightNodes.size === 0 || highlightNodes.has(node.id) 
          ? node.color 
          : '#718096'
      }
      linkColor={link => 
        highlightLinks.size === 0 || highlightLinks.has(`${link.source}-${link.target}`)
          ? link.color
          : '#2d3748'
      }
      nodeRelSize={6}
      linkDirectionalParticles={2}
      linkDirectionalParticleSpeed={0.01}
      onNodeClick={onNodeClick}
      enableNodeDrag={false}
      enableNavigationControls={true}
      showNavInfo={false}
      nodeThreeObject={(node: any) => {
        if (node.__threeObj) return node.__threeObj;

        const sprite = new SpriteText(node.name);
        sprite.color = node.color;
        sprite.textHeight = 8;
        node.__threeObj = sprite;
        return sprite;
      }}
      onRenderFramePre={(ctx) => {
        const fps = measurePerformance();
        if (fps && fps < 30) {
          logger.warn({ fps }, 'Low frame rate detected');
        }
      }}
    />
  );
}