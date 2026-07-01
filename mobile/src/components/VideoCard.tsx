import { useState } from 'react';
import type { FeedPost } from '@novasocial/shared';
import { Bookmark, Heart, MessageCircle, MoreHorizontal, Send } from 'lucide-react-native';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { useAddComment, useSharePost, useLikePost } from '../api/hooks';
import { XnovaAvatar, XnovaChip, XnovaMediaScene } from './XnovaArt';
import { selectSession, useAppSelector } from '../store';

export function VideoCard({ post, compact = false }: { post: FeedPost; compact?: boolean }) {
  const session = useAppSelector(selectSession);
  const likePost = useLikePost(session?.tokens.accessToken);
  const sharePost = useSharePost(session?.tokens.accessToken);
  const addComment = useAddComment(session?.tokens.accessToken);
  const [commentOpen, setCommentOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [bookmarked, setBookmarked] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [localMessage, setLocalMessage] = useState<string | null>(null);
  const [shareCount, setShareCount] = useState(post.shareCount);
  const variant = post.id.charCodeAt(0) % 4;

  const handleComment = async () => {
    const text = commentText.trim();
    if (!text) {
      setLocalMessage('Type a comment first.');
      return;
    }

    try {
      await addComment.mutateAsync({ postId: post.id, text });
      setCommentText('');
      setCommentOpen(false);
      setLocalMessage('Comment posted.');
    } catch (error) {
      setLocalMessage(error instanceof Error ? error.message : 'Comment failed.');
    }
  };

  const handleShare = async () => {
    try {
      const result = await sharePost.mutateAsync(post.id);
      setShareCount(result.shareCount);
      setLocalMessage('Share recorded.');
    } catch (error) {
      setLocalMessage(error instanceof Error ? error.message : 'Share failed.');
    }
  };

  return (
    <View className="overflow-hidden rounded-[28px] bg-[#11151c] p-4">
      <View className="mb-4 flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <XnovaAvatar label={post.creator.displayName} size={44} />
          <View>
            <Text className="font-black text-white">{post.creator.displayName}</Text>
            <Text className="mt-1 text-xs font-bold text-slate-500">@{post.creator.username}</Text>
          </View>
        </View>
        <Pressable className="h-10 w-10 items-center justify-center rounded-full bg-[#1a2030]" onPress={() => setMenuOpen((value) => !value)}>
          <MoreHorizontal size={22} color="#fff" />
        </Pressable>
      </View>

      {menuOpen ? (
        <View className="mb-4 flex-row gap-2 rounded-2xl bg-[#080b0f] p-2">
          <Pressable className="flex-1 rounded-xl bg-[#1a2030] py-3" onPress={() => setLocalMessage('Post saved to your action queue.')}>
            <Text className="text-center text-xs font-black text-white">Save Action</Text>
          </Pressable>
          <Pressable className="flex-1 rounded-xl bg-[#1a2030] py-3" onPress={() => setLocalMessage('Report flow is ready for moderation review.')}>
            <Text className="text-center text-xs font-black text-white">Report</Text>
          </Pressable>
        </View>
      ) : null}

      <View className="overflow-hidden rounded-[24px]">
        <XnovaMediaScene variant={variant} height={compact ? 210 : 292} />
        <View className="absolute left-3 top-3 rounded-full bg-black/45 px-3 py-2">
          <Text className="text-xs font-black uppercase text-white">{post.video.durationSeconds}s</Text>
        </View>
        <View className="absolute right-3 top-3 rounded-full bg-black/45 px-3 py-2">
          <Text className="text-xs font-black text-white">{post.viewCount.toLocaleString()} views</Text>
        </View>
      </View>

      <View className="mt-4 flex-row items-center justify-between">
        <View className="flex-row gap-3">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Like post"
            className="h-10 w-10 items-center justify-center rounded-full bg-white"
            onPress={() => likePost.mutate(post.id)}
          >
            <Heart size={18} color={post.isLikedByViewer ? '#ef4444' : '#111827'} fill={post.isLikedByViewer ? '#ef4444' : 'none'} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Comments"
            className={`h-10 w-10 items-center justify-center rounded-full ${commentOpen ? 'bg-[#6c5ce7]' : 'bg-white'}`}
            onPress={() => setCommentOpen((value) => !value)}
          >
            <MessageCircle size={18} color={commentOpen ? '#fff' : '#111827'} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Share post"
            className="h-10 w-10 items-center justify-center rounded-full bg-white"
            onPress={handleShare}
          >
            {sharePost.isPending ? <ActivityIndicator color="#111827" /> : <Send size={18} color="#111827" />}
          </Pressable>
        </View>
        <Pressable className="h-10 w-10 items-center justify-center rounded-full bg-[#1a2030]" onPress={() => setBookmarked((value) => !value)}>
          <Bookmark size={21} color={bookmarked ? '#6c5ce7' : '#fff'} fill={bookmarked ? '#6c5ce7' : 'none'} />
        </Pressable>
      </View>

      <Text className="mt-3 text-sm font-black text-white">{post.likeCount.toLocaleString()} likes</Text>
      <Text className="mt-1 text-xs font-bold text-slate-500">
        {post.commentCount.toLocaleString()} comments - {shareCount.toLocaleString()} shares
      </Text>
      <Text className="mt-2 text-lg font-black text-white">{post.title}</Text>
      <Text className="mt-1 text-sm leading-5 text-slate-300">{post.caption}</Text>
      <View className="mt-3 flex-row flex-wrap gap-2">
        {post.hashtags.slice(0, 4).map((tag) => (
          <XnovaChip key={tag} label={`#${tag}`} />
        ))}
      </View>

      {commentOpen ? (
        <View className="mt-4 rounded-2xl bg-[#080b0f] p-3">
          <TextInput
            className="min-h-12 rounded-xl bg-[#151a24] px-3 py-3 text-sm font-bold text-white"
            placeholder="Write a comment"
            placeholderTextColor="#64748b"
            value={commentText}
            onChangeText={setCommentText}
          />
          <Pressable className="mt-3 flex-row items-center justify-center gap-2 rounded-xl bg-[#6c5ce7] py-3" disabled={addComment.isPending} onPress={handleComment}>
            {addComment.isPending ? <ActivityIndicator color="#fff" /> : <Send size={16} color="#fff" />}
            <Text className="text-sm font-black text-white">Post Comment</Text>
          </Pressable>
        </View>
      ) : null}

      {localMessage ? <Text className="mt-3 rounded-2xl bg-[#080b0f] px-3 py-2 text-center text-xs font-bold text-slate-300">{localMessage}</Text> : null}
    </View>
  );
}
