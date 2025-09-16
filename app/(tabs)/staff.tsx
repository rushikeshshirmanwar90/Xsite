// screens/StaffManagement.tsx
import AddStaffModal from '@/components/staff/AddStaffModel';
import StaffHeader from '@/components/staff/StaffHeader';
import StaffList from '@/components/staff/StaffList';
import { dummyStaff } from '@/data/staff';
import { Staff } from '@/types/staff';
import React, { useState } from 'react';
import {
    Alert,
    StatusBar,
    StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const StaffManagement: React.FC = () => {
    const [staffList, setStaffList] = useState<Staff[]>(dummyStaff);
    const [showAddModal, setShowAddModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const handleAddStaff = (newStaff: Omit<Staff, 'id'>) => {
        const staffWithId: Staff = {
            ...newStaff,
            id: Math.max(...staffList.map(s => s.id), 0) + 1
        };
        setStaffList([...staffList, staffWithId]);
        Alert.alert('Success', 'Staff member added successfully!');
    };

    const handleStaffPress = (staff: Staff) => {
        // Handle staff card press - could navigate to detail view
        console.log('Staff selected:', `${staff.firstName} ${staff.lastName}`);
        // You can implement navigation to staff detail screen here
    };

    const filteredStaff = staffList.filter(staff => {
        const fullName = `${staff.firstName} ${staff.lastName}`.toLowerCase();
        const query = searchQuery.toLowerCase();
        return (
            fullName.includes(query) ||
            staff.email.toLowerCase().includes(query) ||
            staff.role.toLowerCase().includes(query)
        );
    });

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

            <StaffHeader
                staffCount={staffList.length}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onAddPress={() => setShowAddModal(true)}
            />

            <StaffList
                staffData={filteredStaff}
                hasSearchQuery={searchQuery.length > 0}
                onStaffPress={handleStaffPress}
                onAddPress={() => setShowAddModal(true)}
            />

            <AddStaffModal
                visible={showAddModal}
                onClose={() => setShowAddModal(false)}
                onAdd={handleAddStaff}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
});

export default StaffManagement;