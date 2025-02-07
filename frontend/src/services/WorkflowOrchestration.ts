import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import pino from 'pino';
import type { Task, Agent } from '../lib/types';
import { KnowledgeGraphService } from './KnowledgeGraph';
import { AgentCoordinationService } from './AgentCoordination';
import { TaskDecompositionService } from './TaskDecomposition';
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

interface WorkflowMetrics {
  throughput: number;
  averageCompletionTime: number;
  successRate: number;
  bottlenecks: string[];
  resourceUtilization: number;
  lastUpdated: Date;
}

interface FeedbackEntry {
  id: string;
  taskId: string;
  agentId: string;
  type: 'user' | 'system' | 'agent';
  rating: number;
  comments: string;
  metrics: {
    completionTime: number;
    quality: number;
    efficiency: number;
  };
  timestamp: Date;
}

export class WorkflowOrchestrationService extends EventEmitter {
  private workflows: Map<string, Task[]>;
  private feedback: Map<string, FeedbackEntry[]>;
  private metrics: WorkflowMetrics;
  private adaptiveThresholds: Map<string, number>;
  private recoveryStrategies: Map<string, Function>;

  constructor(
    private knowledgeGraph: KnowledgeGraphService,
    private agentCoordination: AgentCoordinationService,
    private taskDecomposition: TaskDecompositionService,
    private xpEngine: XPEngine
  ) {
    super();
    this.workflows = new Map();
    this.feedback = new Map();
    this.initializeMetrics();
    this.setupRecoveryStrategies();
    this.startPerformanceMonitoring();
  }

  private initializeMetrics() {
    this.metrics = {
      throughput: 0,
      averageCompletionTime: 0,
      successRate: 0,
      bottlenecks: [],
      resourceUtilization: 0,
      lastUpdated: new Date(),
    };

    this.adaptiveThresholds = new Map([
      ['quality', 0.8],
      ['efficiency', 0.7],
      ['responseTime', 5000], // ms
    ]);
  }

  private setupRecoveryStrategies() {
    this.recoveryStrategies = new Map([
      ['task_failure', this.handleTaskFailure.bind(this)],
      ['agent_overload', this.handleAgentOverload.bind(this)],
      ['quality_drop', this.handleQualityDrop.bind(this)],
      ['deadline_risk', this.handleDeadlineRisk.bind(this)],
    ]);
  }

  async processFeedback(feedback: Omit<FeedbackEntry, 'id' | 'timestamp'>) {
    try {
      const entry: FeedbackEntry = {
        ...feedback,
        id: uuidv4(),
        timestamp: new Date(),
      };

      // Store feedback
      const taskFeedback = this.feedback.get(feedback.taskId) || [];
      taskFeedback.push(entry);
      this.feedback.set(feedback.taskId, taskFeedback);

      // Update knowledge graph
      this.knowledgeGraph.addFeedback(
        feedback.agentId,
        feedback.taskId,
        feedback.rating,
        feedback.comments
      );

      // Update agent metrics
      await this.agentCoordination.updateTaskStatus(
        feedback.taskId,
        feedback.rating >= 3 ? 'completed' : 'failed',
        {
          completionTime: feedback.metrics.completionTime,
          quality: feedback.rating / 5,
          collaboration: feedback.metrics.efficiency,
        }
      );

      // Trigger workflow optimization if needed
      await this.analyzeAndOptimize(feedback);

      logger.info({
        feedbackId: entry.id,
        taskId: feedback.taskId,
        rating: feedback.rating,
      }, 'Feedback processed successfully');

    } catch (error) {
      logger.error({ error, feedback }, 'Failed to process feedback');
      throw error;
    }
  }

  private async analyzeAndOptimize(feedback: FeedbackEntry) {
    // Check for quality issues
    if (feedback.rating < 3 || feedback.metrics.quality < this.adaptiveThresholds.get('quality')!) {
      await this.handleQualityDrop(feedback.taskId);
    }

    // Check for efficiency issues
    if (feedback.metrics.efficiency < this.adaptiveThresholds.get('efficiency')!) {
      await this.optimizeWorkflow(feedback.taskId);
    }

    // Update thresholds based on recent performance
    this.updateAdaptiveThresholds(feedback);
  }

