import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../infrastructure/database/database.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly database: DatabaseService) {}

  creatorOverview(userId: string) {
    const metrics = this.database.creatorAnalytics(userId);

    return {
      profile: metrics,
      trends: [
        { label: 'Views', value: metrics.views },
        { label: 'Likes', value: metrics.likes },
        { label: 'Comments', value: metrics.comments },
        { label: 'Shares', value: metrics.shares },
      ],
      aiTools: ['Caption generation', 'Hashtag generation', 'Title testing', 'Whisper transcription'],
    };
  }
}
