// app/screens/my-esims.tsx (UPDATED with "Get Another eSIM" button)
// ─────────────────────────────────────────────────────────────
// Fetches GET /my-esims (Bearer token).
// Includes "Get Another eSIM" button that navigates to explore plans
// ─────────────────────────────────────────────────────────────
import { Feather } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { usePathname, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Modal,
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
import { useCurrency } from '../context/CurrencyContext';
import { esimsApi } from '../scripts/api';
import { CurrencySelector } from '../components/CurrencySelector';

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
};

// ── Types ──────────────────────────────────────────────────────
type Plan = {
  id: number;
  name: string;
  validity: string;
  data_in_gb: string;
  call_in_minutes: string;
  international_call_in_minutes: string;
  sms_in_count: string;
  description: string | null;
  main_country: string | null;
  main_country_data: string;
  main_country_call: string;
  is_daily_data_plan: number;
  gbp_price: string;
  price: string;
};

type ESim = {
  id: number;
  iccid: string;
  lpa: string | null;
  activation_id: string;
  msisdn: string | null;
  confirmation_code: string | null;
  qrcode_url: string;
  status: string;
  request_time: string;
  created_at: string;
  plan: Plan;
};

// ── Helpers ────────────────────────────────────────────────────
function getStatusConfig(status: string) {
  const s = (status ?? '').toLowerCase();
  if (s === 'active' || s === 'successfull' || s === 'successful')
    return { color: C.primary, bg: C.primaryL, label: 'Active', isActive: true };
  if (s === 'expired')
    return { color: C.red, bg: C.redBg, label: 'Expired', isActive: false };
  return { color: C.amber, bg: C.amberBg, label: 'Pending', isActive: false };
}

function dataLabel(plan: Plan): string {
  if (plan.is_daily_data_plan === 1) return `${plan.data_in_gb} GB/day`;
  const gb = parseFloat(plan.main_country_data) > 0
    ? plan.main_country_data
    : plan.data_in_gb;
  return `${gb} GB`;
}

// ── Sub-components ─────────────────────────────────────────────
function AnimatedCard({ children, delay = 0, style }: any) {
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity,    { toValue: 1, duration: 400, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 400, delay, useNativeDriver: true }),
    ]).start();
  }, []);
  return (
    <Animated.View style={[{ opacity, transform: [{ translateY }] }, style]}>
      {children}
    </Animated.View>
  );
}

function PulsingDot({ color }: { color: string }) {
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.5, duration: 700, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1,   duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: color, transform: [{ scale }] }} />
  );
}

const TABS_NAV = [
  { key: 'index',   label: 'Home',    icon: 'home' },
  { key: 'help',    label: 'Help',    icon: 'help-circle' },
  { key: 'profile', label: 'Profile', icon: 'user' },
] as const;

