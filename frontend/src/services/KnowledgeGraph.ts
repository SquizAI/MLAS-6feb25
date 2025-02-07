import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import type { Idea, Task, Agent } from '../lib/types';
import { logger } from '../lib/logger';

interface Node {
  id: string;
  type: NodeType;
  data: any;
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    version: number;
    confidence: number;
    source?: string;
  };
}

type NodeType = 
  | 'idea' 
  | 'task' 
  | 'agent' 
  | 'skill' 
  | 'tool' 
  | 'xp_event' 
  | 'feedback' 
  | 'concept'
  | 'domain';

interface Edge {
  id: string;
  source: string;
  target: string;
  type: EdgeType;
  weight: number;
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    confidence: number;
    context?: string;
  };
}

type EdgeType =
  | 'generates'        // Idea -> Task
  | 'requires'         // Task -> Skill
  | 'has_skill'        // Agent -> Skill
  | 'uses'            // Agent -> Tool
  | 'completed'        // Agent -> Task
  | 'earned'          // Agent -> XP Event
  | 'related_to'      // Idea -> Idea
  | 'depends_on'      // Task -> Task
  | 'part_of'         // Task -> Task
  | 'provides_feedback' // Agent -> Feedback
  | 'belongs_to'      // Concept -> Domain
  | 'references'      // Idea -> Concept
  | 'improves'        // XP Event -> Skill;

interface GraphQuery {
  nodeTypes?: NodeType[];
  edgeTypes?: EdgeType[];
  filters?: {
    property: string;
    operator: 'eq' | 'gt' | 'lt' | 'contains';
    value: any;
  }[];
  limit?: number;
  orderBy?: {
    property: string;
    direction: 'asc' | 'desc';
  };
}

export class KnowledgeGraphService extends EventEmitter {
  private nodes: Map<string, Node>;
  private edges: Map<string, Edge>;
  private nodeIndexes: Map<NodeType, Set<string>>;
  private edgeIndexes: Map<EdgeType, Set<string>>;

  constructor() {
    super();
    this.nodes = new Map();
    this.edges = new Map();
    this.nodeIndexes = new Map();
    this.edgeIndexes = new Map();
    this.initializeIndexes();
  }

  private initializeIndexes() {
    // Initialize node type indexes
    const nodeTypes: NodeType[] = [
      'idea', 'task', 'agent', 'skill', 'tool', 
      'xp_event', 'feedback', 'concept', 'domain'
    ];
    nodeTypes.forEach(type => {
      this.nodeIndexes.set(type, new Set());
    });

    // Initialize edge type indexes
    const edgeTypes: EdgeType[] = [
      'generates', 'requires', 'has_skill', 'uses', 
      'completed', 'earned', 'related_to', 'depends_on',
      'part_of', 'provides_feedback', 'belongs_to',
      'references', 'improves'
    ];
    edgeTypes.forEach(type => {
      this.edgeIndexes.set(type, new Set());
    });
  }

  addIdea(idea: Idea) {
    const node: Node = {
      id: idea.id,
      type: 'idea',
      data: idea,
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
        confidence: 1.0,
        source: idea.source,
      },
    };

    this.addNode(node);
    this.emit('node:added', { type: 'idea', id: idea.id });

