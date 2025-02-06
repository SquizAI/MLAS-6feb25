import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Brain } from 'lucide-react';

interface NavbarProps {
  variant?: 'landing' | 'app';
}

export default function Navbar({ variant = 'landing' }: NavbarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-900/80 backdrop-blur-lg border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link
              to={variant === 'app' ? '/dashboard' : '/'}
              className="flex items-center gap-2 group"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500/20 rounded-lg blur group-hover:blur-md transition-all"></div>
                <Brain className="w-8 h-8 text-blue-400 relative" />
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                AI Assistant
              </span>
            </Link>
          </div>

          {/* Navigation Links */}
          {variant === 'landing' && (
            <div className="hidden md:flex items-center gap-8">
              <Link
                to="/features"
                className={`${
                  isActive('/features') ? 'text-white' : 'text-gray-300'
                } hover:text-white transition-colors`}
              >
                Features
              </Link>
              <Link
                to="/pricing"
                className={`${
                  isActive('/pricing') ? 'text-white' : 'text-gray-300'
                } hover:text-white transition-colors`}
              >
                Pricing
              </Link>
              <Link
                to="/faq"
                className={`${
                  isActive('/faq') ? 'text-white' : 'text-gray-300'
                } hover:text-white transition-colors`}
              >
                FAQ
              </Link>
            </div>
          )}

          {/* Auth Buttons */}
          {variant === 'landing' && (
            <div className="flex items-center gap-4">
              <Link
                to="/login"
                className="text-gray-300 hover:text-white px-4 py-2 rounded-lg transition-colors"
              >
                Log in
              </Link>
              <Link
                to="/signup"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-4 py-2 rounded-lg transition-all transform hover:scale-105"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}