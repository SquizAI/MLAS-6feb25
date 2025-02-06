import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import pino from 'pino';
import type { Agent, Task } from '../lib/types';
import { KnowledgeGraphService } from './KnowledgeGraph';
import { XPEngine } from './XPEngine';

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

interface AgentState {
  id: string;
  level: 'low' | 'mid' | 'high';
  skills: string[];
  experience: number;
  successRate: number;
  currentLoad: number;
  recentRewards: number[];
  policyParameters: Record<string, number>;
}

interface Action {
  type: 'accept_task' | 'delegate_task' | 'request_help' | 'complete_task';
  targetId?: string;
  parameters?: Record<string, any>;
}

interface RewardSignal {
  immediate: number;
  longTerm: number;
  feedback: number;
  collaboration: number;
}

export class ReinforcementLearningService extends EventEmitter {
  private agents: Map<string, AgentState>;
  private epsilon: number = 0.1; // Exploration rate
  private gamma: number = 0.95; // Discount factor
  private alpha: number = 0.01; // Learning rate
  private rewardHistory: Map<string, number[]>;
  private collaborationMatrix: Map<string, Map<string, number>>;

  constructor(
    private knowledgeGraph: KnowledgeGraphService,
    private xpEngine: XPEngine
  ) {
    super();
    this.agents = new Map();
    this.rewardHistory = new Map();
    this.collaborationMatrix = new Map();
    this.initializeAgents();
  }

  private async initializeAgents() {
    // Query existing agents from knowledge graph
    const agentNodes = await this.knowledgeGraph.query({
      nodeTypes: ['agent'],
    });

    agentNodes.forEach(node => {
      const agent = node.data as Agent;
      this.agents.set(agent.id, {
        id: agent.id,
        level: this.determineAgentLevel(agent),
        skills: agent.skills,
        experience: agent.xp,
        successRate: agent.performance.successRate,
        currentLoad: 0,
        recentRewards: [],
        policyParameters: this.initializePolicyParameters(agent),
      });
    });

    logger.info(
      { agentCount: this.agents.size },
      'Initialized reinforcement learning agents'
    );
  }

  private determineAgentLevel(agent: Agent): 'low' | 'mid' | 'high' {
    if (agent.xp < 1000) return 'low';
    if (agent.xp < 5000) return 'mid';
    return 'high';
  }

  private initializePolicyParameters(agent: Agent): Record<string, number> {
    return {
      taskComplexityWeight: 0.5,
      skillMatchWeight: 0.3,
      loadBalanceWeight: 0.2,
      collaborationBonus: 0.1,
      riskTolerance: this.determineAgentLevel(agent) === 'high' ? 0.8 : 0.5,
    };
  }

  async selectAction(agentId: string, task: Task): Promise<Action> {
    const agent = this.agents.get(agentId);
    if (!agent) throw new Error('Agent not found');

    // Epsilon-greedy exploration
    if (Math.random() < this.epsilon) {
      return this.exploreRandomAction(agent, task);
    }

    // Exploit learned policy
    return this.exploitLearnedPolicy(agent, task);
  }

  private exploreRandomAction(agent: AgentState, task: Task): Action {
    const actions: Action[] = [
      { type: 'accept_task' },
      { type: 'delegate_task' },
      { type: 'request_help' },
    ];

    return actions[Math.floor(Math.random() * actions.length)];
  }

  private async exploitLearnedPolicy(
    agent: AgentState,
    task: Task
  ): Promise<Action> {
    const actionValues = new Map<string, number>();

    // Calculate value for accepting task
    actionValues.set('accept_task', this.calculateAcceptValue(agent, task));

    // Calculate value for delegation
    const delegationValue = await this.calculateDelegationValue(agent, task);
    actionValues.set('delegate_task', delegationValue);

    // Calculate value for requesting help
    const helpValue = await this.calculateHelpValue(agent, task);
    actionValues.set('request_help', helpValue);

    // Select action with highest value
    let bestAction: Action = { type: 'accept_task' };
    let maxValue = -Infinity;

    for (const [actionType, value] of actionValues) {
      if (value > maxValue) {
        maxValue = value;
        bestAction = { type: actionType as Action['type'] };
      }
    }

    return bestAction;
  }

