// app/screens/explore-plans.tsx
// ─────────────────────────────────────────────────────────────
// Fetches GET /countries (Bearer token required).
// Tapping a country → available-plans with countryId + country name.
// ─────────────────────────────────────────────────────────────
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  FlatList,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SvgXml } from 'react-native-svg';
import { ProvidersBrowser } from '../components/ProvidersBrowser';
import { useAuth } from '../context/AuthContext';
import { countriesApi, regionsApi, type Country, type Region } from '../scripts/api';

const BASE_URL = 'https://mapians.com/';   // for flag images

// Matches the "Explore eSIM Plans for International Travel" destinations
// shown on the mapians.com homepage, in the same order.
const HOMEPAGE_TOP_PICKS = [
  'Australia', 'Brazil', 'Canada', 'China', 'France', 'Germany', 'Greece',
  'India', 'Indonesia', 'Italy', 'Japan', 'Netherlands', 'New Zealand',
  'Portugal', 'Saudi Arabia', 'Spain', 'Thailand', 'Turkey',
  'United Kingdom', 'United States',
];

// Flags are .svg paths — RN's <Image> can't decode SVG. SvgXml renders raw SVG markup,
// so we fetch the text ourselves and cache it by URL: with ~150+ rows recycling through
// a virtualized list, refetching the same flag every time it remounts would be wasteful.
const svgCache = new Map<string, string>();

function CountryFlag({ uri }: { uri: string }) {
  const isSvg = uri.toLowerCase().endsWith('.svg');
  const [xml, setXml] = useState<string | null>(isSvg ? svgCache.get(uri) ?? null : null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!isSvg || xml || failed) return;
    let cancelled = false;
    fetch(uri)
      .then(res => { if (!res.ok) throw new Error('flag fetch failed'); return res.text(); })
      .then(text => {
        if (cancelled) return;
        svgCache.set(uri, text);
        setXml(text);
      })
      .catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; };
  }, [uri, isSvg, xml, failed]);

  if (failed) {
    return (
      <View style={[styles.flagImg, styles.flagFallback]}>
        <Feather name="flag" size={14} color={C.muted} />
      </View>
    );
  }

  if (isSvg) {
    if (!xml) return <View style={styles.flagImg} />;
    return <SvgXml xml={xml} width={38} height={28} onError={() => setFailed(true)} />;
  }

  return (
    <Image
      source={{ uri }}
      style={styles.flagImg}
      resizeMode="contain"
      onError={() => setFailed(true)}
    />
  );
}

function CountryRowContent({ item }: { item: Country }) {
  return (
    <>
      <View style={styles.flagWrap}>
        <CountryFlag uri={`${BASE_URL}${item.image}`} />
      </View>
      <View style={styles.countryInfo}>
        <Text style={styles.countryName}>{item.name}</Text>
        <Text style={styles.countryCode}>{item.iso2}</Text>
      </View>
      <Feather name="chevron-right" size={18} color={C.muted} />
    </>
  );
}

const C = {
  bg:      '#FFFFFF',
  pageBg:  '#F8FAFB',
  primary: '#016701',
  text:    '#0A0A0A',
  muted:   '#6B7280',
  border:  '#EAEEF2',
};

const BASE_TABS = ['Country', 'Regional', 'Global'];

