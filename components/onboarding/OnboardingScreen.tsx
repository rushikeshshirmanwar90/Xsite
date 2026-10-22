import { AUTH_FORM_MAX_WIDTH, AUTH_GUTTER, AuthButton, BlueprintBackdrop } from '@/components/auth/AuthUI';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
    AccessibilityInfo,
    Animated,
    FlatList,
    Image,
    NativeScrollEvent,
    NativeSyntheticEvent,
    Pressable,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    useWindowDimensions,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Three short pages, then straight to Log In. The logo stays put over the same
// drafting grid as the login screen while only the words slide, so the whole
// first run reads as one place. One colour: brand blue, on the main button and
// the current page dot.

interface Page {
    title: string;
    body: string;
    points: { icon: keyof typeof Ionicons.glyphMap; label: string }[];
}

const PAGES: Page[] = [
    {
        title: 'Every Site in One Place',
        body: 'Track projects, materials and daily work as it happens.',
        points: [
            { icon: 'business-outline', label: 'Projects and sections' },
            { icon: 'cube-outline', label: 'Material stock and usage' },
            { icon: 'hammer-outline', label: 'Labour and equipment' },
        ],
    },
    {
        title: 'Know Where the Money Goes',
        body: 'See every bill, payment and partner’s share.',
        points: [
            { icon: 'receipt-outline', label: 'Vendor and contractor payments' },
            { icon: 'alarm-outline', label: 'Payment reminders' },
            { icon: 'wallet-outline', label: 'Partner accounts' },
        ],
    },
    {
        title: 'Bring Your Team On Site',
        body: 'Add staff with a QR code and choose what each person can do.',
        points: [
            { icon: 'qr-code-outline', label: 'QR code invites' },
            { icon: 'shield-checkmark-outline', label: 'Roles and permissions' },
            { icon: 'notifications-outline', label: 'Live activity alerts' },
        ],
    },
];

const LOGO = require('@/assets/images/xsite-logo.png');
const LOGO_MAX = 220;
const LOGO_MIN = 88;
// Wordmark below the logo plus breathing room
const WORDMARK_SPACE = 56;
const DOT = 8;
const DOT_ACTIVE = 22;

