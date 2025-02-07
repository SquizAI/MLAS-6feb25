import React from 'react';
import { Brain, CheckCircle2, Zap, GitBranch } from 'lucide-react';
import { motion } from 'framer-motion';

interface MetricsCardProps {
  title: string;
  value: number | string;
  icon: 'agents' | 'success' | 'health' | 'nodes';
  trend?: {
    value: number;
    label: string;
  };
  loading?: boolean;
}

export default function MetricsCard({ title, value, icon, trend, loading }: MetricsCardProps) {
  const getIcon = () => {
    switch (icon) {
      case 'agents':
        return <Brain className="w-6 h-6 text-blue-400" />;
      case 'success':
        return <CheckCircle2 className="w-6 h-6 text-purple-400" />;
      case 'health':
        return <Zap className="w-6 h-6 text-green-400" />;
      case 'nodes':
        return <GitBranch className="w-6 h-6 text-yellow-400" />;
    }
  };

  const getIconBackground = () => {
    switch (icon) {
      case 'agents':
        return 'bg-blue-600/20';
      case 'success':
        return 'bg-purple-600/20';
      case 'health':
        return 'bg-green-600/20';
      case 'nodes':
        return 'bg-yellow-600/20';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex items-center gap-3"
    >
      <div className={`w-12 h-12 rounded-xl ${getIconBackground()} flex items-center justify-center`}>
        {getIcon()}
      </div>
      <div>
        <p className="text-sm text-gray-400">{title}</p>
        {loading ? (
          <div className="h-8 w-16 bg-gray-700 animate-pulse rounded" />
        ) : (
          <p className="text-2xl font-bold text-white">{value}</p>
        )}
        {trend && (
          <p className={`text-sm ${
            trend.value > 0 ? 'text-green-400' : 'text-red-400'
          }`}>
            {trend.value > 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
          </p>
        )}
      </div>
    </motion.div>
  );
}