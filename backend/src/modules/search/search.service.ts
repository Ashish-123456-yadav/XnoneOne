import { BadRequestException, Injectable } from '@nestjs/common';
import { DatabaseService } from '../../infrastructure/database/database.service';

@Injectable()
export class SearchService {
  constructor(private readonly database: DatabaseService) {}

  search(query: Record<string, string>) {
    const q = (query.q ?? '').trim();
    if (q.length < 2) {
      throw new BadRequestException('Search query must be at least 2 characters');
    }

    const result = this.database.search(q);
    const type = query.type ?? 'all';

    return {
      users: type === 'all' || type === 'users' ? result.users : [],
      posts: type === 'all' || type === 'posts' ? result.posts : [],
      hashtags: type === 'all' || type === 'hashtags' ? result.hashtags : [],
    };
  }
}
