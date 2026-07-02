import Loading from '@/components/Loading';
import AddStaffModalWithVerification from '@/components/staff/AddStaffModalWithVerification';
import StaffHeader from '@/components/staff/StaffHeader';
import StaffCard from '@/components/staff/StaffCard';
import StaffEmptyState from '@/components/staff/StaffEmptyState';
import AdminCard from '@/components/staff/AdminCard';
import StaffQRScannerModal from '@/components/staff/StaffQRScannerModal';
import ManualStaffAssignModal from '@/components/staff/ManualStaffAssignModal';
import ManagePaymentModal from '@/components/staff/ManagePaymentModal';
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

const ALL_PERMISSIONS = [
    { key: 'addMaterial',      label: 'Add Material',    icon: 'cube-outline',          color: '#7C3AED', bg: '#FAF5FF' },
    { key: 'addMaterialUsage', label: 'Material Usage',  icon: 'construct-outline',     color: '#D97706', bg: '#FFFBEB' },
    { key: 'addOtherCost',     label: 'Other Cost',      icon: 'cash-outline',          color: '#E11D48', bg: '#FFF1F2' },
    { key: 'addEquipmentCost', label: 'Equipment Cost',  icon: 'hardware-chip-outline', color: '#2563EB', bg: '#EAF0FE' },
    { key: 'contractor',       label: 'Contractor',      icon: 'people-outline',        color: '#16A34A', bg: '#F0FDF4' },
    { key: 'generateReport',   label: 'Generate Report', icon: 'bar-chart-outline',     color: '#F59E0B', bg: '#FEF0E3' },
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
                            <Ionicons name="shield-checkmark" size={20} color="#3A78B5" />
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
                            <Ionicons name="people" size={20} color="#3A78B5" />
                            <Text style={styles.sectionTitle}>Staff Members</Text>
                        </View>
                        <Text style={styles.sectionCount}>
                            {item.count} staff member{item.count !== 1 ? 's' : ''}
                        </Text>
                    </View>
                );
            
            case 'staff': {
                const staffData: Staff = item.data;
                const filteredProjects = filterStaffProjectsByClient(staffData);
                const isExpanded = expandedStaffId === staffData._id;
                return (
                    <View style={styles.staffContainer}>
                        <StaffCard
                            staff={{ ...staffData, assignedProjects: filteredProjects }}
                            onPress={() => handleStaffPress(staffData)}
                            isExpanded={isExpanded}
                        />
                        {isExpanded && (
                            <View style={dd.dropdown}>
                                {/* Projects — shown directly */}
                                {filteredProjects.length > 0 && (
                                    <View style={dd.projSection}>
                                        <Text style={dd.projTitle}>Assigned Projects</Text>
                                        {filteredProjects.map((p, i) => (
                                            <View key={p.projectId ?? i} style={dd.projRow}>
                                                <Ionicons
                                                    name={p.status === 'active' ? 'folder' : 'folder-open'}
                                                    size={13}
                                                    color={p.status === 'active' ? '#3A78B5' : '#94A3B8'}
                                                />
                                                <Text
                                                    style={[dd.projName, p.status !== 'active' && { color: '#94A3B8' }]}
                                                    numberOfLines={1}
                                                >
                                                    {p.projectName}
                                                </Text>
                                                {p.status !== 'active' ? (
                                                    <View style={proj.closedTag}>
                                                        <Text style={proj.closedTagText}>{p.status}</Text>
                                                    </View>
                                                ) : !!p.monthlyPayment && (
                                                    <Text style={proj.payAmt}>
                                                        ₹{p.monthlyPayment.toLocaleString('en-IN')}/mo
                                                    </Text>
                                                )}
                                            </View>
                                        ))}
                                    </View>
                                )}

                                {/* Action list */}
                                <View style={dd.list}>
                                    <TouchableOpacity style={dd.item} onPress={() => handleViewActivity(staffData)} activeOpacity={0.7}>
                                        <Ionicons name="time-outline" size={18} color="#3A78B5" />
                                        <Text style={dd.label}>View Activity</Text>
                                        <Ionicons name="chevron-forward" size={14} color="#CBD5E1" />
                                    </TouchableOpacity>

                                    {userIsAdmin && <View style={dd.sep} />}

                                    {userIsAdmin && (
                                        <TouchableOpacity style={dd.item} onPress={() => handleManagePermissionsPress(staffData)} activeOpacity={0.7}>
                                            <Ionicons name="shield-checkmark-outline" size={18} color="#7C3AED" />
                                            <Text style={dd.label}>Manage Permissions</Text>
                                            <Ionicons name="chevron-forward" size={14} color="#CBD5E1" />
                                        </TouchableOpacity>
                                    )}

                                    {userIsAdmin && filteredProjects.length > 0 && <View style={dd.sep} />}

                                    {userIsAdmin && filteredProjects.length > 0 && (
                                        <TouchableOpacity style={dd.item} onPress={() => handleManagePaymentPress(staffData)} activeOpacity={0.7}>
                                            <Ionicons name="cash-outline" size={18} color="#16A34A" />
                                            <Text style={dd.label}>Manage Payment</Text>
                                            <Ionicons name="chevron-forward" size={14} color="#CBD5E1" />
                                        </TouchableOpacity>
                                    )}

                                    {userIsAdmin && <View style={dd.sep} />}

                                    {userIsAdmin && (
                                        <TouchableOpacity style={dd.item} onPress={() => handleRemoveFromSheet(staffData)} activeOpacity={0.7}>
                                            <Ionicons name="trash-outline" size={18} color="#E11D48" />
                                            <Text style={[dd.label, { color: '#E11D48' }]}>Remove Staff</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>
                        )}
                    </View>
                );
            }
            
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

            {/* ── Permissions Modal ───────────────────────────────────────── */}
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
                    />
                <View style={[sheet.container, perm.container]}>
                    <View style={sheet.handle} />

                    <View style={perm.header}>
                        <View>
                            <Text style={perm.title}>Permissions</Text>
                            {permissionsStaff && (
                                <Text style={perm.subtitle}>
                                    {permissionsStaff.firstName} {permissionsStaff.lastName}
                                </Text>
                            )}
                        </View>
                        <TouchableOpacity onPress={() => setShowPermissionsModal(false)} style={perm.closeBtn}>
                            <Ionicons name="close" size={20} color="#64748B" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} style={{ marginBottom: 12 }}>
                        {ALL_PERMISSIONS.map(p => {
                            const active = activePermissions.includes(p.key);
                            return (
                                <TouchableOpacity
                                    key={p.key}
                                    style={[perm.chip, active && { backgroundColor: p.bg, borderColor: p.color }]}
                                    onPress={() => togglePermission(p.key)}
                                    activeOpacity={0.75}
                                >
                                    <View style={[perm.chipIcon, { backgroundColor: active ? p.bg : '#F1F5F9' }]}>
                                        <Ionicons name={p.icon as any} size={18} color={active ? p.color : '#94A3B8'} />
                                    </View>
                                    <Text style={[perm.chipLabel, active && { color: p.color, fontWeight: '700' }]}>
                                        {p.label}
                                    </Text>
                                    {active
                                        ? <Ionicons name="checkmark-circle" size={20} color={p.color} />
                                        : <Ionicons name="ellipse-outline" size={20} color="#CBD5E1" />
                                    }
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>

                    <TouchableOpacity
                        style={[perm.saveBtn, savingPermissions && perm.saveBtnDisabled]}
                        onPress={savePermissions}
                        disabled={savingPermissions}
                        activeOpacity={0.85}
                    >
                        {savingPermissions
                            ? <ActivityIndicator size="small" color="#fff" />
                            : <Text style={perm.saveBtnText}>Save Changes</Text>
                        }
                    </TouchableOpacity>
                </View>
                </View>
            </Modal>
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

// ── Action Sheet Styles ────────────────────────────────────────────────────────
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
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 20,
        paddingBottom: 36,
        paddingTop: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -6 },
        shadowOpacity: 0.08,
        shadowRadius: 20,
        elevation: 20,
    },
    handle: {
        width: 36,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#E2E8F0',
        alignSelf: 'center',
        marginBottom: 18,
    },
    profile: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingBottom: 16,
    },
    profileAvatar: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: '#EAF0FE',
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileAvatarText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#3A78B5',
    },
    profileName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0F172A',
    },
    profileRole: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 2,
        textTransform: 'capitalize',
    },
    divider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginVertical: 8,
    },
    action: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        paddingVertical: 13,
    },
    actionIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionText: {
        flex: 1,
    },
    actionLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: '#0F172A',
    },
    actionSub: {
        fontSize: 12,
        color: '#94A3B8',
        marginTop: 1,
    },
    scroll: {
        maxHeight: 520,
    },
    cancelBtn: {
        marginTop: 10,
        paddingVertical: 14,
        borderRadius: 14,
        backgroundColor: '#F8FAFC',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    cancelText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#64748B',
    },
});

