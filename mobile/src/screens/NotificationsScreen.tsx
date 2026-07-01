import { useState } from 'react';
import { Bell, MessageCircle, Send } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { ActivityIndicator, ScrollView, Text, TextInput, View, Pressable } from 'react-native';
import { useMarkNotificationRead, useNotifications } from '../api/hooks';
import { selectSession, useAppSelector } from '../store';
import type { NotificationItem } from '@novasocial/shared';

const demoMessages = [
  { name: 'Brooklyn Simmons', text: 'Hey! How are you?', time: '2m' },
  { name: 'Darlene Robertson', text: "Let's catch up later", time: '10m' },
  { name: 'Cameron Williamson', text: 'Sent a voice message', time: '30m' },
  { name: 'Jenny Wilson', text: 'Shared your reel', time: '1h' },
];

const inboxTabs: Array<{ key: 'messages' | 'notifications'; label: string; icon: LucideIcon }> = [
  { key: 'messages', label: 'Messages', icon: MessageCircle },
  { key: 'notifications', label: 'Notifications', icon: Bell },
];

export function NotificationsScreen() {
  const session = useAppSelector(selectSession);
  const notifications = useNotifications(session?.tokens.accessToken);
  const markRead = useMarkNotificationRead(session?.tokens.accessToken);
  const items: NotificationItem[] = notifications.data?.items ?? [];
  const [tab, setTab] = useState<'messages' | 'notifications'>('messages');
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [sentMessage, setSentMessage] = useState<string | null>(null);

  const sendMessage = () => {
    const text = draft.trim();
    if (!text || !activeChat) {
      return;
    }

    setSentMessage(text);
    setDraft('');
  };

  return (
    <ScrollView className="flex-1 bg-[#080b0f]" contentContainerStyle={{ padding: 16, paddingBottom: 34 }}>
      <View className="mb-5 flex-row items-center justify-between">
        <Text className="text-2xl font-black text-white">Inbox</Text>
        <Pressable className="h-10 w-10 items-center justify-center rounded-full bg-[#6c5ce7]">
          <Send size={18} color="#fff" />
        </Pressable>
      </View>

      <View className="mb-4 flex-row rounded-2xl bg-[#11151c] p-1">
        {inboxTabs.map(({ key, label, icon: Icon }) => (
          <Pressable key={key} className={`flex-1 flex-row items-center justify-center gap-2 rounded-xl py-3 ${tab === key ? 'bg-[#6c5ce7]' : ''}`} onPress={() => setTab(key)}>
            <Icon size={16} color="#fff" />
            <Text className="text-xs font-black text-white">{label}</Text>
          </Pressable>
        ))}
      </View>

      {tab === 'messages' ? (
        <>
          <TextInput
            className="mb-4 rounded-2xl bg-[#11151c] px-4 py-3 text-base font-bold text-white"
            placeholder="Search messages"
            placeholderTextColor="#64748b"
          />
          <View className="gap-3">
            {demoMessages.map((message) => (
              <Pressable key={message.name} className="flex-row items-center justify-between rounded-[22px] bg-[#11151c] p-4" onPress={() => setActiveChat(message.name)}>
                <View className="flex-row items-center gap-3">
                  <View className="h-12 w-12 items-center justify-center rounded-full bg-[#6c5ce7]">
                    <Text className="font-black text-white">{message.name.slice(0, 1)}</Text>
                  </View>
                  <View>
                    <Text className="font-black text-white">{message.name}</Text>
                    <Text className="mt-1 text-xs font-bold text-slate-500">{message.text}</Text>
                  </View>
                </View>
                <Text className="text-xs font-bold text-slate-500">{message.time}</Text>
              </Pressable>
            ))}
          </View>

          {activeChat ? (
            <View className="mt-5 rounded-[22px] bg-[#11151c] p-4">
              <Text className="font-black text-white">{activeChat}</Text>
              <Text className="mt-2 self-start rounded-2xl bg-[#1a2030] px-4 py-3 text-sm font-bold text-slate-300">Let's catch up later!</Text>
              {sentMessage ? <Text className="mt-3 self-end rounded-2xl bg-[#6c5ce7] px-4 py-3 text-sm font-bold text-white">{sentMessage}</Text> : null}
              <View className="mt-4 flex-row gap-2">
                <TextInput
                  className="flex-1 rounded-2xl bg-[#080b0f] px-4 py-3 text-sm font-bold text-white"
                  placeholder="Type a message"
                  placeholderTextColor="#64748b"
                  value={draft}
                  onChangeText={setDraft}
                />
                <Pressable className="h-12 w-12 items-center justify-center rounded-2xl bg-[#6c5ce7]" onPress={sendMessage}>
                  <Send size={18} color="#fff" />
                </Pressable>
              </View>
            </View>
          ) : null}
        </>
      ) : (
        <View className="gap-3">
          {items.map((item) => (
            <Pressable
              key={item.id}
              className={`flex-row gap-3 rounded-[22px] p-4 ${item.readAt ? 'bg-[#0c1017]' : 'bg-[#11151c]'}`}
              onPress={() => markRead.mutate(item.id)}
            >
              <View className={`h-11 w-11 items-center justify-center rounded-full ${item.readAt ? 'bg-[#1f2937]' : 'bg-[#6c5ce7]'}`}>
                <Bell size={18} color="#fff" />
              </View>
              <View className="flex-1">
                <Text className="font-black text-white">{item.title}</Text>
                <Text className="mt-1 text-sm leading-5 text-slate-400">{item.body}</Text>
                <Text className="mt-2 text-xs font-bold uppercase text-slate-500">{item.readAt ? 'read' : item.type}</Text>
              </View>
              {markRead.isPending ? <ActivityIndicator color="#6c5ce7" /> : null}
            </Pressable>
          ))}
          {items.length === 0 ? <Text className="text-center text-sm font-bold text-slate-500">All clear</Text> : null}
        </View>
      )}
    </ScrollView>
  );
}
