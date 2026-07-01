import { Injectable } from '@nestjs/common';

@Injectable()
export class VideoProcessingService {
  queueTranscode(input: { videoId: string; storageKey: string; width: number; height: number }) {
    return {
      jobId: `ffmpeg-${input.videoId}`,
      status: 'queued',
      pipeline: ['probe', 'normalize-audio', 'generate-thumbnail', 'transcode-hls', 'moderation-scan'],
      output: {
        thumbnailKey: input.storageKey.replace(/^raw\//, 'thumbnails/').replace(/\.[^.]+$/, '.jpg'),
        hlsManifestKey: input.storageKey.replace(/^raw\//, 'hls/').replace(/\.[^.]+$/, '/master.m3u8'),
        targetRenditions: [
          { label: '360p', width: 360, bitrate: '800k' },
          { label: '720p', width: 720, bitrate: '2400k' },
          { label: '1080p', width: 1080, bitrate: '5200k' },
        ],
      },
    };
  }
}
