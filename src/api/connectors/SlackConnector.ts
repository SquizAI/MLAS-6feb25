import { BaseConnector, RawData } from './BaseConnector';
import { v4 as uuidv4 } from 'uuid';
import pino from 'pino';
import natural from 'natural';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
    },
  },
});

interface SlackMessage {
  user: string;
  text: string;
  channel: string;
  timestamp: string;
  threadTs?: string;
  reactions?: Array<{
    name: string;
    count: number;
    users: string[];
  }>;
  files?: Array<{
    name: string;
    filetype: string;
    url_private: string;
  }>;
  mentions?: string[];
  edited?: {
    timestamp: string;
    user: string;
  };
}

interface RateLimiter {
  tokens: number;
  lastRefill: number;
  refillRate: number;
  maxTokens: number;
  windowMs: number;
}

export class SlackConnector extends BaseConnector {
  private slackClient: any; // Replace with actual Slack client type
  private rateLimiter: RateLimiter;
  private tokenizer: natural.WordTokenizer;
  private sentimentAnalyzer: natural.SentimentAnalyzer;

  constructor(config: ConnectorConfig) {
    super(config);
    
    // Initialize rate limiter (token bucket algorithm)
    this.rateLimiter = {
      tokens: 50,        // Start with 50 tokens
      lastRefill: Date.now(),
      refillRate: 0.5,   // Tokens per second
      maxTokens: 50,     // Maximum tokens
      windowMs: 60000,   // 1 minute window
    };

    // Initialize NLP components
    this.tokenizer = new natural.WordTokenizer();
    this.sentimentAnalyzer = new natural.SentimentAnalyzer(
      'English',
      natural.PorterStemmer,
      'afinn'
    );
  }

