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
            {displayItems.map((item) => (
                <TouchableOpacity
                    key={item.key}
                    style={styles.item}
                    onPress={() => handleItemPress(item.key, item.name)}
                    disabled={!onItemClick}
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
        gap: 12,
    },
    horizontalContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
        justifyContent: 'flex-start',
    },
    item: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: 4,
        gap: 12,
    },
    horizontalItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        minWidth: 120,
        flex: 1,
    },
    colorIndicator: {
        width: 16,
        height: 16,
        borderRadius: 4,
        marginTop: 2,
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
        fontSize: 14,
        fontWeight: '500',
        color: '#2C3E50',
        flex: 1,
        marginRight: 8,
    },
    horizontalItemName: {
        fontSize: 12,
        fontWeight: '500',
        color: '#2C3E50',
        flex: 1,
    },
    itemValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#34495E',
    },
    horizontalItemValue: {
        fontSize: 11,
        fontWeight: '600',
        color: '#34495E',
    },
    percentageText: {
        fontSize: 12,
        color: '#7F8C8D',
        fontWeight: '400',
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
        fontSize: 12,
        color: '#95A5A6',
        fontStyle: 'italic',
        marginTop: 4,
    },
});

export default PieChartLegend;
