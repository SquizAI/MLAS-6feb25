import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import pino from 'pino';
import { EmotionalProcessingUnit } from './EmotionalProcessing';
import type { Task, Agent } from '../lib/types';
import { KnowledgeGraphService } from './KnowledgeGraph';
import { XPEngine } from './XPEngine';
import { ReinforcementLearningService } from './ReinforcementLearning';
import { RewardStructure } from './rewards/RewardStructure';
import { CreditAssignment } from './rewards/CreditAssignment';

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

interface AgentTier {
  type: 'low_level' | 'mid_level' | 'high_level';
  minXP: number;
  responsibilities: string[];
  autonomyLevel: number; // 0-1 scale
}

interface TaskAssignment {
  taskId: string;
  agentId: string;
  score: number;
  timestamp: Date;
  status: 'pending' | 'accepted' | 'rejected';
}

interface PerformanceMetrics {
  successRate: number;
  averageCompletionTime: number;
  complexityScore: number;
  collaborationScore: number;
  lastUpdated: Date;
}

export class AgentCoordinationService extends EventEmitter {
  private agents: Map<string, Agent>;
  private assignments: Map<string, TaskAssignment>;
  private metrics: Map<string, PerformanceMetrics>;
  private learningRates: Map<string, number>;
  private rewardStructure: RewardStructure;
  private creditAssignment: CreditAssignment;
  private rlService: ReinforcementLearningService;
  private rewardHistory: Map<string, number[]>;
  private collaborationMatrix: Map<string, Map<string, number>>;
  private epu: EmotionalProcessingUnit;

  private readonly TIERS: AgentTier[] = [
    {
      type: 'low_level',
      minXP: 0,
      responsibilities: ['execution', 'data_collection', 'reporting'],
      autonomyLevel: 0.3,
    },
    {
      type: 'mid_level',
      minXP: 1000,
      responsibilities: ['coordination', 'optimization', 'quality_control'],
      autonomyLevel: 0.6,
    },
    {
      type: 'high_level',
      minXP: 5000,
      responsibilities: ['strategy', 'oversight', 'innovation'],
      autonomyLevel: 0.9,
    },
  ];

  constructor(
    private knowledgeGraph: KnowledgeGraphService,
    private xpEngine: XPEngine
  ) {
    super();
    this.epu = new EmotionalProcessingUnit(knowledgeGraph);
    this.agents = new Map();
    this.assignments = new Map();
    this.metrics = new Map();
    this.learningRates = new Map();
    this.rewardStructure = new RewardStructure();
    this.creditAssignment = new CreditAssignment();
    this.rlService = new ReinforcementLearningService(knowledgeGraph, xpEngine);
    this.rewardHistory = new Map();
    this.collaborationMatrix = new Map();
    this.initializeMetrics();
    this.setupRLEventHandlers();
  }

  private setupRLEventHandlers() {
    this.rlService.on('policy:updated', ({ agentId, action, reward }) => {
      logger.info({ agentId, action, reward }, 'Agent policy updated');
      this.emit('agent:policy_updated', { agentId, action, reward });
    });
  }

  private initializeMetrics() {
    // Initialize base metrics for each agent
    this.agents.forEach((agent, id) => {
      if (!this.metrics.has(id)) {
        this.metrics.set(id, {
          successRate: 0.5,
          averageCompletionTime: 0,
          complexityScore: 0,
          collaborationScore: 0,
          lastUpdated: new Date(),
        });
      }
      // Initialize learning rates
      this.learningRates.set(id, 0.1); // Base learning rate
    });
  }

