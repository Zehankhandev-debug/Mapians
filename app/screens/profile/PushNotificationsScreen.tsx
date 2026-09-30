import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Switch,
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
};

type NotifItem = {
  id: string;
  icon: string;
  label: string;
  desc: string;
};

type Section = {
  title: string;
  items: NotifItem[];
};

const SECTIONS: Section[] = [
  {
    title: 'Data & Usage',
    items: [
      { id: 'low_data',    icon: 'alert-triangle', label: 'Low Data Alert',       desc: 'Notify when your data drops below 20%' },
      { id: 'daily_usage', icon: 'bar-chart-2',    label: 'Daily Usage Summary',  desc: 'Get a daily digest of your data usage' },
      { id: 'speed',       icon: 'zap',            label: 'Speed Throttling',     desc: 'Notify when your speed is reduced' },
    ],
  },
  {
    title: 'Plan & Expiry',
    items: [
      { id: 'expiry',       icon: 'calendar',    label: 'Expiry Warning',       desc: 'Remind you 3 days before plan expires' },
      { id: 'auto_renew',   icon: 'refresh-cw',  label: 'Auto-Renewal Notice',  desc: 'Confirm when your plan auto-renews' },
      { id: 'activation',   icon: 'check-circle',label: 'Activation Confirmed', desc: 'Notify when a new plan is activated' },
    ],
  },
  {
    title: 'Offers & Promos',
    items: [
      { id: 'promo',        icon: 'tag',         label: 'Promo Offers',         desc: 'Exclusive deals and limited-time offers' },
      { id: 'new_plan',     icon: 'package',     label: 'New Plans Available',  desc: 'When new data packages launch in your area' },
      { id: 'referral',     icon: 'users',       label: 'Referral Rewards',     desc: 'Updates on your referral bonuses' },
    ],
  },
];

export default function PushNotificationsScreen() {
  const router = useRouter();
  const [enabled, setEnabled] = useState<Record<string, boolean>>({
    low_data:   true,
    daily_usage: false,
    speed:       true,
    expiry:      true,
    auto_renew:  true,
    activation:  true,
    promo:       false,
    new_plan:    false,
    referral:    false,
  });
  const [masterEnabled, setMasterEnabled] = useState(true);

  const toggle = (id: string) =>
    setEnabled(prev => ({ ...prev, [id]: !prev[id] }));

  const toggleAll = (val: boolean) => {
    setMasterEnabled(val);
    if (!val) setEnabled(Object.fromEntries(Object.keys(enabled).map(k => [k, false])));
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.pageBg} />

      {/* ── HEADER ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={C.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Push Notifications</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── MASTER TOGGLE ── */}
        <View style={styles.masterCard}>
          <View style={styles.masterLeft}>
            <View style={styles.masterIcon}>
              <Feather name="bell" size={20} color={masterEnabled ? C.primary : C.muted} />
            </View>
            <View>
              <Text style={styles.masterLabel}>All Notifications</Text>
              <Text style={styles.masterDesc}>
                {masterEnabled ? 'Notifications are on' : 'All notifications muted'}
              </Text>
            </View>
          </View>
          <Switch
            value={masterEnabled}
            onValueChange={toggleAll}
            trackColor={{ false: C.border, true: C.primaryL }}
            thumbColor={masterEnabled ? C.primary : '#D1D5DB'}
          />
        </View>

        {/* ── SECTIONS ── */}
        {SECTIONS.map(section => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.card}>
              {section.items.map((item, idx) => (
                <View key={item.id}>
                  <View style={styles.row}>
                    <View style={styles.rowIcon}>
                      <Feather name={item.icon as any} size={16} color={C.primary} />
                    </View>
                    <View style={styles.rowText}>
                      <Text style={styles.rowLabel}>{item.label}</Text>
                      <Text style={styles.rowDesc}>{item.desc}</Text>
                    </View>
                    <Switch
                      value={masterEnabled && !!enabled[item.id]}
                      onValueChange={() => toggle(item.id)}
                      disabled={!masterEnabled}
                      trackColor={{ false: C.border, true: C.primaryL }}
                      thumbColor={(masterEnabled && enabled[item.id]) ? C.primary : '#D1D5DB'}
                    />
                  </View>
                  {idx < section.items.length - 1 && <View style={styles.divider} />}
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* ── FOOTER NOTE ── */}
        <View style={styles.footerNote}>
          <Feather name="info" size={13} color={C.muted} />
          <Text style={styles.footerNoteText}>
            You can also manage notification permissions in your phone's Settings app.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:  { flex: 1, backgroundColor: C.pageBg },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40, gap: 16 },

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

  // Master toggle
  masterCard: {
    backgroundColor: C.bg, borderRadius: 16,
    padding: 16, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: C.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  masterLeft:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  masterIcon: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: C.pageBg,
    alignItems: 'center', justifyContent: 'center',
  },
  masterLabel: { fontSize: 15, fontWeight: '700', color: C.text },
  masterDesc:  { fontSize: 12, color: C.muted, marginTop: 2 },

  // Sections
  section:      { gap: 8 },
  sectionTitle: {
    fontSize: 11, fontWeight: '700', color: C.muted,
    textTransform: 'uppercase', letterSpacing: 0.8,
    paddingHorizontal: 4,
  },
  card: {
    backgroundColor: C.bg, borderRadius: 16,
    borderWidth: 1, borderColor: C.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, gap: 12,
  },
  rowIcon: {
    width: 34, height: 34, borderRadius: 9,
    backgroundColor: C.pageBg,
    alignItems: 'center', justifyContent: 'center',
  },
  rowText:  { flex: 1, gap: 2 },
  rowLabel: { fontSize: 14, fontWeight: '600', color: C.text },
  rowDesc:  { fontSize: 12, color: C.muted },
  divider:  { height: 1, backgroundColor: C.border, marginHorizontal: 16 },

  // Footer
  footerNote: {
    flexDirection: 'row', gap: 8,
    backgroundColor: C.bg, borderRadius: 12,
    padding: 14, borderWidth: 1, borderColor: C.border,
    alignItems: 'flex-start',
  },
  footerNoteText: { flex: 1, fontSize: 12, color: C.muted, lineHeight: 18 },
});