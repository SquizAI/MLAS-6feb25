import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import { AI_CONFIG } from "./config";
import { aiLogger as logger } from "../logger";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export class AIClient {
  // Director-level decision making
  async makeStrategicDecision(context: string, options: string[]) {
    try {
      logger.debug({ context, options }, 'Making strategic decision');
      const startTime = Date.now();

      const response = await openai.chat.completions.create({
        model: AI_CONFIG.models.director.model,
        reasoning_effort: AI_CONFIG.models.director.reasoning_effort,
        messages: [
          {
            role: "system",
            content: "You are a strategic director AI responsible for high-level decision making."
          },
          {
            role: "user",
            content: `Context: ${context}\nOptions: ${options.join(", ")}`
          }
        ],
        store: true,
      });

      const duration = Date.now() - startTime;
      logger.info({ duration }, 'Strategic decision completed');

      return response.choices[0].message.content;
    } catch (error) {
      logger.error({ error, context }, 'Strategic decision failed');
      throw error;
    }
  }

  // Structured task processing
  async processTask(description: string) {
    try {
      logger.debug({ description }, 'Processing task');
      
      // Real OpenAI API call
      const startTime = Date.now();

      const completion = await openai.beta.chat.completions.parse({
        model: AI_CONFIG.models.agent.model,
        messages: [
          { 
            role: "system", 
            content: `You are an AI task processor specialized in ${this.agentType}.
                     Analyze the task and provide detailed, actionable steps.` 
          },
          { 
            role: "user", 
            content: description 
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
        response_format: zodResponseFormat(AI_CONFIG.schemas.task, "task"),
      });

      const duration = Date.now() - startTime;
      logger.info({ duration, taskId: completion.choices[0].message.parsed.id }, 'Task processed');

      return completion.choices[0].message.parsed;
    } catch (error) {
      logger.error({ error, description }, 'Task processing failed');
      throw error;
    }
  }

  // Agent communication with function calling
  async agentCommunication(role: string, message: string) {
    try {
      logger.debug({ role, message }, 'Agent communication started');
      const startTime = Date.now();

      const completion = await openai.chat.completions.create({
        model: AI_CONFIG.models.worker.model,
        messages: [
          { 
            role: "system", 
            content: `You are an AI agent with the role: ${role}` 
          },
          { 
            role: "user", 
            content: message 
          }
        ],
        tools: [
          {
            type: "function",
            function: AI_CONFIG.functions.searchKnowledgeBase
          },
          {
            type: "function",
            function: AI_CONFIG.functions.assignTask
          }
        ],
        store: true,
      });

      const duration = Date.now() - startTime;
      logger.info({ 
        duration, 
        role,
        toolCallCount: completion.choices[0].message.tool_calls?.length 
      }, 'Agent communication completed');

      return {
        response: completion.choices[0].message.content,
        toolCalls: completion.choices[0].message.tool_calls
      };
    } catch (error) {
      logger.error({ error, role, message }, 'Agent communication failed');
      throw error;
    }
  }

  // Process feedback with structured output
  async processFeedback(feedbackText: string) {
    try {
      logger.debug({ feedbackText }, 'Processing feedback');
      const startTime = Date.now();

      const completion = await openai.beta.chat.completions.parse({
        model: AI_CONFIG.models.agent.model,
        messages: [
          {
            role: "system",
            content: "Extract structured feedback information."
          },
          {
            role: "user",
            content: feedbackText
          }
        ],
        response_format: zodResponseFormat(AI_CONFIG.schemas.feedback, "feedback"),
      });

      const duration = Date.now() - startTime;
      logger.info({ 
        duration,
        taskId: completion.choices[0].message.parsed.taskId 
      }, 'Feedback processed');

      return completion.choices[0].message.parsed;
    } catch (error) {
      logger.error({ error, feedbackText }, 'Feedback processing failed');
      throw error;
    }
  }

  // Knowledge synthesis
  async synthesizeKnowledge(documents: string[]) {
    try {
      logger.debug({ documentCount: documents.length }, 'Synthesizing knowledge');
      const startTime = Date.now();

      const completion = await openai.chat.completions.create({
        model: AI_CONFIG.models.director.model,
        messages: [
          {
            role: "system",
            content: "Synthesize key insights from multiple documents."
          },
          {
            role: "user",
            content: documents.join("\n\n")
          }
        ],
        reasoning_effort: "high",
        store: true,
      });

      const duration = Date.now() - startTime;
      logger.info({ duration }, 'Knowledge synthesis completed');

      // Process response into structured task
      const response = completion.choices[0].message.content;
      return {
        steps: this.parseSteps(response),
        analysis: this.extractInsights(response),
        nextActions: this.determineNextActions(response)
      };
    } catch (error) {
      logger.error({ error, documentCount: documents.length }, 'Knowledge synthesis failed');
      throw error;
    }
  }
}

// Export singleton instance
export const aiClient = new AIClient();