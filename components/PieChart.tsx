// 20-color palette for pie chart slices
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, View, Text } from 'react-native';
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

export const PieChartColors20 = [
    { primary: '#5DADE2', secondary: '#3498DB' }, // blue
    { primary: '#EC7063', secondary: '#E74C3C' }, // red
    { primary: '#F39C12', secondary: '#F1C40F' }, // yellow
    { primary: '#58D68D', secondary: '#28B463' }, // green
    { primary: '#AF7AC5', secondary: '#8E44AD' }, // purple
    { primary: '#48C9B0', secondary: '#16A085' }, // teal
    { primary: '#F5B041', secondary: '#DC7633' }, // orange
    { primary: '#AAB7B8', secondary: '#566573' }, // gray
    { primary: '#F1948A', secondary: '#C0392B' }, // pink-red
    { primary: '#BB8FCE', secondary: '#6C3483' }, // lavender
    { primary: '#73C6B6', secondary: '#117864' }, // aqua
    { primary: '#F7DC6F', secondary: '#B7950B' }, // gold
    { primary: '#85929E', secondary: '#34495E' }, // blue-gray
    { primary: '#E59866', secondary: '#CA6F1E' }, // brown-orange
    { primary: '#D7BDE2', secondary: '#512E5F' }, // light purple
    { primary: '#A3E4D7', secondary: '#148F77' }, // light teal
    { primary: '#FAD7A0', secondary: '#B9770E' }, // light gold
    { primary: '#F9E79F', secondary: '#7D6608' }, // pale yellow
    { primary: '#D5F5E3', secondary: '#196F3D' }, // mint
    { primary: '#FDEBD0', secondary: '#7E5109' }, // cream
];

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedSvgText = Animated.createAnimatedComponent(SvgText);

export interface PieSliceData {
    key: string;
    value: number;
    svg: {
        fill: string;
        gradientId: string;
    };
    name: string;
    formattedBudget: string;
    percentage?: string;
    description?: string;
}

interface PieChartProps {
    data: PieSliceData[];
    colors?: { primary: string; secondary: string }[];
    onSlicePress?: (key: string, name: string) => void;
    labelType?: 'amount' | 'percentage';
    size?: number;
    centerContent?: {
        label: string;
        value: string;
        subtitle?: string;
    };
    enableHover?: boolean;
    enableAnimation?: boolean;
}

const PieChart: React.FC<PieChartProps> = ({
    data,
    colors = PieChartColors20,
    onSlicePress,
    labelType = 'amount',
    size: customSize,
    centerContent,
    enableHover = true,
    enableAnimation = true
}) => {
    const [hoveredSlice, setHoveredSlice] = useState<string | null>(null);
    const animatedValues = useRef<{ [key: string]: Animated.Value }>({}).current;
    const scaleAnimations = useRef<{ [key: string]: Animated.Value }>({}).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const rotationAnim = useRef(new Animated.Value(0)).current;

    // Responsive sizing
    const { width, height } = Dimensions.get('window');
    const size = customSize || Math.min(width - 60, height * 0.4);
    const center = size / 2;
    const outerRadius = size / 2 - 30;
    const innerRadius = outerRadius * 0.55;
    const pieLabelFontSize = Math.max(10, Math.round(size * 0.045));

    // Calculate total value
    const total = data.reduce((sum, d) => sum + d.value, 0);

    // Initialize animations
    useEffect(() => {
        if (!enableAnimation) return;

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

        // Staggered animation for each slice
        data.forEach((item, index) => {
            if (!animatedValues[item.key]) {
                animatedValues[item.key] = new Animated.Value(0);
                Animated.timing(animatedValues[item.key], {
                    toValue: 1,
                    duration: 800,
                    delay: index * 150,
                    easing: Easing.out(Easing.back(1.5)),
                    useNativeDriver: true,
                }).start();
            }
            if (!scaleAnimations[item.key]) {
                scaleAnimations[item.key] = new Animated.Value(1);
            }
        });
    }, [data, enableAnimation]);

    // Enhanced slice calculation with perfect alignment
    const calculatePieSlices = () => {
        let cumulativeAngle = -Math.PI / 2; // Start from top
        return data.map((item) => {
            const angle = (item.value / total) * 2 * Math.PI;
            const startAngle = cumulativeAngle;
            const endAngle = cumulativeAngle + angle;
            cumulativeAngle = endAngle;

            // Add small gap between slices
            const gap = 0.015;
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
            const labelY = center + labelRadius * Math.sin(midAngle) + 3;

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

    const handleSlicePress = (key: string, name: string) => {
        // Enhanced animation with spring effect
        if (enableAnimation && scaleAnimations[key]) {
            Animated.sequence([
                Animated.spring(scaleAnimations[key], {
                    toValue: 1.1,
                    friction: 3,
                    tension: 40,
                    useNativeDriver: true,
                }),
                Animated.spring(scaleAnimations[key], {
                    toValue: 1,
                    friction: 3,
                    tension: 40,
                    useNativeDriver: true,
                }),
            ]).start();
        }

        if (onSlicePress) {
            onSlicePress(key, name);
        }
    };

    return (
        <Animated.View style={{ opacity: fadeAnim }}>
            <Svg width={size} height={size}>
                <Defs>
                    {/* Gradients for each slice */}
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
                                d={enableHover && hoveredSlice === slice.key ? slice.hoveredPathData : slice.pathData}
                                fill={slice.svg.fill}
                                stroke="#FFFFFF"
                                strokeWidth="3"
                                onPress={() => handleSlicePress(slice.key, slice.name)}
                                opacity={animatedValues[slice.key] || 1}
                            />
                        </G>
                    ))}
                    {/* Render amount labels on top layer for better visibility */}
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
                                opacity={animatedValues[slice.key] || 1}
                                onPress={() => handleSlicePress(slice.key, slice.name)}
                            >
                                {labelType === 'amount' ? slice.formattedBudget : (slice.percentage || '') + '%'}
                            </AnimatedSvgText>
                        </G>
                    ))}
                </G>
            </Svg>
            
            {/* Enhanced center content */}
            {centerContent && (
                <View style={{
                    position: 'absolute',
                    top: center - 40,
                    left: center - 60,
                    width: 120,
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <Text style={{ fontSize: 10, color: '#666', fontWeight: '600' }}>
                        {centerContent.label}
                    </Text>
                    <Text style={{ fontSize: 16, color: '#2C3E50', fontWeight: 'bold', marginVertical: 2 }}>
                        {centerContent.value}
                    </Text>
                    {centerContent.subtitle && (
                        <Text style={{ fontSize: 10, color: '#666' }}>
                            {centerContent.subtitle}
                        </Text>
                    )}
                </View>
            )}
        </Animated.View>
    );
};

export default PieChart;