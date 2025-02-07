import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../lib/logger';
import { KnowledgeGraphService } from './KnowledgeGraph';
import { EmotionalProcessingUnit } from './EmotionalProcessing';
import { AgentCoordinationService } from './AgentCoordination';
import { XPEngine } from './XPEngine';

interface StreamConfig {
  id: string;
  type: 'email' | 'slack' | 'text' | 'api';
  bufferSize: number;
  batchInterval: number;
  priority: number;
}

interface StreamStats {
  processedCount: number;
  errorCount: number;
  avgProcessingTime: number;
  lastProcessed: Date;
  bufferSize: number;
}

export class RealTimeDataManager extends EventEmitter {
  private streams: Map<string, StreamConfig>;
  private buffers: Map<string, any[]>;
  private stats: Map<string, StreamStats>;
  private processingQueues: Map<string, Promise<void>>;
  private batchProcessors: Map<string, NodeJS.Timeout>;

  constructor(
    private knowledgeGraph: KnowledgeGraphService,
    private epu: EmotionalProcessingUnit,
    private agentCoordination: AgentCoordinationService,
    private xpEngine: XPEngine
  ) {
    super();
    this.streams = new Map();
    this.buffers = new Map();
    this.stats = new Map();
    this.processingQueues = new Map();
    this.batchProcessors = new Map();
  }

  async registerStream(config: StreamConfig): Promise<void> {
    try {
      this.streams.set(config.id, config);
      this.buffers.set(config.id, []);
      this.stats.set(config.id, {
        processedCount: 0,
        errorCount: 0,
        avgProcessingTime: 0,
        lastProcessed: new Date(),
        bufferSize: 0
      });

      // Start batch processor
      this.startBatchProcessor(config.id);

      logger.info({ streamId: config.id, type: config.type }, 'Stream registered');
      this.emit('stream:registered', { id: config.id, type: config.type });
    } catch (error) {
      logger.error({ error, streamId: config.id }, 'Failed to register stream');
      throw error;
    }
  }

  private startBatchProcessor(streamId: string) {
    const config = this.streams.get(streamId);
    if (!config) return;

    const processor = setInterval(async () => {
      await this.processBatch(streamId);
    }, config.batchInterval);

    this.batchProcessors.set(streamId, processor);
  }

  async pushData(streamId: string, data: any): Promise<void> {
    const config = this.streams.get(streamId);
    if (!config) {
      throw new Error(`Stream ${streamId} not found`);
    }

    const buffer = this.buffers.get(streamId) || [];
    buffer.push({
      id: uuidv4(),
      data,
      timestamp: new Date(),
      priority: this.calculatePriority(data, config)
    });

    // Update stats
    const stats = this.stats.get(streamId);
    if (stats) {
      stats.bufferSize = buffer.length;
      this.stats.set(streamId, stats);
    }

    // Process immediately if buffer is full
    if (buffer.length >= config.bufferSize) {
      await this.processBatch(streamId);
    }

    this.emit('data:received', { streamId, dataId: data.id });
  }

  private async processBatch(streamId: string): Promise<void> {
    const buffer = this.buffers.get(streamId) || [];
    if (buffer.length === 0) return;

    const config = this.streams.get(streamId);
    if (!config) return;

    try {
      // Sort by priority
      buffer.sort((a, b) => b.priority - a.priority);

      // Process batch
      const startTime = Date.now();
      const results = await Promise.allSettled(
        buffer.map(item => this.processItem(item, config))
      );

      // Update stats
      const stats = this.stats.get(streamId) || {
        processedCount: 0,
        errorCount: 0,
        avgProcessingTime: 0,
        lastProcessed: new Date(),
        bufferSize: 0
      };

      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const errorCount = results.filter(r => r.status === 'rejected').length;
      const processingTime = Date.now() - startTime;

      stats.processedCount += successCount;
      stats.errorCount += errorCount;
      stats.avgProcessingTime = (stats.avgProcessingTime + processingTime) / 2;
      stats.lastProcessed = new Date();
      stats.bufferSize = 0;

      this.stats.set(streamId, stats);

      // Clear buffer
      this.buffers.set(streamId, []);

      logger.info({
        streamId,
        batchSize: buffer.length,
        successCount,
        errorCount,
        processingTime
      }, 'Batch processed');

      this.emit('batch:processed', {
        streamId,
        successCount,
        errorCount,
        processingTime
      });

    } catch (error) {
      logger.error({ error, streamId }, 'Failed to process batch');
      this.emit('error', { streamId, error });
    }
  }