  private calculateAcceptValue(agent: AgentState, task: Task): number {
    const { taskComplexityWeight, skillMatchWeight, loadBalanceWeight } =
      agent.policyParameters;

    // Skill match score
    const skillMatch =
      task.data.requiredSkills.filter(skill => agent.skills.includes(skill))
        .length / task.data.requiredSkills.length;

    // Load balance score
    const loadScore = 1 - agent.currentLoad / 100;

    // Complexity appropriateness for agent level
    const complexityScore = this.calculateComplexityMatch(
      agent.level,
      task.data.complexity
    );

    return (
      taskComplexityWeight * complexityScore +
      skillMatchWeight * skillMatch +
      loadBalanceWeight * loadScore
    );
  }

  private async calculateDelegationValue(
    agent: AgentState,
    task: Task
  ): Promise<number> {
    const potentialDelegates = Array.from(this.agents.values()).filter(
      a => a.id !== agent.id && a.currentLoad < 80
    );

    if (potentialDelegates.length === 0) return -Infinity;

    // Find best potential delegate
    const delegateScores = await Promise.all(
      potentialDelegates.map(async delegate => {
        const baseScore = this.calculateAcceptValue(delegate, task);
        const collaborationScore =
          this.getCollaborationScore(agent.id, delegate.id);
        return baseScore * (1 + collaborationScore);
      })
    );

    return Math.max(...delegateScores);
  }

  private async calculateHelpValue(
    agent: AgentState,
    task: Task
  ): Promise<number> {
    const complexity = task.data.complexity || 0;
    const urgency = task.data.urgency || 0;
    
    // Higher value for complex or urgent tasks
    const baseValue = (complexity + urgency) / 2;

    // Consider agent's experience level
    const experienceFactor = agent.level === 'low' ? 1.2 : 0.8;

    // Consider recent performance
    const recentSuccess =
      agent.recentRewards.reduce((sum, r) => sum + r, 0) /
      Math.max(1, agent.recentRewards.length);

    return baseValue * experienceFactor * (1 + recentSuccess);
  }

  private calculateComplexityMatch(
    agentLevel: AgentState['level'],
    taskComplexity: number
  ): number {
    const levelComplexityRanges = {
      low: [0, 0.4],
      mid: [0.3, 0.7],
      high: [0.6, 1.0],
    };

    const [min, max] = levelComplexityRanges[agentLevel];
    if (taskComplexity < min) return 0.5; // Too simple
    if (taskComplexity > max) return 0.2; // Too complex
    return 1.0; // Just right
  }

