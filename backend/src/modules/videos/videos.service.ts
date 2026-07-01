import { Injectable, NotFoundException } from '@nestjs/common';
import { assertOptionalString, assertRequiredString } from '../../common/pipes/pagination';
import { DatabaseService } from '../../infrastructure/database/database.service';
import { StorageService } from '../../infrastructure/storage/storage.service';
import { VideoProcessingService } from './video-processing.service';

@Injectable()
export class VideosService {
  constructor(
    private readonly database: DatabaseService,
    private readonly storage: StorageService,
    private readonly processing: VideoProcessingService,
  ) {}

  initiateUpload(userId: string, body: Record<string, unknown>) {
    const filename = assertRequiredString(body.filename, 'filename', 3, 180);
    const mimeType = assertRequiredString(body.mimeType, 'mimeType', 3, 120);
    const byteSize = Number(body.byteSize);
    const durationSeconds = Number(body.durationSeconds ?? 0);
    const width = Number(body.width ?? 1080);
    const height = Number(body.height ?? 1920);

    const ticket = this.storage.createUploadTicket(userId, {
      filename,
      mimeType,
      byteSize,
      durationSeconds,
      width,
      height,
    });

    this.database.createVideo({
      id: ticket.videoId,
      postId: null,
      creatorId: userId,
      storageKey: ticket.storageKey,
      originalFilename: filename,
      mimeType,
      byteSize,
      durationSeconds,
      width,
      height,
      thumbnailKey: null,
      hlsManifestKey: null,
      status: 'pending_upload',
    });

    return ticket;
  }

  completeUpload(userId: string, videoId: string, body: Record<string, unknown>) {
    const video = this.database.completeVideoUpload(videoId, userId);
    if (!video) {
      throw new NotFoundException('Video upload not found');
    }

    const job = this.processing.queueTranscode({
      videoId: video.id,
      storageKey: video.storageKey,
      width: video.width,
      height: video.height,
    });

    const post = this.database.createPost({
      creatorId: userId,
      title: assertRequiredString(body.title, 'title', 3, 120),
      caption: assertOptionalString(body.caption, 'caption', 500),
      description: assertOptionalString(body.description, 'description', 1500),
      visibility: body.visibility === 'followers' || body.visibility === 'private' ? body.visibility : 'public',
      status: body.publish === false ? 'processing' : 'published',
      hashtags: Array.isArray(body.hashtags)
        ? body.hashtags.map((tag) => String(tag).replace(/^#/, '').trim()).filter(Boolean).slice(0, 12)
        : [],
    });

    this.database.markVideoReady(video.id, post.id, job.output.thumbnailKey, job.output.hlsManifestKey);

    return {
      post: this.database.toFeedItem(post, userId),
      processing: job,
    };
  }

  getPlayback(videoId: string) {
    const video = this.database.findVideoById(videoId);
    if (!video) {
      throw new NotFoundException('Video not found');
    }

    return {
      id: video.id,
      status: video.status,
      playbackUrl: this.storage.publicUrl(video.storageKey),
      hlsManifestUrl: this.storage.publicUrl(video.hlsManifestKey),
      thumbnailUrl: this.storage.publicUrl(video.thumbnailKey),
      durationSeconds: video.durationSeconds,
      width: video.width,
      height: video.height,
    };
  }

  mockPut(videoId: string) {
    const video = this.database.findVideoById(videoId);
    if (!video) {
      throw new NotFoundException('Video upload not found');
    }

    return {
      success: true,
      message: 'Local upload accepted. In production this URL is a Cloudflare R2 or S3 presigned PUT.',
      videoId,
    };
  }
}
