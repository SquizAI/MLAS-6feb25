import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Bell, Menu, Settings, User, LogOut } from 'lucide-react';
import Sidebar from '../dashboard/Sidebar';
import NotificationPanel from '../dashboard/NotificationPanel';
import { useNotifications } from '../../hooks/useNotifications';
import { useAuth } from '../../hooks/useAuth';
import { logger } from '../../lib/logger';

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { notifications, unreadCount } = useNotifications();
  const { signOut } = useAuth();

  logger.debug('Rendering DashboardLayout');

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="bg-gray-900/80 backdrop-blur-lg border-b border-gray-800">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-800 text-gray-300 hover:text-white"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-semibold text-white">Multi-Level Agentic Systems</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative p-2 rounded-lg hover:bg-gray-800 text-gray-300 hover:text-white"
            >
              <Bell className="w-6 h-6" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 w-5 h-5 text-xs font-medium text-white bg-red-500 rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
            <button className="p-2 rounded-lg hover:bg-gray-800 text-gray-300 hover:text-white">
              <Settings className="w-6 h-6" />
            </button>
            <div className="relative group">
              <button className="p-2 rounded-lg hover:bg-gray-800 text-gray-300 hover:text-white">
                <User className="w-6 h-6" />
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg border border-gray-700 py-1 hidden group-hover:block">
                <button
                  onClick={signOut}
                  className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-700 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <Sidebar open={sidebarOpen} />

        {/* Main Content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>

        {/* Notification Panel */}
        <NotificationPanel
          open={notificationsOpen}
          onClose={() => setNotificationsOpen(false)}
          notifications={notifications}
        />
      </div>
    </div>
  );
}