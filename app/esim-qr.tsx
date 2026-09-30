// app/screens/esim-qr.tsx
// ─────────────────────────────────────────────────────────────
// Shows the eSIM QR code.
// Two modes:
//   1. Shows the qrcode_url IMAGE from the API (primary — already a PNG).
//   2. Falls back to generating a QR from activation_id if image fails.
// Also fetches fresh /esim-details/:id for complete info.
// ─────────────────────────────────────────────────────────────
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
// expo-file-system rewrote its API in SDK 57 (File/Directory/Paths classes) —
// './legacy' is the official compatibility subpath that still exposes the
// old cacheDirectory/downloadAsync surface this screen uses.
import * as FileSystem from 'expo-file-system/legacy';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { esimsApi } from '../scripts/api';
import { useCurrency } from '../context/CurrencyContext';

// expo-media-library's native module isn't present in Expo Go (only in a
// dev-client/standalone build) — importing it there throws at module-load
// time, so it's require()'d lazily inside a try/catch instead of a static
// import, which would otherwise crash this whole screen before it renders.
let MediaLibrary: typeof import('expo-media-library') | null = null;
try {
  MediaLibrary = require('expo-media-library');
} catch {
  // Running in Expo Go — saving to gallery stays unavailable until a dev-client build.
}

const C = {
  bg:       '#FFFFFF',
  pageBg:   '#F8FAFB',
  primary:  '#016701',
  primaryL: '#F0F7F0',
  text:     '#0A0A0A',
  muted:    '#6B7280',
  border:   '#EAEEF2',
  error:    '#DC2626',
};

