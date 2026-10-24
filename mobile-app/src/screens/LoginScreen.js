import React, { useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, ActivityIndicator, TextInput,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Logo from '../components/Logo';
import { useAuth } from '../auth/AuthContext';
import { colors, type, fonts, spacing, radius, shadow, gradients } from '../theme/theme';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const {
    signInWithGoogle, signInWithEmail, signUpWithEmail, devSignIn,
    signingIn, error, isConfigured,
  } = useAuth();

  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [localError, setLocalError] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const isSignup = mode === 'signup';

  const submit = async () => {
    setLocalError(null);
    if (!email.trim()) { setLocalError('Enter your email to continue.'); return; }
    if (!password) { setLocalError('Enter your password to continue.'); return; }
    if (isSignup && password.length < 6) {
      setLocalError('Password must be at least 6 characters.');
      return;
    }
    if (isSignup) {
      const res = await signUpWithEmail(email, password, name);
      if (res.ok && res.needsConfirmation) {
        Alert.alert(
          'Confirm your email',
          'We sent a confirmation link to your email. Confirm it, then sign in.'
        );
        setMode('signin');
      }
    } else {
      await signInWithEmail(email, password);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* hero gradient band */}
        <LinearGradient
          colors={gradients.hero}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          locations={[0, 0.4, 0.75, 1]}
          style={[styles.hero, { paddingTop: insets.top + 48 }]}
        >
          <View style={styles.logo}>
            <Logo size={44} color="#fff" />
          </View>
          <Text style={styles.wordmark}>RepsIn</Text>
          <Text style={styles.tagline}>Train smarter. Skip the wait.</Text>
        </LinearGradient>

        {/* sign-in sheet */}
        <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.xxl }]}>
          <Text style={styles.heading}>{isSignup ? 'Create account' : 'Welcome back'}</Text>
          <Text style={styles.sub}>
            {isSignup
              ? 'Sign up to save your workouts, rep counts, and best-time forecasts.'
              : 'Sign in to sync your workouts across sessions.'}
          </Text>

          {isSignup ? (
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Name"
              placeholderTextColor={colors.inkFaint}
              autoCapitalize="words"
              style={styles.input}
            />
          ) : null}

          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor={colors.inkFaint}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
            style={styles.input}
          />
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor={colors.inkFaint}
            secureTextEntry
            autoCapitalize="none"
            textContentType={isSignup ? 'newPassword' : 'password'}
            style={styles.input}
            onSubmitEditing={submit}
            returnKeyType="go"
          />

          <Pressable
            onPress={submit}
            disabled={signingIn}
            style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.9 }, signingIn && { opacity: 0.7 }]}
          >
            {signingIn ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryText}>{isSignup ? 'Sign up' : 'Sign in'}</Text>
            )}
          </Pressable>

          <Pressable onPress={() => setMode(isSignup ? 'signin' : 'signup')} style={styles.switchRow}>
            <Text style={styles.switchText}>
              {isSignup ? 'Already have an account? ' : "Don't have an account? "}
              <Text style={styles.switchLink}>{isSignup ? 'Sign in' : 'Sign up'}</Text>
            </Text>
          </Pressable>

          {/* divider */}
          <View style={styles.orRow}>
            <View style={styles.orLine} />
            <Text style={styles.orText}>or</Text>
            <View style={styles.orLine} />
          </View>

          {/* Google */}
          <Pressable
            onPress={signInWithGoogle}
            disabled={signingIn}
            style={({ pressed }) => [styles.googleBtn, pressed && { opacity: 0.9 }]}
            accessibilityRole="button"
            accessibilityLabel="Continue with Google"
          >
            <Text style={styles.gText}>G</Text>
            <Text style={styles.googleText}>Continue with Google</Text>
          </Pressable>

          {localError || error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{localError || error}</Text>
            </View>
          ) : null}

          {!isConfigured ? (
            <>
              <Pressable
                onPress={devSignIn}
                style={({ pressed }) => [styles.devBtn, pressed && { opacity: 0.85 }]}
              >
                <Text style={styles.devText}>Preview as demo account</Text>
              </Pressable>
              <View style={styles.warnBox}>
                <Text style={styles.warnText}>
                  Supabase isn't configured yet. Add your keys to .env, or use preview to explore the UI.
                </Text>
              </View>
            </>
          ) : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  hero: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl + spacing.lg,
  },
  logo: {
    width: 68, height: 68, borderRadius: 34,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.md,
  },
  bolt: { fontSize: 34, color: '#fff' },
  wordmark: { fontFamily: fonts.serif, fontSize: 48, color: '#fff', lineHeight: 54 },
  tagline: { color: 'rgba(255,255,255,0.92)', fontSize: 15, marginTop: 4, fontWeight: '600' },

  sheet: {
    flex: 1,
    backgroundColor: colors.bg,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    marginTop: -radius.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    ...shadow.float,
  },
  heading: { fontFamily: fonts.serif, fontSize: 30, color: colors.ink },
  sub: { ...type.body, marginTop: 6, marginBottom: spacing.lg },

  input: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.ink,
    marginBottom: spacing.md,
  },

  primaryBtn: {
    backgroundColor: colors.purple,
    borderRadius: radius.pill,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  primaryText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  switchRow: { alignItems: 'center', marginTop: spacing.md },
  switchText: { color: colors.inkSoft, fontSize: 14 },
  switchLink: { color: colors.purple, fontWeight: '700' },

  orRow: { flexDirection: 'row', alignItems: 'center', marginVertical: spacing.lg },
  orLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.hairline },
  orText: { marginHorizontal: 12, color: colors.inkFaint, fontSize: 13, fontWeight: '600' },

  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.pill,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: colors.hairline,
    ...shadow.card,
  },
  gText: { fontSize: 19, fontWeight: '800', color: '#4285F4', marginRight: 10 },
  googleText: { fontSize: 15, fontWeight: '700', color: colors.ink },

  errorBox: { marginTop: spacing.lg, backgroundColor: '#FBE8E6', borderRadius: radius.md, padding: spacing.md },
  errorText: { color: colors.high, fontSize: 14, fontWeight: '600' },

  devBtn: {
    marginTop: spacing.lg,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.ink,
    borderRadius: radius.pill,
    paddingVertical: 14,
  },
  devText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  warnBox: { marginTop: spacing.md, backgroundColor: colors.purpleSoft, borderRadius: radius.md, padding: spacing.md },
  warnText: { color: colors.purple, fontSize: 13, lineHeight: 19, fontWeight: '600' },
});