  private async handleTaskFailure(taskId: string) {
    const task = await this.knowledgeGraph.query({
      nodeTypes: ['task'],
      filters: [{ property: 'id', operator: 'eq', value: taskId }],
    })[0];

    if (!task) return;

    logger.info({ taskId }, 'Initiating task failure recovery');

    // Reassign task to a different agent
    const currentAgent = task.data.assignedAgentId;
    task.data.assignedAgentId = undefined;
    task.data.status = 'pending';
    
    // Find new agent, excluding the previous one
    const success = await this.agentCoordination.assignTask(task.data);

    if (success) {
      logger.info({ 
        taskId,
        previousAgent: currentAgent,
        newAgent: task.data.assignedAgentId 
      }, 'Task reassigned successfully');
    } else {
      // If reassignment fails, decompose task into smaller subtasks
      const subtasks = await this.taskDecomposition.decomposeIdea({
        id: uuidv4(),
        content: task.data.description,
        source: 'recovery',
        createdAt: new Date(),
        metadata: task.data.metadata,
        xp: task.data.xp,
      });

      logger.info({ 
        taskId,
        subtaskCount: subtasks.length 
      }, 'Task decomposed for recovery');
    }
  }

  private async handleAgentOverload(agentId: string) {
    const agent = await this.knowledgeGraph.query({
      nodeTypes: ['agent'],
      filters: [{ property: 'id', operator: 'eq', value: agentId }],
    })[0];

    if (!agent) return;

    logger.info({ agentId }, 'Handling agent overload');

    // Get agent's current tasks
    const tasks = Array.from(this.workflows.values())
      .flat()
      .filter(task => task.assignedAgentId === agentId);

    // Sort tasks by priority and reassign lower priority ones
    const sortedTasks = tasks.sort((a, b) => b.priority - a.priority);
    
    for (let i = Math.floor(sortedTasks.length / 2); i < sortedTasks.length; i++) {
      const task = sortedTasks[i];
      task.assignedAgentId = undefined;
      await this.agentCoordination.assignTask(task);
    }

    logger.info({ 
      agentId,
      reassignedTasks: Math.floor(sortedTasks.length / 2) 
    }, 'Agent workload rebalanced');
  }

  private async handleQualityDrop(taskId: string) {
    const task = await this.knowledgeGraph.query({
      nodeTypes: ['task'],
      filters: [{ property: 'id', operator: 'eq', value: taskId }],
    })[0];

    if (!task) return;

    logger.info({ taskId }, 'Handling quality drop');

    // Analyze feedback patterns
    const taskFeedback = this.feedback.get(taskId) || [];
    const recentFeedback = taskFeedback
      .slice(-5)
      .filter(f => f.rating < 3);

    if (recentFeedback.length >= 3) {
      // Significant quality issues detected
      const commonIssues = this.analyzeCommonIssues(recentFeedback);
      
      // Update task requirements based on issues
      task.data.requiredSkills = [
        ...new Set([...task.data.requiredSkills, ...commonIssues]),
      ];

      // Reassign to more experienced agent
      task.data.assignedAgentId = undefined;
      await this.agentCoordination.assignTask(task);

      logger.info({ 
        taskId,
        issues: commonIssues 
      }, 'Task requirements updated and reassigned');
    }
  }

  private async handleDeadlineRisk(taskId: string) {
    const task = await this.knowledgeGraph.query({
      nodeTypes: ['task'],
      filters: [{ property: 'id', operator: 'eq', value: taskId }],
    })[0];

    if (!task) return;

    logger.info({ taskId }, 'Handling deadline risk');

    // Calculate remaining time
    const deadline = new Date(task.data.deadline);
    const timeRemaining = deadline.getTime() - Date.now();
    
    if (timeRemaining < task.data.estimatedTime * 60000) {
      // Not enough time remaining, need intervention
      
      // Option 1: Parallelize task
      const subtasks = await this.taskDecomposition.decomposeIdea({
        id: uuidv4(),
        content: task.data.description,
        source: 'deadline_risk',
        createdAt: new Date(),
        metadata: { ...task.data.metadata, urgency: 1 },
        xp: task.data.xp,
      });

      // Option 2: Assign additional agents
      const highPerformanceAgents = await this.findHighPerformanceAgents(
        task.data.requiredSkills
      );

      for (const agent of highPerformanceAgents) {
        const subtask = subtasks.shift();
        if (subtask) {
          await this.agentCoordination.assignTask(subtask);
        }
      }

      logger.info({ 
        taskId,
        subtaskCount: subtasks.length,
        assignedAgents: highPerformanceAgents.length 
      }, 'Deadline risk mitigated');
    }
  }

