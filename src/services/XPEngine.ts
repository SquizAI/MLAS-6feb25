import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import pino from 'pino';
import type { Idea, Task, Agent } from '../lib/types';
import { KnowledgeGraphService } from './KnowledgeGraph';

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

interface Achievement {
  id: string;
  type: AchievementType;
  title: string;
  description: string;
  xpReward: number;
  requirements: {
    metric: string;
    value: number;
  }[];
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  icon: string;
}

type AchievementType = 
  | 'task_completion'
  | 'skill_mastery'
  | 'collaboration'
  | 'innovation'
  | 'efficiency'
  | 'quality'
  | 'milestone';

interface Milestone {
  id: string;
  agentId: string;
  type: string;
  value: number;
  timestamp: Date;
  xpAwarded: number;
}

interface SkillProgress {
  skillId: string;
  level: number;
  currentXP: number;
  nextLevelXP: number;
}

export class XPEngine extends EventEmitter {
  private achievements: Map<string, Achievement>;
  private milestones: Map<string, Milestone[]>;
  private skillProgress: Map<string, SkillProgress>;
  private reputationScores: Map<string, Record<string, number>>;
  private leaderboards: Map<string, Map<string, number>>;
  private reputationScores: Map<string, {
    overall: number;
    categories: {
      taskQuality: number;
      communication: number;
      reliability: number;
      innovation: number;
      collaboration: number;
      emotionalIntelligence: number;
    };
    confidence: number;
    trend: 'increasing' | 'stable' | 'decreasing';
  }>;

  // XP calculation constants
  private static readonly BASE_TASK_XP = 50;
  private static readonly DIFFICULTY_MULTIPLIER = 1.5;
  private static readonly SPEED_BONUS = 25;
  private static readonly QUALITY_MULTIPLIER = 2;
  private static readonly COLLABORATION_BONUS = 15;
  private static readonly INNOVATION_BONUS = 30;
  private static readonly STREAK_MULTIPLIER = 0.1;
  private static readonly EMOTIONAL_BONUS = 20;
  private static readonly STREAK_MULTIPLIER = 1.2;
  private static readonly DIFFICULTY_BONUS = 25;
  private static readonly EMOTIONAL_HANDLING_BONUS = 20;
  private static readonly FEEDBACK_MULTIPLIER = 1.5;
  private static readonly MILESTONE_BONUS = 50;

  constructor(private knowledgeGraph: KnowledgeGraphService) {
    super();
    this.achievements = new Map();
    this.milestones = new Map();
    this.skillProgress = new Map();
    this.reputationScores = new Map();
    this.leaderboards = new Map();
    this.achievementProgress = new Map();
    this.initializeAchievements();
  }

  private initializeAchievements() {
    // Core achievements
    this.addAchievement({
      id: 'task_master_bronze',
      type: 'task_completion',
      title: 'Task Master Bronze',
      description: 'Complete 10 tasks successfully',
      xpReward: 100,
      requirements: [
        { metric: 'tasks_completed', value: 10 },
        { metric: 'success_rate', value: 0.8 }
      ],
      tier: 'bronze',
      icon: 'check-circle',
    });

    // Quality achievements
    this.addAchievement({
      id: 'quality_champion_silver',
      type: 'quality',
      title: 'Quality Champion Silver',
      description: 'Maintain 90% quality rating for 20 tasks',
      xpReward: 250,
      requirements: [
        { metric: 'quality_rating', value: 0.9 },
        { metric: 'tasks_completed', value: 20 },
      ],
      tier: 'silver',
      icon: 'award',
    });

    // Innovation achievements
    this.addAchievement({
      id: 'innovation_master_gold',
      type: 'innovation',
      title: 'Innovation Master Gold',
      description: 'Propose 5 successful workflow optimizations',
      xpReward: 500,
      requirements: [
        { metric: 'workflow_improvements', value: 5 },
        { metric: 'innovation_score', value: 0.8 }
      ],
      tier: 'gold',
      icon: 'lightbulb',
    });

    // Collaboration achievements
    this.addAchievement({
      id: 'team_player_silver',
      type: 'collaboration',
      title: 'Team Player Silver',
      description: 'Successfully collaborate on 15 tasks',
      xpReward: 300,
      requirements: [
        { metric: 'collaborative_tasks', value: 15 },
        { metric: 'collaboration_score', value: 0.85 }
      ],
      tier: 'silver',
      icon: 'users',
    });

    // Emotional intelligence achievements
    this.addAchievement({
      id: 'empathy_master_gold',
      type: 'emotional_intelligence',
      title: 'Empathy Master Gold',
      description: 'Maintain high emotional intelligence score',
      xpReward: 400,
      requirements: [
        { metric: 'emotional_intelligence', value: 0.9 },
        { metric: 'tasks_completed', value: 30 }
      ],
      tier: 'gold',
      icon: 'heart',
    });

    // Add emotional intelligence achievements
    this.addAchievement({
      id: 'empathy_master',
      type: 'emotional_intelligence',
      title: 'Empathy Master',
      description: 'Successfully handle high-emotion situations',
      xpReward: 300,
      requirements: [
        { metric: 'emotional_handling', value: 0.9 },
        { metric: 'tasks_completed', value: 15 }
      ],
      tier: 'gold',
      icon: 'heart',
    });

    // Add streak achievements
    this.addAchievement({
      id: 'consistency_champion',
      type: 'consistency',
      title: 'Consistency Champion',
      description: 'Maintain high performance for 30 days',
      xpReward: 500,
      requirements: [
        { metric: 'daily_completion', value: 30 },
        { metric: 'quality_rating', value: 0.8 }
      ],
      tier: 'platinum',
      icon: 'trending-up',
    });
  }

