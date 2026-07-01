import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RequestUser } from '../../common/types/request-user';
import { VideosService } from './videos.service';

@Controller('videos')
export class VideosController {
  constructor(private readonly videosService: VideosService) {}

  @UseGuards(AuthGuard)
  @Post('uploads/initiate')
  initiateUpload(@CurrentUser() user: RequestUser, @Body() body: Record<string, unknown>) {
    return this.videosService.initiateUpload(user.id, body);
  }

  @UseGuards(AuthGuard)
  @Post(':videoId/complete')
  completeUpload(@CurrentUser() user: RequestUser, @Param('videoId') videoId: string, @Body() body: Record<string, unknown>) {
    return this.videosService.completeUpload(user.id, videoId, body);
  }

  @Get(':videoId/playback')
  getPlayback(@Param('videoId') videoId: string) {
    return this.videosService.getPlayback(videoId);
  }

  @Post('uploads/:videoId/mock-put')
  mockPut(@Param('videoId') videoId: string) {
    return this.videosService.mockPut(videoId);
  }
}