function BottomTabBar() {
  const router = useRouter();
  const pathname = usePathname();
  // Derived from the actual current route rather than local state, so the
  // highlighted tab stays correct no matter how this screen was reached
  // (custom tab tap, back navigation, or landing here straight after login).
  const active = pathname.includes('/profile')
    ? 'profile'
    : pathname.includes('/help')
    ? 'help'
    : 'index';
  const go = (key: string) => {
    if (key === 'index') router.push('/my-esims');
    else router.push(`/(tabs)/${key}` as any);
  };
  return (
    <View style={tabSt.bar}>
      {TABS_NAV.map(t => {
        const on = active === t.key;
        return (
          <TouchableOpacity key={t.key} style={tabSt.item} onPress={() => go(t.key)} activeOpacity={0.7}>
            <View style={[tabSt.iconWrap, on && tabSt.iconWrapOn]}>
              <Feather name={t.icon as any} size={20} color={on ? C.primary : C.muted} />
            </View>
            <Text style={[tabSt.label, on && tabSt.labelOn]}>{t.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const tabSt = StyleSheet.create({
  bar:       { flexDirection: 'row', backgroundColor: C.bg, borderTopWidth: 1, borderTopColor: C.border, paddingBottom: Platform.OS === 'ios' ? 24 : 8, paddingTop: 10, paddingHorizontal: 8 },
  item:      { flex: 1, alignItems: 'center', gap: 4 },
  iconWrap:  { width: 40, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  iconWrapOn:{ backgroundColor: C.primaryL },
  label:     { fontSize: 11, fontWeight: '500', color: C.muted },
  labelOn:   { color: C.primary, fontWeight: '700' },
});

// ── Main ───────────────────────────────────────────────────────
export default function MyESimsScreen() {
  const router      = useRouter();
  const { profile, logout } = useAuth();
  const { formatGbp } = useCurrency();

  const [esims,     setEsims]     = useState<ESim[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [refreshing,setRefreshing]= useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [filterTab, setFilterTab] = useState<'all' | 'active' | 'expired'>('all');

  const [scanVisible,    setScanVisible]    = useState(false);
  const [permission,     requestPermission] = useCameraPermissions();
  const [scanned,        setScanned]        = useState(false);
  const [manualVisible,  setManualVisible]  = useState(false);
  const [manualCode,     setManualCode]     = useState('');

  // ── Fetch ─────────────────────────────────────────────────
  const fetchEsims = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const res = await esimsApi.getMyEsims();
      setEsims(res.data.esims ?? []);
    } catch (err: any) {
      setError(err.message || 'Failed to load eSIMs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchEsims(); }, []);

  // ── Derived ───────────────────────────────────────────────
  const isActiveStatus = (s: string) => {
    const v = s?.toLowerCase();
    return v === 'active' || v === 'successfull' || v === 'successful';
  };

  const filtered = esims.filter(e => {
    if (filterTab === 'all')     return true;
    if (filterTab === 'active')  return isActiveStatus(e.status);
    if (filterTab === 'expired') return e.status?.toLowerCase() === 'expired';
    return true;
  });

  const activeCount  = esims.filter(e => isActiveStatus(e.status)).length;
  const expiredCount = esims.filter(e => e.status?.toLowerCase() === 'expired').length;

  // ── QR scan ───────────────────────────────────────────────
  const handleScan = async () => {
    if (!permission?.granted) {
      const r = await requestPermission();
      if (r.granted) setScanVisible(true);
      else Alert.alert('Camera needed', 'Allow camera to scan eSIM QR codes.');
    } else { setScanVisible(true); }
  };

  const onBarcodeScanned = ({ data }: { data: string }) => {
    setScanned(true);
    setScanVisible(false);
    Alert.alert('QR Code scanned', 'Install this eSIM?', [
      { text: 'Cancel', style: 'cancel', onPress: () => setScanned(false) },
      { text: 'Install', onPress: () => Alert.alert('Starting install…', 'Follow device instructions.') },
    ]);
  };

  // ── Navigate to QR screen ─────────────────────────────────
  const goToQR = (esim: ESim) => {
    router.push({
      pathname: '/esim-qr',
      params: {
        id:          esim.id,
        qrImageUrl:  esim.qrcode_url,
        activationId:esim.activation_id,
        esimName:    esim.plan?.name ?? 'eSIM',
        iccid:       esim.iccid,
      },
    });
  };

  const goToDetails = (esim: ESim) => {
    router.push(`/esim-details/${esim.id}`);
  };

  // ── Navigate to Explore Plans ─────────────────────────────
  const goToExplorePlans = () => {
    router.push('/explore-plans');
  };

  const goToProviders = () => {
    router.push('/providers' as any);
  };

  // ─────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={st.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.pageBg} />

      {/* Header */}
      <View style={st.header}>
        <View>
          <Text style={st.headerTitle}>My eSIMs</Text>
          <Text style={st.headerSub}>
            {profile ? `Hi, ${profile.firstname}` : ''} · {activeCount} active
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <CurrencySelector compact />
          <TouchableOpacity style={st.iconBtn} onPress={() => fetchEsims(true)}>
            <Feather name="refresh-cw" size={15} color={refreshing ? C.primary : C.muted} />
          </TouchableOpacity>
          <TouchableOpacity style={st.scanBtn} onPress={handleScan}>
            <Feather name="maximize" size={15} color={C.bg} />
            <Text style={st.scanBtnText}>Scan QR</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Get Another eSIM Banner */}
      <View style={st.getAnotherBanner}>
        <View style={st.bannerContent}>
          <Feather name="plus-circle" size={24} color={C.primary} />
          <View style={st.bannerText}>
            <Text style={st.bannerTitle}>Need another eSIM?</Text>
            <Text style={st.bannerSub}>Explore data plans for your next destination</Text>
          </View>
        </View>
        <TouchableOpacity style={st.getAnotherBtn} onPress={goToExplorePlans}>
          <Text style={st.getAnotherBtnText}>Get Another eSIM</Text>
          <Feather name="arrow-right" size={16} color={C.bg} />
        </TouchableOpacity>
      </View>

      {/* Providers Banner */}
      <TouchableOpacity style={st.providersBanner} onPress={goToProviders} activeOpacity={0.85}>
        <View style={st.bannerContent}>
          <View style={st.providersIconWrap}>
            <Feather name="layers" size={22} color={C.blue} />
          </View>
          <View style={st.bannerText}>
            <Text style={st.providersTitle}>Browse Providers</Text>
            <Text style={st.providersSub}>View plans by network provider</Text>
          </View>
        </View>
        <Feather name="chevron-right" size={20} color={C.blue} />
      </TouchableOpacity>

      {/* QR Scanner Modal */}
      <Modal visible={scanVisible} animationType="slide" onRequestClose={() => setScanVisible(false)}>
        <View style={st.scanModal}>
          <View style={st.scanTopBar}>
            <TouchableOpacity style={st.iconBtn} onPress={() => setScanVisible(false)}>
              <Feather name="x" size={20} color={C.text} />
            </TouchableOpacity>
            <Text style={st.scanTitle}>Scan eSIM QR Code</Text>
            <View style={{ width: 40 }} />
          </View>
          {!permission?.granted ? (
            <View style={st.permBox}>
              <Feather name="camera-off" size={48} color={C.muted} />
              <Text style={st.permTitle}>Camera Access Needed</Text>
              <TouchableOpacity style={st.permBtn} onPress={requestPermission}>
                <Text style={st.permBtnText}>Grant Access</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <CameraView
                style={StyleSheet.absoluteFill}
                facing="back"
                onBarcodeScanned={scanned ? undefined : onBarcodeScanned}
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              />
              <View style={st.vfWrap}>
                <View style={[st.corner, st.cTL]} />
                <View style={[st.corner, st.cTR]} />
                <View style={[st.corner, st.cBL]} />
                <View style={[st.corner, st.cBR]} />
              </View>
            </>
          )}
          <View style={st.scanFooter}>
            <Text style={st.scanHint}>Point camera at the QR code from your provider</Text>
            <TouchableOpacity
              style={st.manualBtn}
              onPress={() => { setScanVisible(false); setManualVisible(true); }}
            >
              <Feather name="edit-2" size={16} color={C.primary} />
              <Text style={st.manualBtnText}>Enter Code Manually</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Manual Entry Modal */}
      <Modal visible={manualVisible} transparent animationType="slide" onRequestClose={() => setManualVisible(false)}>
        <View style={st.sheetOverlay}>
          <View style={st.sheet}>
            <View style={st.sheetHandle} />
            <Text style={st.sheetTitle}>Enter Activation Code</Text>
            <Text style={st.sheetSub}>Paste the LPA string from your provider</Text>
            <TextInput
              style={st.codeInput}
              value={manualCode}
              onChangeText={setManualCode}
              placeholder="LPA:1$rsp.example.com$XXXXX"
              placeholderTextColor={C.muted}
              multiline
              autoCapitalize="none"
            />
            <View style={st.sheetBtns}>
              <TouchableOpacity style={st.sheetCancel} onPress={() => setManualVisible(false)}>
                <Text style={st.cancelTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[st.sheetInstall, !manualCode.trim() && { opacity: 0.4 }]}
                disabled={!manualCode.trim()}
                onPress={() => {
                  setManualVisible(false); setManualCode('');
                  Alert.alert('Installing eSIM', 'Follow device instructions to complete setup.');
                }}
              >
                <Feather name="download" size={15} color={C.bg} />
                <Text style={st.installTxt}>Install eSIM</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Content */}
      <ScrollView style={st.scroll} contentContainerStyle={st.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Stats */}
        <AnimatedCard delay={60}>
          <View style={st.statsRow}>
            {[
              { icon: 'cpu',      color: C.primary, num: activeCount,  label: 'Active' },
              { icon: 'slash',    color: C.red,      num: expiredCount, label: 'Expired' },
              { icon: 'database', color: C.blue,     num: esims.length, label: 'Total' },
            ].map(s => (
              <View key={s.label} style={[st.statCard, { borderColor: s.color + '30' }]}>
                <Feather name={s.icon as any} size={18} color={s.color} />
                <Text style={[st.statNum, { color: s.color }]}>{s.num}</Text>
                <Text style={st.statLbl}>{s.label}</Text>
              </View>
            ))}
          </View>
        </AnimatedCard>

        {/* Filter tabs */}
        <AnimatedCard delay={100}>
          <View style={st.tabs}>
            {(['all', 'active', 'expired'] as const).map(t => (
              <TouchableOpacity
                key={t}
                style={[st.tab, filterTab === t && st.tabOn]}
                onPress={() => setFilterTab(t)}
              >
                <Text style={[st.tabTxt, filterTab === t && st.tabTxtOn]}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </AnimatedCard>

        {/* Loading */}
        {loading && (
          <View style={st.stateBox}>
            <ActivityIndicator size="large" color={C.primary} />
            <Text style={st.stateTxt}>Loading your eSIMs…</Text>
          </View>
        )}

        {/* Error */}
        {!loading && error && (
          <View style={st.stateBox}>
            <Feather name="wifi-off" size={36} color={C.muted} />
            <Text style={st.stateTxt}>{error}</Text>
            <TouchableOpacity style={st.retryBtn} onPress={() => fetchEsims()}>
              <Text style={st.retryTxt}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* eSIM cards */}
        {!loading && !error && filtered.map((esim, idx) => {
          const sc = getStatusConfig(esim.status);
          return (
            <AnimatedCard key={esim.id} delay={160 + idx * 60}>
              <TouchableOpacity style={st.card} activeOpacity={0.85} onPress={() => goToDetails(esim)}>

                {/* Top */}
                <View style={st.cardTop}>
                  <View style={st.cardLeft}>
                    <View style={st.iconBubble}>
                      <Feather name="smartphone" size={20} color={C.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={st.cardName} numberOfLines={2}>{esim.plan?.name}</Text>
                      {esim.plan?.main_country && (
                        <View style={st.locRow}>
                          <Feather name="map-pin" size={11} color={C.muted} />
                          <Text style={st.locTxt}>{esim.plan.main_country}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <View style={[st.badge, { backgroundColor: sc.bg }]}>
                    {sc.isActive ? <PulsingDot color={sc.color} /> : <Feather name="x-circle" size={11} color={sc.color} />}
                    <Text style={[st.badgeTxt, { color: sc.color }]}>{sc.label}</Text>
                  </View>
                </View>

                <View style={st.divider} />

                {/* Meta */}
                <View style={st.metaRow}>
                  <View style={st.metaItem}>
                    <Feather name="database" size={13} color={C.blue} />
                    <Text style={st.metaVal}>{dataLabel(esim.plan)}</Text>
                    <Text style={st.metaKey}>Data</Text>
                  </View>
                  <View style={st.metaSep} />
                  <View style={st.metaItem}>
                    <Feather name="calendar" size={13} color={C.blue} />
                    <Text style={st.metaVal}>{esim.plan?.validity ?? '—'}d</Text>
                    <Text style={st.metaKey}>Validity</Text>
                  </View>
                  <View style={st.metaSep} />
                  <View style={st.metaItem}>
                    <Feather name="tag" size={13} color={C.blue} />
                    <Text style={st.metaVal}>{esim.plan?.gbp_price ? formatGbp(esim.plan.gbp_price) : '—'}</Text>
                    <Text style={st.metaKey}>Price</Text>
                  </View>
                </View>

                {/* ICCID chip */}
                <View style={st.iccidRow}>
                  <Feather name="hash" size={11} color={C.muted} />
                  <Text style={st.iccidTxt}>{esim.iccid}</Text>
                </View>

                {/* Footer actions */}
                <View style={st.cardFooter}>
                  <View style={st.dateChip}>
                    <Feather name="clock" size={11} color={C.muted} />
                    <Text style={st.dateTxt}>
                      {new Date(esim.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </Text>
                  </View>
                  <View style={st.actions}>
                    <TouchableOpacity style={st.outlineBtn} onPress={() => goToQR(esim)}>
                      <Feather name="maximize" size={13} color={C.primary} />
                      <Text style={st.outlineTxt}>QR Code</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={st.fillBtn} onPress={() => goToDetails(esim)}>
                      <Text style={st.fillTxt}>Details</Text>
                      <Feather name="chevron-right" size={13} color={C.bg} />
                    </TouchableOpacity>
                  </View>
                </View>

              </TouchableOpacity>
            </AnimatedCard>
          );
        })}

        {!loading && !error && filtered.length === 0 && (
          <AnimatedCard delay={200}>
            <View style={st.emptyBox}>
              <Feather name="inbox" size={40} color={C.muted} />
              <Text style={st.emptyTitle}>No eSIMs here</Text>
              <Text style={st.emptySub}>Tap "Get Another eSIM" to purchase one</Text>
            </View>
          </AnimatedCard>
        )}

        {/* Guide banner */}
        <AnimatedCard delay={380}>
          <TouchableOpacity
            style={st.guideBanner}
            activeOpacity={0.8}
            onPress={() => router.push('/screens/esims/InstallationGuideScreen' as any)}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={st.guideIcon}>
                <Feather name="book-open" size={20} color={C.primary} />
              </View>
              <View>
                <Text style={st.guideTitle}>Installation Guide</Text>
                <Text style={st.guideSub}>Step-by-step eSIM setup help</Text>
              </View>
            </View>
            <Feather name="chevron-right" size={18} color={C.muted} />
          </TouchableOpacity>
        </AnimatedCard>

        <View style={{ height: 32 }} />
      </ScrollView>

      <BottomTabBar />
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: C.pageBg },
  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 8, gap: 12 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: C.bg, borderBottomWidth: 1, borderBottomColor: C.border },
  headerTitle: { fontSize: 16, fontWeight: '800', color: C.text },
  headerSub:   { fontSize: 11, color: C.muted, marginTop: 1 },
  iconBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.pageBg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
  scanBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.primary, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12 },
  scanBtnText: { fontSize: 13, fontWeight: '700', color: C.bg },

  // Providers Banner
  providersBanner: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    backgroundColor: '#EFF6FF',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2563EB30',
  },
  providersIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 11,
    backgroundColor: '#DBEAFE',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  providersTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#0A0A0A',
  },
  providersSub: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },

  // Get Another eSIM Banner
  getAnotherBanner: {
    backgroundColor: C.primaryL,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.primary + '30',
    gap: 12,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bannerText: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: C.text,
  },
  bannerSub: {
    fontSize: 12,
    color: C.muted,
    marginTop: 2,
  },
  getAnotherBtn: {
    backgroundColor: C.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  getAnotherBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: C.bg,
  },

  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 14, backgroundColor: C.bg, borderRadius: 14, borderWidth: 1, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6 },
  statNum:  { fontSize: 17, fontWeight: '800', color: C.text },
  statLbl:  { fontSize: 10, color: C.muted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },

  tabs:     { flexDirection: 'row', backgroundColor: C.bg, borderRadius: 12, padding: 4, gap: 2, borderWidth: 1, borderColor: C.border },
  tab:      { flex: 1, paddingVertical: 8, borderRadius: 9, alignItems: 'center' },
  tabOn:    { backgroundColor: C.primary },
  tabTxt:   { fontSize: 13, fontWeight: '600', color: C.muted },
  tabTxtOn: { color: C.bg },

  stateBox: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  stateTxt: { fontSize: 14, color: C.muted },
  retryBtn: { backgroundColor: C.primary, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10 },
  retryTxt: { color: C.bg, fontWeight: '700', fontSize: 14 },

  card: { backgroundColor: C.bg, borderRadius: 18, padding: 16, gap: 12, borderWidth: 1, borderColor: C.border, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8 },
  cardTop:   { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  cardLeft:  { flexDirection: 'row', alignItems: 'flex-start', gap: 12, flex: 1 },
  iconBubble:{ width: 44, height: 44, borderRadius: 12, backgroundColor: C.primaryL, alignItems: 'center', justifyContent: 'center' },
  cardName:  { fontSize: 14, fontWeight: '700', color: C.text, lineHeight: 20 },
  locRow:    { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  locTxt:    { fontSize: 11, color: C.muted },
  badge:     { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeTxt:  { fontSize: 11, fontWeight: '700' },
  divider:   { height: 1, backgroundColor: C.border },

  metaRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  metaItem: { alignItems: 'center', gap: 3 },
  metaVal:  { fontSize: 13, fontWeight: '700', color: C.text },
  metaKey:  { fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  metaSep:  { width: 1, height: 26, backgroundColor: C.border },

  iccidRow: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.pageBg, borderRadius: 8, padding: 8 },
  iccidTxt: { fontSize: 11, color: C.muted, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },

  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dateChip:   { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dateTxt:    { fontSize: 11, color: C.muted },
  actions:    { flexDirection: 'row', gap: 8 },
  outlineBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 9, backgroundColor: C.primaryL, borderWidth: 1, borderColor: C.primary + '30' },
  outlineTxt: { fontSize: 12, fontWeight: '600', color: C.primary },
  fillBtn:    { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 9, backgroundColor: C.primary },
  fillTxt:    { fontSize: 12, fontWeight: '700', color: C.bg },

  emptyBox:   { alignItems: 'center', paddingVertical: 40, gap: 10, backgroundColor: C.bg, borderRadius: 18, borderWidth: 1, borderColor: C.border },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: C.text },
  emptySub:   { fontSize: 13, color: C.muted },

  guideBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.bg, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.border, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6 },
  guideIcon:   { width: 42, height: 42, borderRadius: 11, backgroundColor: C.primaryL, alignItems: 'center', justifyContent: 'center' },
  guideTitle:  { fontSize: 14, fontWeight: '700', color: C.text },
  guideSub:    { fontSize: 12, color: C.muted, marginTop: 2 },

  // Scanner
  scanModal:  { flex: 1, backgroundColor: C.bg },
  scanTopBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: Platform.OS === 'android' ? 44 : 56, paddingBottom: 12, backgroundColor: C.bg, borderBottomWidth: 1, borderBottomColor: C.border, zIndex: 10 },
  scanTitle:  { fontSize: 16, fontWeight: '700', color: C.text },
  vfWrap:     { position: 'absolute', top: '28%', left: '15%', right: '15%', bottom: '28%' },
  corner:     { position: 'absolute', width: 24, height: 24, borderColor: C.primary, borderRadius: 4 },
  cTL: { top: 0,    left: 0,   borderTopWidth: 3,    borderLeftWidth: 3 },
  cTR: { top: 0,    right: 0,  borderTopWidth: 3,    borderRightWidth: 3 },
  cBL: { bottom: 0, left: 0,   borderBottomWidth: 3, borderLeftWidth: 3 },
  cBR: { bottom: 0, right: 0,  borderBottomWidth: 3, borderRightWidth: 3 },
  scanFooter: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: C.bg, paddingHorizontal: 24, paddingTop: 20, paddingBottom: 44, alignItems: 'center', gap: 14, borderTopWidth: 1, borderTopColor: C.border },
  scanHint:   { fontSize: 13, color: C.muted, textAlign: 'center' },
  manualBtn:  { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 12, width: '100%', justifyContent: 'center', backgroundColor: C.primaryL, borderRadius: 12, borderWidth: 1, borderColor: C.primary + '40' },
  manualBtnText: { fontSize: 15, fontWeight: '600', color: C.primary },
  permBox:    { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 32 },
  permTitle:  { fontSize: 18, fontWeight: '700', color: C.text },
  permBtn:    { backgroundColor: C.primary, paddingHorizontal: 28, paddingVertical: 13, borderRadius: 12, marginTop: 8 },
  permBtnText:{ fontSize: 15, fontWeight: '700', color: C.bg },

  // Sheet
  sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet:        { backgroundColor: C.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, gap: 12, borderTopWidth: 1, borderColor: C.border },
  sheetHandle:  { width: 36, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: 'center', marginBottom: 4 },
  sheetTitle:   { fontSize: 18, fontWeight: '800', color: C.text },
  sheetSub:     { fontSize: 13, color: C.muted, lineHeight: 18 },
  codeInput:    { backgroundColor: C.pageBg, borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 14, fontSize: 13, color: C.text, minHeight: 90, textAlignVertical: 'top', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  sheetBtns:    { flexDirection: 'row', gap: 10, marginTop: 4 },
  sheetCancel:  { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: C.pageBg, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  cancelTxt:    { fontSize: 15, fontWeight: '600', color: C.muted },
  sheetInstall: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12, backgroundColor: C.primary },
  installTxt:   { fontSize: 15, fontWeight: '700', color: C.bg },
});