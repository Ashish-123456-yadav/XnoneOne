import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { createHash, randomUUID } from 'crypto';
import { MongoClient, type Db, type Document } from 'mongodb';
import { PasswordService } from '../auth/password.service';

type UserRole = 'user' | 'creator' | 'moderator' | 'admin';
type PostVisibility = 'public' | 'followers' | 'private';
type PostStatus = 'draft' | 'processing' | 'published' | 'archived' | 'removed';
type VideoStatus = 'pending_upload' | 'processing' | 'ready' | 'failed';
type ReportStatus = 'open' | 'reviewing' | 'resolved' | 'rejected';
type NotificationType = 'like' | 'comment' | 'follow' | 'share' | 'system' | 'report';

export interface UserRecord {
  id: string;
  firebaseUid: string | null;
  email: string;
  passwordHash: string | null;
  username: string;
  role: UserRole;
  isVerified: boolean;
  isBanned: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileRecord {
  userId: string;
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  coverUrl: string | null;
  location: string | null;
  websiteUrl: string | null;
  creatorCategory: string | null;
  monetizationEnabled: boolean;
  followerCount: number;
  followingCount: number;
  postCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PublicUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  role: UserRole;
  isVerified: boolean;
  followerCount: number;
  followingCount: number;
  postCount: number;
}

export interface PostRecord {
  id: string;
  creatorId: string;
  title: string;
  caption: string;
  description: string;
  visibility: PostVisibility;
  status: PostStatus;
  hashtags: string[];
  likeCount: number;
  commentCount: number;
  shareCount: number;
  viewCount: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VideoRecord {
  id: string;
  postId: string | null;
  creatorId: string;
  storageKey: string;
  originalFilename: string;
  mimeType: string;
  byteSize: number;
  durationSeconds: number;
  width: number;
  height: number;
  thumbnailKey: string | null;
  hlsManifestKey: string | null;
  status: VideoStatus;
  moderationStatus: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface CommentRecord {
  id: string;
  postId: string;
  authorId: string;
  parentId: string | null;
  body: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationRecord {
  id: string;
  userId: string;
  actorId: string | null;
  type: NotificationType;
  title: string;
  body: string;
  entityId: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface ReportRecord {
  id: string;
  reporterId: string;
  postId: string | null;
  commentId: string | null;
  reason: string;
  status: ReportStatus;
  resolutionNote: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

export interface RefreshTokenRecord {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: string;
  revokedAt: string | null;
  createdAt: string;
}

export interface ShareRecord {
  id: string;
  userId: string;
  postId: string;
  channel: string;
  createdAt: string;
}

export interface FeedItem {
  id: string;
  creator: PublicUser;
  title: string;
  caption: string;
  description: string;
  hashtags: string[];
  visibility: PostVisibility;
  status: PostStatus;
  video: {
    id: string;
    postId: string | null;
    playbackUrl: string;
    thumbnailUrl: string | null;
    durationSeconds: number;
    width: number;
    height: number;
    status: VideoStatus;
    hlsManifestUrl: string | null;
  };
  likeCount: number;
  commentCount: number;
  shareCount: number;
  viewCount: number;
  isLikedByViewer: boolean;
  createdAt: string;
}

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private readonly mongoUri = process.env.MONGODB_URI ?? '';
  private readonly mongoDatabaseName = process.env.MONGODB_DATABASE ?? 'novasocial';
  private readonly mongoEnabled = process.env.DATABASE_PROVIDER === 'mongodb' || this.mongoUri.length > 0;
  private mongoClient: MongoClient | null = null;
  private mongoDb: Db | null = null;
  private mongoReady = false;

  private readonly users: UserRecord[] = [];
  private readonly profiles: ProfileRecord[] = [];
  private readonly posts: PostRecord[] = [];
  private readonly videos: VideoRecord[] = [];
  private readonly comments: CommentRecord[] = [];
  private readonly likes = new Set<string>();
  private readonly followers = new Set<string>();
  private readonly notifications: NotificationRecord[] = [];
  private readonly reports: ReportRecord[] = [];
  private readonly refreshTokens: RefreshTokenRecord[] = [];
  private readonly shares: ShareRecord[] = [];

  constructor() {
    this.seed();
  }

  async onModuleInit(): Promise<void> {
    if (!this.mongoEnabled) {
      return;
    }

    try {
      this.mongoClient = new MongoClient(this.mongoUri, { serverSelectionTimeoutMS: 3000 });
      await this.mongoClient.connect();
      this.mongoDb = this.mongoClient.db(this.mongoDatabaseName);
      await this.ensureMongoIndexes();

      const userCount = await this.mongoDb.collection('users').countDocuments();
      if (userCount > 0) {
        await this.hydrateFromMongo();
        this.logger.log(`MongoDB connected. Hydrated ${this.users.length} users and ${this.posts.length} posts.`);
      } else {
        await this.persistAllToMongo();
        this.logger.log('MongoDB connected. Seed data inserted.');
      }

      this.mongoReady = true;
    } catch (error) {
      this.mongoReady = false;
      this.mongoDb = null;
      await this.mongoClient?.close().catch(() => undefined);
      this.mongoClient = null;
      this.logger.warn(`MongoDB persistence unavailable; using in-memory data. ${(error as Error).message}`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.mongoClient?.close();
  }

  findUserById(id: string): UserRecord | undefined {
    return this.users.find((user) => user.id === id);
  }

  findUserByEmail(email: string): UserRecord | undefined {
    return this.users.find((user) => user.email.toLowerCase() === email.toLowerCase());
  }

  findUserByUsername(username: string): UserRecord | undefined {
    return this.users.find((user) => user.username.toLowerCase() === username.toLowerCase());
  }

  createUser(input: {
    email: string;
    passwordHash: string | null;
    username: string;
    displayName: string;
    firebaseUid?: string | null;
    role?: UserRole;
  }): UserRecord {
    const now = this.now();
    const user: UserRecord = {
      id: randomUUID(),
      firebaseUid: input.firebaseUid ?? null,
      email: input.email.toLowerCase(),
      passwordHash: input.passwordHash,
      username: input.username.toLowerCase(),
      role: input.role ?? 'creator',
      isVerified: false,
      isBanned: false,
      lastLoginAt: null,
      createdAt: now,
      updatedAt: now,
    };

    const profile: ProfileRecord = {
      userId: user.id,
      displayName: input.displayName,
      bio: '',
      avatarUrl: null,
      coverUrl: null,
      location: null,
      websiteUrl: null,
      creatorCategory: null,
      monetizationEnabled: false,
      followerCount: 0,
      followingCount: 0,
      postCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    this.users.push(user);
    this.profiles.push(profile);
    this.saveMongoDocument('users', user.id, user);
    this.saveMongoDocument('profiles', profile.userId, profile);
    return user;
  }

  touchLogin(userId: string): void {
    const user = this.findUserById(userId);
    if (user) {
      user.lastLoginAt = this.now();
      user.updatedAt = this.now();
      this.saveMongoDocument('users', user.id, user);
    }
  }

  toPublicUser(userId: string): PublicUser {
    const user = this.findUserById(userId);
    const profile = this.profiles.find((item) => item.userId === userId);

    if (!user || !profile) {
      return {
        id: userId,
        username: 'unknown',
        displayName: 'Unknown creator',
        avatarUrl: null,
        role: 'creator',
        isVerified: false,
        followerCount: 0,
        followingCount: 0,
        postCount: 0,
      };
    }

    return {
      id: user.id,
      username: user.username,
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl,
      role: user.role,
      isVerified: user.isVerified,
      followerCount: profile.followerCount,
      followingCount: profile.followingCount,
      postCount: profile.postCount,
    };
  }

  getProfile(userId: string): (ProfileRecord & { user: PublicUser }) | undefined {
    const profile = this.profiles.find((item) => item.userId === userId);
    return profile ? { ...profile, user: this.toPublicUser(userId) } : undefined;
  }

  updateProfile(
    userId: string,
    input: Partial<Pick<ProfileRecord, 'displayName' | 'bio' | 'avatarUrl' | 'coverUrl' | 'location' | 'websiteUrl' | 'creatorCategory'>>,
  ): ProfileRecord | undefined {
    const profile = this.profiles.find((item) => item.userId === userId);
    if (!profile) {
      return undefined;
    }

    Object.assign(profile, input, { updatedAt: this.now() });
    this.saveMongoDocument('profiles', profile.userId, profile);
    return profile;
  }

  createRefreshToken(userId: string, token: string, expiresAt: string): RefreshTokenRecord {
    const record: RefreshTokenRecord = {
      id: randomUUID(),
      userId,
      tokenHash: this.hashToken(token),
      expiresAt,
      revokedAt: null,
      createdAt: this.now(),
    };
    this.refreshTokens.push(record);
    this.saveMongoDocument('refreshTokens', record.id, record);
    return record;
  }

  findActiveRefreshToken(token: string): RefreshTokenRecord | undefined {
    const hash = this.hashToken(token);
    const now = Date.now();

    return this.refreshTokens.find((record) => {
      return record.tokenHash === hash && !record.revokedAt && new Date(record.expiresAt).getTime() > now;
    });
  }

  revokeRefreshToken(token: string): void {
    const record = this.findActiveRefreshToken(token);
    if (record) {
      record.revokedAt = this.now();
      this.saveMongoDocument('refreshTokens', record.id, record);
    }
  }

  createVideo(input: Omit<VideoRecord, 'createdAt' | 'updatedAt' | 'moderationStatus'>): VideoRecord {
    const now = this.now();
    const video: VideoRecord = {
      ...input,
      moderationStatus: 'pending',
      createdAt: now,
      updatedAt: now,
    };
    this.videos.push(video);
    this.saveMongoDocument('videos', video.id, video);
    return video;
  }

  findVideoById(videoId: string): VideoRecord | undefined {
    return this.videos.find((video) => video.id === videoId);
  }

  completeVideoUpload(videoId: string, creatorId: string): VideoRecord | undefined {
    const video = this.videos.find((item) => item.id === videoId && item.creatorId === creatorId);
    if (!video) {
      return undefined;
    }

    video.status = 'processing';
    video.updatedAt = this.now();
    this.saveMongoDocument('videos', video.id, video);
    return video;
  }

  markVideoReady(videoId: string, postId: string, thumbnailKey: string, hlsManifestKey: string): VideoRecord | undefined {
    const video = this.findVideoById(videoId);
    if (!video) {
      return undefined;
    }

    video.postId = postId;
    video.thumbnailKey = thumbnailKey;
    video.hlsManifestKey = hlsManifestKey;
    video.status = 'ready';
    video.moderationStatus = 'approved';
    video.updatedAt = this.now();
    this.saveMongoDocument('videos', video.id, video);
    return video;
  }

  createPost(input: {
    creatorId: string;
    title: string;
    caption: string;
    description: string;
    visibility: PostVisibility;
    status?: PostStatus;
    hashtags?: string[];
  }): PostRecord {
    const now = this.now();
    const post: PostRecord = {
      id: randomUUID(),
      creatorId: input.creatorId,
      title: input.title,
      caption: input.caption,
      description: input.description,
      visibility: input.visibility,
      status: input.status ?? 'draft',
      hashtags: input.hashtags ?? [],
      likeCount: 0,
      commentCount: 0,
      shareCount: 0,
      viewCount: 0,
      publishedAt: input.status === 'published' ? now : null,
      createdAt: now,
      updatedAt: now,
    };

    this.posts.push(post);
    const profile = this.profiles.find((item) => item.userId === input.creatorId);
    if (profile && post.status === 'published') {
      profile.postCount += 1;
      this.saveMongoDocument('profiles', profile.userId, profile);
    }

    this.saveMongoDocument('posts', post.id, post);
    return post;
  }

  findPostById(postId: string): PostRecord | undefined {
    return this.posts.find((post) => post.id === postId);
  }

  updatePost(postId: string, input: Partial<PostRecord>): PostRecord | undefined {
    const post = this.findPostById(postId);
    if (!post) {
      return undefined;
    }

    Object.assign(post, input, { updatedAt: this.now() });
    if (input.status === 'published' && !post.publishedAt) {
      post.publishedAt = this.now();
    }

    this.saveMongoDocument('posts', post.id, post);
    return post;
  }

  listFeed(viewerId: string | null, options: { cursor: string | null; limit: number; followingOnly?: boolean }): {
    items: FeedItem[];
    nextCursor: string | null;
  } {
    const followingIds = viewerId ? this.followingIdsFor(viewerId) : new Set<string>();
    const candidates = this.posts
      .filter((post) => {
        if (post.status !== 'published' || post.visibility === 'private') {
          return false;
        }

        if (options.followingOnly) {
          return followingIds.has(post.creatorId);
        }

        return post.visibility === 'public' || followingIds.has(post.creatorId) || post.creatorId === viewerId;
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    const start = options.cursor ? Math.max(candidates.findIndex((post) => post.id === options.cursor) + 1, 0) : 0;
    const page = candidates.slice(start, start + options.limit);
    const nextCursor = candidates[start + options.limit]?.id ?? null;

    return {
      items: page.map((post) => this.toFeedItem(post, viewerId)),
      nextCursor,
    };
  }

  toFeedItem(post: PostRecord, viewerId: string | null): FeedItem {
    const video =
      this.videos.find((item) => item.postId === post.id) ??
      this.videos.find((item) => item.creatorId === post.creatorId && item.status === 'ready');

    return {
      id: post.id,
      creator: this.toPublicUser(post.creatorId),
      title: post.title,
      caption: post.caption,
      description: post.description,
      hashtags: post.hashtags,
      visibility: post.visibility,
      status: post.status,
      video: {
        id: video?.id ?? randomUUID(),
        postId: post.id,
        playbackUrl: this.publicAsset(video?.storageKey ?? `processed/${post.id}/source.mp4`),
        thumbnailUrl: video?.thumbnailKey ? this.publicAsset(video.thumbnailKey) : this.publicAsset(`thumbnails/${post.id}.jpg`),
        durationSeconds: video?.durationSeconds ?? 38,
        width: video?.width ?? 1080,
        height: video?.height ?? 1920,
        status: video?.status ?? 'ready',
        hlsManifestUrl: video?.hlsManifestKey ? this.publicAsset(video.hlsManifestKey) : this.publicAsset(`hls/${post.id}/master.m3u8`),
      },
      likeCount: post.likeCount,
      commentCount: post.commentCount,
      shareCount: post.shareCount,
      viewCount: post.viewCount,
      isLikedByViewer: viewerId ? this.likes.has(this.likeKey(viewerId, post.id)) : false,
      createdAt: post.createdAt,
    };
  }

  likePost(userId: string, postId: string): { liked: boolean; likeCount: number } {
    const post = this.findPostById(postId);
    if (!post) {
      return { liked: false, likeCount: 0 };
    }

    const key = this.likeKey(userId, postId);
    if (!this.likes.has(key)) {
      this.likes.add(key);
      post.likeCount += 1;
      this.saveMongoDocument('likes', key, { userId, postId });
      this.saveMongoDocument('posts', post.id, post);
    }

    return { liked: true, likeCount: post.likeCount };
  }

  unlikePost(userId: string, postId: string): { liked: boolean; likeCount: number } {
    const post = this.findPostById(postId);
    if (!post) {
      return { liked: false, likeCount: 0 };
    }

    const key = this.likeKey(userId, postId);
    if (this.likes.delete(key)) {
      post.likeCount = Math.max(0, post.likeCount - 1);
      this.deleteMongoDocument('likes', key);
      this.saveMongoDocument('posts', post.id, post);
    }

    return { liked: false, likeCount: post.likeCount };
  }

  createComment(input: { postId: string; authorId: string; body: string; parentId?: string | null }): CommentRecord | undefined {
    const post = this.findPostById(input.postId);
    if (!post) {
      return undefined;
    }

    const now = this.now();
    const comment: CommentRecord = {
      id: randomUUID(),
      postId: input.postId,
      authorId: input.authorId,
      parentId: input.parentId ?? null,
      body: input.body,
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    };

    this.comments.push(comment);
    post.commentCount += 1;
    this.saveMongoDocument('comments', comment.id, comment);
    this.saveMongoDocument('posts', post.id, post);
    return comment;
  }

  listComments(postId: string, cursor: string | null, limit: number): { items: CommentRecord[]; nextCursor: string | null } {
    const candidates = this.comments
      .filter((comment) => comment.postId === postId && !comment.isDeleted)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const start = cursor ? Math.max(candidates.findIndex((comment) => comment.id === cursor) + 1, 0) : 0;

    return {
      items: candidates.slice(start, start + limit),
      nextCursor: candidates[start + limit]?.id ?? null,
    };
  }

  recordShare(userId: string, postId: string, channel: string): { shareCount: number } | undefined {
    const post = this.findPostById(postId);
    if (!post) {
      return undefined;
    }

    const share = { id: randomUUID(), userId, postId, channel, createdAt: this.now() };
    this.shares.push(share);
    post.shareCount += 1;
    this.saveMongoDocument('shares', share.id, share);
    this.saveMongoDocument('posts', post.id, post);
    return { shareCount: post.shareCount };
  }

  follow(followerId: string, followingId: string): { following: boolean } {
    if (followerId === followingId) {
      return { following: false };
    }

    const key = this.followKey(followerId, followingId);
    if (!this.followers.has(key)) {
      this.followers.add(key);
      this.incrementFollowCounts(followerId, followingId, 1);
      this.saveMongoDocument('followers', key, { followerId, followingId });
    }

    return { following: true };
  }

  unfollow(followerId: string, followingId: string): { following: boolean } {
    const key = this.followKey(followerId, followingId);
    if (this.followers.delete(key)) {
      this.incrementFollowCounts(followerId, followingId, -1);
      this.deleteMongoDocument('followers', key);
    }

    return { following: false };
  }

  isFollowing(followerId: string, followingId: string): boolean {
    return this.followers.has(this.followKey(followerId, followingId));
  }

  createNotification(input: Omit<NotificationRecord, 'id' | 'readAt' | 'createdAt'>): NotificationRecord {
    const notification: NotificationRecord = {
      id: randomUUID(),
      ...input,
      readAt: null,
      createdAt: this.now(),
    };

    this.notifications.unshift(notification);
    this.saveMongoDocument('notifications', notification.id, notification);
    return notification;
  }

  listNotifications(userId: string, cursor: string | null, limit: number): { items: NotificationRecord[]; nextCursor: string | null } {
    const candidates = this.notifications.filter((notification) => notification.userId === userId);
    const start = cursor ? Math.max(candidates.findIndex((notification) => notification.id === cursor) + 1, 0) : 0;

    return {
      items: candidates.slice(start, start + limit),
      nextCursor: candidates[start + limit]?.id ?? null,
    };
  }

  markNotificationRead(userId: string, notificationId: string): NotificationRecord | undefined {
    const notification = this.notifications.find((item) => item.id === notificationId && item.userId === userId);
    if (notification) {
      notification.readAt = notification.readAt ?? this.now();
      this.saveMongoDocument('notifications', notification.id, notification);
    }

    return notification;
  }

  search(query: string): { users: PublicUser[]; posts: FeedItem[]; hashtags: Array<{ tag: string; postCount: number }> } {
    const normalized = query.toLowerCase();
    const users = this.users
      .filter((user) => {
        const profile = this.profiles.find((item) => item.userId === user.id);
        return user.username.includes(normalized) || profile?.displayName.toLowerCase().includes(normalized);
      })
      .slice(0, 12)
      .map((user) => this.toPublicUser(user.id));

    const posts = this.posts
      .filter((post) => {
        return (
          post.status === 'published' &&
          (post.title.toLowerCase().includes(normalized) ||
            post.caption.toLowerCase().includes(normalized) ||
            post.hashtags.some((tag) => tag.toLowerCase().includes(normalized)))
        );
      })
      .slice(0, 20)
      .map((post) => this.toFeedItem(post, null));

    const hashtagCounts = new Map<string, number>();
    for (const post of this.posts) {
      for (const tag of post.hashtags) {
        if (tag.toLowerCase().includes(normalized)) {
          hashtagCounts.set(tag, (hashtagCounts.get(tag) ?? 0) + 1);
        }
      }
    }

    return {
      users,
      posts,
      hashtags: [...hashtagCounts.entries()].map(([tag, postCount]) => ({ tag, postCount })).slice(0, 12),
    };
  }

  createReport(input: {
    reporterId: string;
    postId?: string | null;
    commentId?: string | null;
    reason: string;
  }): ReportRecord {
    const report: ReportRecord = {
      id: randomUUID(),
      reporterId: input.reporterId,
      postId: input.postId ?? null,
      commentId: input.commentId ?? null,
      reason: input.reason,
      status: 'open',
      resolutionNote: null,
      reviewedBy: null,
      reviewedAt: null,
      createdAt: this.now(),
    };

    this.reports.unshift(report);
    this.saveMongoDocument('reports', report.id, report);
    return report;
  }

  listReports(status?: ReportStatus): ReportRecord[] {
    return this.reports.filter((report) => (status ? report.status === status : true));
  }

  updateReport(reportId: string, reviewerId: string, status: ReportStatus, resolutionNote: string): ReportRecord | undefined {
    const report = this.reports.find((item) => item.id === reportId);
    if (!report) {
      return undefined;
    }

    report.status = status;
    report.reviewedBy = reviewerId;
    report.reviewedAt = this.now();
    report.resolutionNote = resolutionNote;
    this.saveMongoDocument('reports', report.id, report);
    return report;
  }

  setUserBanned(userId: string, banned: boolean): UserRecord | undefined {
    const user = this.findUserById(userId);
    if (!user) {
      return undefined;
    }

    user.isBanned = banned;
    user.updatedAt = this.now();
    this.saveMongoDocument('users', user.id, user);
    return user;
  }

  adminDashboard(): {
    users: number;
    creators: number;
    posts: number;
    reportsOpen: number;
    uploadsProcessing: number;
    revenueUsd: number;
    retention: Array<{ label: string; value: number }>;
  } {
    return {
      users: this.users.length,
      creators: this.users.filter((user) => user.role === 'creator').length,
      posts: this.posts.length,
      reportsOpen: this.reports.filter((report) => report.status === 'open').length,
      uploadsProcessing: this.videos.filter((video) => video.status === 'processing' || video.status === 'pending_upload').length,
      revenueUsd: 184_200,
      retention: [
        { label: 'D1', value: 72 },
        { label: 'D7', value: 42 },
        { label: 'D30', value: 24 },
      ],
    };
  }

  creatorAnalytics(userId: string): {
    followers: number;
    views: number;
    likes: number;
    comments: number;
    shares: number;
    posts: number;
    engagementRate: number;
    watchTimeHours: number;
  } {
    const profile = this.profiles.find((item) => item.userId === userId);
    const posts = this.posts.filter((post) => post.creatorId === userId);
    const views = posts.reduce((sum, post) => sum + post.viewCount, 0);
    const likes = posts.reduce((sum, post) => sum + post.likeCount, 0);
    const comments = posts.reduce((sum, post) => sum + post.commentCount, 0);
    const shares = posts.reduce((sum, post) => sum + post.shareCount, 0);
    const engagementRate = views > 0 ? Number((((likes + comments + shares) / views) * 100).toFixed(2)) : 0;

    return {
      followers: profile?.followerCount ?? 0,
      views,
      likes,
      comments,
      shares,
      posts: posts.length,
      engagementRate,
      watchTimeHours: Number((views * 0.008).toFixed(1)),
    };
  }

  toCommentResponse(comment: CommentRecord): CommentRecord & { author: PublicUser } {
    return {
      ...comment,
      author: this.toPublicUser(comment.authorId),
    };
  }

  toNotificationResponse(notification: NotificationRecord): NotificationRecord & { actor: PublicUser | null } {
    return {
      ...notification,
      actor: notification.actorId ? this.toPublicUser(notification.actorId) : null,
    };
  }

  private async ensureMongoIndexes(): Promise<void> {
    const db = this.mongoDb;
    if (!db) {
      return;
    }

    await Promise.all([
      db.collection('users').createIndex({ email: 1 }, { unique: true }),
      db.collection('users').createIndex({ username: 1 }, { unique: true }),
      db.collection('users').createIndex({ firebaseUid: 1 }, { unique: true, sparse: true }),
      db.collection('profiles').createIndex({ userId: 1 }, { unique: true }),
      db.collection('posts').createIndex({ creatorId: 1, status: 1, createdAt: -1 }),
      db.collection('posts').createIndex({ hashtags: 1 }),
      db.collection('videos').createIndex({ postId: 1 }),
      db.collection('videos').createIndex({ creatorId: 1, status: 1 }),
      db.collection('comments').createIndex({ postId: 1, createdAt: -1 }),
      db.collection('notifications').createIndex({ userId: 1, createdAt: -1 }),
      db.collection('reports').createIndex({ status: 1, createdAt: -1 }),
      db.collection('refreshTokens').createIndex({ tokenHash: 1 }),
      db.collection('refreshTokens').createIndex({ userId: 1, revokedAt: 1 }),
      db.collection('shares').createIndex({ postId: 1, createdAt: -1 }),
    ]);
  }

  private async hydrateFromMongo(): Promise<void> {
    const db = this.mongoDb;
    if (!db) {
      return;
    }

    this.clearMemory();

    const [users, profiles, posts, videos, comments, notifications, reports, refreshTokens, shares, likes, followers] = await Promise.all([
      this.loadMongoRecords<UserRecord>('users'),
      this.loadMongoRecords<ProfileRecord>('profiles'),
      this.loadMongoRecords<PostRecord>('posts'),
      this.loadMongoRecords<VideoRecord>('videos'),
      this.loadMongoRecords<CommentRecord>('comments'),
      this.loadMongoRecords<NotificationRecord>('notifications'),
      this.loadMongoRecords<ReportRecord>('reports'),
      this.loadMongoRecords<RefreshTokenRecord>('refreshTokens'),
      this.loadMongoRecords<ShareRecord>('shares'),
      db.collection<{ _id: string }>('likes').find().toArray(),
      db.collection<{ _id: string }>('followers').find().toArray(),
    ]);

    this.users.push(...users);
    this.profiles.push(...profiles);
    this.posts.push(...posts);
    this.videos.push(...videos);
    this.comments.push(...comments);
    this.notifications.push(...notifications);
    this.reports.push(...reports);
    this.refreshTokens.push(...refreshTokens);
    this.shares.push(...shares);

    for (const like of likes) {
      this.likes.add(String(like._id));
    }

    for (const follow of followers) {
      this.followers.add(String(follow._id));
    }
  }

  private async persistAllToMongo(): Promise<void> {
    if (!this.mongoDb) {
      return;
    }

    await Promise.all([
      this.replaceMongoCollection('users', this.users.map((item) => this.withMongoId(item.id, item))),
      this.replaceMongoCollection('profiles', this.profiles.map((item) => this.withMongoId(item.userId, item))),
      this.replaceMongoCollection('posts', this.posts.map((item) => this.withMongoId(item.id, item))),
      this.replaceMongoCollection('videos', this.videos.map((item) => this.withMongoId(item.id, item))),
      this.replaceMongoCollection('comments', this.comments.map((item) => this.withMongoId(item.id, item))),
      this.replaceMongoCollection('notifications', this.notifications.map((item) => this.withMongoId(item.id, item))),
      this.replaceMongoCollection('reports', this.reports.map((item) => this.withMongoId(item.id, item))),
      this.replaceMongoCollection('refreshTokens', this.refreshTokens.map((item) => this.withMongoId(item.id, item))),
      this.replaceMongoCollection('shares', this.shares.map((item) => this.withMongoId(item.id, item))),
      this.replaceMongoCollection(
        'likes',
        [...this.likes].map((key) => {
          const [userId, postId] = key.split(':');
          return { _id: key, userId, postId };
        }),
      ),
      this.replaceMongoCollection(
        'followers',
        [...this.followers].map((key) => {
          const [followerId, followingId] = key.split(':');
          return { _id: key, followerId, followingId };
        }),
      ),
    ]);
  }

  private async loadMongoRecords<T>(collectionName: string): Promise<T[]> {
    const documents = await this.mongoDb!.collection(collectionName).find().toArray();
    return documents.map((document) => this.withoutMongoId<T>(document));
  }

  private async replaceMongoCollection(collectionName: string, documents: Document[]): Promise<void> {
    const collection = this.mongoDb!.collection(collectionName);
    await collection.deleteMany({});
    if (documents.length > 0) {
      await collection.insertMany(documents);
    }
  }

  private saveMongoDocument(collectionName: string, key: string, document: object): void {
    this.persistMongo(async () => {
      await this.mongoDb!.collection<{ _id: string } & Document>(collectionName).updateOne({ _id: key }, { $set: this.cloneRecord(document) }, { upsert: true });
    });
  }

  private deleteMongoDocument(collectionName: string, key: string): void {
    this.persistMongo(async () => {
      await this.mongoDb!.collection<{ _id: string } & Document>(collectionName).deleteOne({ _id: key });
    });
  }

  private persistMongo(task: () => Promise<void>): void {
    if (!this.mongoReady || !this.mongoDb) {
      return;
    }

    void task().catch((error) => {
      this.logger.warn(`MongoDB persistence write failed: ${(error as Error).message}`);
    });
  }

  private withMongoId<T extends object>(key: string, document: T): Document {
    return { _id: key, ...this.cloneRecord(document) };
  }

  private withoutMongoId<T>(document: Document): T {
    const { _id: _ignored, ...rest } = document;
    return rest as T;
  }

  private cloneRecord<T>(record: T): T {
    return JSON.parse(JSON.stringify(record)) as T;
  }

  private clearMemory(): void {
    this.users.length = 0;
    this.profiles.length = 0;
    this.posts.length = 0;
    this.videos.length = 0;
    this.comments.length = 0;
    this.notifications.length = 0;
    this.reports.length = 0;
    this.refreshTokens.length = 0;
    this.shares.length = 0;
    this.likes.clear();
    this.followers.clear();
  }

  private seed(): void {
    const now = this.now();
    const seedPassword = PasswordService.hashWithSalt('NovaPass123!', 'novasocial-seed-salt');
    const avaId = '00000000-0000-4000-8000-000000000001';
    const minaId = '00000000-0000-4000-8000-000000000002';
    const adminId = '00000000-0000-4000-8000-000000000003';

    this.users.push(
      {
        id: avaId,
        firebaseUid: 'firebase-ava',
        email: 'ava@novasocial.ai',
        passwordHash: seedPassword,
        username: 'ava_ai',
        role: 'creator',
        isVerified: true,
        isBanned: false,
        lastLoginAt: null,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: minaId,
        firebaseUid: 'firebase-mina',
        email: 'mina@novasocial.ai',
        passwordHash: seedPassword,
        username: 'minamakes',
        role: 'creator',
        isVerified: true,
        isBanned: false,
        lastLoginAt: null,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: adminId,
        firebaseUid: 'firebase-admin',
        email: 'admin@novasocial.ai',
        passwordHash: seedPassword,
        username: 'nova_admin',
        role: 'admin',
        isVerified: true,
        isBanned: false,
        lastLoginAt: null,
        createdAt: now,
        updatedAt: now,
      },
    );

    this.profiles.push(
      {
        userId: avaId,
        displayName: 'Ava Chen',
        bio: 'Practical AI creator workflows for busy teams.',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
        coverUrl: null,
        location: 'San Francisco',
        websiteUrl: 'https://novasocial.ai/ava',
        creatorCategory: 'Education',
        monetizationEnabled: true,
        followerCount: 12840,
        followingCount: 231,
        postCount: 2,
        createdAt: now,
        updatedAt: now,
      },
      {
        userId: minaId,
        displayName: 'Mina Lee',
        bio: 'Short-form storytelling, launch films, and editing notes.',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
        coverUrl: null,
        location: 'Seoul',
        websiteUrl: 'https://novasocial.ai/mina',
        creatorCategory: 'Film',
        monetizationEnabled: true,
        followerCount: 23810,
        followingCount: 420,
        postCount: 2,
        createdAt: now,
        updatedAt: now,
      },
      {
        userId: adminId,
        displayName: 'Nova Admin',
        bio: 'Platform operations.',
        avatarUrl: null,
        coverUrl: null,
        location: null,
        websiteUrl: null,
        creatorCategory: 'Operations',
        monetizationEnabled: false,
        followerCount: 0,
        followingCount: 0,
        postCount: 0,
        createdAt: now,
        updatedAt: now,
      },
    );

    const postOne = this.createPost({
      creatorId: avaId,
      title: 'AI caption workflow in 45 seconds',
      caption: 'Turn a raw clip into a polished post with one prompt.',
      description: 'A compact editing flow for captions, title testing, and hashtag strategy.',
      visibility: 'public',
      status: 'published',
      hashtags: ['AIWorkflow', 'CreatorTools', 'ShortForm'],
    });
    postOne.viewCount = 98200;
    postOne.likeCount = 8230;
    postOne.commentCount = 412;
    postOne.shareCount = 781;

    const postTwo = this.createPost({
      creatorId: minaId,
      title: 'Launch trailer pacing map',
      caption: 'Three cuts that make product videos feel alive.',
      description: 'Breaking down a launch teaser from hook to CTA.',
      visibility: 'public',
      status: 'published',
      hashtags: ['LaunchVideo', 'Editing', 'CreatorStudio'],
    });
    postTwo.viewCount = 67200;
    postTwo.likeCount = 5102;
    postTwo.commentCount = 188;
    postTwo.shareCount = 454;

    this.videos.push(
      {
        id: randomUUID(),
        postId: postOne.id,
        creatorId: avaId,
        storageKey: 'demo/ava-caption-workflow.mp4',
        originalFilename: 'ava-caption-workflow.mp4',
        mimeType: 'video/mp4',
        byteSize: 18_300_000,
        durationSeconds: 45,
        width: 1080,
        height: 1920,
        thumbnailKey: 'demo/ava-caption-workflow.jpg',
        hlsManifestKey: 'demo/ava-caption-workflow/master.m3u8',
        status: 'ready',
        moderationStatus: 'approved',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: randomUUID(),
        postId: postTwo.id,
        creatorId: minaId,
        storageKey: 'demo/mina-launch-trailer.mp4',
        originalFilename: 'mina-launch-trailer.mp4',
        mimeType: 'video/mp4',
        byteSize: 26_800_000,
        durationSeconds: 52,
        width: 1080,
        height: 1920,
        thumbnailKey: 'demo/mina-launch-trailer.jpg',
        hlsManifestKey: 'demo/mina-launch-trailer/master.m3u8',
        status: 'ready',
        moderationStatus: 'approved',
        createdAt: now,
        updatedAt: now,
      },
    );

    this.comments.push({
      id: randomUUID(),
      postId: postOne.id,
      authorId: minaId,
      parentId: null,
      body: 'The hook testing tip is gold.',
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    });

    this.reports.push({
      id: randomUUID(),
      reporterId: avaId,
      postId: postTwo.id,
      commentId: null,
      reason: 'Needs manual copyright review before promotion.',
      status: 'open',
      resolutionNote: null,
      reviewedBy: null,
      reviewedAt: null,
      createdAt: now,
    });

    this.notifications.push({
      id: randomUUID(),
      userId: avaId,
      actorId: minaId,
      type: 'comment',
      title: 'New comment',
      body: 'Mina Lee commented on your post.',
      entityId: postOne.id,
      readAt: null,
      createdAt: now,
    });
  }

  private incrementFollowCounts(followerId: string, followingId: string, direction: 1 | -1): void {
    const followerProfile = this.profiles.find((item) => item.userId === followerId);
    const followingProfile = this.profiles.find((item) => item.userId === followingId);

    if (followerProfile) {
      followerProfile.followingCount = Math.max(0, followerProfile.followingCount + direction);
      this.saveMongoDocument('profiles', followerProfile.userId, followerProfile);
    }

    if (followingProfile) {
      followingProfile.followerCount = Math.max(0, followingProfile.followerCount + direction);
      this.saveMongoDocument('profiles', followingProfile.userId, followingProfile);
    }
  }

  private followingIdsFor(userId: string): Set<string> {
    return new Set(
      [...this.followers]
        .map((item) => item.split(':'))
        .filter(([followerId]) => followerId === userId)
        .map(([, followingId]) => followingId),
    );
  }

  private likeKey(userId: string, postId: string): string {
    return `${userId}:${postId}`;
  }

  private followKey(followerId: string, followingId: string): string {
    return `${followerId}:${followingId}`;
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private publicAsset(key: string): string {
    return `https://cdn.novasocial.ai/${key}`;
  }

  private now(): string {
    return new Date().toISOString();
  }
}
