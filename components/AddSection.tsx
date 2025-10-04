import { Ionicons } from "@expo/vector-icons"
import { Alert, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native"
import { ScrollView } from "react-native-gesture-handler"
import React from "react"

// Define the section type interface
interface SectionType {
  id: string;
  label: string;
}

// Define props interface for the component
interface AddSectionModalProps {
  visible: boolean;
  onClose: () => void;
  onAddSection: (type: string, title: string, totalHouses?: number) => Promise<void>;
  projectId: string;
}

const AddSectionModal = ({ visible, onClose, onAddSection, projectId }: AddSectionModalProps) => {
    // State for section type selection
    const [selectedType, setSelectedType] = React.useState<string | null>(null);
    const [sectionTitle, setSectionTitle] = React.useState('');
    const [totalHouses, setTotalHouses] = React.useState('');

    // Section types
    const sectionTypes: SectionType[] = [
        { id: 'building', label: 'Building' },
        { id: 'rowhouse', label: 'Row House' },
        { id: 'other', label: 'Other' }
    ];

    // Handle form submission
    const handleSubmit = async () => {
        if (!selectedType || !sectionTitle.trim()) {
            Alert.alert('Error', 'Please select a section type and enter a title');
            return;
        }

        if (selectedType === "rowhouse" && !totalHouses.trim()) {
            Alert.alert('Error', 'Please enter the total number of houses');
            return;
        }

        try {
            await onAddSection(
                selectedType, 
                sectionTitle.trim(), 
                selectedType === 'rowhouse' ? parseInt(totalHouses.trim()) : undefined
            );
            
            // Reset form
            resetForm();
        } catch (error) {
            Alert.alert('Error', 'Failed to add section. Please try again.');
        }
    };

    // Reset form fields
    const resetForm = () => {
        setSelectedType(null);
        setSectionTitle('');
        setTotalHouses('');
    };

    // Close modal and reset form
    const handleClose = () => {
        resetForm();
        onClose();
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Add New Section</Text>
                        <TouchableOpacity onPress={handleClose}>
                            <Ionicons name="close" size={24} color="#374151" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
                        <Text style={styles.label}>Section Type *</Text>
                        <View style={styles.typeContainer}>
                            {sectionTypes.map((type) => (
                                <TouchableOpacity
                                    key={type.id}
                                    style={[
                                        styles.typeItem,
                                        selectedType === type.id && styles.typeItemSelected
                                    ]}
                                    onPress={() => setSelectedType(type.id)}
                                >
                                    <View style={styles.typeItemContent}>
                                        <View style={[
                                            styles.checkbox,
                                            selectedType === type.id && styles.checkboxSelected
                                        ]}>
                                            {selectedType === type.id && (
                                                <Ionicons name="checkmark" size={18} color="#fff" />
                                            )}
                                        </View>
                                        <Text style={styles.typeLabel}>{type.label}</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.label}>Section Title *</Text>
                        <TextInput
                            style={styles.input}
                            value={sectionTitle}
                            onChangeText={setSectionTitle}
                            placeholder="Enter section title"
                        />

                        {selectedType === 'rowhouse' && (
                            <>
                                <Text style={styles.label}>Total Houses *</Text>
                                <TextInput
                                    style={styles.input}
                                    value={totalHouses}
                                    onChangeText={setTotalHouses}
                                    placeholder="Enter total number of houses"
                                    keyboardType="numeric"
                                />
                            </>
                        )}

                        <TouchableOpacity
                            style={styles.submitButton}
                            onPress={handleSubmit}
                        >
                            <Text style={styles.submitButtonText}>Add Section</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

// Styles for the component
const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 12,
        width: '100%',
        maxHeight: '80%',
        padding: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
    },
    form: {
        maxHeight: 400,
    },
    label: {
        fontSize: 16,
        fontWeight: '500',
        color: '#374151',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    typeContainer: {
        marginBottom: 16,
    },
    typeItem: {
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    typeItemSelected: {
        borderColor: '#3B82F6',
        backgroundColor: '#EFF6FF',
    },
    typeItemContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    typeLabel: {
        fontSize: 16,
        color: '#374151',
        marginLeft: 12,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#D1D5DB',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    checkboxSelected: {
        backgroundColor: '#3B82F6',
        borderColor: '#3B82F6',
    },
    submitButton: {
        backgroundColor: '#3B82F6',
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
        marginTop: 16,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default AddSectionModal;
