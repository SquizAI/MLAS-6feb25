import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css';
import { logger } from './lib/logger';

// Log application startup
logger.info('Application initializing');

const container = document.getElementById('root');

if (!container) {
  throw new Error('Root element not found');
}

try {
  const root = ReactDOM.createRoot(container);
  
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );

  logger.info('Application rendered successfully');
} catch (error) {
  logger.error({ error }, 'Failed to render application');
  throw error;
}