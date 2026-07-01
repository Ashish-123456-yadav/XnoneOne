import { Play } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

export const xnovaColors = {
  bg: '#080b0f',
  panel: '#11151c',
  panelSoft: '#151a24',
  border: '#252c3b',
  primary: '#6c5ce7',
  primarySoft: '#7c3aed',
  cyan: '#00d4ff',
  text: '#ffffff',
  muted: '#8b93a8',
};

const scenePalettes = [
  { sky: '#15213b', glow: '#f97316', ground: '#2b1720', accent: '#fbbf24' },
  { sky: '#102746', glow: '#0ea5e9', ground: '#06313a', accent: '#38bdf8' },
  { sky: '#251443', glow: '#a855f7', ground: '#160f24', accent: '#ec4899' },
  { sky: '#172033', glow: '#14b8a6', ground: '#0f172a', accent: '#22c55e' },
];

export function XnovaMiniLogo({ label = 'Xnova' }: { label?: string }) {
  return (
    <View style={styles.logoRow}>
      <View style={styles.logoMark}>
        <View style={[styles.logoBar, styles.logoBarBlue]} />
        <View style={[styles.logoBar, styles.logoBarPurple]} />
      </View>
      <Text style={styles.logoLabel}>{label}</Text>
    </View>
  );
}

export function XnovaAvatar({ label, size = 54, active = true }: { label: string; size?: number; active?: boolean }) {
  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: active ? xnovaColors.primary : xnovaColors.border,
        },
      ]}
    >
      <Text style={[styles.avatarText, { fontSize: Math.max(14, size / 3) }]}>{label.slice(0, 1).toUpperCase()}</Text>
    </View>
  );
}

export function XnovaMediaScene({ variant = 0, height = 260, showPlay = true }: { variant?: number; height?: number; showPlay?: boolean }) {
  const palette = scenePalettes[variant % scenePalettes.length] ?? scenePalettes[0];

  return (
    <View style={[styles.scene, { height, backgroundColor: palette.sky }]}>
      <View style={[styles.sun, { backgroundColor: palette.glow }]} />
      <View style={[styles.horizon, { backgroundColor: palette.accent }]} />
      <View style={[styles.hillOne, { backgroundColor: palette.ground }]} />
      <View style={[styles.hillTwo, { backgroundColor: palette.ground }]} />
      <View style={styles.sceneShade} />
      {showPlay ? (
        <View style={styles.play}>
          <Play size={26} color="#ffffff" />
        </View>
      ) : null}
    </View>
  );
}

export function XnovaChip({ label }: { label: string }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoMark: {
    width: 31,
    height: 31,
    position: 'relative',
  },
  logoBar: {
    position: 'absolute',
    width: 11,
    height: 33,
    top: -1,
    borderRadius: 4,
  },
  logoBarBlue: {
    left: 8,
    backgroundColor: '#168dff',
    transform: [{ rotate: '42deg' }],
  },
  logoBarPurple: {
    right: 8,
    backgroundColor: '#8138ff',
    transform: [{ rotate: '-42deg' }],
  },
  logoLabel: {
    color: '#ffffff',
    fontSize: 23,
    lineHeight: 28,
    fontWeight: '900',
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    backgroundColor: xnovaColors.panelSoft,
  },
  avatarText: {
    color: '#ffffff',
    fontWeight: '900',
  },
  scene: {
    overflow: 'hidden',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sun: {
    position: 'absolute',
    top: 44,
    right: 48,
    width: 86,
    height: 86,
    borderRadius: 43,
    opacity: 0.9,
  },
  horizon: {
    position: 'absolute',
    top: 130,
    left: 28,
    right: 28,
    height: 3,
    borderRadius: 999,
    opacity: 0.7,
  },
  hillOne: {
    position: 'absolute',
    left: -30,
    bottom: -44,
    width: 250,
    height: 150,
    borderRadius: 90,
    opacity: 0.84,
  },
  hillTwo: {
    position: 'absolute',
    right: -42,
    bottom: -60,
    width: 260,
    height: 178,
    borderRadius: 110,
    opacity: 0.72,
  },
  sceneShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
  play: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.36)',
  },
  chip: {
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.14)',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
  },
});
