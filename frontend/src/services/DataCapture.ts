import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { Redis } from 'ioredis';
import pino from 'pino';
import { tokenize, analyzeSentiment, extractKeywords } from '../lib/nlp/sentiment';
import { EmotionalProcessingUnit } from './EmotionalProcessing';
import type { Idea } from '../lib/types';
import { BaseConnector, RawData } from './connectors/BaseConnector';
import { EmailConnector } from './connectors/EmailConnector';
import { SlackConnector } from './connectors/SlackConnector';

interface DataCaptureConfig {
  connectors: {
    email?: {
      credentials: Record<string, string>;
      options?: Record<string, unknown>;
    };
    slack?: {
      credentials: Record<string, string>;
      options?: Record<string, unknown>;
    };
  };
  redis: {
    host: string;
    port: number;
    password?: string;
  };
}

// Initialize logger
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
    },
  },
});

export class DataCaptureService extends EventEmitter {
  private connectors: Map<string, BaseConnector>;
  private redis: Redis;
  private isProcessing: boolean = false;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private epu: EmotionalProcessingUnit;
  private afinn: Record<string, number>;
  private retryDelays: number[] = [1000, 5000, 15000, 30000]; // Retry delays in ms

  constructor(private config: DataCaptureConfig) {
    super();
    this.epu = new EmotionalProcessingUnit(this.knowledgeGraph);
    this.connectors = new Map();
    this.initializeConnectors();
    this.setupRedis();
    this.setupHealthCheck();
    this.afinn = this.loadAfinnLexicon();
  }

  private loadAfinnLexicon(): Record<string, number> {
    // Simplified AFINN lexicon with common emotional words
    return {
      'good': 3,
      'great': 4,
      'excellent': 5,
      'bad': -3,
      'terrible': -4,
      'awful': -5,
      'happy': 4,
      'sad': -4,
      'angry': -4,
      'excited': 3,
      'love': 4,
      'hate': -4,
      'wonderful': 4,
      'horrible': -4,
      'amazing': 4,
      'urgent': -2,
      'important': 2,
      'critical': -2,
      'success': 3,
      'failure': -3,
      'help': 2,
      'problem': -2,
      'easy': 2,
      'difficult': -2,
      'perfect': 5,
      'worst': -5
    };
  }

  private analyzeSentiment(tokens: string[]): number {
    let total = 0;
    let words = 0;
    
    tokens.forEach(token => {
      const word = token.toLowerCase();
      if (this.afinn[word]) {
        total += this.afinn[word];
        words++;
      }
    });
    
    return words > 0 ? Math.max(-1, Math.min(1, total / (words * 5))) : 0;
  }

  private initializeConnectors() {
    if (this.config.connectors.email) {
      const emailConnector = new EmailConnector({
        id: uuidv4(),
        type: 'email',
        credentials: this.config.connectors.email.credentials,
        options: this.config.connectors.email.options,
      });
      this.connectors.set('email', emailConnector);
    }

    if (this.config.connectors.slack) {
      const slackConnector = new SlackConnector({
        id: uuidv4(),
        type: 'slack',
        credentials: this.config.connectors.slack.credentials,
        options: this.config.connectors.slack.options,
      });
      this.connectors.set('slack', slackConnector);
    }
  }

  private setupRedis() {
    this.redis = new Redis({
      host: this.config.redis.host,
      port: this.config.redis.port,
      password: this.config.redis.password,
      retryStrategy: (times: number) => {
        const delay = this.retryDelays[times - 1] || this.retryDelays[this.retryDelays.length - 1];
        logger.warn({ times, delay }, 'Redis connection retry');
        return delay;
      },
    });

    this.redis.on('error', (error) => {
      logger.error({ error }, 'Redis error occurred');
      this.emit('error', error);
    });

    this.redis.on('connect', () => {
      logger.info('Redis connected successfully');
    });
  }

