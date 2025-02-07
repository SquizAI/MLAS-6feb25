import { EventEmitter } from 'events';
import { logger } from '../lib/logger';

interface Message {
  id: string;
  topic: string;
  data: any;
  timestamp: Date;
  priority: number;
  metadata?: Record<string, unknown>;
}

interface Subscription {
  id: string;
  topic: string;
  callback: (message: Message) => Promise<void>;
  filter?: (message: Message) => boolean;
}

interface TopicStats {
  messageCount: number;
  subscriberCount: number;
  avgProcessingTime: number;
  lastMessage: Date;
}

export class MessageBroker extends EventEmitter {
  private subscriptions: Map<string, Subscription[]>;
  private messageBuffer: Map<string, Message[]>;
  private stats: Map<string, TopicStats>;
  private readonly maxBufferSize = 1000;
  private readonly maxBatchSize = 100;
  private processingPromises: Map<string, Promise<void>>;

  constructor() {
    super();
    this.subscriptions = new Map();
    this.messageBuffer = new Map();
    this.stats = new Map();
    this.processingPromises = new Map();
  }

  async publish(topic: string, data: any, priority: number = 0): Promise<void> {
    try {
      const message: Message = {
        id: crypto.randomUUID(),
        topic,
        data,
        timestamp: new Date(),
        priority
      };

      // Get or create buffer for topic
      const buffer = this.messageBuffer.get(topic) || [];
      buffer.push(message);

      // Update stats
      this.updateStats(topic, 'publish');

      // Process buffer if full or high priority
      if (buffer.length >= this.maxBufferSize || priority > 0.8) {
        await this.processBuffer(topic);
      } else {
        this.messageBuffer.set(topic, buffer);
      }

      logger.debug({ topic, messageId: message.id }, 'Message published');
      this.emit('message:published', { topic, messageId: message.id });

    } catch (error) {
      logger.error({ error, topic }, 'Failed to publish message');
      throw error;
    }
  }

  subscribe(
    topic: string,
    callback: (message: Message) => Promise<void>,
    filter?: (message: Message) => boolean
  ): string {
    const subscription: Subscription = {
      id: crypto.randomUUID(),
      topic,
      callback,
      filter
    };

    const topicSubs = this.subscriptions.get(topic) || [];
    topicSubs.push(subscription);
    this.subscriptions.set(topic, topicSubs);

    // Update stats
    this.updateStats(topic, 'subscribe');

    logger.debug({ topic, subscriptionId: subscription.id }, 'Subscription added');
    this.emit('subscription:added', { topic, subscriptionId: subscription.id });

    return subscription.id;
  }

  private async processBuffer(topic: string): Promise<void> {
    const buffer = this.messageBuffer.get(topic) || [];
    if (buffer.length === 0) return;

    // Sort by priority
    buffer.sort((a, b) => b.priority - a.priority);

    // Process in batches
    while (buffer.length > 0) {
      const batch = buffer.splice(0, this.maxBatchSize);
      const subscribers = this.subscriptions.get(topic) || [];

      const startTime = Date.now();

      // Process batch for each subscriber
      const deliveryPromises = subscribers.flatMap(sub =>
        batch
          .filter(msg => !sub.filter || sub.filter(msg))
          .map(async msg => {
            try {
              await sub.callback(msg);
              logger.debug({
                topic,
                messageId: msg.id,
                subscriptionId: sub.id
              }, 'Message delivered');
            } catch (error) {
              logger.error({
                error,
                topic,
                messageId: msg.id,
                subscriptionId: sub.id
              }, 'Failed to deliver message');
              // Requeue message on failure
              buffer.push(msg);
            }
          })
      );

      await Promise.allSettled(deliveryPromises);

      // Update stats
      const processingTime = Date.now() - startTime;
      this.updateStats(topic, 'process', processingTime);
    }

    // Clear buffer
    this.messageBuffer.set(topic, []);
  }

  private updateStats(
    topic: string,
    operation: 'publish' | 'subscribe' | 'process',
    processingTime?: number
  ) {
    const stats = this.stats.get(topic) || {
      messageCount: 0,
      subscriberCount: 0,
      avgProcessingTime: 0,
      lastMessage: new Date()
    };

    switch (operation) {
      case 'publish':
        stats.messageCount++;
        stats.lastMessage = new Date();
        break;
      case 'subscribe':
        stats.subscriberCount = (this.subscriptions.get(topic) || []).length;
        break;
      case 'process':
        if (processingTime) {
          stats.avgProcessingTime = (
            stats.avgProcessingTime + processingTime
          ) / 2;
        }
        break;
    }

    this.stats.set(topic, stats);
  }

  getTopicStats(topic: string): TopicStats | null {
    return this.stats.get(topic) || null;
  }

  async unsubscribe(subscriptionId: string): Promise<void> {
    for (const [topic, subs] of this.subscriptions.entries()) {
      const index = subs.findIndex(sub => sub.id === subscriptionId);
      if (index !== -1) {
        subs.splice(index, 1);
        this.updateStats(topic, 'subscribe');
        
        logger.debug({ subscriptionId, topic }, 'Subscription removed');
        this.emit('subscription:removed', { topic, subscriptionId });
        return;
      }
    }
  }
}