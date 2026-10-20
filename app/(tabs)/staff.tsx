import AddStaffModalWithVerification from '@/components/staff/AddStaffModalWithVerification';
import StaffHeader from '@/components/staff/StaffHeader';
import StaffCard from '@/components/staff/StaffCard';
import { StaffListSkeleton } from '@/components/staff/StaffCardSkeleton';
import StaffEmptyState from '@/components/staff/StaffEmptyState';
import AdminCard from '@/components/staff/AdminCard';
import StaffQRScannerModal from '@/components/staff/StaffQRScannerModal';
import ManualStaffAssignModal from '@/components/staff/ManualStaffAssignModal';
import ManagePaymentModal from '@/components/staff/ManagePaymentModal';
import { Colors } from '@/constants/theme';
import { getClientId } from '@/functions/clientId';
import { addStaff, removeStaff } from '@/functions/staff';
import { isAdmin, useUser } from '@/hooks/useUser';
import { useSimpleNotifications } from '@/hooks/useSimpleNotifications';
import { domain } from '@/lib/domain';
import { Staff } from '@/types/staff';
import { emailNotificationService, notificationService } from '@/services/emailNotificationService';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '@/utils/axiosConfig';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Modal,
    StatusBar,
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Alert,
    RefreshControl,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { staffStorage } from '@/utils/staffStorage';
import { toast } from 'sonner-native';

