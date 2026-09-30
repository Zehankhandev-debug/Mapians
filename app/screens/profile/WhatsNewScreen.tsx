import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const C = {
  bg:       '#FFFFFF',
  pageBg:   '#F8FAFB',
  primary:  '#016701',
  primaryL: '#E6F4E6',
  text:     '#0A0A0A',
  muted:    '#6B7280',
  border:   '#EAEEF2',
  yellow:   '#F59E0B',
  yellowBg: '#FFFBEB',
  blue:     '#3B82F6',
  blueBg:   '#EFF6FF',
  red:      '#EF4444',
  redBg:    '#FEF2F2',
};

type ChangeTag = 'new' | 'improved' | 'fixed';

type ChangeItem = {
  tag: ChangeTag;
  text: string;
};

type Release = {
  version: string;
  date: string;
  highlight?: string;
  changes: ChangeItem[];
};

const RELEASES: Release[] = [
  {
    version: '1.0.0',
    date: 'April 2025',
    highlight: "Welcome to Mapians! Here's everything in your first release.",
    changes: [
      { tag: 'new',      text: 'Live Chat Support with multilingual agents' },
      { tag: 'new',      text: 'Push notification controls for data, expiry & promos' },
      { tag: 'new',      text: 'Data Calculator — estimate usage by activity type' },
      { tag: 'new',      text: 'Profile screen with account management' },
      { tag: 'new',      text: 'Browse and purchase data plans by region' },
      { tag: 'new',      text: 'Activation confirmation and QR code support' },
    ],
  },
  {
    version: '0.9.0 (Beta)',
    date: 'March 2025',
    changes: [
      { tag: 'new',      text: 'eSIM provisioning for 80+ countries' },
      { tag: 'new',      text: 'Plan auto-renewal with configurable thresholds' },
      { tag: 'improved', text: 'Faster checkout flow — reduced to 3 steps' },
      { tag: 'fixed',    text: 'Fixed crash on Android 12 during plan activation' },
    ],
  },
  {
    version: '0.8.0 (Beta)',
    date: 'February 2025',
    changes: [
      { tag: 'new',      text: 'Referral rewards program launched' },
      { tag: 'improved', text: 'Redesigned onboarding for first-time users' },
      { tag: 'improved', text: 'Improved data usage chart accuracy' },
      { tag: 'fixed',    text: 'Fixed notification delivery delay on iOS 17' },
      { tag: 'fixed',    text: 'Resolved payment timeout on slow networks' },
    ],
  },
];

const TAG_META: Record<ChangeTag, { label: string; color: string; bg: string; icon: string }> = {
  new:      { label: 'New',      color: C.primary, bg: C.primaryL, icon: 'plus-circle' },
  improved: { label: 'Improved', color: C.blue,    bg: C.blueBg,   icon: 'arrow-up-circle' },
  fixed:    { label: 'Fixed',    color: C.red,     bg: C.redBg,    icon: 'tool' },
};

function TagBadge({ tag }: { tag: ChangeTag }) {
  const meta = TAG_META[tag];
  return (
    <View style={[styles.badge, { backgroundColor: meta.bg }]}>
      <Text style={[styles.badgeText, { color: meta.color }]}>{meta.label}</Text>
    </View>
  );
}

export default function WhatsNewScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.pageBg} />

      {/* ── HEADER ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={C.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>What's New</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── HERO ── */}
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Feather name="star" size={28} color={C.primary} />
          </View>
          <Text style={styles.heroTitle}>Mapians Updates</Text>
          <Text style={styles.heroSub}>See what's changed and what's been added</Text>
        </View>

        {/* ── TAG LEGEND ── */}
        <View style={styles.legend}>
          {(Object.keys(TAG_META) as ChangeTag[]).map(tag => {
            const meta = TAG_META[tag];
            return (
              <View key={tag} style={styles.legendItem}>
                <Feather name={meta.icon as any} size={13} color={meta.color} />
                <Text style={[styles.legendText, { color: meta.color }]}>{meta.label}</Text>
              </View>
            );
          })}
        </View>

        {/* ── RELEASES ── */}
        {RELEASES.map((release, ri) => (
          <View key={release.version} style={styles.releaseBlock}>
            {/* Version header */}
            <View style={styles.versionHeader}>
              <View style={styles.versionDot} />
              <View style={styles.versionMeta}>
                <View style={styles.versionRow}>
                  <Text style={styles.versionNum}>{release.version}</Text>
                  {ri === 0 && (
                    <View style={styles.latestBadge}>
                      <Text style={styles.latestBadgeText}>Latest</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.versionDate}>{release.date}</Text>
              </View>
            </View>

            {/* Highlight note */}
            {release.highlight && (
              <View style={styles.highlightBox}>
                <Feather name="info" size={13} color={C.primary} />
                <Text style={styles.highlightText}>{release.highlight}</Text>
              </View>
            )}

            {/* Change items */}
            <View style={styles.changeList}>
              {release.changes.map((change, ci) => (
                <View key={ci} style={styles.changeRow}>
                  <TagBadge tag={change.tag} />
                  <Text style={styles.changeText}>{change.text}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}

        <Text style={styles.footer}>You're on version 1.0.0 — fully up to date.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.pageBg },
  scrollContent: { padding: 16, paddingBottom: 48, gap: 16 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: C.bg,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: C.pageBg,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: C.text },

  // Hero
  hero: {
    alignItems: 'center', paddingVertical: 24, gap: 8,
    backgroundColor: C.bg, borderRadius: 20,
    borderWidth: 1, borderColor: C.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  heroIcon: {
    width: 60, height: 60, borderRadius: 18,
    backgroundColor: C.primaryL,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  heroTitle: { fontSize: 20, fontWeight: '800', color: C.text },
  heroSub:   { fontSize: 14, color: C.muted },

  // Legend
  legend: {
    flexDirection: 'row', gap: 8, flexWrap: 'wrap',
    paddingHorizontal: 4,
  },
  legendItem: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: C.bg, borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: C.border,
  },
  legendText: { fontSize: 12, fontWeight: '600' },

  // Release block
  releaseBlock: {
    backgroundColor: C.bg, borderRadius: 16,
    borderWidth: 1, borderColor: C.border,
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  versionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 16, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  versionDot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: C.primary,
  },
  versionMeta: { flex: 1 },
  versionRow:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  versionNum:  { fontSize: 15, fontWeight: '800', color: C.text },
  versionDate: { fontSize: 12, color: C.muted, marginTop: 2 },
  latestBadge: {
    backgroundColor: C.primaryL, borderRadius: 20,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  latestBadgeText: { fontSize: 11, fontWeight: '700', color: C.primary },

  // Highlight
  highlightBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: C.primaryL,
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  highlightText: { flex: 1, fontSize: 13, color: C.primary, lineHeight: 18 },

  // Changes
  changeList: { padding: 12, gap: 8 },
  changeRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
  },
  badge: {
    borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2,
    alignSelf: 'flex-start', marginTop: 1,
  },
  badgeText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
  changeText: { flex: 1, fontSize: 13, color: C.text, lineHeight: 19 },

  footer: {
    fontSize: 12, color: C.muted, textAlign: 'center', marginTop: 4,
  },
});