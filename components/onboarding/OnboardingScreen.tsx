import React, { useState, useRef, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Dimensions,
    StatusBar,
    Animated,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet } from 'react-native';

const { width, height } = Dimensions.get('window');

interface OnboardingSlide {
    id: number;
    title: string;
    subtitle: string;
    description: string;
    icon: keyof typeof Ionicons.glyphMap;
    backgroundColor: string;
    iconColor: string;
    accentColor: string;
    features: string[];
}

const onboardingData: OnboardingSlide[] = [
    {
        id: 1,
        title: "Welcome to Xsite",
        subtitle: "Construction Management Made Simple",
        description: "Your all-in-one solution for managing construction projects, tracking materials, and monitoring budgets in real-time.",
        icon: "construct-outline",
        backgroundColor: '#F0F4FF',
        iconColor: '#4F46E5',
        accentColor: '#6366F1',
        features: [
            "Manage multiple construction projects",
            "Real-time budget tracking",
            "Material and labor management",
            "Team collaboration tools"
        ]
    },
    {
        id: 2,
        title: "Smart Project Tracking",
        subtitle: "Stay on Top of Every Detail",
        description: "Organize projects into sections and mini-sections. Track materials from import to usage with comprehensive analytics.",
        icon: "analytics-outline",
        backgroundColor: '#FDF2F8',
        iconColor: '#EC4899',
        accentColor: '#F472B6',
        features: [
            "Hierarchical project structure",
            "Material import & usage tracking",
            "Visual budget analytics",
            "Progress monitoring"
        ]
    },
    {
        id: 3,
        title: "Team Management",
        subtitle: "Collaborate Seamlessly",
        description: "Assign staff to projects with QR code technology. Different access levels for admins and staff members.",
        icon: "people-outline",
        backgroundColor: '#F0FDFA',
        iconColor: '#14B8A6',
        accentColor: '#2DD4BF',
        features: [
            "QR code staff assignment",
            "Role-based access control",
            "Staff directory management",
            "Project team coordination"
        ]
    },
    {
        id: 4,
        title: "Financial Control",
        subtitle: "Budget Like a Pro",
        description: "Monitor expenses with interactive dashboards. Track labor costs, material expenses, and project profitability.",
        icon: "cash-outline",
        backgroundColor: '#F0FDF4',
        iconColor: '#22C55E',
        accentColor: '#4ADE80',
        features: [
            "Real-time expense tracking",
            "Interactive pie charts",
            "Budget vs actual analysis",
            "Cost optimization insights"
        ]
    },
    {
        id: 5,
        title: "Ready to Build?",
        subtitle: "Let's Get Started",
        description: "Join thousands of construction professionals who trust Xsite to manage their projects efficiently and profitably.",
        icon: "rocket-outline",
        backgroundColor: '#FFFBEB',
        iconColor: '#F59E0B',
        accentColor: '#FBBF24',
        features: [
            "Complete audit trail",
            "Mobile-first design",
            "Offline capabilities",
            "24/7 project access"
        ]
    }
];

