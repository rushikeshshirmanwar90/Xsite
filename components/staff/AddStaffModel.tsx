// components/AddStaffModal.tsx
import { roles } from '@/data/staff';
import { AddStaffModalProps, Staff } from '@/types/staff';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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

const AddStaffModal: React.FC<AddStaffModalProps> = ({ visible, onClose, onAdd }) => {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('');
    const [showRoleDropdown, setShowRoleDropdown] = useState(false);

    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const validatePhone = (phone: string): boolean => {
        const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,15}$/;
        return phoneRegex.test(phone.replace(/\s/g, ''));
    };

    const handleSubmit = () => {
        if (!firstName.trim()) {
            Alert.alert('Error', 'Please enter first name');
            return;
        }
        if (!lastName.trim()) {
            Alert.alert('Error', 'Please enter last name');
            return;
        }
        if (!phoneNumber.trim()) {
            Alert.alert('Error', 'Please enter phone number');
            return;
        }
        if (!validatePhone(phoneNumber)) {
            Alert.alert('Error', 'Please enter a valid phone number');
            return;
        }
        if (!email.trim()) {
            Alert.alert('Error', 'Please enter email address');
            return;
        }
        if (!validateEmail(email)) {
            Alert.alert('Error', 'Please enter a valid email address');
            return;
        }
        if (!role) {
            Alert.alert('Error', 'Please select a role');
            return;
        }

        const newStaff: Staff = {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            phoneNumber: phoneNumber.trim(),
            email: email.trim().toLowerCase(),
            role,
            assignedProjects: [] // This will be an empty array of ProjectAssignment objects
        };

        console.log(newStaff)

        onAdd(newStaff);
        resetForm();
        onClose();
    };

    const resetForm = () => {
        setFirstName('');
        setLastName('');
        setPhoneNumber('');
        setEmail('');
        setRole('');
        setShowRoleDropdown(false);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Add New Staff Member</Text>
                        <TouchableOpacity onPress={handleClose}>
                            <Ionicons name="close" size={24} color="#374151" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>First Name *</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="person-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    value={firstName}
                                    onChangeText={setFirstName}
                                    placeholder="Enter first name"
                                    placeholderTextColor="#9CA3AF"
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Last Name *</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="person-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    value={lastName}
                                    onChangeText={setLastName}
                                    placeholder="Enter last name"
                                    placeholderTextColor="#9CA3AF"
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Phone Number *</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="call-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    value={phoneNumber}
                                    onChangeText={setPhoneNumber}
                                    placeholder="+91 98765 43210"
                                    placeholderTextColor="#9CA3AF"
                                    keyboardType="phone-pad"
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Email Address *</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="mail-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    value={email}
                                    onChangeText={setEmail}
                                    placeholder="name@company.com"
                                    placeholderTextColor="#9CA3AF"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Role *</Text>
                            <TouchableOpacity
                                style={styles.dropdown}
                                onPress={() => setShowRoleDropdown(!showRoleDropdown)}
                            >
                                <Ionicons name="briefcase-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                                <Text style={role ? styles.dropdownText : styles.dropdownPlaceholder}>
                                    {role || 'Select role'}
                                </Text>
                                <Ionicons
                                    name={showRoleDropdown ? "chevron-up" : "chevron-down"}
                                    size={20}
                                    color="#6B7280"
                                />
                            </TouchableOpacity>

                            {showRoleDropdown && (
                                <View style={styles.dropdownList}>
                                    <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                                        {roles.map((roleOption, index) => (
                                            <TouchableOpacity
                                                key={index}
                                                style={[
                                                    styles.dropdownItem,
                                                    role === roleOption && styles.selectedDropdownItem
                                                ]}
                                                onPress={() => {
                                                    setRole(roleOption);
                                                    setShowRoleDropdown(false);
                                                }}
                                            >
                                                <Text style={[
                                                    styles.dropdownItemText,
                                                    role === roleOption && styles.selectedDropdownItemText
                                                ]}>
                                                    {roleOption}
                                                </Text>
                                                {role === roleOption && (
                                                    <Ionicons name="checkmark" size={16} color="#3B82F6" />
                                                )}
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>
                            )}
                        </View>
                    </ScrollView>

                    <View style={styles.modalActions}>
                        <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                            <LinearGradient
                                colors={['#3B82F6', '#8B5CF6']}
                                style={styles.submitButtonGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                <Ionicons name="add" size={18} color="white" />
                                <Text style={styles.submitButtonText}>Add Staff</Text>
                            </LinearGradient>
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
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: 'white',
        margin: 20,
        borderRadius: 16,
        width: '90%',
        maxHeight: '85%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
    },
    form: {
        paddingHorizontal: 20,
        maxHeight: 400,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 48,
    },
    inputIcon: {
        marginRight: 8,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#111827',
    },
    dropdown: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 48,
    },
    dropdownText: {
        flex: 1,
        fontSize: 16,
        color: '#111827',
    },
    dropdownPlaceholder: {
        flex: 1,
        fontSize: 16,
        color: '#9CA3AF',
    },
    dropdownList: {
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        marginTop: 4,
        maxHeight: 200,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 8,
    },
    dropdownScroll: {
        maxHeight: 200,
    },
    dropdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    selectedDropdownItem: {
        backgroundColor: '#EBF8FF',
    },
    dropdownItemText: {
        fontSize: 16,
        color: '#374151',
        flex: 1,
    },
    selectedDropdownItemText: {
        color: '#1E40AF',
        fontWeight: '500',
    },
    modalActions: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 20,
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#E5E7EB',
        alignItems: 'center',
        backgroundColor: 'white',
    },
    cancelButtonText: {
        fontSize: 16,
        color: '#6B7280',
        fontWeight: '600',
    },
    submitButton: {
        flex: 1,
        borderRadius: 12,
    },
    submitButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
    },
    submitButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 6,
    },
});

export default AddStaffModal;