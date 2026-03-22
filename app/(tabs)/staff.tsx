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
import { useSimpleNotifications } from '@/hooks/useSimpleNotifications';
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
    RefreshControl,
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
    const [refreshing, setRefreshing] = useState(false);

    // Get user role for access control
    const { user } = useUser();
    const userIsAdmin = isAdmin(user);
    
    // Initialize notification hook at component level
    const { sendProjectNotification } = useSimpleNotifications();
    
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
            await fetchStaffAndAdminData();
        };

        fetchData();
    }, [clientId]); // Depend on clientId

    // Extract data fetching logic into a separate function for reuse
    const fetchStaffAndAdminData = async () => {
        try {
            console.log('📡 Making API calls with clientId:', clientId);
            console.log('📡 Domain:', domain);
            
            // ✅ FIXED: Try new API first (using client's staffs array)
            console.log('🔍 Trying new Staff API (client staffs array)...');
            let staffUrl = `${domain}/api/clients/staff?clientId=${clientId}`;
            console.log('📤 Staff URL:', staffUrl);
            
            let staffRes = await axios.get(staffUrl);
            console.log('📥 Staff Response Status:', staffRes.status);
            console.log('📥 Staff Response Data:', JSON.stringify(staffRes.data, null, 2));
            
            // ✅ FIXED: Handle the correct API response format
            let staffResponse = staffRes.data as { success?: boolean; data?: Staff[]; message?: string };
            let staffData: Staff[] = [];
            
            if (staffResponse?.success && Array.isArray(staffResponse.data)) {
                staffData = staffResponse.data;
                console.log('✅ New API returned staff data:', staffData.length, 'items');
            } else {
                console.log('⚠️ New API returned no data or failed, trying fallback...');
                
                // ✅ Fallback to old API if new API returns empty or fails
                try {
                    staffUrl = `${domain}/api/users/staff?clientId=${clientId}`;
                    console.log('📤 Fallback Staff URL:', staffUrl);
                    
                    staffRes = await axios.get(staffUrl);
                    console.log('📥 Fallback Response Status:', staffRes.status);
                    console.log('📥 Fallback Response Data:', JSON.stringify(staffRes.data, null, 2));
                    
                    staffResponse = staffRes.data as { success?: boolean; data?: Staff[]; message?: string };
                    
                    if (staffResponse?.success && Array.isArray(staffResponse.data)) {
                        staffData = staffResponse.data;
                        console.log('✅ Fallback API returned staff data:', staffData.length, 'items');
                    } else {
                        console.log('⚠️ Fallback API also failed or returned no data');
                        staffData = [];
                    }
                } catch (fallbackError: any) {
                    console.error('❌ Fallback API error:', fallbackError);
                    staffData = [];
                }
            }
            
            console.log('✅ Final staff data processed:', staffData.length, 'items');
            setStaffList(Array.isArray(staffData) ? staffData : []);
            
            // ✅ FIXED: Fetch Admin data with proper error handling
            console.log('🔍 Fetching Admin data...');
            try {
                const adminUrl = `${domain}/api/users/admin?clientId=${clientId}`;
                console.log('📤 Admin URL:', adminUrl);
                
                const adminRes = await axios.get(adminUrl);
                console.log('📥 Admin Response Status:', adminRes.status);
                console.log('📥 Admin Response Data:', JSON.stringify(adminRes.data, null, 2));
                
                // ✅ FIXED: Handle admin response format
                const adminResponse = adminRes.data as { success?: boolean; data?: Admin | Admin[]; message?: string };
                let adminData: Admin[] = [];
                
                if (adminResponse?.success) {
                    if (Array.isArray(adminResponse.data)) {
                        adminData = adminResponse.data;
                    } else if (adminResponse.data) {
                        adminData = [adminResponse.data];
                    }
                    console.log('✅ Admin data processed:', adminData.length, 'items');
                } else {
                    console.log('⚠️ Admin API returned no data or failed');
                    adminData = [];
                }
                
                setAdminList(adminData);
            } catch (adminError: any) {
                console.error('❌ Admin API error:', adminError);
                console.error('❌ Admin error response:', adminError.response?.data);
                console.error('❌ Admin error status:', adminError.response?.status);
                
                // Handle specific admin error cases
                if (adminError.response?.status === 404) {
                    console.log('⚠️ Admin not found - this is normal for some clients');
                    setAdminList([]);
                } else {
                    console.error('❌ Unexpected admin API error');
                    setAdminList([]);
                }
            }
            
            // ✅ FIXED: Fetch Client data with proper error handling
            console.log('🔍 Fetching Client data...');
            try {
                const clientUrl = `${domain}/api/clients?id=${clientId}`;
                console.log('📤 Client URL:', clientUrl);
                
                const clientRes = await axios.get(clientUrl);
                console.log('📥 Client Response Status:', clientRes.status);
                console.log('📥 Client Response Data:', JSON.stringify(clientRes.data, null, 2));
                
                // ✅ FIXED: Handle client response format
                const clientResponse = clientRes.data as { success?: boolean; data?: ClientData; message?: string };
                let clientInfo: ClientData | null = null;
                
                if (clientResponse?.success && clientResponse.data) {
                    clientInfo = clientResponse.data;
                    console.log('✅ Client data processed:', clientInfo.name || 'Unknown Company');
                } else {
                    console.log('⚠️ Client API returned no data or failed');
                    clientInfo = null;
                }
                
                setClientData(clientInfo);
            } catch (clientError: any) {
                console.error('❌ Client API error:', clientError);
                console.error('❌ Client error response:', clientError.response?.data);
                console.error('❌ Client error status:', clientError.response?.status);
                setClientData(null);
            }
            
            console.log('✅ Data loading completed successfully');
            
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
            setRefreshing(false);
        }
    };

    // Pull-to-refresh handler
    const onRefresh = async () => {
        if (!clientId) {
            toast.error('Client ID not available. Please try logging in again.');
            return;
        }

        console.log('🔄 Pull-to-refresh triggered');
        setRefreshing(true);
        
        try {
            await fetchStaffAndAdminData();
            toast.success('Data refreshed successfully');
        } catch (error) {
            console.error('❌ Error during pull-to-refresh:', error);
            toast.error('Failed to refresh data');
        }
    };

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
            
            const res = await addStaff(payload, sendProjectNotification);
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
                        await fetchStaffAndAdminData();
                        console.log('✅ Data refresh completed');
                    } catch (error) {
                        console.error('❌ Error refreshing data:', error);
                        toast.error('Failed to refresh data');
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

    // Helper function to filter staff projects by current client
    const filterStaffProjectsByClient = (staff: Staff) => {
        if (!staff.assignedProjects || !Array.isArray(staff.assignedProjects)) {
            console.log(`⚠️ Staff ${staff.firstName} ${staff.lastName} has no assignedProjects or invalid format`);
            return [];
        }

        const filteredProjects = staff.assignedProjects.filter(
            (project: any) => {
                const matches = project.clientId === clientId;
                if (!matches) {
                    console.log(`🔍 Filtering out project "${project.projectName}" (clientId: ${project.clientId}) for staff ${staff.firstName} ${staff.lastName} - doesn't match current clientId: ${clientId}`);
                }
                return matches;
            }
        );

        console.log(`📊 Staff ${staff.firstName} ${staff.lastName}: ${staff.assignedProjects.length} total projects, ${filteredProjects.length} for current client`);
        return filteredProjects;
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
                            staff={{
                                ...item.data,
                                // Filter assignedProjects to only show projects for current client
                                assignedProjects: filterStaffProjectsByClient(item.data)
                            }}
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
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={['#3B82F6']} // Android
                            tintColor="#3B82F6" // iOS
                            title="Pull to refresh" // iOS
                            titleColor="#64748B" // iOS
                        />
                    }
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
                        await fetchStaffAndAdminData();
                    } catch (error) {
                        console.error('Error refreshing staff list:', error);
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



