import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AdminDashboard, AuthSession, Comment, FeedPost, NotificationItem, PaginatedResponse, PublicUser } from '@novasocial/shared';
import { apiFetch } from './client';

export function useLogin() {
  return useMutation({
    mutationFn: (body: { email: string; password: string }) =>
      apiFetch<AuthSession>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: (body: { email: string; password: string; username: string; displayName: string }) =>
      apiFetch<AuthSession>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
  });
}

export function useFeed(token?: string, filter: 'home' | 'following' = 'home') {
  return useQuery<PaginatedResponse<FeedPost>>({
    queryKey: ['feed', filter],
    queryFn: () => apiFetch<PaginatedResponse<FeedPost>>(filter === 'following' ? '/feed/following' : '/feed', { token }),
  });
}

export function useLikePost(token?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: string) => apiFetch<{ liked: boolean; likeCount: number }>(`/posts/${postId}/like`, { method: 'POST', token }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['feed'] }),
  });
}

export function useSharePost(token?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: string) =>
      apiFetch<{ shareCount: number }>(`/posts/${postId}/share`, {
        method: 'POST',
        token,
        body: JSON.stringify({ channel: 'mobile_share_sheet' }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['feed'] }),
  });
}

export function useAddComment(token?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: { postId: string; text: string }) =>
      apiFetch<Comment>(`/posts/${body.postId}/comments`, {
        method: 'POST',
        token,
        body: JSON.stringify({ body: body.text }),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['comments', variables.postId] });
    },
  });
}

export function useFollowUser(token?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (username: string) =>
      apiFetch<{ following: boolean; user: PublicUser }>(`/users/${encodeURIComponent(username)}/follow`, {
        method: 'POST',
        token,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['search'] });
    },
  });
}

export function useProfile(token?: string) {
  return useQuery<{ user: PublicUser; bio: string; creatorCategory: string | null; monetizationEnabled: boolean }>({
    queryKey: ['profile'],
    queryFn: () => apiFetch<{ user: PublicUser; bio: string; creatorCategory: string | null; monetizationEnabled: boolean }>('/users/me/profile', { token }),
    enabled: Boolean(token),
  });
}

export function useNotifications(token?: string) {
  return useQuery<PaginatedResponse<NotificationItem>>({
    queryKey: ['notifications'],
    queryFn: () => apiFetch<PaginatedResponse<NotificationItem>>('/notifications', { token }),
    enabled: Boolean(token),
  });
}

export function useMarkNotificationRead(token?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) =>
      apiFetch<NotificationItem>(`/notifications/${notificationId}/read`, {
        method: 'PATCH',
        token,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

export function useCreatorAnalytics(token?: string) {
  return useQuery<{
    profile: {
      followers: number;
      views: number;
      likes: number;
      comments: number;
      shares: number;
      posts: number;
      engagementRate: number;
      watchTimeHours: number;
    };
    trends: Array<{ label: string; value: number }>;
    aiTools: string[];
  }>({
    queryKey: ['creator-analytics'],
    queryFn: () =>
      apiFetch<{
        profile: {
          followers: number;
          views: number;
          likes: number;
          comments: number;
          shares: number;
          posts: number;
          engagementRate: number;
          watchTimeHours: number;
        };
        trends: Array<{ label: string; value: number }>;
        aiTools: string[];
      }>('/analytics/creator', { token }),
    enabled: Boolean(token),
  });
}

export function useSearch(query: string) {
  return useQuery<{
    users: PublicUser[];
    posts: FeedPost[];
    hashtags: Array<{ tag: string; postCount: number }>;
  }>({
    queryKey: ['search', query],
    queryFn: () =>
      apiFetch<{
        users: PublicUser[];
        posts: FeedPost[];
        hashtags: Array<{ tag: string; postCount: number }>;
      }>(`/search?q=${encodeURIComponent(query)}`),
    enabled: query.trim().length >= 2,
  });
}

export function useAiBatch(token?: string) {
  return useMutation({
    mutationFn: (prompt: string) =>
      apiFetch<{
        caption: { text: string };
        title: { text: string };
        description: { text: string };
        hashtags: { text: string; hashtags?: string[] };
      }>('/ai/generate/batch', {
        method: 'POST',
        token,
        body: JSON.stringify({ prompt, provider: 'mock', tone: 'clear and premium' }),
      }),
  });
}

export function useInitiateUpload(token?: string) {
  return useMutation({
    mutationFn: (body: { filename: string; mimeType: string; byteSize: number; durationSeconds: number; width: number; height: number }) =>
      apiFetch<{
        videoId: string;
        uploadUrl: string;
        publicPlaybackUrl: string;
        headers: Record<string, string>;
        expiresIn: number;
      }>('/videos/uploads/initiate', {
        method: 'POST',
        token,
        body: JSON.stringify(body),
      }),
  });
}

export function useCompleteUpload(token?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: {
      videoId: string;
      title: string;
      caption: string;
      description: string;
      hashtags: string[];
      visibility: 'public' | 'followers' | 'private';
      publish: boolean;
    }) =>
      apiFetch<{
        post: FeedPost;
        processing: {
          id: string;
          status: string;
          output: {
            thumbnailKey: string;
            hlsManifestKey: string;
          };
        };
      }>(`/videos/${body.videoId}/complete`, {
        method: 'POST',
        token,
        body: JSON.stringify({
          title: body.title,
          caption: body.caption,
          description: body.description,
          hashtags: body.hashtags,
          visibility: body.visibility,
          publish: body.publish,
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['creator-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['search'] });
    },
  });
}

export function useAdminDashboard(token?: string) {
  return useQuery<AdminDashboard>({
    queryKey: ['admin-dashboard'],
    queryFn: () => apiFetch<AdminDashboard>('/admin/dashboard', { token }),
    enabled: Boolean(token),
  });
}
