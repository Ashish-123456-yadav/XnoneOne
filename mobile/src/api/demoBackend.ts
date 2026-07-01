import type { AdminDashboard, AuthSession, Comment, FeedPost, NotificationItem, PaginatedResponse, PublicUser } from '@novasocial/shared';

type RequestOptions = RequestInit & {
  token?: string;
};

type DemoUser = PublicUser & {
  email: string;
  password: string;
  bio: string;
  creatorCategory: string | null;
  monetizationEnabled: boolean;
};

type UploadTicket = {
  videoId: string;
  uploadUrl: string;
  publicPlaybackUrl: string;
  headers: Record<string, string>;
  expiresIn: number;
};

type DemoState = {
  users: DemoUser[];
  posts: FeedPost[];
  comments: Comment[];
  notifications: NotificationItem[];
  following: Record<string, string[]>;
  likedPosts: Record<string, string[]>;
  uploads: Record<string, UploadTicket>;
};

const STORAGE_KEY = 'xnova.demo.backend.v1';
const DEFAULT_PASSWORD = 'NovaPass123!';

function makeId(prefix = 'demo') {
  const randomId =
    typeof globalThis.crypto?.randomUUID === 'function'
      ? globalThis.crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

  return `${prefix}-${randomId}`;
}

function storage() {
  const candidate = (globalThis as { localStorage?: { getItem: (key: string) => string | null; setItem: (key: string, value: string) => void } }).localStorage;
  return candidate ?? null;
}

function publicUser(user: DemoUser): PublicUser {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    role: user.role,
    isVerified: user.isVerified,
    followerCount: user.followerCount,
    followingCount: user.followingCount,
    postCount: user.postCount,
  };
}

function paginate<T>(items: T[]): PaginatedResponse<T> {
  return {
    items,
    pageInfo: {
      limit: items.length,
      nextCursor: null,
      hasNextPage: false,
    },
  };
}

function createVideo(postId: string, durationSeconds: number) {
  return {
    id: makeId('video'),
    postId,
    playbackUrl: 'https://cdn.novasocial.ai/demo/video.mp4',
    thumbnailUrl: null,
    durationSeconds,
    width: 1080,
    height: 1920,
    status: 'ready' as const,
    hlsManifestUrl: 'https://cdn.novasocial.ai/demo/master.m3u8',
  };
}

function seedPost(creator: DemoUser, title: string, caption: string, description: string, hashtags: string[], stats: [number, number, number, number]) {
  const id = makeId('post');

  return {
    id,
    creator: publicUser(creator),
    title,
    caption,
    description,
    hashtags,
    visibility: 'public' as const,
    status: 'published' as const,
    video: createVideo(id, title.includes('45') ? 45 : 52),
    likeCount: stats[0],
    commentCount: stats[1],
    shareCount: stats[2],
    viewCount: stats[3],
    isLikedByViewer: false,
    createdAt: new Date().toISOString(),
  };
}

