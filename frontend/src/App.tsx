import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from './components/error/ErrorBoundary';
import MainLayout from './components/layout/MainLayout';
import DashboardLayout from './components/layout/DashboardLayout';
import { logger } from './lib/logger';

// Pages
import FeaturesPage from './components/pages/FeaturesPage';
import PricingPage from './components/pages/PricingPage';
import FAQPage from './components/pages/FAQPage';
import LandingPage from './components/landing/LandingPage';
import LoginPage from './components/auth/LoginPage';
import SignupPage from './components/auth/SignupPage';
import Overview from './components/dashboard/Overview';
import DocumentManager from './components/documents/DocumentManager';
import IdeasPage from './components/dashboard/IdeasPage';
import TasksPage from './components/dashboard/TasksPage';
import AgentsPage from './components/dashboard/AgentsPage';
import KnowledgePage from './components/dashboard/KnowledgePage';
import AchievementsPage from './components/dashboard/AchievementsPage';
import AnalyticsPage from './components/dashboard/AnalyticsPage';
import SettingsPage from './components/dashboard/SettingsPage';
import AuthGuard from './components/auth/AuthGuard';
import AppHome from './pages/Home';
import AgentAssistantPage from './pages/AgentAssistantPage';

// Log application startup
logger.info('Application starting');

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <ErrorBoundary>
        <BrowserRouter>
          <Routes>
            {/* Public routes with MainLayout */}
            <Route element={<MainLayout variant="landing" />}>
              <Route path="/" element={<LandingPage />} />
              <Route path="/features" element={<FeaturesPage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/faq" element={<FAQPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
            </Route>

            {/* Protected dashboard routes */}
            <Route
              path="/dashboard"
              element={<AuthGuard><DashboardLayout /></AuthGuard>}
            >
              <Route index element={<Overview />} />
              <Route path="documents" element={<DocumentManager />} />
              <Route path="documents/:folderId" element={<DocumentManager />} />
              <Route path="ideas" element={<IdeasPage />} />
              <Route path="tasks" element={<TasksPage />} />
              <Route path="agents" element={<AgentsPage />} />
              <Route path="knowledge" element={<KnowledgePage />} />
              <Route path="achievements" element={<AchievementsPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            {/* New routes */}
            <Route path="/agent-assistant" element={<AgentAssistantPage />} />
            <Route path="/dashboard/agent-testing" element={<AgentAssistantPage />} />

            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ErrorBoundary>
    </div>
  );
}

export default App;