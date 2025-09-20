import styles from '@/style/project';
import { Project } from '@/types/project';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Alert, Modal, Text, TextInput, TouchableOpacity, View } from 'react-native';

const staffMembers: string[] = [
    "Rajesh Kumar",
    "Priya Sharma",
    "Amit Patel",
    "Sneha Reddy",
    "Vikram Singh",
    "Kavya Nair",
    "Rohit Gupta"
];

interface AddProjectModalProps {
    visible: boolean;
    onClose: () => void;
    onAdd: (project: Omit<Project, 'id'>) => void;
}

const AddProjectModal: React.FC<AddProjectModalProps> = ({ visible, onClose, onAdd }) => {
    const [projectName, setProjectName] = useState('');
    const [projectAddress, setProjectAddress] = useState('');
    const [assignedTo, setAssignedTo] = useState('');
    const [showStaffDropdown, setShowStaffDropdown] = useState(false);

    const handleSubmit = () => {
        if (projectName && projectAddress && assignedTo) {
            const newProject: Omit<Project, 'id'> = {
                name: projectName,
                address: projectAddress,
                assignedStaff: assignedTo,
                status: 'planning',
                startDate: new Date().toISOString().split('T')[0],
                endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                progress: 0,
                totalMaterials: 0,
                materialsReceived: 0,
                materialsIssued: 0,
                recentActivities: []
            };
            onAdd(newProject);
            setProjectName('');
            setProjectAddress('');
            setAssignedTo('');
            onClose();
        } else {
            Alert.alert('Error', 'Please fill all fields');
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Add New Project</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color="#374151" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.form}>
                        <Text style={styles.label}>Project Name</Text>
                        <TextInput
                            style={styles.input}
                            value={projectName}
                            onChangeText={setProjectName}
                            placeholder="Enter project name"
                        />

                        <Text style={styles.label}>Project Address</Text>
                        <TextInput
                            style={styles.input}
                            value={projectAddress}
                            onChangeText={setProjectAddress}
                            placeholder="Enter project address"
                            multiline
                            numberOfLines={2}
                        />

                        <Text style={styles.label}>Assign To</Text>
                        <TouchableOpacity
                            style={styles.dropdown}
                            onPress={() => setShowStaffDropdown(!showStaffDropdown)}
                        >
                            <Text style={assignedTo ? styles.dropdownText : styles.dropdownPlaceholder}>
                                {assignedTo || 'Select staff member'}
                            </Text>
                            <Ionicons name="chevron-down" size={20} color="#6B7280" />
                        </TouchableOpacity>

                        {showStaffDropdown && (
                            <View style={styles.dropdownList}>
                                {staffMembers.map((staff, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={styles.dropdownItem}
                                        onPress={() => {
                                            setAssignedTo(staff);
                                            setShowStaffDropdown(false);
                                        }}
                                    >
                                        <Text style={styles.dropdownItemText}>{staff}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>

                    <View style={styles.modalActions}>
                        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.addButton} onPress={handleSubmit}>
                            <LinearGradient
                                colors={['#3B82F6', '#8B5CF6']}
                                style={styles.addButtonGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                <Text style={styles.addButtonText}>Add Project</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

export default AddProjectModal;