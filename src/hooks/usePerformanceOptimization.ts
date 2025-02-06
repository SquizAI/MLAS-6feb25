import { useCallback, useRef, useEffect } from 'react';
import { logger } from '../lib/logger';

interface CacheConfig {
  maxSize?: number;
  ttl?: number;
}

interface PerformanceMetrics {
  fps: number;
  memory: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
  };
  timing: {
    loadTime: number;
    renderTime: number;
  };
}

export function usePerformanceOptimization(config: CacheConfig = {}) {
  const cache = useRef(new Map());
  const renderTimes = useRef<number[]>([]);
  const frameCount = useRef(0);
  const lastFrameTime = useRef(performance.now());

  // Memory management
  const cleanCache = useCallback(() => {
    if (cache.current.size > (config.maxSize || 1000)) {
      const entries = Array.from(cache.current.entries());
      entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
      
      // Remove oldest entries
      entries.slice(0, Math.floor(entries.length * 0.2)).forEach(([key]) => {
        cache.current.delete(key);
      });

      logger.debug({ 
        cacheSize: cache.current.size 
      }, 'Cache cleaned');
    }
  }, [config.maxSize]);

  // Memoization with TTL
  const memoize = useCallback(<T>(
    fn: (...args: any[]) => T,
    ttl: number = config.ttl || 5000
  ) => {
    return (...args: any[]): T => {
      const key = JSON.stringify(args);
      const cached = cache.current.get(key);

      if (cached && Date.now() - cached.timestamp < ttl) {
        return cached.value;
      }

      const value = fn(...args);
      cache.current.set(key, {
        value,
        timestamp: Date.now(),
        lastAccessed: Date.now(),
      });

      cleanCache();
      return value;
    };
  }, [cleanCache, config.ttl]);

  // Frame rate monitoring
  const measureFrameRate = useCallback(() => {
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

  // Render time tracking
  const trackRenderTime = useCallback(() => {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      renderTimes.current.push(duration);
      
      // Keep last 100 measurements
      if (renderTimes.current.length > 100) {
        renderTimes.current.shift();
      }

      if (duration > 16.67) { // 60fps threshold
        logger.warn({ 
          renderTime: duration 
        }, 'Slow render detected');
      }
    };
  }, []);

  // Get performance metrics
  const getMetrics = useCallback((): PerformanceMetrics => {
    const memory = (performance as any).memory || {
      usedJSHeapSize: 0,
      totalJSHeapSize: 0,
    };

    return {
      fps: frameCount.current,
      memory: {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
      },
      timing: {
        loadTime: performance.timing?.loadEventEnd - performance.timing?.navigationStart || 0,
        renderTime: renderTimes.current.reduce((a, b) => a + b, 0) / renderTimes.current.length,
      },
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cache.current.clear();
      renderTimes.current = [];
    };
  }, []);

  return {
    memoize,
    trackRenderTime,
    measureFrameRate,
    getMetrics,
    clearCache: () => cache.current.clear(),
  };
}