import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useCurrency } from '../context/CurrencyContext';
import { CurrencyPickerModal } from './CurrencyPickerModal';

const C = {
  bg:      '#FFFFFF',
  text:    '#0A0A0A',
  muted:   '#6B7280',
  border:  '#EAEEF2',
  primary: '#016701',
};

/** Compact pill button (e.g. "£ GBP ▾") for screen headers — opens the currency picker sheet. */
export function CurrencySelector({ compact = false }: { compact?: boolean }) {
  const { currencyOption } = useCurrency();
  const [open, setOpen] = useState(false);

  return (
    <>
      <TouchableOpacity
        style={[st.pill, compact && st.pillCompact]}
        onPress={() => setOpen(true)}
        activeOpacity={0.8}
      >
        <Text style={st.symbol}>{currencyOption.symbol}</Text>
        <Text style={st.code}>{currencyOption.code}</Text>
        <Feather name="chevron-down" size={13} color={C.muted} />
      </TouchableOpacity>

      <CurrencyPickerModal visible={open} onClose={() => setOpen(false)} />
    </>
  );
}

const st = StyleSheet.create({
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1, borderColor: C.border, borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 7, backgroundColor: C.bg,
  },
  pillCompact: { paddingHorizontal: 8, paddingVertical: 5 },
  symbol: { fontSize: 13, fontWeight: '700', color: C.primary },
  code:   { fontSize: 12, fontWeight: '700', color: C.text },
});