// One tint for every permission — a colour per row read as six different kinds of thing
const ALL_PERMISSIONS = [
    { key: 'addMaterial', label: 'Add Materials', icon: 'cube-outline' },
    { key: 'addMaterialUsage', label: 'Record Material Use', icon: 'construct-outline' },
    { key: 'addOtherCost', label: 'Add Other Costs', icon: 'cash-outline' },
    { key: 'addEquipmentCost', label: 'Add Equipment Costs', icon: 'hardware-chip-outline' },
    { key: 'contractor', label: 'Manage Contractors', icon: 'people-outline' },
    { key: 'generateReport', label: 'Generate Reports', icon: 'bar-chart-outline' },
];

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
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentStaff, setPaymentStaff] = useState<Staff | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [clientId, setClientId] = useState('');
    const [clientData, setClientData] = useState<ClientData | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Inline dropdown
    const [expandedStaffId, setExpandedStaffId] = useState<string | null>(null);

    // Permissions modal
    const [showPermissionsModal, setShowPermissionsModal] = useState(false);
    const [permissionsStaff, setPermissionsStaff] = useState<Staff | null>(null);
    const [activePermissions, setActivePermissions] = useState<string[]>([]);
    const [savingPermissions, setSavingPermissions] = useState(false);

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

            let staffRes = await apiClient.get(staffUrl);
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

                    staffRes = await apiClient.get(staffUrl);
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

                const adminRes = await apiClient.get(adminUrl);
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

                const clientRes = await apiClient.get(clientUrl);
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
            // The list updating is the confirmation — no toast for an expected success
            await fetchStaffAndAdminData();
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

            // Send notification using the email notification service
            console.log('🚀 Calling email notification service...');
            const success = await emailNotificationService.sendStaffWelcomeMessage(notificationPayload);

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

                // ✅ Update cached staff data immediately
                const newStaffForCache = {
                    fullName: `${newStaff.firstName} ${newStaff.lastName}`,
                    _id: res._id || res.id || 'temp_id'
                };
                await staffStorage.addStaffMember(clientId, newStaffForCache);
                console.log('✅ Staff added to cache for immediate availability');

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

    const handleManagePayment = (staff: Staff) => {
        // staff.assignedProjects is already filtered to the current client by the
        // time StaffCard hands it back to us (see the 'staff' case in renderItem).
        setPaymentStaff(staff);
        setShowPaymentModal(true);
    };

    const handlePaymentUpdated = (staffId: string, projectId: string, monthlyPayment: number) => {
        // Patch local state so the card + modal reflect the new amount immediately,
        // without waiting on a full refetch (and the staff-list cache's TTL).
        const applyUpdate = (list: Staff[]) => list.map(s => {
            if (s._id !== staffId) return s;
            return {
                ...s,
                assignedProjects: (s.assignedProjects || []).map(p =>
                    p.projectId === projectId ? { ...p, monthlyPayment } : p
                ),
            };
        });

        setStaffList(prev => applyUpdate(prev));
        setPaymentStaff(prev => {
            if (!prev || prev._id !== staffId) return prev;
            return {
                ...prev,
                assignedProjects: (prev.assignedProjects || []).map(p =>
                    p.projectId === projectId ? { ...p, monthlyPayment } : p
                ),
            };
        });
    };

    const handleStaffPress = (staff: Staff) => {
        setExpandedStaffId(prev => (prev === staff._id ? null : (staff._id ?? null)));
    };

    const handleViewActivity = (staff: Staff) => {
        router.push({ pathname: '/staff-detail', params: { staff: JSON.stringify(staff) } });
    };

    const handleManagePermissionsPress = (staff: Staff) => {
        setPermissionsStaff(staff);
        setActivePermissions(staff.permissions || []);
        setShowPermissionsModal(true);
    };

    const handleManagePaymentPress = (staff: Staff) => {
        handleManagePayment(staff);
    };

    const handleRemoveFromSheet = (staff: Staff) => {
        handleRemoveStaff(staff);
    };

    const togglePermission = (key: string) => {
        setActivePermissions(prev =>
            prev.includes(key) ? prev.filter(p => p !== key) : [...prev, key]
        );
    };

    const savePermissions = async () => {
        if (savingPermissions || !permissionsStaff?._id || !clientId) return;
        setSavingPermissions(true);
        try {
            await apiClient.put(
                `/api/users/staff?id=${permissionsStaff._id}&clientId=${clientId}`,
                { permissions: activePermissions }
            );
            toast.success('Permissions updated');
            setShowPermissionsModal(false);
            setLoading(true);
            await fetchStaffAndAdminData();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to update permissions');
        } finally {
            setSavingPermissions(false);
        }
    };

    const handleRemoveStaff = async (staff: Staff) => {
        // Check if user is admin
        if (!userIsAdmin) {
            toast.error('Only admins can remove staff members');
            return;
        }

        if (!clientId) {
            toast.error('Client ID not found');
            return;
        }

        // Check if staff is assigned to any projects for this client
        const clientProjects = filterStaffProjectsByClient(staff);

        if (clientProjects.length > 0) {
            const projectNames = clientProjects.map(p => p.projectName).join(', ');
            Alert.alert(
                'Cannot Remove Staff',
                `${staff.firstName} ${staff.lastName} is currently assigned to the following project(s): ${projectNames}.\n\nPlease unassign them from all projects before removing.`,
                [{ text: 'OK', style: 'default' }]
            );
            return;
        }

        // Show confirmation dialog
        Alert.alert(
            'Remove Staff Member',
            `Are you sure you want to remove ${staff.firstName} ${staff.lastName} from the organization?`,
            [
                {
                    text: 'Cancel',
                    style: 'cancel'
                },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        await performStaffRemoval(staff);
                    }
                }
            ]
        );
    };

    const performStaffRemoval = async (staff: Staff) => {
        try {
            console.log('🗑️ Starting staff removal process...');
            console.log('👤 Staff to remove:', JSON.stringify(staff, null, 2));
            console.log('🆔 Client ID:', clientId);

            if (!staff._id) {
                toast.error('Staff ID not found');
                return;
            }

            // Call the removeStaff function from staff functions
            const result = await removeStaff(
                staff._id,
                `${staff.firstName} ${staff.lastName}`,
                sendProjectNotification,
                clientId
            );

            if (result) {
                console.log('✅ Staff removed successfully');
                toast.success(`${staff.firstName} ${staff.lastName} has been removed from your organization`);

                // Remove from cached staff data
                await staffStorage.removeStaffMember(clientId, staff._id);
                console.log('✅ Staff removed from cache');

                // Refresh staff and admin list
                console.log('🔄 Refreshing staff and admin data...');
                setLoading(true);
                try {
                    await fetchStaffAndAdminData();
                    console.log('✅ Data refresh completed after removal');
                } catch (error) {
                    console.error('❌ Error refreshing data after removal:', error);
                    toast.error('Staff removed but failed to refresh data');
                }
            } else {
                console.log('❌ Staff removal failed');
                toast.error('Failed to remove staff member');
            }
        } catch (error: any) {
            console.error('❌ Error in performStaffRemoval:', error);

            if (error.response) {
                console.error('❌ Error response:', error.response.data);
                console.error('❌ Error status:', error.response.status);

                if (error.response.status === 400) {
                    const errorMessage = error.response.data?.message || 'Invalid request';
                    if (errorMessage.includes('assigned to the following project')) {
                        toast.error(errorMessage);
                    } else if (errorMessage.includes('not assigned to this client')) {
                        toast.error('Staff member is not part of your organization.');
                    } else {
                        toast.error(errorMessage);
                    }
                } else if (error.response.status === 404) {
                    toast.error('Staff member not found or already removed.');
                } else if (error.response.status === 403) {
                    toast.error('You do not have permission to remove this staff member.');
                } else {
                    toast.error('Failed to remove staff member. Please try again.');
                }
            } else {
                toast.error('Network error. Please check your connection and try again.');
            }
        }
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
                        <Text style={styles.sectionTitle} accessibilityRole="header">Administrators</Text>
                        <Text style={styles.sectionCount}>{item.count}</Text>
                    </View>
                );

            case 'admin':
                return (
                    <View style={styles.rowContainer}>
                        <AdminCard admin={item.data} />
                    </View>
                );

            case 'staffHeader':
                return (
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle} accessibilityRole="header">Staff</Text>
                        <Text style={styles.sectionCount}>{item.count}</Text>
                    </View>
                );

            case 'staff': {
                const staffData: Staff = item.data;
                const filteredProjects = filterStaffProjectsByClient(staffData);
                const isExpanded = expandedStaffId === staffData._id;
                return (
                    <View style={styles.rowContainer}>
                        <StaffCard
                            staff={{ ...staffData, assignedProjects: filteredProjects }}
                            onPress={() => handleStaffPress(staffData)}
                            isExpanded={isExpanded}
                        />
                        {isExpanded && (
                            <View style={dd.dropdown}>
                                {filteredProjects.length > 0 && (
                                    <View style={dd.projSection}>
                                        <Text style={dd.projTitle}>Assigned Projects</Text>
                                        {filteredProjects.map((p, i) => {
                                            const isActive = p.status === 'active';
                                            return (
                                                <View
                                                    key={p.projectId ?? i}
                                                    style={[dd.projRow, i > 0 && dd.projRowDivider]}
                                                    accessible
                                                    accessibilityLabel={`${p.projectName}${isActive
                                                        ? (p.monthlyPayment ? `, ₹${p.monthlyPayment.toLocaleString('en-IN')} a month` : '')
                                                        : `, ${p.status}`}`}
                                                >
                                                    <Ionicons
                                                        name={isActive ? 'folder-outline' : 'folder-open-outline'}
                                                        size={16}
                                                        color={Colors.textSecondary}
                                                    />
                                                    <Text
                                                        style={[dd.projName, !isActive && dd.projNameInactive]}
                                                        numberOfLines={1}
                                                    >
                                                        {p.projectName}
                                                    </Text>
                                                    {!isActive ? (
                                                        <View style={dd.statusTag}>
                                                            <Text style={dd.statusTagText}>{p.status}</Text>
                                                        </View>
                                                    ) : !!p.monthlyPayment && (
                                                        <Text style={dd.payAmt}>
                                                            ₹{p.monthlyPayment.toLocaleString('en-IN')}<Text style={dd.payUnit}>/mo</Text>
                                                        </Text>
                                                    )}
                                                </View>
                                            );
                                        })}
                                    </View>
                                )}

                                {/* Actions — one tint for everything except the destructive one */}
                                <View style={dd.list}>
                                    <TouchableOpacity style={dd.item} onPress={() => handleViewActivity(staffData)} activeOpacity={0.6} accessibilityRole="button">
                                        <Ionicons name="time-outline" size={20} color={Colors.primaryDark} />
                                        <Text style={dd.label}>View Activity</Text>
                                        <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} />
                                    </TouchableOpacity>

                                    {userIsAdmin && (
                                        <TouchableOpacity style={[dd.item, dd.itemDivider]} onPress={() => handleManagePermissionsPress(staffData)} activeOpacity={0.6} accessibilityRole="button">
                                            <Ionicons name="shield-checkmark-outline" size={20} color={Colors.primaryDark} />
                                            <Text style={dd.label}>Permissions</Text>
                                            <Text style={dd.detail}>{(staffData.permissions || []).length} of {ALL_PERMISSIONS.length}</Text>
                                            <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} />
                                        </TouchableOpacity>
                                    )}

                                    {userIsAdmin && filteredProjects.length > 0 && (
                                        <TouchableOpacity style={[dd.item, dd.itemDivider]} onPress={() => handleManagePaymentPress(staffData)} activeOpacity={0.6} accessibilityRole="button">
                                            <Ionicons name="wallet-outline" size={20} color={Colors.primaryDark} />
                                            <Text style={dd.label}>Monthly Payment</Text>
                                            <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} />
                                        </TouchableOpacity>
                                    )}
                                </View>

                                {/* Kept apart from the everyday actions so it isn't hit by mistake */}
                                {userIsAdmin && (
                                    <TouchableOpacity style={dd.removeButton} onPress={() => handleRemoveFromSheet(staffData)} activeOpacity={0.6} accessibilityRole="button">
                                        <Ionicons name="person-remove-outline" size={18} color={Colors.errorText} />
                                        <Text style={dd.removeLabel}>Remove from Team</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}
                    </View>
                );
            }

            case 'staffEmpty':
                return (
                    <View style={styles.rowContainer}>
                        <StaffEmptyState
                            hasSearchQuery={item.hasSearchQuery}
                            onAddPress={userIsAdmin ? () => setShowAddModal(true) : undefined}
                        />
                    </View>
                );

            default:
                return null;
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />

            <StaffHeader
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onScanQRPress={() => setShowQRScanner(true)}
                isAdmin={userIsAdmin}
            />

            {loading ? (
                <View style={styles.loadingContainer}>
                    <StaffListSkeleton count={6} />
                </View>
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
                            colors={['#3A78B5']} // Android
                            tintColor="#3A78B5" // iOS
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

            <ManagePaymentModal
                visible={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                staff={paymentStaff}
                onPaymentUpdated={handlePaymentUpdated}
            />

            {/* ── Permissions sheet ───────────────────────────────────────── */}
            <Modal
                visible={showPermissionsModal}
                animationType="slide"
                transparent
                onRequestClose={() => setShowPermissionsModal(false)}
            >
                <View style={sheet.overlay}>
                    <TouchableOpacity
                        style={sheet.backdropFill}
                        activeOpacity={1}
                        onPress={() => setShowPermissionsModal(false)}
                        accessibilityRole="button"
                        accessibilityLabel="Close permissions"
                    />
                    <View style={sheet.container}>
                        <View style={perm.header}>
                            <View style={perm.headerText}>
                                <Text style={perm.title} accessibilityRole="header">Permissions</Text>
                                {permissionsStaff && (
                                    <Text style={perm.subtitle} numberOfLines={1}>
                                        {permissionsStaff.firstName} {permissionsStaff.lastName} · {activePermissions.length} of {ALL_PERMISSIONS.length} allowed
                                    </Text>
                                )}
                            </View>
                            <TouchableOpacity
                                onPress={() => setShowPermissionsModal(false)}
                                style={perm.closeBtn}
                                accessibilityRole="button"
                                accessibilityLabel="Close"
                            >
                                <Ionicons name="close" size={20} color={Colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <Text style={perm.hint}>Choose what this person can add or do in your projects.</Text>

                        <ScrollView showsVerticalScrollIndicator={false} style={perm.list}>
                            <View style={perm.group}>
                                {ALL_PERMISSIONS.map((p, i) => {
                                    const active = activePermissions.includes(p.key);
                                    return (
                                        <TouchableOpacity
                                            key={p.key}
                                            style={[perm.row, i > 0 && perm.rowDivider]}
                                            onPress={() => togglePermission(p.key)}
                                            activeOpacity={0.6}
                                            accessibilityRole="checkbox"
                                            accessibilityState={{ checked: active }}
                                            accessibilityLabel={p.label}
                                        >
                                            <Ionicons name={p.icon as any} size={20} color={active ? Colors.primaryDark : Colors.textSecondary} />
                                            <Text style={[perm.rowLabel, active && perm.rowLabelActive]}>{p.label}</Text>
                                            <Ionicons
                                                name={active ? 'checkmark-circle' : 'ellipse-outline'}
                                                size={24}
                                                color={active ? Colors.primary : Colors.textTertiary}
                                            />
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </ScrollView>

                        <TouchableOpacity
                            style={[perm.saveBtn, savingPermissions && perm.saveBtnDisabled]}
                            onPress={savePermissions}
                            disabled={savingPermissions}
                            activeOpacity={0.85}
                            accessibilityRole="button"
                            accessibilityState={{ busy: savingPermissions }}
                        >
                            {savingPermissions
                                ? <ActivityIndicator size="small" color="#FFFFFF" />
                                : <Text style={perm.saveBtnText}>Save Permissions</Text>
                            }
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const INK = '#0F172A';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    loadingContainer: {
        paddingHorizontal: 16,
        paddingTop: 8,
    },
    listContainer: {
        paddingBottom: 32,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 8,
        paddingHorizontal: 20,
        paddingTop: 22,
        paddingBottom: 10,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: INK,
        letterSpacing: -0.4,
    },
    sectionCount: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.textSecondary,
        fontVariant: ['tabular-nums'],
    },
    rowContainer: {
        paddingHorizontal: 16,
    },
});

// ── Bottom sheet ───────────────────────────────────────────────────────────────
const sheet = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(10,18,38,0.45)',
        justifyContent: 'flex-end',
    },
    backdropFill: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    container: {
        backgroundColor: Colors.background,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 36,
        maxHeight: '88%',
    },
});

// ── Inline action panel under an expanded staff card ───────────────────────────
const dd = StyleSheet.create({
    dropdown: {
        marginBottom: 10,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderTopWidth: 0,
        borderColor: '#E8EDF4',
        borderBottomLeftRadius: 18,
        borderBottomRightRadius: 18,
        padding: 12,
        gap: 12,
    },
    projSection: {
        backgroundColor: Colors.background,
        borderRadius: 14,
        paddingHorizontal: 12,
        paddingTop: 10,
        paddingBottom: 2,
    },
    projTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.textSecondary,
        marginBottom: 2,
    },
    projRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        minHeight: 44,
    },
    projRowDivider: {
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: Colors.border,
    },
    projName: {
        flex: 1,
        fontSize: 15,
        fontWeight: '500',
        color: INK,
    },
    projNameInactive: {
        color: Colors.textSecondary,
    },
    payAmt: {
        fontSize: 14,
        fontWeight: '700',
        color: INK,
        fontVariant: ['tabular-nums'],
    },
    payUnit: {
        fontWeight: '500',
        color: Colors.textSecondary,
    },
    statusTag: {
        backgroundColor: Colors.fill,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    statusTagText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#475569',
        textTransform: 'capitalize',
    },
    list: {
        borderRadius: 14,
        backgroundColor: Colors.background,
        overflow: 'hidden',
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        minHeight: 48,
        paddingHorizontal: 14,
    },
    itemDivider: {
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: Colors.border,
    },
    label: {
        flex: 1,
        fontSize: 15,
        fontWeight: '500',
        color: INK,
    },
    detail: {
        fontSize: 14,
        color: Colors.textSecondary,
        fontVariant: ['tabular-nums'],
    },
    removeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        minHeight: 44,
        borderRadius: 14,
    },
    removeLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.errorText,
    },
});

// ── Permissions sheet ──────────────────────────────────────────────────────────
const perm = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 4,
    },
    headerText: {
        flex: 1,
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
        color: INK,
        letterSpacing: -0.4,
    },
    subtitle: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    closeBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.fill,
        justifyContent: 'center',
        alignItems: 'center',
    },
    hint: {
        fontSize: 14,
        lineHeight: 19,
        color: Colors.textSecondary,
        paddingHorizontal: 4,
        marginTop: 10,
        marginBottom: 12,
    },
    list: {
        marginBottom: 16,
    },
    group: {
        backgroundColor: Colors.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E8EDF4',
        overflow: 'hidden',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        minHeight: 52,
        paddingHorizontal: 14,
    },
    rowDivider: {
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: Colors.border,
    },
    rowLabel: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500',
        color: '#334155',
    },
    rowLabelActive: {
        color: INK,
        fontWeight: '600',
    },
    saveBtn: {
        backgroundColor: Colors.primary,
        borderRadius: 25,
        minHeight: 50,
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveBtnDisabled: {
        opacity: 0.6,
    },
    saveBtnText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
});

export default StaffManagement;
