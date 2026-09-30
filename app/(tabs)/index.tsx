import { Feather } from '@expo/vector-icons';
import { useIsFocused, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useGoogleAuth } from '../../hooks/useGoogleAuth';

const { height } = Dimensions.get('window');

const C = {
  bg:      '#FFFFFF',
  primary: '#016701',
  text:    '#0A0A0A',
  muted:   '#8A8A8A',
  faint:   '#E8E8E8',
  error:   '#DC2626',
  errorBg: '#FEF2F2',
  border:  '#EAEEF2',
  inputBg: '#F8FAFB',
};

export default function LoginScreen() {
  const router = useRouter();
  const { login, loginWithGoogle, register, isAuthenticated, isLoading: authLoading } = useAuth();
  const isFocused = useIsFocused();

  const [mode,      setMode]      = useState<'signin' | 'signup'>('signin');
  const [firstname, setFirstname] = useState('');
  const [lastname,  setLastname]  = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

  const { isReady: googleReady, signIn: signInWithGoogle } = useGoogleAuth({
    onIdToken: async (idToken) => {
      try {
        await loginWithGoogle(idToken);
        router.replace('/my-esims');
      } catch (err: any) {
        setErrorMsg(err?.message || 'Google sign-in failed. Please try again.');
      }
    },
    onError: (message) => setErrorMsg(message),
  });

  const handleGooglePress = async () => {
    setErrorMsg('');
    setGoogleLoading(true);
    await signInWithGoogle();
    setGoogleLoading(false);
  };

  const switchMode = (next: 'signin' | 'signup') => {
    setMode(next);
    setErrorMsg('');
  };

  // Redirect once already authenticated — but only while this screen is the
  // one actually on screen. It stays mounted in the background of the Stack
  // (e.g. while a guest is deep in Explore Plans → Checkout), and without the
  // focus guard, a background auth-state flip — like a guest checkout
  // auto-signing them in mid-order — would yank them out of whatever screen
  // they're actually on and back here.
  useEffect(() => {
    if (!authLoading && isAuthenticated && isFocused) router.replace('/my-esims');
  }, [isAuthenticated, authLoading, isFocused]);

  // ── Animations ────────────────────────────────────────────────────────────
  const logoFade  = useRef(new Animated.Value(0)).current;
  const logoSlide = useRef(new Animated.Value(-20)).current;
  const formFade  = useRef(new Animated.Value(0)).current;
  const formSlide = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.stagger(120, [
      Animated.parallel([
        Animated.timing(logoFade,  { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(logoSlide, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(formFade,  { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(formSlide, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  // ── Sign in ───────────────────────────────────────────────────────────────
  const handleLogin = async () => {
    if (!username.trim()) { setErrorMsg('Please enter your email.'); return; }
    if (!password)        { setErrorMsg('Please enter your password.'); return; }
    setErrorMsg('');
    setLoading(true);
    try {
      await login(username.trim(), password);
      router.replace('/my-esims');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Sign-in failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // ── Sign up ───────────────────────────────────────────────────────────────
  const handleRegister = async () => {
    if (!firstname.trim()) { setErrorMsg('Please enter your first name.'); return; }
    if (!username.trim())  { setErrorMsg('Please enter your email.'); return; }
    if (!password)         { setErrorMsg('Please enter a password.'); return; }
    setErrorMsg('');
    setLoading(true);
    try {
      const autoSignedIn = await register(firstname.trim(), lastname.trim(), username.trim(), password);
      if (autoSignedIn) {
        router.replace('/my-esims');
      } else {
        setPassword('');
        switchMode('signin');
        Alert.alert('Account created', 'You can now sign in with your new account.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          <View style={{ height: height * 0.08 }} />

          {/* Logo */}
          <Animated.View style={[styles.logoBlock, { opacity: logoFade, transform: [{ translateY: logoSlide }] }]}>
            <Image source={require('../../assets/images/logo.png')} style={styles.logoImage} resizeMode="contain" />
            <Text style={styles.tagline}>Business eSIM, simplified.</Text>
            <Text style={styles.subTagline}>
              {mode === 'signin' ? 'Sign in to manage your eSIMs' : 'Create an account to get started'}
            </Text>
          </Animated.View>

          {/* Form */}
          <Animated.View style={[styles.formBlock, { opacity: formFade, transform: [{ translateY: formSlide }] }]}>

            {!!errorMsg && (
              <View style={styles.errorBanner}>
                <Feather name="alert-circle" size={15} color={C.error} />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            )}

            {mode === 'signup' && (
              <View style={styles.nameRow}>
                <View style={[styles.inputWrap, { flex: 1 }]}>
                  <Feather name="user" size={17} color={C.muted} />
                  <TextInput
                    style={styles.input}
                    value={firstname}
                    onChangeText={setFirstname}
                    placeholder="First name"
                    placeholderTextColor={C.muted}
                    autoCapitalize="words"
                    returnKeyType="next"
                    editable={!loading}
                  />
                </View>
                <View style={[styles.inputWrap, { flex: 1 }]}>
                  <Feather name="user" size={17} color={C.muted} />
                  <TextInput
                    style={styles.input}
                    value={lastname}
                    onChangeText={setLastname}
                    placeholder="Last name"
                    placeholderTextColor={C.muted}
                    autoCapitalize="words"
                    returnKeyType="next"
                    editable={!loading}
                  />
                </View>
              </View>
            )}

            {/* Email */}
            <View style={styles.inputWrap}>
              <Feather name="mail" size={17} color={C.muted} />
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                placeholder="Email address"
                placeholderTextColor={C.muted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                editable={!loading}
              />
            </View>

            {/* Password */}
            <View style={styles.inputWrap}>
              <Feather name="lock" size={17} color={C.muted} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                placeholderTextColor={C.muted}
                secureTextEntry={!showPw}
                returnKeyType="done"
                onSubmitEditing={mode === 'signin' ? handleLogin : handleRegister}
                editable={!loading}
              />
              <TouchableOpacity onPress={() => setShowPw(v => !v)} activeOpacity={0.7} style={{ padding: 4 }}>
                <Feather name={showPw ? 'eye-off' : 'eye'} size={17} color={C.muted} />
              </TouchableOpacity>
            </View>

            {/* Sign In / Create Account */}
            <TouchableOpacity
              style={[styles.signInBtn, loading && styles.btnDisabled]}
              onPress={mode === 'signin' ? handleLogin : handleRegister}
              activeOpacity={0.85}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.signInBtnText}>{mode === 'signin' ? 'Sign In' : 'Create Account'}</Text>
              }
            </TouchableOpacity>

            {/* Toggle sign in / sign up */}
            <TouchableOpacity
              activeOpacity={0.7}
              disabled={loading}
              onPress={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}
              style={styles.toggleModeBtn}
            >
              <Text style={styles.toggleModeText}>
                {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
                <Text style={styles.toggleModeLink}>{mode === 'signin' ? 'Sign up' : 'Sign in'}</Text>
              </Text>
            </TouchableOpacity>

            {/* Google */}
            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.divider} />
            </View>

            <TouchableOpacity
              style={[styles.googleBtn, (googleLoading || !googleReady) && styles.btnDisabled]}
              activeOpacity={0.8}
              onPress={handleGooglePress}
              disabled={googleLoading || !googleReady || loading}
            >
              {googleLoading
                ? <ActivityIndicator color={C.text} size="small" />
                : (
                  <>
                    <Feather name="chrome" size={17} color={C.text} />
                    <Text style={styles.googleBtnText}>Continue with Google</Text>
                  </>
                )
              }
            </TouchableOpacity>

            {/* Explore */}
            <TouchableOpacity
              style={[styles.exploreBtn, loading && styles.btnDisabled]}
              activeOpacity={0.8}
              onPress={() => router.push('/explore-plans')}
              disabled={loading}
            >
              <View style={styles.exploreBtnInner}>
                <Feather name="globe" size={16} color={C.primary} />
                <Text style={styles.exploreBtnText}>Explore Plans without signing in</Text>
              </View>
              <Feather name="arrow-right" size={16} color={C.primary} />
            </TouchableOpacity>

          </Animated.View>

          <View style={{ flex: 1 }} />

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              By continuing you agree to our{' '}
              <Text style={styles.footerLink}>Terms</Text> &amp;{' '}
              <Text style={styles.footerLink}>Privacy Policy</Text>
            </Text>
            <Text style={styles.footerText}>
              Questions? <Text style={styles.footerLink}>support@mapians.com</Text>
            </Text>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: C.bg },
  container: { flexGrow: 1, paddingHorizontal: 28, alignItems: 'center' },

  logoBlock:  { alignItems: 'center', marginBottom: 36, width: '100%' },
  logoImage:  { width: 160, height: 52, marginBottom: 14 },
  tagline:    { fontSize: 20, fontWeight: '700', color: C.text, textAlign: 'center', letterSpacing: -0.3 },
  subTagline: { fontSize: 13, color: C.muted, textAlign: 'center', marginTop: 5 },

  formBlock:   { width: '100%', gap: 14 },
  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.errorBg, borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: C.error + '40',
  },
  errorText: { fontSize: 13, color: C.error, flex: 1 },

  nameRow: { flexDirection: 'row', gap: 10 },

  dividerRow:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  divider:     { flex: 1, height: 1, backgroundColor: C.faint },
  dividerText: { fontSize: 12, color: C.muted },

  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    borderWidth: 1.5, borderColor: C.border, borderRadius: 14,
    paddingVertical: 14, backgroundColor: '#fff',
  },
  googleBtnText: { fontSize: 15, fontWeight: '600', color: C.text },

  toggleModeBtn:  { alignItems: 'center', paddingVertical: 4 },
  toggleModeText: { fontSize: 13, color: C.muted },
  toggleModeLink: { color: C.primary, fontWeight: '700' },

  inputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1.5, borderColor: C.border, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 13,
    backgroundColor: C.inputBg,
  },
  input: { flex: 1, fontSize: 15, color: C.text, padding: 0 },

  signInBtn:     { backgroundColor: C.primary, borderRadius: 14, paddingVertical: 15, alignItems: 'center', justifyContent: 'center' },
  signInBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },

  exploreBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1.5, borderColor: C.primary, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 16 },
  exploreBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  exploreBtnText:  { fontSize: 14, fontWeight: '600', color: C.primary },

  footer:      { alignItems: 'center', gap: 4, paddingBottom: 20 },
  footerText:  { fontSize: 11, color: C.muted, textAlign: 'center', lineHeight: 18 },
  footerLink:  { color: C.primary, fontWeight: '600' },
  btnDisabled: { opacity: 0.5 },
});
