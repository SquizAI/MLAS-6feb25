// Simple sentiment analysis implementation for browser
const AFINN: Record<string, number> = {
  'good': 3,
  'great': 4,
  'excellent': 5,
  'bad': -3,
  'terrible': -4,
  'awful': -5,
  'happy': 4,
  'sad': -4,
  'angry': -4,
  'excited': 3,
  'love': 4,
  'hate': -4,
  'wonderful': 4,
  'horrible': -4,
  'amazing': 4,
  'urgent': -2,
  'important': 2,
  'critical': -2,
  'success': 3,
  'failure': -3,
  'help': 2,
  'problem': -2,
  'easy': 2,
  'difficult': -2,
  'perfect': 5,
  'worst': -5,
};

export function tokenize(text: string): string[] {
  return text.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(Boolean);
}

export function analyzeSentiment(text: string): number {
  const tokens = tokenize(text);
  let total = 0;
  let words = 0;

  for (const token of tokens) {
    if (AFINN[token]) {
      total += AFINN[token];
      words++;
    }
  }

  // Normalize to [-1, 1] range
  return words > 0 ? Math.max(-1, Math.min(1, total / (words * 5))) : 0;
}

export function extractKeywords(text: string, maxKeywords: number = 5): string[] {
  const tokens = tokenize(text);
  const frequencies: Record<string, number> = {};
  
  // Calculate word frequencies
  for (const token of tokens) {
    frequencies[token] = (frequencies[token] || 0) + 1;
  }

  // Sort by frequency
  return Object.entries(frequencies)
    .sort(([, a], [, b]) => b - a)
    .slice(0, maxKeywords)
    .map(([word]) => word);
}

export function calculateSimilarity(text1: string, text2: string): number {
  const tokens1 = new Set(tokenize(text1));
  const tokens2 = new Set(tokenize(text2));
  
  const intersection = new Set([...tokens1].filter(x => tokens2.has(x)));
  const union = new Set([...tokens1, ...tokens2]);
  
  return intersection.size / union.size;
}