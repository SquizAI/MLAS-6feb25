import React from 'react';
import { AlertTriangle, XCircle, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

interface ErrorStateProps {
  type?: 'warning' | 'error' | 'offline';
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function ErrorState({ type = 'error', title, message, action }: ErrorStateProps) {
  const styles = {
    warning: {
      icon: AlertTriangle,
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      iconColor: 'text-yellow-400',
    },
    error: {
      icon: XCircle,
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      iconColor: 'text-red-400',
    },
    offline: {
      icon: RefreshCw,
      bg: 'bg-gray-50',
      border: 'border-gray-200',
      text: 'text-gray-800',
      iconColor: 'text-gray-400',
    },
  };

  const Icon = styles[type].icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${styles[type].bg} ${styles[type].border} border rounded-lg p-4`}
    >
      <div className="flex items-start gap-3">
        <div className={`${styles[type].iconColor} mt-0.5`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h3 className={`text-sm font-medium ${styles[type].text}`}>{title}</h3>
          <p className={`mt-1 text-sm ${styles[type].text} opacity-90`}>{message}</p>
          {action && (
            <button
              onClick={action.onClick}
              className={`mt-3 text-sm font-medium ${styles[type].text} hover:opacity-90`}
            >
              {action.label}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}