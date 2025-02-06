import { BaseConnector, RawData } from './BaseConnector';
import { v4 as uuidv4 } from 'uuid';
import pino from 'pino';
import { OAuth2Client } from 'google-auth-library';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
    },
  },
});

interface EmailMessage {
  from: string;
  to: string[];
  subject: string;
  body: string;
  timestamp: Date;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }>;
}

export class EmailConnector extends BaseConnector {
  private emailClient: OAuth2Client;
  private rateLimiter: {
    tokens: number;
    lastRefill: number;
    refillRate: number;
    maxTokens: number;
  };

  constructor(config: ConnectorConfig) {
    super(config);
    
    // Initialize rate limiter (token bucket algorithm)
    this.rateLimiter = {
      tokens: 100, // Start with full bucket
      lastRefill: Date.now(),
      refillRate: 1, // Tokens per second
      maxTokens: 100,
    };
  }

  async connect(): Promise<void> {
    try {
      logger.info({ connector: 'email' }, 'Connecting to email service');
      
      this.emailClient = new OAuth2Client({
        clientId: this.config.credentials?.clientId,
        clientSecret: this.config.credentials?.clientSecret,
        redirectUri: this.config.credentials?.redirectUri,
      });

      // Set up authentication
      if (this.config.credentials?.refreshToken) {
        await this.emailClient.setCredentials({
          refresh_token: this.config.credentials.refreshToken,
        });
      }

      this.isConnected = true;
      logger.info({ connector: 'email' }, 'Email connection established');
    } catch (error) {
      logger.error({ error }, 'Email connection failed');
      throw new Error(`Email connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async disconnect(): Promise<void> {
    this.isConnected = false;
    logger.info({ connector: 'email' }, 'Email connection closed');
  }

  async healthCheck(): Promise<boolean> {
    try {
      if (!this.isConnected) {
        return false;
      }

      // Verify token is still valid
      const isValid = await this.emailClient.getAccessToken();
      return !!isValid;
    } catch {
      return false;
    }
  }

  private async checkRateLimit(): Promise<boolean> {
    const now = Date.now();
    const timePassed = (now - this.rateLimiter.lastRefill) / 1000;
    
    // Refill tokens based on time passed
    this.rateLimiter.tokens = Math.min(
      this.rateLimiter.maxTokens,
      this.rateLimiter.tokens + timePassed * this.rateLimiter.refillRate
    );
    
    this.rateLimiter.lastRefill = now;

    if (this.rateLimiter.tokens < 1) {
      logger.warn({ connector: 'email' }, 'Rate limit exceeded');
      throw new Error('Rate limit exceeded');
    }

    this.rateLimiter.tokens -= 1;
    return true;
  }

  protected async normalizeData(data: EmailMessage): Promise<RawData> {
    if (!await this.checkRateLimit()) {
      logger.warn({ connector: 'email' }, 'Rate limit exceeded');
      throw new Error('Rate limit exceeded');
    }

    return await this.retryWithBackoff(
      async () => ({
        id: uuidv4(),
        content: `${data.subject}\n\n${data.body}`,
        source: 'email',
        timestamp: data.timestamp,
        format: 'text',
        metadata: {
          from: data.from,
          to: data.to,
          hasAttachments: !!data.attachments?.length,
        },
        rawData: data,
      }),
      'normalize_email'
    );
  }

  protected async enrichWithMetadata(data: RawData): Promise<RawData> {
    return await this.retryWithBackoff(
      async () => ({
        ...data,
        metadata: {
          ...data.metadata,
          priority: this.calculatePriority(data),
          category: await this.categorizeEmail(data),
        },
      }),
      'enrich_email'
    );
  }

  private calculatePriority(data: RawData): number {
    const email = data.rawData as EmailMessage;
    let priority = 0;

    const urgentKeywords = ['urgent', 'asap', 'emergency', 'important'];
    const subject = email.subject.toLowerCase();
    
    if (urgentKeywords.some(keyword => subject.includes(keyword))) {
      priority += 0.5;
    }

    // Consider sender importance (could be configurable)
    if (this.config.options?.importantSenders) {
      const importantSenders = this.config.options.importantSenders as string[];
      if (importantSenders.includes(email.from)) {
        priority += 0.3;
      }
    }

    return Math.min(priority, 1);
  }

  private async categorizeEmail(data: RawData): Promise<string> {
    const email = data.rawData as EmailMessage;
    
    // Simple keyword-based categorization
    const categories = new Map([
      ['meeting', ['meeting', 'schedule', 'calendar', 'appointment']],
      ['task', ['task', 'todo', 'action', 'deadline']],
      ['report', ['report', 'analysis', 'metrics', 'performance']],
      ['alert', ['alert', 'warning', 'error', 'issue']],
    ]);

    const content = `${email.subject} ${email.body}`.toLowerCase();
    
    for (const [category, keywords] of categories) {
      if (keywords.some(keyword => content.includes(keyword))) {
        return category;
      }
    }

    return 'general';
  }
}