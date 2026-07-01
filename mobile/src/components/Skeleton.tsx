import { View } from 'react-native';

export function FeedSkeleton() {
  return (
    <View className="gap-4">
      {[0, 1, 2].map((item) => (
        <View key={item} className="h-96 rounded-card bg-slate-200/70 dark:bg-slate-800">
          <View className="m-4 h-5 w-40 rounded bg-slate-300 dark:bg-slate-700" />
          <View className="mx-4 mt-auto h-4 w-56 rounded bg-slate-300 dark:bg-slate-700" />
          <View className="m-4 h-10 rounded bg-slate-300 dark:bg-slate-700" />
        </View>
      ))}
    </View>
  );
}
