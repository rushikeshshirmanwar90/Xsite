import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export interface LegendItem {
    key: string;
    name: string;
    value: string;
    percentage?: string;
    color: string;
    description?: string;
}

export interface PieChartLegendProps {
    items: LegendItem[];
    onItemClick?: (key: string, name: string) => void;
    showPercentage?: boolean;
    showDescription?: boolean;
    maxItems?: number;
    layout?: 'vertical' | 'horizontal';
}

const PieChartLegend: React.FC<PieChartLegendProps> = ({
    items,
    onItemClick,
    showPercentage = true,
    showDescription = false,
    maxItems,
    layout = 'vertical'
}) => {
    const displayItems = maxItems ? items.slice(0, maxItems) : items;

    const handleItemPress = (key: string, name: string) => {
        if (onItemClick) {
            onItemClick(key, name);
        }
    };

    if (layout === 'horizontal') {
        return (
            <View style={styles.horizontalContainer}>
                {displayItems.map((item) => (
                    <TouchableOpacity
                        key={item.key}
                        style={styles.horizontalItem}
                        onPress={() => handleItemPress(item.key, item.name)}
                        disabled={!onItemClick}
                    >
                        <View style={[styles.colorIndicator, { backgroundColor: item.color }]} />
                        <View style={styles.horizontalTextContainer}>
                            <Text style={styles.horizontalItemName} numberOfLines={1}>
                                {item.name}
                            </Text>
                            <Text style={styles.horizontalItemValue}>
                                {item.value}
                                {showPercentage && item.percentage && ` (${item.percentage}%)`}
                            </Text>
                        </View>
                    </TouchableOpacity>
                ))}
                {maxItems && items.length > maxItems && (
                    <Text style={styles.moreText}>
                        +{items.length - maxItems} more
                    </Text>
                )}
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {displayItems.map((item, index) => (
                <TouchableOpacity
                    key={item.key}
                    style={[styles.item, index > 0 && styles.itemDivider]}
                    onPress={() => handleItemPress(item.key, item.name)}
                    disabled={!onItemClick}
                    accessibilityRole={onItemClick ? 'button' : undefined}
                    accessibilityLabel={`${item.name}, ${item.value}${showPercentage && item.percentage ? `, ${item.percentage} percent` : ''}`}
                >
                    <View style={[styles.colorIndicator, { backgroundColor: item.color }]} />
                    <View style={styles.textContainer}>
                        <View style={styles.mainInfo}>
                            <Text style={styles.itemName} numberOfLines={1}>
                                {item.name}
                            </Text>
                            <Text style={styles.itemValue}>
                                {item.value}
                                {showPercentage && item.percentage && (
                                    <Text style={styles.percentageText}>
                                        {' '}({item.percentage}%)
                                    </Text>
                                )}
                            </Text>
                        </View>
                        {showDescription && item.description && (
                            <View style={styles.descriptionContainer}>
                                <Text style={styles.itemDescription} numberOfLines={2}>
                                    {item.description}
                                </Text>
                            </View>
                        )}
                    </View>
                    {/* Drill-down affordance — only shown when the row is tappable */}
                    {onItemClick && (
                        <Ionicons name="chevron-forward" size={18} color="#94A3B8" style={styles.chevron} />
                    )}
                </TouchableOpacity>
            ))}
            {maxItems && items.length > maxItems && (
                <Text style={styles.moreText}>
                    +{items.length - maxItems} more items
                </Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        gap: 0,
    },
    horizontalContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
        justifyContent: 'flex-start',
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 48,
        paddingVertical: 8,
        gap: 12,
    },
    itemDivider: {
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: '#E2E8F0',
    },
    chevron: {
        marginLeft: 2,
    },
    horizontalItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        minWidth: 120,
        flex: 1,
    },
    colorIndicator: {
        width: 14,
        height: 14,
        borderRadius: 7,
    },
    textContainer: {
        flex: 1,
        gap: 4,
    },
    horizontalTextContainer: {
        flex: 1,
    },
    mainInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        flex: 1,
    },
    itemName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#0F172A',
        flex: 1,
        marginRight: 8,
    },
    horizontalItemName: {
        fontSize: 13,
        fontWeight: '600',
        color: '#0F172A',
        flex: 1,
    },
    itemValue: {
        fontSize: 15,
        fontWeight: '700',
        color: '#0F172A',
        fontVariant: ['tabular-nums'],
    },
    horizontalItemValue: {
        fontSize: 12,
        fontWeight: '600',
        color: '#475569',
        fontVariant: ['tabular-nums'],
    },
    percentageText: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '500',
    },
    descriptionContainer: {
        marginTop: 4,
        paddingTop: 6,
        borderTopWidth: 1,
        borderTopColor: '#ECF0F1',
    },
    itemDescription: {
        fontSize: 13,
        color: '#2C3E50',
        lineHeight: 18,
        fontWeight: '600',
    },
    moreText: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '500',
        marginTop: 4,
    },
});

export default PieChartLegend;
