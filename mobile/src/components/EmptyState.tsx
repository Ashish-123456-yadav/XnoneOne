import { ReactNode } from 'react';
import { Text, View } from 'react-native';

export function EmptyState({ title, body, icon }: { title: string; body: string; icon?: ReactNode }) {
  return (
    <View className="items-center rounded-card border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      {icon}
      <Text className="mt-3 text-base font-bold text-slate-950 dark:text-white">{title}</Text>
      <Text className="mt-1 text-center text-sm leading-5 text-slate-500 dark:text-slate-400">{body}</Text>
    </View>
  );
}
