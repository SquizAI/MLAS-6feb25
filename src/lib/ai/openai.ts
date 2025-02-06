import { Configuration, OpenAIApi } from 'openai';
import { AI_CONFIG } from './config';

const configuration = new Configuration({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
});

export const openai = new OpenAIApi(configuration);

export async function generateEmbedding(text: string) {
  const response = await openai.createEmbedding({
    model: AI_CONFIG.embeddings.model,
    input: text,
  });
  
  return response.data.data[0].embedding;
}

export async function processTask(task: string, context: string) {
  const config = AI_CONFIG.models.taskProcessor;
  
  const response = await openai.createChatCompletion({
    model: config.model,
    messages: [
      { role: 'system', content: 'You are a task processing AI that decomposes complex tasks into actionable subtasks.' },
      { role: 'user', content: `Task: ${task}\nContext: ${context}` }
    ],
    temperature: config.temperature,
    max_tokens: config.maxTokens,
  });
  
  return response.data.choices[0].message?.content;
}

export async function agentCommunication(
  agentRole: string,
  message: string,
  context: string
) {
  const config = AI_CONFIG.models.agentChat;
  
  const response = await openai.createChatCompletion({
    model: config.model,
    messages: [
      { role: 'system', content: `You are an AI agent with the role: ${agentRole}` },
      { role: 'user', content: `Message: ${message}\nContext: ${context}` }
    ],
    temperature: config.temperature,
    max_tokens: config.maxTokens,
  });
  
  return response.data.choices[0].message?.content;
}