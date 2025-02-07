import React from 'react';
import { Brain, AlertTriangle, Info, HelpCircle } from 'lucide-react';

// Color System
export const colors = {
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
  },
  secondary: {
    50: '#faf5ff',
    100: '#f3e8ff',
    500: '#a855f7',
    600: '#9333ea',
    700: '#7e22ce',
  },
  success: {
    50: '#f0fdf4',
    500: '#22c55e',
  },
  warning: {
    50: '#fffbeb',
    500: '#f59e0b',
  },
  error: {
    50: '#fef2f2',
    500: '#ef4444',
  },
  neutral: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
};

// Typography
export const Typography = {
  H1: ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
    <h1 className={`text-3xl font-bold text-neutral-900 ${className}`}>
      {children}
    </h1>
  ),
  H2: ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
    <h2 className={`text-2xl font-semibold text-neutral-900 ${className}`}>
      {children}
    </h2>
  ),
  H3: ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
    <h3 className={`text-xl font-semibold text-neutral-900 ${className}`}>
      {children}
    </h3>
  ),
};

// Button variants
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading,
  icon,
  className = '',
  ...props
}: ButtonProps) => {
  const baseStyles = 'inline-flex items-center justify-center gap-2 font-medium transition-all rounded-lg';
  
  const variantStyles = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700',
    secondary: 'bg-secondary-600 text-white hover:bg-secondary-700',
    outline: 'border border-neutral-300 text-neutral-700 hover:bg-neutral-50',
    ghost: 'text-neutral-600 hover:bg-neutral-100',
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${
        loading ? 'opacity-50 cursor-not-allowed' : ''
      } ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <>
          {icon}
          {children}
        </>
      )}
    </button>
  );
};

// Card component
interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card = ({ children, className = '', padding = 'md' }: CardProps) => {
  const paddingStyles = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div className={`bg-white rounded-lg border border-neutral-200 shadow-sm ${paddingStyles[padding]} ${className}`}>
      {children}
    </div>
  );
};

// Tooltip component
interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'right' | 'bottom' | 'left';
}

export const Tooltip = ({ content, children, position = 'top' }: TooltipProps) => {
  const positionStyles = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  };

  return (
    <div className="relative group">
      {children}
      <div className={`absolute ${positionStyles[position]} hidden group-hover:block z-50`}>
        <div className="bg-neutral-800 text-white text-sm px-2 py-1 rounded whitespace-nowrap">
          {content}
        </div>
      </div>
    </div>
  );
};

// Alert component
interface AlertProps {
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  onClose?: () => void;
}

export const Alert = ({ type, title, message, onClose }: AlertProps) => {
  const styles = {
    info: {
      bg: 'bg-primary-50',
      border: 'border-primary-500',
      text: 'text-primary-700',
      icon: <Info className="w-5 h-5" />,
    },
    success: {
      bg: 'bg-success-50',
      border: 'border-success-500',
      text: 'text-success-700',
      icon: <Brain className="w-5 h-5" />,
    },
    warning: {
      bg: 'bg-warning-50',
      border: 'border-warning-500',
      text: 'text-warning-700',
      icon: <AlertTriangle className="w-5 h-5" />,
    },
    error: {
      bg: 'bg-error-50',
      border: 'border-error-500',
      text: 'text-error-700',
      icon: <AlertTriangle className="w-5 h-5" />,
    },
  };

  return (
    <div className={`${styles[type].bg} border-l-4 ${styles[type].border} p-4 rounded-lg`}>
      <div className="flex items-start gap-3">
        <div className={styles[type].text}>{styles[type].icon}</div>
        <div className="flex-1">
          <h4 className={`text-sm font-medium ${styles[type].text}`}>{title}</h4>
          <p className="mt-1 text-sm opacity-90">{message}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-500"
          >
            <span className="sr-only">Close</span>
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

// Help system components
interface HelpTipProps {
  content: string;
  placement?: 'top' | 'right' | 'bottom' | 'left';
}

export const HelpTip = ({ content, placement = 'right' }: HelpTipProps) => (
  <Tooltip content={content} position={placement}>
    <button className="text-neutral-400 hover:text-neutral-500">
      <HelpCircle className="w-4 h-4" />
    </button>
  </Tooltip>
);

// Progress indicators
interface ProgressProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  type?: 'line' | 'circle';
}

export const Progress = ({
  value,
  max = 100,
  size = 'md',
  showLabel = true,
  type = 'line',
}: ProgressProps) => {
  const percentage = Math.round((value / max) * 100);

  const sizeStyles = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  if (type === 'line') {
    return (
      <div className="space-y-1">
        {showLabel && (
          <div className="flex justify-between text-sm text-neutral-600">
            <span>Progress</span>
            <span>{percentage}%</span>
          </div>
        )}
        <div className={`w-full bg-neutral-100 rounded-full overflow-hidden ${sizeStyles[size]}`}>
          <div
            className="bg-primary-600 h-full transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  }

  // Circle progress
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg className="transform -rotate-90" width="48" height="48">
        <circle
          className="text-neutral-100"
          strokeWidth="4"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="24"
          cy="24"
        />
        <circle
          className="text-primary-600 transition-all duration-500"
          strokeWidth="4"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="24"
          cy="24"
        />
      </svg>
      {showLabel && (
        <span className="absolute text-sm font-medium">{percentage}%</span>
      )}
    </div>
  );
};