export default function ExplorePlansScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  // Guests have no other way to reach provider plans (the /providers screen
  // is only linked from the logged-in-only My eSIMs screen), so surface it
  // here as a tab — logged-in users already have that entry point.
  const TABS = isAuthenticated ? BASE_TABS : [...BASE_TABS, 'Providers'];
  const [activeTab, setActiveTab] = useState('Country');
  const [search,    setSearch]    = useState('');
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);

  const [regions,        setRegions]        = useState<Region[]>([]);
  const [regionsLoading, setRegionsLoading] = useState(false);
  const [regionsError,   setRegionsError]   = useState<string | null>(null);
  const [regionsFetched, setRegionsFetched] = useState(false);

  useEffect(() => { fetchCountries(); }, []);

  useEffect(() => {
    if (activeTab === 'Regional' && !regionsFetched) fetchRegions();
  }, [activeTab, regionsFetched]);

  const fetchCountries = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await countriesApi.getCountries();
      setCountries(res.data.countries ?? []);
    } catch (err: any) {
      setError(err.message || 'Failed to load countries');
    } finally {
      setLoading(false);
    }
  };

  const fetchRegions = async () => {
    setRegionsLoading(true);
    setRegionsError(null);
    try {
      const res = await regionsApi.getRegions();
      const list: Region[] =
        res?.data?.regions ??
        (Array.isArray(res?.data) ? (res.data as any) : []);
      setRegions(list);
    } catch (err: any) {
      setRegionsError(err.message || 'Failed to load regions');
    } finally {
      setRegionsLoading(false);
      setRegionsFetched(true);
    }
  };

  const filtered = countries.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const topPicks = HOMEPAGE_TOP_PICKS
    .map(name => countries.find(c => c.name.toLowerCase() === name.toLowerCase()))
    .filter((c): c is Country => !!c)
    .slice(0, 5);

  const handleCountryPress = (c: Country) => {
    router.push({
      pathname: '/available-plans',
      params: { countryId: c.id, countryName: c.name, countryIso2: c.iso2 },
    });
  };

  const handleRegionPress = (r: Region) => {
    router.push({
      pathname: '/available-plans',
      params: { regionSlug: r.slug ?? String(r.id), countryName: r.name },
    });
  };

  const handleGlobalPress = () => {
    router.push({
      pathname: '/available-plans',
      params: { global: 'true', countryName: 'Global Plans' },
    });
  };

  // Top picks (≤5 items) render as a single divided card, same as before.
  const renderBlockRow = (item: Country, isLast: boolean) => (
    <TouchableOpacity
      key={item.id}
      style={[styles.countryRow, !isLast && styles.rowBorder]}
      activeOpacity={0.75}
      onPress={() => handleCountryPress(item)}
    >
      <CountryRowContent item={item} />
    </TouchableOpacity>
  );

  // Full destination list renders as a virtualized FlatList of standalone
  // cards, so off-screen rows (and their flag fetches) never mount.
  const renderCardRow = ({ item }: { item: Country }) => (
    <TouchableOpacity
      style={[styles.countryRow, styles.countryCard]}
      activeOpacity={0.75}
      onPress={() => handleCountryPress(item)}
    >
      <CountryRowContent item={item} />
    </TouchableOpacity>
  );

  const tabsRow = (
    <View style={styles.tabsRow}>
      {TABS.map(tab => (
        <TouchableOpacity
          key={tab}
          style={[styles.tab, activeTab === tab && styles.tabActive]}
          onPress={() => setActiveTab(tab)}
        >
          <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.pageBg} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={C.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Data Plans</Text>
        <TouchableOpacity style={styles.backBtn} onPress={fetchCountries}>
          <Feather name="refresh-cw" size={18} color={loading ? C.primary : C.muted} />
        </TouchableOpacity>
      </View>

      {/* Loading */}
      {loading && (
        <View style={styles.stateBox}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={styles.stateText}>Loading destinations…</Text>
        </View>
      )}

      {/* Error */}
      {!loading && error && (
        <View style={styles.stateBox}>
          <Feather name="wifi-off" size={36} color={C.muted} />
          <Text style={styles.stateText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchCountries}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Country tab — long list, virtualized via FlatList so off-screen flags
          don't all fetch/render at once */}
      {!loading && !error && activeTab === 'Country' && (
        <FlatList
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          data={filtered}
          keyExtractor={item => String(item.id)}
          renderItem={renderCardRow}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          initialNumToRender={10}
          maxToRenderPerBatch={8}
          updateCellsBatchingPeriod={50}
          windowSize={3}
          removeClippedSubviews
          ListHeaderComponent={
            <View style={{ gap: 14 }}>
              <View style={styles.searchBox}>
                <Feather name="search" size={18} color={C.muted} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search country…"
                  placeholderTextColor={C.muted}
                  value={search}
                  onChangeText={setSearch}
                />
                {search.length > 0 && (
                  <TouchableOpacity onPress={() => setSearch('')}>
                    <Feather name="x" size={16} color={C.muted} />
                  </TouchableOpacity>
                )}
              </View>

              {tabsRow}

              {search.length === 0 && topPicks.length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>Top picks</Text>
                  <View style={styles.listBlock}>
                    {topPicks.map((item, i) => renderBlockRow(item, i === topPicks.length - 1))}
                  </View>
                </>
              )}

              <Text style={styles.sectionTitle}>
                {search.length > 0 ? `Results (${filtered.length})` : 'All destinations'}
              </Text>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.noResults}>
              <Feather name="search" size={32} color={C.muted} />
              <Text style={styles.noResultsText}>No destinations found</Text>
            </View>
          }
          ListFooterComponent={<View style={{ height: 20 }} />}
        />
      )}

      {/* Regional tab — GET /regions */}
      {!loading && !error && activeTab === 'Regional' && (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {tabsRow}

          {regionsLoading && (
            <View style={styles.stateBox}>
              <ActivityIndicator size="large" color={C.primary} />
              <Text style={styles.stateText}>Loading regions…</Text>
            </View>
          )}

          {!regionsLoading && regionsError && (
            <View style={styles.stateBox}>
              <Feather name="wifi-off" size={36} color={C.muted} />
              <Text style={styles.stateText}>{regionsError}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={fetchRegions}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          {!regionsLoading && !regionsError && regions.length === 0 && (
            <View style={styles.comingSoonBox}>
              <Feather name="globe" size={36} color={C.muted} />
              <Text style={styles.comingSoonTitle}>No regional plans yet</Text>
              <Text style={styles.comingSoonText}>
                Multi-country bundles for regions like Europe and Asia aren&apos;t available yet — check back soon.
              </Text>
            </View>
          )}

          {!regionsLoading && !regionsError && regions.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Regional bundles</Text>
              <View style={styles.listBlock}>
                {regions.map((r, i) => (
                  <TouchableOpacity
                    key={r.id ?? r.slug ?? i}
                    style={[styles.countryRow, i !== regions.length - 1 && styles.rowBorder]}
                    activeOpacity={0.75}
                    onPress={() => handleRegionPress(r)}
                  >
                    <View style={styles.flagWrap}>
                      <Feather name="globe" size={18} color={C.primary} />
                    </View>
                    <View style={styles.countryInfo}>
                      <Text style={styles.countryName}>{r.name}</Text>
                    </View>
                    <Feather name="chevron-right" size={18} color={C.muted} />
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </ScrollView>
      )}

      {/* Global tab — GET /global-plans (single bundle, no list to pick from) */}
      {!loading && !error && activeTab === 'Global' && (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {tabsRow}
          <TouchableOpacity style={styles.globalPromo} activeOpacity={0.85} onPress={handleGlobalPress}>
            <View style={styles.globalIconWrap}>
              <Feather name="globe" size={26} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.globalPromoTitle}>Global Plans</Text>
              <Text style={styles.globalPromoText}>
                One eSIM, data that works across 100+ countries. Perfect for multi-country trips.
              </Text>
            </View>
            <Feather name="chevron-right" size={20} color="#fff" />
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Providers tab — guest-only entry point to GET /provider + /provider-plans/:id */}
      {!loading && !error && !isAuthenticated && activeTab === 'Providers' && (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {tabsRow}
          <ProvidersBrowser />
        </ScrollView>
      )}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:  { flex: 1, backgroundColor: C.pageBg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: C.pageBg, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: C.bg,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: C.text },
  scroll:        { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40, gap: 10 },

  searchBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: C.bg,
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, gap: 10,
    borderWidth: 1, borderColor: C.border, elevation: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4,
  },
  searchInput: { flex: 1, fontSize: 15, color: C.text, padding: 0 },

  tabsRow: { flexDirection: 'row', gap: 8 },
  tab: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 8, paddingHorizontal: 16, borderRadius: 999,
    borderWidth: 1.5, borderColor: C.border, backgroundColor: C.bg,
  },
  tabActive:     { backgroundColor: C.primary, borderColor: C.primary },
  tabText:       { fontSize: 14, fontWeight: '600', color: C.text },
  tabTextActive: { color: C.bg },

  sectionTitle: { fontSize: 18, fontWeight: '800', color: C.text, marginTop: 4 },

  listBlock: {
    backgroundColor: C.bg, borderRadius: 16, borderWidth: 1, borderColor: C.border,
    overflow: 'hidden', elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8,
  },
  countryCard: {
    backgroundColor: C.bg, borderRadius: 14, borderWidth: 1, borderColor: C.border,
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4,
  },
  countryRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 16, gap: 14,
  },
  rowBorder:   { borderBottomWidth: 1, borderBottomColor: C.border },
  flagWrap:    {
    width: 40, height: 30, borderRadius: 6, overflow: 'hidden',
    backgroundColor: C.pageBg, borderWidth: 1, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },
  flagImg:     { width: 38, height: 28 },
  flagFallback:{ alignItems: 'center', justifyContent: 'center' },
  countryInfo: { flex: 1, gap: 1 },
  countryName: { fontSize: 15, fontWeight: '600', color: C.text },
  countryCode: { fontSize: 12, color: C.muted },

  stateBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  stateText: { fontSize: 14, color: C.muted, fontWeight: '500' },
  retryBtn:  { backgroundColor: C.primary, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10 },
  retryText: { color: C.bg, fontWeight: '700', fontSize: 14 },

  noResults:     { alignItems: 'center', padding: 40, gap: 12 },
  noResultsText: { fontSize: 14, color: C.muted },

  comingSoonBox: { alignItems: 'center', paddingVertical: 56, paddingHorizontal: 24, gap: 10 },
  comingSoonTitle: { fontSize: 16, fontWeight: '700', color: C.text, textAlign: 'center' },
  comingSoonText:  { fontSize: 13, color: C.muted, textAlign: 'center', lineHeight: 19 },

  globalPromo: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: C.primary, borderRadius: 16, padding: 18,
  },
  globalIconWrap: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center',
  },
  globalPromoTitle: { fontSize: 17, fontWeight: '800', color: '#FFFFFF' },
  globalPromoText:  { fontSize: 12.5, color: '#FFFFFFE0', marginTop: 3, lineHeight: 18 },
});
