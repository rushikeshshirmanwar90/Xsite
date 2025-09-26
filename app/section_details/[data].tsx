import { PieChartColors20 } from '@/components/PieChart';
import { materials } from '@/data/analytics';
import { PieSliceData } from '@/types/analytics';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    Easing,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, {
    Defs,
    FeGaussianBlur,
    Filter,
    G,
    LinearGradient,
    Path,
    Stop,
    Text as SvgText
} from 'react-native-svg';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedSvgText = Animated.createAnimatedComponent(SvgText);

const ProjectDetails: React.FC = () => {
    const [selectedSlice, setSelectedSlice] = useState<string | null>(null);
    const [hoveredSlice, setHoveredSlice] = useState<string | null>(null);
    const animatedValues = useRef<{ [key: string]: Animated.Value }>({}).current;
    const scaleAnimations = useRef<{ [key: string]: Animated.Value }>({}).current;
    const rotationAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    const colors = PieChartColors20;

    // Utility functions
    const formatCurrency = (amount: number): string => {
        if (amount >= 10000000) {
            return `₹${(amount / 10000000).toFixed(1)}Cr`;
        } else if (amount >= 100000) {
            return `₹${(amount / 100000).toFixed(1)}L`;
        } else if (amount >= 1000) {
            return `₹${(amount / 1000).toFixed(1)}K`;
        }
        return `₹${amount}`;
    };

    // Calculate total material cost from materials data
    const totalMaterialCost = materials.reduce(
        (sum, material) => sum + material.totalPrice,
        0
    );

    // Calculate wasted material (10% of quantity)
    const getQuantityWasted = (materialId: string): number => {
        const material = materials.find(m => m.id === materialId);
        if (!material) return 0;
        return material.quantity * 0.1; // 10% wastage
    };

    // Calculate wasted material cost
    const getWastedCost = (materialId: string): number => {
        const material = materials.find(m => m.id === materialId);
        if (!material) return 0;
        const wastedQuantity = getQuantityWasted(materialId);
        return wastedQuantity * material.unitPrice;
    };

    // Debug log for material cost validation
    console.log('Material Cost Validation:', {
        materials: materials.map(m => ({
            name: m.name,
            totalPrice: m.totalPrice
        })),
        totalMaterialCost
    });

    // Initialize animations
    useEffect(() => {
        // Entry animation
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.timing(rotationAnim, {
                toValue: 1,
                duration: 1200,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const { width, height } = Dimensions.get('window');
    const size = Math.min(width - 60, height * 0.4);
    const center = size / 2;
    const outerRadius = size / 2 - 30;
    const innerRadius = outerRadius * 0.55; // Slightly smaller donut hole

    // Prepare enhanced data for pie chart
    const pieData: PieSliceData[] = materials.map((material, index) => {
        const value = material.totalPrice;
        const percentage = ((value / totalMaterialCost) * 100).toFixed(1);

        if (!animatedValues[material.id]) {
            animatedValues[material.id] = new Animated.Value(0);
            // Staggered animation for each slice
            Animated.timing(animatedValues[material.id], {
                toValue: 1,
                duration: 800,
                delay: index * 150,
                easing: Easing.out(Easing.back(1.5)),
                useNativeDriver: true,
            }).start();
        }

        if (!scaleAnimations[material.id]) {
            scaleAnimations[material.id] = new Animated.Value(1);
        }

        return {
            key: material.id,
            value: value,
            svg: {
                fill: colors[index % colors.length].primary,
                gradientId: `gradient_${material.id}`,
            },
            name: material.name,
            formattedBudget: formatCurrency(value),
            percentage: percentage,
        };
    });

    // Responsive font size for pie chart labels (smaller, less aggressive scaling)
    const pieLabelFontSize = Math.max(10, Math.round(size * 0.045));

    // Enhanced slice calculation with perfect alignment
    const calculatePieSlices = () => {
        let cumulativeAngle = -Math.PI / 2; // Start from top
        return pieData.map((item, index) => {
            const angle = (item.value / totalMaterialCost) * 2 * Math.PI;
            const startAngle = cumulativeAngle;
            const endAngle = cumulativeAngle + angle;
            cumulativeAngle = endAngle;

            // Add small gap between slices
            const gap = 0.015; // Smaller gap for better visual
            const adjustedStartAngle = startAngle + gap / 2;
            const adjustedEndAngle = endAngle - gap / 2;

            const largeArcFlag = (adjustedEndAngle - adjustedStartAngle) > Math.PI ? 1 : 0;

            // Calculate path with hover effect consideration
            const calculatePath = (radiusMultiplier = 1, offsetX = 0, offsetY = 0) => {
                const adjustedOuterRadius = outerRadius * radiusMultiplier;
                const adjustedInnerRadius = innerRadius * radiusMultiplier;
                const adjustedCenter = { x: center + offsetX, y: center + offsetY };

                const x1 = adjustedCenter.x + adjustedOuterRadius * Math.cos(adjustedStartAngle);
                const y1 = adjustedCenter.y + adjustedOuterRadius * Math.sin(adjustedStartAngle);
                const x2 = adjustedCenter.x + adjustedOuterRadius * Math.cos(adjustedEndAngle);
                const y2 = adjustedCenter.y + adjustedOuterRadius * Math.sin(adjustedEndAngle);

                const x3 = adjustedCenter.x + adjustedInnerRadius * Math.cos(adjustedEndAngle);
                const y3 = adjustedCenter.y + adjustedInnerRadius * Math.sin(adjustedEndAngle);
                const x4 = adjustedCenter.x + adjustedInnerRadius * Math.cos(adjustedStartAngle);
                const y4 = adjustedCenter.y + adjustedInnerRadius * Math.sin(adjustedStartAngle);

                return [
                    `M ${x1} ${y1}`,
                    `A ${adjustedOuterRadius} ${adjustedOuterRadius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                    `L ${x3} ${y3}`,
                    `A ${adjustedInnerRadius} ${adjustedInnerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4}`,
                    'Z',
                ].join(' ');
            };

            // Calculate label position - perfect center of the slice arc
            const midAngle = (startAngle + endAngle) / 2;
            const labelRadius = (outerRadius + innerRadius) / 2;
            const labelX = center + labelRadius * Math.cos(midAngle);
            const labelY = center + labelRadius * Math.sin(midAngle) + 3; // Small offset for visual centering

            // Calculate hover offset for explosion effect
            const hoverOffset = {
                x: Math.cos(midAngle) * 8,
                y: Math.sin(midAngle) * 8,
            };

            return {
                ...item,
                pathData: calculatePath(),
                hoveredPathData: calculatePath(1, hoverOffset.x, hoverOffset.y),
                startAngle: adjustedStartAngle,
                endAngle: adjustedEndAngle,
                midAngle,
                labelX,
                labelY,
            };
        });
    };

    const slices = calculatePieSlices();

    const handleSlicePress = (materialId: string, materialName: string) => {
        // Enhanced animation with spring effect
        Animated.sequence([
            Animated.spring(scaleAnimations[materialId], {
                toValue: 1.1,
                friction: 3,
                tension: 40,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnimations[materialId], {
                toValue: 1,
                friction: 3,
                tension: 40,
                useNativeDriver: true,
            }),
        ]).start();

        setSelectedSlice(selectedSlice === materialId ? null : materialId);

        console.log('Material selected:', materialName);
    };

    const { data } = useLocalSearchParams();
    const info = JSON.parse(Array.isArray(data) ? data[0] ?? '' : data ?? '');

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <SafeAreaView>

                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <TouchableOpacity onPress={() => { router.back() }} style={styles.backButton} activeOpacity={0.7}>
                            <Ionicons name="arrow-back" size={24} color="#000" />
                        </TouchableOpacity>
                        <View style={styles.projectInfo}>
                            <Text style={styles.projectName}>{info.sectionName}</Text>
                        </View>
                    </View>
                </View>


                <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
                    <View style={styles.heading}>
                        <Text style={styles.title}>{info.sectionName}</Text>
                        <Text style={styles.subtitle}>Financial Overview</Text>
                    </View>

                    <View style={styles.chartContainer}>
                        <Svg width={size} height={size}>
                            <Defs>

                                {slices.map((slice, index) => (
                                    <LinearGradient
                                        key={slice.svg.gradientId}
                                        id={slice.svg.gradientId}
                                        x1="0%"
                                        y1="0%"
                                        x2="100%"
                                        y2="100%"
                                    >
                                        <Stop offset="0%" stopColor={colors[index % colors.length].primary} />
                                        <Stop offset="100%" stopColor={colors[index % colors.length].secondary} />
                                    </LinearGradient>
                                ))}
                                {/* Shadow filter */}
                                <Filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                                    <FeGaussianBlur in="SourceAlpha" stdDeviation="2" />
                                </Filter>
                            </Defs>
                            <G>
                                {slices.map((slice) => (
                                    <G key={slice.key}>
                                        {/* Shadow layer */}
                                        <Path
                                            d={slice.pathData}
                                            fill="rgba(0,0,0,0.08)"
                                            transform="translate(1, 2)"
                                        />
                                        {/* Main slice */}
                                        <AnimatedPath
                                            d={hoveredSlice === slice.key ? slice.hoveredPathData : slice.pathData}
                                            fill={slice.svg.fill}
                                            stroke="#FFFFFF"
                                            strokeWidth="3"
                                            onPress={() => handleSlicePress(slice.key, slice.name)}
                                            opacity={animatedValues[slice.key]}
                                        />
                                    </G>
                                ))}

                                {slices.map((slice) => (
                                    <G key={`label-${slice.key}`}>
                                        <AnimatedSvgText
                                            x={slice.labelX}
                                            y={slice.labelY}
                                            fill="white"
                                            fontSize={pieLabelFontSize}
                                            fontWeight="bold"
                                            textAnchor="middle"
                                            alignmentBaseline="middle"
                                            opacity={animatedValues[slice.key]}
                                            onPress={() => handleSlicePress(slice.key, slice.name)}
                                        >
                                            {slice.formattedBudget}
                                        </AnimatedSvgText>
                                    </G>
                                ))}
                            </G>
                        </Svg>

                        {/* Enhanced center content */}
                        <View style={styles.centerContent}>
                            <Text style={styles.centerLabel}>TOTAL COST</Text>
                            <Text style={styles.centerValue}>{formatCurrency(totalMaterialCost)}</Text>
                        </View>
                    </View>

                    {/* Enhanced Legend */}
                    <View style={styles.legendContainer}>
                        {pieData.map((item, index) => {
                            const material = materials.find(m => m.id === item.key);
                            const isSelected = selectedSlice === item.key;

                            return (
                                <TouchableOpacity
                                    key={item.key}
                                    style={[
                                        styles.legendItem,
                                        isSelected && styles.legendItemSelected,
                                    ]}
                                    onPress={() => handleSlicePress(item.key, item.name)}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.legendLeft}>
                                        <View
                                            style={[
                                                styles.legendDot,
                                                {
                                                    backgroundColor: colors[index % colors.length].primary,
                                                    borderColor: colors[index % colors.length].secondary,
                                                },
                                            ]}
                                        />
                                        <View style={styles.legendTextContainer}>
                                            <View style={styles.legendTitleRow}>
                                                <Text style={styles.legendTitle}>{item.name}</Text>
                                            </View>
                                            <Text style={styles.legendSubtitle}>
                                                <Text style={{ fontWeight: 'bold', fontSize: 15 }} > {item.formattedBudget} </Text>  • <Text style={{ fontWeight: 'semibold', fontSize: 15 }} > {item.percentage}% </Text>
                                            </Text>
                                            {material?.description && (
                                                <Text style={styles.legendDescription}>{material.description}</Text>
                                            )}
                                            {/* Wasted Material Information */}
                                            <View style={styles.wastedInfoContainer}>
                                                <Text style={styles.wastedLabel}>
                                                    Wasted: <Text style={styles.wastedValue}>{getQuantityWasted(item.key).toFixed(1)} {material?.unit}</Text>
                                                </Text>
                                                <Text style={styles.wastedCostLabel}>
                                                    Cost: <Text style={styles.wastedCostValue}>{formatCurrency(getWastedCost(item.key))}</Text>
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                    <View style={styles.legendRight}>
                                        <Text style={styles.arrowIcon}>›</Text>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </Animated.View>
            </SafeAreaView>
        </ScrollView>
    );
};

export default ProjectDetails;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F0F3F7',
    },
    card: {
        backgroundColor: '#FFFFFF',
        margin: 20,
        borderRadius: 24,
        padding: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.08,
        shadowRadius: 25,
        elevation: 12,
    },
    heading: {
        alignItems: 'center',
        marginBottom: 30,
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#2C3E50',
        letterSpacing: 3,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#95A5A6',
        fontWeight: '500',
    },
    chartContainer: {
        alignItems: 'center',
        marginVertical: 20,
        position: 'relative',
    },
    centerContent: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: [{ translateX: -75 }, { translateY: -35 }],
        alignItems: 'center',
        width: 150,
    },
    centerLabel: {
        fontSize: 12,
        color: '#95A5A6',
        fontWeight: '600',
        textAlign: 'center',
        letterSpacing: 1,
        marginBottom: 5,
    },
    centerValue: {
        fontSize: 25,
        fontWeight: 'bold',
        color: '#2C3E50',
        textAlign: 'center',
        marginBottom: 8,
    },
    centerProjects: {
        fontSize: 14,
        color: '#7F8C8D',
        fontWeight: '500',
    },
    legendContainer: {
        marginTop: 30,
    },
    legendItem: {
        marginBottom: 16,
        backgroundColor: '#FAFBFC',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#E8ECEF',
    },
    legendItemSelected: {
        backgroundColor: '#F0F7FF',
        borderColor: '#5DADE2',
    },
    legendLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    legendDot: {
        width: 14,
        height: 14,
        borderRadius: 7,
        marginRight: 16,
        borderWidth: 2,
    },
    legendTextContainer: {
        flex: 1,
    },
    legendTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    legendTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2C3E50',
        marginRight: 8,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    statusText: {
        fontSize: 10,
        color: '#FFFFFF',
        fontWeight: '600',
    },
    legendSubtitle: {
        fontSize: 14,
        color: '#7F8C8D',
        marginBottom: 4,
    },
    legendDescription: {
        fontSize: 12,
        color: '#95A5A6',
        fontStyle: 'italic',
    },
    legendRight: {
        marginLeft: 10,
    },
    arrowIcon: {
        fontSize: 24,
        color: '#BDC3C7',
    },
    statsSection: {
        marginTop: 5,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    statBox: {
        backgroundColor: '#FFFFFF',
        padding: 8,
        borderRadius: 16,
        alignItems: 'center',
        flex: 1,
        marginHorizontal: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.06,
        shadowRadius: 15,
        elevation: 6,
    },
    statBoxPrimary: {
        borderWidth: 3,
        borderColor: '#5DADE2',
    },
    statBoxSecondary: {
        borderWidth: 3,
        borderColor: '#EC7063',
    },
    statBoxTertiary: {
        borderWidth: 3,
        borderColor: '#F39C12',
    },
    statIcon: {
        marginBottom: 8,
    },
    statEmoji: {
        fontSize: 24,
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2C3E50',
        marginBottom: 6,
    },
    statLabel: {
        fontSize: 11,
        color: '#95A5A6',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        textAlign: 'center',
    },
    insightsCard: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: 20,
        marginBottom: 30,
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.06,
        shadowRadius: 15,
        elevation: 6,
    },
    insightsTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#2C3E50',
        marginBottom: 16,
    },
    insightItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F3F7',
    },
    insightLabel: {
        fontSize: 14,
        color: '#7F8C8D',
        fontWeight: '500',
    },
    insightValue: {
        fontSize: 14,
        color: '#2C3E50',
        fontWeight: '600',
    },

    header: {
        alignItems: 'center',
        backgroundColor: "#fff",
        height: 60
    },

    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    backButton: {
        padding: 8,
        marginRight: 12,
    },
    projectInfo: {
        flex: 1,
    },
    projectName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#000',
        marginBottom: 2,
    },
    // Wasted material styles
    wastedInfoContainer: {
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#E8ECEF',
    },
    wastedLabel: {
        fontSize: 12,
        color: '#7F8C8D',
        marginBottom: 2,
    },
    wastedValue: {
        fontSize: 12,
        color: '#E74C3C',
        fontWeight: '600',
    },
    wastedCostLabel: {
        fontSize: 12,
        color: '#7F8C8D',
    },
    wastedCostValue: {
        fontSize: 12,
        color: '#E74C3C',
        fontWeight: '600',
    },
});