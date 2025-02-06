import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'right' | 'bottom' | 'left';
  delay?: number;
}

export function Tooltip({ content, children, position = 'top', delay = 300 }: TooltipProps) {
  const [show, setShow] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout>();

  const handleMouseEnter = () => {
    const id = setTimeout(() => setShow(true), delay);
    setTimeoutId(id);
  };

  const handleMouseLeave = () => {
    if (timeoutId) clearTimeout(timeoutId);
    setShow(false);
  };

  const positions = {
    top: '-top-2 left-1/2 -translate-x-1/2 -translate-y-full',
    right: 'top-1/2 -right-2 translate-x-full -translate-y-1/2',
    bottom: '-bottom-2 left-1/2 -translate-x-1/2 translate-y-full',
    left: 'top-1/2 -left-2 -translate-x-full -translate-y-1/2',
  };

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className={`absolute ${positions[position]} z-50 px-2 py-1 text-xs font-medium text-white bg-gray-900 rounded whitespace-nowrap`}
          >
            {content}
            <div 
              className={`absolute w-2 h-2 bg-gray-900 transform rotate-45 ${
                position === 'top' ? 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2' :
                position === 'right' ? 'left-0 top-1/2 -translate-y-1/2 -translate-x-1/2' :
                position === 'bottom' ? 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2' :
                'right-0 top-1/2 -translate-y-1/2 translate-x-1/2'
              }`}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}