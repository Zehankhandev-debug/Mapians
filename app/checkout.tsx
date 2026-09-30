import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { WebView } from 'react-native-webview';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
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
import { nationalityApi, ordersApi, plansApi, type Nationality, type Plan } from '../scripts/api';
import { useCurrency } from '../context/CurrencyContext';

type PlanDetails = Plan & { supported_countries: string[] };

type SavedOrder = {
  token:       string;
  order_id:    string;
  amount:      string; // server-confirmed charge (post-coupon), native ledger currency
  couponCode:  string | null;
  authToken?:  string;
  user?:       any;
};

const GENDERS = ['Male', 'Female', 'Other'];


const planTypeLabel = (p: Plan) => {
  if (p.data_in_gb?.trim().toLowerCase() === 'unlimited') return 'Truly Unlimited';
  return Number(p.is_daily_data_plan) === 1 ? 'Per-Day Data' : 'Fixed Data';
};

// Data-only plans report "0" for voice/SMS — hide those rows entirely rather
// than showing a confusing "Not included" line.
const isIncluded = (value: string | null | undefined) => !!value && value !== '0';

const formatRoamingData = (p: Plan) =>
  p.data_in_gb?.trim().toLowerCase() === 'unlimited' ? 'Unlimited' : `${p.data_in_gb} GB`;

const formatPlanId = (id: number) => `P${String(id).padStart(6, '0')}`;

const formatCoverage = (countries: string[]) => {
  if (!countries?.length) return '—';
  if (countries.length === 1) return countries[0];
  return `${countries[0]} + ${countries.length - 1} countries`;
};

const stripHtml = (html: string) =>
  html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

type DescBlock = { title: string; body: string; color: string; bg: string };

const BLOCK_THEMES = [
  { color: '#2563EB', bg: '#EFF6FF' },
  { color: '#7C3AED', bg: '#F5F3FF' },
  { color: '#016701', bg: '#F0FDF4' },
];

// Plan descriptions come back as a handful of <h4 title>/<p body> blocks —
// pull those out so they render as native cards instead of dumping raw HTML.
function parseDescriptionBlocks(html: string | null): DescBlock[] {
  if (!html) return [];
  const blocks: DescBlock[] = [];
  const re = /<h4[^>]*>([\s\S]*?)<\/h4>\s*<p[^>]*>([\s\S]*?)<\/p>/g;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(html)) !== null) {
    blocks.push({ title: stripHtml(m[1]), body: stripHtml(m[2]), ...BLOCK_THEMES[i % BLOCK_THEMES.length] });
    i++;
  }
  return blocks;
}

const ACTIVATION_STEPS = [
  "Once you have purchased your eSIM, you'll receive it through email as a QR code.",
  'Download via your device by scanning the QR code below — make sure you are on a Wi-Fi network during installation.',
  'The eSIM auto-installs on your phone. Once done, it will be active.',
];

const REVOLUT_MODE = 'prod';

const C = {
  bg:       '#FFFFFF',
  pageBg:   '#F8FAFB',
  primary:  '#016701',
  text:     '#0A0A0A',
  muted:    '#6B7280',
  border:   '#EAEEF2',
  red:      '#DC2626',
  redBg:    '#FEF2F2',
  goldBg:   '#FEF3C7',
  gold:     '#D97706',
  saveBg:   '#DCFCE7',
  saveText: '#016701',
};

