import { EventEmitter } from 'events';
import pino from 'pino';
import type { Task, Agent } from '../../lib/types';

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

interface RewardComponent {
  value: number;
  confidence: number;
  source: string;
}

interface RewardWeights {
  taskCompletion: number;
  quality: number;
  efficiency: number;
  collaboration: number;
  innovation: number;
  learning: number;
}

export class RewardStructure extends EventEmitter {
  private baseWeights: RewardWeights = {
    taskCompletion: 0.3,
    quality: 0.2,
    efficiency: 0.15,
    collaboration: 0.15,
    innovation: 0.1,
    learning: 0.1,
  };

  private adaptiveWeights: Map<string, RewardWeights> = new Map();
  private recentRewards: Map<string, RewardComponent[]> = new Map();
  private explorationFactors: Map<string, number> = new Map();

  // Temporal difference learning parameters
  private readonly gamma = 0.95; // Discount factor
  private readonly lambda = 0.8; // Eligibility trace decay
  private readonly alpha = 0.1; // Learning rate

  calculateReward(
    agent: Agent,
    task: Task,
    performance: {
      completionTime: number;
      quality: number;
      collaboration: number;
      innovation: number;
    }
  ): number {
    const weights = this.getAdaptiveWeights(agent.id);
    const components: RewardComponent[] = [];

    // Task Completion Component
    const completionReward = this.calculateCompletionReward(task, performance);
    components.push({
      value: completionReward,
      confidence: 0.9,
      source: 'completion'
    });

    // Quality Component with confidence based on historical performance
    const qualityReward = this.calculateQualityReward(performance.quality);
    components.push({
      value: qualityReward,
      confidence: 0.85,
      source: 'quality'
    });

    // Efficiency Component
    const efficiencyReward = this.calculateEfficiencyReward(
      performance.completionTime,
      task.data.estimatedTime
    );
    components.push({
      value: efficiencyReward,
      confidence: 0.8,
      source: 'efficiency'
    });

    // Collaboration Component
    const collaborationReward = this.calculateCollaborationReward(
      performance.collaboration,
      task.data.collaborators?.length || 0
    );
    components.push({
      value: collaborationReward,
      confidence: 0.75,
      source: 'collaboration'
    });

    // Innovation Component
    const innovationReward = this.calculateInnovationReward(
      performance.innovation,
      task.data.complexity || 0
    );
    components.push({
      value: innovationReward,
      confidence: 0.7,
      source: 'innovation'
    });

    // Learning Component based on skill improvement
    const learningReward = this.calculateLearningReward(agent, task);
    components.push({
      value: learningReward,
      confidence: 0.8,
      source: 'learning'
    });

    // Store rewards for temporal difference learning
    this.updateRecentRewards(agent.id, components);

    // Calculate weighted sum
    const totalReward = components.reduce((sum, component, index) => {
      const weight = Object.values(weights)[index];
      return sum + component.value * weight * component.confidence;
    }, 0);

    // Apply exploration bonus if agent is exploring new task types
    const explorationBonus = this.calculateExplorationBonus(agent.id, task);
    
    logger.debug({
      agentId: agent.id,
      taskId: task.id,
      components,
      weights,
      totalReward,
      explorationBonus
    }, 'Reward calculation');

    return totalReward * (1 + explorationBonus);
  }

  private calculateCompletionReward(
    task: Task,
    performance: { completionTime: number }
  ): number {
    const baseReward = 1.0; // Base reward for completion
    const timeBonus = Math.max(0, 1 - performance.completionTime / task.data.estimatedTime);
    return baseReward * (1 + timeBonus);
  }

  private calculateQualityReward(quality: number): number {
    // Non-linear quality reward to emphasize high-quality work
    return Math.pow(quality, 2);
  }

  private calculateEfficiencyReward(
    actualTime: number,
    estimatedTime: number
  ): number {
    const timeRatio = actualTime / estimatedTime;
    // Sigmoid function to smooth efficiency reward
    return 2 / (1 + Math.exp(timeRatio - 1)) - 1;
  }

  private calculateCollaborationReward(
    collaborationScore: number,
    numCollaborators: number
  ): number {
    // Reward increases with both quality of collaboration and number of collaborators
    return collaborationScore * (1 + Math.log(numCollaborators + 1));
  }

  private calculateInnovationReward(
    innovationScore: number,
    taskComplexity: number
  ): number {
    // Higher rewards for innovation on complex tasks
    return innovationScore * (1 + taskComplexity);
  }

  private calculateLearningReward(agent: Agent, task: Task): number {
    // Reward for acquiring or improving skills
    const newSkills = task.data.requiredSkills.filter(
      skill => !agent.skills.includes(skill)
    );
    return 0.5 * newSkills.length;
  }

  private calculateExplorationBonus(agentId: string, task: Task): number {
    const explorationFactor = this.explorationFactors.get(agentId) || 0.1;
    
    // Decrease exploration factor over time
    const newFactor = Math.max(0.01, explorationFactor * 0.995);
    this.explorationFactors.set(agentId, newFactor);

    return newFactor;
  }

  private getAdaptiveWeights(agentId: string): RewardWeights {
    if (!this.adaptiveWeights.has(agentId)) {
      this.adaptiveWeights.set(agentId, { ...this.baseWeights });
    }
    return this.adaptiveWeights.get(agentId)!;
  }

  private updateRecentRewards(
    agentId: string,
    components: RewardComponent[]
  ): void {
    const recent = this.recentRewards.get(agentId) || [];
    recent.push(...components);
    
    // Keep last 100 reward components
    if (recent.length > 100) {
      recent.splice(0, recent.length - 100);
    }
    
    this.recentRewards.set(agentId, recent);
  }

  updateWeights(agentId: string): void {
    const recent = this.recentRewards.get(agentId) || [];
    if (recent.length < 10) return; // Need enough history

    const weights = this.getAdaptiveWeights(agentId);
    const componentTypes = Object.keys(weights);

    // Calculate average reward by component
    const averages = componentTypes.reduce((acc, type) => {
      const components = recent.filter(c => c.source === type);
      const avg = components.reduce((sum, c) => sum + c.value, 0) / components.length;
      acc[type] = avg;
      return acc;
    }, {} as Record<string, number>);

    // Update weights using temporal difference learning
    for (const type of componentTypes) {
      const currentWeight = weights[type as keyof RewardWeights];
      const avgReward = averages[type];
      const tdError = avgReward - currentWeight;
      
      weights[type as keyof RewardWeights] = Math.max(
        0.05, // Minimum weight
        Math.min(
          0.5, // Maximum weight
          currentWeight + this.alpha * tdError
        )
      );
    }

    // Normalize weights
    const sum = Object.values(weights).reduce((a, b) => a + b, 0);
    for (const type of componentTypes) {
      weights[type as keyof RewardWeights] /= sum;
    }

    this.adaptiveWeights.set(agentId, weights);

    logger.info({
      agentId,
      newWeights: weights
    }, 'Updated reward weights');
  }

  getRewardStats(agentId: string) {
    const recent = this.recentRewards.get(agentId) || [];
    const weights = this.getAdaptiveWeights(agentId);

    return {
      weights,
      recentAverages: Object.keys(weights).reduce((acc, type) => {
        const components = recent.filter(c => c.source === type);
        acc[type] = components.reduce((sum, c) => sum + c.value, 0) / 
          Math.max(1, components.length);
        return acc;
      }, {} as Record<string, number>),
      explorationFactor: this.explorationFactors.get(agentId) || 0.1
    };
  }
}