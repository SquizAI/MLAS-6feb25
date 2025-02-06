import express from 'express';
import rateLimit from 'express-rate-limit';
import { DataCaptureService } from '../../services/DataCapture';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { DataInputSchema, RateLimitConfig } from '../schemas/validation';

export const createRestRouter = (dataCaptureService: DataCaptureService) => {
  const router = express.Router();

  // Apply rate limiting
  const limiter = rateLimit(RateLimitConfig);
  router.use(limiter);

  // Health check endpoint (no auth required)
  router.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Data ingestion endpoint
  router.post(
    '/data',
    authenticate,
    validateBody(DataInputSchema),
    async (req, res) => {
      try {
        const { source, content, timestamp, metadata } = req.body;

        await dataCaptureService.captureData(source, {
          content,
          timestamp: timestamp ? new Date(timestamp) : new Date(),
          metadata: metadata || {},
        });

        res.status(202).json({ message: 'Data accepted for processing' });
      } catch (error) {
        console.error('Data capture error:', error);
        res.status(500).json({ error: 'Failed to process data' });
      }
    }
  );

  // Batch data ingestion endpoint
  router.post(
    '/data/batch',
    authenticate,
    validateBody(z.array(DataInputSchema)),
    async (req, res) => {
      try {
        const results = await Promise.allSettled(
          req.body.map(item =>
            dataCaptureService.captureData(item.source, {
              content: item.content,
              timestamp: item.timestamp ? new Date(item.timestamp) : new Date(),
              metadata: item.metadata || {},
            })
          )
        );

        const summary = {
          total: results.length,
          succeeded: results.filter(r => r.status === 'fulfilled').length,
          failed: results.filter(r => r.status === 'rejected').length,
        };

        res.status(202).json(summary);
      } catch (error) {
        console.error('Batch processing error:', error);
        res.status(500).json({ error: 'Failed to process batch data' });
      }
    }
  );

  return router;
};