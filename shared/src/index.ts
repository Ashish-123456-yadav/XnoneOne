export type UUID = string;

export type UserRole = 'user' | 'creator' | 'moderator' | 'admin';
export type PostVisibility = 'public' | 'followers' | 'private';
export type PostStatus = 'draft' | 'processing' | 'published' | 'archived' | 'removed';
export type NotificationType = 'like' | 'comment' | 'follow' | 'share' | 'system' | 'report';
export type ReportStatus = 'open' | 'reviewing' | 'resolved' | 'rejected';
export type AiGenerationType = 'caption' | 'title' | 'description' | 'hashtags';

export interface ApiEnvelope<T> {
  data: T;
  requestId: string;
  timestamp: string;
}

export interface PageInfo {
  limit: number;
  nextCursor: string | null;
  hasNextPage: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  pageInfo: PageInfo;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface PublicUser {
  id: UUID;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  role: UserRole;
  isVerified: boolean;
  followerCount: number;
  followingCount: number;
  postCount: number;
}

export interface AuthSession {
  user: PublicUser;
  tokens: AuthTokens;
}

export interface VideoAsset {
  id: UUID;
  postId: UUID | null;
  playbackUrl: string;
  thumbnailUrl: string | null;
  durationSeconds: number;
  width: number;
  height: number;
  status: 'pending_upload' | 'processing' | 'ready' | 'failed';
  hlsManifestUrl: string | null;
}

export interface FeedPost {
  id: UUID;
  creator: PublicUser;
  title: string;
  caption: string;
  description: string;
  hashtags: string[];
  visibility: PostVisibility;
  status: PostStatus;
  video: VideoAsset;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  viewCount: number;
  isLikedByViewer: boolean;
  createdAt: string;
}

export interface Comment {
  id: UUID;
  postId: UUID;
  author: PublicUser;
  body: string;
  createdAt: string;
}

export interface NotificationItem {
  id: UUID;
  type: NotificationType;
  title: string;
  body: string;
  readAt: string | null;
  actor: PublicUser | null;
  entityId: string | null;
  createdAt: string;
}

export interface AdminDashboard {
  users: number;
  creators: number;
  posts: number;
  reportsOpen: number;
  uploadsProcessing: number;
  revenueUsd: number;
  retention: Array<{ label: string; value: number }>;
}