    // Extract and link concepts
    if (idea.metadata?.concepts) {
      (idea.metadata.concepts as string[]).forEach(concept => {
        const conceptNode = this.addConceptNode(concept);
        this.addEdge(idea.id, conceptNode.id, 'references', 1.0);
      });
    }
  }

  addTask(task: Task) {
    const node: Node = {
      id: task.id,
      type: 'task',
      data: task,
      metadata: {
        createdAt: task.createdAt,
        updatedAt: new Date(),
        version: 1,
        confidence: 1.0,
      },
    };

    this.addNode(node);
    this.emit('node:added', { type: 'task', id: task.id });

    // Link task to idea
    this.addEdge(task.ideaId, task.id, 'generates', 1.0);

    // If task has dependencies, link them
    if (task.data?.dependencies) {
      task.data.dependencies.forEach(depId => {
        this.addEdge(task.id, depId, 'depends_on', 1.0);
      });
    }
  }

  addAgent(agent: Agent) {
    const node: Node = {
      id: agent.id,
      type: 'agent',
      data: agent,
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
        confidence: 1.0,
      },
    };

    this.addNode(node);
    this.emit('node:added', { type: 'agent', id: agent.id });

    // Add and link agent skills
    agent.skills.forEach(skillName => {
      const skillNode = this.addSkillNode(skillName);
      this.addEdge(agent.id, skillNode.id, 'has_skill', 1.0);
    });
  }

  updateTaskStatus(taskId: string, status: Task['status'], agentId?: string) {
    const node = this.nodes.get(taskId);
    if (!node || node.type !== 'task') return;

    node.data.status = status;
    node.metadata.updatedAt = new Date();
    node.metadata.version += 1;

    if (status === 'completed' && agentId) {
      // Create XP event
      const xpEventNode = this.createXPEvent(agentId, taskId, node.data.xp);
      
      // Link agent to completed task
      this.addEdge(agentId, taskId, 'completed', 1.0);
      
      // Link agent to XP event
      this.addEdge(agentId, xpEventNode.id, 'earned', 1.0);
    }

    this.emit('node:updated', { type: 'task', id: taskId, status });
  }

  addFeedback(
    agentId: string, 
    targetId: string, 
    rating: number, 
    comment: string
  ) {
    const feedbackNode: Node = {
      id: uuidv4(),
      type: 'feedback',
      data: {
        rating,
        comment,
        timestamp: new Date(),
      },
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
        confidence: 1.0,
      },
    };

    this.addNode(feedbackNode);
    
    // Link feedback to agent and target
    this.addEdge(agentId, feedbackNode.id, 'provides_feedback', 1.0);
    this.addEdge(feedbackNode.id, targetId, 'related_to', rating / 5.0);

    this.emit('feedback:added', { 
      agentId, 
      targetId, 
      feedbackId: feedbackNode.id 
    });
  }

  private addNode(node: Node) {
    this.nodes.set(node.id, node);
    this.nodeIndexes.get(node.type)?.add(node.id);
    logger.debug({ nodeId: node.id, type: node.type }, 'Node added to graph');
  }

  private addEdge(
    sourceId: string, 
    targetId: string, 
    type: EdgeType, 
    weight: number,
    metadata: Partial<Edge['metadata']> = {}
  ) {
    const edge: Edge = {
      id: `${sourceId}-${targetId}-${type}`,
      source: sourceId,
      target: targetId,
      type,
      weight,
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        confidence: 1.0,
        ...metadata,
      },
    };

    this.edges.set(edge.id, edge);
    this.edgeIndexes.get(type)?.add(edge.id);
    logger.debug({ edgeId: edge.id, type }, 'Edge added to graph');
  }

  private addConceptNode(concept: string): Node {
    const existingConcept = Array.from(this.nodes.values())
      .find(n => n.type === 'concept' && n.data.name === concept);

    if (existingConcept) {
      return existingConcept;
    }

    const conceptNode: Node = {
      id: uuidv4(),
      type: 'concept',
      data: {
        name: concept,
        frequency: 1,
      },
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
        confidence: 1.0,
      },
    };

    this.addNode(conceptNode);
    return conceptNode;
  }

  private addSkillNode(skill: string): Node {
    const existingSkill = Array.from(this.nodes.values())
      .find(n => n.type === 'skill' && n.data.name === skill);

    if (existingSkill) {
      return existingSkill;
    }

    const skillNode: Node = {
      id: uuidv4(),
      type: 'skill',
      data: {
        name: skill,
        level: 1,
        xp: 0,
      },
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
        confidence: 1.0,
      },
    };

    this.addNode(skillNode);
    return skillNode;
  }

  private createXPEvent(
    agentId: string, 
    taskId: string, 
    amount: number
  ): Node {
    const xpEventNode: Node = {
      id: uuidv4(),
      type: 'xp_event',
      data: {
        amount,
        timestamp: new Date(),
        source: taskId,
      },
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
        confidence: 1.0,
      },
    };

    this.addNode(xpEventNode);
    return xpEventNode;
  }

  // Query methods
  async query(params: GraphQuery): Promise<Node[]> {
    let results = Array.from(this.nodes.values());

    // Filter by node types
    if (params.nodeTypes?.length) {
      results = results.filter(node => 
        params.nodeTypes!.includes(node.type)
      );
    }

    // Apply custom filters
    if (params.filters?.length) {
      results = results.filter(node => 
        params.filters!.every(filter => {
          const value = this.getNestedValue(node, filter.property);
          switch (filter.operator) {
            case 'eq': return value === filter.value;
            case 'gt': return value > filter.value;
            case 'lt': return value < filter.value;
            case 'contains': return value?.includes(filter.value);
            default: return true;
          }
        })
      );
    }

    // Apply ordering
    if (params.orderBy) {
      results.sort((a, b) => {
        const aVal = this.getNestedValue(a, params.orderBy!.property);
        const bVal = this.getNestedValue(b, params.orderBy!.property);
        const modifier = params.orderBy!.direction === 'asc' ? 1 : -1;
        return (aVal > bVal ? 1 : -1) * modifier;
      });
    }

    // Apply limit
    if (params.limit) {
      results = results.slice(0, params.limit);
    }

    return results;
  }

  findPath(
    startId: string, 
    endId: string, 
    edgeTypes?: EdgeType[]
  ): Edge[] {
    // Implement path finding using Dijkstra's algorithm
    const distances = new Map<string, number>();
    const previous = new Map<string, string>();
    const unvisited = new Set(this.nodes.keys());

    distances.set(startId, 0);

    while (unvisited.size > 0) {
      // Find node with minimum distance
      let current = Array.from(unvisited)
        .reduce((min, node) => {
          if (!distances.has(min)) return node;
          if (!distances.has(node)) return min;
          return distances.get(node)! < distances.get(min)! ? node : min;
        });

      if (current === endId) break;
      unvisited.delete(current);

      // Get all connected edges
      const edges = Array.from(this.edges.values())
        .filter(e => 
          e.source === current && 
          (!edgeTypes || edgeTypes.includes(e.type))
        );

      for (const edge of edges) {
        const alt = distances.get(current)! + (1 / edge.weight);
        if (!distances.has(edge.target) || alt < distances.get(edge.target)!) {
          distances.set(edge.target, alt);
          previous.set(edge.target, current);
        }
      }
    }

    // Reconstruct path
    const path: Edge[] = [];
    let current = endId;

    while (previous.has(current)) {
      const prev = previous.get(current)!;
      const edge = Array.from(this.edges.values())
        .find(e => e.source === prev && e.target === current);
      if (edge) path.unshift(edge);
      current = prev;
    }

    return path;
  }

  findRelatedNodes(
    nodeId: string, 
    edgeTypes?: EdgeType[], 
    depth: number = 1
  ): Node[] {
    const related = new Set<string>();
    const toExplore = new Set([nodeId]);
    
    for (let i = 0; i < depth; i++) {
      const exploring = new Set(toExplore);
      toExplore.clear();

      for (const id of exploring) {
        const edges = Array.from(this.edges.values())
          .filter(e => 
            (e.source === id || e.target === id) &&
            (!edgeTypes || edgeTypes.includes(e.type))
          );

        edges.forEach(edge => {
          const otherId = edge.source === id ? edge.target : edge.source;
          if (!related.has(otherId)) {
            related.add(otherId);
            toExplore.add(otherId);
          }
        });
      }
    }

    return Array.from(related)
      .map(id => this.nodes.get(id)!)
      .filter(Boolean);
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((curr, key) => curr?.[key], obj);
  }
}