// ── Projects Dropdown Styles ───────────────────────────────────────────────────
const proj = StyleSheet.create({
    payAmt: {
        fontSize: 11,
        fontWeight: '700',
        color: '#16A34A',
    },
    closedTag: {
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 7,
        paddingVertical: 2,
        borderRadius: 6,
    },
    closedTagText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#64748B',
        textTransform: 'capitalize',
    },
});

// ── Inline dropdown styles ─────────────────────────────────────────────────────
const dd = StyleSheet.create({
    dropdown: {
        marginBottom: 10,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderTopWidth: 0,
        borderColor: '#E2E8F0',
        borderBottomLeftRadius: 16,
        borderBottomRightRadius: 16,
        paddingHorizontal: 12,
        paddingTop: 12,
        paddingBottom: 14,
        gap: 10,
        shadowColor: '#1E293B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 2,
    },
    projSection: {
        gap: 6,
    },
    projTitle: {
        fontSize: 10,
        fontWeight: '700',
        color: '#94A3B8',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 2,
    },
    projRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 7,
        paddingHorizontal: 10,
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    projName: {
        flex: 1,
        fontSize: 13,
        fontWeight: '500',
        color: '#1E293B',
    },
    list: {
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        overflow: 'hidden',
        backgroundColor: '#FFFFFF',
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 13,
        paddingHorizontal: 14,
        backgroundColor: '#FFFFFF',
    },
    label: {
        flex: 1,
        fontSize: 14,
        fontWeight: '500',
        color: '#1E293B',
    },
    sep: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginHorizontal: 14,
    },
});

// ── Permissions Modal Styles ───────────────────────────────────────────────────
const perm = StyleSheet.create({
    container: {
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0F172A',
        letterSpacing: -0.3,
    },
    subtitle: {
        fontSize: 13,
        color: '#64748B',
        marginTop: 2,
    },
    closeBtn: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 13,
        paddingHorizontal: 14,
        backgroundColor: '#F8FAFC',
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        marginBottom: 8,
    },
    chipIcon: {
        width: 36,
        height: 36,
        borderRadius: 11,
        justifyContent: 'center',
        alignItems: 'center',
    },
    chipLabel: {
        flex: 1,
        fontSize: 14,
        fontWeight: '500',
        color: '#64748B',
    },
    saveBtn: {
        backgroundColor: '#3A78B5',
        borderRadius: 14,
        paddingVertical: 15,
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveBtnDisabled: {
        backgroundColor: '#94A3B8',
    },
    saveBtnText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#FFFFFF',
    },
});

export default StaffManagement;



