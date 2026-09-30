import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Linking,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const C = {
  bg:      '#FFFFFF',
  pageBg:  '#F8FAFB',
  primary: '#016701',
  text:    '#0A0A0A',
  muted:   '#6B7280',
  border:  '#EAEEF2',
  greenBg: '#EBF5EB',
};

export default function HelpScreen() {
  const router = useRouter();

  const helpItems = [
    {
      icon:    'help-circle',
      lib:     'feather',
      label:   'View help center',
      type:    'external',
      onPress: () => Linking.openURL('https://mapians.com/help'),
    },
    {
      icon:    'message-square',
      lib:     'feather',
      label:   'Support Tickets',
      type:    'arrow',
      onPress: () => router.push('/screens/profile/SupportTicketsScreen' as any),
    },
    {
      icon:    'credit-card',
      lib:     'feather',
      label:   'Request a refund',
      type:    'arrow',
      onPress: () => router.push('/screens/profile/SupportTicketsScreen' as any),
    },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.pageBg} />

      <View style={styles.container}>

        {/* ── TOP SPACER ─────────────────────────────────────── */}
        <View style={styles.topSpacer} />

        {/* ── ICON ───────────────────────────────────────────── */}
        <View style={styles.iconCircle}>
          <View style={styles.iconInner}>
            <Feather name="help-circle" size={36} color={C.text} />
          </View>
        </View>

        {/* ── HEADING ────────────────────────────────────────── */}
        <Text style={styles.title}>Any issues?</Text>
        <Text style={styles.subtitle}>We'll try to help you.</Text>

        {/* ── MIDDLE SPACER ──────────────────────────────────── */}
        <View style={styles.midSpacer} />

        {/* ── HELP OPTIONS ───────────────────────────────────── */}
        <View style={styles.optionsList}>
          {helpItems.map((item, i) => (
            <TouchableOpacity
              key={i}
              style={styles.optionRow}
              activeOpacity={0.75}
              onPress={item.onPress}
            >
              {/* Left icon */}
              <View style={styles.optionIconWrap}>
                <Feather name={item.icon} size={18} color={C.primary} />
              </View>

              {/* Label */}
              <Text style={styles.optionLabel}>{item.label}</Text>

              {/* Right icon */}
              {item.type === 'external'
                ? <Feather name="external-link" size={16} color={C.muted} />
                : <Feather name="chevron-right" size={18} color={C.muted} />
              }
            </TouchableOpacity>
          ))}
        </View>

        {/* ── BOTTOM SPACER ──────────────────────────────────── */}
        <View style={styles.bottomSpacer} />

        {/* ── FOOTER ─────────────────────────────────────────── */}
        <Text style={styles.footer}>
          You can also reach us at{' '}
          <Text
            style={styles.footerLink}
            onPress={() => Linking.openURL('mailto:support@mapians.com')}
          >
            support@mapians.com
          </Text>
        </Text>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.pageBg,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
  },

  topSpacer: {
    height: 60,
  },
  midSpacer: {
    height: 40,
  },
  bottomSpacer: {
    flex: 1,
  },

  // Big icon circle
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: C.greenBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  iconInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: C.text,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Heading
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: C.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: C.muted,
    textAlign: 'center',
  },

  // Options list
  optionsList: {
    width: '100%',
    gap: 12,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.bg,
    borderRadius: 16,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  optionIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: C.greenBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: C.text,
  },

  // Footer
  footer: {
    fontSize: 12,
    color: C.muted,
    textAlign: 'center',
    paddingBottom: 28,
    lineHeight: 18,
  },
  footerLink: {
    color: C.primary,
    fontWeight: '600',
  },
});