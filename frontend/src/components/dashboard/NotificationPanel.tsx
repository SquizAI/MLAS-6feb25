import React from 'react';
import { X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
  timestamp: Date;
  read: boolean;
}

interface NotificationPanelProps {
  open: boolean;
  onClose: () => void;
  notifications: Notification[];
}

export default function NotificationPanel({ 
  open, 
  onClose, 
  notifications 
}: NotificationPanelProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-lg border-l border-gray-200">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold">Notifications</h2>
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="overflow-y-auto h-full pb-20">
        {notifications.map(notification => (
          <div
            key={notification.id}
            className={`
              p-4 border-b border-gray-200
              ${notification.read ? 'bg-white' : 'bg-blue-50'}
            `}
          >
            <div className="flex items-start justify-between">
              <h3 className="font-medium">{notification.title}</h3>
              <span className="text-sm text-gray-500">
                {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-600">{notification.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}