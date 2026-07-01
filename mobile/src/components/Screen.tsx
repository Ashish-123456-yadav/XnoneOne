import { ReactNode } from 'react';
import { SafeAreaView, ScrollView, View } from 'react-native';
import { selectThemeMode, useAppSelector } from '../store';

type ScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
};

export function Screen({ children, scroll = true, padded = true }: ScreenProps) {
  const mode = useAppSelector(selectThemeMode);
  const className = mode === 'dark' ? 'bg-ink' : 'bg-paper';
  const content = <View className={padded ? 'px-5 pb-8 pt-3' : 'pb-8'}>{children}</View>;

  return (
    <SafeAreaView className={`flex-1 ${className}`}>
      {scroll ? <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>{content}</ScrollView> : content}
    </SafeAreaView>
  );
}
