// frontend/src/api/openaiClient.ts

// Define the base URL for your backend service.
// You can set VITE_OPENAI_BACKEND_URL in your .env file (e.g., "http://localhost:5000")
// Otherwise, it will assume the API is served under "/api" (if using a proxy).
const BASE_URL = import.meta.env.VITE_OPENAI_BACKEND_URL || '/api';

/**
 * Common fetch options for all API calls
 */
const fetchOptions = {
  credentials: 'include' as RequestCredentials,
  headers: {
    'Content-Type': 'application/json',
  },
};

/**
 * Calls the structured output endpoint to generate a completion.
 * @param prompt - The prompt text.
 * @param agentLevel - The agent level ("director", "manager", or "lower").
 * @returns A Promise resolving to a CalendarEvent object.
 */
export async function generateCompletion(prompt: string, agentLevel: string = 'manager') {
  const response = await fetch(`${BASE_URL}/complete`, {
    ...fetchOptions,
    method: 'POST',
    body: JSON.stringify({ prompt, agent_level: agentLevel })
  });
  
  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`API Error ${response.status}: ${errorData}`);
  }
  
  return response.json();
}

/**
 * Calls the send_email function-calling endpoint.
 * @param prompt - The prompt text.
 * @param model - The model to use (default: "gpt-4").
 * @param reasoning_effort - A number representing the reasoning effort.
 * @returns A Promise resolving to the function call details.
 */
export async function callSendEmailFunction(prompt: string, model: string = 'gpt-4', reasoning_effort: number = 1.0) {
  const response = await fetch(`${BASE_URL}/function_call/send_email`, {
    ...fetchOptions,
    method: 'POST',
    body: JSON.stringify({ 
      prompt, 
      model, 
      reasoning_effort 
    })
  });
  
  if (!response.ok) {
    const errorData = await response.text();
    console.error('API Error:', errorData);  // Add this for debugging
    throw new Error(`API Error ${response.status}: ${errorData}`);
  }
  
  return response.json();
}

/**
 * Calls the search_knowledge_base function-calling endpoint.
 * @param prompt - The prompt text.
 * @param model - The model to use (default: "gpt-4o").
 * @param reasoning_effort - A number representing the reasoning effort.
 * @returns A Promise resolving to the function call details.
 */
export async function callSearchKnowledgeBase(prompt: string, model: string = 'gpt-4o', reasoning_effort: number = 1.0) {
  const response = await fetch(`${BASE_URL}/function_call/search_knowledge_base`, {
    ...fetchOptions,
    method: 'POST',
    body: JSON.stringify({ prompt, model, reasoning_effort })
  });
  
  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`API Error ${response.status}: ${errorData}`);
  }
  
  return response.json();
} 