type Plan = {
  id: number;
  name: string;
  validity: string;
  data_in_gb: string;
  call_in_minutes: string;
  sms_in_count: string;
  main_country: string | null;
  main_country_data: string;
  is_daily_data_plan: number;
  price: string;
  gbp_price: string;
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

export default function ESIMQRCodeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const qrRef  = useRef<any>(null);
  const { formatGbp } = useCurrency();

  // Params from my-esims
  const esimId      = params.id as string | undefined;
  const qrImageUrl  = params.qrImageUrl  as string | undefined;   // qrcode_url
  const activationId= params.activationId as string | undefined;  // activation_id
  const esimNameParam = params.esimName as string | undefined;
  const iccidParam  = params.iccid as string | undefined;

  const [esim,          setEsim]          = useState<ESim | null>(null);
  const [loading,       setLoading]       = useState(!!esimId);
  const [error,         setError]         = useState<string | null>(null);
  const [imgError,      setImgError]      = useState(false);   // qrcode_url failed to load

  // ── Fetch fresh details ──────────────────────────────────
  useEffect(() => {
    if (esimId) {
      fetchDetails(Number(esimId));
    } else if (params.esim) {
      try { setEsim(JSON.parse(params.esim as string)); } catch { /**/ }
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [esimId]);

  const fetchDetails = async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await esimsApi.getEsimDetails(id);
      // { status, message, data: { esim: {...} } }
      setEsim(res.data.esim);
    } catch (err: any) {
      setError(err.message || 'Failed to load eSIM details');
    } finally {
      setLoading(false);
    }
  };

  // ── Derived ───────────────────────────────────────────────
  const displayName  = esim?.plan?.name   ?? esimNameParam  ?? 'eSIM';
  const iccid        = esim?.iccid        ?? iccidParam     ?? '';
  const qrImgSrc     = esim?.qrcode_url   ?? qrImageUrl     ?? '';
  const activCode    = esim?.activation_id ?? activationId  ?? '';

  // ── Actions ───────────────────────────────────────────────
  const saveToGallery = async () => {
    if (!MediaLibrary) {
      Alert.alert('Not available', "Saving to gallery isn't available in Expo Go — it needs a dev-client build.");
      return;
    }
    const { status } = await MediaLibrary.requestPermissionsAsync(true);
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Need gallery permission to save.'); return;
    }
    try {
      // Download from URL
      const localUri = FileSystem.cacheDirectory + `esim_qr_${Date.now()}.png`;
      const dl = await FileSystem.downloadAsync(qrImgSrc, localUri);
      await MediaLibrary.saveToLibraryAsync(dl.uri);
      Alert.alert('Saved ✓', 'QR Code saved to gallery');
    } catch {
      Alert.alert('Error', 'Could not save the QR code');
    }
  };

  const shareQR = async () => {
    await Share.share({
      title:   `${displayName} eSIM`,
      message: `Install your ${displayName} eSIM.\n\nActivation code:\n${activCode}`,
    });
  };

  const copyCode = async () => {
    await Clipboard.setStringAsync(activCode);
    Alert.alert('Copied ✓', 'Activation code copied to clipboard');
  };

  const installESIM = () => {
    Alert.alert('Install eSIM', 'Proceed to install this eSIM on your device?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Install', onPress: () => Alert.alert('Installation Started', 'Follow your device instructions to complete.') },
    ]);
  };

  // ── Data labels ───────────────────────────────────────────
  const dataLabel = () => {
    if (!esim?.plan) return '—';
    if (esim.plan.is_daily_data_plan === 1) return `${esim.plan.data_in_gb} GB/day`;
    const gb = parseFloat(esim.plan.main_country_data) > 0
      ? esim.plan.main_country_data
      : esim.plan.data_in_gb;
    return `${gb} GB`;
  };

  // ─────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.pageBg} />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Feather name="arrow-left" size={22} color={C.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>eSIM QR Code</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Loading */}
      {loading && (
        <View style={s.centerBox}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={s.centerTxt}>Loading eSIM details…</Text>
        </View>
      )}

      {/* Error */}
      {!loading && error && (
        <View style={s.centerBox}>
          <Feather name="alert-circle" size={36} color={C.muted} />
          <Text style={s.centerTxt}>{error}</Text>
          {esimId && (
            <TouchableOpacity style={s.retryBtn} onPress={() => fetchDetails(Number(esimId))}>
              <Text style={s.retryTxt}>Retry</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Main content */}
      {!loading && !error && (
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

          <Text style={s.esimName}>{displayName}</Text>

          {/* ── QR image (from API qrcode_url) ── */}
          <View style={s.qrBox}>
            {!imgError && !!qrImgSrc ? (
              <Image
                source={{ uri: qrImgSrc }}
                style={s.qrImage}
                resizeMode="contain"
                onError={() => setImgError(true)}
              />
            ) : activCode ? (
              // Fallback: generate QR from activation_id string
              <QRCode
                value={activCode}
                size={230}
                color={C.text}
                backgroundColor="#fff"
                getRef={(r) => (qrRef.current = r)}
              />
            ) : (
              <View style={s.noQr}>
                <Feather name="alert-triangle" size={32} color={C.muted} />
                <Text style={s.noQrTxt}>No QR code available</Text>
              </View>
            )}
          </View>

          <Text style={s.hint}>Scan this QR code with your device to install the eSIM</Text>

          {/* Plan info chips */}
          {esim?.plan && (
            <View style={s.chips}>
              <View style={s.chip}>
                <Feather name="database" size={12} color={C.primary} />
                <Text style={s.chipTxt}>{dataLabel()}</Text>
              </View>
              <View style={s.chip}>
                <Feather name="calendar" size={12} color={C.primary} />
                <Text style={s.chipTxt}>{esim.plan.validity}d validity</Text>
              </View>
              <View style={s.chip}>
                <Feather name="phone" size={12} color={C.primary} />
                <Text style={s.chipTxt}>{esim.plan.call_in_minutes} calls</Text>
              </View>
              <View style={s.chip}>
                <Feather name="tag" size={12} color={C.primary} />
                <Text style={s.chipTxt}>{formatGbp(esim.plan.gbp_price)}</Text>
              </View>
            </View>
          )}

          {/* Action buttons */}
          <View style={s.btns}>
            <TouchableOpacity style={s.btnPrimary} onPress={installESIM}>
              <MaterialCommunityIcons name="cellphone-download" size={19} color="#fff" />
              <Text style={s.btnPrimaryTxt}>Install Now</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.btnSecondary} onPress={saveToGallery}>
              <Feather name="save" size={19} color={C.primary} />
              <Text style={s.btnSecondaryTxt}>Save to Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.btnSecondary} onPress={shareQR}>
              <Feather name="share-2" size={19} color={C.primary} />
              <Text style={s.btnSecondaryTxt}>Share</Text>
            </TouchableOpacity>
          </View>

          {/* eSIM details card */}
          <View style={s.detailCard}>
            <Text style={s.detailCardTitle}>eSIM Details</Text>
            <Row label="ICCID"      value={iccid} mono />
            {esim?.msisdn && <Row label="MSISDN"    value={esim.msisdn} />}
            {esim?.confirmation_code && <Row label="Conf. Code" value={esim.confirmation_code} />}
            <Row label="Status"     value={esim?.status ?? '—'} />
            {esim?.plan?.main_country && <Row label="Country"    value={esim.plan.main_country} />}
            <Row label="Purchased"  value={esim ? new Date(esim.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'} />
          </View>

          {/* Manual activation code */}
          <View style={s.codeCard}>
            <Text style={s.codeLabel}>Manual Activation Code</Text>
            <View style={s.codeRow}>
              <Text style={s.codeTxt} numberOfLines={3} selectable>
                {activCode || '—'}
              </Text>
              <TouchableOpacity onPress={copyCode} style={s.copyBtn}>
                <Feather name="copy" size={18} color={C.primary} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <View style={s.detailRow}>
      <Text style={s.detailLabel}>{label}</Text>
      <Text style={[s.detailValue, mono && { fontFamily: 'monospace' }]}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: C.pageBg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: C.bg, borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn:{ width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: C.pageBg, borderWidth: 1, borderColor: C.border },
  headerTitle: { fontSize: 17, fontWeight: '700', color: C.text },

  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  centerTxt: { fontSize: 14, color: C.muted },
  retryBtn:  { backgroundColor: C.primary, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10 },
  retryTxt:  { color: C.bg, fontWeight: '700', fontSize: 14 },

  scroll:   { alignItems: 'center', padding: 20 },
  esimName: { fontSize: 20, fontWeight: '700', color: C.text, marginBottom: 20, textAlign: 'center' },

  qrBox: {
    padding: 18, backgroundColor: '#fff', borderRadius: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1, shadowRadius: 10, elevation: 4, marginBottom: 16,
  },
  qrImage: { width: 240, height: 240 },
  noQr:    { width: 240, height: 240, alignItems: 'center', justifyContent: 'center', gap: 12 },
  noQrTxt: { fontSize: 13, color: C.muted, textAlign: 'center' },
  hint:    { fontSize: 13, color: C.muted, textAlign: 'center', marginBottom: 20, paddingHorizontal: 20 },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 24, width: '100%' },
  chip:  { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.primaryL, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  chipTxt: { fontSize: 12, fontWeight: '600', color: C.primary },

  btns:          { width: '100%', gap: 10, marginBottom: 20 },
  btnPrimary:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.primary, paddingVertical: 14, borderRadius: 12 },
  btnPrimaryTxt: { color: '#fff', fontSize: 15, fontWeight: '600' },
  btnSecondary:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'transparent', borderWidth: 1.5, borderColor: C.primary, paddingVertical: 14, borderRadius: 12 },
  btnSecondaryTxt:   { color: C.primary, fontSize: 15, fontWeight: '600' },

  detailCard:      { width: '100%', backgroundColor: C.bg, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: C.border, gap: 10, marginBottom: 14 },
  detailCardTitle: { fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 4 },
  detailRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  detailLabel:     { fontSize: 13, color: C.muted, fontWeight: '500' },
  detailValue:     { fontSize: 13, color: C.text, fontWeight: '600', maxWidth: '60%', textAlign: 'right' },

  codeCard:  { width: '100%', backgroundColor: C.bg, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: C.border },
  codeLabel: { fontSize: 12, color: C.muted, fontWeight: '600', marginBottom: 10 },
  codeRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  codeTxt:   { flex: 1, fontSize: 11, color: C.text, fontFamily: 'monospace', lineHeight: 18 },
  copyBtn:   { padding: 4 },
});