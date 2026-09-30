// app/screens/PaymentHistoryScreen.tsx
// ─────────────────────────────────────────────────────────────
// Fetches GET /transactions (Bearer token).
// Real fields: trx_id, trx_type, transactional_type, remarks,
//   status, created_at, gbp_amount, details.quantity
// ─────────────────────────────────────────────────────────────
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { transactionsApi } from '../scripts/api';
import { useCurrency } from '../context/CurrencyContext';
import { CurrencySelector } from '../components/CurrencySelector';

const C = {
  bg:      '#FFFFFF',
  pageBg:  '#F8FAFB',
  primary: '#016701',
  text:    '#0A0A0A',
  muted:   '#6B7280',
  border:  '#EAEEF2',
  red:     '#DC2626',
  greenBg: '#F0FDF4',
};

// ── Types (exact API shape) ────────────────────────────────────
type TxnDetails = {
  quantity: string;
  plan_id: number;
  price_in_gbp_per_esim: string;
};

type Transaction = {
  id: number;
  trx_type: string;             // "-" debit
  transactional_type: string;   // "Online"
  remarks: string;              // "eSIM Purchase"
  trx_id: string;               // UUID
  status: string;               // "success" | "failed" | "refunded"
  created_at: string;
  gbp_amount: number;
  details: TxnDetails;
};

type Filter = 'All' | 'success' | 'refunded' | 'failed';
const FILTERS: Filter[] = ['All', 'success', 'refunded', 'failed'];
const FILTER_LABEL: Record<Filter, string> = {
  All: 'All', success: 'Paid', refunded: 'Refunded', failed: 'Failed',
};

const STATUS_MAP: Record<string, { bg: string; color: string; label: string }> = {
  success:  { bg: '#F0FDF4', color: '#016701', label: 'Paid' },
  refunded: { bg: '#FFF7ED', color: '#C2410C', label: 'Refunded' },
  failed:   { bg: '#FEF2F2', color: '#DC2626', label: 'Failed' },
};
const getStatus = (s: string) => STATUS_MAP[s?.toLowerCase()] ?? STATUS_MAP['success'];

// ── Summary card ───────────────────────────────────────────────
function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.summaryCard}>
      <Text style={s.summaryValue}>{value}</Text>
      <Text style={s.summaryLabel}>{label}</Text>
    </View>
  );
}

// ── Transaction row ────────────────────────────────────────────
function TxnRow({ txn }: { txn: Transaction }) {
  const { formatGbp } = useCurrency();
  const st = getStatus(txn.status);
  // Show first segment of UUID as short ID
  const shortId = (txn.trx_id ?? '').split('-')[0]?.toUpperCase() || `#${txn.id}`;
  const date = new Date(txn.created_at).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
  // Amount is stored in GBP — format it in the user's selected currency
  const sign   = txn.trx_type === '-' ? '-' : '+';
  const amount = `${sign}${formatGbp(txn.gbp_amount)}`;
  const isDebit = txn.trx_type === '-';

  return (
    <View style={s.txnCard}>

      {/* Top: short ID + status badge */}
      <View style={s.txnTopRow}>
        <Text style={s.txnId}>{shortId}</Text>
        <View style={[s.badge, { backgroundColor: st.bg }]}>
          <Text style={[s.badgeTxt, { color: st.color }]}>{st.label}</Text>
        </View>
      </View>

      {/* Detail row */}
      <View style={s.txnDetailRow}>
        <View style={s.txnIcon}>
          <Feather name="smartphone" size={16} color={C.muted} />
        </View>
        <View style={s.txnInfo}>
          <Text style={s.txnRemarks}>{txn.remarks}</Text>
          <Text style={s.txnDate}>{date} · {txn.transactional_type}</Text>
          {txn.details?.quantity && txn.details.quantity !== '1' && (
            <Text style={s.txnQty}>Qty: {txn.details.quantity}</Text>
          )}
        </View>
        <Text style={[s.txnAmount, { color: isDebit ? C.text : C.primary }]}>
          {amount}
        </Text>
      </View>

      {/* Full UUID row */}
      <View style={s.uuidRow}>
        <Feather name="hash" size={11} color={C.muted} />
        <Text style={s.uuidTxt} numberOfLines={1}>{txn.trx_id}</Text>
      </View>

      {/* Download invoice */}
      <TouchableOpacity
        style={s.downloadBtn}
        onPress={() => Alert.alert('Invoice', `Downloading invoice for ${shortId}…`)}
        activeOpacity={0.75}
      >
        <Feather name="download" size={14} color={C.primary} />
        <Text style={s.downloadTxt}>Download invoice</Text>
      </TouchableOpacity>

    </View>
  );
}

