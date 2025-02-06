import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { logger } from './lib/logger';

// Log application startup
logger.info('Application initializing');

const container = document.getElementById('root');

if (!container) {
  throw new Error('Root element not found');
}

try {
  const root = createRoot(container);
  
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );

  logger.info('Application rendered successfully');
} catch (error) {
  logger.error({ error }, 'Failed to render application');
  throw error;
}