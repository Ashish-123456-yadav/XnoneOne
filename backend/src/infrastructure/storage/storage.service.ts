import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import { env } from '../../config/env';

export interface UploadRequest {
  filename: string;
  mimeType: string;
  byteSize: number;
  durationSeconds?: number;
  width?: number;
  height?: number;
}

export interface UploadTicket {
  videoId: string;
  storageKey: string;
  uploadUrl: string;
  publicPlaybackUrl: string;
  headers: Record<string, string>;
  expiresIn: number;
}

const ALLOWED_VIDEO_MIME_TYPES = new Set(['video/mp4', 'video/quicktime', 'video/webm']);
const ALLOWED_EXTENSIONS = new Set(['.mp4', '.mov', '.webm']);

@Injectable()
export class StorageService {
  validateVideo(input: UploadRequest): void {
    const extension = extname(input.filename).toLowerCase();

    if (!ALLOWED_VIDEO_MIME_TYPES.has(input.mimeType)) {
      throw new BadRequestException('Unsupported video mime type');
    }

    if (!ALLOWED_EXTENSIONS.has(extension)) {
      throw new BadRequestException('Unsupported video extension');
    }

    if (!Number.isFinite(input.byteSize) || input.byteSize <= 0 || input.byteSize > env.storage.maxVideoBytes) {
      throw new BadRequestException(`Video must be smaller than ${env.storage.maxVideoBytes} bytes`);
    }
  }

  createUploadTicket(userId: string, input: UploadRequest): UploadTicket {
    this.validateVideo(input);
    const videoId = randomUUID();
    const extension = extname(input.filename).toLowerCase() || '.mp4';
    const storageKey = `raw/${userId}/${videoId}${extension}`;

    return {
      videoId,
      storageKey,
      uploadUrl: `${env.api.publicUrl}/api/v1/videos/uploads/${videoId}/mock-put`,
      publicPlaybackUrl: `${env.storage.cdnBaseUrl}/${storageKey}`,
      headers: {
        'content-type': input.mimeType,
        'x-novasocial-upload-id': videoId,
      },
      expiresIn: 900,
    };
  }

  publicUrl(key: string | null): string | null {
    return key ? `${env.storage.cdnBaseUrl}/${key}` : null;
  }
}
