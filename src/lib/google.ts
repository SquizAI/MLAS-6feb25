import { supabase } from './supabase';
import { logger } from './logger';

interface GoogleTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

class GoogleService {
  private static instance: GoogleService;

  private constructor() {}

  static getInstance(): GoogleService {
    if (!GoogleService.instance) {
      GoogleService.instance = new GoogleService();
    }
    return GoogleService.instance;
  }

  async getTokens(): Promise<GoogleTokens | null> {
    try {
      const { data: connection } = await supabase
        .from('google_connections')
        .select('*')
        .single();

      if (!connection) return null;

      // Check if token needs refresh
      if (new Date(connection.expires_at) <= new Date()) {
        return this.refreshTokens(connection.refresh_token);
      }

      return {
        access_token: connection.access_token,
        refresh_token: connection.refresh_token,
        expires_at: new Date(connection.expires_at).getTime()
      };
    } catch (error) {
      logger.error({ error }, 'Failed to get Google tokens');
      return null;
    }
  }

  private async refreshTokens(refreshToken: string): Promise<GoogleTokens | null> {
    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          client_secret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      if (!response.ok) throw new Error('Failed to refresh token');

      const data = await response.json();
      
      // Update tokens in database
      const { error: updateError } = await supabase
        .from('google_connections')
        .update({
          access_token: data.access_token,
          expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('refresh_token', refreshToken);

      if (updateError) throw updateError;

      return {
        access_token: data.access_token,
        refresh_token: refreshToken,
        expires_at: Date.now() + data.expires_in * 1000
      };
    } catch (error) {
      logger.error({ error }, 'Failed to refresh Google tokens');
      return null;
    }
  }

  async listDriveFiles(query?: string): Promise<any[]> {
    const tokens = await this.getTokens();
    if (!tokens) throw new Error('No Google tokens available');

    try {
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?${new URLSearchParams({
          q: query || "mimeType='application/pdf' or mimeType='application/vnd.google-apps.document'",
          fields: 'files(id, name, mimeType, webViewLink)',
        })}`,
        {
          headers: {
            Authorization: `Bearer ${tokens.access_token}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to list Drive files');

      const data = await response.json();
      return data.files;
    } catch (error) {
      logger.error({ error }, 'Failed to list Drive files');
      throw error;
    }
  }

  async uploadToDrive(file: File, folderId?: string): Promise<any> {
    const tokens = await this.getTokens();
    if (!tokens) throw new Error('No Google tokens available');

    try {
      // Create file metadata
      const metadata = {
        name: file.name,
        mimeType: file.type,
        parents: folderId ? [folderId] : undefined,
      };

      // Upload file
      const response = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${tokens.access_token}`,
            'Content-Type': 'multipart/related; boundary=boundary',
          },
          body: this.createMultipartBody(metadata, file),
        }
      );

      if (!response.ok) throw new Error('Failed to upload file');

      return response.json();
    } catch (error) {
      logger.error({ error }, 'Failed to upload to Drive');
      throw error;
    }
  }

  private createMultipartBody(metadata: any, file: File): string {
    const boundary = 'boundary';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const metadataPart = 
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata);

    const filePart = 
      `Content-Type: ${file.type}\r\n\r\n`;

    return delimiter +
           metadataPart +
           delimiter +
           filePart +
           file +
           closeDelimiter;
  }
}

export const googleService = GoogleService.getInstance();