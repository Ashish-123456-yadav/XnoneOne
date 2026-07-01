import { useState } from 'react';
import { RefreshControl, ScrollView, Text, View, Pressable } from 'react-native';
import { Bell, Flame, Search, Users } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useFeed } from '../api/hooks';
import { FeedSkeleton } from '../components/Skeleton';
import { VideoCard } from '../components/VideoCard';
import { EmptyState } from '../components/EmptyState';
import { XnovaAvatar, XnovaMiniLogo } from '../components/XnovaArt';
import { selectSession, useAppSelector } from '../store';
import type { FeedPost } from '@novasocial/shared';
import type { AppTabParamList } from '../navigation/AppTabs';

const creators = ['Ava', 'Brooklyn', 'Dane', 'Eleanor', 'Jules'];

export function HomeScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<AppTabParamList>>();
  const session = useAppSelector(selectSession);
  const [filter, setFilter] = useState<'home' | 'following'>('home');
  const feed = useFeed(session?.tokens.accessToken, filter);
  const posts: FeedPost[] = feed.data?.items ?? [];

  return (
    <ScrollView
      className="flex-1 bg-[#080b0f]"
      contentContainerStyle={{ padding: 16, paddingBottom: 34 }}
      refreshControl={<RefreshControl tintColor="#6c5ce7" refreshing={feed.isRefetching} onRefresh={() => feed.refetch()} />}
    >
      <View className="mb-5 flex-row items-center justify-between">
        <View>
          <XnovaMiniLogo />
          <Text className="mt-1 text-xs font-bold uppercase text-slate-500">AI Social Platform</Text>
        </View>
        <View className="flex-row gap-3">
          <Pressable className="h-10 w-10 items-center justify-center rounded-full bg-[#11151c]" onPress={() => navigation.navigate('Search')}>
            <Search size={18} color="#fff" />
          </Pressable>
          <Pressable className="h-10 w-10 items-center justify-center rounded-full bg-[#11151c]" onPress={() => navigation.navigate('Inbox')}>
            <Bell size={18} color="#fff" />
          </Pressable>
        </View>
      </View>

      <View className="mb-5 flex-row rounded-2xl bg-[#11151c] p-1">
        <Pressable className={`flex-1 flex-row items-center justify-center gap-2 rounded-xl py-3 ${filter === 'home' ? 'bg-[#6c5ce7]' : ''}`} onPress={() => setFilter('home')}>
          <Flame size={16} color="#fff" />
          <Text className="text-sm font-black text-white">For You</Text>
        </Pressable>
        <Pressable
          className={`flex-1 flex-row items-center justify-center gap-2 rounded-xl py-3 ${filter === 'following' ? 'bg-[#6c5ce7]' : ''}`}
          onPress={() => setFilter('following')}
        >
          <Users size={16} color="#fff" />
          <Text className="text-sm font-black text-white">Following</Text>
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-5">
        <View className="flex-row gap-3">
          {creators.map((name, index) => (
            <View key={name} className="items-center">
              <XnovaAvatar label={name} size={64} />
              <Text className="mt-2 text-xs font-bold text-slate-300">{index === 0 ? 'Your story' : name}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {feed.isLoading ? <FeedSkeleton /> : null}
      {feed.error ? <EmptyState title="Feed unavailable" body={feed.error.message} /> : null}
      {posts.length === 0 ? <EmptyState title="No videos yet" body="Follow creators or publish your first AI-assisted short." /> : null}

      <View className="gap-5">
        {posts.map((post) => (
          <VideoCard key={post.id} post={post} />
        ))}
      </View>
    </ScrollView>
  );
}
