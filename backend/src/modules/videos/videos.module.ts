import { Module } from '@nestjs/common';
import { VideoProcessingService } from './video-processing.service';
import { VideosController } from './videos.controller';
import { VideosService } from './videos.service';

@Module({
  controllers: [VideosController],
  providers: [VideosService, VideoProcessingService],
  exports: [VideosService],
})
export class VideosModule {}
