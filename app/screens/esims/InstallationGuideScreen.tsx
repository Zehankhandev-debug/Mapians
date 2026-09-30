import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const C = {
  bg:       '#FFFFFF',
  pageBg:   '#F8FAFB',
  primary:  '#016701',
  primaryL: '#E6F4E6',
  text:     '#0A0A0A',
  muted:    '#6B7280',
  border:   '#EAEEF2',
  red:      '#DC2626',
  redBg:    '#FEF2F2',
  amber:    '#D97706',
  amberBg:  '#FFFBEB',
  blue:     '#2563EB',
  blueBg:   '#EFF6FF',
  green:    '#16A34A',
  greenBg:  '#F0FDF4',
};

// ── TYPES ──────────────────────────────────────────────────────────────────

type ChecklistItem = {
  id: string;
  icon: string;
  label: string;
  desc: string;
};

const CHECKLIST: ChecklistItem[] = [
  { id: 'wifi',    icon: 'wifi',         label: 'Stable WiFi Connection',  desc: 'You are on a stable WiFi connection' },
  { id: 'airplane',icon: 'wind',         label: 'Airplane Mode OFF',       desc: 'Airplane mode is OFF for your device' },
  { id: 'qr',      icon: 'maximize',     label: 'QR Code Ready',           desc: 'Send QR code to another device near you' },
  { id: 'device',  icon: 'smartphone',   label: 'Second Device Ready',     desc: 'Laptop, tablet, or friend\'s phone to scan' },
  { id: 'screen',  icon: 'monitor',      label: 'Keep Screen Awake',       desc: 'Screen should not go dark during process' },
];

type StepId = 'pre-setup' | 'activation' | 'ios-config' | 'roaming' | 'validity';

const STEPS: { id: StepId; label: string; sub: string }[] = [
  { id: 'pre-setup',   label: 'Pre-Setup',   sub: 'Requirements' },
  { id: 'activation',  label: 'Activation',  sub: 'Scan QR Code' },
  { id: 'ios-config',  label: 'iOS Settings',sub: 'Default Config' },
  { id: 'roaming',     label: 'Roaming',     sub: 'Avoid Charges' },
  { id: 'validity',    label: 'Validity',    sub: '28 Days' },
];

// ── SECTION COMPONENTS ─────────────────────────────────────────────────────

function SectionHeader({ num, title }: { num: number; title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionNum}>
        <Text style={styles.sectionNumText}>{num}</Text>
      </View>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function InfoBox({ color, bg, icon, title, body }: {
  color: string; bg: string; icon: string; title: string; body: string;
}) {
  return (
    <View style={[styles.infoBox, { backgroundColor: bg, borderColor: color + '30' }]}>
      <Feather name={icon as any} size={15} color={color} style={{ marginTop: 1 }} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.infoBoxTitle, { color: C.text }]}>{title}</Text>
        <Text style={styles.infoBoxBody}>{body}</Text>
      </View>
    </View>
  );
}

function SettingRow({ icon, iconColor, iconBg, label, sub, valueLabel, valueColor, critical }: {
  icon: string; iconColor: string; iconBg: string;
  label: string; sub?: string;
  valueLabel: string; valueColor: string;
  critical?: boolean;
}) {
  return (
    <View style={[styles.settingRow, critical && { borderColor: C.red + '40', borderWidth: 1.5 }]}>
      <View style={[styles.settingIcon, { backgroundColor: iconBg }]}>
        <Feather name={icon as any} size={15} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.settingLabel}>{label}</Text>
        {sub && <Text style={styles.settingSub}>{sub}</Text>}
      </View>
      <View style={[styles.settingValue, { backgroundColor: valueColor + '18' }]}>
        <Text style={[styles.settingValueText, { color: valueColor }]}>{valueLabel}</Text>
      </View>
    </View>
  );
}

// ── MAIN COMPONENT ─────────────────────────────────────────────────────────