  private async updateLeaderboards(agentId: string, category: string, score: number) {
    const categoryBoard = this.leaderboards.get(category) || new Map();
    categoryBoard.set(agentId, score);
    this.leaderboards.set(category, categoryBoard);
    await this.persistLeaderboardUpdate(category, agentId, score);

    // Add more achievements...
  }

  private addAchievement(achievement: Achievement) {
    this.achievements.set(achievement.id, achievement);
    logger.debug({ achievementId: achievement.id }, 'Achievement added');
  }

  calculateTaskCompletion(
    task: Task,
    completionTime: number,
    quality: number,
    performance: {
      innovations: number;
      collaboration: number;
      emotionalAlignment: number;
      streakMultiplier: number;
    }
  ): number {
    let xp = XPEngine.BASE_TASK_XP;

    // Adjust for task difficulty
    xp *= Math.pow(XPEngine.DIFFICULTY_MULTIPLIER, task.priority);

    // Speed bonus for quick completion
    const expectedTime = task.data?.estimatedTime || 100;
    if (completionTime < expectedTime * 0.8) {
      xp += XPEngine.SPEED_BONUS;
    }

    // Quality multiplier
    xp *= 1 + (quality * XPEngine.QUALITY_MULTIPLIER);

    // Innovation bonus
    xp += performance.innovations * XPEngine.INNOVATION_BONUS;

    // Collaboration bonus if task involved multiple agents
    if (performance.collaboration > 0) {
      xp += XPEngine.COLLABORATION_BONUS * performance.collaboration;
    }

    logger.debug({ 
      taskId: task.id,
      baseXP: XPEngine.BASE_TASK_XP,
      finalXP: xp,
      factors: {
        difficulty: task.priority,
        completionTime,
        quality,
        innovations: performance.innovations,
        collaboration: performance.collaboration,
        emotionalAlignment: performance.emotionalAlignment,
        streakMultiplier: performance.streakMultiplier
      },
    }, 'Task XP calculated');

    return Math.round(xp);
  }

  async updateAgentXP(agent: Agent, xpGain: number): Promise<Agent> {
    try {
      // Update agent's total XP
      const updatedAgent = {
        ...agent,
        streakDays: agent.streakDays || 0,
        lastActive: new Date(),
        stats: {
          ...agent.stats,
          totalTasksCompleted: (agent.stats?.totalTasksCompleted || 0) + 1
        },
        xp: agent.xp + xpGain,
      };

      // Update skill-specific XP
      for (const skill of agent.skills) {
        await this.updateSkillProgress(agent.id, skill, xpGain * 0.2);
      }
      
      // Apply streak bonus if applicable
      if (this.isStreakMaintained(agent)) {
        const streakBonus = Math.floor(xpGain * (XPEngine.STREAK_MULTIPLIER - 1));
        updatedAgent.xp += streakBonus;
        updatedAgent.streakDays += 1;
      }

      // Check for achievements
      await this.checkAchievements(updatedAgent);

      // Update reputation score
      await this.updateReputationScores(agent.id, {
        taskQuality: updatedAgent.stats.averageQuality || 0,
        reliability: this.calculateReliability(updatedAgent),
        innovation: this.calculateInnovationScore(updatedAgent),
        collaboration: this.calculateCollaborationScore(updatedAgent),
        emotionalIntelligence: await this.calculateEmotionalIntelligence(updatedAgent)
      });

      // Update leaderboards
      await this.updateLeaderboards(agent.id, 'xp', updatedAgent.xp);

      // Record milestone if significant XP gain
      if (xpGain >= 100) {
        await this.recordMilestone(agent.id, 'xp_gain', xpGain);
      }

      // Update knowledge graph
      this.knowledgeGraph.addXPEvent(agent.id, xpGain);

      logger.info({ 
        agentId: agent.id,
        xpGain,
        totalXP: updatedAgent.xp,
      }, 'Agent XP updated');

      return updatedAgent;
    } catch (error) {
      logger.error({ error, agentId: agent.id }, 'Failed to update agent XP');
      throw error;
    }
  }

