import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export const validateBody = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await schema.safeParseAsync(req.body);
      if (!result.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: result.error.errors,
        });
      }
      req.body = result.data;
      next();
    } catch (error) {
      return res.status(500).json({ error: 'Validation error' });
    }
  };
};