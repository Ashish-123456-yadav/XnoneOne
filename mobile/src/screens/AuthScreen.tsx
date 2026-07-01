import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { ArrowRight, Check, Eye, Lock, Mail, ShieldCheck, Sparkles, User } from 'lucide-react-native';
import { useLogin, useRegister } from '../api/hooks';
import { setSession, useAppDispatch } from '../store';

type AuthMode = 'login' | 'register' | 'forgot';

const glassShadow =
  Platform.select({
    web: { boxShadow: '0 0 32px rgba(78, 91, 255, 0.36), 0 24px 60px rgba(0, 0, 0, 0.45)' } as object,
    default: {
      shadowColor: '#4e5bff',
      shadowOpacity: 0.35,
      shadowRadius: 28,
      shadowOffset: { width: 0, height: 18 },
    },
  }) ?? {};

const buttonShadow =
  Platform.select({
    web: { boxShadow: '0 14px 28px rgba(82, 80, 255, 0.36)' } as object,
    default: {
      shadowColor: '#6d38ff',
      shadowOpacity: 0.32,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 10 },
    },
  }) ?? {};

function XnovaMark({ size = 92 }: { size?: number }) {
  const barWidth = size * 0.26;
  const barHeight = size * 0.82;

  return (
    <View style={[styles.xMark, { width: size, height: size }]}>
      <View
        style={[
          styles.xBar,
          styles.xBarBlue,
          {
            width: barWidth,
            height: barHeight,
            left: size * 0.28,
            top: size * 0.09,
          },
        ]}
      />
      <View
        style={[
          styles.xBar,
          styles.xBarPurple,
          {
            width: barWidth,
            height: barHeight,
            right: size * 0.28,
            top: size * 0.09,
          },
        ]}
      />
    </View>
  );
}

