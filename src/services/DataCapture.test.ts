import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DataCaptureService } from './DataCapture';

describe('DataCaptureService', () => {
  let service: DataCaptureService;

  beforeEach(() => {
    service = new DataCaptureService({
      connectors: {
        email: {
          credentials: {
            username: 'test',
            password: 'test',
          },
        },
      },
      messageQueue: {
        type: 'memory',
      },
    });
  });

  afterEach(async () => {
    await service.stop();
  });

  it('should initialize with provided configuration', () => {
    expect(service).toBeDefined();
  });

  it('should emit error when capturing data with invalid source', async () => {
    const errorHandler = vi.fn();
    service.on('error', errorHandler);

    await expect(service.captureData('invalid', {})).rejects.toThrow();
    expect(errorHandler).toHaveBeenCalled();
  });

  it('should successfully capture and process email data', async () => {
    const dataHandler = vi.fn();
    const ideaHandler = vi.fn();

    service.on('data:captured', dataHandler);
    service.on('idea:created', ideaHandler);

    await service.start();

    const emailData = {
      from: 'test@example.com',
      to: ['recipient@example.com'],
      subject: 'Test Email',
      body: 'This is a test email',
      timestamp: new Date(),
    };

    await service.captureData('email', emailData);

    // Wait for async processing
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(dataHandler).toHaveBeenCalled();
    expect(ideaHandler).toHaveBeenCalled();

    const idea = ideaHandler.mock.calls[0][0];
    expect(idea).toMatchObject({
      source: 'email',
      content: expect.stringContaining('Test Email'),
    });
  });
});