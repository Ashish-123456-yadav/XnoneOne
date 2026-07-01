import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { assertOptionalString, assertRequiredString } from '../../common/pipes/pagination';
import { DatabaseService } from '../../infrastructure/database/database.service';
import { RealtimeHubService } from '../../infrastructure/realtime/realtime-hub.service';

type Visibility = 'public' | 'followers' | 'private';

@Injectable()
export class PostsService {
  constructor(
    private readonly database: DatabaseService,
    private readonly realtime: RealtimeHubService,
  ) {}

  create(userId: string, body: Record<string, unknown>) {
    const visibility = this.visibility(body.visibility);
    const post = this.database.createPost({
      creatorId: userId,
      title: assertRequiredString(body.title, 'title', 3, 120),
      caption: assertOptionalString(body.caption, 'caption', 500),
      description: assertOptionalString(body.description, 'description', 1500),
      visibility,
      status: body.publish === true ? 'published' : 'draft',
      hashtags: this.hashtags(body.hashtags),
    });

    return this.database.toFeedItem(post, userId);
  }

  getById(postId: string, viewerId: string | null) {
    const post = this.database.findPostById(postId);
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return this.database.toFeedItem(post, viewerId);
  }

  like(userId: string, postId: string) {
    const post = this.database.findPostById(postId);
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const result = this.database.likePost(userId, postId);
    if (post.creatorId !== userId) {
      this.database.createNotification({
        userId: post.creatorId,
        actorId: userId,
        type: 'like',
        title: 'New like',
        body: `${this.database.toPublicUser(userId).displayName} liked your post.`,
        entityId: postId,
      });
      this.realtime.publish(`notifications:${post.creatorId}`, { type: 'like', postId });
    }

    return result;
  }

  unlike(userId: string, postId: string) {
    if (!this.database.findPostById(postId)) {
      throw new NotFoundException('Post not found');
    }

    return this.database.unlikePost(userId, postId);
  }

  addComment(userId: string, postId: string, body: Record<string, unknown>) {
    const post = this.database.findPostById(postId);
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const comment = this.database.createComment({
      postId,
      authorId: userId,
      body: assertRequiredString(body.body, 'body', 1, 500),
      parentId: typeof body.parentId === 'string' ? body.parentId : null,
    });

    if (!comment) {
      throw new NotFoundException('Post not found');
    }

    if (post.creatorId !== userId) {
      this.database.createNotification({
        userId: post.creatorId,
        actorId: userId,
        type: 'comment',
        title: 'New comment',
        body: `${this.database.toPublicUser(userId).displayName} commented on your post.`,
        entityId: postId,
      });
      this.realtime.publish(`notifications:${post.creatorId}`, { type: 'comment', postId });
    }

    return this.database.toCommentResponse(comment);
  }

  listComments(postId: string, cursor: string | null, limit: number) {
    if (!this.database.findPostById(postId)) {
      throw new NotFoundException('Post not found');
    }

    const page = this.database.listComments(postId, cursor, limit);
    return {
      items: page.items.map((comment) => this.database.toCommentResponse(comment)),
      pageInfo: {
        limit,
        nextCursor: page.nextCursor,
        hasNextPage: Boolean(page.nextCursor),
      },
    };
  }

  share(userId: string, postId: string, body: Record<string, unknown>) {
    const channel = assertOptionalString(body.channel, 'channel', 40) || 'copy_link';
    const result = this.database.recordShare(userId, postId, channel);
    if (!result) {
      throw new NotFoundException('Post not found');
    }

    return result;
  }

  report(userId: string, postId: string, body: Record<string, unknown>) {
    if (!this.database.findPostById(postId)) {
      throw new NotFoundException('Post not found');
    }

    return this.database.createReport({
      reporterId: userId,
      postId,
      reason: assertRequiredString(body.reason, 'reason', 5, 500),
    });
  }

  private visibility(value: unknown): Visibility {
    if (value === undefined || value === null) {
      return 'public';
    }

    if (value === 'public' || value === 'followers' || value === 'private') {
      return value;
    }

    throw new BadRequestException('visibility must be public, followers, or private');
  }

  private hashtags(value: unknown): string[] {
    if (value === undefined || value === null) {
      return [];
    }

    if (!Array.isArray(value)) {
      throw new BadRequestException('hashtags must be an array');
    }

    return value
      .map((item) => String(item).replace(/^#/, '').trim())
      .filter(Boolean)
      .slice(0, 12);
  }
}
