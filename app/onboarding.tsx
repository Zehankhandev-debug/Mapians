import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    Animated,
    Dimensions,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { width, height } = Dimensions.get('window');

const C = {
  bg:      '#FFFFFF',
  primary: '#016701',
  text:    '#0A0A0A',
  muted:   '#8A8A8A',
  faint:   '#E8E8E8',
  light:   '#F0F7F0',
};

// ── Slide content ──────────────────────────────────────────────────────────────
const SLIDES = [
  {
    id: 1,
    icon: '📡',
    flags: ['🇺🇸','🇬🇧','🇩🇪','🇫🇷','🇯🇵','🇮🇳','🇧🇷','🇦🇺','🇨🇦','🇮🇹','🇪🇸','🇰🇷'],
    title: 'Single Global eSIM\nfor all your travels.',
    sub:   'Valid globally. No SIM-swaps needed. Ever.',
  },
  {
    id: 2,
    icon: '💼',
    flags: ['🇸🇬','🇦🇪','🇿🇦','🇲🇽','🇸🇪','🇨🇭','🇳🇱','🇵🇱','🇹🇷','🇺🇦','🇦🇷','🇹🇭'],
    title: 'Built for\nBusiness Teams.',
    sub:   'Manage eSIMs for your entire team from one dashboard.',
  },
  {
    id: 3,
    icon: '⚡',
    flags: ['🇵🇹','🇳🇴','🇩🇰','🇫🇮','🇨🇿','🇭🇺','🇷🇴','🇬🇷','🇮🇱','🇵🇭','🇮🇩','🇲🇾'],
    title: 'Instant Activation.\nZero Hassle.',
    sub:   'Get connected in seconds. No physical SIM required.',
  },
  {
    id: 4,
    icon: '💰',
    flags: ['🇻🇳','🇧🇩','🇵🇰','🇱🇰','🇳🇬','🇰🇪','🇬🇭','🇪🇬','🇲🇦','🇨🇱','🇨🇴','🇵🇪'],
    title: 'Transparent Pricing.\nNo Surprises.',
    sub:   'Pay only for what you use. Cancel anytime.',
  },
];

// ── Floating flag positions (fixed x/y offsets around center) ─────────────────
const FLAG_POSITIONS = [
  { x: -0.38, y: -0.28 },
  { x:  0.10, y: -0.38 },
  { x:  0.35, y: -0.22 },
  { x:  0.40, y:  0.05 },
  { x:  0.30, y:  0.30 },
  { x:  0.05, y:  0.40 },
  { x: -0.30, y:  0.32 },
  { x: -0.42, y:  0.08 },
  { x: -0.18, y:  0.38 },
  { x:  0.20, y: -0.10 },
  { x: -0.25, y: -0.10 },
  { x:  0.00, y:  0.15 },
];

// ── Single floating flag ───────────────────────────────────────────────────────
function FloatingFlag({ emoji, index }: { emoji: string; index: number }) {
  const anim  = useRef(new Animated.Value(0)).current;
  const delay = index * 120;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 2200 + index * 180, delay, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 2200 + index * 180,            useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -10] });
  const scale      = anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.08, 1] });

  const pos = FLAG_POSITIONS[index % FLAG_POSITIONS.length];
  const ORBIT_W = width * 0.78;
  const ORBIT_H = height * 0.36;

  return (
    <Animated.View
      style={[
        styles.flag,
        {
          left: ORBIT_W / 2 + pos.x * ORBIT_W,
          top:  ORBIT_H / 2 + pos.y * ORBIT_H,
          transform: [{ translateY }, { scale }],
        },
      ]}
    >
      <Text style={styles.flagEmoji}>{emoji}</Text>
    </Animated.View>
  );
}

// ── Slide visual (flags + icon) ───────────────────────────────────────────────
function SlideVisual({ slide, visible }: { slide: typeof SLIDES[0]; visible: boolean }) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!visible) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.06, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1.00, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [visible]);

  return (
    <View style={styles.visualContainer}>
      {slide.flags.map((f, i) => (
        <FloatingFlag key={i} emoji={f} index={i} />
      ))}
      {/* Center icon */}
      <Animated.View style={[styles.centerCircle, { transform: [{ scale: pulse }] }]}>
        <Text style={styles.centerIcon}>{slide.icon}</Text>
      </Animated.View>
    </View>
  );
}

