import { z } from 'zod';

// Base schema for API authentication
export const AuthHeaderSchema = z.object({
  authorization: z.string().regex(/^Bearer\s.+$/),
});

// Common data input validation schemas
export const DataInputSchema = z.object({
  source: z.string(),
  content: z.string(),
  timestamp: z.string().datetime().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

// Rate limiting configuration
export const RateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
};