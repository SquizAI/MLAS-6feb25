import { z } from 'zod';
import pino from 'pino';

// Raw data schema before normalization
export const RawDataSchema = z.object({
  id: z.string().uuid(),
  content: z.string(),
  source: z.string(),
  timestamp: z.date(),
  format: z.enum(['text', 'audio', 'video']),
  metadata: z.record(z.string(), z.unknown()),
  rawData: z.unknown(),
});

export type RawData = z.infer<typeof RawDataSchema>;

export interface ConnectorConfig {
  id: string;
  type: string;
  credentials?: Record<string, string>;
  options?: Record<string, unknown>;
}

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
    },
  },
});

export abstract class BaseConnector {
  protected config: ConnectorConfig;
  protected isConnected: boolean = false;
  protected retryAttempts: number = 0;
  protected maxRetries: number = 3;
  protected retryDelays: number[] = [1000, 5000, 15000];

  constructor(config: ConnectorConfig) {
    this.config = config;
  }

  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract healthCheck(): Promise<boolean>;
  
  // Template method for data processing pipeline
  async processData(rawData: unknown): Promise<RawData> {
    try {
      logger.debug({ 
        connector: this.config.type,
        rawData 
      }, 'Processing raw data');

      const normalizedData = await this.normalizeData(rawData);
      const enrichedData = await this.enrichWithMetadata(normalizedData);

      logger.debug({ 
        connector: this.config.type,
        dataId: enrichedData.id 
      }, 'Data processing completed');

      return enrichedData;
    } catch (error) {
      logger.error({ 
        error,
        connector: this.config.type,
        rawData 
      }, 'Data processing failed');
      
      throw new Error(`Data processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  protected abstract normalizeData(data: unknown): Promise<RawData>;
  protected abstract enrichWithMetadata(data: RawData): Promise<RawData>;

  protected async retryWithBackoff<T>(
    operation: () => Promise<T>,
    context: string
  ): Promise<T> {
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === this.maxRetries) {
          logger.error({ 
            error,
            connector: this.config.type,
            context,
            attempt 
          }, 'Operation failed after max retries');
          throw error;
        }

        const delay = this.retryDelays[attempt];
        logger.warn({ 
          connector: this.config.type,
          context,
          attempt,
          delay 
        }, 'Operation failed, retrying');
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    throw new Error('Unexpected retry loop exit');
  }
}

export { BaseConnector }