// ── Main Onboarding ───────────────────────────────────────────────────────────
export default function OnboardingScreen() {
  const router      = useRouter();
  const [page, setPage] = useState(0);
  const scrollRef   = useRef<ScrollView>(null);
  const fadeAnim    = useRef(new Animated.Value(0)).current;
  const btnScale    = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  const goNext = () => {
    if (page < SLIDES.length - 1) {
      const next = page + 1;
      scrollRef.current?.scrollTo({ x: next * width, animated: true });
      setPage(next);
    } else {
      finish();
    }
  };

  const finish = async () => {
    await AsyncStorage.setItem('onboarding_done', 'true');
    router.replace('/');
  };

  const skip = async () => {
    await AsyncStorage.setItem('onboarding_done', 'true');
    router.replace('/');
  };

  const onPressIn  = () => Animated.spring(btnScale, { toValue: 0.95, useNativeDriver: true }).start();
  const onPressOut = () => Animated.spring(btnScale, { toValue: 1.00, useNativeDriver: true }).start();

  const isLast = page === SLIDES.length - 1;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      <Animated.View style={[styles.root, { opacity: fadeAnim }]}>

        {/* Skip */}
        <View style={styles.header}>
          <View />
          <TouchableOpacity onPress={skip} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>

        {/* Slides */}
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          scrollEnabled={false}
          showsHorizontalScrollIndicator={false}
          style={{ flex: 1 }}
        >
          {SLIDES.map((slide, i) => (
            <View key={slide.id} style={styles.slide}>
              <SlideVisual slide={slide} visible={page === i} />

              <View style={styles.textBlock}>
                <Text style={styles.title}>{slide.title}</Text>
                <Text style={styles.sub}>{slide.sub}</Text>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Bottom bar */}
        <View style={styles.bottomBar}>
          {/* Dots */}
          <View style={styles.dots}>
            {SLIDES.map((_, i) => (
              <Animated.View
                key={i}
                style={[
                  styles.dot,
                  i === page && styles.dotActive,
                ]}
              />
            ))}
          </View>

          {/* Button */}
          <Animated.View style={{ transform: [{ scale: btnScale }] }}>
            <TouchableOpacity
              style={[styles.btn, isLast && styles.btnLast]}
              activeOpacity={0.85}
              onPress={goNext}
              onPressIn={onPressIn}
              onPressOut={onPressOut}
            >
              <Text style={styles.btnText}>
                {isLast ? 'Get Started' : 'Next'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>

      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.bg,
  },
  root: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingTop: 12,
    paddingBottom: 4,
  },
  skipText: {
    fontSize: 15,
    color: C.muted,
    fontWeight: '500',
  },

  // Slide
  slide: {
    width,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Visual area
  visualContainer: {
    width:  width * 0.78,
    height: height * 0.36,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Floating flag
  flag: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: C.light,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  flagEmoji: {
    fontSize: 26,
  },

  // Center circle
  centerCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 10,
  },
  centerIcon: {
    fontSize: 46,
  },

  // Text
  textBlock: {
    alignItems: 'center',
    paddingHorizontal: 36,
    marginTop: 36,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: C.text,
    textAlign: 'center',
    lineHeight: 34,
    letterSpacing: -0.4,
  },
  sub: {
    fontSize: 14,
    color: C.muted,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 21,
  },

  // Bottom
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    paddingBottom: 32,
    paddingTop: 16,
  },

  // Dots
  dots: {
    flexDirection: 'row',
    gap: 7,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.faint,
  },
  dotActive: {
    width: 22,
    backgroundColor: C.primary,
    borderRadius: 4,
  },

  // Button
  btn: {
    backgroundColor: C.primary,
    paddingHorizontal: 44,
    paddingVertical: 16,
    borderRadius: 50,
  },
  btnLast: {
    paddingHorizontal: 36,
  },
  btnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});