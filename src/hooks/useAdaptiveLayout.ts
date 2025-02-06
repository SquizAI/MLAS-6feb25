import { useState, useEffect, useCallback } from 'react';
import { debounce } from 'lodash';
import { logger } from '../lib/logger';

interface LayoutConfig {
  breakpoints: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  layouts: {
    compact: string;
    normal: string;
    expanded: string;
  };
}

export function useAdaptiveLayout(config: Partial<LayoutConfig> = {}) {
  const [layout, setLayout] = useState('normal');
  const [stress, setStress] = useState(0);
  const [urgentTasks, setUrgentTasks] = useState(0);

  const defaultConfig: LayoutConfig = {
    breakpoints: {
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
    },
    layouts: {
      compact: 'compact',
      normal: 'normal',
      expanded: 'expanded',
    },
    ...config,
  };

  // Debounced layout update to prevent thrashing
  const updateLayout = useCallback(
    debounce(() => {
      const width = window.innerWidth;
      const newLayout = width < defaultConfig.breakpoints.md
        ? defaultConfig.layouts.compact
        : width < defaultConfig.breakpoints.lg
          ? defaultConfig.layouts.normal
          : defaultConfig.layouts.expanded;

      setLayout(newLayout);
      logger.debug({ layout: newLayout }, 'Layout updated');
    }, 150),
    [defaultConfig]
  );

  // Update layout based on window size
  useEffect(() => {
    updateLayout();
    window.addEventListener('resize', updateLayout);
    return () => window.removeEventListener('resize', updateLayout);
  }, [updateLayout]);

  // Update layout based on system stress
  useEffect(() => {
    if (stress > 0.8 || urgentTasks > 5) {
      setLayout(defaultConfig.layouts.compact);
      logger.info({ stress, urgentTasks }, 'Switching to compact layout due to high stress');
    }
  }, [stress, urgentTasks, defaultConfig.layouts]);

  const setSystemStress = useCallback((value: number) => {
    setStress(Math.max(0, Math.min(1, value)));
  }, []);

  const setUrgentTaskCount = useCallback((count: number) => {
    setUrgentTasks(count);
  }, []);

  return {
    layout,
    setSystemStress,
    setUrgentTaskCount,
    isCompact: layout === defaultConfig.layouts.compact,
    isExpanded: layout === defaultConfig.layouts.expanded,
  };
}