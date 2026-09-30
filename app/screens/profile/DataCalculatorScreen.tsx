import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
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
  bg:        '#FFFFFF',
  pageBg:    '#F8FAFB',
  primary:   '#016701',
  primaryL:  '#E6F4E6',
  primaryD:  '#014801',
  text:      '#0A0A0A',
  muted:     '#6B7280',
  border:    '#EAEEF2',
  yellow:    '#F59E0B',
  yellowBg:  '#FFFBEB',
};

type UsageItem = {
  id: string;
  icon: string;
  label: string;
  sublabel: string;
  mbPerUnit: number; // MB per "1 unit" (1 hour or as described)
  unit: string;
  step: number;
  max: number;
};

const USAGE_ITEMS: UsageItem[] = [
  { id: 'video_sd',  icon: 'video',          label: 'Video Streaming (SD)',  sublabel: 'e.g. YouTube 480p',    mbPerUnit: 250,   unit: 'hrs/day', step: 0.5, max: 12 },
  { id: 'video_hd',  icon: 'film',           label: 'Video Streaming (HD)',  sublabel: 'e.g. YouTube 1080p',   mbPerUnit: 1500,  unit: 'hrs/day', step: 0.5, max: 12 },
  { id: 'social',    icon: 'instagram',      label: 'Social Media',          sublabel: 'Scrolling, stories',   mbPerUnit: 90,    unit: 'hrs/day', step: 0.5, max: 12 },
  { id: 'maps',      icon: 'map-pin',        label: 'Navigation / Maps',     sublabel: 'GPS & map tiles',      mbPerUnit: 5,     unit: 'hrs/day', step: 0.5, max: 8  },
  { id: 'calls',     icon: 'phone-call',     label: 'Video Calls',           sublabel: 'e.g. WhatsApp, Zoom',  mbPerUnit: 540,   unit: 'hrs/day', step: 0.5, max: 8  },
  { id: 'music',     icon: 'music',          label: 'Music Streaming',       sublabel: 'e.g. Spotify 320kbps', mbPerUnit: 144,   unit: 'hrs/day', step: 0.5, max: 12 },
  { id: 'browsing',  icon: 'globe',          label: 'Web Browsing',          sublabel: 'General browsing',     mbPerUnit: 60,    unit: 'hrs/day', step: 0.5, max: 12 },
  { id: 'email',     icon: 'mail',           label: 'Email',                 sublabel: 'With attachments',     mbPerUnit: 20,    unit: 'hrs/day', step: 0.5, max: 8  },
];

const DAYS = 30;

function formatMB(mb: number): string {
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
  return `${Math.round(mb)} MB`;
}

function recommendedPlan(totalGB: number): { label: string; color: string; note: string } {
  if (totalGB < 1)   return { label: 'Starter 1 GB',    color: C.muted,    note: 'Light usage' };
  if (totalGB < 3)   return { label: 'Basic 3 GB',      color: '#3B82F6',  note: 'Casual browsing & socials' };
  if (totalGB < 7)   return { label: 'Standard 7 GB',   color: C.primary,  note: 'Balanced everyday use' };
  if (totalGB < 15)  return { label: 'Plus 15 GB',       color: C.yellow,   note: 'Heavy social & streaming' };
  if (totalGB < 30)  return { label: 'Pro 30 GB',        color: '#8B5CF6',  note: 'Daily HD video & calls' };
  return               { label: 'Unlimited',            color: '#EF4444',  note: 'Power user — go unlimited' };
}

function StepCounter({
  value, step, max, onChange,
}: { value: number; step: number; max: number; onChange: (v: number) => void }) {
  const dec = () => onChange(Math.max(0, parseFloat((value - step).toFixed(1))));
  const inc = () => onChange(Math.min(max, parseFloat((value + step).toFixed(1))));

  return (
    <View style={styles.stepper}>
      <TouchableOpacity onPress={dec} style={[styles.stepBtn, value === 0 && styles.stepBtnDisabled]}>
        <Feather name="minus" size={14} color={value === 0 ? C.muted : C.primary} />
      </TouchableOpacity>
      <Text style={styles.stepValue}>{value % 1 === 0 ? value.toFixed(0) : value.toFixed(1)}</Text>
      <TouchableOpacity onPress={inc} style={[styles.stepBtn, value === max && styles.stepBtnDisabled]}>
        <Feather name="plus" size={14} color={value === max ? C.muted : C.primary} />
      </TouchableOpacity>
    </View>
  );
}

