export interface RequestUser {
  id: string;
  email: string;
  username: string;
  role: 'user' | 'creator' | 'moderator' | 'admin';
}

export interface HttpRequestWithUser {
  headers: Record<string, string | string[] | undefined>;
  user?: RequestUser;
  requestId?: string;
  ip?: string;
  method?: string;
  originalUrl?: string;
  url?: string;
  socket?: { remoteAddress?: string };
}
