import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { supportTicketsApi, type SupportTicket, type SupportTicketMessage } from '../../../scripts/api';

const C = {
  bg:      '#FFFFFF',
  pageBg:  '#F8FAFB',
  primary: '#016701',
  text:    '#0A0A0A',
  muted:   '#6B7280',
  border:  '#EAEEF2',
  bubble:  '#F0FDF4',
};

function extractTicket(res: any): SupportTicket | null {
  return res?.data?.ticket ?? res?.data ?? null;
}

function isFromUser(m: SupportTicketMessage) {
  if (typeof m.is_admin === 'boolean') return !m.is_admin;
  if (typeof m.is_admin === 'number')  return m.is_admin === 0;
  if (m.from) return m.from === 'user';
  return true;
}

export default function SupportTicketDetailScreen() {
  const router = useRouter();
  const { id, subject } = useLocalSearchParams<{ id: string; subject?: string }>();

  const [ticket,  setTicket]  = useState<SupportTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const [reply,     setReply]     = useState('');
  const [sending,   setSending]   = useState(false);
  const listRef = useRef<FlatList>(null);

  const fetchTicket = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await supportTicketsApi.getTicket(id);
      setTicket(extractTicket(res));
    } catch (err: any) {
      setError(err.message || 'Failed to load this ticket');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchTicket(); }, [fetchTicket]);

  const handleReply = async () => {
    if (!reply.trim() || !id) return;
    setSending(true);
    try {
      await supportTicketsApi.replyTicket(id, { message: reply.trim() });
      setReply('');
      await fetchTicket();
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (err: any) {
      setError(err.message || 'Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  const messages: SupportTicketMessage[] = ticket?.messages ?? [];

  return (
    <SafeAreaView style={st.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      {/* Header */}
      <View style={st.header}>
        <TouchableOpacity onPress={() => router.back()} style={st.backBtn}>
          <Feather name="arrow-left" size={20} color={C.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={st.headerTitle} numberOfLines={1}>{ticket?.subject ?? subject ?? 'Ticket'}</Text>
          {ticket?.status ? <Text style={st.headerSub}>{ticket.status}</Text> : null}
        </View>
        <TouchableOpacity onPress={fetchTicket} style={st.backBtn}>
          <Feather name="refresh-cw" size={16} color={loading ? C.primary : C.muted} />
        </TouchableOpacity>
      </View>

      {loading && !ticket && (
        <View style={st.stateBox}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={st.stateTxt}>Loading ticket…</Text>
        </View>
      )}

      {!loading && error && !ticket && (
        <View style={st.stateBox}>
          <Feather name="wifi-off" size={36} color={C.muted} />
          <Text style={st.stateTxt}>{error}</Text>
          <TouchableOpacity style={st.retryBtn} onPress={fetchTicket}>
            <Text style={st.retryTxt}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {ticket && (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(m, i) => String(m.id ?? i)}
            contentContainerStyle={st.msgList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
            ListEmptyComponent={
              <View style={st.stateBox}>
                <Feather name="message-square" size={32} color={C.muted} />
                <Text style={st.stateTxt}>No messages on this ticket yet</Text>
              </View>
            }
            renderItem={({ item }) => {
              const mine = isFromUser(item);
              return (
                <View style={[st.msgRow, mine && st.msgRowUser]}>
                  <View style={[st.bubble, mine ? st.bubbleUser : st.bubbleAgent]}>
                    <Text style={[st.bubbleText, mine && st.bubbleTextUser]}>{item.message}</Text>
                    {item.created_at ? (
                      <Text style={[st.bubbleTime, mine && st.bubbleTimeUser]}>
                        {new Date(item.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    ) : null}
                  </View>
                </View>
              );
            }}
          />

          {/* Reply bar */}
          <View style={st.inputBar}>
            <TextInput
              style={st.textInput}
              placeholder="Type a reply…"
              placeholderTextColor={C.muted}
              value={reply}
              onChangeText={setReply}
              multiline
            />
            <TouchableOpacity
              style={[st.sendBtn, (!reply.trim() || sending) && st.sendBtnDisabled]}
              onPress={handleReply}
              disabled={!reply.trim() || sending}
            >
              {sending ? <ActivityIndicator size="small" color="#fff" /> : <Feather name="send" size={18} color="#fff" />}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: C.bg, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: C.pageBg,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 15, fontWeight: '700', color: C.text },
  headerSub:   { fontSize: 12, color: C.muted, marginTop: 1, textTransform: 'capitalize' },

  stateBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  stateTxt: { fontSize: 14, color: C.muted, textAlign: 'center' },
  retryBtn: { backgroundColor: C.primary, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10 },
  retryTxt: { color: C.bg, fontWeight: '700', fontSize: 14 },

  msgList: { padding: 16, gap: 12, flexGrow: 1 },
  msgRow:     { flexDirection: 'row' },
  msgRowUser: { flexDirection: 'row-reverse' },
  bubble:      { maxWidth: '80%', borderRadius: 16, padding: 12 },
  bubbleAgent: { backgroundColor: C.pageBg, borderWidth: 1, borderColor: C.border, borderBottomLeftRadius: 4 },
  bubbleUser:  { backgroundColor: C.primary, borderBottomRightRadius: 4 },
  bubbleText:     { fontSize: 14, color: C.text, lineHeight: 20 },
  bubbleTextUser: { color: '#fff' },
  bubbleTime:     { fontSize: 10, color: C.muted, marginTop: 4, textAlign: 'right' },
  bubbleTimeUser: { color: 'rgba(255,255,255,0.65)' },

  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    padding: 12, paddingBottom: 16,
    backgroundColor: C.bg, borderTopWidth: 1, borderTopColor: C.border,
  },
  textInput: {
    flex: 1, minHeight: 42, maxHeight: 100,
    backgroundColor: C.pageBg, borderRadius: 12, borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: C.text,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#A7C7A7' },
});