  private async findSuitableAgent(task: Task): Promise<AgentMatch | null> {
    // Get emotional requirements for the task
    const agentCharacteristics = await this.epu.recommendAgentCharacteristics(
      task.data.emotionalContext
    );

    // Query available agents
    const availableAgents = await this.knowledgeGraph.query({
      nodeTypes: ['agent'],
      status: 'idle'
    });

    const matches = availableAgents.map(agent => {
      const matchedSkills: string[] = [];
      const missingSkills: string[] = [];

      // Calculate emotional fitness score
      const emotionalFitness = this.calculateEmotionalFitness(
        agent,
        agentCharacteristics
      );

      // Combine technical and emotional scores
      const skillScore = matchedSkills.length / task.data.requiredSkills.length;
      const experienceScore = Math.min(1, agent.xp / 1000);
      
      const score = (
        skillScore * 0.4 +
        experienceScore * 0.3 +
        emotionalFitness * 0.3
      );

      return {
        agentId: agent.id,
        score,
        matchedSkills,
        missingSkills,
        emotionalFitness
      };
    });

    // Return best match above threshold
    const bestMatch = matches.sort((a, b) => b.score - a.score)[0];
    return bestMatch.score >= 0.6 ? bestMatch : null;
  }

  private calculateEmotionalFitness(
    agent: Agent,
    requirements: Record<string, number>
  ): number {
    // Compare agent's emotional capabilities with requirements
    const scores = Object.entries(requirements).map(([trait, required]) => {
      const actual = agent.data.emotionalTraits?.[trait] || 0.5;
      return 1 - Math.abs(required - actual);
    });

    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }

  registerAgent(agent: Agent) {
    this.agents.set(agent.id, agent);
    this.knowledgeGraph.addAgent(agent);
    this.initializeMetrics();
    logger.info({ agentId: agent.id, type: agent.type }, 'Agent registered');
  }

  async assignTask(task: Task): Promise<boolean> {
    try {
      // Get tier requirements based on task complexity
      const requiredTier = this.determineRequiredTier(task);
      
      // Use RL to find optimal assignment
      const eligibleAgents = Array.from(this.agents.values())
        .filter(agent => 
          agent.status === 'idle' &&
          this.isAgentQualified(agent, requiredTier)
        );

      if (eligibleAgents.length === 0) return false;

      // Get RL-based action for each eligible agent
      const agentActions = await Promise.all(
        eligibleAgents.map(async agent => {
          const action = await this.rlService.selectAction(agent.id, task);
          return { agent, action };
        })
      );

      // Filter agents that want to accept the task
      const willingAgents = agentActions
        .filter(({ action }) => action.type === 'accept_task')
        .map(({ agent }) => agent);

      if (willingAgents.length === 0) return false;

      // Calculate Nash equilibrium among willing agents
      const assignment = this.findNashEquilibrium(willingAgents, task);
      if (!assignment) return false;

      // Record assignment
      this.assignments.set(task.id, assignment);
      
      // Update task with assigned agent
      task.assignedAgentId = assignment.agentId;
      task.status = 'active';

      // Update agent status
      const agent = this.agents.get(assignment.agentId);
      if (agent) {
        agent.status = 'busy';
        this.agents.set(agent.id, agent);
      }

      logger.info({ 
        taskId: task.id, 
        agentId: assignment.agentId,
        score: assignment.score 
      }, 'Task assigned successfully');

      return true;
    } catch (error) {
      logger.error({ error, taskId: task.id }, 'Task assignment failed');
      return false;
    }
  }

  private determineRequiredTier(task: Task): AgentTier['type'] {
    const complexity = task.data?.complexity || 0;
    
    if (complexity > 0.7) return 'high_level';
    if (complexity > 0.4) return 'mid_level';
    return 'low_level';
  }

  private isAgentQualified(
    agent: Agent,
    requiredTier: AgentTier['type']
  ): boolean {
    const tierConfig = this.TIERS.find(t => t.type === requiredTier);
    if (!tierConfig) return false;

    return agent.xp >= tierConfig.minXP;
  }

