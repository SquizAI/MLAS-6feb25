import { gql } from 'graphql-tag';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { DataCaptureService } from '../../services/DataCapture';

const typeDefs = gql`
  type Metadata {
    key: String!
    value: String!
  }

  input MetadataInput {
    key: String!
    value: String!
  }

  input DataInput {
    source: String!
    content: String!
    timestamp: String
    metadata: [MetadataInput!]
  }

  type DataResponse {
    id: ID!
    message: String!
  }

  type BatchResponse {
    total: Int!
    succeeded: Int!
    failed: Int!
  }

  type Query {
    health: Boolean!
  }

  type Mutation {
    captureData(input: DataInput!): DataResponse!
    captureBatchData(input: [DataInput!]!): BatchResponse!
  }
`;

export const createGraphQLSchema = (dataCaptureService: DataCaptureService) => {
  const resolvers = {
    Query: {
      health: () => true,
    },
    Mutation: {
      captureData: async (_, { input }) => {
        const { source, content, timestamp, metadata } = input;

        await dataCaptureService.captureData(source, {
          content,
          timestamp: timestamp ? new Date(timestamp) : new Date(),
          metadata: metadata?.reduce(
            (acc, { key, value }) => ({ ...acc, [key]: value }),
            {}
          ),
        });

        return {
          id: 'temp-id', // Replace with actual ID from service
          message: 'Data accepted for processing',
        };
      },
      captureBatchData: async (_, { input }) => {
        const results = await Promise.allSettled(
          input.map(item =>
            dataCaptureService.captureData(item.source, {
              content: item.content,
              timestamp: item.timestamp ? new Date(item.timestamp) : new Date(),
              metadata: item.metadata?.reduce(
                (acc, { key, value }) => ({ ...acc, [key]: value }),
                {}
              ),
            })
          )
        );

        return {
          total: results.length,
          succeeded: results.filter(r => r.status === 'fulfilled').length,
          failed: results.filter(r => r.status === 'rejected').length,
        };
      },
    },
  };

  return makeExecutableSchema({ typeDefs, resolvers });
};