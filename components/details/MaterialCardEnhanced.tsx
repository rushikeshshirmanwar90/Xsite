import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Animated, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface MaterialVariant {
    _id: string;
    specs: Record<string, any>;
    quantity: number;
    cost: number;
}

interface GroupedMaterial {
    name: string;
    unit: string;
    icon: any;
    color: string;
    date: string;
    variants: MaterialVariant[];
    totalQuantity: number;
    totalCost: number;
    totalImported?: number; // Total quantity ever imported
    totalUsed?: number; // Total quantity used so far
}

interface MaterialCardEnhancedProps {
    material: GroupedMaterial;
    animation: Animated.Value;
    activeTab: 'imported' | 'used';
    onAddUsage: (materialName: string, unit: string, variantId: string, quantity: number, specs: Record<string, any>) => void;
}

const MaterialCardEnhanced: React.FC<MaterialCardEnhancedProps> = ({
    material,
    animation,
    activeTab,
    onAddUsage,
}) => {
    const [showUsageModal, setShowUsageModal] = useState(false);
    const [selectedVariant, setSelectedVariant] = useState<MaterialVariant | null>(null);
    const [usageQuantity, setUsageQuantity] = useState('');
    const [showVariantSelector, setShowVariantSelector] = useState(false);

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
                                <Text style={styles.materialNameText}>{material.name}</Text>
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
                                <Text style={styles.statLabel}>Currently Available</Text>
                                <Text style={[styles.statValue, styles.statValueAvailable]}>
                                    {material.totalQuantity} {material.unit}
                                </Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statItem}>
                                <Text style={styles.statLabel}>Used So Far</Text>
                                <Text style={[styles.statValue, styles.statValueUsed]}>
                                    {material.totalUsed || 0} {material.unit}
                                </Text>
                            </View>
                        </View>

                        {/* Progress Bar */}
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

                        {/* Cost Information */}
                        <View style={styles.costRow}>
                            <Text style={styles.costLabel}>Total Cost:</Text>
                            <Text style={styles.costValue}>
                                ₹{material.totalCost.toLocaleString('en-IN')}
                            </Text>
                        </View>
                    </View>

                    {/* Add Usage Button - Only show in imported tab */}
                    {activeTab === 'imported' && (
                        <TouchableOpacity
                            style={styles.addUsageButton}
                            onPress={handleOpenUsageModal}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="add-circle-outline" size={20} color="#059669" />
                            <Text style={styles.addUsageButtonText}>Add Usage</Text>
                        </TouchableOpacity>
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
    materialNameText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 2,
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
    costRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 4,
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
