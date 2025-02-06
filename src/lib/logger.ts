// Browser-safe logging configuration
const LOG_LEVELS = {
  trace: 10,
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  fatal: 60
} as const;

type LogLevel = keyof typeof LOG_LEVELS;

interface LogEvent {
  level: LogLevel;
  msg: string;
  time: string;
  data?: Record<string, unknown>;
}

class BrowserLogger {
  private level: LogLevel;

  constructor(level: LogLevel = 'info') {
    this.level = level;
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.level];
  }

  private formatMessage(level: LogLevel, message: string, data?: Record<string, unknown>): string {
    const timestamp = new Date().toISOString();
    return JSON.stringify({
      level,
      msg: message,
      time: timestamp,
      ...(data || {})
    });
  }

  private log(level: LogLevel, message: string, data?: Record<string, unknown>) {
    if (!this.shouldLog(level)) return;

    const formattedMessage = this.formatMessage(level, message, data);

    switch (level) {
      case 'trace':
      case 'debug':
        console.debug(formattedMessage);
        break;
      case 'info':
        console.info(formattedMessage);
        break;
      case 'warn':
        console.warn(formattedMessage);
        break;
      case 'error':
      case 'fatal':
        console.error(formattedMessage);
        break;
    }
  }

  trace(data: Record<string, unknown>, message: string) {
    this.log('trace', message, data);
  }

  debug(data: Record<string, unknown>, message: string) {
    this.log('debug', message, data);
  }

  info(data: Record<string, unknown>, message: string) {
    this.log('info', message, data);
  }

  warn(data: Record<string, unknown>, message: string) {
    this.log('warn', message, data);
  }

  error(data: Record<string, unknown>, message: string) {
    this.log('error', message, data);
  }

  fatal(data: Record<string, unknown>, message: string) {
    this.log('fatal', message, data);
  }

  child(bindings: Record<string, unknown>): BrowserLogger {
    return new BrowserLogger(this.level);
  }
}

// Create logger instances
export const logger = new BrowserLogger(import.meta.env.DEV ? 'debug' : 'info');

// Create specialized loggers
export const aiLogger = logger.child({ module: 'ai' });
export const authLogger = logger.child({ module: 'auth' });
export const apiLogger = logger.child({ module: 'api' });
export const dbLogger = logger.child({ module: 'database' });
export const workflowLogger = logger.child({ module: 'workflow' });

// Error tracking
export function trackError(error: Error, context?: Record<string, unknown>) {
  logger.error({
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
      ...context,
    },
    timestamp: new Date().toISOString(),
  }, 'Error occurred');
}

// Performance monitoring
export function trackPerformance(
  operation: string,
  durationMs: number,
  metadata?: Record<string, unknown>
) {
  logger.info({
    type: 'performance',
    operation,
    durationMs,
    ...metadata,
    timestamp: new Date().toISOString(),
  }, 'Performance measurement');
}

// State changes
export function trackStateChange(
  component: string,
  change: string,
  before: unknown,
  after: unknown
) {
  logger.debug({
    type: 'state_change',
    component,
    change,
    before,
    after,
    timestamp: new Date().toISOString(),
  }, 'State changed');
}

// User actions
export function trackUserAction(
  userId: string,
  action: string,
  details?: Record<string, unknown>
) {
  logger.info({
    type: 'user_action',
    userId,
    action,
    ...details,
    timestamp: new Date().toISOString(),
  }, 'User action');
}