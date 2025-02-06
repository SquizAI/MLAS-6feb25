import { z } from "zod";

export const AI_CONFIG = {
  models: {
    // Main model for complex reasoning and oversight
    director: {
      model: "o3-mini-2025-1-31",
      reasoning_effort: "high",
      store: true,
    },
    
    // General purpose model for most tasks
    agent: {
      model: "gpt-4o-2024-08-06",
      store: true,
    },
    
    // Fast model for simple tasks and real-time responses
    worker: {
      model: "gpt-4o",
      store: true,
    }
  },

  // Schema definitions for structured outputs
  schemas: {
    task: z.object({
      id: z.string(),
      title: z.string(),
      description: z.string(),
      priority: z.number().min(1).max(5),
      estimatedTime: z.number(),
      requiredSkills: z.array(z.string()),
      dependencies: z.array(z.string()).optional(),
    }),

    agent: z.object({
      id: z.string(),
      name: z.string(),
      role: z.string(),
      skills: z.array(z.string()),
      autonomyLevel: z.number().min(0).max(1),
      status: z.enum(['idle', 'busy', 'offline']),
    }),

    feedback: z.object({
      taskId: z.string(),
      rating: z.number().min(1).max(5),
      comments: z.string(),
      metrics: z.object({
        completionTime: z.number(),
        quality: z.number(),
        efficiency: z.number(),
      }),
    })
  },

  // Function definitions for tool calling
  functions: {
    searchKnowledgeBase: {
      name: "search_knowledge_base",
      description: "Search the knowledge graph for relevant information",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Search query"
          },
          filters: {
            type: "object",
            properties: {
              nodeTypes: {
                type: "array",
                items: { type: "string" },
                description: "Types of nodes to search"
              },
              maxResults: {
                type: "number",
                description: "Maximum number of results"
              }
            }
          }
        },
        required: ["query"]
      }
    },
    
    assignTask: {
      name: "assign_task",
      description: "Assign a task to an agent",
      parameters: {
        type: "object",
        properties: {
          taskId: {
            type: "string",
            description: "ID of the task"
          },
          agentId: {
            type: "string",
            description: "ID of the agent"
          },
          priority: {
            type: "number",
            description: "Task priority (1-5)"
          }
        },
        required: ["taskId", "agentId"]
      }
    }
  }
};