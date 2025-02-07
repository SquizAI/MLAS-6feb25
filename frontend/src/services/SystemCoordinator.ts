import { EventEmitter } from 'events';
import { logger } from '../lib/logger';
import { RealTimeDataManager } from './RealTimeDataManager';
import { MessageBroker } from './MessageBroker';
import { KnowledgeGraphService } from './KnowledgeGraph';
import { AgentCoordinationService } from './AgentCoordination';
import { EmotionalProcessingUnit } from './EmotionalProcessing';
import { XPEngine } from './XPEngine';

interface SystemMetrics {
  activeStreams: number;
  messageRate: number;
  processingLatency: number;
  errorRate: number;
  agentUtilization: number;
  lastUpdated: Date;
}

export class SystemCoordinator extends EventEmitter {
  private metrics: SystemMetrics;
  private healthCheckInterval: NodeJS.Timeout;

  constructor(
    private dataManager: RealTimeDataManager,
    private messageBroker: MessageBroker,
    private knowledgeGraph: KnowledgeGraphService,
    private agentCoordination: AgentCoordinationService,
    private epu: EmotionalProcessingUnit,
    private xpEngine: XPEngine
  ) {
    super();
    this.initializeMetrics();
    this.setupEventHandlers();
    this.startHealthCheck();
  }

  private initializeMetrics() {
    this.metrics = {
      activeStreams: 0,
      messageRate: 0,
      processingLatency: 0,
      errorRate: 0,
      agentUtilization: 0,
      lastUpdated: new Date()
    };
  }

  private setupEventHandlers() {
    // Data Manager events
    this.dataManager.on('stream:registered', this.handleStreamRegistered.bind(this));
    this.dataManager.on('batch:processed', this.handleBatchProcessed.bind(this));
    this.dataManager.on('error', this.handleError.bind(this));

    // Message Broker events
    this.messageBroker.on('message:published', this.handleMessagePublished.bind(this));
    this.messageBroker.on('error', this.handleError.bind(this));

    // Agent Coordination events
    this.agentCoordination.on('agent:assigned', this.handleAgentAssigned.bind(this));
    this.agentCoordination.on('error', this.handleError.bind(this));
  }

  private startHealthCheck() {
    this.healthCheckInterval = setInterval(
      this.performHealthCheck.bind(this),
      30000 // Every 30 seconds
    );
  }

  private async performHealthCheck() {
    try {
      // Check component health
      const dataManagerHealth = await this.checkDataManagerHealth();
      const messageBrokerHealth = await this.checkMessageBrokerHealth();
      const agentHealth = await this.checkAgentHealth();

      // Update system metrics
      this.updateMetrics();

      // Check for system-wide issues
      this.detectSystemIssues();

      logger.info({
        dataManagerHealth,
        messageBrokerHealth,
        agentHealth,
        metrics: this.metrics
      }, 'Health check completed');

    } catch (error) {
      logger.error({ error }, 'Health check failed');
      this.emit('health:check:failed', { error });
    }
  }

  private async checkDataManagerHealth(): Promise<boolean> {
    // Check stream health
    const streamStats = Array.from(this.dataManager.getStreamStats() || []);
    const unhealthyStreams = streamStats.filter(
      ([_, stats]) => stats.errorCount / stats.processedCount > 0.1
    );

    return unhealthyStreams.length === 0;
  }

  private async checkMessageBrokerHealth(): Promise<boolean> {
    // Check message processing health
    const topicStats = Array.from(this.messageBroker.getTopicStats() || []);
    const unhealthyTopics = topicStats.filter(
      ([_, stats]) => stats.avgProcessingTime > 5000 // 5 seconds threshold
    );

    return unhealthyTopics.length === 0;
  }

  private async checkAgentHealth(): Promise<boolean> {
    // Check agent system health
    const agentStats = await this.agentCoordination.getSystemMetrics();
    return (
      agentStats.successRate > 0.9 &&
      agentStats.resourceUtilization < 0.9
    );
  }

  private updateMetrics() {
    // Update system-wide metrics
    const now = Date.now();
    const timeDiff = (now - this.metrics.lastUpdated.getTime()) / 1000;

    this.metrics = {
      ...this.metrics,
      activeStreams: this.countActiveStreams(),
      messageRate: this.calculateMessageRate(timeDiff),
      processingLatency: this.calculateProcessingLatency(),
      errorRate: this.calculateErrorRate(),
      agentUtilization: this.calculateAgentUtilization(),
      lastUpdated: new Date()
    };

    this.emit('metrics:updated', this.metrics);
  }

