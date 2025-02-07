import { useCallback, useRef, useEffect } from 'react';
import { logger } from '../lib/logger';

interface CacheConfig {
  maxSize?: number;
  ttl?: number;
}

interface GraphCache {
  nodes: Map<string, any>;
  links: Map<string, any>;
  layouts: Map<string, any>;
}

export function useGraphOptimization(config: CacheConfig = {}) {
  const cache = useRef<GraphCache>({
    nodes: new Map(),
    links: new Map(),
    layouts: new Map()
  });
  const frameCount = useRef(0);
  const lastFrameTime = useRef(performance.now());
  const renderQueue = useRef<Set<string>>(new Set());

  // Cache management
  const cleanCache = useCallback(() => {
    const maxEntries = config.maxSize || 1000;
    ['nodes', 'links', 'layouts'].forEach(key => {
      const cacheMap = cache.current[key as keyof GraphCache];
      if (cacheMap.size > maxEntries) {
        const entries = Array.from(cacheMap.entries());
        entries
          .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed)
          .slice(0, Math.floor(entries.length * 0.2))
          .forEach(([key]) => cacheMap.delete(key));
      }
    });
  }, [config.maxSize]);

  // Batch processing for node updates
  const processBatch = useCallback(() => {
    if (renderQueue.current.size === 0) return;
    
    const batch = Array.from(renderQueue.current);
    renderQueue.current.clear();
    
    return batch;
  }, []);

  // Layout optimization
  const optimizeLayout = useCallback((nodes: any[], links: any[]) => {
    // Calculate optimal node positions
    const positions = new Map();
    const nodeStrength = -1000;
    const linkDistance = 100;
    
    // Force-directed layout optimization
    nodes.forEach(node => {
      const connectedLinks = links.filter(
        link => link.source === node.id || link.target === node.id
      );
      
      const force = {
        x: 0,
        y: 0,
        z: 0
      };

      // Calculate repulsive forces
      nodes.forEach(otherNode => {
        if (node.id === otherNode.id) return;
        
        const dx = (node.x || 0) - (otherNode.x || 0);
        const dy = (node.y || 0) - (otherNode.y || 0);
        const dz = (node.z || 0) - (otherNode.z || 0);
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        if (distance === 0) return;
        
        const strength = nodeStrength / (distance * distance);
        force.x += dx * strength;
        force.y += dy * strength;
        force.z += dz * strength;
      });

      // Calculate attractive forces
      connectedLinks.forEach(link => {
        const target = link.target.id || link.target;
        const source = link.source.id || link.source;
        const otherNode = target === node.id ? source : target;
        
        const targetNode = nodes.find(n => n.id === otherNode);
        if (!targetNode) return;
        
        const dx = (targetNode.x || 0) - (node.x || 0);
        const dy = (targetNode.y || 0) - (node.y || 0);
        const dz = (targetNode.z || 0) - (node.z || 0);
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        if (distance === 0) return;
        
        const strength = (distance - linkDistance) / distance;
        force.x += dx * strength;
        force.y += dy * strength;
        force.z += dz * strength;
      });

      positions.set(node.id, {
        x: (node.x || 0) + force.x * 0.1,
        y: (node.y || 0) + force.y * 0.1,
        z: (node.z || 0) + force.z * 0.1
      });
    });

    return positions;
  }, []);

  // Performance monitoring
  const measurePerformance = useCallback(() => {
    const now = performance.now();
    const delta = now - lastFrameTime.current;
    frameCount.current++;

    if (delta >= 1000) {
      const fps = Math.round((frameCount.current * 1000) / delta);
      
      if (fps < 30) {
        logger.warn({ fps }, 'Low frame rate detected');
      }

      frameCount.current = 0;
      lastFrameTime.current = now;
      return fps;
    }
    return null;
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      cache.current.nodes.clear();
      cache.current.links.clear();
      cache.current.layouts.clear();
      renderQueue.current.clear();
    };
  }, []);

  return {
    cache: cache.current,
    queueUpdate: (nodeId: string) => renderQueue.current.add(nodeId),
    processBatch,
    optimizeLayout,
    measurePerformance,
    cleanCache
  };
}