// screens/StaffManagement.tsx
import Loading from '@/components/Loading';
import AddStaffModal from '@/components/staff/AddStaffModel';
import StaffHeader from '@/components/staff/StaffHeader';
import StaffList from '@/components/staff/StaffList';
import AdminCard from '@/components/staff/AdminCard';
import { getClientId } from '@/functions/clientId';
import { addStaff } from '@/functions/staff';
import { isAdmin, useUser } from '@/hooks/useUser';
import { domain } from '@/lib/domain';
import { Staff } from '@/types/staff';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';

interface Admin {
    _id?: string;
    firstName: string;
    lastName: string;
    phoneNumber: number;
    email: string;
    clientId?: string;
}

const StaffManagement: React.FC = () => {
    const [staffList, setStaffList] = useState<Staff[]>([]);
    const [adminList, setAdminList] = useState<Admin[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [clientId, setClientId] = useState('');
    const [loading, setLoading] = useState(true);

    // Get user role for access control
    const { user } = useUser();
    const userIsAdmin = isAdmin(user);
    
    // Router for navigation
    const router = useRouter();

    // !! fetching clientId
    useEffect(() => {
        const fetchClientId = async () => {
            const id = await getClientId();
            setClientId(id)
        }
        fetchClientId()
    }, []); // Empty dependency array to run only once


    // !! fetching staff and admin data
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch both staff and admin data in parallel
                const [staffRes, adminRes] = await Promise.all([
                    axios.get(`${domain}/api/staff`),
                    axios.get(`${domain}/api/admin?clientId=${clientId}`)
                ]);
                
                const staffData = staffRes.data.data;
                const adminData = adminRes.data.data;
                
                setStaffList(staffData);
                // Handle admin data - could be single admin or array
                if (Array.isArray(adminData)) {
                    setAdminList(adminData);
                } else if (adminData) {
                    setAdminList([adminData]);
                } else {
                    setAdminList([]);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
                toast.error('Failed to load staff and admin data');
            } finally {
                setLoading(false);
            }
        };

        if (clientId) {
            fetchData();
        }
    }, [clientId]); // Depend on clientId

    const handleAddStaff = async (newStaff: Staff) => {
        // Check if user is admin
        if (!userIsAdmin) {
            toast.error('Only admins can add staff members');
            return;
        }

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
                // Refresh staff and admin list after adding new staff
                const refreshData = async () => {
                    setLoading(true);
                    try {
                        const [staffRes, adminRes] = await Promise.all([
                            axios.get(`${domain}/api/staff`),
                            axios.get(`${domain}/api/admin?clientId=${clientId}`)
                        ]);
                        
                        const staffData = staffRes.data.data;
                        const adminData = adminRes.data.data;
                        
                        setStaffList(staffData);
                        if (Array.isArray(adminData)) {
                            setAdminList(adminData);
                        } else if (adminData) {
                            setAdminList([adminData]);
                        } else {
                            setAdminList([]);
                        }
                    } catch (error) {
                        console.error('Error refreshing data:', error);
                        toast.error('Failed to refresh data');
                    } finally {
                        setLoading(false);
                    }
                };
                refreshData();
            } else {
                toast.error('Something went wrong');
            }
        } catch (error) {
            console.error('Error adding staff:', error);
            toast.error('Failed to add staff');
        }
    };

    const handleStaffPress = (staff: Staff) => {
        // Navigate to staff detail page with staff data
        console.log('Staff selected:', `${staff.firstName} ${staff.lastName}`);
        
        // Navigate to staff detail screen with staff data as params
        router.push({
            pathname: '/staff-detail',
            params: {
                staff: JSON.stringify(staff)
            }
        });
    };

    const filteredStaff = staffList.filter(staff => {
        // Exclude current logged-in user
        if (user && (staff._id === user._id || staff.email === user.email)) {
            return false;
        }
        
        const fullName = `${staff.firstName} ${staff.lastName}`.toLowerCase();
        const query = searchQuery.toLowerCase();
        return (
            fullName.includes(query) ||
            staff.email.toLowerCase().includes(query) ||
            staff.role.toLowerCase().includes(query)
        );
    });

    const filteredAdmins = adminList.filter(admin => {
        // Exclude current logged-in user
        if (user && (admin._id === user._id || admin.email === user.email)) {
            return false;
        }
        
        const fullName = `${admin.firstName} ${admin.lastName}`.toLowerCase();
        const query = searchQuery.toLowerCase();
        return (
            fullName.includes(query) ||
            admin.email.toLowerCase().includes(query)
        );
    });

    const handleAdminPress = (admin: Admin) => {
        console.log('Admin selected:', `${admin.firstName} ${admin.lastName}`);
        // You can add navigation to admin detail page here if needed
        toast.success(`Admin: ${admin.firstName} ${admin.lastName}`);
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

            <StaffHeader
                staffCount={staffList.length}
                adminCount={adminList.length}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onAddPress={() => setShowAddModal(true)}
                isAdmin={userIsAdmin}
            />

            {loading ? (
                <Loading />
            ) : (
                <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                    {/* Admins Section */}
                    {filteredAdmins.length > 0 && (
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <View style={styles.sectionTitleContainer}>
                                    <Ionicons name="shield-checkmark" size={20} color="#F59E0B" />
                                    <Text style={styles.sectionTitle}>Administrators</Text>
                                </View>
                                <Text style={styles.sectionCount}>
                                    {filteredAdmins.length} admin{filteredAdmins.length !== 1 ? 's' : ''}
                                </Text>
                            </View>
                            <View style={[styles.sectionContent, styles.adminContainer]}>
                                {filteredAdmins.map((admin) => (
                                    <AdminCard
                                        key={admin._id}
                                        admin={admin}
                                        onPress={() => handleAdminPress(admin)}
                                    />
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Staff Section */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionTitleContainer}>
                                <Ionicons name="people" size={20} color="#3B82F6" />
                                <Text style={styles.sectionTitle}>Staff Members</Text>
                            </View>
                            <Text style={styles.sectionCount}>
                                {filteredStaff.length} staff member{filteredStaff.length !== 1 ? 's' : ''}
                            </Text>
                        </View>
                        <View style={styles.sectionContent}>
                            <StaffList
                                staffData={filteredStaff}
                                hasSearchQuery={searchQuery.length > 0}
                                onStaffPress={handleStaffPress}
                                onAddPress={() => setShowAddModal(true)}
                            />
                        </View>
                    </View>
                </ScrollView>
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
    scrollView: {
        flex: 1,
    },
    section: {
        marginBottom: 8,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 8,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    sectionTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1E293B',
    },
    sectionCount: {
        fontSize: 13,
        fontWeight: '500',
        color: '#64748B',
    },
    sectionContent: {
        paddingTop: 8,
    },
    adminContainer: {
        paddingHorizontal: 20,
    },
});

export default StaffManagement;