// ── Main ───────────────────────────────────────────────────────
export default function PaymentHistoryScreen() {
  const router = useRouter();
  const { formatGbp } = useCurrency();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [filter,       setFilter]       = useState<Filter>('All');

  // ── Fetch ─────────────────────────────────────────────────
  const fetchTxns = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const res = await transactionsApi.getTransactions();
      setTransactions(res.data.transactions ?? []);
    } catch (err: any) {
      setError(err.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchTxns(); }, []);

  // ── Derived ───────────────────────────────────────────────
  const filtered = filter === 'All'
    ? transactions
    : transactions.filter(t => t.status?.toLowerCase() === filter);

  const totalPaid = transactions
    .filter(t => t.status?.toLowerCase() === 'success')
    .reduce((sum, t) => sum + Number(t.gbp_amount ?? 0), 0);

  const lastDate = transactions.length
    ? new Date(transactions[0].created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    : '—';

  // ─────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.pageBg} />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={20} color={C.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Payment History</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <CurrencySelector compact />
          <TouchableOpacity style={s.backBtn} onPress={() => fetchTxns(true)}>
            <Feather name="refresh-cw" size={16} color={refreshing ? C.primary : C.muted} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Loading */}
      {loading && (
        <View style={s.stateBox}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={s.stateTxt}>Loading transactions…</Text>
        </View>
      )}

      {/* Error */}
      {!loading && error && (
        <View style={s.stateBox}>
          <Feather name="wifi-off" size={36} color={C.muted} />
          <Text style={s.stateTxt}>{error}</Text>
          <TouchableOpacity style={s.retryBtn} onPress={() => fetchTxns()}>
            <Text style={s.retryTxt}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Content */}
      {!loading && !error && (
        <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

          {/* Summary */}
          <View style={s.summaryRow}>
            <SummaryCard label="Total paid"   value={formatGbp(totalPaid)} />
            <SummaryCard label="Transactions" value={`${transactions.length}`}   />
            <SummaryCard label="Last payment" value={lastDate}                   />
          </View>

          {/* Filter chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.filterRow}
          >
            {FILTERS.map(f => (
              <TouchableOpacity
                key={f}
                style={[s.chip, filter === f && s.chipOn]}
                onPress={() => setFilter(f)}
              >
                <Text style={[s.chipTxt, filter === f && s.chipTxtOn]}>
                  {FILTER_LABEL[f]}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* List */}
          {filtered.length === 0 ? (
            <View style={s.emptyBox}>
              <Feather name="inbox" size={32} color={C.muted} />
              <Text style={s.emptyTxt}>No {FILTER_LABEL[filter].toLowerCase()} transactions</Text>
            </View>
          ) : (
            filtered.map(txn => <TxnRow key={txn.id} txn={txn} />)
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: C.pageBg },
  scroll:  { flex: 1 },
  content: { padding: 16, paddingBottom: 40, gap: 12 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: C.pageBg, borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn:     { width: 36, height: 36, borderRadius: 10, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
  headerTitle: { fontSize: 16, fontWeight: '700', color: C.text },

  stateBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  stateTxt: { fontSize: 14, color: C.muted },
  retryBtn: { backgroundColor: C.primary, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10 },
  retryTxt: { color: C.bg, fontWeight: '700', fontSize: 14 },

  summaryRow:   { flexDirection: 'row', gap: 10 },
  summaryCard:  { flex: 1, backgroundColor: C.bg, borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: C.border, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6 },
  summaryValue: { fontSize: 17, fontWeight: '800', color: C.text, marginBottom: 2 },
  summaryLabel: { fontSize: 11, color: C.muted, fontWeight: '500' },

  filterRow: { flexDirection: 'row', gap: 8, paddingVertical: 4 },
  chip:      { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, backgroundColor: C.bg, borderWidth: 1, borderColor: C.border },
  chipOn:    { backgroundColor: C.primary, borderColor: C.primary },
  chipTxt:   { fontSize: 13, fontWeight: '600', color: C.muted },
  chipTxtOn: { color: '#fff' },

  txnCard: { backgroundColor: C.bg, borderRadius: 16, padding: 16, gap: 10, borderWidth: 1, borderColor: C.border, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6 },

  txnTopRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  txnId:      { fontSize: 12, fontWeight: '700', color: C.muted, letterSpacing: 0.5 },
  badge:      { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  badgeTxt:   { fontSize: 11, fontWeight: '700' },

  txnDetailRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  txnIcon:      { width: 36, height: 36, borderRadius: 10, backgroundColor: C.pageBg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
  txnInfo:      { flex: 1, gap: 2 },
  txnRemarks:   { fontSize: 14, fontWeight: '600', color: C.text },
  txnDate:      { fontSize: 12, color: C.muted },
  txnQty:       { fontSize: 11, color: C.muted },
  txnAmount:    { fontSize: 16, fontWeight: '800' },

  uuidRow: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.pageBg, borderRadius: 8, padding: 8 },
  uuidTxt: { flex: 1, fontSize: 10, color: C.muted, fontFamily: 'monospace' },

  downloadBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: C.primary, backgroundColor: C.greenBg },
  downloadTxt: { fontSize: 13, fontWeight: '600', color: C.primary },

  emptyBox: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  emptyTxt: { fontSize: 14, color: C.muted, fontWeight: '500' },
});