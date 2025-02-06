import express from 'express';
import { json } from 'body-parser';
import cors from 'cors';
import helmet from 'helmet';
import { createYoga } from 'graphql-yoga';
import { DataCaptureService } from '../services/DataCapture';
import { createRestRouter } from './routes/rest';
import { createGraphQLSchema } from './schema/graphql';

export const createServer = (dataCaptureService: DataCaptureService) => {
  const app = express();

  // Security middleware
  app.use(helmet());
  app.use(cors());
  app.use(json({ limit: '1mb' }));

  // REST endpoints
  app.use('/api/v1', createRestRouter(dataCaptureService));

  // GraphQL endpoint
  const yoga = createYoga({
    schema: createGraphQLSchema(dataCaptureService),
    graphiql: process.env.NODE_ENV !== 'production',
  });
  app.use('/graphql', yoga);

  return app;
};