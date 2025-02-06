import React from 'react';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface LoadingProps {
  type?: 'spinner' | 'skeleton' | 'pulse';
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export function Loading({ type = 'spinner', size = 'md', text }: LoadingProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  if (type === 'skeleton') {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-gray-200 rounded"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          <div className="h-4 bg-gray-200 rounded w-4/6"></div>
        </div>
      </div>
    );
  }

  if (type === 'pulse') {
    return (
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="bg-blue-100 rounded-full p-4"
      >
        <div className={`${sizeClasses[size]} bg-blue-500 rounded-full`} />
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <Loader2 className={`${sizeClasses[size]} text-blue-600 animate-spin`} />
      {text && <p className="text-sm text-gray-600">{text}</p>}
    </div>
  );
}