  private setupHealthCheck() {
    this.healthCheckInterval = setInterval(async () => {
      for (const [id, connector] of this.connectors) {
        try {
          const isHealthy = await connector.healthCheck();
          if (!isHealthy) {
            logger.warn({ connector: id }, 'Connector unhealthy');
            this.emit('connector:unhealthy', { id, type: connector.constructor.name });
            await this.reconnectConnector(id);
          }
        } catch (error) {
          logger.error({ error, connector: id }, 'Health check failed');
          this.emit('error', error);
        }
      }
    }, 30000);
  }

  private async reconnectConnector(id: string) {
    const connector = this.connectors.get(id);
    if (!connector) return;

    for (let attempt = 0; attempt < this.retryDelays.length; attempt++) {
      try {
        await connector.disconnect();
        await connector.connect();
        logger.info({ connector: id }, 'Connector reconnected successfully');
        this.emit('connector:reconnected', { id, type: connector.constructor.name });
        return;
      } catch (error) {
        logger.error({ error, connector: id, attempt }, 'Reconnection attempt failed');
        await new Promise(resolve => setTimeout(resolve, this.retryDelays[attempt]));
      }
    }
    
    logger.error({ connector: id }, 'All reconnection attempts failed');
    this.emit('error', new Error(`Failed to reconnect ${id} after multiple attempts`));
  }

  async start() {
    try {
      // Connect all connectors
      for (const [id, connector] of this.connectors) {
        try {
          await connector.connect();
          logger.info({ connector: id }, 'Connector started successfully');
          this.emit('connector:connected', { id, type: connector.constructor.name });
        } catch (error) {
          logger.error({ error, connector: id }, 'Failed to start connector');
          this.emit('error', error);
        }
      }

      // Start processing queue
      this.isProcessing = true;
      this.processQueue();
      logger.info('Data capture service started successfully');
    } catch (error) {
      logger.error({ error }, 'Failed to start data capture service');
      this.emit('error', error);
      throw error;
    }
  }

  async stop() {
    this.isProcessing = false;
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    // Disconnect all connectors
    for (const [id, connector] of this.connectors) {
      try {
        await connector.disconnect();
        logger.info({ connector: id }, 'Connector stopped successfully');
        this.emit('connector:disconnected', { id, type: connector.constructor.name });
      } catch (error) {
        logger.error({ error, connector: id }, 'Failed to stop connector');
        this.emit('error', error);
      }
    }

    // Close Redis connection
    await this.redis.quit();
    logger.info('Data capture service stopped successfully');
  }

  private async processQueue() {
    const queueKey = 'data_capture:queue';
    
    while (this.isProcessing) {
      try {
        // Use Redis BLPOP for blocking pop with timeout
        const result = await this.redis.blpop(queueKey, 1);
        
        if (!result) {
          continue; // No data available
        }

        const rawData = JSON.parse(result[1]);
        const idea = await this.convertToIdea(rawData);
        
        logger.debug({ ideaId: idea.id }, 'Processing captured data');
        this.emit('idea:created', idea);
        
      } catch (error) {
        logger.error({ error }, 'Error processing queue item');
        this.emit('error', error);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Backoff on error
      }
    }
  }

  async captureData(source: string, rawData: unknown): Promise<void> {
    const connector = this.connectors.get(source);
    if (!connector) {
      const error = new Error(`No connector found for source: ${source}`);
      logger.error({ error, source }, 'Invalid source specified');
      throw error;
    }

    try {
      const processedData = await connector.processData(rawData);
      await this.redis.rpush('data_capture:queue', JSON.stringify(processedData));
      
      logger.info({ source, id: processedData.id }, 'Data captured successfully');
      this.emit('data:captured', { source, id: processedData.id });
    } catch (error) {
      logger.error({ error, source }, 'Failed to capture data');
      this.emit('error', error);
      throw error;
    }
  }

