// App.tsx
import { styles } from "@/style/adminHome";
import { Project } from '@/types/project';
import { AddProjectModalProps, StaffMembers } from '@/types/staff';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';

import {
    Alert,
    Modal,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

const AddProjectModal: React.FC<AddProjectModalProps> = ({ visible, onClose, onAdd, staffMembers }) => {
    const [projectName, setProjectName] = useState('');
    const [projectAddress, setProjectAddress] = useState('');
    const [projectDescription, setProjectDescription] = useState('');
    const [assignedTo, setAssignedTo] = useState<StaffMembers[]>([]);
    const [showStaffDropdown, setShowStaffDropdown] = useState(false);

    const handleStaffSelection = (staff: StaffMembers) => {
        const isSelected = assignedTo.some(member => member._id === staff._id);

        if (isSelected) {
            // Remove staff member
            setAssignedTo(assignedTo.filter(member => member._id !== staff._id));
        } else {
            // Add staff member
            setAssignedTo([...assignedTo, staff]);
        }
    };

    const isStaffSelected = (staff: StaffMembers) => {
        return assignedTo.some(member => member._id === staff._id);
    };

    const getSelectedStaffText = () => {
        if (assignedTo.length === 0) return 'Select staff members';
        if (assignedTo.length === 1) return assignedTo[0].fullName;
        if (assignedTo.length === 2) return `${assignedTo[0].fullName} and ${assignedTo[1].fullName}`;
        return `${assignedTo[0].fullName} and ${assignedTo.length - 1} others`;
    };

    const handleSubmit = () => {
        if (projectName && projectAddress && assignedTo.length > 0) {
            const newProject: Project = {
                name: projectName,
                address: projectAddress,
                assignedStaff: assignedTo,
                description: projectDescription
            };

            console.log(newProject)

            onAdd(newProject);
            setProjectName('');
            setProjectAddress('');
            setProjectDescription('');
            setAssignedTo([]);
            onClose();
        } else {
            Alert.alert('Error', 'Please fill all fields and assign at least one staff member');
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

                        <Text style={styles.label}>Project Description</Text>
                        <TextInput
                            style={styles.input}
                            value={projectDescription}
                            onChangeText={setProjectDescription}
                            placeholder="Enter project description"
                            multiline
                            numberOfLines={2}
                        />

                        <Text style={styles.label}>Assign To</Text>
                        <TouchableOpacity
                            style={styles.dropdown}
                            onPress={() => setShowStaffDropdown(!showStaffDropdown)}
                        >
                            <Text style={assignedTo.length > 0 ? styles.dropdownText : styles.dropdownPlaceholder}>
                                {getSelectedStaffText()}
                            </Text>
                            <Ionicons name="chevron-down" size={20} color="#6B7280" />
                        </TouchableOpacity>

                        {showStaffDropdown && (
                            <View style={styles.dropdownList}>
                                {staffMembers.map((staff: StaffMembers) => (
                                    <TouchableOpacity
                                        key={staff._id}
                                        style={styles.dropdownItem}
                                        onPress={() => handleStaffSelection(staff)}
                                    >
                                        <View style={styles.checkboxContainer}>
                                            <View style={[
                                                styles.checkbox,
                                                isStaffSelected(staff) && styles.checkboxSelected
                                            ]}>
                                                {isStaffSelected(staff) && (
                                                    <Ionicons name="checkmark" size={16} color="#fff" />
                                                )}
                                            </View>
                                            <Text style={styles.dropdownItemText} numberOfLines={1} ellipsizeMode="tail">
                                                {staff.fullName}
                                            </Text>
                                        </View>
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