  private async findHighPerformanceAgents(
    requiredSkills: string[]
  ): Promise<Agent[]> {
    const agents = await this.knowledgeGraph.query({
      nodeTypes: ['agent'],
      filters: [
        { 
          property: 'data.status',
          operator: 'eq',
          value: 'idle',
        },
      ],
    });

    return agents
      .map(node => node.data as Agent)
      .filter(agent => {
        const metrics = this.agentCoordination.getAgentMetrics(agent.id);
        return metrics && metrics.successRate > 0.8;
      })
      .filter(agent => 
        requiredSkills.some(skill => agent.skills.includes(skill))
      )
      .slice(0, 3); // Limit to top 3 agents
  }

  private analyzeCommonIssues(feedback: FeedbackEntry[]): string[] {
    const issues = new Set<string>();

    // Extract keywords from feedback comments
    feedback.forEach(entry => {
      const keywords = entry.comments.toLowerCase().match(
        /\b(quality|performance|skill|knowledge|communication|time|accuracy)\b/g
      );
      
      if (keywords) {
        keywords.forEach(keyword => issues.add(keyword));
      }
    });

    return Array.from(issues);
  }

  private async optimizeWorkflow(taskId: string) {
    const workflow = this.workflows.get(taskId);
    if (!workflow) return;

    logger.info({ taskId }, 'Optimizing workflow');

    // Analyze workflow patterns
    const bottlenecks = this.identifyBottlenecks(workflow);
    const inefficientPaths = this.findInefficientPaths(workflow);

    // Update task dependencies
    for (const path of inefficientPaths) {
      await this.reorderTasks(path);
    }

    // Adjust resource allocation for bottlenecks
    for (const bottleneck of bottlenecks) {
      await this.handleAgentOverload(bottleneck.assignedAgentId!);
    }

    logger.info({ 
      taskId,
      bottlenecks: bottlenecks.length,
      inefficientPaths: inefficientPaths.length 
    }, 'Workflow optimized');
  }

  private identifyBottlenecks(workflow: Task[]): Task[] {
    return workflow.filter(task => {
      const feedback = this.feedback.get(task.id) || [];
      const avgCompletionTime = feedback.reduce(
        (sum, f) => sum + f.metrics.completionTime, 
        0
      ) / feedback.length;

      return avgCompletionTime > task.data.estimatedTime * 1.5;
    });
  }

  private findInefficientPaths(workflow: Task[]): Task[][] {
    const paths: Task[][] = [];
    const visited = new Set<string>();

    const dfs = (task: Task, currentPath: Task[]) => {
      if (visited.has(task.id)) return;
      visited.add(task.id);
      currentPath.push(task);

      // Check if current path is inefficient
      const pathTime = currentPath.reduce(
        (sum, t) => sum + t.data.estimatedTime,
        0
      );
      const actualTime = currentPath.reduce((sum, t) => {
        const feedback = this.feedback.get(t.id) || [];
        return sum + feedback.reduce(
          (fSum, f) => fSum + f.metrics.completionTime,
          0
        ) / Math.max(1, feedback.length);
      }, 0);

      if (actualTime > pathTime * 1.3) {
        paths.push([...currentPath]);
      }

      // Continue DFS
      const dependencies = workflow.filter(t => 
        t.data.dependencies.includes(task.id)
      );
      dependencies.forEach(dep => dfs(dep, [...currentPath]));
    };

    // Start DFS from each root task
    const rootTasks = workflow.filter(
      task => task.data.dependencies.length === 0
    );
    rootTasks.forEach(task => dfs(task, []));

    return paths;
  }

