import { useState } from 'react';
import { Hash, Search, X } from 'lucide-react-native';
import { ActivityIndicator, ScrollView, Text, TextInput, View, Pressable } from 'react-native';
import { useFollowUser, useSearch } from '../api/hooks';
import { EmptyState } from '../components/EmptyState';
import { XnovaAvatar, XnovaMediaScene } from '../components/XnovaArt';
import type { FeedPost, PublicUser } from '@novasocial/shared';
import { selectSession, useAppSelector } from '../store';

type HashtagResult = { tag: string; postCount: number };
type SearchTab = 'Top' | 'Users' | 'Videos' | 'Hashtags';

const trendingFallback: HashtagResult[] = [
  { tag: 'sunset', postCount: 2400 },
  { tag: 'travel', postCount: 1300 },
  { tag: 'aiart', postCount: 950000 },
  { tag: 'fitness', postCount: 850000 },
  { tag: 'music', postCount: 760000 },
];

const creatorFallback: Array<Pick<PublicUser, 'id' | 'displayName' | 'username'>> = [
  { id: '00000000-0000-4000-8000-000000000002', displayName: 'Mina Lee', username: 'minamakes' },
  { id: '00000000-0000-4000-8000-000000000001', displayName: 'Ava Chen', username: 'ava_ai' },
  { id: '00000000-0000-4000-8000-000000000003', displayName: 'Nova Admin', username: 'nova_admin' },
];

const fallbackVideos = [
  { id: 'video-1', views: '10.4K' },
  { id: 'video-2', views: '8.7K' },
  { id: 'video-3', views: '6.8K' },
  { id: 'video-4', views: '6.0K' },
  { id: 'video-5', views: '5.2K' },
  { id: 'video-6', views: '3.8K' },
];

export function SearchScreen() {
  const session = useAppSelector(selectSession);
  const [query, setQuery] = useState('Sunset');
  const [activeTab, setActiveTab] = useState<SearchTab>('Top');
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState<string | null>(null);
  const search = useSearch(query);
  const followUser = useFollowUser(session?.tokens.accessToken);
  const hashtags: HashtagResult[] = search.data?.hashtags.length ? search.data.hashtags : trendingFallback;
  const posts: FeedPost[] = search.data?.posts ?? [];
  const users: Array<Pick<PublicUser, 'id' | 'displayName' | 'username'>> = search.data?.users.length ? search.data.users : creatorFallback;
  const videoTiles = posts.length ? posts.map((post) => ({ id: post.id, views: post.viewCount.toLocaleString() })) : fallbackVideos;

  const handleFollow = async (username: string) => {
    if (following.has(username)) {
      return;
    }

    try {
      await followUser.mutateAsync(username);
      setFollowing((current) => new Set(current).add(username));
      setMessage(`Following @${username}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Follow failed.');
    }
  };

  return (
    <ScrollView className="flex-1 bg-[#080b0f]" contentContainerStyle={{ padding: 16, paddingBottom: 34 }}>
      <View className="mb-4 flex-row items-center gap-3 rounded-2xl bg-[#11151c] px-4 py-3">
        <Search size={18} color="#8b93a8" />
        <TextInput
          className="flex-1 text-base font-bold text-white"
          placeholder="Search Xnova"
          placeholderTextColor="#8b93a8"
          value={query}
          onChangeText={setQuery}
        />
        <Pressable onPress={() => setQuery('')}>
          <X size={18} color="#8b93a8" />
        </Pressable>
      </View>

      {query.trim().length < 2 ? <EmptyState title="Type to search" body="Find creators, videos, sounds, and hashtags." /> : null}
      {search.error ? <EmptyState title="Search failed" body={search.error.message} /> : null}

      <View className="mb-5 flex-row gap-2">
        {(['Top', 'Users', 'Videos', 'Hashtags'] as SearchTab[]).map((tab) => (
          <Pressable key={tab} className={`rounded-full px-4 py-2 ${activeTab === tab ? 'bg-[#6c5ce7]' : 'bg-[#11151c]'}`} onPress={() => setActiveTab(tab)}>
            <Text className={`text-xs font-black ${activeTab === tab ? 'text-white' : 'text-slate-400'}`}>
              {tab}
            </Text>
          </Pressable>
        ))}
      </View>

      {message ? <Text className="mb-4 rounded-2xl bg-[#11151c] px-4 py-3 text-center text-xs font-bold text-slate-300">{message}</Text> : null}

      {activeTab === 'Top' || activeTab === 'Hashtags' ? (
        <View className="mb-6 rounded-[22px] bg-[#11151c] p-4">
          <Text className="mb-3 text-lg font-black text-white">Trending Searches</Text>
          <View className="gap-3">
            {hashtags.slice(0, 5).map((item) => (
              <View key={item.tag} className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-3">
                  <View className="h-8 w-8 items-center justify-center rounded-full bg-[#202636]">
                    <Hash size={14} color="#fff" />
                  </View>
                  <Text className="font-black text-white">#{item.tag}</Text>
                </View>
                <Text className="text-xs font-bold text-slate-500">{Number(item.postCount).toLocaleString()} posts</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {activeTab === 'Top' || activeTab === 'Users' ? (
        <View className="mb-6 rounded-[22px] bg-[#11151c] p-4">
          <Text className="mb-3 text-lg font-black text-white">Popular Creators</Text>
          <View className="gap-3">
            {users.slice(0, 4).map((user) => (
              <View key={user.id} className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-3">
                  <XnovaAvatar label={user.displayName} size={44} />
                  <View>
                    <Text className="font-black text-white">{user.displayName}</Text>
                    <Text className="text-xs font-bold text-slate-500">@{user.username}</Text>
                  </View>
                </View>
                <Pressable
                  className={`min-w-24 rounded-full px-4 py-2 ${following.has(user.username) ? 'bg-[#1f2937]' : 'bg-[#6c5ce7]'}`}
                  disabled={followUser.isPending || following.has(user.username)}
                  onPress={() => handleFollow(user.username)}
                >
                  {followUser.isPending ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text className="text-center text-xs font-black text-white">{following.has(user.username) ? 'Following' : 'Follow'}</Text>
                  )}
                </Pressable>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {activeTab === 'Top' || activeTab === 'Videos' ? (
        <>
          <Text className="mb-3 text-lg font-black text-white">Top Videos</Text>
          <View className="flex-row flex-wrap gap-3">
            {videoTiles.slice(0, 6).map((post, index) => (
              <View key={post.id} className="h-44 flex-1 basis-[30%] overflow-hidden rounded-2xl bg-[#151a24]">
                <XnovaMediaScene variant={index} height={176} showPlay={false} />
                <View className="absolute bottom-2 left-2 rounded-full bg-black/45 px-2 py-1">
                  <Text className="text-[10px] font-black text-white">{post.views}</Text>
                </View>
              </View>
            ))}
            </View>
        </>
      ) : null}
    </ScrollView>
  );
}
