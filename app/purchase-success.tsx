import {
  Feather,
  Ionicons,
  MaterialCommunityIcons,
} from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Animated,
  Dimensions,
  Easing,
  Platform,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';

const { width } = Dimensions.get('window');

const C = {
  bg:      '#FFFFFF',
  pageBg:  '#F8FAFB',
  primary: '#016701',
  text:    '#0A0A0A',
  muted:   '#6B7280',
  border:  '#EAEEF2',
  gold:    '#D97706',
  goldBg:  '#FEF3C7',
  saveBg:  '#DCFCE7',
  light:   '#F0F7F0',
  dark:    '#0D1117',
};

const ESIM_QR_VALUE =
  'LPA:1$rsp.truphone.com$QR-G-5C-MAPIANS-DEMO-2026-ABCDEF123456';

const STEPS = [
  {
    icon:  'settings-outline' as const,
    title: 'Open Device Settings',
    desc:  'Go to Settings → Mobile Data / Cellular → Add eSIM',
  },
  {
    icon:  'qr-code-outline' as const,
    title: 'Scan QR Code',
    desc:  'Tap "Use QR Code" and scan the code shown above',
  },
  {
    icon:  'wifi-outline' as const,
    title: 'Activate & Connect',
    desc:  'Follow on-screen prompts and enable the new eSIM plan',
  },
];

// ── Confetti ──────────────────────────────────────────────────────────────────
function Particle({ delay, color }: { delay: number; color: string }) {
  const y     = useRef(new Animated.Value(-20)).current;
  const x     = useRef(new Animated.Value((Math.random() - 0.5) * width)).current;
  const alpha = useRef(new Animated.Value(1)).current;
  const rot   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(y,     { toValue: 700, duration: 1600, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        Animated.timing(x,     { toValue: (x as any)._value + (Math.random() - 0.5) * 120, duration: 1600, useNativeDriver: true }),
        Animated.timing(alpha, { toValue: 0, duration: 1600, useNativeDriver: true }),
        Animated.timing(rot,   { toValue: 6, duration: 1600, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  const rotate = rot.interpolate({ inputRange: [0, 6], outputRange: ['0deg', '720deg'] });

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute', top: 0, left: width / 2,
        width: 8, height: 8, borderRadius: 2,
        backgroundColor: color,
        opacity: alpha,
        transform: [{ translateY: y }, { translateX: x }, { rotate }],
      }}
    />
  );
}

function Confetti() {
  const colors  = [C.primary, '#FFD700', '#FF6B6B', '#4ECDC4', '#A855F7', '#F97316'];
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i, delay: i * 60, color: colors[i % colors.length],
  }));
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map(p => <Particle key={p.id} delay={p.delay} color={p.color} />)}
    </View>
  );
}

// ── Thank You Screen ──────────────────────────────────────────────────────────
function ThankYouScreen({ plan, onHome, onViewESIMs }: { plan: any; onHome: () => void; onViewESIMs: () => void }) {
  const scale  = useRef(new Animated.Value(0.6)).current;
  const fade   = useRef(new Animated.Value(0)).current;
  const slideY = useRef(new Animated.Value(24)).current;
  const pulse  = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale,  { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }),
      Animated.timing(fade,   { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideY, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.08, duration: 800, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1.00, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    });
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      <Confetti />
      <View style={styles.tyRoot}>

        <Animated.View style={{ transform: [{ scale: Animated.multiply(scale, pulse) }] }}>
          <View style={styles.tyIconOuter}>
            <View style={styles.tyIconInner}>
              <Ionicons name="heart" size={40} color="#fff" />
            </View>
          </View>
        </Animated.View>

        <Animated.View style={[styles.tyTextBlock, { opacity: fade, transform: [{ translateY: slideY }] }]}>
          <Text style={styles.tyTitle}>Thank You! 🎉</Text>
          <Text style={styles.tySub}>
            Thank you for buying your eSIM with Mapians.{'\n'}
            We hope you stay connected wherever you go.
          </Text>
        </Animated.View>

        <Animated.View style={[styles.tySummaryCard, { opacity: fade }]}>
          <View style={styles.tySummaryRow}>
            <MaterialCommunityIcons name="sim-outline" size={18} color={C.primary} />
            <Text style={styles.tySummaryText}>
              {plan?.data_in_gb ? `${plan.data_in_gb} GB` : (plan?.data ?? '—')} · {plan?.validity ? `${plan.validity} days` : (plan?.days ?? '—')} ·{' '}
              <Text style={{ fontWeight: '800', color: C.primary }}>{plan?.price}</Text>
            </Text>
          </View>
        </Animated.View>

        <Animated.View style={[styles.tyQuoteBlock, { opacity: fade }]}>
          <Text style={styles.tyQuote}>
            "The world is yours to explore.{'\n'}We'll keep you connected."
          </Text>
          <Text style={styles.tyQuoteAuthor}>— Team Mapians</Text>
        </Animated.View>

        <Animated.View style={[styles.tyBtns, { opacity: fade }]}>
          <TouchableOpacity style={styles.tyHomeBtn} activeOpacity={0.85} onPress={onHome}>
            <Feather name="home" size={17} color="#fff" />
            <Text style={styles.tyHomeBtnText}>Back to Home</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.tyEsimBtn} 
            activeOpacity={0.8}
            onPress={onViewESIMs}
          >
            <MaterialCommunityIcons name="sim-outline" size={17} color={C.primary} />
            <Text style={styles.tyEsimBtnText}>View My eSIMs</Text>
          </TouchableOpacity>
        </Animated.View>

      </View>
    </SafeAreaView>
  );
}

