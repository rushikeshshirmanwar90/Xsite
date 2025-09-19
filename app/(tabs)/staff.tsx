// screens/StaffManagement.tsx
import Loading from '@/components/Loading';
import AddStaffModal from '@/components/staff/AddStaffModel';
import StaffHeader from '@/components/staff/StaffHeader';
import StaffList from '@/components/staff/StaffList';
import { addStaff } from '@/functions/staff';
import { domain } from '@/lib/domain';
import { Staff } from '@/types/staff';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import {
    StatusBar,
    StyleSheet
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';

const StaffManagement: React.FC = () => {
    const [staffList, setStaffList] = useState<Staff[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [clientId, setClientId] = useState('');
    const [loading, setLoading] = useState(true);

    // !! fetching clientId
    useEffect(() => {
        const getClientId = async () => {
            try {
                const userDetailsString = await AsyncStorage.getItem("user");
                console.log(userDetailsString);
                const userDetails = userDetailsString ? JSON.parse(userDetailsString) : null;
                setClientId(userDetails?._id || '');
            } catch (error) {
                console.error('Error getting client ID:', error);
            }
        };

        getClientId();
    }, []); // Empty dependency array to run only once


    // !! fetching staff data
    useEffect(() => {
        const fetchStaffData = async () => {
            setLoading(true);
            try {
                const res = await axios.get(`${domain}/api/staff`);
                const data = res.data.data;
                setStaffList(data);
            } catch (error) {
                console.error('Error fetching staff data:', error);
                toast.error('Failed to load staff data');
            } finally {
                setLoading(false);
            }
        };

        fetchStaffData();
    }, []); // Empty dependency array to run only once

    const handleAddStaff = async (newStaff: Staff) => {
        if (!clientId) {
            toast.error('Client ID not found');
            return;
        }

        const payload = {
            ...newStaff,
            clientId: clientId
        };

        console.log(payload);

        try {
            const res = await addStaff(payload);

            if (res) {
                toast.success('Staff Added successfully');
                setShowAddModal(false);
                // Refresh staff list after adding new staff
                const fetchStaffData = async () => {
                    setLoading(true);
                    try {
                        const res = await axios.get(`${domain}/api/staff`);
                        const data = res.data.data;
                        setStaffList(data);
                    } catch (error) {
                        console.error('Error refreshing staff data:', error);
                        toast.error('Failed to refresh staff list');
                    } finally {
                        setLoading(false);
                    }
                };
                fetchStaffData();
            } else {
                toast.error('Something went wrong');
            }
        } catch (error) {
            console.error('Error adding staff:', error);
            toast.error('Failed to add staff');
        }
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

            {loading ? (
                <Loading />
            ) : (
                <StaffList
                    staffData={filteredStaff}
                    hasSearchQuery={searchQuery.length > 0}
                    onStaffPress={handleStaffPress}
                    onAddPress={() => setShowAddModal(true)}
                />
            )}

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



