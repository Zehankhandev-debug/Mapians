import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useCurrency } from '../context/CurrencyContext';
import { providersApi, type Plan, type Provider } from '../scripts/api';

const BASE_URL = 'https://mapians.com/';

const C = {
  bg:       '#FFFFFF',
  primary:  '#016701',
  primaryL: '#E6F4E6',
  text:     '#0A0A0A',
  muted:    '#6B7280',
  border:   '#EAEEF2',
  blue:     '#2563EB',
  blueL:    '#EFF6FF',
  blueM:    '#DBEAFE',
};

function imgUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${BASE_URL}${path}`;
}

function AnimatedCard({ children, delay = 0, style }: any) {
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity,    { toValue: 1, duration: 350, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 350, delay, useNativeDriver: true }),
    ]).start();
  }, []);
  return (
    <Animated.View style={[{ opacity, transform: [{ translateY }] }, style]}>
      {children}
    </Animated.View>
  );
}

function PlanCard({ plan, onPress }: { plan: Plan; onPress: () => void }) {
  const { formatGbp } = useCurrency();
  const isDaily   = Number(plan.is_daily_data_plan) === 1;
  const dataLabel = plan.data_in_gb?.toLowerCase() === 'unlimited'
    ? 'Unlimited'
    : isDaily
      ? `${plan.data_in_gb} GB/day`
      : `${plan.main_country_data || plan.data_in_gb} GB`;

  return (
    <TouchableOpacity style={st.planCard} onPress={onPress} activeOpacity={0.85}>
      <View style={st.planCardTop}>
        <Text style={st.planName} numberOfLines={2}>{plan.name}</Text>
        <Text style={st.planPrice}>{formatGbp(plan.gbp_price)}</Text>
      </View>
      <View style={st.planMeta}>
        <View style={st.planChip}>
          <Feather name="database" size={11} color={C.blue} />
          <Text style={st.planChipTxt}>{dataLabel}</Text>
        </View>
        <View style={st.planChip}>
          <Feather name="calendar" size={11} color={C.blue} />
          <Text style={st.planChipTxt}>{plan.validity}d</Text>
        </View>
        {plan.call_in_minutes && plan.call_in_minutes !== '0' && (
          <View style={st.planChip}>
            <Feather name="phone" size={11} color={C.blue} />
            <Text style={st.planChipTxt}>{plan.call_in_minutes}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

function ProviderCard({
  provider,
  isSelected,
  onPress,
}: {
  provider:   Provider;
  isSelected: boolean;
  onPress:    () => void;
}) {
  const logo = imgUrl(provider.logo_url ?? null);

  return (
    <TouchableOpacity
      style={[st.providerCard, isSelected && st.providerCardOn]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {logo ? (
        <Image source={{ uri: logo }} style={st.providerLogo} contentFit="contain" />
      ) : (
        <View style={st.providerLogoFallback}>
          <Feather name="layers" size={22} color={isSelected ? C.bg : C.blue} />
        </View>
      )}
      <Text style={[st.providerName, isSelected && st.providerNameOn]} numberOfLines={2}>
        {provider.name}
      </Text>
      {isSelected && (
        <View style={st.selectedBadge}>
          <Feather name="check" size={10} color={C.bg} />
        </View>
      )}
    </TouchableOpacity>
  );
}

/**
 * Provider grid + drill-down plan list — the /provider and /provider-plans/:id
 * endpoints need no auth, so this is shared between the logged-in Providers
 * screen and the guest-facing "Providers" tab on Explore Plans. Caller
 * supplies the scroll container (SafeAreaView/ScrollView/header).
 */
export function ProvidersBrowser() {
  const router = useRouter();

  const [providers,      setProviders]      = useState<Provider[]>([]);
  const [loadingProv,    setLoadingProv]    = useState(true);
  const [errorProv,      setErrorProv]      = useState<string | null>(null);

  const [selectedProv,   setSelectedProv]   = useState<Provider | null>(null);
  const [plans,          setPlans]          = useState<Plan[]>([]);
  const [loadingPlans,   setLoadingPlans]   = useState(false);
  const [errorPlans,     setErrorPlans]     = useState<string | null>(null);

  const fetchProviders = useCallback(async () => {
    setLoadingProv(true);
    setErrorProv(null);
    try {
      const res  = await providersApi.getProviders();
      const list: Provider[] =
        res?.data?.providers ??
        (Array.isArray(res?.data) ? (res.data as any) : []);
      setProviders(list);
    } catch (err: any) {
      setErrorProv(err.message || 'Failed to load providers');
    } finally {
      setLoadingProv(false);
    }
  }, []);

  const fetchProviderPlans = useCallback(async (provider: Provider) => {
    setSelectedProv(provider);
    setPlans([]);
    setLoadingPlans(true);
    setErrorPlans(null);
    try {
      const res  = await providersApi.getProviderPlans(provider.id);
      const list: Plan[] =
        res?.data?.plans ??
        (Array.isArray(res?.data) ? (res.data as any) : []);
      setPlans(list);
    } catch (err: any) {
      setErrorPlans(err.message || 'Failed to load plans');
    } finally {
      setLoadingPlans(false);
    }
  }, []);

  useEffect(() => { fetchProviders(); }, [fetchProviders]);

  const goToPlan = (plan: Plan) => {
    // Provider plans are already fully resolved — go straight to checkout
    // instead of routing through /available-plans, which treats its
    // `countryId` param as a country id and would fetch unrelated
    // country-plans data for a numeric id that just happens to collide
    // with this plan's id.
    router.push({
      pathname: '/checkout',
      params: {
        plan:         JSON.stringify(plan),
        fromProvider: 'true',
        providerName: selectedProv?.name ?? '',
      },
    });
  };

  return (
    <>
      {/* Providers loading */}
      {loadingProv && (
        <View style={st.stateBox}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={st.stateTxt}>Loading providers…</Text>
        </View>
      )}

      {/* Providers error */}
      {!loadingProv && errorProv && (
        <View style={st.stateBox}>
          <Feather name="wifi-off" size={36} color={C.muted} />
          <Text style={st.stateTxt}>{errorProv}</Text>
          <TouchableOpacity style={st.retryBtn} onPress={fetchProviders}>
            <Text style={st.retryTxt}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Providers grid */}
      {!loadingProv && !errorProv && providers.length > 0 && (
        <AnimatedCard delay={0}>
          <Text style={st.sectionLabel}>Select a Provider</Text>
          <FlatList
            data={providers}
            keyExtractor={item => String(item.id)}
            numColumns={3}
            scrollEnabled={false}
            columnWrapperStyle={st.providerRow}
            renderItem={({ item, index }) => (
              <AnimatedCard delay={index * 40} style={{ flex: 1 }}>
                <ProviderCard
                  provider={item}
                  isSelected={selectedProv?.id === item.id}
                  onPress={() => fetchProviderPlans(item)}
                />
              </AnimatedCard>
            )}
          />
        </AnimatedCard>
      )}

      {/* Empty providers */}
      {!loadingProv && !errorProv && providers.length === 0 && (
        <View style={st.stateBox}>
          <Feather name="layers" size={40} color={C.muted} />
          <Text style={st.emptyTitle}>No providers found</Text>
          <Text style={st.emptySub}>Check back later for available providers</Text>
        </View>
      )}

      {/* Plans section */}
      {selectedProv && (
        <AnimatedCard delay={0} style={st.plansSection}>
          <View style={st.plansSectionHeader}>
            <View style={st.plansSectionLeft}>
              <View style={st.plansSectionDot} />
              <Text style={st.plansSectionTitle}>{selectedProv.name} Plans</Text>
            </View>
            {plans.length > 0 && (
              <View style={st.planCountBadge}>
                <Text style={st.planCountTxt}>{plans.length}</Text>
              </View>
            )}
          </View>

          {loadingPlans && (
            <View style={[st.stateBox, { paddingVertical: 24 }]}>
              <ActivityIndicator size="small" color={C.primary} />
              <Text style={st.stateTxt}>Loading plans…</Text>
            </View>
          )}

          {!loadingPlans && errorPlans && (
            <View style={[st.stateBox, { paddingVertical: 24 }]}>
              <Feather name="alert-circle" size={28} color={C.muted} />
              <Text style={st.stateTxt}>{errorPlans}</Text>
              <TouchableOpacity style={st.retryBtn} onPress={() => fetchProviderPlans(selectedProv)}>
                <Text style={st.retryTxt}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          {!loadingPlans && !errorPlans && plans.length === 0 && (
            <View style={[st.stateBox, { paddingVertical: 24 }]}>
              <Feather name="inbox" size={32} color={C.muted} />
              <Text style={st.emptySub}>No plans available for this provider</Text>
            </View>
          )}

          {!loadingPlans && !errorPlans && plans.map((plan, idx) => (
            <AnimatedCard key={plan.id} delay={idx * 50}>
              <PlanCard plan={plan} onPress={() => goToPlan(plan)} />
            </AnimatedCard>
          ))}
        </AnimatedCard>
      )}
    </>
  );
}

const st = StyleSheet.create({
  sectionLabel: { fontSize: 13, fontWeight: '700', color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },

  providerRow:   { gap: 10, marginBottom: 10 },
  providerCard:  {
    flex: 1,
    alignItems: 'center',
    gap: 8,
    padding: 14,
    backgroundColor: C.bg,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: C.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  providerCardOn: {
    backgroundColor: C.primary,
    borderColor: C.primary,
  },
  providerLogo:         { width: 48, height: 48, borderRadius: 10 },
  providerLogoFallback: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: C.blueM,
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerName:   { fontSize: 11, fontWeight: '600', color: C.text, textAlign: 'center', lineHeight: 15 },
  providerNameOn: { color: C.bg },
  selectedBadge:  {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  plansSection:       { gap: 10 },
  plansSectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  plansSectionLeft:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  plansSectionDot:    { width: 8, height: 8, borderRadius: 4, backgroundColor: C.primary },
  plansSectionTitle:  { fontSize: 16, fontWeight: '800', color: C.text },
  planCountBadge:     { backgroundColor: C.primaryL, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  planCountTxt:       { fontSize: 12, fontWeight: '700', color: C.primary },

  planCard: {
    backgroundColor: C.bg,
    borderRadius: 16,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: C.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  planCardTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  planName:    { flex: 1, fontSize: 14, fontWeight: '700', color: C.text, lineHeight: 20 },
  planPrice:   { fontSize: 15, fontWeight: '800', color: C.primary },
  planMeta:    { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  planChip:    { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.blueL, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  planChipTxt: { fontSize: 11, fontWeight: '600', color: C.blue },

  stateBox:   { alignItems: 'center', paddingVertical: 40, gap: 12 },
  stateTxt:   { fontSize: 14, color: C.muted, textAlign: 'center' },
  retryBtn:   { backgroundColor: C.primary, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10, marginTop: 4 },
  retryTxt:   { color: C.bg, fontWeight: '700', fontSize: 14 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: C.text },
  emptySub:   { fontSize: 13, color: C.muted, textAlign: 'center' },
});
