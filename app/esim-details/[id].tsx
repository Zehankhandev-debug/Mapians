// app/esim-details/[id].tsx
// ─────────────────────────────────────────────────────────────
// Fetches GET /esim-details/:id (Bearer token)
// Displays comprehensive eSIM information
// ─────────────────────────────────────────────────────────────
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Linking,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext';
import { esimsApi } from '../../scripts/api';

const { width } = Dimensions.get('window');
const C = {
  bg:       '#FFFFFF',
  pageBg:   '#F8FAFB',
  primary:  '#016701',
  primaryL: '#E6F4E6',
  text:     '#0A0A0A',
  muted:    '#6B7280',
  border:   '#EAEEF2',
  red:      '#DC2626',
  redBg:    '#FEF2F2',
  amber:    '#D97706',
  amberBg:  '#FFFBEB',
  blue:     '#2563EB',
  blueBg:   '#EFF6FF',
  purple:   '#7C3AED',
  purpleBg: '#F5F3FF',
};

type Plan = {
  id: number;
  name: string;
  validity: string;
  data_in_gb: string;
  call_in_minutes: string;
  international_call_in_minutes: string;
  sms_in_count: string;
  description: string | null;
  main_country: string;
  main_country_data: string;
  main_country_call: string;
  is_daily_data_plan: number;
  gbp_price: string;
  price: string;
};

type ESimDetail = {
  id: number;
  iccid: string;
  lpa: string | null;
  activation_id: string;
  msisdn: string;
  confirmation_code: string;
  qrcode_url: string;
  status: string;
  request_time: string;
  created_at: string;
  plan: Plan;
};

