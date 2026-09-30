import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Alert,
  Linking,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useState } from 'react';
import { CurrencyPickerModal } from '../../components/CurrencyPickerModal';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext';

const C = {
  bg:      '#FFFFFF',
  pageBg:  '#F8FAFB',
  primary: '#016701',
  text:    '#0A0A0A',
  muted:   '#6B7280',
  border:  '#EAEEF2',
  red:     '#DC2626',
  redBg:   '#FEF2F2',
  green:   '#016701',
  greenBg: '#F0FDF4',
};

type MenuItem = {
  icon: string;
  label: string;
  sublabel: string | null;
  color: string;
  arrow: boolean;
  onPress: () => void;
};

type Section = {
  title: string;
  items: MenuItem[];
};

function MenuRow({ item }: { item: MenuItem }) {
  return (
    <TouchableOpacity style={styles.menuRow} activeOpacity={0.75} onPress={item.onPress}>
      <View style={styles.menuIconWrap}>
        <Feather name={item.icon as any} size={18} color={item.color} />
      </View>
      <View style={styles.menuTextWrap}>
        <Text style={styles.menuLabel}>{item.label}</Text>
        {item.sublabel ? <Text style={styles.menuSublabel}>{item.sublabel}</Text> : null}
      </View>
      {item.arrow && <Feather name="chevron-right" size={18} color={C.muted} />}
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { currencyOption } = useCurrency();
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);

  // ── Try/catch useAuth so we can see if it throws ──────────
  let authContext: ReturnType<typeof useAuth> | null = null;
  try {
    authContext = useAuth();
  } catch (e) {
    console.error('useAuth error:', e);
  }

  const logout   = authContext?.logout;
  const profile  = authContext?.profile;
  const isLoading = authContext?.isLoading ?? false;

  // ── Derived display name & initials ──────────────────────
  const displayName  = profile
    ? `${profile.firstname} ${profile.lastname}`.trim()
    : 'User';
  const displayEmail = profile?.email ?? '';
  const initials     = displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // ── Logout handler ────────────────────────────────────────
  const handleLogout = () => {
    console.log('handleLogout called, logout fn:', typeof logout);
    Alert.alert(
      'Log out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log out',
          style: 'destructive',
          onPress: async () => {
            console.log('Logout confirmed');
            try {
              if (logout) {
                await logout();
              }
              console.log('Logout done, navigating to /');
              router.replace('/(tabs)');
            } catch (err) {
              console.error('Logout error:', err);
              router.replace('/(tabs)');
            }
          },
        },
      ]
    );
  };

  const sections: Section[] = [
    {
      title: 'Preferences',
      items: [
        {
          icon:     'dollar-sign',
          label:    'Currency',
          sublabel: `${currencyOption.code} — ${currencyOption.label}`,
          color:    '#0A0A0A',
          arrow:    true,
          onPress:  () => setShowCurrencyPicker(true),
        },
      ],
    },
    {
      title: 'Billing',
      items: [
        {
          icon:     'credit-card',
          label:    'Payment History',
          sublabel: 'Past orders, invoices & receipts',
          color:    '#0A0A0A',
          arrow:    true,
          onPress:  () => router.push('/PaymentHistoryScreen'),
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          icon:     'message-circle',
          label:    'Support Tickets',
          sublabel: 'Raise an issue & track replies',
          color:    '#0A0A0A',
          arrow:    true,
          onPress:  () => router.push('/screens/profile/SupportTicketsScreen' as any),
        },
      ],
    },
    {
      title: 'App',
      items: [
        {
          icon:     'star',
          label:    "What's New",
          sublabel: 'Changelog & new features',
          color:    '#0A0A0A',
          arrow:    true,
          onPress:  () => router.push('/screens/profile/WhatsNewScreen'),
        },
        {
          icon:     'briefcase',
          label:    'Sign up for Mapians Business',
          sublabel: null,
          color:    '#0A0A0A',
          arrow:    true,
          onPress:  () => Alert.alert('Business', 'Opening business signup...'),
        },
      ],
    },
    {
      title: 'Legal',
      items: [
        {
          icon:     'file-text',
          label:    'Terms of service',
          sublabel: null,
          color:    '#0A0A0A',
          arrow:    true,
          onPress:  () => Linking.openURL('https://mapians.com/privacy-policy'),
        },
        {
          icon:     'shield',
          label:    'Privacy policy',
          sublabel: null,
          color:    '#0A0A0A',
          arrow:    true,
          onPress:  () => Linking.openURL('https://mapians.com/privacy-policy'),
        },
      ],
    },
    {
      title: 'Account',
      items: [
        {
          icon:     'trash-2',
          label:    'Delete my account',
          sublabel: null,
          color:    '#0A0A0A',
          arrow:    false,
          onPress:  () =>
            Alert.alert(
              'Delete Account',
              'Are you sure you want to delete your account? This action cannot be undone.',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => {} },
              ]
            ),
        },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.pageBg} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>Profile</Text>

        {/* ── USER CARD ── */}
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{displayName}</Text>
            <Text style={styles.userEmail}>{displayEmail}</Text>
          </View>
          <TouchableOpacity
            style={styles.editBtn}
            activeOpacity={0.75}
            onPress={() => router.push('/EditProfileScreen')}
          >
            <Feather name="edit-2" size={14} color={C.primary} />
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* ── SECTIONS ── */}
        {sections.map((section, si) => (
          <View key={si} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.menuList}>
              {section.items.map((item, ii) => (
                <MenuRow key={ii} item={item} />
              ))}
            </View>
          </View>
        ))}

        {/* ── LOG OUT ── */}
        <TouchableOpacity
          style={styles.menuRow}
          activeOpacity={0.75}
          onPress={handleLogout}
        >
          <View style={styles.menuIconWrap}>
            <Feather name="log-out" size={18} color={C.red} />
          </View>
          <View style={styles.menuTextWrap}>
            <Text style={[styles.menuLabel, styles.logoutLabel]}>Log out</Text>
          </View>
        </TouchableOpacity>

        <Text style={styles.version}>App version: 1.0.0</Text>
      </ScrollView>

      <CurrencyPickerModal
        visible={showCurrencyPicker}
        onClose={() => setShowCurrencyPicker(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: C.pageBg },
  scroll:        { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40, gap: 12 },

  pageTitle: { fontSize: 20, fontWeight: '800', color: C.text, textAlign: 'center', marginBottom: 4 },

  userCard: {
    backgroundColor: C.bg, borderRadius: 16, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderWidth: 1, borderColor: C.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  avatar:     { width: 52, height: 52, borderRadius: 26, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, fontWeight: '800', color: C.bg },
  userInfo:   { flex: 1, gap: 3 },
  userName:   { fontSize: 16, fontWeight: '700', color: C.text },
  userEmail:  { fontSize: 13, color: C.muted },

  editBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 10, borderWidth: 1, borderColor: C.primary, backgroundColor: C.greenBg,
  },
  editBtnText: { fontSize: 13, fontWeight: '600', color: C.primary },

  section:      { gap: 6 },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: C.muted, textTransform: 'uppercase', letterSpacing: 0.8, paddingHorizontal: 4 },
  menuList:     { gap: 10 },

  menuRow: {
    backgroundColor: C.bg, borderRadius: 16, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderWidth: 1, borderColor: C.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  menuIconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.pageBg, alignItems: 'center', justifyContent: 'center' },
  menuTextWrap: { flex: 1, gap: 2 },
  menuLabel:    { fontSize: 15, fontWeight: '500', color: C.text },
  menuSublabel: { fontSize: 12, color: C.muted, fontWeight: '400' },
  logoutLabel:  { color: C.red, fontWeight: '600' },

  version: { fontSize: 12, color: C.muted, textAlign: 'center', marginTop: 8 },
});