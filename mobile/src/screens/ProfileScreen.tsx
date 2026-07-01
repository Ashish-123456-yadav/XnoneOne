import { useState } from 'react';
import { Bell, HelpCircle, Languages, Lock, LogOut, Moon, ShieldCheck, UserRound } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useCreatorAnalytics, useProfile } from '../api/hooks';
import { ThemeToggle } from '../components/ThemeToggle';
import { XnovaMediaScene } from '../components/XnovaArt';
import { logout, selectSession, useAppDispatch, useAppSelector } from '../store';

type SettingItem = {
  title: string;
  subtitle: string;
  icon: LucideIcon;
};

const settings: SettingItem[] = [
  { title: 'Account', subtitle: 'Manage your account', icon: UserRound },
  { title: 'Privacy', subtitle: 'Control your privacy', icon: Lock },
  { title: 'Notifications', subtitle: 'Manage notifications', icon: Bell },
  { title: 'Language', subtitle: 'English', icon: Languages },
  { title: 'Dark Mode', subtitle: 'Enabled', icon: Moon },
  { title: 'Help & Support', subtitle: 'Get support', icon: HelpCircle },
];

export function ProfileScreen() {
  const dispatch = useAppDispatch();
  const session = useAppSelector(selectSession);
  const profile = useProfile(session?.tokens.accessToken);
  const analytics = useCreatorAnalytics(session?.tokens.accessToken);
  const publicUser = profile.data?.user ?? session?.user;
  const [selectedSetting, setSelectedSetting] = useState<string | null>(null);

  return (
    <ScrollView className="flex-1 bg-[#080b0f]" contentContainerStyle={{ padding: 16, paddingBottom: 34 }}>
      <View className="mb-5 flex-row items-center justify-between">
        <Text className="text-2xl font-black text-white">Profile</Text>
        <ThemeToggle />
      </View>

      <View className="rounded-[28px] bg-[#11151c] p-5">
        <View className="items-center">
          <View className="h-24 w-24 items-center justify-center rounded-full border-2 border-[#6c5ce7] bg-[#1f2635]">
            <Text className="text-3xl font-black text-white">{publicUser?.displayName?.slice(0, 1) ?? 'X'}</Text>
          </View>
          <View className="mt-3 flex-row items-center gap-2">
            <Text className="text-2xl font-black text-white">{publicUser?.displayName}</Text>
            {publicUser?.isVerified ? <ShieldCheck size={19} color="#22c55e" /> : null}
          </View>
          <Text className="mt-1 text-sm font-bold text-slate-500">@{publicUser?.username}</Text>
          <Text className="mt-3 text-center text-sm leading-5 text-slate-300">{profile.data?.bio ?? 'Content Creator | Traveler | Dreamer'}</Text>
        </View>

        <View className="mt-5 flex-row justify-around">
          {[
            ['Posts', publicUser?.postCount ?? 0],
            ['Followers', publicUser?.followerCount ?? 0],
            ['Following', publicUser?.followingCount ?? 0],
          ].map(([label, value]) => (
            <View key={String(label)} className="items-center">
              <Text className="text-lg font-black text-white">{Number(value).toLocaleString()}</Text>
              <Text className="text-xs font-bold text-slate-500">{label}</Text>
            </View>
          ))}
        </View>
      </View>

      <Text className="mb-3 mt-6 text-xl font-black text-white">Creator Dashboard</Text>
      <View className="flex-row flex-wrap gap-3">
        {[
          ['Views', analytics.data?.profile.views ?? 0, '+12.9%', '#6c5ce7'],
          ['Followers', analytics.data?.profile.followers ?? 0, '+8.3%', '#4f46e5'],
          ['Engagement', `${analytics.data?.profile.engagementRate ?? 0}%`, '+4.2%', '#0f766e'],
          ['Earnings', '$1,245', '+15.7%', '#7c3aed'],
        ].map(([label, value, delta, color]) => (
          <View key={String(label)} className="min-h-24 flex-1 basis-[45%] rounded-[20px] p-4" style={{ backgroundColor: String(color) }}>
            <Text className="text-xs font-bold text-white/75">{label}</Text>
            <Text className="mt-2 text-2xl font-black text-white">{typeof value === 'number' ? value.toLocaleString() : value}</Text>
            <Text className="mt-1 text-xs font-black text-emerald-200">{delta}</Text>
          </View>
        ))}
      </View>

      <Text className="mb-3 mt-6 text-xl font-black text-white">Top Posts</Text>
      <View className="flex-row gap-3">
        {[0, 1, 2].map((item) => (
          <View key={item} className="h-36 flex-1 overflow-hidden rounded-2xl">
            <XnovaMediaScene variant={item} height={144} showPlay={false} />
            <View className="absolute bottom-2 left-2 rounded-full bg-black/45 px-2 py-1">
              <Text className="text-[10px] font-black text-white">{item === 0 ? '23.4K' : item === 1 ? '12.8K' : '9.6K'}</Text>
            </View>
          </View>
        ))}
      </View>

      <Text className="mb-3 mt-6 text-xl font-black text-white">Settings</Text>
      <View className="overflow-hidden rounded-[24px] bg-[#11151c]">
        {settings.map(({ title, subtitle, icon: Icon }) => (
          <Pressable key={title} className="flex-row items-center justify-between border-b border-[#1c2230] p-4" onPress={() => setSelectedSetting(title)}>
            <View className="flex-row items-center gap-3">
              <Icon size={19} color="#fff" />
              <View>
                <Text className="font-black text-white">{title}</Text>
                <Text className="text-xs font-bold text-slate-500">{subtitle}</Text>
              </View>
            </View>
            <Text className="text-lg font-black text-slate-500">›</Text>
          </Pressable>
        ))}
      </View>

      {selectedSetting ? (
        <View className="mt-4 rounded-[22px] bg-[#11151c] p-4">
          <Text className="text-lg font-black text-white">{selectedSetting}</Text>
          <Text className="mt-2 text-sm leading-5 text-slate-400">This setting panel is ready for the next production form. Profile data, theme, and logout are already connected.</Text>
        </View>
      ) : null}

      <Pressable className="mt-5 flex-row items-center justify-center gap-2 rounded-2xl border border-red-500/40 bg-red-500/10 py-4" onPress={() => dispatch(logout())}>
        <LogOut size={18} color="#ef4444" />
        <Text className="font-black text-red-400">Log Out</Text>
      </Pressable>
    </ScrollView>
  );
}
