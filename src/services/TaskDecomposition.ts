import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import pino from 'pino';
import { tokenize, analyzeSentiment, extractKeywords, calculateSimilarity } from '../lib/nlp/sentiment';
import { EmotionalProcessingUnit } from './EmotionalProcessing';
import type { Idea, Task, Agent } from '../lib/types';
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

interface TaskAttributes {
  complexity: number;      // 0-1 scale
  urgency: number;        // 0-1 scale
  priority?: number;
  estimatedTime: number;  // minutes
  requiredSkills: string[];
  dependencies: string[];
  deadline?: Date;
  emotionalContext?: any;
}

interface AgentMatch {
  agentId: string;
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
}

export class TaskDecompositionService extends EventEmitter {
  private epu: EmotionalProcessingUnit;
  
  constructor(
    private knowledgeGraph: KnowledgeGraphService,
    private xpEngine: XPEngine
  ) {
    super();
    this.epu = new EmotionalProcessingUnit(knowledgeGraph);
    this.initializeTaskPatterns();
  }

  private taskPatterns = new Map<string, RegExp>();

  private initializeTaskPatterns() {
    this.taskPatterns.set('implementation', 
      /\b(implement|create|build|develop|setup)\b/i);
    this.taskPatterns.set('analysis', 
      /\b(analyze|evaluate|assess|review|examine)\b/i);
    this.taskPatterns.set('research', 
      /\b(research|investigate|explore|study)\b/i);
    this.taskPatterns.set('communication', 
      /\b(contact|email|call|meet|discuss|present)\b/i);
    this.taskPatterns.set('documentation', 
      /\b(document|write|describe|explain)\b/i);
  }

