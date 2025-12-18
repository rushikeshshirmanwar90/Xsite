import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

interface Material {
    _id?: string;
    id: number;
    name: string;
    unit: string;
    specs?: Record<string, any>;
    quantity: number;
    price: number;
    date: string;
    icon: any;
    color: string;
    sectionId?: string;
}

interface MaterialUsageFormProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (miniSectionId: string, materialId: string, quantity: number) => void;
    availableMaterials: Material[];
    miniSections: Array<{ _id: string; name: string }>;
}

const MaterialUsageForm: React.FC<MaterialUsageFormProps> = ({
    visible,
    onClose,
    onSubmit,
    availableMaterials,
    miniSections
}) => {
    const [selectedMiniSectionId, setSelectedMiniSectionId] = useState<string>('');
    const [selectedMaterialId, setSelectedMaterialId] = useState<string>('');
    const [quantity, setQuantity] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState<string>('');

    // Log when form opens and materials are passed
    useEffect(() => {
        if (visible) {
            console.log('\n========================================');
            console.log('📝 MATERIAL USAGE FORM OPENED');
            console.log('========================================');
            console.log('Available Materials Count:', availableMaterials.length);
            console.log('Mini Sections Count:', miniSections.length);
            console.log('\n--- Available Materials ---');
            availableMaterials.forEach((m, idx) => {
                console.log(`  ${idx + 1}. ${m.name}:`);
                console.log(`     _id: "${m._id}" (type: ${typeof m._id}, exists: ${!!m._id})`);
                console.log(`     id: ${m.id} (type: ${typeof m.id})`);
                console.log(`     quantity: ${m.quantity} ${m.unit}`);
            });
            console.log('\n--- Mini Sections ---');
            miniSections.forEach((s, idx) => {
                console.log(`  ${idx + 1}. ${s.name} (_id: ${s._id})`);
            });
            console.log('========================================\n');
        }
    }, [visible, availableMaterials, miniSections]);

    const handleSubmit = () => {
        if (!selectedMiniSectionId) {
            alert('Please select a mini-section');
            return;
        }
        if (!selectedMaterialId) {
            alert('Please select a material');
            return;
        }
        if (!quantity || parseFloat(quantity) <= 0) {
            alert('Please enter a valid quantity');
            return;
        }

        // Check if quantity exceeds available amount
        if (selectedMaterial && parseFloat(quantity) > selectedMaterial.quantity) {
            alert(`Quantity exceeds available amount!\n\nYou entered: ${parseFloat(quantity)} ${selectedMaterial.unit}\nAvailable: ${selectedMaterial.quantity} ${selectedMaterial.unit}`);
            return;
        }

        console.log('\n========================================');
        console.log('📋 MATERIAL USAGE FORM - SUBMISSION');
        console.log('========================================');
        console.log('Form Values:');
        console.log('  - Selected Mini-Section ID:', selectedMiniSectionId, '(type:', typeof selectedMiniSectionId, ')');
        console.log('  - Selected Material ID:', selectedMaterialId, '(type:', typeof selectedMaterialId, ')');
        console.log('  - Quantity:', parseFloat(quantity), '(type:', typeof parseFloat(quantity), ')');
        console.log('\n--- Selected Material Full Details ---');
        if (selectedMaterial) {
            console.log('  - Name:', selectedMaterial.name);
            console.log('  - _id:', selectedMaterial._id, '(type:', typeof selectedMaterial._id, ')');
            console.log('  - id:', selectedMaterial.id, '(type:', typeof selectedMaterial.id, ')');
            console.log('  - Quantity Available:', selectedMaterial.quantity, selectedMaterial.unit);
            console.log('  - Price:', selectedMaterial.price);
            console.log('  - Full Object:', JSON.stringify(selectedMaterial, null, 2));
        } else {
            console.log('  ⚠️ Selected material object is NULL/UNDEFINED!');
        }
        console.log('\n--- All Available Materials ---');
        console.log('Total:', availableMaterials.length);
        availableMaterials.forEach((m, idx) => {
            console.log(`  ${idx + 1}. ${m.name} - _id: "${m._id}" | id: ${m.id}`);
        });
        console.log('========================================');
        console.log('🚀 Calling onSubmit with:', {
            miniSectionId: selectedMiniSectionId,
            materialId: selectedMaterialId,
            quantity: parseFloat(quantity)
        });
        console.log('========================================\n');

        onSubmit(selectedMiniSectionId, selectedMaterialId, parseFloat(quantity));
        handleClose();
    };

    const handleClose = () => {
        setSelectedMiniSectionId('');
        setSelectedMaterialId('');
        setQuantity('');
        setSearchQuery('');
        onClose();
    };

    // Filter materials based on search query
    const filteredMaterials = availableMaterials.filter(material => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return material.name.toLowerCase().includes(query) ||
            material.unit.toLowerCase().includes(query);
    });

    // Function to get differing specifications for materials with same name
    const getDifferingSpecs = (material: Material) => {
        // Find all materials with the same name and unit
        const sameMaterials = filteredMaterials.filter(m => 
            m.name === material.name && m.unit === material.unit
        );
        
        // If only one material with this name, no need to show specs
        if (sameMaterials.length <= 1) {
            return null;
        }
        
        // Get all unique spec keys across all materials with same name
        const allSpecKeys = new Set<string>();
        sameMaterials.forEach(m => {
            if (m.specs) {
                Object.keys(m.specs).forEach(key => allSpecKeys.add(key));
            }
        });
        
        // Find specs that differ between materials
        const differingSpecs: Record<string, any> = {};
        
        Array.from(allSpecKeys).forEach(specKey => {
            const values = sameMaterials.map(m => m.specs?.[specKey]).filter(v => v !== undefined);
            const uniqueValues = [...new Set(values)];
            
            // If there are different values for this spec key, it's a differing spec
            if (uniqueValues.length > 1) {
                differingSpecs[specKey] = material.specs?.[specKey];
            }
        });
        
        return Object.keys(differingSpecs).length > 0 ? differingSpecs : null;
    };

    // Function to format differing specs for display
    const formatDifferingSpecs = (specs: Record<string, any> | null) => {
        if (!specs || Object.keys(specs).length === 0) return '';
        
        return Object.entries(specs)
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ');
    };

    const selectedMaterial = availableMaterials.find(m => m._id === selectedMaterialId);

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={handleClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerLeft}>
                            <View style={styles.iconContainer}>
                                <Ionicons name="arrow-forward-circle" size={24} color="#3B82F6" />
                            </View>
                            <View>
                                <Text style={styles.title}>Record Material Usage</Text>
                                <Text style={styles.subtitle}>Track materials used in your project</Text>
                            </View>
                        </View>
                        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color="#64748B" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
                        {/* Mini-Section Selector */}
                        <View style={styles.fieldContainer}>
                            <View style={styles.labelWithHelper}>
                                <Text style={styles.label}>
                                    Where is this material being used? <Text style={styles.required}>*</Text>
                                </Text>
                                <Text style={styles.labelHelper}>Select the work area or mini-section</Text>
                            </View>
                            {miniSections.length > 0 ? (
                                <View style={styles.sectionList}>
                                    {miniSections.map((section) => {
                                        const isSelected = selectedMiniSectionId === section._id;
                                        return (
                                            <TouchableOpacity
                                                key={section._id}
                                                style={[
                                                    styles.sectionItem,
                                                    isSelected && styles.sectionItemSelected
                                                ]}
                                                onPress={() => setSelectedMiniSectionId(section._id)}
                                            >
                                                <View style={styles.sectionItemLeft}>
                                                    <View style={styles.sectionIconBadge}>
                                                        <Ionicons name="layers" size={18} color="#3B82F6" />
                                                    </View>
                                                    <Text style={styles.sectionItemName}>{section.name}</Text>
                                                </View>
                                                {isSelected && (
                                                    <Ionicons name="checkmark-circle" size={22} color="#3B82F6" />
                                                )}
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            ) : (
                                <View style={styles.noSectionsWarning}>
                                    <Ionicons name="alert-circle" size={20} color="#F59E0B" />
                                    <Text style={styles.helperText}>
                                        No mini-sections available. Please create one first.
                                    </Text>
                                </View>
                            )}
                        </View>

                        {/* Search & Select Material */}
                        <View style={styles.fieldContainer}>
                            <View style={styles.labelWithHelper}>
                                <Text style={styles.label}>
                                    Which material are you using? <Text style={styles.required}>*</Text>
                                </Text>
                                <Text style={styles.labelHelper}>Search and select from available materials</Text>
                            </View>
                            <View style={styles.searchContainer}>
                                <Ionicons name="search" size={20} color="#94A3B8" style={styles.searchIcon} />
                                <TextInput
                                    style={styles.searchInput}
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                    placeholder="Search by name or unit..."
                                    placeholderTextColor="#94A3B8"
                                />
                                {searchQuery.length > 0 && (
                                    <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                                        <Ionicons name="close-circle" size={20} color="#94A3B8" />
                                    </TouchableOpacity>
                                )}
                            </View>

                            {/* Material List */}
                            <ScrollView
                                style={styles.materialList}
                                nestedScrollEnabled={true}
                                showsVerticalScrollIndicator={true}
                            >
                                {filteredMaterials.length > 0 ? (
                                    filteredMaterials.map((material) => {
                                        const isSelected = selectedMaterialId === material._id;
                                        return (
                                            <TouchableOpacity
                                                key={material._id || material.id}
                                                style={[
                                                    styles.materialItem,
                                                    isSelected && styles.materialItemSelected
                                                ]}
                                                onPress={() => {
                                                    if (!material._id) {
                                                        alert('Error: Material ID not found. Please refresh and try again.');
                                                        return;
                                                    }
                                                    setSelectedMaterialId(material._id);
                                                }}
                                            >
                                                <View style={styles.materialItemLeft}>
                                                    <View style={[styles.materialIconBadge, { backgroundColor: material.color + '20' }]}>
                                                        <Ionicons name={material.icon} size={20} color={material.color} />
                                                    </View>
                                                    <View style={styles.materialItemInfo}>
                                                        <View style={styles.materialNameRow}>
                                                            <Text style={styles.materialItemName}>{material.name}</Text>
                                                            {(() => {
                                                                const differingSpecs = getDifferingSpecs(material);
                                                                if (differingSpecs) {
                                                                    return (
                                                                        <View style={styles.specsBadgeInline}>
                                                                            <Text style={styles.specsBadgeText}>
                                                                                {formatDifferingSpecs(differingSpecs)}
                                                                            </Text>
                                                                        </View>
                                                                    );
                                                                }
                                                                return null;
                                                            })()}
                                                        </View>
                                                        <Text style={styles.materialItemQuantity}>
                                                            {material.quantity} {material.unit} available
                                                        </Text>
                                                    </View>
                                                </View>
                                                {isSelected && (
                                                    <Ionicons name="checkmark-circle" size={24} color="#3B82F6" />
                                                )}
                                            </TouchableOpacity>
                                        );
                                    })
                                ) : (
                                    <View style={styles.emptyState}>
                                        <Ionicons name="search-outline" size={48} color="#CBD5E1" />
                                        <Text style={styles.emptyStateText}>
                                            {searchQuery ? 'No materials match your search' : 'No materials available'}
                                        </Text>
                                    </View>
                                )}
                            </ScrollView>
                        </View>

                        {/* Material Details */}
                        {selectedMaterial && (
                            <View style={styles.materialDetails}>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Available:</Text>
                                    <Text style={styles.detailValue}>
                                        {selectedMaterial.quantity} {selectedMaterial.unit}
                                    </Text>
                                </View>
                                {Object.keys(selectedMaterial.specs || {}).length > 0 && (
                                    <View style={styles.specsContainer}>
                                        <Text style={styles.specsTitle}>Specifications:</Text>
                                        {Object.entries(selectedMaterial.specs || {}).map(([key, value]) => (
                                            <Text key={key} style={styles.specItem}>
                                                • {key}: {String(value)}
                                            </Text>
                                        ))}
                                    </View>
                                )}
                            </View>
                        )}

                        {/* Quantity Input */}
                        <View style={styles.fieldContainer}>
                            <View style={styles.labelWithHelper}>
                                <Text style={styles.label}>
                                    How much are you using? <Text style={styles.required}>*</Text>
                                </Text>
                                <Text style={styles.labelHelper}>
                                    {selectedMaterial
                                        ? `Enter quantity in ${selectedMaterial.unit} (Available: ${selectedMaterial.quantity})`
                                        : 'Enter the quantity you want to use'
                                    }
                                </Text>
                            </View>
                            <TextInput
                                style={styles.input}
                                value={quantity}
                                onChangeText={setQuantity}
                                placeholder={selectedMaterial ? `Max: ${selectedMaterial.quantity}` : "Enter quantity"}
                                keyboardType="numeric"
                                placeholderTextColor="#94A3B8"
                            />
                            {selectedMaterial && parseFloat(quantity) > selectedMaterial.quantity && (
                                <Text style={styles.errorText}>
                                    ⚠️ Quantity exceeds available amount
                                </Text>
                            )}
                        </View>
                    </ScrollView>

                    {/* Footer Buttons */}
                    <View style={styles.footer}>
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={handleClose}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.submitButton,
                                (!selectedMiniSectionId || !selectedMaterialId || !quantity) && styles.submitButtonDisabled
                            ]}
                            onPress={handleSubmit}
                            disabled={!selectedMiniSectionId || !selectedMaterialId || !quantity}
                        >
                            <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                            <Text style={styles.submitButtonText}>Record Usage</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '90%',
        paddingBottom: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
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
        backgroundColor: '#EFF6FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1E293B',
    },
    subtitle: {
        fontSize: 14,
        color: '#64748B',
        marginTop: 2,
    },
    closeButton: {
        padding: 4,
    },
    formContainer: {
        padding: 20,
    },
    fieldContainer: {
        marginBottom: 20,
    },
    labelWithHelper: {
        marginBottom: 8,
    },
    label: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1E293B',
        marginBottom: 4,
    },
    labelHelper: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '400',
    },
    required: {
        color: '#EF4444',
    },
    pickerContainer: {
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        overflow: 'hidden',
    },
    picker: {
        height: 50,
    },
    input: {
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        padding: 14,
        fontSize: 16,
        color: '#1E293B',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        paddingHorizontal: 12,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 14,
        fontSize: 16,
        color: '#1E293B',
    },
    clearButton: {
        padding: 4,
    },
    searchResultText: {
        fontSize: 12,
        color: '#3B82F6',
        marginTop: 6,
        fontWeight: '500',
    },
    materialList: {
        maxHeight: 280,
        marginTop: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        backgroundColor: '#FFFFFF',
    },
    materialItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    materialItemSelected: {
        backgroundColor: '#EFF6FF',
        borderLeftWidth: 3,
        borderLeftColor: '#3B82F6',
    },
    materialItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    materialIconBadge: {
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    materialItemInfo: {
        flex: 1,
    },
    materialNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        marginBottom: 2,
        gap: 8,
    },
    materialItemName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1E293B',
    },
    specsBadgeInline: {
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#F59E0B',
    },
    specsBadgeText: {
        fontSize: 10,
        color: '#92400E',
        fontWeight: '600',
    },
    materialItemQuantity: {
        fontSize: 13,
        color: '#64748B',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    emptyStateText: {
        fontSize: 14,
        color: '#94A3B8',
        marginTop: 12,
    },
    sectionList: {
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        backgroundColor: '#FFFFFF',
        overflow: 'hidden',
    },
    sectionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    sectionItemSelected: {
        backgroundColor: '#EFF6FF',
        borderLeftWidth: 3,
        borderLeftColor: '#3B82F6',
    },
    sectionItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    sectionIconBadge: {
        width: 36,
        height: 36,
        borderRadius: 8,
        backgroundColor: '#EFF6FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    sectionItemName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1E293B',
    },
    noSectionsWarning: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF3C7',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FDE68A',
        gap: 8,
    },
    helperText: {
        fontSize: 12,
        color: '#92400E',
        flex: 1,
    },
    errorText: {
        fontSize: 12,
        color: '#EF4444',
        marginTop: 6,
    },
    materialDetails: {
        backgroundColor: '#F0F9FF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#BAE6FD',
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    detailLabel: {
        fontSize: 14,
        color: '#0369A1',
        fontWeight: '500',
    },
    detailValue: {
        fontSize: 14,
        color: '#0C4A6E',
        fontWeight: '700',
    },
    specsContainer: {
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#BAE6FD',
    },
    specsTitle: {
        fontSize: 13,
        color: '#0369A1',
        fontWeight: '600',
        marginBottom: 4,
    },
    specItem: {
        fontSize: 12,
        color: '#0C4A6E',
        marginLeft: 8,
        marginTop: 2,
    },
    footer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingTop: 16,
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#64748B',
    },
    submitButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: '#3B82F6',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
    },
    submitButtonDisabled: {
        backgroundColor: '#CBD5E1',
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});

export default MaterialUsageForm;
