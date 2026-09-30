import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { globalPlansApi, plansApi, regionsApi } from '../scripts/api';
import type { Plan } from '../scripts/api';
import { CurrencySelector } from '../components/CurrencySelector';
import { useCurrency } from '../context/CurrencyContext';

const C = {
  bg:       '#FFFFFF',
  pageBg:   '#F8FAFB',
  primary:  '#016701',
  text:     '#0A0A0A',
  muted:    '#6B7280',
  border:   '#EAEEF2',
  red:      '#DC2626',
  gold:     '#D97706',
  goldBg:   '#FEF3C7',
  saveBg:   '#DCFCE7',
  saveText: '#016701',
};

type PlanType = 'daily' | 'fixed' | 'unlimited';

const TYPE_TABS: {
  key:   PlanType;
  label: string;
  desc:  string;
  tag:   string;
  icon:  keyof typeof MaterialCommunityIcons.glyphMap;
}[] = [
  {
    key: 'daily', label: 'Per Day Data eSIM', icon: 'calendar-month-outline',
    desc: 'Daily high speed data and then 128kbps FUP.', tag: 'Recommended for short stays',
  },
  {
    key: 'fixed', label: 'Fixed Data eSIM', icon: 'layers-outline',
    desc: 'Fix high speed data for selected days.', tag: 'Best for heavy users',
  },
  {
    key: 'unlimited', label: 'Truly Unlimited', icon: 'infinity',
    desc: 'Unlimited high speed data, no restriction.', tag: 'Popular choice',
  },
];

const isUnlimitedPlan = (p: Plan) => p.data_in_gb?.trim().toLowerCase() === 'unlimited';

const matchesType = (p: Plan, type: PlanType) => {
  if (type === 'unlimited') return isUnlimitedPlan(p);
  if (isUnlimitedPlan(p)) return false;
  const isDaily = Number(p.is_daily_data_plan) === 1;
  return type === 'daily' ? isDaily : !isDaily;
};

const uniqueSortedNumeric = (values: string[]) =>
  [...new Set(values)].sort((a, b) => Number(a) - Number(b));

