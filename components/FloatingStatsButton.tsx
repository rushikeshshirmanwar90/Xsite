import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import { Animated, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import StatCard from './StatCard';

interface StatItem {
    icon: React.ComponentProps<typeof Ionicons>['name'];
    color: string;
    value: number | string;
    label: string;
}

interface FloatingStatsButtonProps {
    stats: StatItem[];
}

const FAB_SIZE = 56;
const CARD_WIDTH = 176;
const CARD_HEIGHT = 58;
const CARD_GAP = 8;
const FIRST_GAP = 16; // distance from the FAB's top edge to the nearest card's bottom edge

// Vertical-only stack — cards sit directly above the FAB, right-aligned with it,
// nearest-to-furthest. The connecting line provides the diagonal "arc" look instead.
const OFFSETS = [
    { x: 0, y: -(FAB_SIZE + FIRST_GAP) },
    { x: 0, y: -(FAB_SIZE + FIRST_GAP + (CARD_HEIGHT + CARD_GAP)) },
    { x: 0, y: -(FAB_SIZE + FIRST_GAP + 2 * (CARD_HEIGHT + CARD_GAP)) },
];

const DELAY_STEP = 0.16;
const ANIM_SPAN = 0.62;

// Connector geometry, in the coordinate space of the SVG overlay below.
const LINE_W = 216;
const LINE_H = FAB_SIZE + FIRST_GAP + 3 * (CARD_HEIGHT + CARD_GAP) + 10;
const FAB_CX = LINE_W - FAB_SIZE / 2;
const FAB_CY = LINE_H - FAB_SIZE / 2;

// Card bottom edges measured from the FAB's bottom edge (i.e. -OFFSETS[i].y), converted to
// "distance from top of overlay", then to a vertical center for the connector line.
const cardCenters = OFFSETS.map((offset) => {
    const bottomFromBase = -offset.y; // e.g. FAB_SIZE + FIRST_GAP for the nearest card
    const bottomY = LINE_H - bottomFromBase;
    const topY = bottomY - CARD_HEIGHT;
    return (bottomY + topY) / 2;
});
const NODE_Y = LINE_H - FAB_SIZE - FIRST_GAP / 2;

const CONNECTOR_PATH =
    `M${LINE_W - 56},${cardCenters[2]} ` +
    `C${LINE_W - 26},${cardCenters[2] + 30} ${LINE_W - 6},${cardCenters[1] - 30} ${LINE_W - 20},${cardCenters[1]} ` +
    `C${LINE_W - 46},${cardCenters[1] + 28} ${LINE_W - 16},${cardCenters[0] - 26} ${LINE_W - 26},${cardCenters[0]} ` +
    `C${LINE_W - 12},${cardCenters[0] + 18} ${FAB_CX},${NODE_Y - 14} ${FAB_CX},${NODE_Y} ` +
    `L${FAB_CX},${FAB_CY}`;

const FloatingStatsButton: React.FC<FloatingStatsButtonProps> = ({ stats }) => {
    const [open, setOpen] = useState(false);
    const progress = useRef(new Animated.Value(0)).current;

    const toggle = () => {
        const next = !open;
        setOpen(next);
        Animated.spring(progress, {
            toValue: next ? 1 : 0,
            useNativeDriver: true,
            friction: 7,
            tension: 55,
        }).start();
    };

    const rotate = progress.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '180deg'],
    });
    const chartIconOpacity = progress.interpolate({
        inputRange: [0, 0.4, 1],
        outputRange: [1, 0, 0],
        extrapolate: 'clamp',
    });
    const closeIconOpacity = progress.interpolate({
        inputRange: [0, 0.4, 1],
        outputRange: [0, 0, 1],
        extrapolate: 'clamp',
    });
    const lineOpacity = progress.interpolate({
        inputRange: [0, 0.25, 1],
        outputRange: [0, 0.4, 1],
        extrapolate: 'clamp',
    });

    return (
        <Animated.View style={styles.wrapper} pointerEvents="box-none">
            {/* Dotted connector line + node, drawn behind the cards and FAB */}
            <Animated.View
                style={[styles.connectorLayer, { opacity: lineOpacity }]}
                pointerEvents="none"
            >
                <Svg width={LINE_W} height={LINE_H}>
                    <Path
                        d={CONNECTOR_PATH}
                        stroke="#3B82F6"
                        strokeWidth={2}
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray="1,7"
                    />
                    <Circle
                        cx={FAB_CX}
                        cy={NODE_Y}
                        r={5}
                        fill="#FFFFFF"
                        stroke="#3B82F6"
                        strokeWidth={3}
                    />
                </Svg>
            </Animated.View>

            {stats.slice(0, OFFSETS.length).map((stat, index) => {
                // Cards nearest the button start animating first (cascading outward).
                const staggerIndex = OFFSETS.length - 1 - index;
                const start = Math.min(staggerIndex * DELAY_STEP, 1 - ANIM_SPAN);
                const end = start + ANIM_SPAN;
                const offset = OFFSETS[staggerIndex];

                const cardOpacity = progress.interpolate({
                    inputRange: [start, end],
                    outputRange: [0, 1],
                    extrapolate: 'clamp',
                });
                const translateX = progress.interpolate({
                    inputRange: [start, end],
                    outputRange: [0, offset.x],
                    extrapolate: 'clamp',
                });
                const translateY = progress.interpolate({
                    inputRange: [start, end],
                    outputRange: [0, offset.y],
                    extrapolate: 'clamp',
                });
                const scale = progress.interpolate({
                    inputRange: [start, end],
                    outputRange: [0.35, 1],
                    extrapolate: 'clamp',
                });

                return (
                    <Animated.View
                        key={stat.label}
                        pointerEvents={open ? 'auto' : 'none'}
                        style={[
                            styles.cardSlot,
                            {
                                opacity: cardOpacity,
                                transform: [{ translateX }, { translateY }, { scale }],
                            },
                        ]}
                    >
                        <StatCard icon={stat.icon} color={stat.color} value={stat.value} label={stat.label} style={styles.card} />
                    </Animated.View>
                );
            })}

            <TouchableOpacity style={styles.fab} onPress={toggle} activeOpacity={0.85}>
                <Animated.View style={[styles.iconRotateWrap, { transform: [{ rotate }] }]}>
                    <Animated.View style={[styles.iconLayer, { opacity: chartIconOpacity }]}>
                        <Ionicons name="stats-chart" size={22} color="#FFFFFF" />
                    </Animated.View>
                    <Animated.View style={[styles.iconLayer, { opacity: closeIconOpacity }]}>
                        <Ionicons name="close" size={24} color="#FFFFFF" />
                    </Animated.View>
                </Animated.View>
            </TouchableOpacity>
        </Animated.View>
    );
};

export default FloatingStatsButton;

const styles = StyleSheet.create({
    wrapper: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 56,
        height: 56,
        alignItems: 'flex-end',
        zIndex: 50,
        elevation: 50,
    },
    connectorLayer: {
        position: 'absolute',
        right: 0,
        bottom: 0,
        width: LINE_W,
        height: LINE_H,
    },
    fab: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#3B82F6',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
        elevation: 10,
    },
    iconRotateWrap: {
        width: 24,
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconLayer: {
        position: 'absolute',
        width: 24,
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardSlot: {
        position: 'absolute',
        right: 0,
        bottom: 0,
    },
    card: {
        width: CARD_WIDTH,
    },
});
