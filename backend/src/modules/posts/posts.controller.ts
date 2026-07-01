import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthGuard } from '../../common/guards/auth.guard';
import { normalizePagination } from '../../common/pipes/pagination';
import { RequestUser } from '../../common/types/request-user';
import { PostsService } from './posts.service';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @UseGuards(AuthGuard)
  @Post()
  create(@CurrentUser() user: RequestUser, @Body() body: Record<string, unknown>) {
    return this.postsService.create(user.id, body);
  }

  @Get(':postId')
  getById(@Param('postId') postId: string) {
    return this.postsService.getById(postId, null);
  }

  @UseGuards(AuthGuard)
  @Post(':postId/like')
  like(@CurrentUser() user: RequestUser, @Param('postId') postId: string) {
    return this.postsService.like(user.id, postId);
  }

  @UseGuards(AuthGuard)
  @Delete(':postId/like')
  unlike(@CurrentUser() user: RequestUser, @Param('postId') postId: string) {
    return this.postsService.unlike(user.id, postId);
  }

  @Get(':postId/comments')
  listComments(@Param('postId') postId: string, @Query() query: Record<string, string>) {
    const pagination = normalizePagination(query, 20, 100);
    return this.postsService.listComments(postId, pagination.cursor, pagination.limit);
  }

  @UseGuards(AuthGuard)
  @Post(':postId/comments')
  addComment(@CurrentUser() user: RequestUser, @Param('postId') postId: string, @Body() body: Record<string, unknown>) {
    return this.postsService.addComment(user.id, postId, body);
  }

  @UseGuards(AuthGuard)
  @Post(':postId/share')
  share(@CurrentUser() user: RequestUser, @Param('postId') postId: string, @Body() body: Record<string, unknown>) {
    return this.postsService.share(user.id, postId, body);
  }

  @UseGuards(AuthGuard)
  @Post(':postId/report')
  report(@CurrentUser() user: RequestUser, @Param('postId') postId: string, @Body() body: Record<string, unknown>) {
    return this.postsService.report(user.id, postId, body);
  }
}