  async connect(): Promise<void> {
    try {
      logger.info({ connector: 'slack' }, 'Connecting to Slack');

      // TODO: Initialize actual Slack client
      // this.slackClient = new WebClient(this.config.credentials.token);
      
      // Verify credentials
      await this.retryWithBackoff(
        async () => {
          // await this.slackClient.auth.test();
          this.isConnected = true;
        },
        'slack_connect'
      );

      logger.info({ connector: 'slack' }, 'Slack connection established');
    } catch (error) {
      logger.error({ error }, 'Slack connection failed');
      throw new Error(`Slack connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async disconnect(): Promise<void> {
    this.isConnected = false;
    logger.info({ connector: 'slack' }, 'Slack connection closed');
  }

  async healthCheck(): Promise<boolean> {
    try {
      if (!this.isConnected) {
        return false;
      }

      // Verify connection is still valid
      await this.retryWithBackoff(
        async () => {
          // await this.slackClient.auth.test();
          return true;
        },
        'health_check'
      );

      return true;
    } catch (error) {
      logger.error({ error }, 'Slack health check failed');
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
      logger.warn({ connector: 'slack' }, 'Rate limit exceeded');
      return false;
    }

    this.rateLimiter.tokens -= 1;
    return true;
  }

  protected async normalizeData(data: SlackMessage): Promise<RawData> {
    if (!await this.checkRateLimit()) {
      throw new Error('Rate limit exceeded');
    }

    return await this.retryWithBackoff(
      async () => {
        // Extract mentions from text
        const mentions = this.extractMentions(data.text);
        
        // Extract URLs from text
        const urls = this.extractUrls(data.text);

        // Clean text content
        const cleanedText = this.cleanMessageText(data.text);

        return {
          id: uuidv4(),
          content: cleanedText,
          source: 'slack',
          timestamp: new Date(parseFloat(data.timestamp) * 1000),
          format: 'text',
          metadata: {
            user: data.user,
            channel: data.channel,
            isThread: !!data.threadTs,
            threadTs: data.threadTs,
            reactions: data.reactions || [],
            hasFiles: !!data.files?.length,
            fileTypes: data.files?.map(f => f.filetype),
            mentions,
            urls,
            isEdited: !!data.edited,
            editTimestamp: data.edited?.timestamp,
          },
          rawData: data,
        };
      },
      'normalize_slack'
    );
  }

  protected async enrichWithMetadata(data: RawData): Promise<RawData> {
    return await this.retryWithBackoff(
      async () => {
        const [sentiment, engagement, urgency] = await Promise.all([
          this.analyzeSentiment(data.content),
          this.calculateEngagement(data),
          this.calculateUrgency(data),
        ]);

        return {
          ...data,
          metadata: {
            ...data.metadata,
            sentiment,
            engagement,
            urgency,
            category: await this.categorizeMessage(data),
            messageType: this.determineMessageType(data),
          },
        };
      },
      'enrich_slack'
    );
  }

  private cleanMessageText(text: string): string {
    return text
      .replace(/<@[A-Z0-9]+>/g, '') // Remove user mentions
      .replace(/<#[A-Z0-9]+\|[^>]+>/g, '') // Remove channel mentions
      .replace(/<[^>]+>/g, '') // Remove URLs and other formatted content
      .replace(/\n+/g, ' ') // Replace multiple newlines with space
      .trim();
  }

  private extractMentions(text: string): string[] {
    const mentionRegex = /<@([A-Z0-9]+)>/g;
    const mentions: string[] = [];
    let match;

    while ((match = mentionRegex.exec(text)) !== null) {
      mentions.push(match[1]);
    }

    return mentions;
  }

  private extractUrls(text: string): string[] {
    const urlRegex = /<(https?:\/\/[^>]+)>/g;
    const urls: string[] = [];
    let match;

    while ((match = urlRegex.exec(text)) !== null) {
      urls.push(match[1]);
    }

    return urls;
  }

  private async analyzeSentiment(content: string): Promise<number> {
    try {
      const tokens = this.tokenizer.tokenize(content);
      const sentiment = this.sentimentAnalyzer.getSentiment(tokens);
      
      // Normalize to [-1, 1] range
      return Math.max(-1, Math.min(1, sentiment));
    } catch (error) {
      logger.error({ error }, 'Sentiment analysis failed');
      return 0; // Neutral sentiment on error
    }
  }

  private calculateEngagement(data: RawData): number {
    const message = data.rawData as SlackMessage;
    let engagement = 0;

    // Reaction engagement
    if (message.reactions) {
      engagement += message.reactions.reduce((sum, reaction) => {
        return sum + (reaction.count * 0.1);
      }, 0);
    }

    // Thread engagement
    if (message.threadTs) {
      engagement += 0.3;
    }

    // Mention engagement
    const mentionCount = (data.metadata.mentions as string[] || []).length;
    engagement += mentionCount * 0.2;

    // File attachment engagement
    if (data.metadata.hasFiles) {
      engagement += 0.2;
    }

    return Math.min(engagement, 1);
  }

  private calculateUrgency(data: RawData): number {
    let urgency = 0;

    // Check for urgent keywords
    const urgentKeywords = ['urgent', 'asap', 'emergency', 'important', 'critical'];
    if (urgentKeywords.some(keyword => data.content.toLowerCase().includes(keyword))) {
      urgency += 0.4;
    }

    // Consider mentions as urgency indicator
    const mentionCount = (data.metadata.mentions as string[] || []).length;
    urgency += mentionCount * 0.1;

    // Consider channel priority
    if (this.config.options?.priorityChannels) {
      const priorityChannels = this.config.options.priorityChannels as string[];
      if (priorityChannels.includes(data.metadata.channel as string)) {
        urgency += 0.3;
      }
    }

    return Math.min(urgency, 1);
  }

  private async categorizeMessage(data: RawData): Promise<string> {
    const content = data.content.toLowerCase();
    
    // Category patterns
    const categories = new Map([
      ['question', ['what', 'how', 'why', 'when', 'where', '?']],
      ['announcement', ['announcing', 'attention', 'fyi', 'heads up']],
      ['request', ['please', 'could you', 'can someone', 'need help']],
      ['problem', ['issue', 'bug', 'error', 'failed', 'broken']],
      ['update', ['update', 'status', 'progress', 'completed']],
    ]);

    for (const [category, keywords] of categories) {
      if (keywords.some(keyword => content.includes(keyword))) {
        return category;
      }
    }

    return 'general';
  }

  private determineMessageType(data: RawData): string {
    const message = data.rawData as SlackMessage;

    if (message.threadTs && message.threadTs === message.timestamp) {
      return 'thread_parent';
    } else if (message.threadTs) {
      return 'thread_reply';
    } else if (data.metadata.hasFiles) {
      return 'file_share';
    } else if ((data.metadata.mentions as string[] || []).length > 0) {
      return 'mention';
    }

    return 'message';
  }
}