  private async convertToIdea(rawData: RawData): Promise<Idea> {
    // Process emotional content
    const emotionalContext = await this.epu.processEmotionalContent(
      rawData.content, 
      { 
        source: rawData.source, 
        timestamp: rawData.timestamp,
        metadata: rawData.metadata 
      }
    );

    // Map emotional context to idea metadata
    const metadata = {
      sentiment: emotionalContext.emotionalState.valence,
      urgency: this.calculateUrgencyFromEmotions(emotionalContext),
      context: emotionalContext.socialContext.groupDynamics[0] || 'general',
      complexity: this.calculateComplexity(rawData.content, emotionalContext),
      emotionalContext: {
        primaryEmotion: emotionalContext.primaryEmotion,
        intensity: emotionalContext.emotionalState.intensity,
        socialDynamics: emotionalContext.socialContext,
        temporalTrend: emotionalContext.temporalDynamics.trend,
        adaptiveResponse: this.determineAdaptiveResponse(emotionalContext)
      }
    };

    logger.debug({ 
      id: rawData.id,
      emotionalContext: metadata.emotionalContext,
      urgency: metadata.urgency,
      complexity: metadata.complexity
    }, 'Converted raw data to idea');

    return {
      id: rawData.id,
      content: rawData.content,
      source: rawData.source,
      createdAt: rawData.timestamp,
      metadata,
      xp: 0,
    };
  }

  private calculateComplexity(content: string, emotionalContext: EmotionalContext): number {
    // Calculate complexity based on multiple factors
    let complexity = 0;
    
    // Content length and structure complexity
    complexity += Math.min(0.3, content.length / 1000);
    complexity += (content.split(/[.!?]+/).length / 10) * 0.2;
    
    // Emotional complexity
    complexity += emotionalContext.secondaryEmotions.length * 0.1;
    complexity += emotionalContext.emotionalState.intensity * 0.2;
    
    // Social dynamics complexity
    complexity += emotionalContext.socialContext.groupDynamics.length * 0.1;
    
    return Math.min(1, complexity);
  }

  private determineAdaptiveResponse(emotionalContext: EmotionalContext): string[] {
    const responses: string[] = [];
    
    // Add responses based on emotional state
    if (emotionalContext.emotionalState.intensity > 0.7) {
      responses.push('emotional_support');
    }
    
    if (emotionalContext.temporalDynamics.trend === 'increasing') {
      responses.push('proactive_intervention');
    }
    
    if (emotionalContext.socialContext.groupDynamics.includes('conflict')) {
      responses.push('mediation');
    }
    
    return responses;
  }
  private async analyzeSentiment(content: string): Promise<number> {
    try {
      const tokens = this.tokenizer.tokenize(content);
      const sentiment = this.sentimentAnalyzer.getSentiment(tokens);
      
      // Normalize sentiment to range [-1, 1]
      return Math.max(-1, Math.min(1, sentiment));
    } catch (error) {
      logger.error({ error }, 'Sentiment analysis failed');
      return 0; // Neutral sentiment on error
    }
  }

  private calculateUrgencyFromEmotions(emotionalContext: EmotionalContext): number {
    // Combine emotional factors for urgency calculation
    const baseUrgency = emotionalContext.emotionalState.arousal;
    const intensityFactor = emotionalContext.emotionalState.intensity * 0.3;
    const trendFactor = emotionalContext.temporalDynamics.trend === 'increasing' ? 0.2 : 0;
    return analyzeSentiment(content);
  }

  private async extractContext(data: RawData): Promise<string> {
    try {
      const keywords = extractKeywords(data.content, 5);

      // If we have keywords, use them as context
      if (keywords.length > 0) {
        return keywords.join(', ');
      }
      
      // Fallback to metadata category if available
      return data.metadata.category as string || 'general';
    } catch (error) {
      logger.error({ error }, 'Context extraction failed');
      return 'general';
    }
  }
}