function seedState(): DemoState {
  const ava: DemoUser = {
    id: '00000000-0000-4000-8000-000000000001',
    email: 'ava@novasocial.ai',
    password: DEFAULT_PASSWORD,
    username: 'ava_ai',
    displayName: 'Ava Chen',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
    role: 'creator',
    isVerified: true,
    followerCount: 12840,
    followingCount: 231,
    postCount: 2,
    bio: 'Practical AI creator workflows for busy teams.',
    creatorCategory: 'Education',
    monetizationEnabled: true,
  };
  const mina: DemoUser = {
    id: '00000000-0000-4000-8000-000000000002',
    email: 'mina@novasocial.ai',
    password: DEFAULT_PASSWORD,
    username: 'minamakes',
    displayName: 'Mina Lee',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
    role: 'creator',
    isVerified: true,
    followerCount: 23810,
    followingCount: 420,
    postCount: 2,
    bio: 'Short-form storytelling, launch films, and editing notes.',
    creatorCategory: 'Film',
    monetizationEnabled: true,
  };
  const admin: DemoUser = {
    id: '00000000-0000-4000-8000-000000000003',
    email: 'admin@novasocial.ai',
    password: DEFAULT_PASSWORD,
    username: 'nova_admin',
    displayName: 'Nova Admin',
    avatarUrl: null,
    role: 'admin',
    isVerified: true,
    followerCount: 0,
    followingCount: 0,
    postCount: 0,
    bio: 'Platform operations.',
    creatorCategory: 'Operations',
    monetizationEnabled: false,
  };

  const postOne = seedPost(
    ava,
    'AI caption workflow in 45 seconds',
    'Turn a raw clip into a polished post with one prompt.',
    'A compact editing flow for captions, title testing, and hashtag strategy.',
    ['AIWorkflow', 'CreatorTools', 'ShortForm'],
    [8230, 412, 781, 98200],
  );
  const postTwo = seedPost(
    mina,
    'Launch trailer pacing map',
    'Three cuts that make product videos feel alive.',
    'Breaking down a launch teaser from hook to CTA.',
    ['LaunchVideo', 'Editing', 'CreatorStudio'],
    [5102, 188, 454, 67200],
  );

  return {
    users: [ava, mina, admin],
    posts: [postOne, postTwo],
    comments: [
      {
        id: makeId('comment'),
        postId: postOne.id,
        author: publicUser(mina),
        body: 'The hook testing tip is gold.',
        createdAt: new Date().toISOString(),
      },
    ],
    notifications: [
      {
        id: makeId('notification'),
        type: 'like',
        title: 'Ava liked your post',
        body: 'Your AI studio post is gaining traction.',
        readAt: null,
        actor: publicUser(ava),
        entityId: postTwo.id,
        createdAt: new Date().toISOString(),
      },
      {
        id: makeId('notification'),
        type: 'system',
        title: 'Demo API enabled',
        body: 'This GitHub Pages build is running with browser local storage.',
        readAt: null,
        actor: null,
        entityId: null,
        createdAt: new Date().toISOString(),
      },
    ],
    following: {
      [ava.id]: [mina.id],
    },
    likedPosts: {},
    uploads: {},
  };
}

function loadState(): DemoState {
  const saved = storage()?.getItem(STORAGE_KEY);
  if (!saved) {
    return seedState();
  }

  try {
    return JSON.parse(saved) as DemoState;
  } catch {
    return seedState();
  }
}

function saveState(state: DemoState) {
  storage()?.setItem(STORAGE_KEY, JSON.stringify(state));
}

function readBody<T>(options: RequestOptions): T {
  if (!options.body) {
    return {} as T;
  }

  if (typeof options.body === 'string') {
    return JSON.parse(options.body) as T;
  }

  return options.body as T;
}

function currentUser(state: DemoState, token?: string) {
  const userId = token?.replace(/^demo-access-/, '');
  return state.users.find((user) => user.id === userId) ?? state.users[0];
}

function makeSession(user: DemoUser): AuthSession {
  return {
    user: publicUser(user),
    tokens: {
      accessToken: `demo-access-${user.id}`,
      refreshToken: `demo-refresh-${user.id}`,
      expiresIn: 60 * 60 * 24,
    },
  };
}

function searchable(value: string, query: string) {
  return value.toLowerCase().includes(query.toLowerCase());
}

function authRequired(options: RequestOptions) {
  if (!options.token) {
    throw new Error('Please sign in first.');
  }
}

export function isDemoApiUrl(url: string) {
  return ['demo', 'demo://local', 'mock://local'].includes(url);
}

