import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface Material {
    _id: string;
    name: string;
    qnt: number;
    unit: string;
    cost?: number;
    specs?: object;
}

interface MaterialImportModalProps {
    visible: boolean;
    materials: Material[];
    sectionName: string;
    requestId: string;
    onClose: () => void;
    onImport: (apiPayload : any) => void;
}

const MaterialImportModal: React.FC<MaterialImportModalProps> = ({
    visible,
    materials,
    sectionName,
    requestId,
    onClose,
    onImport,
}) => {
    const [materialCosts, setMaterialCosts] = useState<{ [key: string]: string }>({});

    const handleCostChange = (materialId: string, cost: string) => {
        // Only allow numbers and decimal point
        const numericValue = cost.replace(/[^0-9.]/g, '');
        setMaterialCosts(prev => ({
            ...prev,
            [materialId]: numericValue
        }));
    };

    const getTotalCost = () => {
        return materials.reduce((total, material) => {
            const cost = parseFloat(materialCosts[material._id] || '0') || 0;
            return total + cost;
        }, 0);
    };

    const getPerUnitCost = (materialId: string, quantity: number) => {
        const totalCost = parseFloat(materialCosts[materialId] || '0') || 0;
        if (totalCost <= 0 || quantity <= 0) return 0;
        return totalCost / quantity;
    };

    const handleImportAll = () => {
        // Validate that all materials have costs entered
        const missingCosts = materials.filter(material => 
            !materialCosts[material._id] || parseFloat(materialCosts[material._id]) <= 0
        );

        if (missingCosts.length > 0) {
            Alert.alert(
                'Missing Costs',
                `Please enter valid costs for all materials:\n${missingCosts.map(m => `• ${m.name}`).join('\n')}`,
                [{ text: 'OK' }]
            );
            return;
        }

        // Create materials with costs
        const materialsWithCosts = materials.map(material => ({
            ...material,
            cost: parseFloat(materialCosts[material._id]) || 0
        }));

        const totalCost = getTotalCost();

        Alert.alert(
            'Confirm Import',
            `Import all materials for ${sectionName}?\n\nTotal Cost: ₹${totalCost.toLocaleString('en-IN')}\n\nMaterials:\n${materialsWithCosts.map(m => `• ${m.name}: ${m.qnt} ${m.unit} - ₹${m.cost.toLocaleString('en-IN')}`).join('\n')}`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Import All',
                    style: 'default',
                    onPress: () => {
                        // Create the API payload according to your backend specification
                        const apiPayload = {
                            requestId: requestId,
                            materials: materialsWithCosts.map(material => ({
                                _id: material._id,
                                name: material.name,
                                unit: material.unit,
                                specs: material.specs || {},
                                qnt: material.qnt,
                                cost: material.cost
                            }))
                        };


                        // Console log the payload as requested
                        console.log('=== MATERIAL IMPORT API PAYLOAD ===');
                        console.log('Request ID:', apiPayload.requestId);
                        console.log('Section:', sectionName);
                        console.log('Total Cost:', totalCost);
                        console.log('Materials Count:', apiPayload.materials.length);
                        console.log('Full API Payload:', JSON.stringify(apiPayload, null, 2));
                        console.log('Materials with Costs:');
                        apiPayload.materials.forEach((material, index) => {
                            const perUnitCost = material.cost / material.qnt;
                            console.log(`${index + 1}. ${material.name}:`);
                            console.log(`   - ID: ${material._id || 'N/A'}`);
                            console.log(`   - Quantity: ${material.qnt} ${material.unit}`);
                            console.log(`   - Total Cost: ₹${material.cost.toLocaleString('en-IN')}`);
                            console.log(`   - Per Unit Cost: ₹${perUnitCost.toFixed(2)}/${material.unit}`);
                            console.log(`   - Specs:`, material.specs);
                        });
                        console.log('===================================');


                        onImport(apiPayload);
                        onClose();
                        
                        // Reset costs for next time
                        setMaterialCosts({});
                    }
                }
            ]
        );
    };

    const handleClose = () => {
        setMaterialCosts({});
        onClose();
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={handleClose}
        >
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={handleClose}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="close" size={24} color="#374151" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Import Materials</Text>
                    <View style={styles.placeholder} />
                </View>

                {/* Section Info */}
                <View style={styles.sectionInfo}>
                    <Text style={styles.sectionTitle}>Section: {sectionName}</Text>
                    <Text style={styles.sectionSubtitle}>Enter the total cost for each material</Text>
                </View>

                {/* Materials List */}
                <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                    <View style={styles.materialsContainer}>
                        {materials.map((material, index) => (
                            <View key={material._id} style={styles.materialItem}>
                                <View style={styles.materialHeader}>
                                    <Text style={styles.materialName}>{material.name}</Text>
                                    <Text style={styles.materialQuantity}>
                                        {material.qnt} {material.unit}
                                    </Text>
                                </View>
                                
                                <View style={styles.costInputContainer}>
                                    <View style={styles.costLabelRow}>
                                        <Text style={styles.costLabel}>Total Cost (₹)</Text>
                                        {materialCosts[material._id] && parseFloat(materialCosts[material._id]) > 0 && (
                                            <Text style={styles.perUnitCost}>
                                                ₹{getPerUnitCost(material._id, material.qnt).toFixed(2)}/{material.unit}
                                            </Text>
                                        )}
                                    </View>
                                    <TextInput
                                        style={styles.costInput}
                                        placeholder="0.00"
                                        placeholderTextColor="#9CA3AF"
                                        value={materialCosts[material._id] || ''}
                                        onChangeText={(text) => handleCostChange(material._id, text)}
                                        keyboardType="decimal-pad"
                                        returnKeyType="next"
                                    />
                                </View>
                            </View>
                        ))}
                    </View>
                </ScrollView>

                {/* Total and Import Button */}
                <View style={styles.footer}>
                    <View style={styles.totalContainer}>
                        <Text style={styles.totalLabel}>Total Cost:</Text>
                        <Text style={styles.totalAmount}>
                            ₹{getTotalCost().toLocaleString('en-IN')}
                        </Text>
                    </View>
                    
                    <TouchableOpacity
                        style={[
                            styles.importButton,
                            getTotalCost() <= 0 && styles.importButtonDisabled
                        ]}
                        onPress={handleImportAll}
                        activeOpacity={0.8}
                        disabled={getTotalCost() <= 0}
                    >
                        <Ionicons 
                            name="checkmark-circle" 
                            size={20} 
                            color={getTotalCost() > 0 ? "#FFFFFF" : "#9CA3AF"} 
                        />
                        <Text style={[
                            styles.importButtonText,
                            getTotalCost() <= 0 && styles.importButtonTextDisabled
                        ]}>
                            Import All Materials
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    closeButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1F2937',
    },
    placeholder: {
        width: 32,
    },
    sectionInfo: {
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: '#F9FAFB',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 4,
    },
    sectionSubtitle: {
        fontSize: 14,
        color: '#6B7280',
    },
    scrollView: {
        flex: 1,
    },
    materialsContainer: {
        padding: 16,
    },
    materialItem: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    materialHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    materialName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        flex: 1,
        marginRight: 8,
    },
    materialQuantity: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500',
    },
    costInputContainer: {
        marginTop: 8,
    },
    costLabelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    costLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
    },
    perUnitCost: {
        fontSize: 12,
        fontWeight: '500',
        color: '#059669',
        backgroundColor: '#F0FDF4',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    costInput: {
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 12,
        fontSize: 16,
        color: '#1F2937',
        backgroundColor: '#FFFFFF',
    },
    footer: {
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        backgroundColor: '#FFFFFF',
    },
    totalContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingHorizontal: 8,
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
    },
    totalAmount: {
        fontSize: 18,
        fontWeight: '700',
        color: '#059669',
    },
    importButton: {
        backgroundColor: '#059669',
        borderRadius: 12,
        paddingVertical: 16,
        paddingHorizontal: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    importButtonDisabled: {
        backgroundColor: '#F3F4F6',
    },
    importButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    importButtonTextDisabled: {
        color: '#9CA3AF',
    },
});

export default MaterialImportModal;