export default function DataCalculatorScreen() {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, number>>(
    Object.fromEntries(USAGE_ITEMS.map(i => [i.id, 0]))
  );

  const set = (id: string, v: number) => setValues(prev => ({ ...prev, [id]: v }));

  // Total MB/month
  const totalMB = USAGE_ITEMS.reduce((sum, item) => {
    return sum + values[item.id] * item.mbPerUnit * DAYS;
  }, 0);
  const totalGB = totalMB / 1024;
  const plan = recommendedPlan(totalGB);

  const hasAny = Object.values(values).some(v => v > 0);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.pageBg} />

      {/* ── HEADER ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={C.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Data Calculator</Text>
        <TouchableOpacity
          style={styles.resetBtn}
          onPress={() => setValues(Object.fromEntries(USAGE_ITEMS.map(i => [i.id, 0])))}
        >
          <Feather name="refresh-cw" size={15} color={C.muted} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── HERO ── */}
        <View style={styles.hero}>
          <Feather name="activity" size={22} color={C.primary} />
          <Text style={styles.heroText}>
            Set your average daily usage below and we'll estimate how much data you need per month.
          </Text>
        </View>

        {/* ── USAGE ITEMS ── */}
        <View style={styles.card}>
          {USAGE_ITEMS.map((item, idx) => (
            <View key={item.id}>
              <View style={styles.row}>
                <View style={styles.rowIcon}>
                  <Feather name={item.icon as any} size={16} color={C.primary} />
                </View>
                <View style={styles.rowText}>
                  <Text style={styles.rowLabel}>{item.label}</Text>
                  <Text style={styles.rowSub}>{item.sublabel}</Text>
                  {values[item.id] > 0 && (
                    <Text style={styles.rowMB}>
                      ~{formatMB(values[item.id] * item.mbPerUnit)}/day
                    </Text>
                  )}
                </View>
                <View style={styles.rowRight}>
                  <StepCounter
                    value={values[item.id]}
                    step={item.step}
                    max={item.max}
                    onChange={v => set(item.id, v)}
                  />
                  <Text style={styles.unitLabel}>{item.unit}</Text>
                </View>
              </View>
              {idx < USAGE_ITEMS.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>

        {/* ── RESULT CARD ── */}
        <View style={[styles.resultCard, !hasAny && styles.resultCardEmpty]}>
          {!hasAny ? (
            <View style={styles.emptyState}>
              <Feather name="sliders" size={28} color={C.muted} />
              <Text style={styles.emptyText}>Adjust usage above to see your estimate</Text>
            </View>
          ) : (
            <>
              <Text style={styles.resultTitle}>Your Estimated Usage</Text>
              <View style={styles.resultMain}>
                <Text style={styles.resultGB}>{totalGB.toFixed(1)}</Text>
                <Text style={styles.resultGBLabel}>GB / month</Text>
              </View>

              {/* Usage breakdown bar */}
              <View style={styles.barTrack}>
                {USAGE_ITEMS.filter(i => values[i.id] > 0).map(item => {
                  const mb = values[item.id] * item.mbPerUnit * DAYS;
                  const pct = totalMB > 0 ? (mb / totalMB) * 100 : 0;
                  return (
                    <View
                      key={item.id}
                      style={[styles.barSegment, { flex: pct, backgroundColor: segColor(item.id) }]}
                    />
                  );
                })}
              </View>

              {/* Breakdown legend */}
              <View style={styles.breakdownGrid}>
                {USAGE_ITEMS.filter(i => values[i.id] > 0).map(item => {
                  const mb = values[item.id] * item.mbPerUnit * DAYS;
                  return (
                    <View key={item.id} style={styles.breakdownItem}>
                      <View style={[styles.breakdownDot, { backgroundColor: segColor(item.id) }]} />
                      <Text style={styles.breakdownLabel} numberOfLines={1}>{item.label.split(' ')[0]}</Text>
                      <Text style={styles.breakdownVal}>{formatMB(mb)}</Text>
                    </View>
                  );
                })}
              </View>

              {/* Plan recommendation */}
              <View style={[styles.planBox, { borderColor: plan.color + '33', backgroundColor: plan.color + '0D' }]}>
                <Feather name="package" size={15} color={plan.color} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.planLabel, { color: plan.color }]}>Recommended: {plan.label}</Text>
                  <Text style={styles.planNote}>{plan.note}</Text>
                </View>
                <Feather name="arrow-right" size={15} color={plan.color} />
              </View>
            </>
          )}
        </View>

        <Text style={styles.disclaimer}>
          * Estimates are approximate and may vary based on app quality settings, background sync, and network conditions.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// Deterministic color per usage type
const SEG_COLORS: Record<string, string> = {
  video_sd: '#016701', video_hd: '#014801', social: '#3B82F6',
  maps: '#F59E0B', calls: '#8B5CF6', music: '#EC4899',
  browsing: '#14B8A6', email: '#6B7280',
};
function segColor(id: string) { return SEG_COLORS[id] ?? C.primary; }

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.pageBg },
  scrollContent: { padding: 16, paddingBottom: 48, gap: 14 },

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
  resetBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: C.pageBg,
    alignItems: 'center', justifyContent: 'center',
  },

  // Hero
  hero: {
    flexDirection: 'row', gap: 10, alignItems: 'flex-start',
    backgroundColor: C.primaryL, borderRadius: 14,
    padding: 14,
  },
  heroText: { flex: 1, fontSize: 13, color: C.primary, lineHeight: 19 },

  // Card
  card: {
    backgroundColor: C.bg, borderRadius: 16,
    borderWidth: 1, borderColor: C.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 12, gap: 10,
  },
  rowIcon: {
    width: 34, height: 34, borderRadius: 9,
    backgroundColor: C.pageBg,
    alignItems: 'center', justifyContent: 'center',
  },
  rowText: { flex: 1, gap: 1 },
  rowLabel: { fontSize: 13, fontWeight: '600', color: C.text },
  rowSub:   { fontSize: 11, color: C.muted },
  rowMB:    { fontSize: 11, color: C.primary, fontWeight: '600', marginTop: 2 },
  rowRight: { alignItems: 'center', gap: 3 },
  unitLabel: { fontSize: 10, color: C.muted },
  divider:   { height: 1, backgroundColor: C.border, marginHorizontal: 14 },

  // Stepper
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  stepBtn: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: C.primaryL,
    alignItems: 'center', justifyContent: 'center',
  },
  stepBtnDisabled: { backgroundColor: C.pageBg },
  stepValue: {
    width: 32, textAlign: 'center',
    fontSize: 14, fontWeight: '700', color: C.text,
  },

  // Result
  resultCard: {
    backgroundColor: C.bg, borderRadius: 16,
    borderWidth: 1, borderColor: C.border,
    padding: 16, gap: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  resultCardEmpty: { paddingVertical: 32 },
  emptyState: { alignItems: 'center', gap: 10 },
  emptyText:  { fontSize: 13, color: C.muted, textAlign: 'center' },
  resultTitle: { fontSize: 12, fontWeight: '700', color: C.muted, textTransform: 'uppercase', letterSpacing: 0.8 },
  resultMain: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  resultGB:      { fontSize: 48, fontWeight: '800', color: C.primary, lineHeight: 52 },
  resultGBLabel: { fontSize: 16, color: C.muted, fontWeight: '500' },

  // Bar
  barTrack: {
    height: 10, borderRadius: 5, flexDirection: 'row', overflow: 'hidden',
    backgroundColor: C.pageBg,
  },
  barSegment: { height: '100%' },

  // Breakdown
  breakdownGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  breakdownItem: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: C.pageBg, borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  breakdownDot:   { width: 8, height: 8, borderRadius: 4 },
  breakdownLabel: { fontSize: 11, color: C.text, fontWeight: '600', maxWidth: 70 },
  breakdownVal:   { fontSize: 11, color: C.muted },

  // Plan
  planBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1, borderRadius: 12, padding: 12,
  },
  planLabel: { fontSize: 13, fontWeight: '700' },
  planNote:  { fontSize: 11, color: C.muted, marginTop: 1 },

  // Disclaimer
  disclaimer: { fontSize: 11, color: C.muted, textAlign: 'center', lineHeight: 16, paddingHorizontal: 8 },
});