import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Bell, Menu, Settings, User, LogOut } from 'lucide-react';
import Sidebar from './Sidebar';
import NotificationPanel from './NotificationPanel';
import { useNotifications } from '../../hooks/useNotifications';
import { useAuth } from '../../hooks/useAuth';
import { logger } from '../../lib/logger';

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const [notificationsOpen, setNotificationsOpen] = React.useState(false);
  const { notifications, unreadCount } = useNotifications();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  logger.debug('Rendering DashboardLayout');

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      logger.error({ error }, 'Failed to sign out');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-semibold text-gray-900">Multi-Level Agentic Systems</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative p-2 rounded-lg hover:bg-gray-100"
            >
              <Bell className="w-6 h-6" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 w-5 h-5 text-xs font-medium text-white bg-red-500 rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
            <button className="p-2 rounded-lg hover:bg-gray-100">
              <Settings className="w-6 h-6" />
            </button>
            <div className="relative group">
              <button className="p-2 rounded-lg hover:bg-gray-100">
                <User className="w-6 h-6" />
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 hidden group-hover:block">
                <button
                  onClick={handleSignOut}
                  className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center gap-2"
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