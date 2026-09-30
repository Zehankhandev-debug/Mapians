import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { profileApi } from '../scripts/api';

const C = {
  bg:       '#FFFFFF',
  pageBg:   '#F8FAFB',
  primary:  '#016701',
  text:     '#0A0A0A',
  muted:    '#6B7280',
  border:   '#EAEEF2',
  red:      '#DC2626',
  green:    '#016701',
  greenBg:  '#F0FDF4',
  inputBg:  '#F8FAFB',
};

export default function EditProfileScreen() {
  const router = useRouter();
  const { profile, refreshProfile } = useAuth();

  const [firstname,      setFirstname]      = useState(profile?.firstname ?? '');
  const [lastname,       setLastname]       = useState(profile?.lastname  ?? '');
  const [email,          setEmail]          = useState(profile?.email     ?? '');
  const [currentPw,      setCurrentPw]      = useState('');
  const [newPw,          setNewPw]          = useState('');
  const [confirmPw,      setConfirmPw]      = useState('');
  const [showCurrentPw,  setShowCurrentPw]  = useState(false);
  const [showNewPw,      setShowNewPw]      = useState(false);
  const [showConfirmPw,  setShowConfirmPw]  = useState(false);
  const [saving,         setSaving]         = useState(false);

  // Sync fields when profile loads (e.g. after AuthContext bootstrap)
  useEffect(() => {
    if (profile) {
      setFirstname(profile.firstname);
      setLastname(profile.lastname);
      setEmail(profile.email);
    }
  }, [profile]);

  const handleSaveProfile = async () => {
    if (!firstname.trim()) return Alert.alert('Error', 'First name cannot be empty.');
    if (!email.trim())     return Alert.alert('Error', 'Email cannot be empty.');
    setSaving(true);
    try {
      await profileApi.updateProfile({
        firstname: firstname.trim(),
        lastname:  lastname.trim(),
        email:     email.trim(),
      });
      await refreshProfile();
      Alert.alert('Saved', 'Profile updated.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = () => {
    if (!currentPw)       return Alert.alert('Error', 'Enter your current password.');
    if (newPw.length < 8) return Alert.alert('Error', 'New password must be at least 8 characters.');
    if (newPw !== confirmPw) return Alert.alert('Error', 'Passwords do not match.');
    Alert.alert('Success', 'Password changed.', [
      { text: 'OK', onPress: () => { setCurrentPw(''); setNewPw(''); setConfirmPw(''); } },
    ]);
  };

  const initials = ((firstname[0] ?? '') + (lastname[0] ?? '')).toUpperCase() || '?';

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.pageBg} />

      {/* ── HEADER ── */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Feather name="arrow-left" size={20} color={C.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Edit profile</Text>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* ── AVATAR ── */}
          <View style={s.avatarRow}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>{initials}</Text>
            </View>
            <TouchableOpacity style={s.changePhotoBtn} activeOpacity={0.75}>
              <Feather name="camera" size={14} color={C.primary} />
              <Text style={s.changePhotoText}>Change photo</Text>
            </TouchableOpacity>
          </View>

          {/* ── PERSONAL INFO ── */}
          <Text style={s.sectionTitle}>Personal info</Text>
          <View style={s.card}>
            <Text style={s.label}>First name</Text>
            <TextInput
              style={s.input}
              value={firstname}
              onChangeText={setFirstname}
              placeholder="First name"
              placeholderTextColor={C.muted}
              autoCapitalize="words"
            />
            <View style={s.divider} />
            <Text style={s.label}>Last name</Text>
            <TextInput
              style={s.input}
              value={lastname}
              onChangeText={setLastname}
              placeholder="Last name"
              placeholderTextColor={C.muted}
              autoCapitalize="words"
            />
            <View style={s.divider} />
            <Text style={s.label}>Email address</Text>
            <TextInput
              style={s.input}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={C.muted}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          <TouchableOpacity
            style={[s.primaryBtn, saving && { opacity: 0.6 }]}
            activeOpacity={0.8}
            onPress={handleSaveProfile}
            disabled={saving}
          >
            <Text style={s.primaryBtnText}>{saving ? 'Saving…' : 'Save changes'}</Text>
          </TouchableOpacity>

          {/* ── CHANGE PASSWORD ── */}
          <Text style={[s.sectionTitle, { marginTop: 20 }]}>Change password</Text>
          <View style={s.card}>
            <Text style={s.label}>Current password</Text>
            <View style={s.pwRow}>
              <TextInput style={s.pwInput} value={currentPw} onChangeText={setCurrentPw} placeholder="••••••••" placeholderTextColor={C.muted} secureTextEntry={!showCurrentPw} />
              <TouchableOpacity onPress={() => setShowCurrentPw(v => !v)} activeOpacity={0.7}>
                <Feather name={showCurrentPw ? 'eye-off' : 'eye'} size={18} color={C.muted} />
              </TouchableOpacity>
            </View>
            <View style={s.divider} />
            <Text style={s.label}>New password</Text>
            <View style={s.pwRow}>
              <TextInput style={s.pwInput} value={newPw} onChangeText={setNewPw} placeholder="Min. 8 characters" placeholderTextColor={C.muted} secureTextEntry={!showNewPw} />
              <TouchableOpacity onPress={() => setShowNewPw(v => !v)} activeOpacity={0.7}>
                <Feather name={showNewPw ? 'eye-off' : 'eye'} size={18} color={C.muted} />
              </TouchableOpacity>
            </View>
            <View style={s.divider} />
            <Text style={s.label}>Confirm new password</Text>
            <View style={s.pwRow}>
              <TextInput style={s.pwInput} value={confirmPw} onChangeText={setConfirmPw} placeholder="Re-enter new password" placeholderTextColor={C.muted} secureTextEntry={!showConfirmPw} />
              <TouchableOpacity onPress={() => setShowConfirmPw(v => !v)} activeOpacity={0.7}>
                <Feather name={showConfirmPw ? 'eye-off' : 'eye'} size={18} color={C.muted} />
              </TouchableOpacity>
            </View>
          </View>
          <TouchableOpacity style={s.primaryBtn} activeOpacity={0.8} onPress={handleChangePassword}>
            <Text style={s.primaryBtnText}>Update password</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: C.pageBg },
  scroll: { flex: 1 },
  content:{ padding: 16, paddingBottom: 40 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: C.pageBg, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  backBtn:     { width: 36, height: 36, borderRadius: 10, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
  headerTitle: { fontSize: 16, fontWeight: '700', color: C.text },

  avatarRow:      { alignItems: 'center', paddingVertical: 20, gap: 10 },
  avatar:         { width: 72, height: 72, borderRadius: 36, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText:     { fontSize: 24, fontWeight: '800', color: '#FFF' },
  changePhotoBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: C.primary, backgroundColor: C.greenBg },
  changePhotoText:{ fontSize: 13, fontWeight: '600', color: C.primary },

  sectionTitle: { fontSize: 11, fontWeight: '700', color: C.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },

  card: {
    backgroundColor: C.bg, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: C.border, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  label:   { fontSize: 11, fontWeight: '700', color: C.muted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 },
  input:   { fontSize: 15, color: C.text, backgroundColor: C.inputBg, borderRadius: 10, borderWidth: 1, borderColor: C.border, paddingHorizontal: 12, paddingVertical: 10 },
  divider: { height: 1, backgroundColor: C.border, marginVertical: 12 },

  pwRow:   { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.inputBg, borderRadius: 10, borderWidth: 1, borderColor: C.border, paddingHorizontal: 12, paddingVertical: 10 },
  pwInput: { flex: 1, fontSize: 15, color: C.text },

  primaryBtn:     { backgroundColor: C.primary, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginBottom: 4 },
  primaryBtnText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
});
