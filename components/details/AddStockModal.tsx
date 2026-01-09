import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface AddStockModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (materialName: string, unit: string, specs: Record<string, any>, quantity: number, cost: number, mergeIfExists: boolean) => void;
    existingMaterials?: { name: string; unit: string; specs: Record<string, any> }[];
}

const AddStockModal: React.FC<AddStockModalProps> = ({
    visible,
    onClose,
    onSubmit,
    existingMaterials = []
}) => {
    const [materialName, setMaterialName] = useState('');
    const [unit, setUnit] = useState('');
    const [quantity, setQuantity] = useState('');
    const [cost, setCost] = useState('');
    const [specs, setSpecs] = useState('');
    const [mergeIfExists, setMergeIfExists] = useState(true);

    const handleSubmit = () => {
        if (!materialName || !unit || !quantity || !cost) {
            alert('Please fill all required fields');
            return;
        }

        const qnt = parseFloat(quantity);
        const costValue = parseFloat(cost);

        if (qnt <= 0 || costValue < 0) {
            alert('Please enter valid quantity and cost');
            return;
        }

        // Parse specs (simple key:value format)
        let specsObj: Record<string, any> = {};
        if (specs.trim()) {
            try {
                // Support format: "diameter:18mm, grade:Fe500"
                specs.split(',').forEach(pair => {
                    const [key, value] = pair.split(':').map(s => s.trim());
                    if (key && value) {
                        specsObj[key] = value;
                    }
                });
            } catch (e) {
                console.error('Error parsing specs:', e);
            }
        }

        onSubmit(materialName, unit, specsObj, qnt, costValue, mergeIfExists);
        
        // Reset form
        setMaterialName('');
        setUnit('');
        setQuantity('');
        setCost('');
        setSpecs('');
        setMergeIfExists(true);
    };

    const handleClose = () => {
        setMaterialName('');
        setUnit('');
        setQuantity('');
        setCost('');
        setSpecs('');
        setMergeIfExists(true);
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
                    <TouchableOpacity onPress={handleClose}>
                        <Ionicons name="close" size={24} color="#374151" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Add Material Stock</Text>
                    <View style={{ width: 24 }} />
                </View>

                <ScrollView style={styles.content}>
                    {/* Material Name */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Material Name *</Text>
                        <TextInput
                            style={styles.input}
                            value={materialName}
                            onChangeText={setMaterialName}
                            placeholder="e.g., Steel Rod, Cement, Brick"
                            placeholderTextColor="#9CA3AF"
                        />
                    </View>

                    {/* Unit */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Unit *</Text>
                        <TextInput
                            style={styles.input}
                            value={unit}
                            onChangeText={setUnit}
                            placeholder="e.g., kg, bags, pieces"
                            placeholderTextColor="#9CA3AF"
                        />
                    </View>

                    {/* Specifications */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Specifications (Optional)</Text>
                        <TextInput
                            style={styles.input}
                            value={specs}
                            onChangeText={setSpecs}
                            placeholder="e.g., diameter:18mm, grade:Fe500"
                            placeholderTextColor="#9CA3AF"
                            multiline
                        />
                        <Text style={styles.hint}>Format: key:value, key:value</Text>
                    </View>

                    {/* Quantity */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Quantity *</Text>
                        <TextInput
                            style={styles.input}
                            value={quantity}
                            onChangeText={setQuantity}
                            placeholder="Enter quantity"
                            placeholderTextColor="#9CA3AF"
                            keyboardType="decimal-pad"
                        />
                    </View>

                    {/* Cost */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Total Cost (₹) *</Text>
                        <TextInput
                            style={styles.input}
                            value={cost}
                            onChangeText={setCost}
                            placeholder="Enter total cost"
                            placeholderTextColor="#9CA3AF"
                            keyboardType="decimal-pad"
                        />
                    </View>

                    {/* Merge Option */}
                    <View style={styles.switchGroup}>
                        <View style={styles.switchInfo}>
                            <Text style={styles.switchLabel}>Merge with Existing Material</Text>
                            <Text style={styles.switchDescription}>
                                If enabled, quantity will be added to existing material with same specs. 
                                If disabled, creates a new batch.
                            </Text>
                        </View>
                        <Switch
                            value={mergeIfExists}
                            onValueChange={setMergeIfExists}
                            trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
                            thumbColor={mergeIfExists ? '#059669' : '#F3F4F6'}
                        />
                    </View>

                    {/* Info Box */}
                    <View style={styles.infoBox}>
                        <Ionicons name="information-circle" size={20} color="#3B82F6" />
                        <Text style={styles.infoText}>
                            {mergeIfExists 
                                ? 'Quantity will be added to existing material if specs match'
                                : 'A new batch will be created even if similar material exists'}
                        </Text>
                    </View>

                    {/* Submit Button */}
                    <TouchableOpacity
                        style={styles.submitButton}
                        onPress={handleSubmit}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="add-circle" size={20} color="#FFFFFF" />
                        <Text style={styles.submitButtonText}>Add Material Stock</Text>
                    </TouchableOpacity>
                </ScrollView>
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
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1F2937',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: '#1F2937',
        backgroundColor: '#FFFFFF',
    },
    hint: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 4,
    },
    switchGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F9FAFB',
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
    },
    switchInfo: {
        flex: 1,
        marginRight: 12,
    },
    switchLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 4,
    },
    switchDescription: {
        fontSize: 12,
        color: '#6B7280',
        lineHeight: 16,
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#EFF6FF',
        padding: 12,
        borderRadius: 8,
        marginBottom: 24,
        gap: 8,
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        color: '#1E40AF',
        lineHeight: 18,
    },
    submitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#059669',
        paddingVertical: 16,
        borderRadius: 12,
        gap: 8,
        marginBottom: 32,
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});

export default AddStockModal;