  private async calculateEmotionalIntelligence(agent: Agent): Promise<number> {
    const recentTasks = await this.knowledgeGraph.query({
      nodeTypes: ['task'],
      filters: [
        { property: 'assignedAgentId', operator: 'eq', value: agent.id },
        { property: 'metadata.emotional', operator: 'exists', value: true }
      ],
      limit: 20
    });

    if (recentTasks.length === 0) return 0;

    const scores = recentTasks.map(task => {
      const emotional = task.data.metadata.emotional;
      return {
        appropriateness: emotional.responseAppropriateness || 0,
        effectiveness: emotional.handlingEffectiveness || 0,
        userSatisfaction: emotional.userSatisfaction || 0
      };
    });

    return scores.reduce((sum, score) => 
      sum + (score.appropriateness + score.effectiveness + score.userSatisfaction) / 3
    , 0) / scores.length;
  }

  private calculateReliability(agent: Agent): number {
    const completedTasks = agent.stats?.totalTasksCompleted || 0;
    const failedTasks = agent.stats?.totalTasksFailed || 0;
    return completedTasks / (completedTasks + failedTasks);
  }

  private calculateInnovationScore(agent: Agent): number {
    return (agent.stats?.workflowImprovements || 0) / 100;
  }

  private calculateCollaborationScore(agent: Agent): number {
    const collaborativeTasks = agent.stats?.collaborativeTasks || 0;
    return collaborativeTasks / (agent.stats?.totalTasksCompleted || 1);
  }

  private async updateSkillProgress(
    agentId: string,
    skillId: string,
    xpGain: number
  ) {
    const key = `${agentId}:${skillId}`;
    const progress = this.skillProgress.get(key) || {
      skillId,
      level: 1,
      currentXP: 0,
      nextLevelXP: this.calculateNextLevelXP(1),
    };

    progress.currentXP += xpGain;

    // Check for level up
    while (progress.currentXP >= progress.nextLevelXP) {
      progress.level += 1;
      progress.currentXP -= progress.nextLevelXP;
      progress.nextLevelXP = this.calculateNextLevelXP(progress.level);

      // Emit level up event
      this.emit('skill:levelup', {
        agentId,
        skillId,
        newLevel: progress.level,
      });

      // Record milestone
      await this.recordMilestone(
        agentId,
        'skill_levelup',
        progress.level
      );
    }

    this.skillProgress.set(key, progress);
  }

  private calculateNextLevelXP(currentLevel: number): number {
    // Experience curve: Each level requires 50% more XP than the previous
    return Math.round(100 * Math.pow(1.5, currentLevel - 1));
  }

  private async checkAchievements(agent: Agent) {
    for (const achievement of this.achievements.values()) {
      if (await this.hasEarnedAchievement(agent, achievement)) {
        await this.awardAchievement(agent.id, achievement);
      }
    }

    // Update achievement progress
    const progress = this.achievementProgress.get(agent.id) || new Map();
    for (const [achievementId, achievement] of this.achievements) {
      const currentProgress = await this.calculateAchievementProgress(agent, achievement);
      progress.set(achievementId, currentProgress);
    }
  }

  private async hasEarnedAchievement(
    agent: Agent,
    achievement: Achievement
  ): Promise<boolean> {
    // Query knowledge graph for metrics
    // Add emotional intelligence metrics
    const metrics = await this.knowledgeGraph.query({
      nodeTypes: ['xp_event', 'task'],
      filters: [
        { property: 'data.agentId', operator: 'eq', value: agent.id },
      ],
    });

    const emotionalMetrics = await this.knowledgeGraph.query({
      nodeTypes: ['emotional_states'],
      filters: [{ property: 'agentId', operator: 'eq', value: agent.id }]
    });

    // Check each requirement
    return achievement.requirements.every(req => {
      switch (req.metric) {
        case 'tasks_completed':
          return metrics.filter(m => 
            m.type === 'task' && m.data.status === 'completed'
          ).length >= req.value;

        case 'quality_rating':
          const tasks = metrics.filter(m => m.type === 'task');
          const avgQuality = tasks.reduce((sum, t) => 
            sum + (t.data.quality || 0), 0
          ) / tasks.length;
          return avgQuality >= req.value;

        case 'emotional_handling':
          const emotionalTasks = emotionalMetrics.length;
          const successfulHandling = emotionalMetrics.filter(m => 
            m.data.handlingScore >= 0.8
          ).length;
          return successfulHandling / emotionalTasks >= req.value;
        // Add more metric checks...
        default:
          return false;
      }
    });
  }

