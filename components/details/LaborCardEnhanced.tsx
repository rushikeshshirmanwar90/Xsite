import { Labor } from '@/types/labor';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

interface LaborCardEnhancedProps {
    labor: Labor;
    animation: Animated.Value;
    showMiniSectionLabel?: boolean;
    miniSections?: any[];
    onEdit?: (labor: Labor) => void;
    onDelete?: (laborId: string) => void;
}

const LaborCardEnhanced: React.FC<LaborCardEnhancedProps> = ({
    labor,
    animation,
    showMiniSectionLabel = false,
    miniSections = [],
    onEdit,
    onDelete
}) => {
    const formatCurrency = (amount: number): string => {
        return `₹${amount.toLocaleString('en-IN')}`;
    };

    const getMiniSectionName = (miniSectionId?: string): string => {
        if (!miniSectionId || !miniSections.length) return '';
        const miniSection = miniSections.find(ms => ms._id === miniSectionId);
        return miniSection?.name || '';
    };

    const getCategoryColor = (category: string): string => {
        const colorMap: { [key: string]: string } = {
            'Civil / Structural Works': '#EF4444',        // Red
            'Electrical Works': '#F59E0B',                // Amber
            'Plumbing & Sanitary Works': '#3B82F6',       // Blue
            'Finishing Works': '#EC4899',                 // Pink
            'Mechanical & HVAC Works': '#F97316',         // Orange
            'Fire Fighting & Safety Works': '#DC2626',    // Dark Red
            'External & Infrastructure Works': '#65A30D', // Green
            'Waterproofing & Treatment Works': '#10B981', // Emerald
            'Site Management & Support Staff': '#1E40AF', // Dark Blue
            'Equipment Operators': '#7C2D12',             // Brown
            'Security & Housekeeping': '#374151'          // Gray
        };
        return colorMap[category] || '#6B7280';
    };

    const getCategoryIcon = (category: string): keyof typeof Ionicons.glyphMap => {
        const iconMap: { [key: string]: keyof typeof Ionicons.glyphMap } = {
            'Civil / Structural Works': 'hammer-outline',
            'Electrical Works': 'flash-outline',
            'Plumbing & Sanitary Works': 'water-outline',
            'Finishing Works': 'brush-outline',
            'Mechanical & HVAC Works': 'thermometer-outline',
            'Fire Fighting & Safety Works': 'flame-outline',
            'External & Infrastructure Works': 'leaf-outline',
            'Waterproofing & Treatment Works': 'shield-outline',
            'Site Management & Support Staff': 'people-outline',
            'Equipment Operators': 'car-outline',
            'Security & Housekeeping': 'shield-checkmark-outline'
        };
        return iconMap[category] || 'people-outline';
    };

    return (
        <Animated.View
            style={[
                styles.card,
                {
                    opacity: animation,
                    transform: [{
                        translateY: animation.interpolate({
                            inputRange: [0, 1],
                            outputRange: [20, 0],
                        }),
                    }],
                },
            ]}
        >
            {/* Decorative background accent */}
            <View style={[
                styles.cardAccentBackground,
                { backgroundColor: (labor.color || getCategoryColor(labor.category)) + '05' }
            ]} />

            {/* Enhanced Header with Actions */}
            <View style={styles.enhancedHeader}>
                <View style={styles.laborSummaryContainer}>
                    <View style={styles.laborSummaryHeader}>
                        <View style={styles.laborSummaryLeft}>
                            {/* Colorful circular icon container matching LaborFormModal */}
                            <View style={[
                                styles.categoryIconContainer, 
                                { backgroundColor: (labor.color || getCategoryColor(labor.category)) + '20' }
                            ]}>
                                <Ionicons 
                                    name={labor.icon || getCategoryIcon(labor.category)} 
                                    size={24} 
                                    color={labor.color || getCategoryColor(labor.category)} 
                                />
                            </View>
                            <View style={styles.headerInfo}>
                                <Text style={styles.laborType}>{labor.type}</Text>
                                <Text style={[
                                    styles.category,
                                    { color: labor.color || getCategoryColor(labor.category) }
                                ]}>{labor.category}</Text>
                                
                                {/* Mini Section Label below category */}
                                {showMiniSectionLabel && labor.miniSectionId && (
                                    <View style={styles.miniSectionInline}>
                                        <Ionicons name="location" size={12} color="#64748B" />
                                        <Text style={styles.miniSectionInlineText}>
                                            {getMiniSectionName(labor.miniSectionId)}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    </View>
                    
                    {/* Enhanced Quick Summary without icons */}
                    <View style={styles.laborQuickSummary}>
                        <View style={styles.laborSummaryItem}>
                            <Text style={styles.laborSummaryLabel}>Laborers</Text>
                            <Text style={styles.laborSummaryValue}>{labor.count}</Text>
                        </View>
                        <View style={styles.laborSummaryDivider} />
                        <View style={styles.laborSummaryItem}>
                            <Text style={styles.laborSummaryLabel}>Rate</Text>
                            <Text style={styles.laborSummaryValue}>₹{labor.perLaborCost.toLocaleString()}</Text>
                        </View>
                        <View style={styles.laborSummaryDivider} />
                        <View style={styles.laborSummaryItemTotal}>
                            <Text style={styles.laborSummaryLabel}>Total</Text>
                            <Text style={styles.laborSummaryValueTotal}>₹{labor.totalCost.toLocaleString()}</Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Cost Breakdown */}
            <View style={styles.costBreakdown}>
                <View style={styles.costItem}>
                    <Text style={styles.costLabel}>Total Cost</Text>
                    <Text style={[styles.costValue, { color: labor.color || getCategoryColor(labor.category) }]}>
                        {formatCurrency(labor.totalCost)}
                    </Text>
                </View>
                <View style={styles.costCalculation}>
                    <Text style={styles.calculationText}>
                        {labor.count} × {formatCurrency(labor.perLaborCost)}
                    </Text>
                </View>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        marginHorizontal: 16,
        marginVertical: 8,
        padding: 18,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        position: 'relative',
        overflow: 'hidden',
    },
    cardAccentBackground: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: 16,
    },
    enhancedHeader: {
        marginBottom: 16,
        zIndex: 1,
    },
    laborSummaryContainer: {
        gap: 14,
    },
    laborSummaryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    laborSummaryLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    // Circular icon container matching LaborFormModal exactly
    categoryIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    headerInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    laborType: {
        fontSize: 17,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 4,
        lineHeight: 22,
    },
    category: {
        fontSize: 13,
        fontWeight: '600',
        letterSpacing: 0.2,
    },
    miniSectionInline: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
        gap: 4,
    },
    miniSectionInlineText: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '500',
    },
    laborQuickSummary: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    laborSummaryItem: {
        flex: 1,
        alignItems: 'center',
        gap: 6,
    },
    laborSummaryItemTotal: {
        flex: 1,
        alignItems: 'center',
        gap: 6,
    },
    laborSummaryLabel: {
        fontSize: 11,
        color: '#64748B',
        fontWeight: '600',
        textAlign: 'center',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    laborSummaryValue: {
        fontSize: 16,
        color: '#1E293B',
        fontWeight: '700',
        textAlign: 'center',
    },
    laborSummaryValueTotal: {
        fontSize: 16,
        color: '#10B981',
        fontWeight: '800',
        textAlign: 'center',
    },
    laborSummaryDivider: {
        width: 1,
        height: 36,
        backgroundColor: '#CBD5E1',
        marginHorizontal: 8,
    },
    costBreakdown: {
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        zIndex: 1,
        marginTop: 2,
    },
    costItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    costLabel: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '600',
    },
    costValue: {
        fontSize: 20,
        fontWeight: '800',
        letterSpacing: 0.3,
    },
    costCalculation: {
        alignItems: 'flex-end',
    },
    calculationText: {
        fontSize: 11,
        color: '#94A3B8',
        fontWeight: '600',
    },
});

export default LaborCardEnhanced;