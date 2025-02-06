import { z } from 'zod';

// Core Types
export const IdeaSchema = z.object({
  id: z.string().uuid(),
  content: z.string(),
  source: z.string(),
  createdAt: z.date(),
  metadata: z.object({
    sentiment: z.number(),
    urgency: z.number(),
    context: z.string(),
  }),
  xp: z.number(),
});

export const TaskSchema = z.object({
  id: z.string().uuid(),
  ideaId: z.string().uuid(),
  title: z.string(),
  description: z.string(),
  status: z.enum(['pending', 'active', 'completed', 'failed']),
  priority: z.number(),
  xp: z.number(),
  assignedAgentId: z.string().uuid().optional(),
  createdAt: z.date(),
  completedAt: z.date().optional(),
});

export const AgentSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['low_level', 'mid_level', 'high_level']),
  skills: z.array(z.string()),
  xp: z.number(),
  status: z.enum(['idle', 'busy', 'offline']),
  performance: z.object({
    successRate: z.number(),
    averageCompletionTime: z.number(),
    totalTasksCompleted: z.number(),
  }),
});

// Type Exports
export type Idea = z.infer<typeof IdeaSchema>;
export type Task = z.infer<typeof TaskSchema>;
export type Agent = z.infer<typeof AgentSchema>;