  private async calculateAchievementProgress(
    agent: Agent,
    achievement: Achievement
  ): Promise<number> {
    const progress = await Promise.all(
      achievement.requirements.map(async req => {
        const current = await this.getMetricValue(agent.id, req.metric);
        return Math.min(1, current / req.value);
      })
    );

    return progress.reduce((avg, p) => avg + p, 0) / progress.length;
  }

  private async getMetricValue(agentId: string, metric: string): Promise<number> {
    // Implement metric value retrieval
    return 0;
  }

  private async awardAchievement(
    agentId: string,
    achievement: Achievement
  ) {
    // Award XP bonus
    const agent = await this.knowledgeGraph.query({
      nodeTypes: ['agent'],
      limit: 1,
      filters: [{ property: 'id', operator: 'eq', value: agentId }],
    })[0];

    if (agent) {
      await this.updateAgentXP(agent.data, achievement.xpReward);
    }

    // Update achievement completion
    const progress = this.achievementProgress.get(agentId) || new Map();
    progress.set(achievement.id, 1);
    this.achievementProgress.set(agentId, progress);
    await this.persistAchievementCompletion(agentId, achievement.id);

    // Record achievement
    await this.recordMilestone(
      agentId,
      'achievement',
      achievement.xpReward,
      achievement.id
    );

    // Update leaderboards
    const totalAchievements = Array.from(progress.values())
      .filter(p => p >= 1).length;
    await this.updateLeaderboards(agentId, 'achievements', totalAchievements);

    // Emit achievement event
    this.emit('achievement:earned', {
      agentId,
      achievementId: achievement.id,
      xpAwarded: achievement.xpReward,
    });

    logger.info({ 
      agentId,
      achievement: achievement.id,
      xpAwarded: achievement.xpReward,
    }, 'Achievement awarded');
  }

  private async recordMilestone(
    agentId: string,
    type: string,
    value: number,
    metadata?: string
  ) {
    const milestone: Milestone = {
      id: uuidv4(),
      agentId,
      type,
      value,
      timestamp: new Date(),
      xpAwarded: type === 'achievement' ? value : 0,
    };

    const agentMilestones = this.milestones.get(agentId) || [];
    agentMilestones.push(milestone);
    this.milestones.set(agentId, agentMilestones);

    // Update knowledge graph
    this.knowledgeGraph.addMilestone(milestone);

    logger.debug({ 
      agentId,
      milestone: {
        type,
        value,
        metadata,
      },
    }, 'Milestone recorded');
  }

  private async updateReputationScore(agentId: string) {
    const performanceData = await this.knowledgeGraph.query({
      nodeTypes: ['task', 'feedback'],
      filters: [
        { property: 'data.agentId', operator: 'eq', value: agentId },
      ],
      orderBy: {
        property: 'metadata.createdAt',
        direction: 'desc',
      },
      limit: 50,
    });

    const categoryWeights = {
      taskCompletion: 0.3,
      quality: 0.25,
      efficiency: 0.2,
      collaboration: 0.15,
      innovation: 0.1,
      emotionalIntelligence: 0.2,
    };

    const scores = {
      taskQuality: this.calculateTaskQualityScore(performanceData),
      communication: this.calculateCommunicationScore(performanceData),
      reliability: this.calculateReliabilityScore(performanceData),
      innovation: this.calculateInnovationScore(performanceData),
      collaboration: this.calculateCollaborationScore(performanceData),
      emotionalIntelligence: this.calculateEmotionalScore(performanceData),
    };

    // Calculate overall score
    const overallScore = Object.entries(scores).reduce(
      (sum, [category, score]) => sum + score * categoryWeights[category],
      0
    );

    // Calculate confidence based on sample size
    const confidence = Math.min(
      1,
      performanceData.length / 50 // Full confidence at 50+ data points
    );

    // Determine trend
    const previousScore = this.reputationScores.get(agentId)?.overall || 0;
    const trend = overallScore > previousScore * 1.05
      ? 'increasing'
      : overallScore < previousScore * 0.95
        ? 'decreasing'
        : 'stable';

    // Update reputation scores
    this.reputationScores.set(agentId, {
      overall: overallScore,
      categories: scores,
      confidence,
      trend,
    });

    logger.debug({ 
      agentId,
      reputationUpdate: {
        overall: overallScore,
        categories: scores,
        confidence,
        trend,
      },
    }, 'Reputation scores updated');

    return overallScore;
  }

