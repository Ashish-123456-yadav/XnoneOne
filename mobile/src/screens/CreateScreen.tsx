import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { AlertCircle, Captions, CheckCircle2, FileVideo, Hash, Image, Radio, Sparkles, Type, Upload, Video } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useAiBatch, useCompleteUpload, useInitiateUpload } from '../api/hooks';
import { XnovaMediaScene } from '../components/XnovaArt';
import { selectSession, useAppSelector } from '../store';

type CreateType = {
  label: string;
  body: string;
  icon: LucideIcon;
  color: string;
};

type AiAction = {
  title: string;
  body: string;
  icon: LucideIcon;
  color: string;
};

type UploadTicket = {
  videoId: string;
  uploadUrl: string;
  publicPlaybackUrl: string;
  headers: Record<string, string>;
  expiresIn: number;
};

type AiBatchOutput = {
  caption: { text: string };
  title: { text: string };
  description: { text: string };
  hashtags: { text: string; hashtags?: string[] };
};

const createTypes: CreateType[] = [
  { label: 'Post', body: 'Photo or video', icon: Image, color: '#6c5ce7' },
  { label: 'Reel', body: 'Short video', icon: Video, color: '#ff9500' },
  { label: 'Story', body: 'Share a moment', icon: Captions, color: '#c026d3' },
  { label: 'Live', body: 'Go live now', icon: Radio, color: '#ef4444' },
];

const aiActions: AiAction[] = [
  { title: 'Generate Caption', body: 'Write caption with AI', icon: Sparkles, color: '#7c3aed' },
  { title: 'Generate Hashtags', body: 'Find trending hashtags', icon: Hash, color: '#c026d3' },
  { title: 'Generate Title', body: 'Create catchy title', icon: Type, color: '#0ea5e9' },
  { title: 'Generate Description', body: 'Write description', icon: FileVideo, color: '#16a34a' },
];