  async decomposeIdea(idea: Idea): Promise<Task[]> {
    try {
      logger.info({ ideaId: idea.id }, 'Starting idea decomposition');

      // Extract semantic information
      const segments = await this.segmentIdea(idea);
      const tasks: Task[] = [];

      // Calculate total XP budget for distribution
      const totalXP = this.xpEngine.calculateIdeaXP(idea);
      const xpPerTask = Math.floor(totalXP / segments.length);

      // Process each segment into a task
      for (const segment of segments) {
        const attributes = await this.analyzeTaskAttributes(segment, idea);
        const task = await this.createTask(idea, segment, attributes, xpPerTask);
        tasks.push(task);

        // Add to knowledge graph
        this.knowledgeGraph.addTask(task);

        // Find suitable agent
        const agentMatch = await this.findSuitableAgent(task);
        if (agentMatch) {
          task.assignedAgentId = agentMatch.agentId;
          this.emit('agent:assigned', { 
            taskId: task.id, 
            agentId: agentMatch.agentId,
            score: agentMatch.score 
          });
        }

        logger.debug({ 
          taskId: task.id,
          attributes,
          assignedAgent: task.assignedAgentId 
        }, 'Task created');
      }

      // Analyze dependencies between tasks
      await this.analyzeDependencies(tasks);

      logger.info({ 
        ideaId: idea.id, 
        taskCount: tasks.length 
      }, 'Idea decomposition completed');

      return tasks;
      
      // Get task context
      const context = await this.getTaskContext(task);
      
      // Process with OpenAI
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are a task processing AI. Process this task:
                     ${task.description}
                     
                     Context:
                     ${context}`
          }
        ],
        functions: [
          {
            name: "execute_task_step",
            parameters: {
              type: "object",
              properties: {
                step: { type: "string" },
                action: { type: "string" },
                expected_outcome: { type: "string" }
              }
            }
          }
        ]
      });

      // Update task progress
      await this.updateTaskProgress(task.id, {
        status: 'in_progress',
        progress: 25,
        currentStep: completion.choices[0].message.content
      });
      
    } catch (error) {
      logger.error({ error, ideaId: idea.id }, 'Idea decomposition failed');
      throw error;
    }
  }

  private async segmentIdea(idea: Idea): Promise<string[]> {
    const segments: string[] = [];
    const content = idea.content;

    // First, try to split on explicit markers
    const explicitTasks = content.match(/\d+\.\s+[^\n]+|\*\s+[^\n]+/g);
    if (explicitTasks && explicitTasks.length > 1) {
      return explicitTasks.map(task => task.replace(/^\d+\.\s+|\*\s+/, ''));
    }

    // Identify task-like sentences
    const sentences = content.match(/[^.!?]+[.!?]+/g) || [content];
    
    for (const sentence of sentences) {
      let matched = false;
      
      // Check against task patterns
      for (const [type, pattern] of this.taskPatterns) {
        if (pattern.test(sentence)) {
          segments.push(sentence.trim());
          matched = true;
          break;
        }
      }

      // If no pattern matched but sentence is substantial
      if (!matched && sentence.split(' ').length > 5) {
        segments.push(sentence.trim());
      }
    }

    // If no good segments found, treat the whole idea as one task
    if (segments.length === 0) {
      segments.push(content);
    }

    return segments;
  }

  private async analyzeTaskAttributes(
    segment: string,
    parentIdea: Idea
  ): Promise<TaskAttributes> {
    // Process emotional content with enhanced context
    const emotionalContext = await this.epu.processEmotionalContent(
      segment,
      { 
        parentContext: parentIdea.metadata.emotionalContext,
        complexity: parentIdea.metadata.complexity,
        adaptiveResponses: parentIdea.metadata.emotionalContext.adaptiveResponse
      }
    );

    // Enrich task with emotional context
    const enrichedTask = await this.epu.enrichTaskWithEmotionalContext(
      { content: segment },
      emotionalContext
    );

    // Extract skills with emotional intelligence requirements
    const requiredSkills = await this.extractRequiredSkills(
      segment,
      emotionalContext
    );

    // Calculate complexity based on multiple factors
    const complexity = this.calculateComplexity(segment, requiredSkills);

    // Use emotional context for urgency and priority
    const urgency = enrichedTask.metadata.emotional.urgency;
    const priority = enrichedTask.metadata.emotional.priority;

    // Estimate time based on complexity, skills, and emotional factors
    const estimatedTime = Math.round(
      30 + 
      (complexity * 120) + 
      (requiredSkills.length * 30) +
      (emotionalContext.emotionalState.intensity * 60)
    );

    // Add emotional handling requirements to required skills
    const emotionalSkills = enrichedTask.metadata.emotional.handlingRequirements
      .map(req => `emotional_${req}`);
    requiredSkills.push(...emotionalSkills);

    return {
      complexity,
      urgency,
      priority,
      estimatedTime,
      requiredSkills,
      dependencies: [],
      deadline: this.extractDeadline(segment),
      emotionalContext: emotionalContext,
      adaptiveResponses: enrichedTask.metadata.emotional.adaptiveResponses || []
    };
  }

  private async extractRequiredSkills(content: string): Promise<string[]> {
    const skills = new Set<string>();
    
    // Technical skills
    const technicalPatterns = [
      /\b(javascript|python|java|sql|react|node|aws)\b/gi,
      /\b(frontend|backend|fullstack|database)\b/gi,
      /\b(api|rest|graphql|microservices)\b/gi,
    ];

    // Soft skills
    const softPatterns = [
      /\b(communicate|present|coordinate|manage)\b/gi,
      /\b(analyze|research|document|review)\b/gi,
      /\b(design|architect|plan|strategize)\b/gi,
    ];

    // Check all patterns
    [...technicalPatterns, ...softPatterns].forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => skills.add(match.toLowerCase()));
      }
    });

    // Query knowledge graph for related skills
    const relatedNodes = await this.knowledgeGraph.query({
      nodeTypes: ['skill'],
      filters: [{
        property: 'data.name',
        operator: 'contains',
        value: Array.from(skills).join('|'),
      }],
    });

    relatedNodes.forEach(node => {
      skills.add(node.data.name);
    });

    return Array.from(skills);
  }

  private calculateComplexity(
    content: string,
    requiredSkills: string[]
  ): number {
    let complexity = 0;

    // Factor 1: Text length and structure
    complexity += Math.min(0.3, content.length / 1000);

    // Factor 2: Technical terminology density
    const technicalTerms = content.match(
      /\b(api|database|algorithm|system|integration|architecture)\b/gi
    );
    if (technicalTerms) {
      complexity += Math.min(0.2, technicalTerms.length * 0.05);
    }

    // Factor 3: Required skills
    complexity += Math.min(0.3, requiredSkills.length * 0.1);

    // Factor 4: Conditional statements
    const conditionals = content.match(
      /\b(if|when|unless|depending|based on)\b/gi
    );
    if (conditionals) {
      complexity += Math.min(0.2, conditionals.length * 0.05);
    }

    return Math.min(1, complexity);
  }

  private calculateUrgency(content: string): number {
    let urgency = 0;

    // Check for urgent keywords
    const urgentKeywords = [
      { pattern: /\b(urgent|asap|emergency|critical)\b/gi, weight: 0.4 },
      { pattern: /\b(important|priority|crucial)\b/gi, weight: 0.3 },
      { pattern: /\b(soon|quickly|fast)\b/gi, weight: 0.2 },
    ];

    urgentKeywords.forEach(({ pattern, weight }) => {
      const matches = content.match(pattern);
      if (matches) {
        urgency += weight * Math.min(1, matches.length);
      }
    });

    // Check for time-related patterns
    if (/\b(today|tomorrow|asap)\b/gi.test(content)) {
      urgency += 0.3;
    }

    return Math.min(1, urgency);
  }

  private extractDeadline(content: string): Date | undefined {
    // Common date patterns
    const patterns = [
      {
        regex: /\b(by|before|due|until)\b.{1,20}\b(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})\b/i,
        format: 'MM/DD/YYYY',
      },
      {
        regex: /\b(today|tomorrow|next week)\b/i,
        relative: true,
      },
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern.regex);
      if (match) {
        if (pattern.relative) {
          const date = new Date();
          switch (match[0].toLowerCase()) {
            case 'today':
              return date;
            case 'tomorrow':
              date.setDate(date.getDate() + 1);
              return date;
            case 'next week':
              date.setDate(date.getDate() + 7);
              return date;
          }
        } else {
          try {
            return new Date(match[2]);
          } catch {
            continue;
          }
        }
      }
    }

    return undefined;
  }

  private async createTask(
    idea: Idea,
    segment: string,
    attributes: TaskAttributes,
    xp: number
  ): Promise<Task> {
    // Determine task type based on content
    const taskType = Array.from(this.taskPatterns.entries())
      .find(([_, pattern]) => pattern.test(segment))?.[0] || 'general';

    return {
      id: uuidv4(),
      ideaId: idea.id,
      title: this.generateTaskTitle(segment),
      description: segment,
      status: 'pending',
      priority: attributes.priority || Math.round(attributes.urgency * 5),
      xp,
      createdAt: new Date(),
      data: {
        type: taskType,
        complexity: attributes.complexity,
        estimatedTime: attributes.estimatedTime,
        requiredSkills: attributes.requiredSkills,
        dependencies: attributes.dependencies,
        deadline: attributes.deadline,
        emotionalContext: attributes.emotionalContext,
      },
    };
  }

  private generateTaskTitle(content: string): string {
    const keywords = extractKeywords(content, 3);
    const tokens = tokenize(content);

    // If we have a verb, use it as action
    const firstWord = tokens[0].toLowerCase();
    if (this.taskPatterns.has(firstWord)) {
      return `${firstWord} ${keywords.join(' ')}`;
    }

    // Otherwise, create a descriptive title
    return `${keywords.join(' ')}`;
  }

  private async findSuitableAgent(task: Task): Promise<AgentMatch | null> {
    // Query available agents
    const availableAgents = await this.knowledgeGraph.query({
      nodeTypes: ['agent'],
      filters: [{
        property: 'data.status',
        operator: 'eq',
        value: 'idle',
      }],
    });

    if (availableAgents.length === 0) {
      return null;
    }

    // Score each agent
    const matches: AgentMatch[] = availableAgents.map(node => {
      const agent = node.data as Agent;
      const matchedSkills: string[] = [];
      const missingSkills: string[] = [];

      // Check skill coverage
      task.data.requiredSkills.forEach(skill => {
        if (agent.skills.includes(skill)) {
          matchedSkills.push(skill);
        } else {
          missingSkills.push(skill);
        }
      });

      // Calculate base score from skill match
      let score = matchedSkills.length / task.data.requiredSkills.length;

      // Factor in agent's experience level
      score *= (1 + Math.min(1, agent.xp / 1000));

      // Factor in past performance
      score *= (1 + agent.performance.successRate);

      return {
        agentId: agent.id,
        score,
        matchedSkills,
        missingSkills,
      };
    });

    // Return best match above threshold
    const bestMatch = matches.sort((a, b) => b.score - a.score)[0];
    return bestMatch.score >= 0.6 ? bestMatch : null;
  }

  private async analyzeDependencies(tasks: Task[]) {
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      const content = task.description.toLowerCase();

      // Look for dependency keywords
      for (let j = 0; j < i; j++) {
        const previousTask = tasks[j];
        const previousContent = previousTask.description.toLowerCase();

        // Check if current task references previous task
        if (
          content.includes('after') ||
          content.includes('following') ||
          content.includes('once') ||
          content.includes('depends')
        ) {
          if (
            content.includes(previousContent.substring(0, 20)) || 
            calculateSimilarity(content, previousContent) > 0.7
          ) {
            task.data.dependencies.push(previousTask.id);
            this.knowledgeGraph.addEdge(task.id, previousTask.id, 'depends_on', 1.0);
          }
        }
      }
    }
  }
}