  private calculateTaskQualityScore(data: any[]): number {
    const tasks = data.filter(n => n.type === 'task');
    const completedTasks = tasks.filter(t => t.data.status === 'completed');
    
    if (completedTasks.length === 0) return 0;

    return completedTasks.reduce((sum, task) => 
      sum + (task.data.quality || 0), 0
    ) / completedTasks.length;
  }

  private calculateCommunicationScore(data: any[]): number {
    const feedback = data.filter(n => 
      n.type === 'feedback' && 
      n.data.category === 'communication'
    );

    if (feedback.length === 0) return 0;

    return feedback.reduce((sum, f) => 
      sum + (f.data.rating || 0), 0
    ) / feedback.length;
  }

  private calculateReliabilityScore(data: any[]): number {
    const tasks = data.filter(n => n.type === 'task');
    if (tasks.length === 0) return 0;

    const onTimeCompletions = tasks.filter(t => {
      const actualTime = t.data.completionTime || 0;
      const estimatedTime = t.data.estimatedTime || 100;
      return actualTime <= estimatedTime * 1.1; // 10% buffer
    }).length;

    return onTimeCompletions / tasks.length;
  }

  private calculateInnovationScore(data: any[]): number {
    const improvements = data.filter(n => 
      n.type === 'feedback' && 
      n.data.type === 'improvement'
    ).length;

    return Math.min(1, improvements / 5);
  }

  private calculateCollaborationScore(data: any[]): number {
    const tasks = data.filter(n => n.type === 'task');
    if (tasks.length === 0) return 0;

    const collaborativeTasks = tasks.filter(t => 
      t.data.collaborators?.length > 0
    ).length;

    return collaborativeTasks / tasks.length;
  }

  private calculateEmotionalScore(data: any[]): number {
    const emotionalFeedback = data.filter(n => 
      n.type === 'feedback' && 
      n.data.category === 'emotional_intelligence'
    );

    if (emotionalFeedback.length === 0) return 0;

    return emotionalFeedback.reduce((sum, f) => 
      sum + (f.data.rating || 0), 0
    ) / emotionalFeedback.length;

    logger.debug({ 
      agentId,
      reputationScore: score,
      components: {
        taskCompletion: completedTasks.length / Math.max(1, tasks.length),
        quality: avgQuality,
        efficiency: efficiencyScore,
        collaboration: collaborativeTasks / Math.max(1, completedTasks.length),
        innovations: innovations / 5,
      },
    }, 'Reputation score updated');

    return score;
  }

  calculateIdeaXP(idea: Idea): number {
    let xp = 50; // Base XP for new ideas

    // Factor in metadata
    xp += Math.abs(idea.metadata.sentiment) * 20; // Higher sentiment impact = more XP
    xp += idea.metadata.urgency * 30; // Higher urgency = more XP
    
    // Context bonus
    if (idea.metadata.context !== 'general') {
      xp += 25; // Bonus for specific context
    }

    // Complexity bonus based on semantic analysis
    if (idea.metadata.complexity) {
      xp += idea.metadata.complexity * 40;
    }

    logger.debug({ 
      ideaId: idea.id,
      baseXP: 50,
      finalXP: xp,
      factors: {
        sentiment: idea.metadata.sentiment,
        urgency: idea.metadata.urgency,
        context: idea.metadata.context,
        complexity: idea.metadata.complexity,
      },
    }, 'Idea XP calculated');

    return Math.round(xp);
  }

  getAgentAchievements(agentId: string): Achievement[] {
    const milestones = this.milestones.get(agentId) || [];
    return milestones
      .filter(m => m.type === 'achievement')
      .map(m => this.achievements.get(m.id))
      .filter(Boolean) as Achievement[];
  }

  getSkillProgress(agentId: string, skillId: string): SkillProgress | null {
    return this.skillProgress.get(`${agentId}:${skillId}`) || null;
  }

  getReputationScore(agentId: string): number {
    return this.reputationScores.get(agentId) || 0;
  }
}