function getStatusConfig(status: string) {
  const s = (status ?? '').toLowerCase();
  if (s === 'active' || s === 'successfull' || s === 'successful')
    return { color: C.primary, bg: C.primaryL, label: 'Active', isActive: true, icon: 'check-circle' };
  if (s === 'expired')
    return { color: C.red, bg: C.redBg, label: 'Expired', isActive: false, icon: 'x-circle' };
  return { color: C.amber, bg: C.amberBg, label: 'Pending', isActive: false, icon: 'clock' };
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function copyToClipboard(text: string, label: string) {
  Alert.alert('Copied!', `${label} copied to clipboard`);
  // In production with expo-clipboard:
  // import * as Clipboard from 'expo-clipboard';
  // await Clipboard.setStringAsync(text);
}

export default function ESimDetailsScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const { formatGbp } = useCurrency();
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const [esim, setEsim] = useState<ESimDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEsimDetails();
  }, [id]);

  const fetchEsimDetails = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await esimsApi.getEsimDetails(id);
      // Response structure: { status: 'success', message: '...', data: { esim: {...} } }
      setEsim(response.data.esim);
    } catch (err: any) {
      console.error('Error fetching eSIM details:', err);
      setError(err.message || 'Failed to load eSIM details');
    } finally {
      setLoading(false);
    }
  };

  const handleInstall = () => {
    if (esim?.lpa) {
      Alert.alert('Install eSIM', 'Follow your device instructions to complete installation.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Continue', onPress: () => Linking.openURL(esim.lpa!) },
      ]);
    } else if (esim?.activation_id) {
      Alert.alert('Manual Installation', `Use this activation code:\n\n${esim.activation_id}\n\nFollow your device's eSIM setup instructions.`);
    } else {
      Alert.alert('No Installation Method', 'This eSIM cannot be installed directly. Please contact support.');
    }
  };

  const viewQRCode = () => {
    if (esim?.qrcode_url) {
      router.push({
        pathname: '/esim-qr',
        params: {
          id: esim.id,
          qrImageUrl: esim.qrcode_url,
          activationId: esim.activation_id,
          esimName: esim.plan.name,
          iccid: esim.iccid,
        },
      });
    } else {
      Alert.alert('No QR Code', 'QR code is not available for this eSIM.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" backgroundColor={C.pageBg} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={styles.loadingText}>Loading eSIM details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !esim) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" backgroundColor={C.pageBg} />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color={C.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Error</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={48} color={C.red} />
          <Text style={styles.errorText}>{error || 'eSIM not found'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchEsimDetails}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const statusConfig = getStatusConfig(esim.status);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.pageBg} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={C.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>eSIM Details</Text>
        <TouchableOpacity onPress={fetchEsimDetails} style={styles.refreshButton}>
          <Feather name="refresh-cw" size={20} color={C.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {/* Status Banner */}
        <View style={[styles.statusBanner, { backgroundColor: statusConfig.bg }]}>
          <View style={styles.statusIndicator}>
            <Feather name={statusConfig.icon as any} size={24} color={statusConfig.color} />
            <Text style={[styles.statusText, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
          </View>
          {statusConfig.isActive && (
            <Text style={styles.statusSubtext}>Your eSIM is ready to use</Text>
          )}
        </View>

        {/* Plan Details Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Plan Information</Text>
          <Text style={styles.planName}>{esim.plan.name}</Text>
          
          <View style={styles.divider} />
          
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Feather name="database" size={22} color={C.blue} />
              <Text style={styles.infoValue}>
                {esim.plan.is_daily_data_plan === 1 
                  ? `${esim.plan.data_in_gb} GB/day`
                  : `${esim.plan.main_country_data} GB`}
              </Text>
              <Text style={styles.infoLabel}>Data</Text>
            </View>
            
            <View style={styles.infoItem}>
              <Feather name="calendar" size={22} color={C.purple} />
              <Text style={styles.infoValue}>{esim.plan.validity} days</Text>
              <Text style={styles.infoLabel}>Validity</Text>
            </View>
            
            <View style={styles.infoItem}>
              <Feather name="tag" size={22} color={C.primary} />
              <Text style={styles.infoValue}>{formatGbp(esim.plan.gbp_price)}</Text>
              <Text style={styles.infoLabel}>Price</Text>
            </View>
          </View>

          {/* Features */}
          {(esim.plan.call_in_minutes !== '0' || esim.plan.sms_in_count !== '0') && (
            <>
              <View style={styles.divider} />
              <View style={styles.featuresRow}>
                {esim.plan.call_in_minutes !== '0' && (
                  <View style={styles.featureChip}>
                    <Feather name="phone" size={14} color={C.primary} />
                    <Text style={styles.featureText}>{esim.plan.call_in_minutes} mins call</Text>
                  </View>
                )}
                {esim.plan.sms_in_count !== '0' && (
                  <View style={styles.featureChip}>
                    <Feather name="message-circle" size={14} color={C.primary} />
                    <Text style={styles.featureText}>{esim.plan.sms_in_count} SMS</Text>
                  </View>
                )}
              </View>
            </>
          )}

          {/* Country */}
          {esim.plan.main_country && (
            <View style={styles.countryRow}>
              <Feather name="map-pin" size={16} color={C.muted} />
              <Text style={styles.countryText}>{esim.plan.main_country}</Text>
            </View>
          )}
        </View>

        {/* Technical Details Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Technical Details</Text>
          
          <TouchableOpacity 
            style={styles.detailRow}
            onPress={() => copyToClipboard(esim.iccid, 'ICCID')}
          >
            <Text style={styles.detailLabel}>ICCID</Text>
            <View style={styles.detailValueContainer}>
              <Text style={styles.detailValue}>{esim.iccid}</Text>
              <Feather name="copy" size={16} color={C.primary} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.detailRow}
            onPress={() => copyToClipboard(esim.activation_id, 'Activation ID')}
          >
            <Text style={styles.detailLabel}>Activation ID</Text>
            <View style={styles.detailValueContainer}>
              <Text style={styles.detailValue} numberOfLines={2}>{esim.activation_id}</Text>
              <Feather name="copy" size={16} color={C.primary} />
            </View>
          </TouchableOpacity>

          {esim.msisdn && esim.msisdn !== 'null' && (
            <TouchableOpacity 
              style={styles.detailRow}
              onPress={() => copyToClipboard(esim.msisdn, 'Phone Number')}
            >
              <Text style={styles.detailLabel}>Phone Number</Text>
              <View style={styles.detailValueContainer}>
                <Text style={styles.detailValue}>{esim.msisdn}</Text>
                <Feather name="copy" size={16} color={C.primary} />
              </View>
            </TouchableOpacity>
          )}

          {esim.confirmation_code && esim.confirmation_code !== 'null' && (
            <TouchableOpacity 
              style={styles.detailRow}
              onPress={() => copyToClipboard(esim.confirmation_code, 'Confirmation Code')}
            >
              <Text style={styles.detailLabel}>Confirmation Code</Text>
              <View style={styles.detailValueContainer}>
                <Text style={styles.detailValue}>{esim.confirmation_code}</Text>
                <Feather name="copy" size={16} color={C.primary} />
              </View>
            </TouchableOpacity>
          )}

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Request Time</Text>
            <Text style={styles.detailValue}>{formatDate(esim.request_time)}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Created At</Text>
            <Text style={styles.detailValue}>{formatDate(esim.created_at)}</Text>
          </View>
        </View>

        {/* Actions Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Actions</Text>
          
          <View style={styles.actionButtons}>
            {esim.qrcode_url && (
              <TouchableOpacity style={styles.qrButton} onPress={viewQRCode}>
                <Feather name="maximize" size={20} color={C.primary} />
                <Text style={styles.qrButtonText}>View QR Code</Text>
              </TouchableOpacity>
            )}

            {(esim.lpa || esim.activation_id) && (
              <TouchableOpacity style={styles.installButton} onPress={handleInstall}>
                <Feather name="download" size={20} color={C.bg} />
                <Text style={styles.installButtonText}>Install eSIM</Text>
              </TouchableOpacity>
            )}
          </View>

          {!esim.lpa && !esim.qrcode_url && !esim.activation_id && (
            <Text style={styles.noActionText}>No installation method available</Text>
          )}
        </View>

        {/* Help Section */}
        <View style={styles.helpCard}>
          <Feather name="help-circle" size={24} color={C.primary} />
          <View style={styles.helpContent}>
            <Text style={styles.helpTitle}>Need help?</Text>
            <Text style={styles.helpText}>
              Contact support if you're having trouble installing or activating your eSIM
            </Text>
            <TouchableOpacity style={styles.supportButton}>
              <Text style={styles.supportButtonText}>Contact Support</Text>
              <Feather name="arrow-right" size={14} color={C.primary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.pageBg },
  scroll: { flex: 1 },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: C.bg,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: C.text,
  },
  
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: C.muted,
  },
  
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    color: C.muted,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: C.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  retryButtonText: {
    color: C.bg,
    fontWeight: '600',
    fontSize: 14,
  },
  
  statusBanner: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '700',
  },
  statusSubtext: {
    fontSize: 12,
    color: C.muted,
  },
  
  card: {
    backgroundColor: C.bg,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: C.text,
    marginBottom: 12,
  },
  planName: {
    fontSize: 18,
    fontWeight: '800',
    color: C.primary,
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: C.border,
    marginVertical: 12,
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  infoItem: {
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '700',
    color: C.text,
  },
  infoLabel: {
    fontSize: 11,
    color: C.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  featuresRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  featureChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.primaryL,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  featureText: {
    fontSize: 12,
    fontWeight: '600',
    color: C.primary,
  },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  countryText: {
    fontSize: 13,
    color: C.muted,
  },
  
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: C.muted,
    flex: 1,
  },
  detailValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 2,
    justifyContent: 'flex-end',
  },
  detailValue: {
    fontSize: 13,
    color: C.text,
    textAlign: 'right',
    flexShrink: 1,
  },
  
  actionButtons: {
    gap: 10,
  },
  qrButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: C.primary,
    backgroundColor: C.bg,
  },
  qrButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: C.primary,
  },
  installButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: C.primary,
  },
  installButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: C.bg,
  },
  noActionText: {
    textAlign: 'center',
    fontSize: 13,
    color: C.muted,
    paddingVertical: 20,
  },
  
  helpCard: {
    flexDirection: 'row',
    backgroundColor: C.blueBg,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: C.blue + '30',
  },
  helpContent: {
    flex: 1,
    gap: 6,
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: C.text,
  },
  helpText: {
    fontSize: 12,
    color: C.muted,
    lineHeight: 18,
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  supportButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: C.primary,
  },
});