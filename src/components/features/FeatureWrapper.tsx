import React, { useState } from 'react';
import { useFeatureManager } from '../../hooks/useFeatureManager';
import { Loader2, AlertTriangle } from 'lucide-react';

interface FeatureWrapperProps {
  feature: {
    id: string;
    type: 'schedule' | 'meals' | 'travel' | 'email';
    agentId: string;
  };
  children: React.ReactNode;
}

export default function FeatureWrapper({ feature, children }: FeatureWrapperProps) {
  const [error, setError] = useState<Error | null>(null);
  const { handleAction, processing } = useFeatureManager({
    ...feature,
    autoSync: true,
    syncInterval: 300000 // 5 minutes
  });

  const handleFeatureAction = async (action: string, data: any) => {
    try {
      setError(null);
      return await handleAction(action, data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Action failed');
      setError(error);
      throw error;
    }
  };

  return (
    <div className="relative">
      {/* Loading Overlay */}
      {processing && (
        <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-lg shadow-lg">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            <span className="text-gray-600">Processing...</span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            <p className="text-sm font-medium">{error.message}</p>
          </div>
        </div>
      )}

      {/* Feature Content */}
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            onAction: handleFeatureAction
          });
        }
        return child;
      })}
    </div>
  );
}