export function AuthScreen() {
  const dispatch = useAppDispatch();
  const login = useLogin();
  const register = useRegister();
  const { width } = useWindowDimensions();
  const compact = width < 720;

  const [mode, setMode] = useState<AuthMode>('login');
  const [remember, setRemember] = useState(true);
  const [email, setEmail] = useState('ava@novasocial.ai');
  const [password, setPassword] = useState('NovaPass123!');
  const [username, setUsername] = useState('nova_creator');
  const [displayName, setDisplayName] = useState('Nova Creator');
  const [notice, setNotice] = useState<string | null>(null);

  const isLoading = login.isPending || register.isPending;
  const error = login.error ?? register.error;

  const submit = async () => {
    setNotice(null);

    if (mode === 'forgot') {
      setNotice('Reset code sent. Check the demo inbox.');
      return;
    }

    const session =
      mode === 'login'
        ? await login.mutateAsync({ email, password })
        : await register.mutateAsync({ email, password, username, displayName });
    dispatch(setSession(session));
  };

  const title = mode === 'login' ? 'Welcome Back' : mode === 'register' ? 'Create Account' : 'Forgot Password';
  const subtitle =
    mode === 'login'
      ? 'Sign in to continue to your workspace'
      : mode === 'register'
        ? 'Sign up to start building with Xnova'
        : 'Enter your email and we will send a reset code';

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.root}>
      <View style={styles.background}>
        <View style={[styles.neonLine, styles.neonLineOne]} />
        <View style={[styles.neonLine, styles.neonLineTwo]} />
        <View style={styles.cornerGlowBlue} />
        <View style={styles.cornerGlowPurple} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={[styles.card, compact ? styles.cardCompact : styles.cardWide]}>
          <View style={styles.logoStack}>
            <XnovaMark size={compact ? 82 : 112} />
            <View style={styles.wordmarkRow}>
              <XnovaMark size={48} />
              <Text style={[styles.wordmark, compact && styles.wordmarkCompact]}>NOVA</Text>
            </View>
            <Text style={[styles.tagline, compact && styles.taglineCompact]}>INNOVATE. BUILD. ELEVATE.</Text>
          </View>

          <View style={[styles.headerCopy, compact && styles.headerCopyCompact]}>
            <Text style={[styles.title, compact && styles.titleCompact]}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>

          <View style={[styles.form, compact && styles.formCompact]}>
            {mode === 'register' ? (
              <>
                <View style={[styles.fieldGroup, compact && styles.fieldGroupCompact]}>
                  <Text style={styles.label}>Username</Text>
                  <View style={[styles.inputShell, compact && styles.inputShellCompact]}>
                    <User size={21} color="#aab2c5" />
                    <TextInput
                      autoCapitalize="none"
                      placeholder="nova_creator"
                      placeholderTextColor="#8b93a8"
                      style={styles.input}
                      value={username}
                      onChangeText={setUsername}
                    />
                  </View>
                </View>
                <View style={[styles.fieldGroup, compact && styles.fieldGroupCompact]}>
                  <Text style={styles.label}>Display Name</Text>
                  <View style={[styles.inputShell, compact && styles.inputShellCompact]}>
                    <Sparkles size={21} color="#aab2c5" />
                    <TextInput
                      placeholder="Nova Creator"
                      placeholderTextColor="#8b93a8"
                      style={styles.input}
                      value={displayName}
                      onChangeText={setDisplayName}
                    />
                  </View>
                </View>
              </>
            ) : null}

            <View style={[styles.fieldGroup, compact && styles.fieldGroupCompact]}>
              <Text style={styles.label}>Email Address</Text>
              <View style={[styles.inputShell, compact && styles.inputShellCompact]}>
                <Mail size={22} color="#aab2c5" />
                <TextInput
                  autoCapitalize="none"
                  keyboardType="email-address"
                  placeholder="john.doe@example.com"
                  placeholderTextColor="#8b93a8"
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>

            {mode !== 'forgot' ? (
              <View style={[styles.fieldGroup, compact && styles.fieldGroupCompact]}>
                <Text style={styles.label}>Password</Text>
                <View style={[styles.inputShell, compact && styles.inputShellCompact]}>
                  <Lock size={22} color="#aab2c5" />
                  <TextInput
                    placeholder="Password"
                    placeholderTextColor="#8b93a8"
                    secureTextEntry
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                  />
                  <Eye size={22} color="#aab2c5" />
                </View>
              </View>
            ) : null}

            {mode === 'login' ? (
              <View style={styles.optionsRow}>
                <Pressable style={styles.rememberRow} onPress={() => setRemember((value) => !value)}>
                  <View style={[styles.checkbox, remember && styles.checkboxActive]}>{remember ? <Check size={17} color="#ffffff" /> : null}</View>
                  <Text style={styles.rememberText}>Remember Me</Text>
                </Pressable>
                <Pressable onPress={() => setMode('forgot')}>
                  <Text style={styles.linkText}>Forgot Password?</Text>
                </Pressable>
              </View>
            ) : null}

            {error ? <Text style={styles.errorText}>{error.message}</Text> : null}
            {notice ? <Text style={styles.noticeText}>{notice}</Text> : null}

            <Pressable disabled={isLoading} style={({ pressed }) => [styles.primaryButton, compact && styles.primaryButtonCompact, pressed && styles.primaryPressed]} onPress={submit}>
              {isLoading ? <ActivityIndicator color="#ffffff" /> : null}
              <Text style={styles.primaryText}>
                {mode === 'login' ? 'Sign In' : mode === 'register' ? 'Sign Up' : 'Send Code'}
              </Text>
              {!isLoading ? <ArrowRight size={30} color="#ffffff" /> : null}
            </Pressable>

            {mode !== 'forgot' ? (
              <>
                <View style={styles.dividerRow}>
                  <View style={styles.divider} />
                  <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
                  <View style={styles.divider} />
                </View>

                <View style={styles.socialRow}>
                  {['Google', 'GitHub', 'Apple'].map((provider) => (
                    <Pressable key={provider} style={({ pressed }) => [styles.socialButton, pressed && styles.socialPressed]}>
                      <Text style={styles.socialIcon}>{provider === 'Google' ? 'G' : provider === 'GitHub' ? 'GH' : 'A'}</Text>
                      <Text style={styles.socialText}>{provider}</Text>
                    </Pressable>
                  ))}
                </View>
              </>
            ) : null}

            <View style={styles.footerRow}>
              <Text style={styles.footerMuted}>
                {mode === 'login' ? "Don't have an account?" : mode === 'register' ? 'Already have an account?' : 'Remembered password?'}
              </Text>
              <Pressable onPress={() => setMode(mode === 'login' ? 'register' : 'login')}>
                <Text style={styles.footerLink}>{mode === 'login' ? 'Sign Up' : 'Sign In'}</Text>
              </Pressable>
            </View>

            <View style={styles.secureBadge}>
              <ShieldCheck size={15} color="#9fb6ff" />
              <Text style={styles.secureText}>JWT secured creator workspace</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#03050c',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  neonLine: {
    position: 'absolute',
    height: 1,
    width: 520,
    backgroundColor: '#3e6cff',
    opacity: 0.55,
  },
  neonLineOne: {
    top: 120,
    left: -120,
    transform: [{ rotate: '34deg' }],
  },
  neonLineTwo: {
    right: -110,
    bottom: 160,
    backgroundColor: '#8036ff',
    transform: [{ rotate: '-28deg' }],
  },
  cornerGlowBlue: {
    position: 'absolute',
    left: -130,
    bottom: -110,
    width: 290,
    height: 290,
    borderRadius: 145,
    borderWidth: 1,
    borderColor: '#1c62ff',
    opacity: 0.85,
  },
  cornerGlowPurple: {
    position: 'absolute',
    right: -155,
    top: -120,
    width: 320,
    height: 320,
    borderRadius: 160,
    borderWidth: 1,
    borderColor: '#7c2fff',
    opacity: 0.82,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 22,
  },
  card: {
    ...glassShadow,
    width: '100%',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#7b86ff',
    backgroundColor: 'rgba(8, 10, 22, 0.92)',
  },
  cardWide: {
    maxWidth: 700,
    paddingHorizontal: 70,
    paddingVertical: 64,
  },
  cardCompact: {
    maxWidth: 430,
    paddingHorizontal: 24,
    paddingVertical: 28,
  },
  logoStack: {
    alignItems: 'center',
  },
  xMark: {
    position: 'relative',
  },
  xBar: {
    position: 'absolute',
    borderRadius: 8,
  },
  xBarBlue: {
    backgroundColor: '#168dff',
    transform: [{ rotate: '42deg' }],
  },
  xBarPurple: {
    backgroundColor: '#8138ff',
    transform: [{ rotate: '-42deg' }],
  },
  wordmarkRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  wordmark: {
    color: '#ffffff',
    fontSize: 56,
    lineHeight: 60,
    fontWeight: '900',
    letterSpacing: 0,
  },
  wordmarkCompact: {
    fontSize: 48,
    lineHeight: 52,
  },
  tagline: {
    marginTop: 14,
    color: '#aeb8d6',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0,
    textAlign: 'center',
  },
  taglineCompact: {
    marginTop: 8,
    fontSize: 14,
  },
  headerCopy: {
    marginTop: 52,
    alignItems: 'center',
  },
  headerCopyCompact: {
    marginTop: 34,
  },
  title: {
    color: '#ffffff',
    fontSize: 40,
    lineHeight: 48,
    fontWeight: '900',
    textAlign: 'center',
  },
  titleCompact: {
    fontSize: 32,
    lineHeight: 38,
  },
  subtitle: {
    marginTop: 10,
    color: '#a8afc2',
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600',
    textAlign: 'center',
  },
  form: {
    marginTop: 42,
  },
  formCompact: {
    marginTop: 30,
  },
  fieldGroup: {
    marginBottom: 24,
  },
  fieldGroupCompact: {
    marginBottom: 18,
  },
  label: {
    marginBottom: 12,
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  inputShell: {
    height: 66,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#444b63',
    backgroundColor: 'rgba(10, 13, 27, 0.72)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 16,
  },
  inputShellCompact: {
    height: 58,
  },
  input: {
    flex: 1,
    height: '100%',
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  optionsRow: {
    marginTop: 2,
    marginBottom: 28,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#5c64ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: '#6846ff',
  },
  rememberText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  linkText: {
    color: '#7058ff',
    fontSize: 17,
    fontWeight: '800',
  },
  errorText: {
    marginBottom: 16,
    color: '#ff6b8a',
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },
  noticeText: {
    marginBottom: 16,
    color: '#69e6b1',
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },
  primaryButton: {
    ...buttonShadow,
    height: 72,
    borderRadius: 13,
    backgroundColor: '#5d38f7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  primaryButtonCompact: {
    height: 64,
  },
  primaryPressed: {
    opacity: 0.86,
  },
  primaryText: {
    color: '#ffffff',
    fontSize: 23,
    fontWeight: '900',
  },
  dividerRow: {
    marginTop: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#34394d',
  },
  dividerText: {
    color: '#8d94a8',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0,
  },
  socialRow: {
    marginTop: 28,
    flexDirection: 'row',
    gap: 18,
  },
  socialButton: {
    flex: 1,
    minHeight: 64,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#34394d',
    backgroundColor: 'rgba(10, 13, 27, 0.68)',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 11,
  },
  socialPressed: {
    borderColor: '#6a5cff',
  },
  socialIcon: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
  },
  socialText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  footerRow: {
    marginTop: 38,
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  footerMuted: {
    color: '#a3a9bb',
    fontSize: 18,
    fontWeight: '600',
  },
  footerLink: {
    color: '#8a47ff',
    fontSize: 18,
    fontWeight: '900',
  },
  secureBadge: {
    marginTop: 22,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#2f3651',
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  secureText: {
    color: '#9ba5c0',
    fontSize: 12,
    fontWeight: '800',
  },
});