export default function AvailablePlansScreen() {
  const router = useRouter();
  const { formatGbp } = useCurrency();
  const { countryId, countryName, fromProvider, regionSlug, global } = useLocalSearchParams<{
    countryId?:    string;
    countryName:   string;
    fromProvider?: string;
    regionSlug?:   string;
    global?:       string;
  }>();

  const [plans,      setPlans]      = useState<Plan[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);

  const [planType,         setPlanType]         = useState<PlanType | null>(null);
  const [selectedValidity, setSelectedValidity]  = useState<string | null>(null);
  const [selectedData,     setSelectedData]      = useState<string | null>(null);
  // Multi-country/region/global plans can have several distinct plans that
  // share the same type+duration+data but differ in country coverage & price
  // (e.g. "1GB/10 days" covering 2 countries vs. another "1GB/10 days"
  // covering 58) — this tracks which one of those ties the user picked.
  const [selectedPlanId,   setSelectedPlanId]    = useState<number | null>(null);
  // Single/multi country radio — country pages only, per the product sheet:
  // region pages always behave like "multi country" (full filter UI).
  const [viewMode, setViewMode] = useState<'single' | 'multi'>('single');

  const isGlobal      = global === 'true';
  const isCountryPage = !regionSlug && !isGlobal;
  const showAllPlans  = !isCountryPage || viewMode === 'multi';

  useEffect(() => {
    if (!countryId && !regionSlug && !isGlobal) return;
    fetchPlans();
  }, [countryId, regionSlug, isGlobal]);

  const fetchPlans = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = isGlobal
        ? await globalPlansApi.getGlobalPlans()
        : regionSlug
          ? await regionsApi.getRegionPlans(regionSlug)
          : await plansApi.getCountryPlans(countryId as string);
      const loaded: Plan[] =
        (res.data as any)?.plans ??
        (Array.isArray(res.data) ? (res.data as any) : []);
      setPlans(loaded);

      const firstAvailable = TYPE_TABS.find(t => loaded.some(p => matchesType(p, t.key)));
      setPlanType(firstAvailable?.key ?? null);
      setSelectedValidity(null);
      setSelectedData(null);
      setSelectedPlanId(null);
      setViewMode('single');
    } catch (err: any) {
      setError(err.message || 'Failed to load plans');
    } finally {
      setLoading(false);
    }
  };

  // ── Drill-down: type → duration → data ──────────────────────────────────
  const availableTypeTabs = TYPE_TABS.filter(t => plans.some(p => matchesType(p, t.key)));
  const typedPlans = planType ? plans.filter(p => matchesType(p, planType)) : [];
  const durations  = uniqueSortedNumeric(typedPlans.map(p => p.validity));

  const effectiveValidity = selectedValidity && durations.includes(selectedValidity)
    ? selectedValidity
    : durations[0] ?? null;

  const plansForDuration = typedPlans.filter(p => p.validity === effectiveValidity);
  const dataOptions      = uniqueSortedNumeric(plansForDuration.map(p => p.data_in_gb));

  const effectiveData = planType === 'unlimited'
    ? null
    : (selectedData && dataOptions.includes(selectedData) ? selectedData : dataOptions[0] ?? null);

  // Single country mode: ignore the duration/data drill-down and just surface
  // the cheapest plan of the selected type. Multi country (and region/global
  // pages) keep the full filtered drill-down.
  const cheapestInType = typedPlans.length
    ? [...typedPlans].sort((a, b) => (Number(a.gbp_price) || 0) - (Number(b.gbp_price) || 0))[0]
    : null;

  // Regional/global plans carry their own supported_countries list; a plain
  // single-country plan usually comes back with that list empty, so fall
  // back to just this one country instead of showing nothing.
  const resolvedCoverage = (plan: Plan | null) =>
    plan?.supported_countries?.length ? plan.supported_countries : (countryName ? [countryName] : []);

  // All plans tying on type+duration(+data) — usually just one, but
  // multi-country/region/global plans often have several at different
  // country-coverage tiers (see resolvedPlan comment above).
  const matchingPlans = planType === 'unlimited'
    ? plansForDuration
    : plansForDuration.filter(p => p.data_in_gb === effectiveData);

  const resolvedPlan = !showAllPlans
    ? cheapestInType
    : matchingPlans.find(p => p.id === selectedPlanId) ?? matchingPlans[0] ?? null;

  const handleSelectType = (type: PlanType) => {
    setPlanType(type);
    setSelectedValidity(null);
    setSelectedData(null);
    setSelectedPlanId(null);
  };

  const handleSelectValidity = (v: string) => {
    setSelectedValidity(v);
    setSelectedData(null);
    setSelectedPlanId(null);
  };

  const handleSelectData = (d: string) => {
    setSelectedData(d);
    setSelectedPlanId(null);
  };

  const handleContinue = () => {
    if (!resolvedPlan) return;
    router.push({
      pathname: '/checkout',
      params: {
        plan:         JSON.stringify(resolvedPlan),
        fromProvider: fromProvider ?? 'false',
      },
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.pageBg} />

      {/* ── HEADER ─────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          activeOpacity={0.7}
          onPress={() => router.back()}
        >
          <Feather name="arrow-left" size={22} color={C.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Available Plans</Text>
        <TouchableOpacity style={styles.backBtn} onPress={fetchPlans}>
          <Feather name="refresh-cw" size={18} color={loading ? C.primary : C.muted} />
        </TouchableOpacity>
      </View>

      {/* Loading */}
      {loading && (
        <View style={styles.stateBox}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={styles.stateTxt}>Loading plans…</Text>
        </View>
      )}

      {/* Error */}
      {!loading && error && (
        <View style={styles.stateBox}>
          <Feather name="wifi-off" size={36} color={C.muted} />
          <Text style={styles.stateTxt}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchPlans}>
            <Text style={styles.retryTxt}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Content */}
      {!loading && !error && (
        <>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >

            {/* ── COUNTRY ROW ──────────────────────────────────────── */}
            <View style={styles.countryRow}>
              <Text style={styles.countryName}>{countryName ?? 'Unknown'}</Text>
              <View style={{ flex: 1 }} />
              <CurrencySelector compact />
            </View>

            {/* ── SINGLE / MULTI COUNTRY ────────────────────────────── */}
            {isCountryPage && (
              <View style={styles.modeRow}>
                <TouchableOpacity
                  style={styles.modeOption}
                  activeOpacity={0.75}
                  onPress={() => setViewMode('single')}
                >
                  <View style={[styles.radioOuter, viewMode === 'single' && styles.radioOuterOn]}>
                    {viewMode === 'single' && <View style={styles.radioInner} />}
                  </View>
                  <View>
                    <Text style={styles.modeLabel}>Single country</Text>
                    <Text style={styles.modeSub}>Cheapest plan for this country</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modeOption}
                  activeOpacity={0.75}
                  onPress={() => setViewMode('multi')}
                >
                  <View style={[styles.radioOuter, viewMode === 'multi' && styles.radioOuterOn]}>
                    {viewMode === 'multi' && <View style={styles.radioInner} />}
                  </View>
                  <View>
                    <Text style={styles.modeLabel}>Multi country</Text>
                    <Text style={styles.modeSub}>Browse all plans &amp; filters</Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}

            {plans.length === 0 ? (
              <View style={styles.stateBox}>
                <Feather name="inbox" size={32} color={C.muted} />
                <Text style={styles.stateTxt}>No plans available for this country</Text>
              </View>
            ) : (
              <>
                {/* ── PLAN TYPE ────────────────────────────────────── */}
                <Text style={styles.groupLabel}>Select Data Type</Text>
                <View style={styles.typeCardList}>
                  {availableTypeTabs.map(t => {
                    const active = planType === t.key;
                    return (
                      <TouchableOpacity
                        key={t.key}
                        style={[styles.typeCard, active && styles.typeCardActive]}
                        activeOpacity={0.8}
                        onPress={() => handleSelectType(t.key)}
                      >
                        <View style={[styles.typeCardIconWrap, active && styles.typeCardIconWrapActive]}>
                          <MaterialCommunityIcons name={t.icon} size={20} color={active ? C.primary : C.muted} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.typeCardTitle}>{t.label}</Text>
                          <Text style={styles.typeCardDesc}>{t.desc}</Text>
                          <View style={[styles.typeCardTag, active && styles.typeCardTagActive]}>
                            <Text style={[styles.typeCardTagText, active && styles.typeCardTagTextActive]}>{t.tag}</Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {typedPlans.length === 0 ? (
                  <View style={styles.stateBox}>
                    <Feather name="inbox" size={32} color={C.muted} />
                    <Text style={styles.stateTxt}>No plans available for this type</Text>
                  </View>
                ) : (
                  <>
                    {showAllPlans && (
                      <>
                    {/* ── DURATION ─────────────────────────────────── */}
                    <Text style={styles.groupLabel}>Select Duration</Text>
                    <View style={styles.gridRow}>
                      {durations.map(d => {
                        const active = effectiveValidity === d;
                        return (
                          <TouchableOpacity
                            key={d}
                            style={[styles.gridBox, active && styles.gridBoxActive]}
                            activeOpacity={0.8}
                            onPress={() => handleSelectValidity(d)}
                          >
                            <Text style={[styles.gridBoxNumber, active && styles.gridBoxNumberActive]}>{d}</Text>
                            <Text style={[styles.gridBoxUnit, active && styles.gridBoxUnitActive]}>Days</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    {/* ── DATA (hidden for Truly Unlimited) ───────────── */}
                    {planType !== 'unlimited' && (
                      <>
                        <Text style={styles.groupLabel}>Select Data</Text>
                        <View style={styles.gridRow}>
                          {dataOptions.map(d => {
                            const active = effectiveData === d;
                            return (
                              <TouchableOpacity
                                key={d}
                                style={[styles.gridBox, active && styles.gridBoxActive]}
                                activeOpacity={0.8}
                                onPress={() => handleSelectData(d)}
                              >
                                <Text style={[styles.gridBoxNumber, active && styles.gridBoxNumberActive]}>{d}</Text>
                                <Text style={[styles.gridBoxUnit, active && styles.gridBoxUnitActive]}>GB</Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </>
                    )}
                      </>
                    )}

                    {/* ── MULTIPLE PLANS TYING ON DURATION+DATA ─────────
                        Multi-country/region/global data can have several
                        distinct plans at this same duration+data point,
                        differing only in country coverage & price — list
                        them all so the user can pick, instead of silently
                        picking one. */}
                    {showAllPlans && matchingPlans.length > 1 ? (
                      <>
                        <Text style={styles.groupLabel}>Select Plan</Text>
                        <View style={{ gap: 10 }}>
                          {matchingPlans.map(p => {
                            const active   = resolvedPlan?.id === p.id;
                            const coverage = resolvedCoverage(p);
                            return (
                              <TouchableOpacity
                                key={p.id}
                                style={[styles.planCard, !active && styles.planCardInactive]}
                                activeOpacity={0.85}
                                onPress={() => setSelectedPlanId(p.id)}
                              >
                                <View style={styles.planTopRow}>
                                  <Text style={styles.planData}>
                                    {p.data_in_gb?.toLowerCase() === 'unlimited' ? 'Unlimited' : `${p.data_in_gb} GB`}
                                  </Text>
                                  <Text style={styles.planPrice}>{formatGbp(p.gbp_price)}</Text>
                                </View>
                                <View style={styles.planBottomRow}>
                                  <Text style={styles.planDays}>{p.validity} days</Text>
                                </View>
                                <View style={styles.countriesRow}>
                                  <Feather name="globe" size={12} color={C.muted} />
                                  <Text style={styles.countriesText}>
                                    {coverage.length === 1
                                      ? `Supported Country: 1 (${coverage[0]})`
                                      : `Supported Countries: ${coverage.length}`}
                                  </Text>
                                </View>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </>
                    ) : (
                      /* ── SELECTED PLAN SUMMARY (single match) ────────── */
                      resolvedPlan && (
                        <View style={styles.planCard}>
                          {!showAllPlans && (
                            <View style={styles.cheapestBadge}>
                              <Feather name="tag" size={11} color={C.primary} />
                              <Text style={styles.cheapestBadgeText}>Cheapest plan for this country</Text>
                            </View>
                          )}
                          <View style={styles.planTopRow}>
                            <Text style={styles.planData}>
                              {resolvedPlan.data_in_gb?.toLowerCase() === 'unlimited' ? 'Unlimited' : `${resolvedPlan.data_in_gb} GB`}
                            </Text>
                            <Text style={styles.planPrice}>{formatGbp(resolvedPlan.gbp_price)}</Text>
                          </View>
                          <View style={styles.planBottomRow}>
                            <Text style={styles.planDays}>{resolvedPlan.validity} days</Text>
                          </View>
                          <View style={styles.countriesRow}>
                            <Feather name="globe" size={12} color={C.muted} />
                            <Text style={styles.countriesText}>
                              {resolvedCoverage(resolvedPlan).length === 1
                                ? `Supported Country: 1 (${resolvedCoverage(resolvedPlan)[0]})`
                                : `Supported Countries: ${resolvedCoverage(resolvedPlan).length}`}
                            </Text>
                          </View>
                        </View>
                      )
                    )}
                  </>
                )}
              </>
            )}

          </ScrollView>

          {/* ── CONTINUE BUTTON ──────────────────────────────────────── */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.continueBtn, !resolvedPlan && { opacity: 0.5 }]}
              activeOpacity={0.85}
              onPress={handleContinue}
              disabled={!resolvedPlan}
            >
              <Text style={styles.continueBtnText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: C.pageBg },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: C.pageBg, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: C.bg,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: C.border,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: C.text },

  scroll:        { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 20, gap: 14 },

  stateBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  stateTxt: { fontSize: 14, color: C.muted },
  retryBtn: { backgroundColor: C.primary, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10 },
  retryTxt: { color: C.bg, fontWeight: '700', fontSize: 14 },

  countryRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: C.bg, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: C.border,
  },
  countryName: { fontSize: 16, fontWeight: '700', color: C.text },

  modeRow: { flexDirection: 'row', gap: 10 },
  modeOption: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: C.bg, borderRadius: 14, padding: 12,
    borderWidth: 1, borderColor: C.border,
  },
  radioOuter: {
    width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },
  radioOuterOn: { borderColor: C.primary },
  radioInner: { width: 9, height: 9, borderRadius: 4.5, backgroundColor: C.primary },
  modeLabel: { fontSize: 13, fontWeight: '700', color: C.text },
  modeSub:   { fontSize: 10.5, color: C.muted, marginTop: 1 },

  groupLabel: { fontSize: 16, fontWeight: '800', color: C.text, marginTop: -2 },

  typeCardList: { gap: 10 },
  typeCard: {
    flexDirection: 'row', gap: 12, padding: 14,
    borderRadius: 14, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.bg,
  },
  typeCardActive: { borderColor: C.primary, backgroundColor: '#F3FBF3' },
  typeCardIconWrap: {
    width: 38, height: 38, borderRadius: 10, backgroundColor: C.pageBg,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  typeCardIconWrapActive: { backgroundColor: C.saveBg },
  typeCardTitle: { fontSize: 15, fontWeight: '700', color: C.text },
  typeCardDesc:  { fontSize: 12.5, color: C.muted, marginTop: 2, lineHeight: 17 },
  typeCardTag: {
    alignSelf: 'flex-start', backgroundColor: C.pageBg, borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 3, marginTop: 8,
  },
  typeCardTagActive:     { backgroundColor: C.saveBg },
  typeCardTagText:       { fontSize: 11, fontWeight: '600', color: C.muted },
  typeCardTagTextActive: { color: C.saveText },

  gridRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  gridBox: {
    minWidth: 72, alignItems: 'center', paddingVertical: 12, paddingHorizontal: 10,
    borderRadius: 12, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.bg,
  },
  gridBoxActive:       { borderColor: C.primary, backgroundColor: '#F3FBF3' },
  gridBoxNumber:       { fontSize: 18, fontWeight: '800', color: C.text },
  gridBoxNumberActive: { color: C.primary },
  gridBoxUnit:         { fontSize: 12, color: C.muted, marginTop: 2 },
  gridBoxUnitActive:   { color: C.primary },

  planCard: {
    backgroundColor: C.bg, borderRadius: 16, padding: 16,
    borderWidth: 1.5, borderColor: C.primary, gap: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  planCardInactive: {
    borderColor: C.border,
  },
  cheapestBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start',
    backgroundColor: C.saveBg, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
  },
  cheapestBadgeText: { fontSize: 11, fontWeight: '700', color: C.primary },

  planTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  planData:   { fontSize: 18, fontWeight: '800', color: C.text },
  planPrice:  { fontSize: 18, fontWeight: '800', color: C.text },

  planBottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  planDays:      { fontSize: 13, color: C.muted, fontWeight: '500' },

  countriesRow:  { flexDirection: 'row', alignItems: 'center', gap: 5 },
  countriesText: { fontSize: 12, color: C.muted, fontWeight: '500' },

  creditsChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: C.goldBg, borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 4, alignSelf: 'flex-start',
  },
  creditsText: { fontSize: 11, fontWeight: '600', color: C.gold },

  footer: {
    padding: 16, backgroundColor: C.bg,
    borderTopWidth: 1, borderTopColor: C.border,
  },
  continueBtn: {
    backgroundColor: C.primary, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', justifyContent: 'center',
    shadowColor: C.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 10, elevation: 4,
  },
  continueBtnText: { fontSize: 16, fontWeight: '700', color: C.bg },
});
