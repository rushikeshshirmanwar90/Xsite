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
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

const AddProjectModal: React.FC<AddProjectModalProps> = ({ visible, onClose, onAdd, staffMembers }) => {
    const [projectName, setProjectName] = useState('');
    const [projectAddress, setProjectAddress] = useState('');
    const [projectDescription, setProjectDescription] = useState('');
    const [estimatedBudget, setEstimatedBudget] = useState('');
    const [assignedTo, setAssignedTo] = useState<StaffMembers[]>([]);

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

    const handleSubmit = () => {
        if (projectName && projectAddress && assignedTo.length > 0 && estimatedBudget) {
            // Validate budget is a valid number
            const budgetNumber = parseFloat(estimatedBudget);
            if (isNaN(budgetNumber) || budgetNumber <= 0) {
                Alert.alert('Error', 'Please enter a valid budget amount');
                return;
            }

            const newProject: Project = {
                name: projectName,
                address: projectAddress,
                assignedStaff: assignedTo,
                description: projectDescription,
                budget: budgetNumber
            };

            console.log(newProject);

            onAdd(newProject);
            // Reset all fields
            setProjectName('');
            setProjectAddress('');
            setProjectDescription('');
            setEstimatedBudget('');
            setAssignedTo([]);
            onClose();
        } else {
            Alert.alert('Error', 'Please fill all required fields and assign at least one staff member');
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

                    <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
                        <Text style={styles.label}>Project Name *</Text>
                        <TextInput
                            style={styles.input}
                            value={projectName}
                            onChangeText={setProjectName}
                            placeholder="Enter project name"
                            placeholderTextColor="#9CA3AF"
                        />

                        <Text style={styles.label}>Project Address *</Text>
                        <TextInput
                            style={styles.input}
                            value={projectAddress}
                            onChangeText={setProjectAddress}
                            placeholder="Enter project address"
                            placeholderTextColor="#9CA3AF"
                            multiline
                            numberOfLines={2}
                        />

                        <Text style={styles.label}>Project Description</Text>
                        <TextInput
                            style={styles.input}
                            value={projectDescription}
                            onChangeText={setProjectDescription}
                            placeholder="Enter project description"
                            placeholderTextColor="#9CA3AF"
                            multiline
                            numberOfLines={2}
                        />

                        <Text style={styles.label}>Estimated Budget *</Text>
                        <TextInput
                            style={styles.input}
                            value={estimatedBudget}
                            onChangeText={setEstimatedBudget}
                            placeholder="Enter estimated budget"
                            placeholderTextColor="#9CA3AF"
                            keyboardType="numeric"
                        />

                        <Text style={styles.label}>Assign Staff *</Text>
                        <View style={styles.staffContainer}>
                            {staffMembers.map((staff: StaffMembers) => (
                                <TouchableOpacity
                                    key={staff._id}
                                    style={styles.staffItem}
                                    onPress={() => handleStaffSelection(staff)}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.staffItemContent}>
                                        <View style={[
                                            styles.checkbox,
                                            isStaffSelected(staff) && styles.checkboxSelected
                                        ]}>
                                            {isStaffSelected(staff) && (
                                                <Ionicons name="checkmark" size={18} color="#fff" />
                                            )}
                                        </View>
                                        <View style={styles.staffInfo}>
                                            <Text style={styles.staffName}>
                                                {staff.fullName}
                                            </Text>
                                            <Text style={styles.staffStatus}>
                                                {isStaffSelected(staff) ? 'Assigned' : 'Available'}
                                            </Text>
                                        </View>
                                        <View style={[
                                            styles.selectionIndicator,
                                            isStaffSelected(staff) && styles.selectionIndicatorSelected
                                        ]}>
                                            <Ionicons
                                                name={isStaffSelected(staff) ? "checkmark-circle" : "ellipse-outline"}
                                                size={24}
                                                color={isStaffSelected(staff) ? "#10B981" : "#D1D5DB"}
                                            />
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            ))}
                            {staffMembers.length === 0 && (
                                <View style={styles.noStaffContainer}>
                                    <Ionicons name="people-outline" size={32} color="#9CA3AF" />
                                    <Text style={styles.noStaffText}>No staff members available</Text>
                                    <Text style={styles.noStaffSubText}>Please add staff members first</Text>
                                </View>
                            )}
                        </View>
                    </ScrollView>

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