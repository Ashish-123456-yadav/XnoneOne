import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthGuard } from '../../common/guards/auth.guard';
import { normalizePagination } from '../../common/pipes/pagination';
import { RequestUser } from '../../common/types/request-user';
import { FeedService } from './feed.service';

@Controller('feed')
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  @Get()
  getHomeFeed(@Query() query: Record<string, string>) {
    const pagination = normalizePagination(query);
    return this.feedService.homeFeed(null, pagination.cursor, pagination.limit, query.filter);
  }

  @UseGuards(AuthGuard)
  @Get('following')
  getFollowingFeed(@CurrentUser() user: RequestUser, @Query() query: Record<string, string>) {
    const pagination = normalizePagination(query);
    return this.feedService.homeFeed(user.id, pagination.cursor, pagination.limit, 'following');
  }
}
