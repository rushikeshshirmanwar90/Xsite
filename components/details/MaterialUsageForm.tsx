import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import React, { useState } from 'react';
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
    onSubmit: (sectionId: string, materialId: string, quantity: number) => void;
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
    const [selectedSectionId, setSelectedSectionId] = useState<string>('');
    const [selectedMaterialId, setSelectedMaterialId] = useState<string>('');
    const [quantity, setQuantity] = useState<string>('');

    const handleSubmit = () => {
        if (!selectedSectionId) {
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

        onSubmit(selectedSectionId, selectedMaterialId, parseFloat(quantity));
        handleClose();
    };

    const handleClose = () => {
        setSelectedSectionId('');
        setSelectedMaterialId('');
        setQuantity('');
        onClose();
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
                                <Text style={styles.title}>Add Material Usage</Text>
                                <Text style={styles.subtitle}>Move material to used section</Text>
                            </View>
                        </View>
                        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color="#64748B" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
                        {/* Mini-Section Selector */}
                        <View style={styles.fieldContainer}>
                            <Text style={styles.label}>
                                Select Mini-Section <Text style={styles.required}>*</Text>
                            </Text>
                            <View style={styles.pickerContainer}>
                                <Picker
                                    selectedValue={selectedSectionId}
                                    onValueChange={(value) => setSelectedSectionId(value)}
                                    style={styles.picker}
                                >
                                    <Picker.Item label="Choose a section..." value="" />
                                    {miniSections.map((section) => (
                                        <Picker.Item
                                            key={section._id}
                                            label={section.name}
                                            value={section._id}
                                        />
                                    ))}
                                </Picker>
                            </View>
                            {miniSections.length === 0 && (
                                <Text style={styles.helperText}>
                                    ⚠️ No mini-sections available. Please create one first.
                                </Text>
                            )}
                        </View>

                        {/* Material Selector */}
                        <View style={styles.fieldContainer}>
                            <Text style={styles.label}>
                                Select Material <Text style={styles.required}>*</Text>
                            </Text>
                            <View style={styles.pickerContainer}>
                                <Picker
                                    selectedValue={selectedMaterialId}
                                    onValueChange={(value) => setSelectedMaterialId(value)}
                                    style={styles.picker}
                                >
                                    <Picker.Item label="Choose a material..." value="" />
                                    {availableMaterials.map((material) => (
                                        <Picker.Item
                                            key={material._id || material.id}
                                            label={`${material.name} (${material.quantity} ${material.unit} available)`}
                                            value={material._id || material.id.toString()}
                                        />
                                    ))}
                                </Picker>
                            </View>
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
                                        {Object.entries(selectedMaterial.specs).map(([key, value]) => (
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
                            <Text style={styles.label}>
                                Quantity to Use <Text style={styles.required}>*</Text>
                            </Text>
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
                                (!selectedSectionId || !selectedMaterialId || !quantity) && styles.submitButtonDisabled
                            ]}
                            onPress={handleSubmit}
                            disabled={!selectedSectionId || !selectedMaterialId || !quantity}
                        >
                            <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                            <Text style={styles.submitButtonText}>Add Usage</Text>
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
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#334155',
        marginBottom: 8,
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
    helperText: {
        fontSize: 12,
        color: '#F59E0B',
        marginTop: 6,
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