interface OnboardingScreenProps {
    onComplete: () => void;
}

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollX = useRef(new Animated.Value(0)).current;
    const slidesRef = useRef<any>(null);

    const viewableItemsChanged = useRef(({ viewableItems }: any) => {
        setCurrentIndex(viewableItems[0]?.index || 0);
    }).current;

    const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

    const scrollTo = () => {
        if (currentIndex < onboardingData.length - 1) {
            slidesRef.current?.scrollToIndex({ index: currentIndex + 1 });
        } else {
            onComplete();
        }
    };

    const skipToEnd = () => {
        onComplete();
    };

    // Interpolate background color based on scroll position
    const animatedBackgroundColor = scrollX.interpolate({
        inputRange: onboardingData.map((_, i) => i * width),
        outputRange: onboardingData.map((item) => item.backgroundColor),
        extrapolate: 'clamp',
    });

    // Interpolate button color based on scroll position
    const animatedButtonColor = scrollX.interpolate({
        inputRange: onboardingData.map((_, i) => i * width),
        outputRange: onboardingData.map((item) => item.iconColor),
        extrapolate: 'clamp',
    });

    // Interpolate accent color for skip button
    const animatedAccentColor = scrollX.interpolate({
        inputRange: onboardingData.map((_, i) => i * width),
        outputRange: onboardingData.map((item) => item.accentColor),
        extrapolate: 'clamp',
    });

    // Content-only slide rendered inside the FlatList
    const ContentSlide = useCallback(({ item }: { item: OnboardingSlide }) => (
        <View style={styles.contentSlide}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Icon Container */}
                <View style={styles.iconContainer}>
                    <View style={[styles.iconBackground, { backgroundColor: '#FFFFFF', borderColor: item.iconColor }]}>
                        <Ionicons name={item.icon} size={80} color={item.iconColor} />
                    </View>
                </View>

                {/* Text Content */}
                <View style={styles.textContainer}>
                    <Text style={[styles.title, { color: item.iconColor }]}>{item.title}</Text>
                    <Text style={[styles.subtitle, { color: item.accentColor }]}>{item.subtitle}</Text>
                    <Text style={styles.description}>{item.description}</Text>

                    {/* Features List */}
                    <View style={styles.featuresContainer}>
                        {item.features.map((feature, index) => (
                            <View key={index} style={styles.featureItem}>
                                <View style={[styles.featureDot, { backgroundColor: item.iconColor }]} />
                                <Text style={styles.featureText}>{feature}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            </ScrollView>
        </View>
    ), []);

    return (
        <Animated.View style={[styles.container, { backgroundColor: animatedBackgroundColor }]}>
            <SafeAreaView style={styles.safeArea}>
                <StatusBar barStyle="dark-content" translucent />

                {/* Skip Button — fixed, not inside the FlatList */}
                {currentIndex < onboardingData.length - 1 && (
                    <Animated.View style={[styles.skipButtonWrapper, { backgroundColor: animatedAccentColor }]}>
                        <TouchableOpacity onPress={skipToEnd}>
                            <Text style={styles.skipText}>Skip</Text>
                        </TouchableOpacity>
                    </Animated.View>
                )}

                {/* Sliding content area */}
                <Animated.FlatList
                    ref={slidesRef}
                    data={onboardingData}
                    renderItem={({ item }) => <ContentSlide item={item} />}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    pagingEnabled
                    bounces={false}
                    keyExtractor={(item) => item.id.toString()}
                    onScroll={Animated.event(
                        [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                        { useNativeDriver: false }
                    )}
                    onViewableItemsChanged={viewableItemsChanged}
                    viewabilityConfig={viewConfig}
                    scrollEventThrottle={32}
                    style={styles.flatList}
                />

                {/* Bottom Section — fixed, not inside the FlatList */}
                <View style={styles.bottomSection}>
                    {/* Pagination Dots */}
                    <View style={styles.pagination}>
                        {onboardingData.map((_, index) => {
                            const dotWidth = scrollX.interpolate({
                                inputRange: [
                                    (index - 1) * width,
                                    index * width,
                                    (index + 1) * width,
                                ],
                                outputRange: [10, 30, 10],
                                extrapolate: 'clamp',
                            });

                            const dotOpacity = scrollX.interpolate({
                                inputRange: [
                                    (index - 1) * width,
                                    index * width,
                                    (index + 1) * width,
                                ],
                                outputRange: [0.3, 1, 0.3],
                                extrapolate: 'clamp',
                            });

                            return (
                                <Animated.View
                                    key={index}
                                    style={[
                                        styles.dot,
                                        {
                                            width: dotWidth,
                                            opacity: dotOpacity,
                                            backgroundColor: animatedButtonColor,
                                        },
                                    ]}
                                />
                            );
                        })}
                    </View>

                    {/* Next/Get Started Button */}
                    <TouchableOpacity
                        style={styles.nextButton}
                        onPress={scrollTo}
                        activeOpacity={0.8}
                    >
                        <Animated.View style={[styles.nextButtonInner, { backgroundColor: animatedButtonColor }]}>
                            <Text style={styles.nextButtonText}>
                                {currentIndex === onboardingData.length - 1 ? 'Get Started' : 'Next'}
                            </Text>
                            <Ionicons
                                name={currentIndex === onboardingData.length - 1 ? 'checkmark' : 'arrow-forward'}
                                size={24}
                                color="#FFFFFF"
                            />
                        </Animated.View>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    skipButtonWrapper: {
        position: 'absolute',
        top: 60,
        right: 20,
        zIndex: 10,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    skipText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    flatList: {
        flex: 1,
    },
    contentSlide: {
        width,
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 30,
        paddingTop: 70,
        paddingBottom: 20,
    },
    iconContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    iconBackground: {
        width: 160,
        height: 160,
        borderRadius: 80,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 8,
    },
    textContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 18,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 10,
    },
    description: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 20,
        paddingHorizontal: 10,
    },
    featuresContainer: {
        alignSelf: 'stretch',
        marginTop: 20,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        paddingHorizontal: 20,
        backgroundColor: '#FFFFFF',
        paddingVertical: 12,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    featureDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 12,
    },
    featureText: {
        fontSize: 14,
        color: '#374151',
        fontWeight: '500',
        flex: 1,
    },
    bottomSection: {
        alignItems: 'center',
        paddingHorizontal: 30,
        paddingBottom: 40,
        paddingTop: 20,
    },
    pagination: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    dot: {
        height: 10,
        borderRadius: 5,
        marginHorizontal: 6,
    },
    nextButton: {
        width: '100%',
        maxWidth: 280,
    },
    nextButtonInner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 30,
        gap: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
    },
    nextButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
    },
});

export default OnboardingScreen;