import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../infrastructure/database/database.service';

@Injectable()
export class FeedService {
  constructor(private readonly database: DatabaseService) {}

  homeFeed(viewerId: string | null, cursor: string | null, limit: number, filter?: string) {
    const followingOnly = filter === 'following';
    const page = this.database.listFeed(viewerId, { cursor, limit, followingOnly });

    return {
      items: page.items,
      pageInfo: {
        limit,
        nextCursor: page.nextCursor,
        hasNextPage: Boolean(page.nextCursor),
      },
    };
  }
}