  async updatePolicy(
    agentId: string,
    action: Action,
    reward: RewardSignal
  ): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) return;

    // Calculate composite reward
    const compositeReward =
      0.4 * reward.immediate +
      0.3 * reward.longTerm +
      0.2 * reward.feedback +
      0.1 * reward.collaboration;

    // Update recent rewards history
    agent.recentRewards = [
      ...agent.recentRewards.slice(-9),
      compositeReward,
    ];

    // Update policy parameters using gradient descent
    this.updatePolicyParameters(agent, action, compositeReward);

    // Update collaboration matrix
    if (action.targetId) {
      this.updateCollaborationScore(agentId, action.targetId, compositeReward);
    }

    // Emit learning event
    this.emit('policy:updated', {
      agentId,
      action,
      reward: compositeReward,
      newParameters: agent.policyParameters,
    });

    logger.debug(
      {
        agentId,
        action,
        reward: compositeReward,
        policyParameters: agent.policyParameters,
      },
      'Updated agent policy'
    );
  }

  private updatePolicyParameters(
    agent: AgentState,
    action: Action,
    reward: number
  ): void {
    const gradients = this.calculatePolicyGradients(agent, action, reward);
    
    // Update each parameter using gradient descent
    for (const [param, gradient] of Object.entries(gradients)) {
      agent.policyParameters[param] =
        agent.policyParameters[param] + this.alpha * gradient;
    }

    // Normalize parameters
    const sum = Object.values(agent.policyParameters).reduce(
      (a, b) => a + b,
      0
    );
    for (const param in agent.policyParameters) {
      agent.policyParameters[param] /= sum;
    }
  }

  private calculatePolicyGradients(
    agent: AgentState,
    action: Action,
    reward: number
  ): Record<string, number> {
    const gradients: Record<string, number> = {};
    
    // Calculate basic gradients for each parameter
    for (const param in agent.policyParameters) {
      const currentValue = agent.policyParameters[param];
      const baseline = agent.recentRewards.reduce((a, b) => a + b, 0) / 
        Math.max(1, agent.recentRewards.length);
      
      gradients[param] = (reward - baseline) * (1 - currentValue);
    }

    // Adjust gradients based on action type
    switch (action.type) {
      case 'delegate_task':
        gradients.collaborationBonus *= 1.2;
        break;
      case 'request_help':
        gradients.riskTolerance *= 0.8;
        break;
      case 'accept_task':
        gradients.taskComplexityWeight *= 1.1;
        break;
    }

    return gradients;
  }

  private getCollaborationScore(
    agentId1: string,
    agentId2: string
  ): number {
    const agent1Scores = this.collaborationMatrix.get(agentId1);
    if (!agent1Scores) return 0;
    return agent1Scores.get(agentId2) || 0;
  }

  private updateCollaborationScore(
    agentId1: string,
    agentId2: string,
    reward: number
  ): void {
    // Initialize scores if needed
    if (!this.collaborationMatrix.has(agentId1)) {
      this.collaborationMatrix.set(agentId1, new Map());
    }
    if (!this.collaborationMatrix.has(agentId2)) {
      this.collaborationMatrix.set(agentId2, new Map());
    }

    // Update scores bidirectionally
    const currentScore1 = this.getCollaborationScore(agentId1, agentId2);
    const currentScore2 = this.getCollaborationScore(agentId2, agentId1);
    
    const newScore = (currentScore1 * 0.9 + reward * 0.1);
    
    this.collaborationMatrix.get(agentId1)!.set(agentId2, newScore);
    this.collaborationMatrix.get(agentId2)!.set(agentId1, newScore);
  }

  // Expose metrics for monitoring
  getAgentMetrics(agentId: string) {
    const agent = this.agents.get(agentId);
    if (!agent) return null;

    return {
      level: agent.level,
      successRate: agent.successRate,
      recentRewards: agent.recentRewards,
      policyParameters: agent.policyParameters,
      collaborationScores: Array.from(this.agents.keys())
        .filter(id => id !== agentId)
        .map(id => ({
          agentId: id,
          score: this.getCollaborationScore(agentId, id),
        })),
    };
  }

  // System-wide metrics
  getSystemMetrics() {
    const agentMetrics = Array.from(this.agents.values()).map(agent => ({
      id: agent.id,
      level: agent.level,
      successRate: agent.successRate,
      averageReward:
        agent.recentRewards.reduce((a, b) => a + b, 0) /
        Math.max(1, agent.recentRewards.length),
    }));

    return {
      agentMetrics,
      systemSuccessRate:
        agentMetrics.reduce((sum, m) => sum + m.successRate, 0) /
        agentMetrics.length,
      averageReward:
        agentMetrics.reduce((sum, m) => sum + m.averageReward, 0) /
        agentMetrics.length,
      collaborationDensity:
        Array.from(this.collaborationMatrix.values()).reduce(
          (sum, scores) =>
            sum +
            Array.from(scores.values()).filter(score => score > 0.5).length,
          0
        ) /
        (this.agents.size * (this.agents.size - 1)),
    };
  }
}