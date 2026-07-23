import { Ionicons } from "@expo/vector-icons"
import { Alert, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native"
import { ScrollView } from "react-native-gesture-handler"
import React from "react"
import { useSimpleNotifications } from '@/hooks/useSimpleNotifications'
import { useAuth } from '@/contexts/AuthContext'

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
  projectName?: string; // Add project name for notifications
}

const AddSectionModal = ({ visible, onClose, onAddSection, projectId, projectName }: AddSectionModalProps) => {
    // State for section type selection
    const [selectedType, setSelectedType] = React.useState<string | null>(null);
    const [sectionTitle, setSectionTitle] = React.useState('');
    const [totalHouses, setTotalHouses] = React.useState('');

    // Notification service
    const { sendProjectNotification } = useSimpleNotifications();
    const { user, clientId } = useAuth();

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

        if (selectedType === "rowhouse") {
            const count = parseInt(totalHouses.trim(), 10);
            if (!totalHouses.trim() || isNaN(count) || count < 1) {
                Alert.alert('Error', 'Please enter how many buildings this row house has (at least 1)');
                return;
            }
        }

        try {
            await onAddSection(
                selectedType,
                sectionTitle.trim(),
                selectedType === 'rowhouse' ? parseInt(totalHouses.trim(), 10) : undefined
            );
            
            // 🔔 Send section creation notification
            try {
                console.log('🔔 Sending section creation notification...');
                
                const notificationSent = await sendProjectNotification({
                    projectId: projectId,
                    clientId: clientId || undefined,
                    activityType: 'section_created',
                    staffName: user?.firstName || user?.name || 'User',
                    projectName: projectName || 'Project',
                    sectionName: sectionTitle.trim(),
                    details: `Created ${selectedType} section "${sectionTitle.trim()}"${selectedType === 'rowhouse' ? ` with ${totalHouses} buildings` : ''}`,
                    performerId: user?._id,
                    performerRole: user?.role,
                    recipientType: 'admins',
                    category: 'section',
                    message: `Section type: ${selectedType}`,
                });

                console.log('🔔 Section creation notification result:', notificationSent);
                
                if (notificationSent) {
                    console.log('✅ Section creation notification sent successfully');
                } else {
                    console.log('⚠️ Section creation notification failed');
                }
            } catch (notificationError: any) {
                console.error('❌ Error sending section creation notification:', notificationError);
                // Don't fail the whole operation if notification fails
            }
            
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
                                <Text style={styles.label}>Number of Buildings *</Text>
                                <TextInput
                                    style={styles.input}
                                    value={totalHouses}
                                    onChangeText={setTotalHouses}
                                    placeholder="e.g. 4 — buildings inside this row house"
                                    keyboardType="numeric"
                                />
                                <Text style={styles.helperNote}>
                                    Building 1…N will be created inside this row house. Each building tracks its own materials, contractors, equipment and costs.
                                </Text>
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
    helperNote: {
        fontSize: 12.5,
        color: '#64748B',
        lineHeight: 18,
        marginTop: -8,
        marginBottom: 16,
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
        borderColor: '#3A78B5',
        backgroundColor: '#EAF0FE',
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
        backgroundColor: '#3A78B5',
        borderColor: '#3A78B5',
    },
    submitButton: {
        backgroundColor: '#3A78B5',
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