  private async reorderTasks(path: Task[]) {
    // Analyze task dependencies
    for (let i = 0; i < path.length - 1; i++) {
      const current = path[i];
      const next = path[i + 1];

      // Check if tasks can be parallelized
      if (!this.hasDirectDependency(current, next)) {
        // Remove dependency
        next.data.dependencies = next.data.dependencies
          .filter(id => id !== current.id);
        
        // Update in knowledge graph
        this.knowledgeGraph.updateTaskDependencies(next.id, next.data.dependencies);
      }
    }
  }

  private hasDirectDependency(task1: Task, task2: Task): boolean {
    // Analyze task content and requirements to determine if
    // there's a true dependency or if it was overly conservative
    const content1 = task1.description.toLowerCase();
    const content2 = task2.description.toLowerCase();

    // Check for strong dependency indicators
    const dependencyKeywords = [
      'requires',
      'depends on',
      'after',
      'following',
      'using results from',
    ];

    return dependencyKeywords.some(keyword =>
      content2.includes(keyword) && 
      content2.includes(content1.substring(0, 20))
    );
  }

  private updateAdaptiveThresholds(feedback: FeedbackEntry) {
    // Update quality threshold
    const qualityThreshold = this.adaptiveThresholds.get('quality')!;
    if (feedback.metrics.quality > qualityThreshold) {
      this.adaptiveThresholds.set(
        'quality',
        Math.min(0.95, qualityThreshold * 1.05)
      );
    } else {
      this.adaptiveThresholds.set(
        'quality',
        Math.max(0.6, qualityThreshold * 0.95)
      );
    }

    // Update efficiency threshold similarly
    const efficiencyThreshold = this.adaptiveThresholds.get('efficiency')!;
    if (feedback.metrics.efficiency > efficiencyThreshold) {
      this.adaptiveThresholds.set(
        'efficiency',
        Math.min(0.9, efficiencyThreshold * 1.05)
      );
    } else {
      this.adaptiveThresholds.set(
        'efficiency',
        Math.max(0.5, efficiencyThreshold * 0.95)
      );
    }
  }

  private startPerformanceMonitoring() {
    setInterval(() => {
      this.updateSystemMetrics();
      this.checkSystemHealth();
    }, 60000); // Every minute
  }

  private updateSystemMetrics() {
    const now = Date.now();
    const recentPeriod = 3600000; // Last hour

    // Calculate metrics
    const recentTasks = Array.from(this.workflows.values())
      .flat()
      .filter(task => 
        task.createdAt.getTime() > now - recentPeriod
      );

    const completedTasks = recentTasks
      .filter(task => task.status === 'completed');

    this.metrics = {
      throughput: completedTasks.length,
      averageCompletionTime: completedTasks.reduce(
        (sum, task) => {
          const feedback = this.feedback.get(task.id) || [];
          return sum + feedback.reduce(
            (fSum, f) => fSum + f.metrics.completionTime,
            0
          ) / Math.max(1, feedback.length);
        },
        0
      ) / Math.max(1, completedTasks.length),
      successRate: completedTasks.length / Math.max(1, recentTasks.length),
      bottlenecks: this.identifyBottlenecks(recentTasks)
        .map(task => task.id),
      resourceUtilization: Array.from(this.agents.values())
        .filter(agent => agent.status === 'busy').length / 
        this.agents.size,
      lastUpdated: new Date(),
    };

    logger.info({ metrics: this.metrics }, 'System metrics updated');
  }

  private checkSystemHealth() {
    // Check for concerning patterns
    if (this.metrics.successRate < 0.7) {
      logger.warn(
        { successRate: this.metrics.successRate },
        'Low success rate detected'
      );
      this.emit('system:warning', {
        type: 'low_success_rate',
        metrics: this.metrics,
      });
    }

    if (this.metrics.resourceUtilization > 0.9) {
      logger.warn(
        { utilization: this.metrics.resourceUtilization },
        'High resource utilization detected'
      );
      this.emit('system:warning', {
        type: 'high_utilization',
        metrics: this.metrics,
      });
    }

    if (this.metrics.bottlenecks.length > 0) {
      logger.warn(
        { bottlenecks: this.metrics.bottlenecks },
        'Workflow bottlenecks detected'
      );
      this.emit('system:warning', {
        type: 'bottlenecks',
        metrics: this.metrics,
      });
    }
  }
}