  private calculateUtility(task: Task, agent: Agent): number {
    const metrics = this.metrics.get(agent.id);
    if (!metrics) return 0;

    // Weighted factors for utility calculation
    const weights = {
      skillMatch: 0.3,
      performance: 0.25,
      workload: 0.2,
      xpGain: 0.15,
      collaboration: 0.1,
    };

    // Calculate skill match
    const requiredSkills = task.data?.requiredSkills || [];
    const skillMatch = requiredSkills.length > 0
      ? agent.skills.filter(s => requiredSkills.includes(s)).length / requiredSkills.length
      : 0.5;

    // Performance score based on metrics
    const performance = (
      metrics.successRate * 0.6 +
      (1 - metrics.averageCompletionTime / 1000) * 0.4
    );

    // Workload consideration (inverse of current tasks)
    const currentTasks = Array.from(this.assignments.values())
      .filter(a => a.agentId === agent.id && a.status === 'pending')
      .length;
    const workload = Math.max(0, 1 - (currentTasks * 0.2));

    // Potential XP gain
    const xpGain = task.xp / (agent.xp + 1);

    // Collaboration potential
    const collaboration = metrics.collaborationScore;

    // Calculate total utility
    return (
      skillMatch * weights.skillMatch +
      performance * weights.performance +
      workload * weights.workload +
      xpGain * weights.xpGain +
      collaboration * weights.collaboration
    );
  }

  private findNashEquilibrium(agents: Agent[], task: Task): TaskAssignment | null {
    const assignments = agents.map(agent => ({
      taskId: task.id,
      agentId: agent.id,
      score: this.calculateUtility(task, agent),
      timestamp: new Date(),
      status: 'pending' as const,
    }));

    // Sort by score descending
    const sortedAssignments = [...assignments].sort((a, b) => b.score - a.score);

    // Check if best assignment is stable
    const bestAssignment = sortedAssignments[0];
    if (!bestAssignment) return null;

    // Verify no agent has incentive to deviate
    const isStable = sortedAssignments.every((assignment, index) => {
      if (index === 0) return true;
      
      // Check if difference in utility is significant enough to cause deviation
      const utilityDiff = bestAssignment.score - assignment.score;
      return utilityDiff >= 0.1; // Threshold for stability
    });

    return isStable ? bestAssignment : sortedAssignments[0];
  }

  async updateTaskStatus(
    taskId: string,
    status: Task['status'],
    performance: {
      completionTime: number;
      quality: number;
      collaboration: number;
      innovation: number;
    }
  ) {
    const assignment = this.assignments.get(taskId);
    if (!assignment) return;

    const agent = this.agents.get(assignment.agentId);
    if (!agent) return;

    try {
      // Update task status
      this.knowledgeGraph.updateTaskStatus(taskId, status, agent.id);

      // Calculate reward using reward structure
      const reward = this.rewardStructure.calculateReward(
        agent,
        { id: taskId } as Task,
        performance
      );

      // Get collaborators if any
      const collaborators = this.getTaskCollaborators(taskId);
      if (collaborators.length > 0) {
        // Assign credit among collaborators
        const creditShares = this.creditAssignment.assignCredit(
          { id: taskId } as Task,
          reward,
          collaborators.map(c => ({
            agentId: c.agentId,
            contribution: c.contribution,
            role: c.role as 'primary' | 'helper' | 'reviewer'
          }))
        );

        // Update RL policies and distribute rewards
        await Promise.all(creditShares.map(async share => {
          const collaborator = this.agents.get(share.agentId);
          if (collaborator) {
            // Update RL policy
            await this.rlService.updatePolicy(
              share.agentId,
              { type: 'complete_task', targetId: taskId },
              {
                immediate: share.share,
                longTerm: performance.quality * share.share,
                feedback: performance.collaboration * share.share,
                collaboration: share.share
              }
            );

            // Award XP
            await this.xpEngine.updateAgentXP(collaborator, share.share);
          }
        }));
      } else {
        // Single agent task - update policy and award full reward
        await this.rlService.updatePolicy(
          agent.id,
          { type: 'complete_task', targetId: taskId },
          {
            immediate: reward,
            longTerm: performance.quality * reward,
            feedback: performance.quality,
            collaboration: 0
          }
        );
        await this.xpEngine.updateAgentXP(agent, reward);
      }

      // Update agent metrics
      this.updateMetrics(
        agent.id,
        status === 'completed',
        performance
      );

      // Update reward weights
      this.rewardStructure.updateWeights(agent.id);

      logger.info({ 
        taskId,
        agentId: agent.id,
        status,
        reward,
        performance 
      }, 'Task status and rewards updated');

    } catch (error) {
      logger.error({ 
        error,
        taskId,
        agentId: agent.id 
      }, 'Failed to update task status');
    }
  }

