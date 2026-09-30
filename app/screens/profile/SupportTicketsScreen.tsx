import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { supportTicketsApi, type SupportTicket } from '../../../scripts/api';

const C = {
  bg:      '#FFFFFF',
  pageBg:  '#F8FAFB',
  primary: '#016701',
  text:    '#0A0A0A',
  muted:   '#6B7280',
  border:  '#EAEEF2',
  red:     '#DC2626',
  redBg:   '#FEF2F2',
  amber:   '#D97706',
  amberBg: '#FFFBEB',
  greenBg: '#F0FDF4',
};

const STATUS_META: Record<string, { color: string; bg: string }> = {
  open:     { color: C.primary, bg: C.greenBg },
  pending:  { color: C.amber,   bg: C.amberBg },
  closed:   { color: C.muted,   bg: C.pageBg },
  resolved: { color: C.primary, bg: C.greenBg },
};

function statusMeta(status: string) {
  return STATUS_META[status?.toLowerCase()] ?? { color: C.muted, bg: C.pageBg };
}

function extractTickets(res: any): SupportTicket[] {
  return (
    res?.data?.tickets ??
    res?.data?.support_tickets ??
    (Array.isArray(res?.data) ? res.data : []) ??
    []
  );
}

export default function SupportTicketsScreen() {
  const router = useRouter();

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [subject,    setSubject]    = useState('');
  const [message,    setMessage]    = useState('');
  const [creating,   setCreating]   = useState(false);
  const [createError, setCreateError] = useState('');

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await supportTicketsApi.getTickets();
      setTickets(extractTickets(res));
    } catch (err: any) {
      setError(err.message || 'Failed to load support tickets');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const handleCreate = async () => {
    if (!subject.trim())  { setCreateError('Please enter a subject.'); return; }
    if (!message.trim())  { setCreateError('Please describe your issue.'); return; }
    setCreateError('');
    setCreating(true);
    try {
      await supportTicketsApi.createTicket({ subject: subject.trim(), message: message.trim() });
      setSubject('');
      setMessage('');
      setShowCreate(false);
      fetchTickets();
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create ticket. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const openTicket = (ticket: SupportTicket) => {
    router.push({
      pathname: '/screens/profile/SupportTicketDetailScreen' as any,
      params: { id: String(ticket.id), subject: ticket.subject },
    });
  };

  return (
    <SafeAreaView style={st.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.pageBg} />

      {/* Header */}
      <View style={st.header}>
        <TouchableOpacity style={st.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={20} color={C.text} />
        </TouchableOpacity>
        <Text style={st.headerTitle}>Support Tickets</Text>
        <TouchableOpacity style={st.backBtn} onPress={() => setShowCreate(true)}>
          <Feather name="plus" size={20} color={C.primary} />
        </TouchableOpacity>
      </View>

      {/* Loading */}
      {loading && (
        <View style={st.stateBox}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={st.stateTxt}>Loading tickets…</Text>
        </View>
      )}

      {/* Error */}
      {!loading && error && (
        <View style={st.stateBox}>
          <Feather name="wifi-off" size={36} color={C.muted} />
          <Text style={st.stateTxt}>{error}</Text>
          <TouchableOpacity style={st.retryBtn} onPress={fetchTickets}>
            <Text style={st.retryTxt}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* List */}
      {!loading && !error && (
        <ScrollView style={st.scroll} contentContainerStyle={st.scrollContent} showsVerticalScrollIndicator={false}>
          {tickets.length === 0 ? (
            <View style={st.stateBox}>
              <Feather name="inbox" size={40} color={C.muted} />
              <Text style={st.emptyTitle}>No support tickets yet</Text>
              <Text style={st.emptySub}>Raise a ticket and our team will get back to you.</Text>
              <TouchableOpacity style={st.retryBtn} onPress={() => setShowCreate(true)}>
                <Text style={st.retryTxt}>New ticket</Text>
              </TouchableOpacity>
            </View>
          ) : (
            tickets.map(ticket => {
              const meta = statusMeta(ticket.status);
              return (
                <TouchableOpacity
                  key={ticket.id}
                  style={st.ticketCard}
                  activeOpacity={0.8}
                  onPress={() => openTicket(ticket)}
                >
                  <View style={st.ticketTop}>
                    <Text style={st.ticketSubject} numberOfLines={1}>{ticket.subject}</Text>
                    <View style={[st.badge, { backgroundColor: meta.bg }]}>
                      <Text style={[st.badgeTxt, { color: meta.color }]}>{ticket.status ?? 'Open'}</Text>
                    </View>
                  </View>
                  <Text style={st.ticketDate}>
                    {ticket.created_at ? new Date(ticket.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}
                  </Text>
                </TouchableOpacity>
              );
            })
          )}
          <View style={{ height: 20 }} />
        </ScrollView>
      )}

      {/* New ticket modal */}
      <Modal visible={showCreate} animationType="slide" transparent onRequestClose={() => setShowCreate(false)}>
        <KeyboardAvoidingView
          style={st.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={st.modalSheet}>
            <View style={st.modalHandle} />
            <View style={st.modalHeader}>
              <Text style={st.modalTitle}>New support ticket</Text>
              <TouchableOpacity onPress={() => setShowCreate(false)}>
                <Feather name="x" size={20} color={C.text} />
              </TouchableOpacity>
            </View>

            <Text style={st.fieldLabel}>Subject</Text>
            <TextInput
              style={st.input}
              value={subject}
              onChangeText={setSubject}
              placeholder="e.g. My eSIM won't activate"
              placeholderTextColor={C.muted}
            />

            <Text style={st.fieldLabel}>Message</Text>
            <TextInput
              style={[st.input, st.textArea]}
              value={message}
              onChangeText={setMessage}
              placeholder="Describe your issue…"
              placeholderTextColor={C.muted}
              multiline
              textAlignVertical="top"
            />

            {createError ? <Text style={st.errorTxt}>{createError}</Text> : null}

            <TouchableOpacity
              style={[st.submitBtn, creating && { opacity: 0.7 }]}
              onPress={handleCreate}
              disabled={creating}
            >
              {creating
                ? <ActivityIndicator color="#fff" />
                : <Text style={st.submitBtnText}>Submit ticket</Text>}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: C.pageBg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: C.bg, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: C.pageBg,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border,
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: C.text },

  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 10 },

  stateBox: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  stateTxt: { fontSize: 14, color: C.muted, textAlign: 'center' },
  retryBtn: { backgroundColor: C.primary, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10, marginTop: 4 },
  retryTxt: { color: C.bg, fontWeight: '700', fontSize: 14 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: C.text },
  emptySub:   { fontSize: 13, color: C.muted, textAlign: 'center' },

  ticketCard: {
    backgroundColor: C.bg, borderRadius: 14, padding: 14, gap: 6,
    borderWidth: 1, borderColor: C.border,
  },
  ticketTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  ticketSubject: { flex: 1, fontSize: 14, fontWeight: '700', color: C.text },
  ticketDate: { fontSize: 12, color: C.muted },
  badge:    { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  badgeTxt: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: C.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: 34, gap: 10,
  },
  modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: 'center', marginBottom: 6 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  modalTitle: { fontSize: 16, fontWeight: '700', color: C.text },

  fieldLabel: { fontSize: 12, fontWeight: '600', color: C.muted, textTransform: 'uppercase', letterSpacing: 0.4 },
  input: {
    borderWidth: 1.5, borderColor: C.border, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: C.text,
    backgroundColor: C.pageBg,
  },
  textArea: { minHeight: 100 },
  errorTxt: { fontSize: 12, color: C.red },

  submitBtn: {
    backgroundColor: C.primary, borderRadius: 14, paddingVertical: 15,
    alignItems: 'center', justifyContent: 'center', marginTop: 4,
  },
  submitBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