  private async processItem(item: any, config: StreamConfig): Promise<void> {
    try {
      // Process emotional content
      const emotionalContext = await this.epu.processEmotionalContent(
        item.data.content,
        { source: config.type }
      );

      // Update knowledge graph
      const node = await this.knowledgeGraph.addNode({
        type: config.type,
        data: item.data,
        metadata: {
          emotional: emotionalContext,
          priority: item.priority,
          source: config.type
        }
      });

      // Check for task creation
      if (this.shouldCreateTask(emotionalContext, item.priority)) {
        const task = await this.createTask(item.data, emotionalContext);
        await this.agentCoordination.assignTask(task);
      }

      this.emit('item:processed', {
        streamId: config.id,
        itemId: item.id,
        nodeId: node.id
      });

    } catch (error) {
      logger.error({ error, itemId: item.id }, 'Failed to process item');
      throw error;
    }
  }

  private calculatePriority(data: any, config: StreamConfig): number {
    let priority = config.priority;

    // Adjust based on content
    if (data.content?.toLowerCase().includes('urgent')) {
      priority *= 1.5;
    }

    // Adjust based on source priority
    if (data.metadata?.sourcePriority) {
      priority *= data.metadata.sourcePriority;
    }

    return Math.min(1, priority);
  }

  private shouldCreateTask(
    emotionalContext: any,
    priority: number
  ): boolean {
    // Create task if:
    // 1. High emotional intensity
    // 2. High priority
    // 3. Contains action items
    return (
      emotionalContext.emotionalState.intensity > 0.7 ||
      priority > 0.8 ||
      this.containsActionItems(emotionalContext)
    );
  }

  private containsActionItems(emotionalContext: any): boolean {
    return emotionalContext.socialContext.groupDynamics.some(
      (dynamic: string) => dynamic.includes('task') || dynamic.includes('action')
    );
  }

  private async createTask(data: any, emotionalContext: any) {
    // Create task with emotional context
    return {
      id: uuidv4(),
      title: this.generateTaskTitle(data),
      description: data.content,
      priority: this.calculateTaskPriority(emotionalContext),
      metadata: {
        source: data.source,
        emotional: emotionalContext,
        urgency: emotionalContext.emotionalState.arousal,
        complexity: this.calculateComplexity(data, emotionalContext)
      }
    };
  }

  private generateTaskTitle(data: any): string {
    // Extract key information for title
    const keywords = data.content
      .split(' ')
      .slice(0, 5)
      .join(' ');
    return `Task from ${data.source}: ${keywords}...`;
  }

  private calculateTaskPriority(emotionalContext: any): number {
    return Math.max(
      emotionalContext.emotionalState.arousal,
      emotionalContext.emotionalState.intensity
    );
  }

  private calculateComplexity(data: any, emotionalContext: any): number {
    // Consider:
    // 1. Content length
    // 2. Emotional complexity
    // 3. Required actions
    let complexity = 0;
    
    complexity += data.content.length / 1000; // Length factor
    complexity += emotionalContext.secondaryEmotions.length * 0.1; // Emotional complexity
    complexity += emotionalContext.socialContext.groupDynamics.length * 0.1; // Social complexity
    
    return Math.min(1, complexity);
  }

  getStreamStats(streamId: string): StreamStats | null {
    return this.stats.get(streamId) || null;
  }

  async stopStream(streamId: string): Promise<void> {
    const processor = this.batchProcessors.get(streamId);
    if (processor) {
      clearInterval(processor);
      this.batchProcessors.delete(streamId);
    }

    // Process remaining items
    await this.processBatch(streamId);

    this.streams.delete(streamId);
    this.buffers.delete(streamId);
    this.stats.delete(streamId);

    logger.info({ streamId }, 'Stream stopped');
    this.emit('stream:stopped', { id: streamId });
  }
}