interface OnboardingScreenProps {
    onComplete: () => void;
}

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
    const { width } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const pagerRef = useRef<FlatList<Page>>(null);
    const [scrollX] = useState(() => new Animated.Value(0));
    const [index, setIndex] = useState(0);
    const [reduceMotion, setReduceMotion] = useState(false);
    // Only very large accessibility text can outgrow the screen; scroll only then
    const [viewportHeight, setViewportHeight] = useState(0);
    const [contentHeight, setContentHeight] = useState(0);

    useEffect(() => {
        AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
        const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
        return () => sub.remove();
    }, []);

    // The logo gets whatever height the words and button leave over, so the
    // screen never has to scroll: up to 220pt on most phones, smaller only on
    // the smallest ones
    const [heroHeight, setHeroHeight] = useState(0);
    const logoSize = Math.round(Math.max(LOGO_MIN, Math.min(LOGO_MAX, heroHeight - WORDMARK_SPACE, width * 0.6)));

    const isLast = index === PAGES.length - 1;

    const goTo = (next: number) => {
        pagerRef.current?.scrollToOffset({ offset: next * width, animated: !reduceMotion });
        setIndex(next);
    };

    const handleContinue = () => {
        if (isLast) onComplete();
        else goTo(index + 1);
    };

    const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const next = Math.round(event.nativeEvent.contentOffset.x / width);
        if (next !== index && next >= 0 && next < PAGES.length) {
            setIndex(next);
            AccessibilityInfo.announceForAccessibility(`Page ${next + 1} of ${PAGES.length}: ${PAGES[next].title}`);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
            <BlueprintBackdrop />

            <ScrollView
                contentContainerStyle={[
                    styles.body,
                    { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 20) },
                ]}
                scrollEnabled={contentHeight > viewportHeight + 1}
                bounces={false}
                showsVerticalScrollIndicator={false}
                onLayout={(e) => setViewportHeight(e.nativeEvent.layout.height)}
                onContentSizeChange={(_, h) => setContentHeight(h)}
            >
                {/* Skip — keeps its space on the last page so nothing shifts */}
                <View style={styles.topBar}>
                    {!isLast && (
                        <Pressable
                            onPress={onComplete}
                            hitSlop={8}
                            style={({ pressed }) => [styles.skip, pressed && styles.skipPressed]}
                            accessibilityRole="button"
                            accessibilityLabel="Skip introduction"
                        >
                            <Text style={styles.skipText}>Skip</Text>
                        </Pressable>
                    )}
                </View>

                {/* The one signature element: the logo, large and still */}
                <View style={styles.hero} onLayout={(e) => setHeroHeight(e.nativeEvent.layout.height)}>
                    {heroHeight > 0 && (
                        <>
                            <Image
                                source={LOGO}
                                style={{ width: logoSize, height: logoSize }}
                                resizeMode="contain"
                                accessibilityIgnoresInvertColors
                                accessible
                                accessibilityLabel="Xsite"
                                accessibilityRole="image"
                            />
                            <Text style={styles.wordmark} accessibilityElementsHidden importantForAccessibility="no">
                                Xsite
                            </Text>
                        </>
                    )}
                </View>

                {/* Only the words slide */}
                <Animated.FlatList
                    ref={pagerRef}
                    data={PAGES}
                    keyExtractor={(item) => item.title}
                    horizontal
                    pagingEnabled
                    bounces={false}
                    showsHorizontalScrollIndicator={false}
                    getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
                    onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
                        useNativeDriver: false,
                    })}
                    scrollEventThrottle={16}
                    onMomentumScrollEnd={handleScrollEnd}
                    style={styles.pager}
                    renderItem={({ item, index: i }) => (
                        <View
                            style={[styles.page, { width }]}
                            accessibilityElementsHidden={i !== index}
                            importantForAccessibility={i === index ? 'auto' : 'no-hide-descendants'}
                        >
                            <View style={styles.pageInner}>
                                <Text style={styles.title} accessibilityRole="header">{item.title}</Text>
                                <Text style={styles.description}>{item.body}</Text>
                                <View style={styles.points}>
                                    {item.points.map((point) => (
                                        <View key={point.label} style={styles.point}>
                                            <Ionicons
                                                name={point.icon}
                                                size={20}
                                                color={Colors.primaryDark}
                                                accessibilityElementsHidden
                                                importantForAccessibility="no"
                                            />
                                            <Text style={styles.pointText}>{point.label}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        </View>
                    )}
                />

                <View style={styles.footer}>
                    {/* Page control: size, not just colour, marks the current page */}
                    <View
                        style={styles.dots}
                        accessible
                        accessibilityRole="text"
                        accessibilityLabel={`Page ${index + 1} of ${PAGES.length}`}
                    >
                        {PAGES.map((page, i) => {
                            const range = [(i - 1) * width, i * width, (i + 1) * width];
                            return (
                                <Animated.View
                                    key={page.title}
                                    style={[
                                        styles.dot,
                                        {
                                            width: scrollX.interpolate({
                                                inputRange: range,
                                                outputRange: [DOT, DOT_ACTIVE, DOT],
                                                extrapolate: 'clamp',
                                            }),
                                            backgroundColor: scrollX.interpolate({
                                                inputRange: range,
                                                outputRange: [Colors.border, Colors.primary, Colors.border],
                                                extrapolate: 'clamp',
                                            }),
                                        },
                                    ]}
                                />
                            );
                        })}
                    </View>

                    <AuthButton
                        title={isLast ? 'Get Started' : 'Continue'}
                        onPress={handleContinue}
                        style={styles.button}
                    />
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    body: {
        flexGrow: 1,
    },
    topBar: {
        height: 52,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingHorizontal: AUTH_GUTTER - 12,
    },
    skip: {
        minHeight: 44,
        minWidth: 64,
        paddingHorizontal: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 22,
    },
    skipPressed: {
        opacity: 0.5,
    },
    skipText: {
        fontSize: 17,
        fontWeight: '600',
        color: Colors.primaryDark,
    },
    // Sized by the space left over, never by the logo, so the logo can follow it
    hero: {
        flexGrow: 1,
        flexBasis: 0,
        minHeight: LOGO_MIN + WORDMARK_SPACE,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    wordmark: {
        marginTop: 4,
        fontSize: 22,
        fontWeight: '800',
        color: Colors.textPrimary,
        letterSpacing: -0.4,
    },
    pager: {
        flexGrow: 0,
    },
    page: {
        alignItems: 'center',
        paddingHorizontal: AUTH_GUTTER,
    },
    pageInner: {
        width: '100%',
        maxWidth: AUTH_FORM_MAX_WIDTH,
    },
    title: {
        fontSize: 28,
        lineHeight: 34,
        fontWeight: '800',
        color: Colors.textPrimary,
        letterSpacing: -0.6,
    },
    description: {
        marginTop: 8,
        fontSize: 17,
        lineHeight: 24,
        color: Colors.textSecondary,
    },
    points: {
        marginTop: 20,
        gap: 12,
    },
    point: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    pointText: {
        flex: 1,
        fontSize: 16,
        lineHeight: 22,
        fontWeight: '500',
        color: Colors.textPrimary,
    },
    footer: {
        alignItems: 'center',
        paddingHorizontal: AUTH_GUTTER,
        paddingTop: 28,
        gap: 20,
    },
    dots: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    dot: {
        height: DOT,
        borderRadius: DOT / 2,
    },
    button: {
        width: '100%',
        maxWidth: AUTH_FORM_MAX_WIDTH,
    },
});

export default OnboardingScreen;
