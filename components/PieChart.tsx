import React from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

const { width } = Dimensions.get('window');

interface PieChartData {
    value: number;
    color: string;
    label: string;
    id: string;
}

interface Props {
    data: PieChartData[];
    size?: number;
    onSegmentPress?: (id: string) => void;
    centerText?: string;
    centerValue?: string;
}

export default function PieChart({
    data,
    size = width * 0.7,
    onSegmentPress,
    centerText,
    centerValue
}: Props) {
    const radius = size / 2 - 20;
    const strokeWidth = 30;
    const innerRadius = radius - strokeWidth;
    const circumference = 2 * Math.PI * radius;

    const total = data.reduce((sum, item) => sum + item.value, 0);

    let currentAngle = 0;

    return (
        <View style={styles.container}>
            <View style={[styles.chartContainer, { width: size, height: size }]}>
                <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                    <G rotation="0" originX={size / 2} originY={size / 2}>
                        {data.map((item, index) => {
                            const percentage = (item.value / total) * 100;
                            const strokeDasharray = (percentage / 100) * circumference;
                            const strokeDashoffset = circumference - strokeDasharray;

                            const angle = (item.value / total) * 360;
                            const rotation = currentAngle - 90;
                            currentAngle += angle;

                            return (
                                <TouchableOpacity
                                    key={item.id}
                                    onPress={() => onSegmentPress?.(item.id)}
                                    activeOpacity={0.7}
                                >
                                    <Circle
                                        cx={size / 2}
                                        cy={size / 2}
                                        r={radius}
                                        stroke={item.color}
                                        strokeWidth={strokeWidth}
                                        strokeDasharray={`${strokeDasharray} ${circumference}`}
                                        strokeDashoffset={strokeDashoffset}
                                        fill="transparent"
                                        strokeLinecap="round"
                                        transform={`rotate(${rotation} ${size / 2} ${size / 2})`}
                                    />
                                </TouchableOpacity>
                            );
                        })}
                    </G>
                </Svg>

                {/* Center Text */}
                {(centerText || centerValue) && (
                    <View style={styles.centerTextContainer}>
                        {centerValue && (
                            <Text style={styles.centerValue}>{centerValue}</Text>
                        )}
                        {centerText && (
                            <Text style={styles.centerText}>{centerText}</Text>
                        )}
                    </View>
                )}
            </View>

            {/* Legend */}
            <View style={styles.legend}>
                {data.map((item) => (
                    <TouchableOpacity
                        key={item.id}
                        style={styles.legendItem}
                        onPress={() => onSegmentPress?.(item.id)}
                    >
                        <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                        <Text style={styles.legendText}>{item.label}</Text>
                        <Text style={styles.legendValue}>
                            {((item.value / total) * 100).toFixed(1)}%
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
    },
    chartContainer: {
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
    },
    centerTextContainer: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
    },
    centerValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
    },
    centerText: {
        fontSize: 14,
        color: '#ccc',
        textAlign: 'center',
        marginTop: 4,
    },
    legend: {
        marginTop: 20,
        width: '100%',
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    legendColor: {
        width: 16,
        height: 16,
        borderRadius: 8,
        marginRight: 12,
    },
    legendText: {
        flex: 1,
        fontSize: 16,
        color: '#fff',
    },
    legendValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#4CAF50',
    },
});