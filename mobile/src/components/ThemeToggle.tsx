import { Moon, Sun } from 'lucide-react-native';
import { Pressable, StyleSheet } from 'react-native';
import { selectThemeMode, toggleTheme, useAppDispatch, useAppSelector } from '../store';

export function ThemeToggle() {
  const dispatch = useAppDispatch();
  const mode = useAppSelector(selectThemeMode);
  const Icon = mode === 'dark' ? Sun : Moon;

  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Toggle theme" style={styles.button} onPress={() => dispatch(toggleTheme())}>
      <Icon size={19} color={mode === 'dark' ? '#ffffff' : '#0f172a'} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#11151c',
    borderWidth: 1,
    borderColor: '#252c3b',
  },
});
