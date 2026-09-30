import { Feather } from '@expo/vector-icons';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useCurrency } from '../context/CurrencyContext';

const C = {
  bg:      '#FFFFFF',
  text:    '#0A0A0A',
  muted:   '#6B7280',
  border:  '#EAEEF2',
  primary: '#016701',
  onBg:    '#F0FDF4',
};

export function CurrencyPickerModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { currency, currencies, setCurrency } = useCurrency();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={st.overlay}>
        <View style={st.sheet}>
          <View style={st.handle} />
          <View style={st.header}>
            <Text style={st.title}>Select Currency</Text>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={20} color={C.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {currencies.map((c) => {
              const selected = c.code === currency;
              return (
                <TouchableOpacity
                  key={c.code}
                  style={[st.item, selected && st.itemOn]}
                  onPress={() => { setCurrency(c.code); onClose(); }}
                  activeOpacity={0.8}
                >
                  <View style={st.itemLeft}>
                    <Text style={st.itemSymbol}>{c.symbol}</Text>
                    <View>
                      <Text style={[st.itemCode, selected && st.itemCodeOn]}>{c.code}</Text>
                      <Text style={st.itemLabel}>{c.label}</Text>
                    </View>
                  </View>
                  {selected && <Feather name="check" size={16} color={C.primary} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const st = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: C.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingBottom: 34, maxHeight: '70%',
  },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: 'center', marginTop: 10, marginBottom: 4 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  title: { fontSize: 16, fontWeight: '700', color: C.text },

  item: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: C.border + '80',
  },
  itemOn:     { backgroundColor: C.onBg },
  itemLeft:   { flexDirection: 'row', alignItems: 'center', gap: 12 },
  itemSymbol: { fontSize: 18, fontWeight: '800', color: C.primary, width: 34, textAlign: 'center' },
  itemCode:   { fontSize: 14, fontWeight: '700', color: C.text },
  itemCodeOn: { color: C.primary },
  itemLabel:  { fontSize: 12, color: C.muted, marginTop: 1 },
});