export default function InstallationGuideScreen() {
  const router = useRouter();
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [activeStep, setActiveStep] = useState<StepId>('pre-setup');
  const scrollRef = useRef<ScrollView>(null);

  const checkedCount = Object.values(checked).filter(Boolean).length;
  const checklistPct = Math.round((checkedCount / CHECKLIST.length) * 100);

  const toggleCheck = (id: string) =>
    setChecked(prev => ({ ...prev, [id]: !prev[id] }));

  const scrollToStep = (id: StepId) => {
    setActiveStep(id);
    // In a real app you'd use refs + measure() to scroll to each section
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      {/* ── HEADER ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={C.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Installation Guide</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* ── STEP NAV ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.stepNav}
        contentContainerStyle={styles.stepNavContent}
      >
        {STEPS.map((step, i) => {
          const isActive = activeStep === step.id;
          return (
            <TouchableOpacity
              key={step.id}
              style={[styles.stepPill, isActive && styles.stepPillActive]}
              onPress={() => scrollToStep(step.id)}
            >
              <View style={[styles.stepPillNum, isActive && styles.stepPillNumActive]}>
                <Text style={[styles.stepPillNumText, isActive && { color: C.bg }]}>{i + 1}</Text>
              </View>
              <View>
                <Text style={[styles.stepPillLabel, isActive && styles.stepPillLabelActive]}>{step.label}</Text>
                <Text style={styles.stepPillSub}>{step.sub}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* ── PROGRESS CARD ── */}
        <View style={styles.progressCard}>
          <View style={styles.progressCardTop}>
            <View>
              <Text style={styles.progressCardTitle}>Pre-Setup Checklist</Text>
              <Text style={styles.progressCardSub}>{checkedCount} of {CHECKLIST.length} completed</Text>
            </View>
            <Text style={[styles.progressPct, { color: checklistPct === 100 ? C.primary : C.blue }]}>
              {checklistPct}%
            </Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, {
              width: `${checklistPct}%` as any,
              backgroundColor: checklistPct === 100 ? C.primary : C.blue,
            }]} />
          </View>
        </View>

        {/* ══════════════════════════════════════════════════════════
            SECTION 1 — PRE-SETUP
        ══════════════════════════════════════════════════════════ */}
        <View style={styles.section}>
          <SectionHeader num={1} title="Before You Begin — eSIM Activation" />

          <View style={styles.card}>
            {CHECKLIST.map((item, idx) => {
              const done = !!checked[item.id];
              return (
                <View key={item.id}>
                  <TouchableOpacity
                    style={[styles.checkRow, done && styles.checkRowDone]}
                    activeOpacity={0.75}
                    onPress={() => toggleCheck(item.id)}
                  >
                    <View style={[styles.checkIcon, { backgroundColor: done ? C.primaryL : C.pageBg }]}>
                      <Feather name={item.icon as any} size={16} color={done ? C.primary : C.muted} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.checkLabel, done && { color: C.primary }]}>{item.label}</Text>
                      <Text style={styles.checkDesc}>{item.desc}</Text>
                    </View>
                    <View style={[styles.checkCircle, done && styles.checkCircleDone]}>
                      {done && <Feather name="check" size={12} color={C.bg} />}
                    </View>
                  </TouchableOpacity>
                  {idx < CHECKLIST.length - 1 && <View style={styles.rowDivider} />}
                </View>
              );
            })}
          </View>
        </View>

        {/* ══════════════════════════════════════════════════════════
            SECTION 2 — ACTIVATION
        ══════════════════════════════════════════════════════════ */}
        <View style={styles.section}>
          <SectionHeader num={2} title="Activating Your eSIM" />

          {/* Path breadcrumb */}
          <View style={styles.breadcrumb}>
            {['Scan QR Code', 'Activate eSIM', 'Continue'].map((step, i, arr) => (
              <View key={step} style={styles.breadcrumbItem}>
                <Text style={styles.breadcrumbText}>{step}</Text>
                {i < arr.length - 1 && <Feather name="chevron-right" size={13} color={C.muted} />}
              </View>
            ))}
          </View>

          <View style={styles.card}>
            <View style={styles.twoColGrid}>
              <View style={styles.gridItem}>
                <View style={[styles.gridIcon, { backgroundColor: C.blueBg }]}>
                  <Feather name="camera" size={16} color={C.blue} />
                </View>
                <Text style={styles.gridLabel}>Scan QR code</Text>
                <Text style={styles.gridSub}>From device where you want to use eSIM</Text>
              </View>
              <View style={styles.gridItem}>
                <View style={[styles.gridIcon, { backgroundColor: C.greenBg }]}>
                  <Feather name="check-circle" size={16} color={C.green} />
                </View>
                <Text style={styles.gridLabel}>Activate eSIM</Text>
                <Text style={styles.gridSub}>Click Continue and follow process</Text>
              </View>
            </View>

            <View style={styles.rowDivider} />

            <InfoBox
              color={C.amber} bg={C.amberBg} icon="clock"
              title="Usage Period Starts Immediately"
              body="Once you activate your eSIM, the usage period will start from that moment."
            />
          </View>

          <InfoBox
            color={C.amber} bg={C.amberBg} icon="alert-triangle"
            title="Important: Activation Time"
            body="Your eSIM will take 1–2 minutes to activate. Please ensure your screen does not go dark during this process."
          />
        </View>

        {/* ══════════════════════════════════════════════════════════
            SECTION 3 — iOS CONFIGURATION
        ══════════════════════════════════════════════════════════ */}
        <View style={styles.section}>
          <SectionHeader num={3} title="Configuring iOS Default Settings" />

          <InfoBox
            color={C.green} bg={C.greenBg} icon="check-circle"
            title="Cellular Setup Complete"
            body={'When you see "Cellular Setup Complete", click Continue'}
          />

          <View style={styles.card}>
            <SettingRow
              icon="sliders" iconColor={C.blue} iconBg={C.blueBg}
              label="Default Line" valueLabel="Primary" valueColor={C.blue}
            />
            <View style={styles.rowDivider} />
            <SettingRow
              icon="alert-circle" iconColor={C.red} iconBg={C.redBg}
              label="iMessage & FaceTime" sub="THIS IS CRITICAL — Click Continue"
              valueLabel="Primary" valueColor={C.red} critical
            />
            <View style={styles.rowDivider} />
            <SettingRow
              icon="database" iconColor={C.blue} iconBg={C.blueBg}
              label="Cellular / Mobile Data" sub="Allow Data Switching → ON"
              valueLabel="Primary" valueColor={C.blue}
            />
          </View>

          <InfoBox
            color={C.blue} bg={C.blueBg} icon="tag"
            title="Note Your eSIM Label"
            body="iOS will assign a label to your new eSIM — likely Personal, Travel, Secondary, Business, or Cellular Data. You'll need this in the next step."
          />
        </View>

        {/* ══════════════════════════════════════════════════════════
            SECTION 4 — ROAMING
        ══════════════════════════════════════════════════════════ */}
        <View style={styles.section}>
          <SectionHeader num={4} title="eSIM Settings & Data Configuration" />

          <View style={styles.breadcrumb}>
            {['iPhone Settings', 'Cellular / Mobile', 'SIMs Section'].map((s, i, arr) => (
              <View key={s} style={styles.breadcrumbItem}>
                <Text style={styles.breadcrumbText}>{s}</Text>
                {i < arr.length - 1 && <Feather name="chevron-right" size={13} color={C.muted} />}
              </View>
            ))}
          </View>

          <View style={styles.card}>
            {/* Roam eSIM — ON */}
            <View style={styles.toggleRow}>
              <View style={[styles.gridIcon, { backgroundColor: C.greenBg }]}>
                <Feather name="cpu" size={15} color={C.green} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.toggleLabel}>Roam eSIM</Text>
                <Text style={styles.toggleSub}>Labeled: Personal, Secondary, Travel, etc.</Text>
                <Text style={styles.toggleNote}>Turn Data Roaming ON</Text>
              </View>
              <View style={[styles.togglePill, { backgroundColor: C.primary }]}>
                <View style={[styles.toggleThumb, { alignSelf: 'flex-end' }]} />
              </View>
            </View>

            <View style={styles.rowDivider} />

            {/* Primary SIM — OFF */}
            <View style={[styles.toggleRow, { backgroundColor: C.redBg, borderRadius: 12, padding: 12 }]}>
              <View style={[styles.gridIcon, { backgroundColor: C.redBg, borderWidth: 1, borderColor: C.red + '30' }]}>
                <Feather name="phone-call" size={15} color={C.red} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.toggleLabel}>Primary SIM</Text>
                <Text style={styles.toggleSub}>Your regular phone number</Text>
                <Text style={[styles.toggleNote, { color: C.red }]}>⚠️ Turn Data Roaming OFF to avoid charges!</Text>
              </View>
              <View style={[styles.togglePill, { backgroundColor: C.border }]}>
                <View style={[styles.toggleThumb, { alignSelf: 'flex-start' }]} />
              </View>
            </View>
          </View>

          {/* Option A / B */}
          <Text style={styles.subheading}>Configure Cellular Data</Text>
          <View style={styles.card}>
            <View style={styles.optionBlock}>
              <View style={styles.optionTag}>
                <Text style={styles.optionTagText}>Option A · Recommended</Text>
              </View>
              <Text style={styles.optionTitle}>Automatic</Text>
              <View style={styles.optionRow}>
                <Text style={styles.optionKey}>Select</Text>
                <Text style={[styles.optionVal, { color: C.blue }]}>Primary</Text>
              </View>
              <View style={styles.optionRow}>
                <Text style={styles.optionKey}>Allow Data Switching</Text>
                <Text style={[styles.optionVal, { color: C.green }]}>ON</Text>
              </View>
              <Text style={styles.optionNote}>Roam automatically takes over when abroad</Text>
            </View>

            <View style={styles.rowDivider} />

            <View style={styles.optionBlock}>
              <View style={[styles.optionTag, { backgroundColor: C.pageBg }]}>
                <Text style={[styles.optionTagText, { color: C.muted }]}>Option B · Manual</Text>
              </View>
              <Text style={styles.optionTitle}>Manual Control</Text>
              <View style={styles.optionRow}>
                <Text style={styles.optionKey}>When abroad</Text>
                <Text style={[styles.optionVal, { color: C.blue }]}>Roam eSIM</Text>
              </View>
              <View style={styles.optionRow}>
                <Text style={styles.optionKey}>When back home</Text>
                <Text style={[styles.optionVal, { color: C.blue }]}>Primary SIM</Text>
              </View>
            </View>
          </View>

          <InfoBox
            color={C.blue} bg={C.blueBg} icon="battery"
            title="Enable Low Data Mode (Recommended)"
            body="Settings → Cellular → Roam eSIM → Data Mode → Low Data Mode. Avoids background data use without affecting active usage speed."
          />
        </View>

        {/* ══════════════════════════════════════════════════════════
            SECTION 5 — VALIDITY
        ══════════════════════════════════════════════════════════ */}
        <View style={styles.section}>
          <SectionHeader num={5} title="Final Notes & Validity" />

          <InfoBox
            color={C.green} bg={C.greenBg} icon="shield"
            title="No Data Roaming Charges!"
            body="As long as Data Roaming is OFF for your Primary SIM, you will not be charged for data roaming."
          />

          <View style={styles.card}>
            <View style={styles.twoColGrid}>
              <View style={[styles.gridItem, { backgroundColor: C.amberBg }]}>
                <View style={[styles.gridIcon, { backgroundColor: C.amberBg, borderWidth: 1, borderColor: C.amber + '30' }]}>
                  <Feather name="phone" size={15} color={C.amber} />
                </View>
                <Text style={styles.gridLabel}>Calls & SMS</Text>
                <Text style={styles.gridSub}>May be charged — check with your carrier</Text>
              </View>
              <View style={[styles.gridItem, { backgroundColor: C.greenBg }]}>
                <View style={[styles.gridIcon, { backgroundColor: C.greenBg, borderWidth: 1, borderColor: C.green + '30' }]}>
                  <Feather name="message-circle" size={15} color={C.green} />
                </View>
                <Text style={styles.gridLabel}>Receiving SMS</Text>
                <Text style={styles.gridSub}>Always free, even abroad</Text>
              </View>
            </View>

            <View style={styles.rowDivider} />

            {/* Validity box */}
            <View style={[styles.validityBox, { backgroundColor: '#F5F3FF', borderColor: '#7C3AED30' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Feather name="clock" size={16} color="#7C3AED" />
                <Text style={[styles.validityTitle, { color: '#7C3AED' }]}>eSIM Validity Period</Text>
              </View>
              <Text style={styles.validityText}>
                <Text style={{ fontWeight: '700' }}>QR code validity:</Text> Valid for{' '}
                <Text style={{ fontWeight: '700' }}>28 days from purchase date</Text>
              </Text>
              <Text style={[styles.validityText, { marginTop: 4 }]}>
                <Text style={{ fontWeight: '700' }}>Must activate within:</Text> 28 days of purchase
              </Text>
              <Text style={[styles.validityText, { color: C.red, fontWeight: '600', marginTop: 6 }]}>
                ⚠️ Unactivated eSIMs cannot be extended or refunded
              </Text>
            </View>
          </View>

          {/* All set banner */}
          <View style={styles.allSetBanner}>
            <View style={styles.allSetIcon}>
              <Feather name="check-circle" size={26} color={C.bg} />
            </View>
            <View>
              <Text style={styles.allSetTitle}>You're All Set! 🎉</Text>
              <Text style={styles.allSetSub}>Your eSIM is ready for travel in 200+ countries</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: C.pageBg },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 48, gap: 16 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: C.bg, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: C.pageBg, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: C.border,
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: C.text },

  // Step nav
  stepNav:        { backgroundColor: C.bg, borderBottomWidth: 1, borderBottomColor: C.border, flexGrow: 0 },
  stepNavContent: { paddingHorizontal: 12, paddingVertical: 10, gap: 8, flexDirection: 'row' },
  stepPill: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
    backgroundColor: C.pageBg, borderWidth: 1, borderColor: C.border,
  },
  stepPillActive: { backgroundColor: C.primaryL, borderColor: C.primary + '40' },
  stepPillNum: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: C.border, alignItems: 'center', justifyContent: 'center',
  },
  stepPillNumActive:  { backgroundColor: C.primary },
  stepPillNumText:    { fontSize: 11, fontWeight: '800', color: C.text },
  stepPillLabel:      { fontSize: 12, fontWeight: '700', color: C.muted },
  stepPillLabelActive:{ color: C.primary },
  stepPillSub:        { fontSize: 10, color: C.muted },

  // Progress card
  progressCard: {
    backgroundColor: C.bg, borderRadius: 16, padding: 16, gap: 10,
    borderWidth: 1, borderColor: C.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  progressCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressCardTitle: { fontSize: 14, fontWeight: '700', color: C.text },
  progressCardSub:   { fontSize: 12, color: C.muted, marginTop: 2 },
  progressPct:       { fontSize: 22, fontWeight: '800' },
  progressTrack: { height: 6, backgroundColor: C.pageBg, borderRadius: 3, overflow: 'hidden' },
  progressFill:  { height: '100%', borderRadius: 3 },

  // Section
  section:       { gap: 10 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionNum: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center',
  },
  sectionNumText:  { fontSize: 13, fontWeight: '800', color: C.bg },
  sectionTitle:    { fontSize: 15, fontWeight: '800', color: C.text, flex: 1 },
  subheading:      { fontSize: 13, fontWeight: '700', color: C.muted, paddingHorizontal: 4 },

  // Card
  card: {
    backgroundColor: C.bg, borderRadius: 16,
    borderWidth: 1, borderColor: C.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
    overflow: 'hidden',
  },
  rowDivider: { height: 1, backgroundColor: C.border },

  // Checklist
  checkRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  checkRowDone: { backgroundColor: '#FAFFF8' },
  checkIcon: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  checkLabel: { fontSize: 14, fontWeight: '600', color: C.text },
  checkDesc:  { fontSize: 12, color: C.muted, marginTop: 1 },
  checkCircle: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },
  checkCircleDone: { backgroundColor: C.primary, borderColor: C.primary },

  // Breadcrumb
  breadcrumb: {
    flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4,
    backgroundColor: C.bg, borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: C.border,
  },
  breadcrumbItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  breadcrumbText: { fontSize: 12, fontWeight: '600', color: C.blue },

  // Info box
  infoBox: {
    flexDirection: 'row', gap: 10, alignItems: 'flex-start',
    borderRadius: 12, padding: 14, borderWidth: 1,
  },
  infoBoxTitle: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  infoBoxBody:  { fontSize: 12, color: C.muted, lineHeight: 17 },

  // Two col grid
  twoColGrid: { flexDirection: 'row', padding: 12, gap: 10 },
  gridItem: {
    flex: 1, backgroundColor: C.pageBg, borderRadius: 12,
    padding: 12, gap: 6,
  },
  gridIcon: {
    width: 34, height: 34, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center', marginBottom: 2,
  },
  gridLabel: { fontSize: 13, fontWeight: '700', color: C.text },
  gridSub:   { fontSize: 11, color: C.muted, lineHeight: 16 },

  // Setting row
  settingRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: C.pageBg, margin: 12, borderRadius: 12,
  },
  settingIcon:      { width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  settingLabel:     { fontSize: 13, fontWeight: '600', color: C.text },
  settingSub:       { fontSize: 11, color: C.red, fontWeight: '600', marginTop: 2 },
  settingValue:     { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 7 },
  settingValueText: { fontSize: 12, fontWeight: '700' },

  // Toggle row
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  toggleLabel: { fontSize: 13, fontWeight: '700', color: C.text },
  toggleSub:   { fontSize: 11, color: C.muted, marginTop: 1 },
  toggleNote:  { fontSize: 11, fontWeight: '600', color: C.green, marginTop: 3 },
  togglePill: {
    width: 44, height: 24, borderRadius: 12,
    padding: 2, justifyContent: 'center',
  },
  toggleThumb: {
    width: 20, height: 20, borderRadius: 10, backgroundColor: C.bg,
  },

  // Option block
  optionBlock: { padding: 14, gap: 6 },
  optionTag: {
    alignSelf: 'flex-start', backgroundColor: C.primaryL,
    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, marginBottom: 4,
  },
  optionTagText:  { fontSize: 10, fontWeight: '700', color: C.primary, textTransform: 'uppercase', letterSpacing: 0.5 },
  optionTitle:    { fontSize: 13, fontWeight: '700', color: C.text },
  optionRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 },
  optionKey:      { fontSize: 12, color: C.muted },
  optionVal:      { fontSize: 12, fontWeight: '700' },
  optionNote:     { fontSize: 11, color: C.muted, marginTop: 4 },

  // Validity box
  validityBox: { margin: 14, marginTop: 0, borderRadius: 12, padding: 14, borderWidth: 1 },
  validityTitle: { fontSize: 14, fontWeight: '700' },
  validityText:  { fontSize: 13, color: C.text, lineHeight: 19 },

  // All set
  allSetBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: C.primary, borderRadius: 16, padding: 20,
  },
  allSetIcon: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  allSetTitle: { fontSize: 17, fontWeight: '800', color: C.bg },
  allSetSub:   { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
});