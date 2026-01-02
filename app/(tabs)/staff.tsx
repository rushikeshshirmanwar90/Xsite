import Loading from '@/components/Loading';
import AddStaffModalWithVerification from '@/components/staff/AddStaffModalWithVerification';
import StaffHeader from '@/components/staff/StaffHeader';
import StaffCard from '@/components/staff/StaffCard';
import StaffEmptyState from '@/components/staff/StaffEmptyState';
import AdminCard from '@/components/staff/AdminCard';
import StaffQRScannerModal from '@/components/staff/StaffQRScannerModal';
import ManualStaffAssignModal from '@/components/staff/ManualStaffAssignModal';
import { getClientId } from '@/functions/clientId';
import { addStaff } from '@/functions/staff';
import { isAdmin, useUser } from '@/hooks/useUser';
import { domain } from '@/lib/domain';
import { Staff } from '@/types/staff';
import { notificationService } from '@/services/notificationService';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    FlatList,
    StatusBar,
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Alert,
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

interface ClientData {
    _id: string;
    name: string;
    email: string;
    phoneNumber: number;
    city: string;
    state: string;
    address: string;
}

const StaffManagement: React.FC = () => {
    const [staffList, setStaffList] = useState<Staff[]>([]);
    const [adminList, setAdminList] = useState<Admin[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showQRScanner, setShowQRScanner] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [clientId, setClientId] = useState('');
    const [clientData, setClientData] = useState<ClientData | null>(null);
    const [loading, setLoading] = useState(true);

    // Get user role for access control
    const { user } = useUser();
    const userIsAdmin = isAdmin(user);
    
    // Router for navigation
    const router = useRouter();

    // !! fetching clientId
    useEffect(() => {
        const fetchClientId = async () => {
            console.log('🔍 Fetching clientId...');
            const id = await getClientId();
            console.log('✅ ClientId received:', id);
            
            if (!id) {
                console.error('❌ No valid clientId found. User may need to log in again.');
                toast.error('Session expired. Please log in again.');
                setLoading(false);
                return;
            }
            
            setClientId(id);
        }
        fetchClientId()
    }, []); // Empty dependency array to run only once


    // !! fetching staff and admin data
    useEffect(() => {
        const fetchData = async () => {
            console.log('🔍 Attempting to fetch staff data with clientId:', clientId);
            
            if (!clientId) {
                console.log('⚠️ ClientId is not available yet, skipping API call');
                return;
            }
            
            setLoading(true);
            try {
                console.log('📡 Making API calls with clientId:', clientId);
                console.log('📡 Domain:', domain);
                
                // ✅ Try new API first (using client's staffs array)
                console.log('🔍 Trying new Staff API (client staffs array)...');
                let staffUrl = `${domain}/api/clients/staff?clientId=${clientId}`;
                console.log('📤 Staff URL:', staffUrl);
                
                let staffRes = await axios.get(staffUrl);
                console.log('📥 Staff Response Status:', staffRes.status);
                
                let staffResponse = staffRes.data as { success?: boolean; data?: Staff[] };
                let staffData = staffResponse?.success ? (staffResponse.data || []) : [];
                
                // ✅ Fallback to old API if new API returns empty
                if (staffData.length === 0) {
                    console.log('⚠️ New API returned empty, falling back to old API...');
                    staffUrl = `${domain}/api/users/staff?clientId=${clientId}`;
                    console.log('📤 Fallback Staff URL:', staffUrl);
                    
                    staffRes = await axios.get(staffUrl);
                    console.log('📥 Fallback Response Status:', staffRes.status);
                    
                    staffResponse = staffRes.data as { success?: boolean; data?: Staff[] };
                    staffData = staffResponse?.success ? (staffResponse.data || []) : [];
                }
                
                console.log('✅ Staff data processed:', staffData.length, 'items');
                console.log('📋 Staff data details:', staffData);
                setStaffList(Array.isArray(staffData) ? staffData : []);
                
                console.log('🔍 Testing Admin API...');
                const adminUrl = `${domain}/api/users/admin?clientId=${clientId}`;
                console.log('📤 Admin URL:', adminUrl);
                
                const adminRes = await axios.get(adminUrl);
                console.log('📥 Admin Response Status:', adminRes.status);
                console.log('📥 Admin Response Data:', JSON.stringify(adminRes.data, null, 2));
                
                console.log('🔍 Testing Client API...');
                const clientUrl = `${domain}/api/clients?id=${clientId}`;
                console.log('📤 Client URL:', clientUrl);
                
                const clientRes = await axios.get(clientUrl);
                console.log('📥 Client Response Status:', clientRes.status);
                console.log('📥 Client Response Data:', JSON.stringify(clientRes.data, null, 2));
                
                // Handle admin data with proper typing
                const adminResponse = adminRes.data as { success?: boolean; data?: Admin | Admin[] };
                const adminData = adminResponse?.success ? adminResponse.data : null;
                console.log('✅ Admin data processed:', adminData ? 'Found' : 'Not found');
                console.log('📋 Admin data details:', adminData);
                if (Array.isArray(adminData)) {
                    setAdminList(adminData);
                } else if (adminData) {
                    setAdminList([adminData]);
                } else {
                    setAdminList([]);
                }
                
                // Handle client data with proper typing
                const clientResponse = clientRes.data as { success?: boolean; data?: ClientData };
                const clientInfo = clientResponse?.success ? clientResponse.data : null;
                console.log('✅ Client data processed:', clientInfo?.name || 'Unknown Company');
                console.log('📋 Client data details:', clientInfo);
                setClientData(clientInfo || null);
                
                // Show success message if at least one API worked
                const staffSuccess = staffResponse?.success || false;
                const adminSuccess = adminResponse?.success || false;
                const clientSuccess = clientResponse?.success || false;
                
                if (staffSuccess || adminSuccess || clientSuccess) {
                    console.log('✅ Data loading completed successfully');
                } else {
                    console.log('❌ All APIs failed');
                    toast.error('Failed to load data. Please check your connection.');
                }
                
            } catch (error) {
                console.error('❌ Error fetching data:', error);
                
                // Handle specific error cases
                if (error && typeof error === 'object' && 'response' in error) {
                    const axiosError = error as any;
                    console.error('❌ Error response:', axiosError.response?.data);
                    console.error('❌ Error status:', axiosError.response?.status);
                    console.error('❌ Error config:', axiosError.config);
                    
                    // Handle specific error cases
                    if (axiosError.response?.status === 400) {
                        console.error('❌ 400 Error - likely missing or invalid clientId');
                        toast.error('Invalid client configuration. Please contact support.');
                    } else if (axiosError.response?.status === 404) {
                        console.error('❌ 404 Error - client or endpoint not found');
                        const errorMessage = axiosError.response?.data?.message || 'Data not found';
                        if (errorMessage.includes('Client not found')) {
                            toast.error('Your account is not properly configured. Please contact support.');
                        } else {
                            toast.error('API endpoint not found. Please contact support.');
                        }
                    } else if (!axiosError.response) {
                        console.error('❌ Network error - server might be down');
                        toast.error('Unable to connect to server. Please check your connection.');
                    } else {
                        toast.error('Failed to load staff and admin data');
                    }
                } else {
                    console.error('❌ Unknown error type:', error);
                    toast.error('Failed to load staff and admin data');
                }
                
                // Set empty arrays on error to prevent UI issues
                setStaffList([]);
                setAdminList([]);
                setClientData(null);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [clientId]); // Depend on clientId

    const sendWelcomeMessage = async (staffMember: Staff, companyName: string) => {
        try {
            console.log('📱 Starting welcome message process...');
            console.log('📋 Staff member:', JSON.stringify(staffMember, null, 2));
            console.log('🏢 Company name:', companyName);
            console.log('🆔 Client ID:', clientId);
            
            // Create welcome message using the notification service
            const welcomeMessage = notificationService.createWelcomeMessage(
                `${staffMember.firstName} ${staffMember.lastName}`,
                companyName,
                staffMember.role
            );
            
            const welcomeSubject = notificationService.createWelcomeSubject(companyName);
            
            console.log('📧 Welcome subject:', welcomeSubject);
            console.log('📝 Welcome message preview:', welcomeMessage.substring(0, 100) + '...');
            
            // Create notification payload
            const notificationPayload = {
                recipientEmail: staffMember.email,
                recipientName: `${staffMember.firstName} ${staffMember.lastName}`,
                subject: welcomeSubject,
                message: welcomeMessage,
                type: 'staff_welcome',
                clientId: clientId,
                staffId: staffMember._id,
                companyName: companyName,
                metadata: {
                    role: staffMember.role,
                    addedBy: user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : 'Administrator',
                    addedAt: new Date().toISOString()
                }
            };

            console.log('📦 Final notification payload:', JSON.stringify(notificationPayload, null, 2));

            // Send notification using the notification service
            console.log('🚀 Calling notification service...');
            const success = await notificationService.sendStaffWelcomeMessage(notificationPayload);
            
            console.log('📊 Notification service result:', success);
            
            if (success) {
                console.log('✅ Welcome message sent successfully');
                toast.success(`Welcome message sent to ${staffMember.firstName} ${staffMember.lastName}`);
            } else {
                console.log('⚠️ Welcome message failed to send');
                toast.error('Staff added successfully, but welcome message failed to send');
            }
        } catch (error: any) {
            console.error('❌ Error in sendWelcomeMessage function:', error);
            if (error instanceof Error) {
                console.error('❌ Error stack:', error.stack);
                console.error('❌ Error message:', error.message);
            }
            // Don't fail the staff addition if notification fails
            toast.error('Staff added successfully, but welcome message failed to send');
        }
    };

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

        if (!clientData) {
            toast.error('Company information not available');
            return;
        }

        const payload = {
            ...newStaff,
            clientId: clientId
        };

        console.log(payload);

        try {
            console.log('🚀 Starting staff addition process...');
            console.log('📋 Staff payload:', JSON.stringify(payload, null, 2));
            
            const res = await addStaff(payload);
            console.log('📥 addStaff function result:', res);

            if (res) {
                console.log('✅ Staff added successfully, showing success toast');
                toast.success('Staff Added successfully');
                setShowAddModal(false);
                
                // Send welcome message to the new staff member
                console.log('📧 Preparing to send welcome message...');
                const staffWithId = { ...newStaff, _id: res._id || res.id };
                console.log('👤 Staff with ID:', JSON.stringify(staffWithId, null, 2));
                console.log('🏢 Company data:', JSON.stringify(clientData, null, 2));
                
                console.log('🎯 Calling sendWelcomeMessage...');
                await sendWelcomeMessage(staffWithId, clientData.name);
                console.log('✅ Welcome message process completed');
                
                // Refresh staff and admin list after adding new staff
                const refreshData = async () => {
                    if (!clientId) {
                        console.log('⚠️ ClientId not available for refresh');
                        return;
                    }
                    
                    console.log('🔄 Refreshing staff and admin data...');
                    setLoading(true);
                    try {
                        const [staffRes, adminRes] = await Promise.all([
                            axios.get(`${domain}/api/clients/staff?clientId=${clientId}`), // ✅ Use new API
                            axios.get(`${domain}/api/users/admin?clientId=${clientId}`)
                        ]);
                        
                        const staffResponse = staffRes.data as { success?: boolean; data?: Staff[] };
                        const staffData = staffResponse?.data || [];
                        
                        const adminResponse = adminRes.data as { success?: boolean; data?: Admin | Admin[] };
                        const adminData = adminResponse?.data;
                        
                        setStaffList(staffData);
                        if (Array.isArray(adminData)) {
                            setAdminList(adminData);
                        } else if (adminData) {
                            setAdminList([adminData]);
                        } else {
                            setAdminList([]);
                        }
                        console.log('✅ Data refresh completed');
                    } catch (error) {
                        console.error('❌ Error refreshing data:', error);
                        toast.error('Failed to refresh data');
                    } finally {
                        setLoading(false);
                    }
                };
                refreshData();
            } else {
                console.log('❌ addStaff function returned null/false');
                toast.error('Something went wrong');
            }
        } catch (error) {
            console.error('❌ Error in handleAddStaff:', error);
            if (error instanceof Error) {
                console.error('❌ Error stack:', error.stack);
                console.error('❌ Error message:', error.message);
            }
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

    // Prepare data for single FlatList
    const listData = [];
    
    // Add admin section header if there are admins
    if (filteredAdmins.length > 0) {
        listData.push({
            type: 'adminHeader',
            id: 'admin-header',
            count: filteredAdmins.length
        });
        
        // Add each admin
        filteredAdmins.forEach(admin => {
            listData.push({
                type: 'admin',
                id: `admin-${admin._id}`,
                data: admin
            });
        });
    }
    
    // Add staff section header
    listData.push({
        type: 'staffHeader',
        id: 'staff-header',
        count: filteredStaff.length
    });
    
    // Add each staff member or empty state
    if (filteredStaff.length > 0) {
        filteredStaff.forEach(staff => {
            listData.push({
                type: 'staff',
                id: `staff-${staff._id}`,
                data: staff
            });
        });
    } else {
        listData.push({
            type: 'staffEmpty',
            id: 'staff-empty',
            hasSearchQuery: searchQuery.length > 0
        });
    }

    const renderItem = ({ item }: { item: any }) => {
        switch (item.type) {
            case 'adminHeader':
                return (
                    <View style={styles.sectionHeader}>
                        <View style={styles.sectionTitleContainer}>
                            <Ionicons name="shield-checkmark" size={20} color="#F59E0B" />
                            <Text style={styles.sectionTitle}>Administrators</Text>
                        </View>
                        <Text style={styles.sectionCount}>
                            {item.count} admin{item.count !== 1 ? 's' : ''}
                        </Text>
                    </View>
                );
            
            case 'admin':
                return (
                    <View style={styles.adminContainer}>
                        <AdminCard
                            admin={item.data}
                            onPress={() => handleAdminPress(item.data)}
                        />
                    </View>
                );
            
            case 'staffHeader':
                return (
                    <View style={styles.sectionHeader}>
                        <View style={styles.sectionTitleContainer}>
                            <Ionicons name="people" size={20} color="#3B82F6" />
                            <Text style={styles.sectionTitle}>Staff Members</Text>
                        </View>
                        <Text style={styles.sectionCount}>
                            {item.count} staff member{item.count !== 1 ? 's' : ''}
                        </Text>
                    </View>
                );
            
            case 'staff':
                return (
                    <View style={styles.staffContainer}>
                        <StaffCard
                            staff={item.data}
                            onPress={() => handleStaffPress(item.data)}
                        />
                    </View>
                );
            
            case 'staffEmpty':
                return (
                    <View style={styles.staffContainer}>
                        <StaffEmptyState
                            hasSearchQuery={item.hasSearchQuery}
                            onAddPress={() => setShowAddModal(true)}
                        />
                    </View>
                );
            
            default:
                return null;
        }
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
                onScanQRPress={() => setShowQRScanner(true)}
                isAdmin={userIsAdmin}
            />

            {loading ? (
                <Loading />
            ) : (
                <FlatList
                    data={listData}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.listContainer}
                />
            )}

            <AddStaffModalWithVerification
                visible={showAddModal}
                onClose={() => setShowAddModal(false)}
                onAdd={handleAddStaff}
                companyName={clientData?.name}
            />

            <StaffQRScannerModal
                visible={showQRScanner}
                onClose={() => setShowQRScanner(false)}
                clientId={clientId}
                onSuccess={async () => {
                    // Refresh staff list after successful assignment
                    if (!clientId) return;
                    
                    setLoading(true);
                    try {
                        // ✅ Use new API to fetch staff
                        const staffRes = await axios.get(`${domain}/api/clients/staff?clientId=${clientId}`);
                        const staffResponse = staffRes.data as { success?: boolean; data?: Staff[] };
                        const staffData = staffResponse?.data || [];
                        setStaffList(staffData);
                    } catch (error) {
                        console.error('Error refreshing staff list:', error);
                    } finally {
                        setLoading(false);
                    }
                }}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    listContainer: {
        paddingBottom: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        marginBottom: 8,
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
    adminContainer: {
        paddingHorizontal: 20,
        paddingVertical: 8,
    },
    staffContainer: {
        paddingHorizontal: 20,
        paddingVertical: 4,
    },
});

export default StaffManagement;



