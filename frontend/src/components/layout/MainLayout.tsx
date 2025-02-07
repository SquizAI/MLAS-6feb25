import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../navigation/Navbar';
import Footer from '../landing/Footer';

interface MainLayoutProps {
  variant?: 'landing' | 'app';
  showFooter?: boolean;
}

export default function MainLayout({ 
  variant = 'landing',
  showFooter = true 
}: MainLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <Navbar variant={variant} />

      {/* Main Content */}
      <main className={`flex-1 ${variant === 'app' ? 'bg-gray-50' : 'bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900'}`}>
        <Outlet />
      </main>

      {/* Footer */}
      {showFooter && <Footer />}
    </div>
  );
}