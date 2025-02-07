import { useState } from 'react';
import { generateCompletion } from '../api/openaiClient';

interface UseOpenAICompletionReturn {
  loading: boolean;
  result: string | null;
  error: any;
  generateCompletion: (prompt: string) => Promise<void>;
}

export function useOpenAICompletion(): UseOpenAICompletionReturn {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<any>(null);

  const generateCompletion = async (prompt: string) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await generateCompletion(prompt);
      setResult(response);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return { loading, result, error, generateCompletion };
} 