  private getTaskCollaborators(taskId: string) {
    // This is a placeholder - implement actual collaboration tracking
    return [];
  }

  private updateMetrics(
    agentId: string,
    success: boolean,
    performance: {
      completionTime: number;
      quality: number;
      collaboration: number;
    }
  ) {
    const currentMetrics = this.metrics.get(agentId);
    if (!currentMetrics) return;

    const learningRate = this.learningRates.get(agentId) || 0.1;

    // Update metrics using exponential moving average
    const updatedMetrics: PerformanceMetrics = {
      successRate: (1 - learningRate) * currentMetrics.successRate + 
                  learningRate * (success ? 1 : 0),
      averageCompletionTime: (1 - learningRate) * currentMetrics.averageCompletionTime +
                            learningRate * performance.completionTime,
      complexityScore: (1 - learningRate) * currentMetrics.complexityScore +
                      learningRate * performance.quality,
      collaborationScore: (1 - learningRate) * currentMetrics.collaborationScore +
                         learningRate * performance.collaboration,
      lastUpdated: new Date(),
    };

    // Adjust learning rate based on performance
    const newLearningRate = this.adjustLearningRate(
      agentId,
      success,
      performance.quality
    );

    this.metrics.set(agentId, updatedMetrics);
    this.learningRates.set(agentId, newLearningRate);

    logger.debug({ 
      agentId,
      metrics: updatedMetrics,
      learningRate: newLearningRate 
    }, 'Agent metrics updated');
  }

  private adjustLearningRate(
    agentId: string,
    success: boolean,
    quality: number
  ): number {
    const currentRate = this.learningRates.get(agentId) || 0.1;
    
    // Increase learning rate for high-quality successes
    if (success && quality > 0.8) {
      return Math.min(0.3, currentRate * 1.1);
    }
    
    // Decrease learning rate for failures
    if (!success) {
      return Math.max(0.05, currentRate * 0.9);
    }
    
    return currentRate;
  }

  getAgentStatus(agentId: string): Agent['status'] | null {
    const agent = this.agents.get(agentId);
    return agent ? agent.status : null;
  }

  getAgentMetrics(agentId: string): PerformanceMetrics | null {
    return this.metrics.get(agentId) || null;
  }

  getTierRequirements(tier: AgentTier['type']): AgentTier | undefined {
    return this.TIERS.find(t => t.type === tier);
  }

  getAgentRewardStats(agentId: string) {
    return {
      rewardStats: this.rewardStructure.getRewardStats(agentId),
      creditHistory: Array.from(this.assignments.values())
        .filter(a => a.agentId === agentId)
        .map(a => this.creditAssignment.getContributionStats(a.taskId))
        .filter(Boolean)
    };
  }

  getSystemRewardStats() {
    return {
      agentRewards: Array.from(this.agents.keys()).map(agentId => ({
        agentId,
        ...this.getAgentRewardStats(agentId)
      })),
      globalMetrics: this.getSystemMetrics()
    };
  }

  getAgentLearningStats(agentId: string) {
    return {
      rlMetrics: this.rlService.getAgentMetrics(agentId),
      rewardStats: this.rewardStructure.getRewardStats(agentId),
      creditHistory: Array.from(this.assignments.values())
        .filter(a => a.agentId === agentId)
        .map(a => this.creditAssignment.getContributionStats(a.taskId))
        .filter(Boolean)
    };
  }

  getSystemLearningStats() {
    return {
      rlMetrics: this.rlService.getSystemMetrics(),
      agentRewards: Array.from(this.agents.keys()).map(agentId => ({
        agentId,
        ...this.getAgentLearningStats(agentId)
      })),
      globalMetrics: this.getSystemMetrics()
    };
  }
}