function cleanTags(output?: AiBatchOutput): string[] {
  const fromArray = output?.hashtags.hashtags ?? [];
  const fromText = output?.hashtags.text.match(/#[\w-]+/g)?.map((tag) => tag.replace(/^#/, '')) ?? [];
  const tags = [...fromArray, ...fromText, 'xnova', 'aicreator', 'shorts']
    .map((tag) => tag.replace(/^#/, '').trim().toLowerCase())
    .filter(Boolean);

  return [...new Set(tags)].slice(0, 8);
}

export function CreateScreen() {
  const session = useAppSelector(selectSession);
  const ai = useAiBatch(session?.tokens.accessToken);
  const upload = useInitiateUpload(session?.tokens.accessToken);
  const completeUpload = useCompleteUpload(session?.tokens.accessToken);
  const [idea, setIdea] = useState('Exploring nature and finding peace in the mountains.');
  const [selectedType, setSelectedType] = useState('Reel');
  const [uploadTicket, setUploadTicket] = useState<UploadTicket | null>(null);
  const [publishedTitle, setPublishedTitle] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const resolveContent = (output?: AiBatchOutput) => {
    const trimmedIdea = idea.trim();
    const fallbackTitle = trimmedIdea.length >= 3 ? trimmedIdea.replace(/\s+/g, ' ').slice(0, 90) : 'AI creator post';

    return {
      title: (output?.title.text.trim() || fallbackTitle).slice(0, 120),
      caption: (output?.caption.text.trim() || trimmedIdea || 'A fresh Xnova creator drop.').slice(0, 500),
      description: (output?.description.text.trim() || trimmedIdea || 'Created with the Xnova AI studio.').slice(0, 1500),
      hashtags: cleanTags(output),
    };
  };

  const handleGenerate = () => {
    setLocalError(null);
    setStatusMessage(null);
    setPublishedTitle(null);
    ai.mutate(idea);
  };

  const prepareUpload = async () => {
    if (uploadTicket) {
      return uploadTicket;
    }

    const ticket = await upload.mutateAsync({
      filename: `${selectedType.toLowerCase()}-xnova-short.mp4`,
      mimeType: 'video/mp4',
      byteSize: 18_400_000,
      durationSeconds: selectedType === 'Story' ? 15 : 34,
      width: 1080,
      height: 1920,
    });

    setUploadTicket(ticket);
    setStatusMessage('Video prepared. You can publish now.');
    return ticket;
  };

  const handlePublish = async () => {
    if (!session?.tokens.accessToken) {
      setLocalError('Please sign in again before publishing.');
      return;
    }

    if (idea.trim().length < 3) {
      setLocalError('Write at least a short idea before publishing.');
      return;
    }

    setLocalError(null);
    setStatusMessage('Preparing post...');

    try {
      const metadata = ai.data ?? (await ai.mutateAsync(idea));
      const ticket = await prepareUpload();
      const content = resolveContent(metadata);
      const response = await completeUpload.mutateAsync({
        videoId: ticket.videoId,
        ...content,
        visibility: 'public',
        publish: true,
      });

      setPublishedTitle(response.post.title);
      setStatusMessage('Published. Home feed has been refreshed.');
      setUploadTicket(null);
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : 'Post publish failed.');
      setStatusMessage(null);
    }
  };

  const isBusy = ai.isPending || upload.isPending || completeUpload.isPending;
  const preview = resolveContent(ai.data);

  return (
    <ScrollView className="flex-1 bg-[#080b0f]" contentContainerStyle={{ padding: 16, paddingBottom: 34 }}>
      <View className="mb-5 flex-row items-center justify-between">
        <Pressable className="h-10 w-10 items-center justify-center rounded-full bg-[#11151c]">
          <Text className="text-xl font-black text-white">‹</Text>
        </Pressable>
        <Text className="text-lg font-black text-white">Create</Text>
        <Pressable className="h-10 w-10 items-center justify-center rounded-full bg-[#11151c]">
          <Sparkles size={18} color="#fff" />
        </Pressable>
      </View>

      <View className="mb-5 flex-row flex-wrap gap-3">
        {createTypes.map((item) => {
          const Icon = item.icon;
          const isSelected = selectedType === item.label;
          return (
            <Pressable
              key={item.label}
              className={`min-h-32 flex-1 basis-[45%] rounded-[22px] p-4 ${isSelected ? 'border-2 border-white' : ''}`}
              style={{ backgroundColor: item.color }}
              onPress={() => {
                setSelectedType(item.label);
                setUploadTicket(null);
                setStatusMessage(`${item.label} selected.`);
              }}
            >
              <Icon size={24} color="#fff" />
              <Text className="mt-4 text-lg font-black text-white">{item.label}</Text>
              <Text className="mt-1 text-xs font-bold text-white/80">{item.body}</Text>
            </Pressable>
          );
        })}
      </View>

      <View className="mb-5 rounded-[24px] bg-[#11151c] p-4">
        <Text className="mb-3 text-lg font-black text-white">New Post</Text>
        <XnovaMediaScene variant={1} height={256} />
        <TextInput
          multiline
          className="mt-4 min-h-24 rounded-2xl bg-[#080b0f] px-4 py-3 text-base font-bold text-white"
          placeholder="Describe your post"
          placeholderTextColor="#64748b"
          value={idea}
          onChangeText={setIdea}
        />
        <Pressable
          className={`mt-4 flex-row items-center justify-center gap-2 rounded-2xl py-4 ${uploadTicket ? 'bg-[#16a34a]' : 'bg-[#6c5ce7]'}`}
          disabled={isBusy}
          onPress={() => {
            setLocalError(null);
            prepareUpload().catch((error) => setLocalError(error instanceof Error ? error.message : 'Upload prepare failed.'));
          }}
        >
          {upload.isPending ? <ActivityIndicator color="#fff" /> : uploadTicket ? <CheckCircle2 size={18} color="#fff" /> : <Upload size={18} color="#fff" />}
          <Text className="font-black text-white">{uploadTicket ? 'Video Ready' : 'Prepare Video'}</Text>
        </Pressable>
      </View>

      <View className="rounded-[24px] bg-[#11151c] p-4">
        <Text className="mb-4 text-lg font-black text-white">AI Assistant</Text>
        {aiActions.map(({ title, body, icon: Icon, color }) => (
          <Pressable key={title} className="mb-3 flex-row items-center gap-3 rounded-2xl p-4" style={{ backgroundColor: color }} disabled={isBusy} onPress={handleGenerate}>
            <Icon size={21} color="#fff" />
            <View className="flex-1">
              <Text className="font-black text-white">{title}</Text>
              <Text className="mt-1 text-xs font-bold text-white/80">{body}</Text>
            </View>
            {ai.isPending ? <ActivityIndicator color="#fff" /> : <Text className="text-xl font-black text-white">›</Text>}
          </Pressable>
        ))}
      </View>

      <View className="mt-5 rounded-[24px] bg-[#11151c] p-4">
        <Text className="text-lg font-black text-white">Post Preview</Text>
        <Text className="mt-3 text-xs font-black uppercase text-[#6c5ce7]">{selectedType} Preview</Text>
        <Text className="mt-2 text-xl font-black text-white">{preview.title}</Text>
        <Text className="mt-3 text-sm leading-5 text-slate-300">{preview.caption}</Text>
        <Text className="mt-3 text-sm font-black text-[#6c5ce7]">{preview.hashtags.map((tag) => `#${tag}`).join(' ')}</Text>

        {statusMessage ? (
          <View className="mt-4 flex-row items-center gap-2 rounded-2xl bg-[#0f2e24] p-3">
            <CheckCircle2 size={17} color="#22c55e" />
            <Text className="flex-1 text-sm font-bold text-[#bbf7d0]">{statusMessage}</Text>
          </View>
        ) : null}

        {localError || upload.error || ai.error || completeUpload.error ? (
          <View className="mt-4 flex-row items-center gap-2 rounded-2xl bg-[#321016] p-3">
            <AlertCircle size={17} color="#fb7185" />
            <Text className="flex-1 text-sm font-bold text-[#fecdd3]">{localError ?? upload.error?.message ?? ai.error?.message ?? completeUpload.error?.message}</Text>
          </View>
        ) : null}

        {publishedTitle ? (
          <View className="mt-4 rounded-2xl bg-[#151a24] p-4">
            <Text className="text-xs font-black uppercase text-slate-500">Last published</Text>
            <Text className="mt-1 font-black text-white">{publishedTitle}</Text>
          </View>
        ) : null}

        <View className="mt-4 flex-row gap-3">
          <Pressable className="flex-1 rounded-2xl border border-[#2b3345] py-4" disabled={isBusy} onPress={handleGenerate}>
            <Text className="text-center font-black text-white">{ai.data ? 'Regenerate' : 'Generate AI'}</Text>
          </Pressable>
          <Pressable className={`flex-1 rounded-2xl py-4 ${isBusy ? 'bg-[#3b327c]' : 'bg-[#6c5ce7]'}`} disabled={isBusy} onPress={handlePublish}>
            {isBusy ? <ActivityIndicator color="#fff" /> : <Text className="text-center font-black text-white">Publish</Text>}
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}