  private detectSystemIssues() {
    // Check for system-wide issues
    if (this.metrics.errorRate > 0.1) {
      this.handleHighErrorRate();
    }

    if (this.metrics.processingLatency > 5000) {
      this.handleHighLatency();
    }

    if (this.metrics.agentUtilization > 0.9) {
      this.handleHighUtilization();
    }
  }

  private handleHighErrorRate() {
    logger.warn({ errorRate: this.metrics.errorRate }, 'High error rate detected');
    this.emit('system:warning', {
      type: 'high_error_rate',
      metrics: this.metrics
    });
  }

  private handleHighLatency() {
    logger.warn(
      { latency: this.metrics.processingLatency },
      'High processing latency detected'
    );
    this.emit('system:warning', {
      type: 'high_latency',
      metrics: this.metrics
    });
  }

  private handleHighUtilization() {
    logger.warn(
      { utilization: this.metrics.agentUtilization },
      'High agent utilization detected'
    );
    this.emit('system:warning', {
      type: 'high_utilization',
      metrics: this.metrics
    });
  }

  private countActiveStreams(): number {
    return Array.from(this.dataManager.getStreamStats() || []).length;
  }

  private calculateMessageRate(timeDiff: number): number {
    const totalMessages = Array.from(
      this.messageBroker.getTopicStats() || []
    ).reduce((sum, [_, stats]) => sum + stats.messageCount, 0);

    return totalMessages / timeDiff;
  }

  private calculateProcessingLatency(): number {
    const latencies = Array.from(
      this.dataManager.getStreamStats() || []
    ).map(([_, stats]) => stats.avgProcessingTime);

    return latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length;
  }

  private calculateErrorRate(): number {
    const stats = Array.from(this.dataManager.getStreamStats() || []);
    const totalErrors = stats.reduce((sum, [_, s]) => sum + s.errorCount, 0);
    const totalProcessed = stats.reduce((sum, [_, s]) => sum + s.processedCount, 0);

    return totalProcessed > 0 ? totalErrors / totalProcessed : 0;
  }

  private calculateAgentUtilization(): number {
    return this.agentCoordination.getSystemMetrics().resourceUtilization;
  }

  // Event handlers
  private handleStreamRegistered({ id, type }: { id: string; type: string }) {
    logger.info({ streamId: id, type }, 'New stream registered');
    this.updateMetrics();
  }

  private handleBatchProcessed({
    streamId,
    successCount,
    errorCount,
    processingTime
  }: {
    streamId: string;
    successCount: number;
    errorCount: number;
    processingTime: number;
  }) {
    logger.debug({
      streamId,
      successCount,
      errorCount,
      processingTime
    }, 'Batch processed');
    this.updateMetrics();
  }

  private handleMessagePublished({
    topic,
    messageId
  }: {
    topic: string;
    messageId: string;
  }) {
    logger.debug({ topic, messageId }, 'Message published');
    this.updateMetrics();
  }

  private handleAgentAssigned({
    taskId,
    agentId
  }: {
    taskId: string;
    agentId: string;
  }) {
    logger.debug({ taskId, agentId }, 'Task assigned to agent');
    this.updateMetrics();
  }

  private handleError(error: Error) {
    logger.error({ error }, 'System error occurred');
    this.emit('error', error);
    this.updateMetrics();
  }

  getSystemMetrics(): SystemMetrics {
    return { ...this.metrics };
  }

  async shutdown(): Promise<void> {
    clearInterval(this.healthCheckInterval);
    
    // Perform graceful shutdown
    try {
      // Stop all streams
      const streams = Array.from(this.dataManager.getStreamStats() || []);
      await Promise.all(
        streams.map(([id]) => this.dataManager.stopStream(id))
      );

      // Process remaining messages
      const topics = Array.from(this.messageBroker.getTopicStats() || []);
      await Promise.all(
        topics.map(([topic]) => this.messageBroker.processBuffer(topic))
      );

      logger.info('System shutdown completed');
    } catch (error) {
      logger.error({ error }, 'Error during system shutdown');
      throw error;
    }
  }
}