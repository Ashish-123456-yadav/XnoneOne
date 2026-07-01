import { useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TextInput, View, Pressable } from 'react-native';
import { Heart, MessageCircle, Music2, Play, Send } from 'lucide-react-native';
import { useAddComment, useFeed, useLikePost, useSharePost } from '../api/hooks';
import { EmptyState } from '../components/EmptyState';
import { FeedSkeleton } from '../components/Skeleton';
import { XnovaAvatar, XnovaMediaScene } from '../components/XnovaArt';
import { selectSession, useAppSelector } from '../store';
import type { FeedPost } from '@novasocial/shared';

export function ReelsScreen() {
  const session = useAppSelector(selectSession);
  const [filter, setFilter] = useState<'home' | 'following'>('home');
  const [activeCommentPost, setActiveCommentPost] = useState<string | null>(null);
  const [commentDraft, setCommentDraft] = useState('');
  const [shareCounts, setShareCounts] = useState<Record<string, number>>({});
  const [message, setMessage] = useState<string | null>(null);
  const feed = useFeed(session?.tokens.accessToken, filter);
  const likePost = useLikePost(session?.tokens.accessToken);
  const sharePost = useSharePost(session?.tokens.accessToken);
  const addComment = useAddComment(session?.tokens.accessToken);
  const posts: FeedPost[] = feed.data?.items ?? [];

  const handleShare = async (postId: string) => {
    try {
      const result = await sharePost.mutateAsync(postId);
      setShareCounts((current) => ({ ...current, [postId]: result.shareCount }));
      setMessage('Share recorded.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Share failed.');
    }
  };

  const handleComment = async (postId: string) => {
    const text = commentDraft.trim();
    if (!text) {
      setMessage('Type a comment first.');
      return;
    }

    try {
      await addComment.mutateAsync({ postId, text });
      setCommentDraft('');
      setActiveCommentPost(null);
      setMessage('Comment posted.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Comment failed.');
    }
  };

  return (
    <ScrollView className="flex-1 bg-black" contentContainerStyle={{ padding: 14, paddingBottom: 26 }}>
      <View className="mb-4 flex-row items-center justify-between">
        <Text className="text-2xl font-black text-white">Reels</Text>
        <View className="flex-row rounded-full bg-[#11151c] p-1">
          <Pressable className={`rounded-full px-4 py-2 ${filter === 'following' ? 'bg-[#6c5ce7]' : ''}`} onPress={() => setFilter('following')}>
            <Text className={`text-xs font-black ${filter === 'following' ? 'text-white' : 'text-slate-400'}`}>Following</Text>
          </Pressable>
          <Pressable className={`rounded-full px-4 py-2 ${filter === 'home' ? 'bg-[#6c5ce7]' : ''}`} onPress={() => setFilter('home')}>
            <Text className={`text-xs font-black ${filter === 'home' ? 'text-white' : 'text-slate-400'}`}>For You</Text>
          </Pressable>
        </View>
      </View>

      {message ? <Text className="mb-4 rounded-2xl bg-[#11151c] px-4 py-3 text-center text-xs font-bold text-slate-300">{message}</Text> : null}
      {feed.isLoading ? <FeedSkeleton /> : null}
      {posts.length === 0 ? <EmptyState title="No reels" body="Published videos will appear here." /> : null}

      <View className="gap-4">
        {posts.map((post, index) => {
          return (
            <View key={post.id} className="h-[680px] overflow-hidden rounded-[28px] bg-[#111827]">
              <View className="absolute inset-0">
                <XnovaMediaScene variant={index} height={680} showPlay={false} />
              </View>

              <View className="flex-1 justify-between p-4">
                <View className="flex-row items-center justify-between">
                  <Text className="rounded-full bg-black/35 px-3 py-2 text-xs font-black text-white">9:31</Text>
                  <Text className="rounded-full bg-black/35 px-3 py-2 text-xs font-black text-white">For You</Text>
                </View>

                <View className="items-center">
                  <View className="h-16 w-16 items-center justify-center rounded-full bg-white/20">
                    <Play size={30} color="#fff" />
                  </View>
                </View>

                <View className="flex-row items-end justify-between">
                  <View className="max-w-[75%]">
                    <Text className="text-sm font-black text-white">@{post.creator.username}</Text>
                    <Text className="mt-2 text-xl font-black text-white">{post.title}</Text>
                    <Text className="mt-2 text-sm leading-5 text-slate-200">{post.caption}</Text>
                    <View className="mt-3 flex-row items-center gap-2">
                      <Music2 size={15} color="#fff" />
                      <Text className="text-xs font-bold text-white">Original Sound</Text>
                    </View>
                  </View>

                  <View className="items-center gap-4">
                    <XnovaAvatar label={post.creator.displayName} size={50} />
                    <Pressable className="items-center" onPress={() => likePost.mutate(post.id)}>
                      <Heart size={27} color={post.isLikedByViewer ? '#ef4444' : '#fff'} fill={post.isLikedByViewer ? '#ef4444' : 'none'} />
                      <Text className="mt-1 text-xs font-black text-white">{post.likeCount.toLocaleString()}</Text>
                    </Pressable>
                    <Pressable className="items-center" onPress={() => setActiveCommentPost((current) => (current === post.id ? null : post.id))}>
                      <MessageCircle size={27} color="#fff" />
                      <Text className="mt-1 text-xs font-black text-white">{post.commentCount.toLocaleString()}</Text>
                    </Pressable>
                    <Pressable className="items-center" onPress={() => handleShare(post.id)}>
                      {sharePost.isPending ? <ActivityIndicator color="#fff" /> : <Send size={26} color="#fff" />}
                      <Text className="mt-1 text-xs font-black text-white">{(shareCounts[post.id] ?? post.shareCount).toLocaleString()}</Text>
                    </Pressable>
                  </View>
                </View>

                {activeCommentPost === post.id ? (
                  <View className="rounded-2xl bg-black/55 p-3">
                    <TextInput
                      className="rounded-xl bg-white/10 px-3 py-3 text-sm font-bold text-white"
                      placeholder="Write a comment"
                      placeholderTextColor="#cbd5e1"
                      value={commentDraft}
                      onChangeText={setCommentDraft}
                    />
                    <Pressable className="mt-2 rounded-xl bg-[#6c5ce7] py-3" disabled={addComment.isPending} onPress={() => handleComment(post.id)}>
                      <Text className="text-center text-sm font-black text-white">{addComment.isPending ? 'Posting...' : 'Post Comment'}</Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}
