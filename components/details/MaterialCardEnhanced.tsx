import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Animated, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface MaterialVariant {
    _id: string;
    specs: Record<string, any>;
    quantity: number;
    cost: number;
    miniSectionId?: string;
}

interface GroupedMaterial {
    name: string;
    unit: string;
    icon: any;
    color: string;
    date: string;
    specs?: Record<string, any>; // ✅ NEW: Specifications for this material variant
    variants: MaterialVariant[];
    totalQuantity: number;
    totalCost: number;
    totalImported?: number; // Total quantity ever imported
    totalUsed?: number; // Total quantity used so far
    miniSectionId?: string;
}

interface MiniSection {
    _id: string;
    name: string;
}

interface MaterialCardEnhancedProps {
    material: GroupedMaterial;
    animation: Animated.Value;
    activeTab: 'imported' | 'used';
    onAddUsage: (materialName: string, unit: string, variantId: string, quantity: number, specs: Record<string, any>) => void;
    onTransferMaterial?: (materialName: string, unit: string, variantId: string, quantity: number, specs: Record<string, any>, targetProjectId: string) => void;
    miniSections?: MiniSection[];
    showMiniSectionLabel?: boolean;
    currentProjectId?: string;
}

const MaterialCardEnhanced: React.FC<MaterialCardEnhancedProps> = ({
    material,
    animation,
    activeTab,
    onAddUsage,
    onTransferMaterial,
    miniSections = [],
    showMiniSectionLabel = false,
    currentProjectId,
}) => {
    // Get mini-section name by ID
    const getMiniSectionName = (miniSectionId?: string): string => {
        if (!miniSectionId) return 'Unassigned';
        const section = miniSections.find(s => s._id === miniSectionId);
        return section ? section.name : 'Unknown Section';
    };
    const [showUsageModal, setShowUsageModal] = useState(false);
    const [selectedVariant, setSelectedVariant] = useState<MaterialVariant | null>(null);
    const [usageQuantity, setUsageQuantity] = useState('');
    const [showVariantSelector, setShowVariantSelector] = useState(false);
    
    // Transfer functionality states - REMOVED

    // Get suggested quantity based on material type
    const getSuggestedQuantity = (materialName: string, unit: string): number => {
        const lowerName = materialName.toLowerCase();
        const lowerUnit = unit.toLowerCase();

        // Bricks - large quantities
        if (lowerName.includes('brick') || lowerUnit.includes('piece')) {
            return 100;
        }
        // Cement - medium quantities
        if (lowerName.includes('cement') || lowerUnit.includes('bag')) {
            return 10;
        }
        // Steel/Rod - small quantities
        if (lowerName.includes('steel') || lowerName.includes('rod') || lowerUnit.includes('kg')) {
            return 5;
        }
        // Sand/Gravel - medium quantities
        if (lowerName.includes('sand') || lowerName.includes('gravel')) {
            return 10;
        }
        // Default
        return 10;
    };

    const handleOpenUsageModal = () => {
        if (material.variants.length === 1) {
            setSelectedVariant(material.variants[0]);
            setUsageQuantity(getSuggestedQuantity(material.name, material.unit).toString());
            setShowUsageModal(true);
        } else {
            // Multiple variants, show selector first
            setShowVariantSelector(true);
        }
    };

    const handleSelectVariant = (variant: MaterialVariant) => {
        setSelectedVariant(variant);
        setUsageQuantity(getSuggestedQuantity(material.name, material.unit).toString());
        setShowVariantSelector(false);
        setShowUsageModal(true);
    };

    const handleAddUsage = () => {
        if (!selectedVariant || !usageQuantity || parseFloat(usageQuantity) <= 0) {
            console.warn('⚠️ Cannot add usage: Missing variant or invalid quantity');
            return;
        }

        const quantity = parseFloat(usageQuantity);
        if (quantity > selectedVariant.quantity) {
            alert(`Cannot use more than available quantity (${selectedVariant.quantity} ${material.unit})`);
            return;
        }

        console.log('=== MATERIAL CARD: Calling onAddUsage ===');
        console.log('Material Name:', material.name);
        console.log('Unit:', material.unit);
        console.log('Variant ID:', selectedVariant._id);
        console.log('Quantity:', quantity);
        console.log('Specs:', selectedVariant.specs);
        console.log('=========================================');

        onAddUsage(material.name, material.unit, selectedVariant._id, quantity, selectedVariant.specs);
        setShowUsageModal(false);
        setUsageQuantity('');
        setSelectedVariant(null);
    };

    const formatSpecs = (specs: Record<string, any>): string => {
        if (!specs || Object.keys(specs).length === 0) return 'Standard';
        return Object.entries(specs)
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ');
    };

    const getQuickAddButtons = () => {
        const suggested = getSuggestedQuantity(material.name, material.unit);
        return [
            Math.floor(suggested / 2),
            suggested,
            suggested * 2,
            suggested * 5
        ];
    };

    // Transfer functionality - REMOVED

    return (
        <>
            <Animated.View
                style={[
                    styles.materialCard,
                    {
                        opacity: animation,
                        transform: [
                            {
                                translateY: animation.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [50, 0],
                                }),
                            },
                        ],
                    },
                ]}
            >
                <View style={styles.cardContent}>
                    {/* Header */}
                    <View style={styles.materialHeader}>
                        <View style={styles.materialTitleSection}>
                            <View style={[styles.iconContainer, { backgroundColor: material.color + '20' }]}>
                                <Ionicons name={material.icon} size={24} color={material.color} />
                            </View>
                            <View style={styles.materialTitleInfo}>
                                <View style={styles.materialNameRow}>
                                    <Text style={styles.materialNameText}>{material.name}</Text>
                                </View>
                                {showMiniSectionLabel && material.miniSectionId && (
                                    <View style={styles.miniSectionBadge}>
                                        <Ionicons name="location" size={12} color="#3B82F6" />
                                        <Text style={styles.miniSectionText}>
                                            {getMiniSectionName(material.miniSectionId)}
                                        </Text>
                                    </View>
                                )}
                                {material.variants.length > 1 && (
                                    <Text style={styles.variantCountText}>
                                        {material.variants.length} variants
                                    </Text>
                                )}
                            </View>
                        </View>
                        <View style={styles.dateContainer}>
                            <Text style={styles.dateText}>{material.date}</Text>
                        </View>
                    </View>
                    


                    {/* Statistics Section */}
                    <View style={styles.statsSection}>
                        <View style={styles.statsRow}>
                            <View style={styles.statItem}>
                                <Text style={styles.statLabel}>Total Imported</Text>
                                <Text style={styles.statValue}>
                                    {material.totalImported || material.totalQuantity} {material.unit}
                                </Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statItem}>
                                <Text style={styles.statLabel}>
                                    {activeTab === 'used' ? 'Quantity Used' : 'Currently Available'}
                                </Text>
                                <Text style={[
                                    styles.statValue,
                                    activeTab === 'used' ? styles.statValueUsed : styles.statValueAvailable
                                ]}>
                                    {material.totalQuantity} {material.unit}
                                </Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statItem}>
                                <Text style={styles.statLabel}>
                                    {activeTab === 'used' ? 'Still Available' : 'Used So Far'}
                                </Text>
                                <Text style={[
                                    styles.statValue,
                                    activeTab === 'used' ? styles.statValueAvailable : styles.statValueUsed
                                ]}>
                                    {activeTab === 'used'
                                        ? (material.totalImported ? material.totalImported - material.totalQuantity : 0)
                                        : (material.totalUsed || 0)
                                    } {material.unit}
                                </Text>
                            </View>
                        </View>

                        {/* Progress Bar - Only show in imported tab */}
                        {activeTab === 'imported' && (
                            <View style={styles.progressBarContainer}>
                                <View style={styles.progressBarBackground}>
                                    <View
                                        style={[
                                            styles.progressBarFill,
                                            {
                                                width: material.totalImported
                                                    ? `${Math.min((material.totalQuantity / material.totalImported) * 100, 100)}%`
                                                    : '100%'
                                            }
                                        ]}
                                    />
                                </View>
                                <Text style={styles.progressPercentage}>
                                    {material.totalImported
                                        ? `${Math.round((material.totalQuantity / material.totalImported) * 100)}% remaining`
                                        : '100% remaining'}
                                </Text>
                            </View>
                        )}

                        {/* Cost Information - Compact */}
                        <View style={styles.costSectionCompact}>
                            <View style={styles.costRowCompact}>
                                <Text style={styles.costLabelCompact}>
                                    {activeTab === 'used' ? 'Total Used Cost:' : 'Per Unit:'}
                                </Text>
                                <Text style={styles.costValueCompact}>
                                    ₹{(() => {
                                        // FIXED: material.totalCost is actually the per unit cost
                                        const perUnitCost = Number(material.totalCost) || 0;
                                        
                                        // For used materials, show total used cost (per unit × quantity used)
                                        // For imported materials, show per unit cost
                                        const displayCost = activeTab === 'used' 
                                            ? perUnitCost * material.totalQuantity  // Total cost for used quantity
                                            : perUnitCost;  // Per unit cost for imported
                                        
                                        // Debug logging
                                        if (__DEV__) {
                                            console.log('🐛 COST DEBUG (FIXED):', {
                                                materialName: material.name,
                                                activeTab,
                                                totalCostField: material.totalCost,
                                                interpretedAsPerUnit: perUnitCost,
                                                totalQuantity: material.totalQuantity,
                                                totalImported: material.totalImported,
                                                displayCost,
                                                calculatedTotal: perUnitCost * (material.totalImported || material.totalQuantity)
                                            });
                                        }
                                        
                                        return displayCost.toLocaleString('en-IN', { maximumFractionDigits: 2 });
                                    })()}{activeTab === 'imported' ? `/${material.unit}` : ''}
                                </Text>
                            </View>
                            <View style={styles.costDivider} />
                            <View style={styles.costRowCompact}>
                                <Text style={styles.costLabelCompact}>Total:</Text>
                                <Text style={styles.costValueCompact}>
                                    ₹{(() => {
                                        // FIXED: Calculate total cost = per unit cost × total imported quantity
                                        const perUnitCost = Number(material.totalCost) || 0;
                                        const totalImported = Number(material.totalImported) || Number(material.totalQuantity) || 0;
                                        const totalCost = perUnitCost * totalImported;
                                        
                                        return totalCost.toLocaleString('en-IN');
                                    })()}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Specifications Section - Below cost */}
                    {material.specs && Object.keys(material.specs).length > 0 && (
                        <View style={styles.specsSection}>
                            <View style={styles.specsSectionHeader}>
                                <Ionicons name="information-circle-outline" size={16} color="#6B7280" />
                                <Text style={styles.specsSectionTitle}>Specifications</Text>
                            </View>
                            <View style={styles.specsContainer}>
                                {Object.entries(material.specs).map(([key, value], index) => (
                                    <View key={index} style={styles.specItem}>
                                        <Text style={styles.specKey}>{key}:</Text>
                                        <Text style={styles.specValue}>{value}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}


                </View>
            </Animated.View>

            {/* Variant Selector Modal */}
            <Modal
                visible={showVariantSelector}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowVariantSelector(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setShowVariantSelector(false)}>
                            <Ionicons name="close" size={24} color="#374151" />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>Select Specification</Text>
                        <View style={{ width: 24 }} />
                    </View>

                    <ScrollView style={styles.modalContent}>
                        <Text style={styles.modalSubtitle}>
                            Choose the specification of {material.name} you want to use:
                        </Text>
                        {material.variants.map((variant, index) => (
                            <TouchableOpacity
                                key={variant._id}
                                style={styles.variantOption}
                                onPress={() => handleSelectVariant(variant)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.variantInfo}>
                                    <Text style={styles.variantSpecsText}>
                                        {formatSpecs(variant.specs)}
                                    </Text>
                                    <Text style={styles.variantQuantityText}>
                                        Available: {variant.quantity} {material.unit}
                                    </Text>
                                    <Text style={styles.variantCostText}>
                                        Cost: ₹{variant.cost.toLocaleString('en-IN')}
                                    </Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            </Modal>

            {/* Usage Input Modal */}
            <Modal
                visible={showUsageModal}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowUsageModal(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setShowUsageModal(false)}>
                            <Ionicons name="close" size={24} color="#374151" />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>Add Usage</Text>
                        <View style={{ width: 24 }} />
                    </View>

                    <ScrollView style={styles.modalContent}>
                        {/* Material Info */}
                        <View style={styles.usageMaterialInfo}>
                            <View style={[styles.iconContainerLarge, { backgroundColor: material.color + '20' }]}>
                                <Ionicons name={material.icon} size={32} color={material.color} />
                            </View>
                            <View style={styles.usageMaterialDetails}>
                                <Text style={styles.usageMaterialName}>{material.name}</Text>
                                {selectedVariant && (
                                    <Text style={styles.usageMaterialSpecs}>
                                        {formatSpecs(selectedVariant.specs)}
                                    </Text>
                                )}
                                <Text style={styles.usageMaterialAvailable}>
                                    Available: {selectedVariant?.quantity || 0} {material.unit}
                                </Text>
                            </View>
                        </View>

                        {/* Quantity Input */}
                        <View style={styles.inputSection}>
                            <Text style={styles.inputLabel}>Quantity to Use ({material.unit})</Text>
                            <TextInput
                                style={styles.quantityInput}
                                value={usageQuantity}
                                onChangeText={setUsageQuantity}
                                keyboardType="decimal-pad"
                                placeholder="Enter quantity"
                                placeholderTextColor="#9CA3AF"
                            />
                        </View>

                        {/* Quick Add Buttons */}
                        <View style={styles.quickAddSection}>
                            <Text style={styles.quickAddLabel}>Quick Add:</Text>
                            <View style={styles.quickAddButtons}>
                                {getQuickAddButtons().map((qty) => (
                                    <TouchableOpacity
                                        key={qty}
                                        style={styles.quickAddButton}
                                        onPress={() => setUsageQuantity(qty.toString())}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={styles.quickAddButtonText}>{qty}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Add Button */}
                        <TouchableOpacity
                            style={[
                                styles.confirmButton,
                                (!usageQuantity || parseFloat(usageQuantity) <= 0) && styles.confirmButtonDisabled
                            ]}
                            onPress={handleAddUsage}
                            activeOpacity={0.8}
                            disabled={!usageQuantity || parseFloat(usageQuantity) <= 0}
                        >
                            <Ionicons
                                name="checkmark-circle"
                                size={20}
                                color={usageQuantity && parseFloat(usageQuantity) > 0 ? "#FFFFFF" : "#9CA3AF"}
                            />
                            <Text style={[
                                styles.confirmButtonText,
                                (!usageQuantity || parseFloat(usageQuantity) <= 0) && styles.confirmButtonTextDisabled
                            ]}>
                                Add to Used Materials
                            </Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </Modal>


        </>
    );
};

const styles = StyleSheet.create({
    materialCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    cardContent: {
        padding: 16,
    },
    materialHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    materialTitleSection: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    iconContainerLarge: {
        width: 64,
        height: 64,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    materialTitleInfo: {
        flex: 1,
    },
    materialNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        marginBottom: 2,
    },
    materialNameText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1F2937',
        marginRight: 8,
    },
    specsBadge: {
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#F59E0B',
    },
    specsText: {
        fontSize: 11,
        color: '#92400E',
        fontWeight: '600',
    },
    miniSectionBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        marginTop: 4,
        marginBottom: 2,
        alignSelf: 'flex-start',
        gap: 4,
    },
    miniSectionText: {
        fontSize: 11,
        color: '#3B82F6',
        fontWeight: '600',
    },
    variantCountText: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '500',
    },
    dateContainer: {
        alignItems: 'flex-end',
    },
    dateText: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    statsSection: {
        marginBottom: 16,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        padding: 12,
        borderRadius: 12,
        marginBottom: 12,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statDivider: {
        width: 1,
        height: 40,
        backgroundColor: '#E5E7EB',
        marginHorizontal: 8,
    },
    statLabel: {
        fontSize: 11,
        color: '#6B7280',
        marginBottom: 4,
        textAlign: 'center',
    },
    statValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937',
        textAlign: 'center',
    },
    statValueAvailable: {
        color: '#059669',
    },
    statValueUsed: {
        color: '#EF4444',
    },
    progressBarContainer: {
        marginBottom: 12,
    },
    progressBarBackground: {
        height: 8,
        backgroundColor: '#E5E7EB',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 6,
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#059669',
        borderRadius: 4,
    },
    progressPercentage: {
        fontSize: 11,
        color: '#6B7280',
        textAlign: 'right',
    },
    costSection: {
        backgroundColor: '#F8FAFC',
        padding: 12,
        borderRadius: 8,
        gap: 8,
    },
    costRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    costLabel: {
        fontSize: 13,
        color: '#6B7280',
        fontWeight: '500',
    },
    costValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
    },
    // Compact cost section styles
    costSectionCompact: {
        flexDirection: 'row',
        backgroundColor: '#F8FAFC',
        padding: 8,
        borderRadius: 6,
        alignItems: 'center',
    },
    costRowCompact: {
        flex: 1,
        alignItems: 'center',
    },
    costDivider: {
        width: 1,
        height: 24,
        backgroundColor: '#E5E7EB',
        marginHorizontal: 8,
    },
    costLabelCompact: {
        fontSize: 11,
        color: '#6B7280',
        fontWeight: '500',
        marginBottom: 2,
    },
    costValueCompact: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937',
    },
    // Specifications section styles
    specsSection: {
        marginTop: 12,
        backgroundColor: '#FEFEFE',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        padding: 12,
    },
    specsSectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 6,
    },
    specsSectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#374151',
    },
    specsContainer: {
        gap: 6,
    },
    specItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    specKey: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '500',
        textTransform: 'capitalize',
        minWidth: 60,
    },
    specValue: {
        fontSize: 12,
        color: '#1F2937',
        fontWeight: '600',
        flex: 1,
    },
    addUsageButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F0FDF4',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#059669',
        gap: 8,
    },
    addUsageButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#059669',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1F2937',
    },
    modalContent: {
        flex: 1,
        padding: 16,
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 16,
    },
    variantOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F9FAFB',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    variantInfo: {
        flex: 1,
    },
    variantSpecsText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 4,
    },
    variantQuantityText: {
        fontSize: 14,
        color: '#059669',
        marginBottom: 2,
    },
    variantCostText: {
        fontSize: 12,
        color: '#6B7280',
    },
    usageMaterialInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
    },
    usageMaterialDetails: {
        flex: 1,
        marginLeft: 16,
    },
    usageMaterialName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 4,
    },
    usageMaterialSpecs: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 4,
    },
    usageMaterialAvailable: {
        fontSize: 14,
        color: '#059669',
        fontWeight: '500',
    },
    inputSection: {
        marginBottom: 24,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
        marginBottom: 8,
    },
    quantityInput: {
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: '#1F2937',
        backgroundColor: '#FFFFFF',
    },
    quickAddSection: {
        marginBottom: 24,
    },
    quickAddLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
        marginBottom: 12,
    },
    quickAddButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    quickAddButton: {
        flex: 1,
        backgroundColor: '#F3F4F6',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    quickAddButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
    },
    confirmButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#059669',
        paddingVertical: 16,
        borderRadius: 12,
        gap: 8,
    },
    confirmButtonDisabled: {
        backgroundColor: '#F3F4F6',
    },
    confirmButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    confirmButtonTextDisabled: {
        color: '#9CA3AF',
    },

});

export default MaterialCardEnhanced;