// ── Build Revolut card-field HTML — mirrors payment.js on the website exactly ─
function buildRevolutHtml(
  token:   string,
  orderId: string,
  amount:  string,
  mode:    string,
  email:   string,
): string {
  const scriptSrc = mode === 'prod'
    ? 'https://merchant.revolut.com/embed.js'
    : 'https://sandbox-merchant.revolut.com/embed.js';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    html,body{height:100%}
    body{
      font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
      background:#F8FAFB;
      display:flex;flex-direction:column;
      min-height:100%;
    }
    .scroll-area{flex:1;overflow-y:auto;padding:24px 20px 16px}
    h2{font-size:18px;font-weight:700;color:#0A0A0A;margin-bottom:4px;text-align:center}
    .sub{font-size:13px;color:#6B7280;text-align:center;margin-bottom:24px}
    label{font-size:11px;font-weight:600;color:#6B7280;text-transform:uppercase;letter-spacing:.5px;display:block;margin-bottom:6px}
    .field-wrap{margin-bottom:14px}
    input[type=text],input[type=email]{
      width:100%;padding:14px 16px;
      border:1.5px solid #EAEEF2;border-radius:12px;
      font-size:15px;background:#fff;color:#0A0A0A;
      -webkit-appearance:none;outline:none
    }
    input[type=text]:focus,input[type=email]:focus{border-color:#016701}
    .card-wrap{
      background:#fff;border:1.5px solid #EAEEF2;
      border-radius:12px;padding:14px;
      min-height:60px;margin-bottom:14px
    }
    #error{
      color:#DC2626;font-size:13px;margin-bottom:12px;
      text-align:center;display:none;
      background:#FEF2F2;border-radius:8px;padding:8px 12px
    }
    #loader{text-align:center;padding:20px;color:#6B7280;font-size:14px}
    .footer{
      padding:16px 20px;
      background:#fff;
      border-top:1px solid #EAEEF2;
    }
    #completePurchaseButton{
      width:100%;background:#016701;color:#fff;
      border:none;padding:17px;border-radius:14px;
      font-size:16px;font-weight:700;cursor:pointer;
      box-shadow:0 4px 14px rgba(1,103,1,0.30);
      -webkit-appearance:none;
    }
    #completePurchaseButton:disabled{opacity:.55;box-shadow:none}
  </style>
</head>
<body>
  <div class="scroll-area">
    <h2>Secure Payment</h2>
    <p class="sub">Your payment is secured by Revolut</p>

    <div class="field-wrap">
      <label>Cardholder Name</label>
      <input type="text" id="card_holder_name" name="card_holder_name" placeholder="John Doe" autocomplete="cc-name" />
    </div>

    <div class="field-wrap">
      <label>Email</label>
      <input type="email" id="guest_email" name="guest_email" placeholder="your@email.com" value="${email}" autocomplete="email" />
    </div>

    <label>Card Details</label>
    <div class="card-wrap" id="revolut-card-field"></div>

    <div id="error"></div>
    <div id="loader">Loading payment form…</div>
  </div>

  <div class="footer">
    <button id="completePurchaseButton" disabled style="display:none">Pay ${amount}</button>
  </div>

  <script>
    var cardField;
    var UserEmail = '${email}';
    var RevolutMode = '${mode}';
    var RevolutCheckoutJSUrl = '${scriptSrc}';

    function showError(msg) {
      var el = document.getElementById('error');
      el.textContent = msg;
      el.style.display = 'block';
    }

    function initializeRevolut(publicToken, orderId) {
      if (typeof RevolutCheckout === 'undefined') {
        var script = document.createElement('script');
        script.src = RevolutCheckoutJSUrl;
        script.onload = function() { startRevolutInstance(publicToken, orderId); };
        script.onerror = function() {
          document.getElementById('loader').textContent = 'Failed to load payment SDK.';
          window.ReactNativeWebView && window.ReactNativeWebView.postMessage(
            JSON.stringify({type:'error',message:'Revolut SDK failed to load'})
          );
        };
        document.head.appendChild(script);
      } else {
        startRevolutInstance(publicToken, orderId);
      }
    }

    function startRevolutInstance(publicToken, orderId) {
      RevolutCheckout(publicToken, RevolutMode).then(function(instance) {
        cardField = instance.createCardField({
          target: document.getElementById('revolut-card-field'),
          onSuccess: function() {
            document.getElementById('completePurchaseButton').textContent = 'Payment successful!';
            window.ReactNativeWebView && window.ReactNativeWebView.postMessage(
              JSON.stringify({type:'success',orderId:orderId})
            );
          },
          onError: function(error) {
            console.error('Revolut Card Field initialization error:', error);
            showError('Payment failed: ' + (error && error.message ? error.message : 'Unknown error'));
            document.getElementById('completePurchaseButton').disabled = false;
            document.getElementById('completePurchaseButton').textContent = 'Try Again - ${amount}';
          }
        });

        document.getElementById('loader').style.display = 'none';
        document.getElementById('completePurchaseButton').style.display = 'block';
        document.getElementById('completePurchaseButton').disabled = false;

        document.getElementById('completePurchaseButton').addEventListener('click', function() {
          var cardholderName = document.getElementById('card_holder_name').value.trim();
          if (!cardholderName || cardholderName.split(' ').filter(Boolean).length < 2) {
            showError('Card holder name must be at least two words');
            return;
          }
          var currentGuestEmail = document.getElementById('guest_email').value.trim() || UserEmail;
          document.getElementById('completePurchaseButton').disabled = true;
          document.getElementById('completePurchaseButton').textContent = 'Processing payment…';
          document.getElementById('error').style.display = 'none';

          try {
            var submission = cardField.submit({
              name:  cardholderName,
              email: currentGuestEmail,
            });
            if (submission && typeof submission.catch === 'function') {
              submission.catch(function(error) {
                console.error('Revolut Payment Submission Error:', error);
                showError('Payment failed: ' + (error && error.message ? error.message : 'Unknown error'));
                document.getElementById('completePurchaseButton').disabled = false;
                document.getElementById('completePurchaseButton').textContent = 'Try Again - ${amount}';
              });
            }
          } catch(error) {
            console.error('Revolut Sync Error:', error);
            showError('Checkout error. Please refresh and try again.');
            document.getElementById('completePurchaseButton').disabled = false;
            document.getElementById('completePurchaseButton').textContent = 'Try Again - ${amount}';
          }
        });

      }).catch(function(err) {
        var msg = (err && err.message) ? err.message : 'Could not initialize payment.';
        document.getElementById('loader').textContent = msg;
        window.ReactNativeWebView && window.ReactNativeWebView.postMessage(
          JSON.stringify({type:'error',message:msg})
        );
      });
    }

    initializeRevolut('${token}', '${orderId}');
  </script>
</body>
</html>`;
}

// ── Screen ────────────────────────────────────────────────────────────────────
export default function CheckoutScreen() {
  const router  = useRouter();
  const params  = useLocalSearchParams();
  const { profile, isAuthenticated, adoptSession, loginWithGoogle } = useAuth();
  const { formatGbp } = useCurrency();
  const [googleLoading, setGoogleLoading] = useState(false);

  const { isReady: googleReady, signIn: signInWithGoogle } = useGoogleAuth({
    onIdToken: async (idToken) => {
      try {
        await loginWithGoogle(idToken);
      } catch (err: any) {
        setOrderError(err?.message || 'Google sign-in failed. Please try again.');
      }
    },
    onError: (message) => setOrderError(message),
  });

  const plan = params.plan
    ? JSON.parse(params.plan as string)
    : { id: 1, data_in_gb: '10', validity: '30', price: '$19.97' };

  const requiresKyc = params.fromProvider === 'true';
  const providerLabel = (params.providerName as string) || 'Mapians';

  const planDataLabel = plan.data_in_gb ? `${plan.data_in_gb} GB` : (plan.data ?? '—');
  const planDaysLabel = plan.validity   ? `${plan.validity} days`  : (plan.days ?? '—');
  const rawPrice      = parseFloat(String(plan.price).replace(/[^\d.]/g, '')) || 0;

  const [promo,        setPromo]        = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoError,   setPromoError]   = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [savedOrder,   setSavedOrder]   = useState<SavedOrder | null>(null);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError,   setOrderError]   = useState('');
  const [webviewHtml,  setWebviewHtml]  = useState('');
  const [showPayment,  setShowPayment]  = useState(false);
  const [planDetails,      setPlanDetails]      = useState<PlanDetails | null>(null);
  const [showAllCountries, setShowAllCountries] = useState(false);

  // Guest checkout (not signed in) — ask for an email so create-order can
  // issue a receipt/auth token instead of requiring login up front.
  const [guestEmail,      setGuestEmail]      = useState('');
  const [guestEmailTouched, setGuestEmailTouched] = useState(false);
  const guestEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail.trim());
  const guestEmailError = guestEmailTouched && !guestEmailValid ? 'Enter a valid email address.' : '';

  // KYC traveller details
  const [kycFirstName,      setKycFirstName]      = useState('');
  const [kycLastName,       setKycLastName]       = useState('');
  const [kycSecondLastName, setKycSecondLastName] = useState('');
  const [kycDocNumber,      setKycDocNumber]      = useState('');
  const [kycBirthDate,      setKycBirthDate]      = useState('');
  const [kycGender,         setKycGender]         = useState('');
  const [kycNationality,    setKycNationality]    = useState('');
  const [showGenderPicker,      setShowGenderPicker]      = useState(false);
  const [showNationalityPicker, setShowNationalityPicker] = useState(false);
  const [nationalitySearch,     setNationalitySearch]     = useState('');
  const [nationalities,         setNationalities]         = useState<Nationality[]>([]);
  const [nationalitiesLoading,  setNationalitiesLoading]  = useState(true);

  useEffect(() => {
    if (!plan?.id) return;
    plansApi.getPlanDetails(plan.id)
      .then(res => setPlanDetails(res.data.plan))
      .catch(() => setPlanDetails(null));
  }, [plan?.id]);

  useEffect(() => {
    if (!requiresKyc) { setNationalitiesLoading(false); return; }
    nationalityApi.getNationalities()
      .then(res => {
        const list: Nationality[] =
          res?.data?.nationalities ??
          res?.data?.data ??
          (Array.isArray(res?.data) ? res.data : []) ??
          (Array.isArray(res) ? res : []);
        setNationalities(list);
      })
      .catch(() => setNationalities([]))
      .finally(() => setNationalitiesLoading(false));
  }, [requiresKyc]);

  const descriptionBlocks = planDetails ? parseDescriptionBlocks(planDetails.description) : [];

  // Single-country plans often come back with an empty supported_countries
  // array — coverage is implicitly just their own main_country. Fall back so
  // "Coverage"/"Countries Covered" still shows 1 country instead of vanishing.
  const coverageCountries = planDetails?.supported_countries?.length
    ? planDetails.supported_countries
    : planDetails?.main_country
      ? [planDetails.main_country]
      : [];

  // ── Totals ──────────────────────────────────────────────────────────────
  // The server only confirms one number (transaction.amount, post-coupon) in
  // its own ledger currency. We derive the discount as a ratio against the
  // plan's un-discounted price, then apply that ratio to the GBP baseline so
  // every price on this screen — including the Pay button — renders in
  // whatever currency is selected in the app, not a hardcoded symbol.
  const quantity     = 1;
  const baseTotalGbp = (Number(plan.gbp_price) || rawPrice) * quantity;

  const computeDisplayTotalGbp = (confirmedAmountStr: string | null | undefined) => {
    const confirmed = confirmedAmountStr != null ? parseFloat(confirmedAmountStr) : null;
    const ratio = confirmed !== null && rawPrice > 0
      ? Math.min(1, Math.max(0, confirmed / (rawPrice * quantity)))
      : 1;
    return baseTotalGbp * ratio;
  };

  const displayTotalGbp    = computeDisplayTotalGbp(savedOrder?.amount);
  const displayDiscountGbp = baseTotalGbp - displayTotalGbp;
  const hasDiscount        = promoApplied && displayDiscountGbp > 0.005;
  const total               = formatGbp(displayTotalGbp);

  const kycPayload = () => ({
    ...(kycFirstName.trim()      && { first_name:       kycFirstName.trim() }),
    ...(kycLastName.trim()       && { last_name:        kycLastName.trim() }),
    ...(kycSecondLastName.trim() && { second_last_name: kycSecondLastName.trim() }),
    ...(kycDocNumber.trim()      && { document_number:  kycDocNumber.trim() }),
    ...(kycBirthDate.trim()      && { birth_date:       kycBirthDate.trim() }),
    ...(kycGender                && { gender:           kycGender }),
    ...(kycNationality           && { nationality:      kycNationality }),
  });

  // Guests have no Bearer token, so pass an email instead — per the product
  // sheet, create-order will return an auth token for that email so we can
  // sign them in without a separate /auth/login round trip.
  const guestPayload = () =>
    !isAuthenticated && guestEmail.trim() ? { email: guestEmail.trim() } : {};

  const adoptGuestSessionIfIssued = async (result: SavedOrder) => {
    if (!isAuthenticated && result.authToken) {
      await adoptSession(result.authToken, {
        email: result.user?.email ?? guestEmail.trim(),
        firstname: result.user?.firstname,
        lastname:  result.user?.lastname,
        image:     result.user?.image ?? null,
      });
    }
  };

  // Apply coupon: calls create-order immediately so server validates & returns real discount
  const applyPromo = async () => {
    if (!promo.trim()) { setPromoError('Please enter a promo code.'); return; }
    if (!isAuthenticated && !guestEmailValid) {
      setGuestEmailTouched(true);
      setPromoError('Please enter a valid email above before applying a code.');
      return;
    }
    setPromoError('');
    setPromoLoading(true);
    try {
      const result = await ordersApi.createOrder({
        plan_id:     plan.id,
        quantity:    1,
        coupon_code: promo.trim().toUpperCase(),
        ...guestPayload(),
        ...kycPayload(),
      });
      setSavedOrder(result);
      setPromoApplied(true);
      // Don't adopt the guest session yet — that flips isAuthenticated app-wide,
      // and the login screen (still mounted behind this one) would otherwise
      // react to it. Wait until payment actually succeeds (see handleWebViewMessage).
    } catch (err: any) {
      setPromoError(err.message || 'Invalid promo code. Please try again.');
      setPromoApplied(false);
      setSavedOrder(null);
    } finally {
      setPromoLoading(false);
    }
  };

  const removePromo = () => {
    setPromoApplied(false);
    setPromo('');
    setSavedOrder(null);
    setPromoError('');
  };

  const onPay = async () => {
    if (!isAuthenticated && !guestEmailValid) {
      setGuestEmailTouched(true);
      setOrderError('Please enter a valid email address to continue as a guest.');
      return;
    }
    setOrderLoading(true);
    setOrderError('');
    try {
      // Reuse the order already created when coupon was applied; otherwise create fresh
      let orderResult = savedOrder;
      if (!orderResult) {
        orderResult = await ordersApi.createOrder({
          plan_id:     plan.id,
          quantity:    1,
          coupon_code: '',
          ...guestPayload(),
          ...kycPayload(),
        });
        setSavedOrder(orderResult);
      }
      const html = buildRevolutHtml(
        orderResult.token,
        orderResult.order_id,
        formatGbp(computeDisplayTotalGbp(orderResult.amount)),
        REVOLUT_MODE,
        profile?.email ?? guestEmail.trim(),
      );
      setWebviewHtml(html);
      setShowPayment(true);
    } catch (err: any) {
      setOrderError(err.message || 'Failed to create order. Please try again.');
    } finally {
      setOrderLoading(false);
    }
  };

  // Facebook has no OAuth client configured yet — tell the guest to use
  // email or Google instead rather than pretending it works.
  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    if (provider === 'facebook') {
      Alert.alert(
        'Facebook sign-in not set up yet',
        'Facebook sign-in needs an OAuth client ID configured for this app before it can go live. Please continue with email or Google for now.'
      );
      return;
    }
    setGoogleLoading(true);
    await signInWithGoogle();
    setGoogleLoading(false);
  };

  const handleWebViewMessage = (event: { nativeEvent: { data: string } }) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === 'success') {
        setShowPayment(false);
        (async () => {
          // Adopt the guest session now that payment has actually gone through —
          // this is the only place isAuthenticated should flip during checkout.
          if (savedOrder) await adoptGuestSessionIfIssued(savedOrder);
          router.replace({
            pathname: '/purchase-success',
            params: { plan: JSON.stringify(plan), orderId: msg.orderId },
          });
        })();
      } else if (msg.type === 'error') {
        setShowPayment(false);
        setOrderError(msg.message || 'Payment failed. Please try again.');
      }
    } catch { /* ignore malformed messages */ }
  };

  return (
    <SafeAreaView style={st.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.pageBg} />

      {/* ── Revolut Payment Modal ─────────────────────────────── */}
      <Modal
        visible={showPayment}
        animationType="slide"
        onRequestClose={() => {
          Alert.alert('Cancel Payment', 'Are you sure you want to cancel?', [
            { text: 'No', style: 'cancel' },
            { text: 'Yes', onPress: () => setShowPayment(false) },
          ]);
        }}
      >
        {/*
          RN's Modal opens a separate native window on iOS, and the
          SafeAreaProvider higher up the tree doesn't always re-measure
          insets for it — which is why the close button was rendering under
          the status bar. Nesting a fresh SafeAreaProvider here forces a
          correct remeasure for this window specifically.
        */}
        <SafeAreaProvider>
        <SafeAreaView style={{ flex: 1, backgroundColor: C.pageBg }}>
          <View style={st.payHeader}>
            <TouchableOpacity
              style={st.backBtn}
              onPress={() => {
                Alert.alert('Cancel Payment', 'Are you sure you want to cancel?', [
                  { text: 'No', style: 'cancel' },
                  { text: 'Yes', onPress: () => setShowPayment(false) },
                ]);
              }}
            >
              <Feather name="x" size={20} color={C.text} />
            </TouchableOpacity>
            <Text style={st.payHeaderTitle}>Pay {total}</Text>
            <View style={{ width: 36 }} />
          </View>

          <WebView
            source={{ html: webviewHtml }}
            style={{ flex: 1, backgroundColor: C.pageBg }}
            onMessage={handleWebViewMessage}
            javaScriptEnabled
            domStorageEnabled
            originWhitelist={['*']}
            mixedContentMode="always"
            startInLoadingState
            renderLoading={() => (
              <View style={st.webviewLoader}>
                <ActivityIndicator size="large" color={C.primary} />
                <Text style={st.webviewLoaderText}>Loading secure payment…</Text>
              </View>
            )}
          />
        </SafeAreaView>
        </SafeAreaProvider>
      </Modal>

      {/* ── Header ───────────────────────────────────────────────── */}
      <View style={st.header}>
        <TouchableOpacity style={st.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={C.text} />
        </TouchableOpacity>
        <Text style={st.headerTitle}>Checkout</Text>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={st.scroll}
          contentContainerStyle={st.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* ── CONTACT / GUEST CHECKOUT ──────────────────────────── */}
          {!isAuthenticated && (
            <>
              <Text style={st.sectionTitle}>Contact</Text>
              <View style={st.card}>
                <Text style={st.guestIntro}>
                  Sign in for faster checkout, or continue as a guest — we&apos;ll email your eSIM &amp; receipt.
                </Text>

                <View style={st.kycField}>
                  <Text style={st.kycLabel}>Email <Text style={st.kycRequired}>*</Text></Text>
                  <View style={[st.emailInputWrap, guestEmailError && { borderColor: C.red }]}>
                    <Feather name="mail" size={16} color={C.muted} />
                    <TextInput
                      style={st.emailInput}
                      value={guestEmail}
                      onChangeText={setGuestEmail}
                      onBlur={() => setGuestEmailTouched(true)}
                      placeholder="you@example.com"
                      placeholderTextColor={C.muted}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                  {guestEmailError ? <Text style={st.promoErrorText}>{guestEmailError}</Text> : null}
                </View>

                <View style={st.dividerRow}>
                  <View style={st.divider} />
                  <Text style={st.dividerText}>or</Text>
                  <View style={st.divider} />
                </View>

                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity
                    style={[st.socialBtn, (googleLoading || !googleReady) && { opacity: 0.5 }]}
                    onPress={() => handleSocialLogin('google')}
                    activeOpacity={0.8}
                    disabled={googleLoading || !googleReady}
                  >
                    {googleLoading
                      ? <ActivityIndicator size="small" color={C.text} />
                      : <MaterialCommunityIcons name="google" size={18} color={C.text} />
                    }
                    <Text style={st.socialBtnText}>Google</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={st.socialBtn} onPress={() => handleSocialLogin('facebook')} activeOpacity={0.8}>
                    <MaterialCommunityIcons name="facebook" size={18} color={C.text} />
                    <Text style={st.socialBtnText}>Facebook</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity onPress={() => router.push('/(tabs)')} style={{ alignSelf: 'center', marginTop: 2 }}>
                  <Text style={st.signInLink}>
                    Already have an account? <Text style={{ fontWeight: '700', color: C.primary }}>Sign in</Text>
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* ── ORDER SUMMARY ──────────────────────────────────── */}
          <Text style={st.sectionTitle}>Order Summary</Text>
          <View style={st.card}>
            <View style={st.summaryRow}>
              <View style={st.summaryLeft}>
                <View style={st.summaryIconWrap}>
                  <MaterialCommunityIcons name="sim-outline" size={22} color={C.primary} />
                </View>
                <View>
                  <Text style={st.summaryPlan}>{planDataLabel} eSIM Plan</Text>
                  <Text style={st.summaryDays}>{planDaysLabel} validity</Text>
                </View>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                {plan.oldPrice && <Text style={st.oldPrice}>{plan.oldPrice}</Text>}
                <Text style={st.summaryPrice}>{formatGbp(plan.gbp_price)}</Text>
              </View>
            </View>

            {plan.discount && (
              <View style={st.discountRow}>
                <Feather name="tag" size={13} color={C.saveText} />
                <Text style={st.discountText}>{plan.discount} applied</Text>
              </View>
            )}

          </View>

          {/* ── PLAN SPECIFICATION ────────────────────────────────── */}
          {planDetails && (
            <>
              <Text style={st.sectionTitle}>Plan Specification</Text>
              <View style={st.card}>
                <View style={st.specRow}>
                  <Text style={st.specLabel}>Provider</Text>
                  <Text style={st.specVal}>{providerLabel}</Text>
                </View>
                <View style={st.specRow}>
                  <Text style={st.specLabel}>Plan ID</Text>
                  <Text style={st.specVal}>{formatPlanId(planDetails.id)}</Text>
                </View>
                <View style={st.specRow}>
                  <Text style={st.specLabel}>Network</Text>
                  <Text style={st.specVal}>{planTypeLabel(planDetails)}</Text>
                </View>
                <View style={st.specRow}>
                  <Text style={st.specLabel}>Duration</Text>
                  <Text style={st.specVal}>{planDetails.validity} Days</Text>
                </View>
                <View style={st.specRow}>
                  <Text style={st.specLabel}>Roaming Data</Text>
                  <Text style={st.specVal}>{formatRoamingData(planDetails)}</Text>
                </View>
                {isIncluded(planDetails.call_in_minutes) && (
                  <View style={st.specRow}>
                    <Text style={st.specLabel}>Calls</Text>
                    <Text style={st.specVal}>{planDetails.call_in_minutes}</Text>
                  </View>
                )}
                {isIncluded(planDetails.international_call_in_minutes) && (
                  <View style={st.specRow}>
                    <Text style={st.specLabel}>International Calls</Text>
                    <Text style={st.specVal}>{planDetails.international_call_in_minutes}</Text>
                  </View>
                )}
                {isIncluded(planDetails.sms_in_count) && (
                  <View style={st.specRow}>
                    <Text style={st.specLabel}>SMS</Text>
                    <Text style={st.specVal}>{planDetails.sms_in_count}</Text>
                  </View>
                )}
                <View style={st.specRow}>
                  <Text style={st.specLabel}>Coverage</Text>
                  <Text style={st.specVal}>{formatCoverage(coverageCountries)}</Text>
                </View>
                <View style={st.specRow}>
                  <Text style={st.specLabel}>Network Speed</Text>
                  <Text style={st.specVal}>4G/LTE/5G</Text>
                </View>
                <View style={st.specRow}>
                  <Text style={st.specLabel}>Hotspot Tethering</Text>
                  <Text style={st.specVal}>Supported</Text>
                </View>
                {!!planDetails.main_country && (
                  <>
                    <View style={st.specRow}>
                      <Text style={st.specLabel}>Main Destination</Text>
                      <Text style={st.specVal}>{planDetails.main_country}</Text>
                    </View>
                    {Number(planDetails.main_country_data) > 0 && (
                      <View style={st.specRow}>
                        <Text style={st.specLabel}>Main Destination Data</Text>
                        <Text style={st.specVal}>{planDetails.main_country_data} GB</Text>
                      </View>
                    )}
                  </>
                )}

                {coverageCountries.length > 0 && (
                  <>
                    <View style={st.divider} />
                    <Text style={st.specLabel}>
                      Countries Covered ({coverageCountries.length})
                    </Text>
                    <View style={st.countriesWrap}>
                      {(showAllCountries
                        ? coverageCountries
                        : coverageCountries.slice(0, 8)
                      ).map(country => (
                        <View key={country} style={st.countryChip}>
                          <Text style={st.countryChipText}>{country}</Text>
                        </View>
                      ))}
                    </View>
                    {coverageCountries.length > 8 && (
                      <TouchableOpacity onPress={() => setShowAllCountries(s => !s)}>
                        <Text style={st.showMoreText}>
                          {showAllCountries
                            ? 'Show less'
                            : `+${coverageCountries.length - 8} more`}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </>
                )}
              </View>
            </>
          )}

          {/* ── DESCRIPTION ───────────────────────────────────────── */}
          {descriptionBlocks.length > 0 && (
            <>
              <Text style={st.sectionTitle}>Description</Text>
              <View style={{ gap: 10 }}>
                {descriptionBlocks.map((b, i) => (
                  <View key={i} style={[st.descBlock, { backgroundColor: b.bg, borderColor: b.color + '30' }]}>
                    <Text style={[st.descBlockTitle, { color: b.color }]}>{b.title}</Text>
                    <Text style={st.descBlockBody}>{b.body}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* ── TRAVELLER DETAILS (KYC) — only for provider plans ── */}
          {requiresKyc && <>
          <Text style={st.sectionTitle}>Traveller Details</Text>
          <View style={st.card}>

            {/* First Name */}
            <View style={st.kycField}>
              <Text style={st.kycLabel}>First Name <Text style={st.kycRequired}>*</Text></Text>
              <TextInput
                style={st.kycInput}
                value={kycFirstName}
                onChangeText={setKycFirstName}
                placeholder="e.g. John"
                placeholderTextColor={C.muted}
                autoCapitalize="words"
              />
            </View>

            {/* Last Name */}
            <View style={st.kycField}>
              <Text style={st.kycLabel}>Last Name <Text style={st.kycRequired}>*</Text></Text>
              <TextInput
                style={st.kycInput}
                value={kycLastName}
                onChangeText={setKycLastName}
                placeholder="e.g. Doe"
                placeholderTextColor={C.muted}
                autoCapitalize="words"
              />
            </View>

            {/* Second Last Name */}
            <View style={st.kycField}>
              <Text style={st.kycLabel}>Second Last Name <Text style={st.kycRequired}>*</Text></Text>
              <TextInput
                style={st.kycInput}
                value={kycSecondLastName}
                onChangeText={setKycSecondLastName}
                placeholder="e.g. Doe"
                placeholderTextColor={C.muted}
                autoCapitalize="words"
              />
            </View>

            {/* Document Number */}
            <View style={st.kycField}>
              <Text style={st.kycLabel}>Document Number <Text style={st.kycRequired}>*</Text></Text>
              <TextInput
                style={st.kycInput}
                value={kycDocNumber}
                onChangeText={setKycDocNumber}
                placeholder="e.g. 12345678"
                placeholderTextColor={C.muted}
                autoCapitalize="characters"
                autoCorrect={false}
              />
            </View>

            {/* Birth Date */}
            <View style={st.kycField}>
              <Text style={st.kycLabel}>Birth Date <Text style={st.kycRequired}>*</Text></Text>
              <TextInput
                style={st.kycInput}
                value={kycBirthDate}
                onChangeText={t => {
                  // auto-format as mm/dd/yyyy
                  const digits = t.replace(/\D/g, '');
                  let formatted = digits;
                  if (digits.length >= 3) formatted = digits.slice(0,2) + '/' + digits.slice(2);
                  if (digits.length >= 5) formatted = digits.slice(0,2) + '/' + digits.slice(2,4) + '/' + digits.slice(4,8);
                  setKycBirthDate(formatted);
                }}
                placeholder="mm/dd/yyyy"
                placeholderTextColor={C.muted}
                keyboardType="numeric"
                maxLength={10}
              />
            </View>

            {/* Gender picker */}
            <View style={st.kycField}>
              <Text style={st.kycLabel}>Gender <Text style={st.kycRequired}>*</Text></Text>
              <TouchableOpacity style={st.kycSelect} onPress={() => setShowGenderPicker(true)} activeOpacity={0.8}>
                <Text style={[st.kycSelectTxt, !kycGender && st.kycPlaceholder]}>
                  {kycGender || 'Select Gender'}
                </Text>
                <Feather name="chevron-down" size={16} color={C.muted} />
              </TouchableOpacity>
            </View>

            {/* Nationality picker */}
            <View style={st.kycField}>
              <Text style={st.kycLabel}>Nationality <Text style={st.kycRequired}>*</Text></Text>
              <TouchableOpacity
                style={[st.kycSelect, nationalitiesLoading && { opacity: 0.6 }]}
                onPress={() => { if (!nationalitiesLoading) { setNationalitySearch(''); setShowNationalityPicker(true); } }}
                activeOpacity={0.8}
              >
                <Text style={[st.kycSelectTxt, !kycNationality && st.kycPlaceholder]}>
                  {nationalitiesLoading ? 'Loading…' : (kycNationality || 'Select Nationality')}
                </Text>
                {nationalitiesLoading
                  ? <ActivityIndicator size="small" color={C.muted} />
                  : <Feather name="chevron-down" size={16} color={C.muted} />}
              </TouchableOpacity>
            </View>

          </View>

          {/* Gender Picker Modal */}
          <Modal visible={showGenderPicker} transparent animationType="slide" onRequestClose={() => setShowGenderPicker(false)}>
            <View style={st.pickerOverlay}>
              <View style={st.pickerSheet}>
                <View style={st.pickerHandle} />
                <View style={st.pickerHeader}>
                  <Text style={st.pickerTitle}>Select Gender</Text>
                  <TouchableOpacity onPress={() => setShowGenderPicker(false)}>
                    <Feather name="x" size={20} color={C.text} />
                  </TouchableOpacity>
                </View>
                {GENDERS.map(g => (
                  <TouchableOpacity
                    key={g}
                    style={[st.pickerItem, kycGender === g && st.pickerItemOn]}
                    onPress={() => { setKycGender(g); setShowGenderPicker(false); }}
                  >
                    <Text style={[st.pickerItemTxt, kycGender === g && st.pickerItemTxtOn]}>{g}</Text>
                    {kycGender === g && <Feather name="check" size={16} color={C.primary} />}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </Modal>

          {/* Nationality Picker Modal */}
          <Modal visible={showNationalityPicker} transparent animationType="slide" onRequestClose={() => setShowNationalityPicker(false)}>
            <View style={st.pickerOverlay}>
              <View style={[st.pickerSheet, { maxHeight: '80%' }]}>
                <View style={st.pickerHandle} />
                <View style={st.pickerHeader}>
                  <Text style={st.pickerTitle}>Select Nationality</Text>
                  <TouchableOpacity onPress={() => setShowNationalityPicker(false)}>
                    <Feather name="x" size={20} color={C.text} />
                  </TouchableOpacity>
                </View>
                <View style={st.pickerSearch}>
                  <Feather name="search" size={15} color={C.muted} />
                  <TextInput
                    style={st.pickerSearchInput}
                    value={nationalitySearch}
                    onChangeText={setNationalitySearch}
                    placeholder="Search nationality…"
                    placeholderTextColor={C.muted}
                    autoCapitalize="words"
                  />
                  {nationalitySearch.length > 0 && (
                    <TouchableOpacity onPress={() => setNationalitySearch('')}>
                      <Feather name="x-circle" size={15} color={C.muted} />
                    </TouchableOpacity>
                  )}
                </View>
                {nationalitiesLoading ? (
                  <View style={{ paddingVertical: 32, alignItems: 'center' }}>
                    <ActivityIndicator size="small" color={C.primary} />
                    <Text style={{ marginTop: 8, fontSize: 13, color: C.muted }}>Loading nationalities…</Text>
                  </View>
                ) : nationalities.length === 0 ? (
                  <View style={{ paddingVertical: 32, alignItems: 'center' }}>
                    <Text style={{ fontSize: 13, color: C.muted }}>No nationalities available</Text>
                  </View>
                ) : (
                  <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                    {nationalities
                      .filter(n => (n.name ?? '').toLowerCase().includes(nationalitySearch.toLowerCase()))
                      .map((n, idx) => {
                        const label = n.name;
                        const selected = kycNationality === label;
                        return (
                          <TouchableOpacity
                            key={n.id ?? idx}
                            style={[st.pickerItem, selected && st.pickerItemOn]}
                            onPress={() => { setKycNationality(label); setShowNationalityPicker(false); }}
                          >
                            <Text style={[st.pickerItemTxt, selected && st.pickerItemTxtOn]}>{label}</Text>
                            {selected && <Feather name="check" size={16} color={C.primary} />}
                          </TouchableOpacity>
                        );
                      })}
                  </ScrollView>
                )}
              </View>
            </View>
          </Modal>
          </>}

          {/* ── PROMO CODE ─────────────────────────────────────── */}
          <Text style={st.sectionTitle}>Promo Code</Text>
          <View style={st.card}>
            <View style={st.promoRow}>
              <View style={[
                st.promoInputWrap,
                promoError   ? st.promoError2  : null,
                promoApplied ? st.promoSuccess2 : null,
              ]}>
                <Feather name="tag" size={16} color={promoApplied ? C.primary : C.muted} style={{ marginRight: 8 }} />
                <TextInput
                  style={st.promoInput}
                  placeholder="Enter promo code"
                  placeholderTextColor={C.muted}
                  value={promo}
                  onChangeText={t => { setPromo(t); setPromoError(''); }}
                  autoCapitalize="characters"
                  editable={!promoApplied}
                />
                {promoApplied && (
                  <TouchableOpacity onPress={removePromo}>
                    <Feather name="x-circle" size={18} color={C.primary} />
                  </TouchableOpacity>
                )}
              </View>
              {!promoApplied && (
                <TouchableOpacity
                  style={[st.promoApplyBtn, (promoLoading || !promo.trim()) && { opacity: 0.6 }]}
                  onPress={applyPromo}
                  disabled={promoLoading || !promo.trim()}
                >
                  {promoLoading
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <Text style={st.promoApplyText}>Apply</Text>}
                </TouchableOpacity>
              )}
            </View>
            {promoError   ? <Text style={st.promoErrorText}>{promoError}</Text>   : null}
            {promoApplied && savedOrder ? (
              <Text style={st.promoSuccessText}>
                {hasDiscount
                  ? `Code applied! ${formatGbp(displayDiscountGbp)} off — you pay ${total}`
                  : 'Code accepted (no discount on this plan)'}
              </Text>
            ) : null}
            <Text style={st.promoHint}>Have a coupon code? Enter it above.</Text>
          </View>

          {/* ── PRICE BREAKDOWN ──────────────────────────────────── */}
          <Text style={st.sectionTitle}>Price Breakdown</Text>
          <View style={st.card}>
            <View style={st.breakdownRow}>
              <Text style={st.breakdownLabel}>Plan Price</Text>
              <Text style={st.breakdownVal}>{formatGbp(plan.gbp_price)}</Text>
            </View>
            {hasDiscount && (
              <View style={st.breakdownRow}>
                <Text style={[st.breakdownLabel, { color: C.primary }]}>Promo Discount</Text>
                <Text style={[st.breakdownVal,   { color: C.primary }]}>- {formatGbp(displayDiscountGbp)}</Text>
              </View>
            )}
            <View style={st.breakdownRow}>
              <Text style={st.breakdownLabel}>Tax</Text>
              <Text style={st.breakdownVal}>Included</Text>
            </View>
            <View style={[st.divider, { marginVertical: 4 }]} />
            <View style={st.breakdownRow}>
              <Text style={st.totalLabel}>Total</Text>
              <Text style={st.totalVal}>{total}</Text>
            </View>
          </View>

          {/* ── INSTRUCTIONS (static) ────────────────────────────── */}
          <Text style={st.sectionTitle}>Instructions</Text>
          <View style={st.card}>
            <Text style={st.instructionSubTitle}>How to check eSIM compatibility</Text>
            <Text style={st.instructionBody}>
              Before checking out, double-check that your device is eSIM capable.
            </Text>
            <Text style={st.instructionLink}>Check the eSIM supported device</Text>

            <View style={[st.divider, { marginVertical: 6 }]} />

            <Text style={st.instructionSubTitle}>How to activate eSIM</Text>
            {ACTIVATION_STEPS.map((text, i) => (
              <View key={i} style={st.stepRow}>
                <View style={st.stepNum}><Text style={st.stepNumText}>{i + 1}</Text></View>
                <Text style={st.stepText}>{text}</Text>
              </View>
            ))}
            <View style={st.stepRow}>
              <View style={st.stepNum}><Text style={st.stepNumText}>4</Text></View>
              <Text style={st.stepText}>
                When you arrive in {planDetails?.main_country ?? 'your destination'}, your eSIM will
                activate immediately, so you can get online and go.
              </Text>
            </View>

            <Text style={st.instructionLink}>Learn how to setup eSIM</Text>
          </View>

          {/* ── PAYMENT INFO ─────────────────────────────────────── */}
          <Text style={st.sectionTitle}>Payment</Text>
          <View style={st.card}>
            <View style={st.payInfoRow}>
              <View style={st.payInfoIcon}>
                <Feather name="lock" size={18} color={C.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={st.payInfoTitle}>Secured by Revolut</Text>
                <Text style={st.payInfoSub}>Your card details are encrypted and processed securely.</Text>
              </View>
            </View>
          </View>

          {/* ── ERROR ──────────────────────────────────────────────── */}
          {orderError ? (
            <View style={st.errorBox}>
              <Feather name="alert-circle" size={16} color={C.red} />
              <Text style={st.errorText}>{orderError}</Text>
            </View>
          ) : null}

          <View style={{ height: 20 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── PAY BUTTON ─────────────────────────────────────────── */}
      <View style={st.footer}>
        <View style={st.footerTotal}>
          <Text style={st.footerTotalLabel}>Total</Text>
          <Text style={st.footerTotalVal}>{total}</Text>
        </View>
        <TouchableOpacity
          style={[st.payBtn, (orderLoading || promoLoading) && st.payBtnLoading]}
          activeOpacity={0.85}
          onPress={onPay}
          disabled={orderLoading || promoLoading}
        >
          {orderLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Feather name="lock" size={15} color="#fff" />
              <Text style={st.payBtnText}>Pay {total}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: C.pageBg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: C.pageBg, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  payHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: C.bg, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  payHeaderTitle: { fontSize: 17, fontWeight: '700', color: C.text },
  backBtn: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: C.bg,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: C.border,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: C.text },
  scroll:        { flex: 1 },
  scrollContent: { padding: 16, gap: 10 },
  sectionTitle: {
    fontSize: 13, fontWeight: '700', color: C.muted,
    textTransform: 'uppercase', letterSpacing: 0.8,
    marginTop: 6, marginBottom: 2,
  },
  card: {
    backgroundColor: C.bg, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: C.border, gap: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  divider: { height: 1, backgroundColor: C.border },

  summaryRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  summaryLeft:     { flexDirection: 'row', alignItems: 'center', gap: 12 },
  summaryIconWrap: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: '#DCFCE7', alignItems: 'center', justifyContent: 'center',
  },
  summaryPlan:  { fontSize: 15, fontWeight: '700', color: C.text },
  summaryDays:  { fontSize: 13, color: C.muted, marginTop: 2 },
  summaryPrice: { fontSize: 18, fontWeight: '800', color: C.text },
  oldPrice:     { fontSize: 12, color: C.muted, textDecorationLine: 'line-through' },
  discountRow:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  discountText: { fontSize: 13, color: C.saveText, fontWeight: '600' },
  creditsRow:   { flexDirection: 'row', alignItems: 'center', gap: 7 },
  creditsInfo:  { fontSize: 13, color: C.muted, flex: 1 },

  promoRow: { flexDirection: 'row', gap: 10 },
  promoInputWrap: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: C.border, borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 2, backgroundColor: C.pageBg,
  },
  promoError2:   { borderColor: C.red },
  promoSuccess2: { borderColor: C.primary },
  promoInput:      { flex: 1, fontSize: 14, color: C.text, paddingVertical: 10 },
  promoApplyBtn: {
    backgroundColor: '#0D1117', borderRadius: 12,
    paddingHorizontal: 18, justifyContent: 'center',
  },
  promoApplyText:  { fontSize: 14, fontWeight: '700', color: '#fff' },
  promoErrorText:  { fontSize: 12, color: C.red, marginTop: -4 },
  promoSuccessText:{ fontSize: 13, color: C.primary, fontWeight: '600', marginTop: -4 },
  promoHint:       { fontSize: 12, color: C.muted },

  specRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  specLabel: { fontSize: 13, color: C.muted },
  specVal:   { fontSize: 13, fontWeight: '600', color: C.text },

  countriesWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  countryChip: {
    backgroundColor: C.pageBg, borderRadius: 6, borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  countryChipText: { fontSize: 11, color: C.text, fontWeight: '500' },
  showMoreText:    { fontSize: 12, fontWeight: '700', color: C.primary, marginTop: 6 },

  descBlock: { borderRadius: 12, borderWidth: 1, padding: 12, gap: 4 },
  descBlockTitle: { fontSize: 13, fontWeight: '700' },
  descBlockBody:  { fontSize: 12.5, color: C.text, lineHeight: 18 },

  instructionSubTitle: { fontSize: 14, fontWeight: '700', color: C.text },
  instructionBody:     { fontSize: 13, color: C.muted, lineHeight: 18, marginTop: 2 },
  instructionLink:      { fontSize: 13, fontWeight: '700', color: C.primary, marginTop: 6 },

  stepRow: { flexDirection: 'row', gap: 10, marginTop: 10, alignItems: 'flex-start' },
  stepNum: {
    width: 22, height: 22, borderRadius: 11, backgroundColor: C.primary,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1,
  },
  stepNumText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  stepText:    { flex: 1, fontSize: 13, color: C.text, lineHeight: 18 },

  breakdownRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  breakdownLabel: { fontSize: 14, color: C.muted },
  breakdownVal:   { fontSize: 14, fontWeight: '600', color: C.text },
  totalLabel:     { fontSize: 16, fontWeight: '800', color: C.text },
  totalVal:       { fontSize: 18, fontWeight: '800', color: C.primary },

  payInfoRow:  { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  payInfoIcon: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: '#DCFCE7', alignItems: 'center', justifyContent: 'center',
  },
  payInfoTitle: { fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 3 },
  payInfoSub:   { fontSize: 13, color: C.muted, lineHeight: 18 },

  errorBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: C.redBg, borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: '#FECACA',
  },
  errorText: { flex: 1, fontSize: 13, color: C.red, lineHeight: 18 },

  // KYC form
  kycField:       { gap: 6 },
  kycLabel:       { fontSize: 12, fontWeight: '600', color: C.muted, textTransform: 'uppercase', letterSpacing: 0.4 },
  kycRequired:    { color: C.red },
  kycInput: {
    borderWidth: 1.5, borderColor: C.border, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: C.text, backgroundColor: C.pageBg,
  },
  kycSelect: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1.5, borderColor: C.border, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 13, backgroundColor: C.pageBg,
  },
  kycSelectTxt:  { fontSize: 14, color: C.text },
  kycPlaceholder:{ color: C.muted },

  // Guest checkout
  guestIntro: { fontSize: 13, color: C.muted, lineHeight: 18 },
  emailInputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1.5, borderColor: C.border, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, backgroundColor: C.pageBg,
  },
  emailInput: { flex: 1, fontSize: 14, color: C.text, padding: 0 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dividerText: { fontSize: 12, color: C.muted, fontWeight: '600' },
  socialBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1.5, borderColor: C.border, borderRadius: 12,
    paddingVertical: 12, backgroundColor: C.bg,
  },
  socialBtnText: { fontSize: 14, fontWeight: '600', color: C.text },
  signInLink:    { fontSize: 13, color: C.muted },

  // Picker modal
  pickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  pickerSheet: {
    backgroundColor: C.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingBottom: 34, maxHeight: '60%',
  },
  pickerHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: 'center', marginTop: 10, marginBottom: 4 },
  pickerHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  pickerTitle:   { fontSize: 16, fontWeight: '700', color: C.text },
  pickerSearch: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 16, marginVertical: 10,
    borderWidth: 1.5, borderColor: C.border, borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 10, backgroundColor: C.pageBg,
  },
  pickerSearchInput: { flex: 1, fontSize: 14, color: C.text, padding: 0 },
  pickerItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: C.border + '80',
  },
  pickerItemOn:    { backgroundColor: '#F0FDF4' },
  pickerItemTxt:   { fontSize: 15, color: C.text },
  pickerItemTxtOn: { fontWeight: '700', color: C.primary },

  webviewLoader: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center', backgroundColor: C.pageBg,
  },
  webviewLoaderText: { marginTop: 12, fontSize: 14, color: C.muted },

  footer: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 16, backgroundColor: C.bg,
    borderTopWidth: 1, borderTopColor: C.border,
  },
  footerTotal:      { gap: 2 },
  footerTotalLabel: { fontSize: 11, color: C.muted, fontWeight: '500' },
  footerTotalVal:   { fontSize: 18, fontWeight: '800', color: C.text },
  payBtn: {
    flex: 1, backgroundColor: C.primary, borderRadius: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 16,
    shadowColor: C.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 4,
  },
  payBtnLoading: { opacity: 0.75 },
  payBtnText:    { fontSize: 16, fontWeight: '700', color: '#fff' },
});
