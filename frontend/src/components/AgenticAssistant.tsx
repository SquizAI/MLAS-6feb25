import React, { useState } from 'react';
import { generateCompletion, callSendEmailFunction, callSearchKnowledgeBase } from '../api/openaiClient';

type OperationType = 'structured' | 'email' | 'knowledge';

const AgenticAssistant = () => {
  const [prompt, setPrompt] = useState('');
  const [operationType, setOperationType] = useState<OperationType>('structured');
  const [agentLevel, setAgentLevel] = useState('manager');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      let response;
      switch (operationType) {
        case 'structured':
          response = await generateCompletion(prompt, agentLevel);
          break;
        case 'email':
          response = await callSendEmailFunction(prompt);
          break;
        case 'knowledge':
          response = await callSearchKnowledgeBase(prompt);
          break;
      }
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Agentic Assistant</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Operation Type Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Operation Type
          </label>
          <select
            value={operationType}
            onChange={(e) => setOperationType(e.target.value as OperationType)}
            className="w-full p-2 border rounded-md"
          >
            <option value="structured">Structured Output</option>
            <option value="email">Email Function</option>
            <option value="knowledge">Knowledge Base Search</option>
          </select>
        </div>

        {/* Agent Level Selector (only for structured output) */}
        {operationType === 'structured' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Agent Level
            </label>
            <select
              value={agentLevel}
              onChange={(e) => setAgentLevel(e.target.value)}
              className="w-full p-2 border rounded-md"
            >
              <option value="director">Director Level</option>
              <option value="manager">Manager Level</option>
              <option value="lower">Lower Level</option>
            </select>
          </div>
        )}

        {/* Prompt Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Prompt
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full p-2 border rounded-md"
            rows={4}
            placeholder={
              operationType === 'structured' 
                ? "Enter event details (e.g., 'Schedule a meeting with John tomorrow at 2 PM')"
                : operationType === 'email'
                ? "Enter email request (e.g., 'Send an email to john@example.com about the project update')"
                : "Enter search query (e.g., 'Find information about AI agents in the knowledge base')"
            }
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 px-4 rounded-md text-white ${
            loading 
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {loading ? 'Processing...' : 'Submit'}
        </button>
      </form>

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-600">
          {error}
        </div>
      )}

      {/* Result Display */}
      {result && (
        <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-md">
          <h3 className="font-semibold mb-2">Result:</h3>
          <pre className="whitespace-pre-wrap text-sm">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default AgenticAssistant; 