export async function demoFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const state = loadState();
  const user = currentUser(state, options.token);
  const method = (options.method ?? 'GET').toUpperCase();
  const [pathname, rawQuery] = path.split('?');

  if (pathname === '/auth/login' && method === 'POST') {
    const body = readBody<{ email: string; password: string }>(options);
    const found = state.users.find((item) => item.email.toLowerCase() === body.email.toLowerCase());
    if (!found || found.password !== body.password) {
      throw new Error('Invalid email or password');
    }
    return makeSession(found) as T;
  }

  if (pathname === '/auth/register' && method === 'POST') {
    const body = readBody<{ email: string; password: string; username: string; displayName: string }>(options);
    if (state.users.some((item) => item.email.toLowerCase() === body.email.toLowerCase())) {
      throw new Error('Email is already registered');
    }

    const created: DemoUser = {
      id: makeId('user'),
      email: body.email,
      password: body.password,
      username: body.username.replace(/^@/, '').toLowerCase(),
      displayName: body.displayName,
      avatarUrl: null,
      role: 'creator',
      isVerified: false,
      followerCount: 0,
      followingCount: 0,
      postCount: 0,
      bio: 'New Xnova creator.',
      creatorCategory: 'AI Creator',
      monetizationEnabled: false,
    };
    state.users.unshift(created);
    saveState(state);
    return makeSession(created) as T;
  }

  if ((pathname === '/feed' || pathname === '/feed/following') && method === 'GET') {
    const followingIds = state.following[user.id] ?? [];
    const posts = pathname === '/feed/following' ? state.posts.filter((post) => followingIds.includes(post.creator.id)) : state.posts;
    const liked = state.likedPosts[user.id] ?? [];
    return paginate(posts.map((post) => ({ ...post, isLikedByViewer: liked.includes(post.id) }))) as T;
  }

  const likeMatch = pathname.match(/^\/posts\/([^/]+)\/like$/);
  if (likeMatch && method === 'POST') {
    authRequired(options);
    const post = state.posts.find((item) => item.id === likeMatch[1]);
    if (!post) {
      throw new Error('Post not found');
    }
    const liked = new Set(state.likedPosts[user.id] ?? []);
    if (!liked.has(post.id)) {
      liked.add(post.id);
      post.likeCount += 1;
    }
    state.likedPosts[user.id] = [...liked];
    saveState(state);
    return { liked: true, likeCount: post.likeCount } as T;
  }

  const commentsMatch = pathname.match(/^\/posts\/([^/]+)\/comments$/);
  if (commentsMatch && method === 'GET') {
    return paginate(state.comments.filter((comment) => comment.postId === commentsMatch[1])) as T;
  }
  if (commentsMatch && method === 'POST') {
    authRequired(options);
    const body = readBody<{ body: string }>(options);
    const post = state.posts.find((item) => item.id === commentsMatch[1]);
    if (!post) {
      throw new Error('Post not found');
    }
    const comment: Comment = {
      id: makeId('comment'),
      postId: post.id,
      author: publicUser(user),
      body: body.body,
      createdAt: new Date().toISOString(),
    };
    state.comments.unshift(comment);
    post.commentCount += 1;
    saveState(state);
    return comment as T;
  }

  const shareMatch = pathname.match(/^\/posts\/([^/]+)\/share$/);
  if (shareMatch && method === 'POST') {
    const post = state.posts.find((item) => item.id === shareMatch[1]);
    if (!post) {
      throw new Error('Post not found');
    }
    post.shareCount += 1;
    saveState(state);
    return { shareCount: post.shareCount } as T;
  }

  const followMatch = pathname.match(/^\/users\/([^/]+)\/follow$/);
  if (followMatch && method === 'POST') {
    authRequired(options);
    const target = state.users.find((item) => item.username === decodeURIComponent(followMatch[1]));
    if (!target) {
      throw new Error('Creator not found');
    }
    const following = new Set(state.following[user.id] ?? []);
    following.add(target.id);
    state.following[user.id] = [...following];
    user.followingCount = following.size;
    target.followerCount += 1;
    saveState(state);
    return { following: true, user: publicUser(target) } as T;
  }

  if (pathname === '/users/me/profile' && method === 'GET') {
    authRequired(options);
    return {
      user: publicUser(user),
      bio: user.bio,
      creatorCategory: user.creatorCategory,
      monetizationEnabled: user.monetizationEnabled,
    } as T;
  }

  if (pathname === '/notifications' && method === 'GET') {
    authRequired(options);
    return paginate(state.notifications) as T;
  }

  const readNotificationMatch = pathname.match(/^\/notifications\/([^/]+)\/read$/);
  if (readNotificationMatch && method === 'PATCH') {
    authRequired(options);
    const notification = state.notifications.find((item) => item.id === readNotificationMatch[1]);
    if (!notification) {
      throw new Error('Notification not found');
    }
    notification.readAt = new Date().toISOString();
    saveState(state);
    return notification as T;
  }

  if (pathname === '/analytics/creator' && method === 'GET') {
    authRequired(options);
    const ownPosts = state.posts.filter((post) => post.creator.id === user.id);
    const profile = {
      followers: user.followerCount,
      views: ownPosts.reduce((sum, post) => sum + post.viewCount, 0),
      likes: ownPosts.reduce((sum, post) => sum + post.likeCount, 0),
      comments: ownPosts.reduce((sum, post) => sum + post.commentCount, 0),
      shares: ownPosts.reduce((sum, post) => sum + post.shareCount, 0),
      posts: ownPosts.length,
      engagementRate: 8.7,
      watchTimeHours: 320,
    };
    return {
      profile,
      trends: [
        { label: 'Mon', value: 20 },
        { label: 'Tue', value: 32 },
        { label: 'Wed', value: 48 },
        { label: 'Thu', value: 44 },
      ],
      aiTools: ['caption', 'title', 'hashtags', 'description'],
    } as T;
  }

  if (pathname === '/search' && method === 'GET') {
    const query = decodeURIComponent(new URLSearchParams(rawQuery ?? '').get('q') ?? '');
    const users = state.users.filter((item) => searchable(item.displayName, query) || searchable(item.username, query)).map(publicUser);
    const posts = state.posts.filter((post) => searchable(post.title, query) || searchable(post.caption, query) || post.hashtags.some((tag) => searchable(tag, query)));
    const hashtags = Array.from(new Set(state.posts.flatMap((post) => post.hashtags)))
      .filter((tag) => searchable(tag, query) || query.length < 3)
      .map((tag) => ({ tag, postCount: state.posts.filter((post) => post.hashtags.includes(tag)).length }));
    return { users, posts, hashtags } as T;
  }

  if (pathname === '/ai/generate/batch' && method === 'POST') {
    const body = readBody<{ prompt: string }>(options);
    const prompt = body.prompt?.trim() || 'AI creator post';
    const base = prompt.replace(/\s+/g, ' ');
    return {
      caption: { text: `${base} - refined for a sharp short-form hook.` },
      title: { text: base.length > 54 ? `${base.slice(0, 51)}...` : base },
      description: { text: `${base}. Built with Xnova AI studio for a polished creator-ready post.` },
      hashtags: { text: '#xnova #aicreator #shorts #creatorstudio', hashtags: ['xnova', 'aicreator', 'shorts', 'creatorstudio'] },
    } as T;
  }

  if (pathname === '/videos/uploads/initiate' && method === 'POST') {
    authRequired(options);
    const body = readBody<{ durationSeconds: number }>(options);
    const videoId = makeId('video');
    const ticket: UploadTicket = {
      videoId,
      uploadUrl: `mock://upload/${videoId}`,
      publicPlaybackUrl: `https://cdn.novasocial.ai/demo/${videoId}.mp4`,
      headers: { 'x-demo-upload': videoId },
      expiresIn: 900,
    };
    state.uploads[videoId] = ticket;
    saveState(state);
    return { ...ticket, durationSeconds: body.durationSeconds } as T;
  }

  const completeMatch = pathname.match(/^\/videos\/([^/]+)\/complete$/);
  if (completeMatch && method === 'POST') {
    authRequired(options);
    const body = readBody<{
      title: string;
      caption: string;
      description: string;
      hashtags: string[];
      visibility: 'public' | 'followers' | 'private';
      publish: boolean;
    }>(options);
    const postId = makeId('post');
    const post: FeedPost = {
      id: postId,
      creator: publicUser(user),
      title: body.title,
      caption: body.caption,
      description: body.description,
      hashtags: body.hashtags,
      visibility: body.visibility,
      status: body.publish ? 'published' : 'draft',
      video: createVideo(postId, 34),
      likeCount: 0,
      commentCount: 0,
      shareCount: 0,
      viewCount: 0,
      isLikedByViewer: false,
      createdAt: new Date().toISOString(),
    };
    state.posts.unshift(post);
    user.postCount += 1;
    saveState(state);
    return {
      post,
      processing: {
        id: makeId('job'),
        status: 'completed',
        output: {
          thumbnailKey: `demo/${postId}.jpg`,
          hlsManifestKey: `demo/${postId}/master.m3u8`,
        },
      },
    } as T;
  }

  if (pathname === '/admin/dashboard' && method === 'GET') {
    const dashboard: AdminDashboard = {
      users: state.users.length,
      creators: state.users.filter((item) => item.role === 'creator').length,
      posts: state.posts.length,
      reportsOpen: 1,
      uploadsProcessing: 0,
      revenueUsd: 12457,
      retention: [
        { label: 'Week 1', value: 72 },
        { label: 'Week 2', value: 66 },
        { label: 'Week 3', value: 64 },
      ],
    };
    return dashboard as T;
  }

  throw new Error(`Demo API does not implement ${method} ${pathname}`);
}
