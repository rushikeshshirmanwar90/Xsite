import React from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Labor } from '@/types/labor';

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

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const getMiniSectionName = (miniSectionId?: string): string => {
        if (!miniSectionId || !miniSections.length) return '';
        const miniSection = miniSections.find(ms => ms._id === miniSectionId);
        return miniSection?.name || '';
    };

    const getCategoryColor = (category: string): string => {
        const colorMap: { [key: string]: string } = {
            'Civil Works Labour': '#EF4444',
            'Electrical Works Labour': '#F59E0B',
            'Plumbing & Sanitary Labour': '#3B82F6',
            'Carpentry & Shuttering Labour': '#84CC16',
            'Steel / Reinforcement Labour': '#6B7280',
            'Finishing Works Labour': '#EC4899',
            'Painting Labour': '#8B5CF6',
            'Flooring & Tiling Labour': '#06B6D4',
            'Waterproofing Labour': '#10B981',
            'HVAC / Mechanical Labour': '#F97316',
            'Fire Fighting Labour': '#DC2626',
            'External Development Labour': '#65A30D',
            'Equipment Operator': '#7C2D12',
            'Site Supervision Staff': '#1E40AF',
            'Security & Housekeeping': '#374151'
        };
        return colorMap[category] || '#6B7280';
    };

    const getCategoryIcon = (category: string): keyof typeof Ionicons.glyphMap => {
        const iconMap: { [key: string]: keyof typeof Ionicons.glyphMap } = {
            'Civil Works Labour': 'hammer-outline',
            'Electrical Works Labour': 'flash-outline',
            'Plumbing & Sanitary Labour': 'water-outline',
            'Carpentry & Shuttering Labour': 'construct-outline',
            'Steel / Reinforcement Labour': 'barbell-outline',
            'Finishing Works Labour': 'brush-outline',
            'Painting Labour': 'color-palette-outline',
            'Flooring & Tiling Labour': 'grid-outline',
            'Waterproofing Labour': 'shield-outline',
            'HVAC / Mechanical Labour': 'thermometer-outline',
            'Fire Fighting Labour': 'flame-outline',
            'External Development Labour': 'leaf-outline',
            'Equipment Operator': 'car-outline',
            'Site Supervision Staff': 'people-outline',
            'Security & Housekeeping': 'shield-checkmark-outline'
        };
        return iconMap[category] || 'people-outline';
    };

    const handleEdit = () => {
        if (onEdit) {
            onEdit(labor);
        }
    };

    const handleDelete = () => {
        Alert.alert(
            'Delete Labor Entry',
            `Are you sure you want to delete this ${labor.type} entry? This action cannot be undone.`,
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        if (onDelete) {
                            onDelete(labor._id);
                        }
                    },
                },
            ]
        );
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
            {/* Enhanced Header with Actions */}
            <View style={styles.enhancedHeader}>
                <View style={styles.laborSummaryContainer}>
                    <View style={styles.laborSummaryHeader}>
                        <View style={styles.laborSummaryLeft}>
                            <View style={[styles.iconContainer, { backgroundColor: `${getCategoryColor(labor.category)}20` }]}>
                                <Ionicons 
                                    name={getCategoryIcon(labor.category)} 
                                    size={24} 
                                    color={getCategoryColor(labor.category)} 
                                />
                            </View>
                            <View style={styles.headerInfo}>
                                <Text style={styles.laborType}>{labor.type}</Text>
                                <Text style={styles.category}>{labor.category}</Text>
                            </View>
                        </View>
                        <View style={styles.laborActionsContainer}>
                            <View style={styles.laborStatusBadge}>
                                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                                <Text style={styles.laborStatusText}>Added</Text>
                            </View>
                            <View style={styles.laborActionButtons}>
                                <TouchableOpacity 
                                    style={styles.laborEditButton}
                                    onPress={handleEdit}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons name="pencil" size={16} color="#3B82F6" />
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    style={styles.laborDeleteButton}
                                    onPress={handleDelete}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons name="trash" size={16} color="#EF4444" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                    
                    {/* Enhanced Quick Summary */}
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
                        <View style={styles.laborSummaryItem}>
                            <Text style={styles.laborSummaryLabel}>Total</Text>
                            <Text style={styles.laborSummaryValueTotal}>₹{labor.totalCost.toLocaleString()}</Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Details */}
            <View style={styles.details}>
                <View style={styles.detailRow}>
                    <View style={styles.detailItem}>
                        <Ionicons name="people" size={16} color="#64748B" />
                        <Text style={styles.detailLabel}>Count</Text>
                        <Text style={styles.detailValue}>{labor.count} laborers</Text>
                    </View>
                    <View style={styles.detailItem}>
                        <Ionicons name="cash" size={16} color="#64748B" />
                        <Text style={styles.detailLabel}>Per Labor</Text>
                        <Text style={styles.detailValue}>{formatCurrency(labor.perLaborCost)}</Text>
                    </View>
                </View>

                {/* Mini Section Label */}
                {showMiniSectionLabel && labor.miniSectionId && (
                    <View style={styles.miniSectionContainer}>
                        <Ionicons name="location-outline" size={14} color="#64748B" />
                        <Text style={styles.miniSectionText}>
                            {getMiniSectionName(labor.miniSectionId)}
                        </Text>
                    </View>
                )}
            </View>

            {/* Cost Breakdown */}
            <View style={styles.costBreakdown}>
                <View style={styles.costItem}>
                    <Text style={styles.costLabel}>Total Cost</Text>
                    <Text style={[styles.costValue, { color: getCategoryColor(labor.category) }]}>
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
        marginHorizontal: 20,
        marginVertical: 8,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    enhancedHeader: {
        marginBottom: 16,
    },
    laborSummaryContainer: {
        gap: 12,
    },
    laborSummaryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    laborSummaryLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    laborActionsContainer: {
        alignItems: 'flex-end',
        gap: 8,
    },
    laborActionButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    laborEditButton: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: '#EFF6FF',
        borderWidth: 1,
        borderColor: '#DBEAFE',
        justifyContent: 'center',
        alignItems: 'center',
    },
    laborDeleteButton: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: '#FEF2F2',
        borderWidth: 1,
        borderColor: '#FECACA',
        justifyContent: 'center',
        alignItems: 'center',
    },
    laborStatusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0FDF4',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#BBF7D0',
        gap: 4,
    },
    laborStatusText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#10B981',
    },
    laborQuickSummary: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 8,
        padding: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    laborSummaryItem: {
        flex: 1,
        alignItems: 'center',
    },
    laborSummaryLabel: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '500',
        marginBottom: 2,
    },
    laborSummaryValue: {
        fontSize: 14,
        color: '#1E293B',
        fontWeight: '600',
    },
    laborSummaryValueTotal: {
        fontSize: 14,
        color: '#10B981',
        fontWeight: '700',
    },
    laborSummaryDivider: {
        width: 1,
        height: 24,
        backgroundColor: '#E2E8F0',
        marginHorizontal: 8,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    headerInfo: {
        flex: 1,
    },
    laborType: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 2,
    },
    category: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '500',
    },
    headerRight: {
        alignItems: 'flex-end',
    },
    totalCost: {
        fontSize: 18,
        fontWeight: '700',
        color: '#059669',
        marginBottom: 2,
    },
    date: {
        fontSize: 11,
        color: '#94A3B8',
        fontWeight: '500',
    },
    details: {
        marginBottom: 12,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 6,
    },
    detailLabel: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '500',
    },
    detailValue: {
        fontSize: 13,
        color: '#1E293B',
        fontWeight: '600',
    },
    miniSectionContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        gap: 6,
    },
    miniSectionText: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '500',
    },
    costBreakdown: {
        backgroundColor: '#F8FAFC',
        borderRadius: 8,
        padding: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
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
        fontSize: 16,
        fontWeight: '700',
    },
    costCalculation: {
        alignItems: 'flex-end',
    },
    calculationText: {
        fontSize: 11,
        color: '#94A3B8',
        fontWeight: '500',
    },
});

export default LaborCardEnhanced;