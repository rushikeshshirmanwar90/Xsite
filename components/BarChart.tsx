import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface BarChartData {
    id: string;
    label: string;
    value: number;
    maxValue: number;
    color: string;
    status?: string;
}

interface Props {
    data: BarChartData[];
    onBarPress?: (id: string) => void;
    title?: string;
}

export default function BarChart({ data, onBarPress, title }: Props) {
    const maxValue = Math.max(...data.map(item => item.maxValue));

    return (
        <View style={styles.container}>
            {title && <Text style={styles.title}>{title}</Text>}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.chartContainer}>
                    {data.map((item, index) => {
                        const heightPercentage = (item.value / maxValue) * 100;
                        const maxHeightPercentage = (item.maxValue / maxValue) * 100;

                        return (
                            <TouchableOpacity
                                key={item.id}
                                style={styles.barContainer}
                                onPress={() => onBarPress?.(item.id)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.barWrapper}>
                                    {/* Background bar (total budget) */}
                                    <View
                                        style={[
                                            styles.backgroundBar,
                                            {
                                                height: `${maxHeightPercentage}%`,
                                                backgroundColor: item.color + '30',
                                            },
                                        ]}
                                    />
                                    {/* Foreground bar (used budget) */}
                                    <View
                                        style={[
                                            styles.foregroundBar,
                                            {
                                                height: `${heightPercentage}%`,
                                                backgroundColor: item.color,
                                            },
                                        ]}
                                    />
                                    {/* Value labels */}
                                    <View style={styles.valueContainer}>
                                        <Text style={styles.valueText}>
                                            ${(item.value / 1000).toFixed(0)}k
                                        </Text>
                                    </View>
                                </View>
                                <Text style={styles.labelText} numberOfLines={2}>
                                    {item.label}
                                </Text>
                                {item.status && (
                                    <View
                                        style={[
                                            styles.statusIndicator,
                                            {
                                                backgroundColor:
                                                    item.status === 'completed'
                                                        ? '#4CAF50'
                                                        : item.status === 'in-progress'
                                                            ? '#FF9800'
                                                            : '#757575',
                                            },
                                        ]}
                                    />
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginVertical: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 16,
        paddingHorizontal: 16,
    },
    chartContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: 16,
        height: 200,
    },
    barContainer: {
        alignItems: 'center',
        marginHorizontal: 8,
        minWidth: 80,
    },
    barWrapper: {
        position: 'relative',
        width: 40,
        height: 150,
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    backgroundBar: {
        position: 'absolute',
        bottom: 0,
        width: '100%',
        borderRadius: 8,
    },
    foregroundBar: {
        position: 'absolute',
        bottom: 0,
        width: '100%',
        borderRadius: 8,
    },
    valueContainer: {
        position: 'absolute',
        top: -25,
        alignItems: 'center',
    },
    valueText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#fff',
    },
    labelText: {
        fontSize: 12,
        color: '#ccc',
        textAlign: 'center',
        marginTop: 8,
        width: 70,
    },
    statusIndicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginTop: 4,
    },
});
