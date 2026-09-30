import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import * as Clipboard from 'expo-clipboard';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const C = {
  bg:      '#FFFFFF',
  pageBg:  '#F8FAFB',
  primary: '#016701',
  text:    '#0A0A0A',
  muted:   '#6B7280',
  border:  '#EAEEF2',
  cardBg:  '#FFFFFF',
  greenBg: '#EBF5EB',
};

const REFERRAL_CODE = 'MAPIANS2024';

export default function CreditsScreen() {
  const [voucher, setVoucher] = useState('');

  const handleCopy = () => {
    Clipboard.setStringAsync(REFERRAL_CODE);
    Alert.alert('Copied!', 'Referral code copied to clipboard.');
  };

  const handleShare = () => {
    Alert.alert('Share', `Share your referral code: ${REFERRAL_CODE}`);
  };

  const handleSubmitVoucher = () => {
    if (!voucher.trim()) {
      Alert.alert('Error', 'Please enter a voucher code.');
      return;
    }
    Alert.alert('Submitted', `Voucher "${voucher}" submitted!`);
    setVoucher('');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.pageBg} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* ── PAGE TITLE ─────────────────────────────────────── */}
        <Text style={styles.pageTitle}>Your Mapians Credits</Text>

        {/* ── BALANCE CARD ───────────────────────────────────── */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceAmount}>US$0.00</Text>
          <Text style={styles.balanceDesc}>
            Use your Mapians credits at checkout to get a discount on any eSIM plan.
          </Text>
          <View style={styles.balanceBtns}>
            <TouchableOpacity style={styles.outlineBtn} activeOpacity={0.75}>
              <Text style={styles.outlineBtnText}>Buy data plan</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.outlineBtn} activeOpacity={0.75}>
              <Text style={styles.outlineBtnText}>View history</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── REFERRAL CARD ──────────────────────────────────── */}
        <View style={styles.referralCard}>
          <Text style={styles.referralTitle}>
            Refer a friend, get US$5 in Mapians credits!
          </Text>
          <Text style={styles.referralDesc}>
            Share your referral code and your friends will get US$5 off their
            first plan while you get US$5 in Mapians credits. It's a win-win!
          </Text>

          {/* Referral code box */}
          <View style={styles.codeBox}>
            <View>
              <Text style={styles.codeLabel}>Referral code</Text>
              <Text style={styles.codeValue}>{REFERRAL_CODE}</Text>
            </View>
            <TouchableOpacity onPress={handleCopy} activeOpacity={0.7}>
              <Feather name="copy" size={20} color={C.muted} />
            </TouchableOpacity>
          </View>

          {/* Share button */}
          <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.85}>
            <Feather name="share-2" size={16} color={C.bg} />
            <Text style={styles.shareBtnText}>Share code</Text>
          </TouchableOpacity>
        </View>

        {/* ── HOW IT WORKS ───────────────────────────────────── */}
        <View style={styles.howCard}>
          <Text style={styles.howTitle}>How it works</Text>

          {[
            {
              icon: 'account-plus',
              lib:  'material',
              title: 'Invite friends',
              desc:  'Send them your unique referral code.',
            },
            {
              icon: 'calendar',
              lib:  'feather',
              title: 'Wait for purchase',
              desc:  'Make sure they use your code at checkout.',
            },
            {
              icon: 'gift',
              lib:  'feather',
              title: 'Get instant rewards',
              desc:  'Your friends save on their first eSIM plan while you get Mapians credits!',
            },
          ].map((step, i) => (
            <View key={i} style={styles.howStep}>
              <View style={styles.howIconWrap}>
                {step.lib === 'material'
                  ? <MaterialCommunityIcons name={step.icon} size={20} color={C.primary} />
                  : <Feather name={step.icon} size={18} color={C.primary} />
                }
              </View>
              <View style={styles.howTextWrap}>
                <Text style={styles.howStepTitle}>{step.title}</Text>
                <Text style={styles.howStepDesc}>{step.desc}</Text>
              </View>
            </View>
          ))}

          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.termsLink}>Read the terms and conditions.</Text>
          </TouchableOpacity>
        </View>

        {/* ── OR DIVIDER ─────────────────────────────────────── */}
        <View style={styles.orRow}>
          <View style={styles.orLine} />
          <Text style={styles.orText}>or</Text>
          <View style={styles.orLine} />
        </View>

        {/* ── VOUCHER CARD ───────────────────────────────────── */}
        <View style={styles.voucherCard}>
          <Text style={styles.voucherTitle}>Redeem a Mapians voucher</Text>
          <Text style={styles.voucherDesc}>
            Got a voucher code for Mapians credits? Enter it below and we'll
            add them to your account!
          </Text>

          <Text style={styles.inputLabel}>Mapians voucher</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter a voucher code"
            placeholderTextColor={C.muted}
            value={voucher}
            onChangeText={setVoucher}
            autoCapitalize="characters"
          />

          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleSubmitVoucher}
            activeOpacity={0.85}
          >
            <Text style={styles.submitBtnText}>Submit</Text>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.termsLink}>Read the terms and conditions.</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.pageBg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },

  // Page title
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: C.text,
    marginBottom: 4,
    marginLeft: 4,
  },

  // Balance card
  balanceCard: {
    backgroundColor: C.cardBg,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    gap: 10,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: C.text,
  },
  balanceDesc: {
    fontSize: 13,
    color: C.muted,
    lineHeight: 19,
  },
  balanceBtns: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  outlineBtn: {
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  outlineBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: C.text,
  },

  // Referral card
  referralCard: {
    backgroundColor: C.greenBg,
    borderRadius: 20,
    padding: 20,
    gap: 14,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  referralTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: C.text,
    lineHeight: 26,
  },
  referralDesc: {
    fontSize: 13,
    color: C.muted,
    lineHeight: 20,
  },
  codeBox: {
    backgroundColor: C.bg,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: C.border,
  },
  codeLabel: {
    fontSize: 11,
    color: C.muted,
    marginBottom: 4,
  },
  codeValue: {
    fontSize: 17,
    fontWeight: '700',
    color: C.text,
    letterSpacing: 1,
  },
  shareBtn: {
    backgroundColor: C.primary,
    borderRadius: 14,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  shareBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: C.bg,
  },

  // How it works
  howCard: {
    backgroundColor: C.cardBg,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: C.border,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  howTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: C.text,
  },
  howStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  howIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.greenBg,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  howTextWrap: {
    flex: 1,
    gap: 3,
  },
  howStepTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: C.text,
  },
  howStepDesc: {
    fontSize: 13,
    color: C.muted,
    lineHeight: 19,
  },
  termsLink: {
    fontSize: 12,
    color: C.muted,
    textDecorationLine: 'underline',
    textAlign: 'center',
    marginTop: 4,
  },

  // OR divider
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 4,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: C.border,
  },
  orText: {
    fontSize: 12,
    color: C.muted,
    fontWeight: '500',
  },

  // Voucher card
  voucherCard: {
    backgroundColor: C.greenBg,
    borderRadius: 20,
    padding: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  voucherTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: C.text,
  },
  voucherDesc: {
    fontSize: 13,
    color: C.muted,
    lineHeight: 20,
  },
  inputLabel: {
    fontSize: 12,
    color: C.muted,
    fontWeight: '500',
    marginBottom: -4,
  },
  input: {
    backgroundColor: C.bg,
    borderRadius: 14,
    padding: 16,
    fontSize: 15,
    color: C.text,
    borderWidth: 1,
    borderColor: C.border,
  },
  submitBtn: {
    backgroundColor: C.primary,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: C.bg,
  },
});