// ── Purchase Success Screen ───────────────────────────────────────────────────
export default function PurchaseSuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const plan = params.plan
    ? JSON.parse(params.plan as string)
    : { id: 4, data_in_gb: '10', validity: '30', price: 'US$20.69' };

  // Normalise display labels — API sends data_in_gb / validity
  const planDataLabel = plan.data_in_gb ? `${plan.data_in_gb} GB` : (plan.data ?? '—');
  const planDaysLabel = plan.validity   ? `${plan.validity} days`  : (plan.days ?? '—');

  const orderId   = useRef('MAP-' + Math.random().toString(36).slice(2, 8).toUpperCase()).current;
  const orderDate = new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

  const [showThankYou, setShowThankYou] = useState(false);
  const [copied,       setCopied]       = useState(false);
  const [activeStep,   setActiveStep]   = useState<number | null>(null);

  const checkScale  = useRef(new Animated.Value(0)).current;
  const contentFade = useRef(new Animated.Value(0)).current;
  const qrSlide     = useRef(new Animated.Value(30)).current;
  const copyScale   = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(checkScale, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(contentFade, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(qrSlide,     { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(ESIM_QR_VALUE);
    setCopied(true);
    Animated.sequence([
      Animated.spring(copyScale, { toValue: 0.92, useNativeDriver: true }),
      Animated.spring(copyScale, { toValue: 1.00, useNativeDriver: true }),
    ]).start();
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        title:   'Mapians eSIM Receipt',
        message: `🌍 Mapians eSIM Receipt\n\nOrder ID: ${orderId}\nDate: ${orderDate}\nPlan: ${planDataLabel} · ${planDaysLabel}\nAmount: ${plan.price}\n\neSIM Activation Code:\n${ESIM_QR_VALUE}\n\nThank you for choosing Mapians!`,
      });
    } catch {}
  };

  if (showThankYou) {
    return (
      <ThankYouScreen 
        plan={plan} 
        onHome={() => router.replace('/')}
        onViewESIMs={() => router.push('/my-esims')}
      />
    );
  }

  const receiptRows = [
    { label: 'Order ID',    val: orderId },
    { label: 'Date',        val: orderDate },
    { label: 'Plan',        val: `${planDataLabel} · ${planDaysLabel}` },
    { label: 'Amount Paid', val: plan.price },
    { label: 'Payment',     val: 'Card via Revolut' },
    { label: 'Status',      val: '✅ Confirmed' },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.pageBg} />
      <Confetti />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* ── SUCCESS HEADER ─────────────────────────────────── */}
        <View style={styles.successHeader}>
          <Animated.View style={[styles.checkCircleOuter, { transform: [{ scale: checkScale }] }]}>
            <View style={styles.checkCircleInner}>
              <Feather name="check" size={36} color="#fff" />
            </View>
          </Animated.View>
          <Animated.View style={{ opacity: contentFade, alignItems: 'center', gap: 6 }}>
            <Text style={styles.successTitle}>Purchase Successful!</Text>
            <Text style={styles.successSub}>Your eSIM is ready to install</Text>
            <View style={styles.orderPill}>
              <Text style={styles.orderPillText}>Order #{orderId} · {orderDate}</Text>
            </View>
          </Animated.View>
        </View>

        {/* ── ORDER SUMMARY ──────────────────────────────────── */}
        <Animated.View style={[styles.card, { opacity: contentFade, transform: [{ translateY: qrSlide }] }]}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryIconWrap}>
              <MaterialCommunityIcons name="sim-outline" size={22} color={C.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.summaryPlan}>{planDataLabel} eSIM Plan</Text>
              <Text style={styles.summaryDays}>{planDaysLabel} validity</Text>
            </View>
            <Text style={styles.summaryPrice}>{plan.price}</Text>
          </View>
        </Animated.View>

        {/* ── QR CODE ────────────────────────────────────────── */}
        <Animated.View style={[styles.card, styles.qrCard, { opacity: contentFade, transform: [{ translateY: qrSlide }] }]}>
          <View style={styles.qrHeader}>
            <View>
              <Text style={styles.qrTitle}>Your eSIM QR Code</Text>
              <Text style={styles.qrSub}>Scan this to install your eSIM</Text>
            </View>
            <View style={styles.esimBadge}>
              <Text style={styles.esimBadgeText}>eSIM</Text>
            </View>
          </View>

          <View style={styles.qrWrap}>
            <View style={styles.qrInner}>
              <QRCode
                value={ESIM_QR_VALUE}
                size={180}
                color={C.dark}
                backgroundColor="#FFFFFF"
              />
            </View>
            <View style={[styles.qrCorner, styles.qrCornerTL]} />
            <View style={[styles.qrCorner, styles.qrCornerTR]} />
            <View style={[styles.qrCorner, styles.qrCornerBL]} />
            <View style={[styles.qrCorner, styles.qrCornerBR]} />
          </View>

          <Text style={styles.qrHint}>
            Valid for <Text style={{ fontWeight: '700', color: C.text }}>30 days</Text> from activation
          </Text>

          <View style={styles.qrActions}>
            <Animated.View style={[{ flex: 1 }, { transform: [{ scale: copyScale }] }]}>
              <TouchableOpacity
                style={[styles.qrActionBtn, copied && styles.qrActionBtnCopied]}
                activeOpacity={0.8}
                onPress={handleCopy}
              >
                <Feather name={copied ? 'check' : 'copy'} size={16} color={copied ? C.primary : C.text} />
                <Text style={[styles.qrActionText, copied && { color: C.primary }]}>
                  {copied ? 'Copied!' : 'Copy Code'}
                </Text>
              </TouchableOpacity>
            </Animated.View>
            <TouchableOpacity style={[styles.qrActionBtn, { flex: 1 }]} activeOpacity={0.8} onPress={handleShare}>
              <Feather name="share-2" size={16} color={C.text} />
              <Text style={styles.qrActionText}>Share Receipt</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* ── INSTALLATION STEPS ─────────────────────────────── */}
        <Animated.View style={{ opacity: contentFade, transform: [{ translateY: qrSlide }] }}>
          <Text style={styles.sectionLabel}>How to Install</Text>
          <View style={styles.card}>
            {STEPS.map((step, i) => (
              <TouchableOpacity
                key={i}
                activeOpacity={0.8}
                onPress={() => setActiveStep(activeStep === i ? null : i)}
              >
                <View style={styles.stepRow}>
                  <View style={styles.stepNumWrap}>
                    <Text style={styles.stepNum}>{i + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.stepTitleRow}>
                      <Text style={styles.stepTitle}>{step.title}</Text>
                      <Feather name={activeStep === i ? 'chevron-up' : 'chevron-down'} size={16} color={C.muted} />
                    </View>
                    {activeStep === i && (
                      <Text style={styles.stepDesc}>{step.desc}</Text>
                    )}
                  </View>
                </View>
                {i < STEPS.length - 1 && <View style={styles.stepConnector} />}
              </TouchableOpacity>
            ))}

            <View style={styles.platformHint}>
              <Ionicons
                name={Platform.OS === 'ios' ? 'logo-apple' : 'logo-android'}
                size={14}
                color={C.muted}
              />
              <Text style={styles.platformHintText}>
                {Platform.OS === 'ios'
                  ? 'iOS 12.1+ required for eSIM support'
                  : 'Android 9+ required for eSIM support'}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* ── RECEIPT ────────────────────────────────────────── */}
        <Animated.View style={{ opacity: contentFade }}>
          <Text style={styles.sectionLabel}>Receipt</Text>
          <View style={styles.card}>
            {receiptRows.map((row, i) => (
              <View key={i}>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>{row.label}</Text>
                  <Text style={[
                    styles.receiptVal,
                    row.label === 'Amount Paid' && { color: C.primary, fontWeight: '800' },
                  ]}>
                    {row.val}
                  </Text>
                </View>
                {i < receiptRows.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>
        </Animated.View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* ── FOOTER ─────────────────────────────────────────────── */}
      <Animated.View style={[styles.footer, { opacity: contentFade }]}>
        <TouchableOpacity
          style={styles.thankYouBtn}
          activeOpacity={0.85}
          onPress={() => setShowThankYou(true)}
        >
          <Ionicons name="heart-outline" size={18} color="#fff" />
          <Text style={styles.thankYouBtnText}>Done — Thank You!</Text>
        </TouchableOpacity>
      </Animated.View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: C.pageBg },
  scroll:        { flex: 1 },
  scrollContent: { padding: 16, gap: 14 },

  card: {
    backgroundColor: C.bg, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: C.border, gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  divider:      { height: 1, backgroundColor: C.border },
  sectionLabel: {
    fontSize: 13, fontWeight: '700', color: C.muted,
    textTransform: 'uppercase', letterSpacing: 0.8,
    marginBottom: 4, marginTop: 4,
  },

  // Header
  successHeader: { alignItems: 'center', paddingVertical: 24, gap: 14 },
  checkCircleOuter: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: C.saveBg, alignItems: 'center', justifyContent: 'center',
  },
  checkCircleInner: {
    width: 76, height: 76, borderRadius: 38,
    backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center',
    shadowColor: C.primary, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
  },
  successTitle: { fontSize: 24, fontWeight: '800', color: C.text, textAlign: 'center' },
  successSub:   { fontSize: 14, color: C.muted, textAlign: 'center' },
  orderPill: {
    backgroundColor: C.light, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 6,
    borderWidth: 1, borderColor: C.border,
  },
  orderPillText: { fontSize: 12, color: C.primary, fontWeight: '600' },

  // Summary
  summaryRow:      { flexDirection: 'row', alignItems: 'center', gap: 12 },
  summaryIconWrap: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: C.saveBg, alignItems: 'center', justifyContent: 'center',
  },
  summaryPlan:  { fontSize: 15, fontWeight: '700', color: C.text },
  summaryDays:  { fontSize: 13, color: C.muted, marginTop: 2 },
  summaryPrice: { fontSize: 17, fontWeight: '800', color: C.text },
  creditsRow:   { flexDirection: 'row', alignItems: 'center', gap: 7 },
  creditsText:  { fontSize: 13, color: C.muted, flex: 1 },

  // QR
  qrCard:   { alignItems: 'center', gap: 16 },
  qrHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' },
  qrTitle:  { fontSize: 16, fontWeight: '700', color: C.text },
  qrSub:    { fontSize: 12, color: C.muted, marginTop: 2 },
  esimBadge: {
    backgroundColor: C.light, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: C.border,
  },
  esimBadgeText: { fontSize: 12, fontWeight: '700', color: C.primary },
  qrWrap: {
    width: 220, height: 220, backgroundColor: '#fff', borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', position: 'relative',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 16, elevation: 4,
    borderWidth: 1, borderColor: C.border,
  },
  qrInner:     { padding: 16 },
  qrCorner:    { position: 'absolute', width: 24, height: 24, borderColor: C.primary, borderWidth: 3 },
  qrCornerTL:  { top: -2,    left: -2,    borderRightWidth: 0,  borderBottomWidth: 0, borderTopLeftRadius: 8 },
  qrCornerTR:  { top: -2,    right: -2,   borderLeftWidth: 0,   borderBottomWidth: 0, borderTopRightRadius: 8 },
  qrCornerBL:  { bottom: -2, left: -2,    borderRightWidth: 0,  borderTopWidth: 0,    borderBottomLeftRadius: 8 },
  qrCornerBR:  { bottom: -2, right: -2,   borderLeftWidth: 0,   borderTopWidth: 0,    borderBottomRightRadius: 8 },
  qrHint:      { fontSize: 13, color: C.muted, textAlign: 'center' },
  qrActions:   { flexDirection: 'row', gap: 10, width: '100%' },
  qrActionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    borderWidth: 1.5, borderColor: C.border, borderRadius: 12,
    paddingVertical: 12, backgroundColor: C.pageBg,
  },
  qrActionBtnCopied: { borderColor: C.primary, backgroundColor: C.saveBg },
  qrActionText:      { fontSize: 13, fontWeight: '600', color: C.text },

  // Steps
  stepRow:       { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 4 },
  stepConnector: { width: 2, height: 14, backgroundColor: C.border, marginLeft: 15, marginVertical: 2 },
  stepNumWrap: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: C.light, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: C.border, flexShrink: 0,
  },
  stepNum:      { fontSize: 14, fontWeight: '800', color: C.primary },
  stepTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 6 },
  stepTitle:    { fontSize: 14, fontWeight: '700', color: C.text, flex: 1 },
  stepDesc:     { fontSize: 13, color: C.muted, marginTop: 6, lineHeight: 19 },
  platformHint: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: C.pageBg, borderRadius: 10, padding: 10,
    borderWidth: 1, borderColor: C.border, marginTop: 4,
  },
  platformHintText: { fontSize: 12, color: C.muted },

  // Receipt
  receiptRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  receiptLabel: { fontSize: 13, color: C.muted },
  receiptVal:   { fontSize: 13, fontWeight: '600', color: C.text },

  // Footer
  footer: {
    padding: 16, backgroundColor: C.bg,
    borderTopWidth: 1, borderTopColor: C.border,
  },
  thankYouBtn: {
    backgroundColor: C.primary, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row', gap: 8,
    shadowColor: C.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 4,
  },
  thankYouBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },

  // Thank You screen
  tyRoot: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 32, gap: 24, backgroundColor: C.bg,
  },
  tyIconOuter: {
    width: 110, height: 110, borderRadius: 55,
    backgroundColor: '#FFF0F0', alignItems: 'center', justifyContent: 'center',
  },
  tyIconInner: {
    width: 84, height: 84, borderRadius: 42,
    backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center',
    shadowColor: C.primary, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 14, elevation: 8,
  },
  tyTextBlock:     { alignItems: 'center', gap: 10 },
  tyTitle:         { fontSize: 30, fontWeight: '800', color: C.text, textAlign: 'center' },
  tySub:           { fontSize: 15, color: C.muted, textAlign: 'center', lineHeight: 23 },
  tySummaryCard: {
    width: '100%', backgroundColor: C.pageBg, borderRadius: 16,
    padding: 16, gap: 10, borderWidth: 1, borderColor: C.border,
  },
  tySummaryRow:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tySummaryText:   { fontSize: 14, color: C.text, fontWeight: '600' },
  tySummaryCredits:{ fontSize: 13, color: C.gold, fontWeight: '600' },
  tyQuoteBlock:    { alignItems: 'center', gap: 6, paddingHorizontal: 8 },
  tyQuote:         { fontSize: 15, color: C.muted, textAlign: 'center', fontStyle: 'italic', lineHeight: 23 },
  tyQuoteAuthor:   { fontSize: 13, color: C.primary, fontWeight: '700' },
  tyBtns:          { width: '100%', gap: 12 },
  tyHomeBtn: {
    backgroundColor: C.primary, borderRadius: 14, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    shadowColor: C.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 10, elevation: 4,
  },
  tyHomeBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  tyEsimBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1.5, borderColor: C.primary, borderRadius: 14, paddingVertical: 15,
  },
  tyEsimBtnText: { fontSize: 15, fontWeight: '700', color: C.primary },
});