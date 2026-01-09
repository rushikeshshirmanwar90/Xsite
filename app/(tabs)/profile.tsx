import { useAuth } from '@/contexts/AuthContext';
import { getClientId } from '@/functions/clientId';
import { getProjectData } from '@/functions/project';
import { useUser, isStaff } from '@/hooks/useUser';
import { domain } from '@/lib/domain';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import QRCode from 'react-native-qrcode-svg';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import ViewShot from 'react-native-view-shot';
import {
    Alert,
    Modal,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ReportGenerator from '@/components/profile/ReportGenerator';

interface UserData {
    name?: string;
    email?: string;
    clientId?: string;
    phone?: string;
    company?: string;
}

interface ClientData {
    _id?: string;
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    companyName?: string;
    gstNumber?: string;
}

interface ProjectStats {
    totalProjects: number;
    totalSpent: number;
}

const CompanyProfile: React.FC = () => {
    const { logout } = useAuth();
    const { user, refreshUser } = useUser();
    const router = useRouter();
    const [userData, setUserData] = useState<UserData>({});
    const [clientData, setClientData] = useState<ClientData>({});
    const [stats, setStats] = useState<ProjectStats>({
        totalProjects: 0,
        totalSpent: 0,
    });
    const [loading, setLoading] = useState(true);
    const [loadingClient, setLoadingClient] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showReportGenerator, setShowReportGenerator] = useState(false);
    const [showQRCode, setShowQRCode] = useState(false);
    const [isSharing, setIsSharing] = useState(false);

    // Refs for capturing QR code views
    const embeddedQRRef = useRef<ViewShot | null>(null);
    const modalQRRef = useRef<ViewShot | null>(null);

    // Check if current user is staff
    const isCurrentUserStaff = isStaff(user);

    // Force refresh data every time the screen is focused (after login/logout)
    useFocusEffect(
        React.useCallback(() => {
            console.log('🔄 Profile page focused - refreshing all data...');
            
            // Clear local state first to ensure fresh data
            setUserData({});
            setClientData({});
            setStats({
                totalProjects: 0,
                totalSpent: 0,
            });
            setLoading(true);
            setLoadingClient(true);
            
            // For staff users, refresh user data first to get latest assignedProjects
            const initializeData = async () => {
                if (user && 'role' in user) {
                    console.log('🔄 Staff user detected - refreshing user data to get latest assignedProjects');
                    try {
                        await refreshUser();
                        console.log('✅ User data refreshed successfully');
                    } catch (error) {
                        console.error('❌ Failed to refresh user data:', error);
                    }
                }
                
                // Then fetch other data
                fetchUserData();
                fetchStats();
            };
            
            initializeData();
        }, [])
    );

    const fetchUserData = async () => {
        try {
            const userDetailsString = await AsyncStorage.getItem("user");
            console.log('🔍 Profile page - raw user data:', userDetailsString);
            
            if (userDetailsString) {
                const data = JSON.parse(userDetailsString);
                console.log('🔍 Profile page - parsed data keys:', Object.keys(data || {}));
                console.log('🔍 Profile page - has _id?', !!data?._id);
                console.log('🔍 Profile page - has clientId?', !!data?.clientId);
                // ✅ FIX: Use clientId field, NOT _id field
                // _id = user's own ID, clientId = the client/company they belong to
                let clientId = data.clientId || '';
                
                // Handle ObjectId objects (convert to string)
                if (typeof clientId === 'object' && clientId !== null) {
                    clientId = clientId.toString();
                }
                
                console.log('🔍 Profile page - User ID (_id):', data._id);
                console.log('🔍 Profile page - Client ID (clientId):', clientId);
                console.log('🔍 Profile page - These should be DIFFERENT!');

                // Build full name from firstName and lastName
                let fullName = 'User';
                if (data.firstName && data.lastName) {
                    fullName = `${data.firstName} ${data.lastName}`;
                } else if (data.firstName) {
                    fullName = data.firstName;
                } else if (data.lastName) {
                    fullName = data.lastName;
                } else if (data.name) {
                    fullName = data.name;
                } else if (data.username) {
                    fullName = data.username;
                }

                setUserData({
                    name: fullName,
                    email: data.email || '',
                    clientId: clientId,
                    phone: data.phone || data.phoneNumber || '',
                    company: data.company || data.companyName || 'Construction Company',
                });

                // Fetch client details if clientId exists
                if (clientId && clientId.trim() !== '') {
                    console.log('🔍 Valid clientId found, fetching client data...');
                    await fetchClientData(clientId);
                } else {
                    console.warn('⚠️ No valid clientId found in user data');
                    console.warn('⚠️ User data structure:', data);
                    setLoadingClient(false);
                }
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
            setLoadingClient(false);
        }
    };

    const fetchClientData = async (clientId: string) => {
        try {
            setLoadingClient(true);
            console.log('🔍 Fetching client data for ID:', clientId);
            console.log('🔍 API URL:', `${domain}/api/clients?id=${clientId}`);
            
            // ✅ FIX: Use correct endpoint /api/clients (plural) and correct response structure
            const response = await axios.get(`${domain}/api/clients?id=${clientId}`);

            console.log('🔍 Client API response:', response.data);
            const responseData = response.data as any;
            
            // ✅ FIX: API returns data in responseData.data, not responseData.clientData
            if (responseData && responseData.success && responseData.data) {
                const client = responseData.data;
                setClientData({
                    _id: client._id,
                    name: client.name,
                    email: client.email,
                    phone: client.phoneNumber, // ✅ FIX: Use phoneNumber from Client model
                    address: client.address,
                    city: client.city,
                    state: client.state,
                    country: client.country, // Note: country might not exist in Client model
                    companyName: client.name, // ✅ FIX: Use name as company name
                    gstNumber: client.gstNumber, // This field might not exist in Client model
                });
                console.log('✅ Client data set successfully:', client);
            } else {
                console.warn('⚠️ No client data found in API response');
                console.warn('⚠️ Response structure:', responseData);
            }
        } catch (error: any) {
            console.error('❌ Error fetching client data:', error);
            console.error('❌ Error response:', error.response?.data);
            console.error('❌ Error status:', error.response?.status);
            
            // If client not found, that's okay - just log it
            if (error.response?.status === 404) {
                console.warn('⚠️ Client not found in database - this might be normal');
            }
        } finally {
            setLoadingClient(false);
        }
    };

    const fetchStats = async () => {
        try {
            const clientId = await getClientId();
            console.log('🔍 Profile page - getClientId() returned:', clientId);
            console.log('🔍 Profile page - userData.clientId is:', userData.clientId);
            console.log('🔍 Profile page - IDs match?', clientId === userData.clientId);
            
            if (!clientId) {
                console.warn('⚠️ No clientId found, cannot fetch stats');
                return;
            }

            // ✅ FIX: Properly destructure the response from getProjectData
            console.log('📊 Fetching project data for stats calculation...');
            
            // Check if user is staff and pass staffId for filtering
            const isCurrentUserStaff = isStaff(user);
            
            console.log('🔍 Profile stats - fetching projects:', {
                clientId,
                isStaff: isCurrentUserStaff,
                willFilter: !!isCurrentUserStaff
            });
            
            // ✅ OPTIMIZED APPROACH: For staff users, fetch staff data with populated projects
            let projectsArray = [];
            if (isCurrentUserStaff && user) {
                console.log('👤 Staff user - fetching staff data with populated projects for stats');
                
                try {
                    // Fetch staff data with populated assignedProjects from ALL clients
                    const response = await axios.get(`${domain}/api/users/staff?id=${user._id}&getAllProjects=true`);
                    const responseData = response.data as any;
                    
                    if (responseData.success && responseData.data) {
                        const staffData = responseData.data;
                        
                        // Extract populated project data from assignedProjects
                        if (staffData.assignedProjects && Array.isArray(staffData.assignedProjects) && staffData.assignedProjects.length > 0) {
                            projectsArray = staffData.assignedProjects
                                .map((assignment: any) => {
                                    const projectData = assignment.projectData || assignment.projectId;
                                    if (projectData && projectData._id) {
                                        // Add client information to the project data for consistency
                                        return {
                                            ...projectData,
                                            clientName: assignment.clientName || 'Unknown Client',
                                            clientId: assignment.clientId
                                        };
                                    }
                                    return null;
                                })
                                .filter((project: any) => project !== null); // Filter out null/invalid projects
                            
                            console.log('📊 Populated projects for staff stats:', projectsArray.length, 'projects');
                        } else {
                            console.log('⚠️ Staff has no assigned projects for stats');
                            projectsArray = [];
                        }
                    } else {
                        console.log('❌ Failed to fetch staff data for stats');
                        projectsArray = [];
                    }
                } catch (error) {
                    console.error('❌ Error fetching staff data for stats:', error);
                    projectsArray = [];
                }
            } else {
                // For non-staff users, get all client projects
                const projectData = await getProjectData(clientId, 1, 1000);
                console.log('📊 Raw project data response:', projectData);
                
                // Handle both old and new response formats
                if (projectData && typeof projectData === 'object') {
                    if (Array.isArray(projectData)) {
                        // Old format: direct array
                        projectsArray = projectData;
                    } else if (projectData.projects && Array.isArray(projectData.projects)) {
                        // New format: {projects, meta}
                        projectsArray = projectData.projects;
                    } else {
                        console.warn('⚠️ Unexpected project data format:', projectData);
                        projectsArray = [];
                    }
                }
            }
            
            console.log('📊 Final projects array for stats:', projectsArray.length, 'projects');

            // Calculate stats from real data only
            let totalSpent = 0;

            projectsArray.forEach((project: any, index: number) => {
                console.log(`📊 Processing project ${index + 1}:`, project.name || project.title || 'Unnamed');
                
                // ✅ CORRECT CALCULATION: Use project.spent field directly
                const projectSpent = Number(project.spent) || 0;
                console.log(`  - Project spent field: ₹${projectSpent}`);
                
                // Add to total
                totalSpent += projectSpent;
                
                // Debug: Also show material counts for reference
                const availableMaterials = project.MaterialAvailable || [];
                const usedMaterials = project.MaterialUsed || [];
                console.log(`  - Materials: ${availableMaterials.length} available, ${usedMaterials.length} used`);
            });

            console.log('📊 Final stats calculated:');
            console.log(`  - Total Projects: ${projectsArray.length}`);
            console.log(`  - Total Spent: ₹${totalSpent} (sum of project.spent fields)`);

            setStats({
                totalProjects: projectsArray.length,
                totalSpent,
            });
        } catch (error) {
            console.error('❌ Error fetching stats:', error);
            // Set empty stats on error
            setStats({
                totalProjects: 0,
                totalSpent: 0,
            });
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await logout();
                        } catch (error) {
                            console.error('Logout error:', error);
                        }
                    }
                }
            ]
        );
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const formatCurrency = (amount: number) => {
        return `₹${amount.toLocaleString('en-IN')}`;
    };

    const onRefresh = async () => {
        console.log('🔄 Manual refresh triggered...');
        setRefreshing(true);
        
        // Clear all local state
        setUserData({});
        setClientData({});
        setStats({
            totalProjects: 0,
            totalSpent: 0,
        });
        
        // Refetch everything
        await Promise.all([
            fetchUserData(),
            fetchStats()
        ]);
        
        setRefreshing(false);
        console.log('✅ Manual refresh completed');
    };

    const clearStorageDebug = async () => {
        Alert.alert(
            'Clear Storage',
            'This will clear all stored data. Are you sure?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear',
                    style: 'destructive',
                    onPress: async () => {
                        console.log('🧹 Manual storage clear...');
                        await AsyncStorage.clear();
                        console.log('✅ Storage cleared manually');
                        onRefresh(); // Refresh the page
                    }
                }
            ]
        );
    };

    const shareQRCode = async (viewShotRef: React.RefObject<ViewShot | null>) => {
        if (!viewShotRef.current || !user) {
            Alert.alert('Error', 'QR code not ready for sharing. Please try again.');
            return;
        }

        setIsSharing(true);
        try {
            console.log('📱 Starting QR code sharing process...');
            
            // Check if sharing is available
            const isAvailable = await Sharing.isAvailableAsync();
            if (!isAvailable) {
                Alert.alert(
                    'Sharing Not Available',
                    'Sharing is not available on this device. Please take a screenshot instead.',
                    [{ text: 'OK' }]
                );
                return;
            }

            // Capture the QR code view as image
            console.log('📸 Capturing QR code view...');
            const uri = await (viewShotRef.current as any)?.capture({
                format: 'png',
                quality: 1.0,
            });

            if (!uri) {
                throw new Error('Failed to capture QR code image');
            }

            console.log('✅ QR code captured:', uri);

            // Share the QR code image directly
            console.log('🚀 Sharing QR code...');
            await Sharing.shareAsync(uri, {
                mimeType: 'image/png',
                dialogTitle: 'Share Staff QR Code',
                UTI: 'public.png',
            });

            console.log('✅ QR code shared successfully');

        } catch (error) {
            console.error('❌ Error sharing QR code:', error);
            Alert.alert(
                'Sharing Failed',
                'Could not share QR code. Please try taking a screenshot instead.',
                [{ text: 'OK' }]
            );
        } finally {
            setIsSharing(false);
        }
    };

    const testClientFetch = async () => {
        const clientId = await getClientId();
        Alert.alert(
            'Debug Client Fetch',
            `Client ID: ${clientId}\n\nCheck console for detailed logs.`,
            [
                { text: 'OK' },
                {
                    text: 'Retry Fetch',
                    onPress: () => {
                        if (clientId) {
                            fetchClientData(clientId);
                        }
                    }
                }
            ]
        );
    };





    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#3B82F6" />

            <ScrollView 
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#3B82F6']}
                        tintColor="#3B82F6"
                    />
                }
            >
                {/* Header with Gradient */}
                <LinearGradient
                    colors={['#3B82F6', '#2563EB']}
                    style={styles.header}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>
                                {getInitials(userData.name || 'User')}
                            </Text>
                        </View>
                    </View>
                    <Text style={styles.userName}>{userData.name || 'User'}</Text>
                    <Text style={styles.userEmail}>{userData.email || 'email@example.com'}</Text>
                    {userData.company && !isCurrentUserStaff && (
                        <View style={styles.companyBadge}>
                            <Ionicons name="business" size={14} color="#3B82F6" />
                            <Text style={styles.companyText}>{userData.company}</Text>
                        </View>
                    )}
                    
                    {/* Staff Role Badge */}
                    {isCurrentUserStaff && user && 'role' in user && (
                        <View style={styles.staffBadge}>
                            <Ionicons name="person" size={14} color="#10B981" />
                            <Text style={styles.staffBadgeText}>
                                {user.role.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </Text>
                        </View>
                    )}
                </LinearGradient>

                {/* Stats Cards */}
                <View style={styles.statsContainer}>
                    <View style={styles.statsRow}>
                        <View style={[styles.statCard, styles.statCardPrimary]}>
                            <View style={styles.statIconContainer}>
                                <Ionicons name="folder-open" size={24} color="#3B82F6" />
                            </View>
                            <Text style={styles.statValue}>
                                {loading ? '...' : stats.totalProjects}
                            </Text>
                            <Text style={styles.statLabel}>Total Projects</Text>
                        </View>

                        <TouchableOpacity 
                            style={[styles.statCard, styles.statCardDanger]}
                            onPress={() => {
                                console.log('📊 Navigating to dashboard from total spent card');
                                router.push('/dashboard');
                            }}
                            activeOpacity={0.7}
                        >
                            <View style={styles.statIconContainer}>
                                <Ionicons name="cash" size={24} color="#EF4444" />
                            </View>
                            <Text style={styles.statValue}>
                                {loading ? '...' : formatCurrency(stats.totalSpent)}
                            </Text>
                            <Text style={styles.statLabel}>Total Spent</Text>
                            <View style={styles.cardClickIndicator}>
                                <Ionicons name="chevron-forward" size={16} color="#EF4444" />
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* QR Code Section - Priority for unassigned staff */}
                {isCurrentUserStaff && user && !userData.clientId && (
                    <View style={styles.section}>  
                        <View style={[styles.infoCard, styles.shareCard]}>
                            <View style={styles.shareHeader}>
                                <View style={styles.shareIconContainer}>
                                    <Ionicons name="qr-code-outline" size={24} color="#3B82F6" />
                                </View>
                                <View style={styles.shareContent}>
                                    <Text style={styles.shareTitle}>Get Connected</Text>
                                    <Text style={styles.shareSubtitle}>
                                        Share your QR code with admin to join their organization
                                    </Text>
                                </View>
                            </View>
                            
                            {/* QR Code displayed directly */}
                            <ViewShot ref={embeddedQRRef} options={{ format: 'png', quality: 1.0 }}>
                                <View style={styles.embeddedQrContainer}>
                                    <QRCode
                                        value={JSON.stringify({
                                            staffId: user._id,
                                            firstName: user.firstName || 'Staff',
                                            lastName: user.lastName || 'Member',
                                            email: user.email || '',
                                            phoneNumber: user.phoneNumber || ('phone' in user ? user.phone : '') || '',
                                            role: 'role' in user ? user.role : 'staff',
                                            timestamp: new Date().toISOString()
                                        })}
                                        size={150}
                                        color="#1E293B"
                                        backgroundColor="#FFFFFF"
                                    />
                                    <View style={styles.qrCodeInfo}>
                                        <Text style={styles.qrCodeTitle}>Staff QR Code</Text>
                                        <Text style={styles.qrCodeSubtitle}>
                                            {`${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Staff Member'}
                                        </Text>
                                        <Text style={styles.qrCodeId}>ID: {user._id}</Text>
                                    </View>
                                </View>
                            </ViewShot>
                            
                            <View style={styles.embeddedQrInfo}>
                                <Text style={styles.embeddedQrTitle}>Staff Assignment QR Code</Text>
                                <Text style={styles.embeddedQrId}>{user._id}</Text>
                                <Text style={styles.embeddedQrInstructions}>
                                    Ask your admin to scan this QR code to assign you to their client organization and projects.
                                </Text>
                            </View>

                            {/* Share Button */}
                            <TouchableOpacity
                                style={[styles.shareButton, isSharing && styles.shareButtonDisabled]}
                                onPress={() => shareQRCode(embeddedQRRef)}
                                activeOpacity={0.7}
                                disabled={isSharing}
                            >
                                <Ionicons 
                                    name={isSharing ? "hourglass-outline" : "share-outline"} 
                                    size={20} 
                                    color="#FFFFFF" 
                                />
                                <Text style={styles.shareButtonText}>
                                    {isSharing ? 'Sharing...' : 'Share QR Code'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Client Details */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                        {isCurrentUserStaff ? 'Assigned Clients' : 'Client Information'}
                    </Text>
                    <View style={styles.infoCard}>
                        {loadingClient ? (
                            <View style={styles.infoRow}>
                                <View style={styles.infoIconContainer}>
                                    <Ionicons name="hourglass-outline" size={20} color="#64748B" />
                                </View>
                                <View style={styles.infoContent}>
                                    <Text style={styles.infoLabel}>Loading</Text>
                                    <Text style={styles.infoValue}>Fetching client details...</Text>
                                </View>
                            </View>
                        ) : (
                            <>
                                {/* For Staff Users - Show all assigned clients */}
                                {isCurrentUserStaff ? (
                                    <>
                                        {user && 'clients' in user && user.clients && user.clients.length > 0 ? (
                                            <>
                                                <View style={styles.infoRow}>
                                                    <View style={styles.infoIconContainer}>
                                                        <Ionicons name="business-outline" size={20} color="#10B981" />
                                                    </View>
                                                    <View style={styles.infoContent}>
                                                        <Text style={styles.infoLabel}>
                                                            Assigned Clients ({user.clients.length})
                                                        </Text>
                                                        <Text style={[styles.infoValue, { color: '#10B981', fontWeight: '700' }]}>
                                                            Multiple clients assigned
                                                        </Text>
                                                    </View>
                                                </View>
                                                
                                                {/* List all assigned clients */}
                                                {user.clients.map((client: any, index: number) => (
                                                    <View key={client.clientId || index} style={[styles.infoRow, { paddingLeft: 20 }]}>
                                                        <View style={styles.infoIconContainer}>
                                                            <Ionicons name="arrow-forward" size={16} color="#64748B" />
                                                        </View>
                                                        <View style={styles.infoContent}>
                                                            <Text style={styles.infoLabel}>
                                                                Client {index + 1}
                                                                {client.assignedAt && (
                                                                    <Text style={{ fontSize: 10, color: '#94A3B8' }}>
                                                                        {' '}• Assigned {new Date(client.assignedAt).toLocaleDateString()}
                                                                    </Text>
                                                                )}
                                                            </Text>
                                                            <Text style={styles.infoValue}>
                                                                {client.clientName || 'Unknown Client'}
                                                            </Text>
                                                            {client.clientId && (
                                                                <Text style={[styles.infoLabel, { fontSize: 10, marginTop: 2 }]}>
                                                                    ID: {client.clientId}
                                                                </Text>
                                                            )}
                                                        </View>
                                                    </View>
                                                ))}
                                            </>
                                        ) : (
                                            <View style={styles.infoRow}>
                                                <View style={styles.infoIconContainer}>
                                                    <Ionicons name="alert-circle-outline" size={20} color="#F59E0B" />
                                                </View>
                                                <View style={styles.infoContent}>
                                                    <Text style={styles.infoLabel}>Assignment Status</Text>
                                                    <Text style={[styles.infoValue, { color: '#F59E0B' }]}>
                                                        Not assigned to any client yet
                                                    </Text>
                                                </View>
                                            </View>
                                        )}
                                    </>
                                ) : (
                                    /* For Non-Staff Users - Show full client information */
                                    <>
                                        {clientData.companyName && (
                                            <View style={styles.infoRow}>
                                                <View style={styles.infoIconContainer}>
                                                    <Ionicons name="business-outline" size={20} color="#64748B" />
                                                </View>
                                                <View style={styles.infoContent}>
                                                    <Text style={styles.infoLabel}>Company Name</Text>
                                                    <Text style={styles.infoValue}>{clientData.companyName}</Text>
                                                </View>
                                            </View>
                                        )}

                                        {clientData.email && (
                                            <View style={styles.infoRow}>
                                                <View style={styles.infoIconContainer}>
                                                    <Ionicons name="mail-outline" size={20} color="#64748B" />
                                                </View>
                                                <View style={styles.infoContent}>
                                                    <Text style={styles.infoLabel}>Email</Text>
                                                    <Text style={styles.infoValue}>{clientData.email}</Text>
                                                </View>
                                            </View>
                                        )}

                                        {clientData.phone && (
                                            <View style={styles.infoRow}>
                                                <View style={styles.infoIconContainer}>
                                                    <Ionicons name="call-outline" size={20} color="#64748B" />
                                                </View>
                                                <View style={styles.infoContent}>
                                                    <Text style={styles.infoLabel}>Phone</Text>
                                                    <Text style={styles.infoValue}>{clientData.phone}</Text>
                                                </View>
                                            </View>
                                        )}

                                        {clientData.gstNumber && (
                                            <View style={styles.infoRow}>
                                                <View style={styles.infoIconContainer}>
                                                    <Ionicons name="document-text-outline" size={20} color="#64748B" />
                                                </View>
                                                <View style={styles.infoContent}>
                                                    <Text style={styles.infoLabel}>GST Number</Text>
                                                    <Text style={styles.infoValue}>{clientData.gstNumber}</Text>
                                                </View>
                                            </View>
                                        )}

                                        {clientData.address && (
                                            <View style={styles.infoRow}>
                                                <View style={styles.infoIconContainer}>
                                                    <Ionicons name="location-outline" size={20} color="#64748B" />
                                                </View>
                                                <View style={styles.infoContent}>
                                                    <Text style={styles.infoLabel}>Address</Text>
                                                    <Text style={styles.infoValue}>
                                                        {clientData.address}
                                                        {clientData.city && `, ${clientData.city}`}
                                                        {clientData.state && `, ${clientData.state}`}
                                                        {clientData.country && `, ${clientData.country}`}
                                                    </Text>
                                                </View>
                                            </View>
                                        )}

                                        {!clientData.email && !clientData.phone && (
                                            <View style={styles.infoRow}>
                                                <View style={styles.infoIconContainer}>
                                                    <Ionicons name="alert-circle-outline" size={20} color="#F59E0B" />
                                                </View>
                                                <View style={styles.infoContent}>
                                                    <Text style={styles.infoLabel}>No Data</Text>
                                                    <Text style={styles.infoValue}>Client information not available</Text>
                                                </View>
                                            </View>
                                        )}
                                    </>
                                )}
                            </>
                        )}
                    </View>
                </View>

                {/* Assigned Projects Section - Only for Staff */}
                {isCurrentUserStaff && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Assigned Projects</Text>
                        <View style={styles.infoCard}>
                            {user && 'assignedProjects' in user && user.assignedProjects && user.assignedProjects.length > 0 ? (
                                <>
                                    <View style={styles.infoRow}>
                                        <View style={styles.infoIconContainer}>
                                            <Ionicons name="folder-open-outline" size={20} color="#3B82F6" />
                                        </View>
                                        <View style={styles.infoContent}>
                                            <Text style={styles.infoLabel}>
                                                Total Projects ({user.assignedProjects.length})
                                            </Text>
                                            <Text style={[styles.infoValue, { color: '#3B82F6', fontWeight: '700' }]}>
                                                Working on multiple projects
                                            </Text>
                                        </View>
                                    </View>
                                    
                                    {/* List all assigned projects */}
                                    {user.assignedProjects.map((project: any, index: number) => (
                                        <View key={project.projectId || index} style={[styles.infoRow, { paddingLeft: 20 }]}>
                                            <View style={styles.infoIconContainer}>
                                                <Ionicons 
                                                    name={project.status === 'active' ? 'play-circle' : 
                                                          project.status === 'completed' ? 'checkmark-circle' : 'pause-circle'} 
                                                    size={16} 
                                                    color={project.status === 'active' ? '#10B981' : 
                                                           project.status === 'completed' ? '#3B82F6' : '#F59E0B'} 
                                                />
                                            </View>
                                            <View style={styles.infoContent}>
                                                <Text style={styles.infoLabel}>
                                                    Project {index + 1}
                                                    {project.assignedAt && (
                                                        <Text style={{ fontSize: 10, color: '#94A3B8' }}>
                                                            {' '}• Assigned {new Date(project.assignedAt).toLocaleDateString()}
                                                        </Text>
                                                    )}
                                                    <Text style={{ 
                                                        fontSize: 10, 
                                                        color: project.status === 'active' ? '#10B981' : 
                                                               project.status === 'completed' ? '#3B82F6' : '#F59E0B',
                                                        fontWeight: '600',
                                                        marginLeft: 8
                                                    }}>
                                                        • {project.status?.toUpperCase() || 'ACTIVE'}
                                                    </Text>
                                                </Text>
                                                <Text style={styles.infoValue}>
                                                    {project.projectName || 'Unknown Project'}
                                                </Text>
                                                <Text style={[styles.infoLabel, { fontSize: 11, marginTop: 2 }]}>
                                                    Client: {project.clientName || 'Unknown Client'}
                                                </Text>
                                                {project.projectId && (
                                                    <Text style={[styles.infoLabel, { fontSize: 10, marginTop: 1 }]}>
                                                        ID: {project.projectId}
                                                    </Text>
                                                )}
                                            </View>
                                        </View>
                                    ))}
                                </>
                            ) : (
                                <View style={styles.infoRow}>
                                    <View style={styles.infoIconContainer}>
                                        <Ionicons name="folder-outline" size={20} color="#94A3B8" />
                                    </View>
                                    <View style={styles.infoContent}>
                                        <Text style={styles.infoLabel}>Project Status</Text>
                                        <Text style={[styles.infoValue, { color: '#94A3B8' }]}>
                                            No projects assigned yet
                                        </Text>
                                    </View>
                                </View>
                            )}
                        </View>
                    </View>
                )}

                {/* QR Code Section - Only for assigned staff */}
                {isCurrentUserStaff && user && userData.clientId && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>📱 Share Your QR Code</Text>
                        
                        <View style={styles.infoCard}>
                            <TouchableOpacity
                                style={styles.qrCodeButton}
                                onPress={() => setShowQRCode(true)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.qrCodeButtonLeft}>
                                    <View style={styles.qrCodeButtonIcon}>
                                        <Ionicons name="qr-code-outline" size={22} color="#8B5CF6" />
                                    </View>
                                    <View style={styles.qrCodeButtonContent}>
                                        <Text style={styles.qrCodeButtonTitle}>View QR Code</Text>
                                        <Text style={styles.qrCodeButtonSubtitle}>
                                            Show your QR code for project management
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.qrCodeButtonBadge}>
                                    <Ionicons name="scan" size={16} color="#8B5CF6" />
                                </View>
                            </TouchableOpacity>

                            {/* Share Button for assigned staff */}
                            <TouchableOpacity
                                style={[styles.shareButton, styles.shareButtonSecondary, isSharing && styles.shareButtonDisabled]}
                                onPress={() => {
                                    // First show the QR code modal, then allow sharing from there
                                    setShowQRCode(true);
                                }}
                                activeOpacity={0.7}
                                disabled={isSharing}
                            >
                                <Ionicons name="share-outline" size={18} color="#8B5CF6" />
                                <Text style={styles.shareButtonSecondaryText}>Share QR Code</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Account Info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                        {isCurrentUserStaff ? 'Staff Information' : 'Account Information'}
                    </Text>
                    <View style={styles.infoCard}>
                        <View style={styles.infoRow}>
                            <View style={styles.infoIconContainer}>
                                <Ionicons name="mail-outline" size={20} color="#64748B" />
                            </View>
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>Email</Text>
                                <Text style={styles.infoValue}>
                                    {loading ? 'Loading...' : (userData.email || 'Not provided')}
                                </Text>
                            </View>
                        </View>

                        {!loading && userData.phone && (
                            <View style={styles.infoRow}>
                                <View style={styles.infoIconContainer}>
                                    <Ionicons name="call-outline" size={20} color="#64748B" />
                                </View>
                                <View style={styles.infoContent}>
                                    <Text style={styles.infoLabel}>Phone</Text>
                                    <Text style={styles.infoValue}>{userData.phone}</Text>
                                </View>
                            </View>
                        )}

                        {/* Show role for staff users */}
                        {isCurrentUserStaff && user && 'role' in user && (
                            <View style={styles.infoRow}>
                                <View style={styles.infoIconContainer}>
                                    <Ionicons name="person-outline" size={20} color="#64748B" />
                                </View>
                                <View style={styles.infoContent}>
                                    <Text style={styles.infoLabel}>Role</Text>
                                    <Text style={styles.infoValue}>
                                        {user.role.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                    </Text>
                                </View>
                            </View>
                        )}

                        {/* Show client ID for non-staff users */}
                        {!isCurrentUserStaff && !loading && userData.clientId && (
                            <View style={styles.infoRow}>
                                <View style={styles.infoIconContainer}>
                                    <Ionicons name="key-outline" size={20} color="#64748B" />
                                </View>
                                <View style={styles.infoContent}>
                                    <Text style={styles.infoLabel}>Client ID</Text>
                                    <Text style={styles.infoValue}>{userData.clientId}</Text>
                                </View>
                            </View>
                        )}

                        {loading && (
                            <View style={styles.infoRow}>
                                <View style={styles.infoIconContainer}>
                                    <Ionicons name="hourglass-outline" size={20} color="#64748B" />
                                </View>
                                <View style={styles.infoContent}>
                                    <Text style={styles.infoLabel}>Loading</Text>
                                    <Text style={styles.infoValue}>Please wait...</Text>
                                </View>
                            </View>
                        )}
                    </View>
                </View>



                {/* My Activities */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>My Activities</Text>
                    <TouchableOpacity
                        style={styles.activityButton}
                        onPress={async () => {
                            // Get user data to pass to activity page
                            const userDetailsString = await AsyncStorage.getItem("user");
                            if (userDetailsString) {
                                const userData = JSON.parse(userDetailsString);
                                router.push({
                                    pathname: '/my-activities',
                                    params: {
                                        user: JSON.stringify(userData)
                                    }
                                });
                            }
                        }}
                        activeOpacity={0.7}
                    >
                        <View style={styles.activityButtonLeft}>
                            <View style={styles.activityButtonIcon}>
                                <Ionicons name="time-outline" size={22} color="#3B82F6" />
                            </View>
                            <View style={styles.activityButtonContent}>
                                <Text style={styles.activityButtonTitle}>View My Activities</Text>
                                <Text style={styles.activityButtonSubtitle}>See your complete activity history</Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
                    </TouchableOpacity>
                </View>

                {/* Reports Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Reports</Text>
                    <TouchableOpacity
                        style={styles.reportButton}
                        onPress={() => setShowReportGenerator(true)}
                        activeOpacity={0.7}
                    >
                        <View style={styles.reportButtonLeft}>
                            <View style={styles.reportButtonIcon}>
                                <Ionicons name="document-text-outline" size={22} color="#10B981" />
                            </View>
                            <View style={styles.reportButtonContent}>
                                <Text style={styles.reportButtonTitle}>Generate Material Report</Text>
                                <Text style={styles.reportButtonSubtitle}>Download PDF report of material activities</Text>
                            </View>
                        </View>
                        <View style={styles.reportButtonBadge}>
                            <Ionicons name="download" size={16} color="#10B981" />
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Logout Button */}
                <View style={styles.section}>
                    <TouchableOpacity
                        style={styles.logoutButton}
                        onPress={handleLogout}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="log-out-outline" size={22} color="#EF4444" />
                        <Text style={styles.logoutText}>Logout</Text>
                    </TouchableOpacity>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>Construction Manager</Text>
                    <Text style={styles.footerVersion}>Version 1.0.0</Text>
                </View>
            </ScrollView>

            {/* Report Generator Modal */}
            <ReportGenerator
                visible={showReportGenerator}
                onClose={() => setShowReportGenerator(false)}
                clientData={clientData}
                userData={userData}
            />

            {/* QR Code Modal - Only for Staff with clients */}
            {isCurrentUserStaff && user && userData.clientId && (
                <Modal
                    visible={showQRCode}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setShowQRCode(false)}
                >
                    <View style={styles.qrModalOverlay}>
                        <View style={styles.qrModalContainer}>
                            <View style={styles.qrModalHeader}>
                                <Text style={styles.qrModalTitle}>Staff QR Code</Text>
                                <TouchableOpacity
                                    style={styles.qrModalCloseButton}
                                    onPress={() => setShowQRCode(false)}
                                >
                                    <Ionicons name="close" size={24} color="#64748B" />
                                </TouchableOpacity>
                            </View>
                            
                            <ViewShot ref={modalQRRef} options={{ format: 'png', quality: 1.0 }}>
                                <View style={styles.qrCodeContainer}>
                                    <QRCode
                                        value={JSON.stringify({
                                            staffId: user._id,
                                            firstName: user.firstName || 'Staff',
                                            lastName: user.lastName || 'Member',
                                            email: user.email || '',
                                            phoneNumber: user.phoneNumber || ('phone' in user ? user.phone : '') || '',
                                            role: 'role' in user ? user.role : 'staff',
                                            timestamp: new Date().toISOString()
                                        })}
                                        size={200}
                                        color="#1E293B"
                                        backgroundColor="#FFFFFF"
                                    />
                                    <View style={styles.modalQrCodeInfo}>
                                        <Text style={styles.modalQrCodeTitle}>Staff QR Code</Text>
                                        <Text style={styles.modalQrCodeSubtitle}>
                                            {`${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Staff Member'}
                                        </Text>
                                        <Text style={styles.modalQrCodeId}>ID: {user._id}</Text>
                                    </View>
                                </View>
                            </ViewShot>
                            
                            {/* Debug: Show QR Data */}
                            <TouchableOpacity
                                style={styles.debugButton}
                                onPress={() => {
                                    const qrData = JSON.stringify({
                                        staffId: user._id,
                                        firstName: user.firstName || 'Staff',
                                        lastName: user.lastName || 'Member',
                                        email: user.email || '',
                                        phoneNumber: user.phoneNumber || ('phone' in user ? user.phone : '') || '',
                                        role: 'role' in user ? user.role : 'staff',
                                        timestamp: new Date().toISOString()
                                    }, null, 2);
                                    Alert.alert('QR Code Data', qrData);
                                }}
                            >
                                <Text style={styles.debugButtonText}>Show QR Data</Text>
                            </TouchableOpacity>
                            
                            <View style={styles.qrInfoContainer}>
                                <Text style={styles.qrInfoTitle}>Staff Information</Text>
                                <View style={styles.qrInfoRow}>
                                    <Text style={styles.qrInfoLabel}>Name:</Text>
                                    <Text style={styles.qrInfoValue}>
                                        {`${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Staff Member'}
                                    </Text>
                                </View>
                                <View style={styles.qrInfoRow}>
                                    <Text style={styles.qrInfoLabel}>Role:</Text>
                                    <Text style={styles.qrInfoValue}>
                                        {'role' in user ? user.role?.replace('-', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'Staff' : 'Staff'}
                                    </Text>
                                </View>
                                <View style={styles.qrInfoRow}>
                                    <Text style={styles.qrInfoLabel}>Staff ID:</Text>
                                    <Text style={styles.qrInfoValue}>{user._id}</Text>
                                </View>
                                <View style={styles.qrInfoRow}>
                                    <Text style={styles.qrInfoLabel}>Status:</Text>
                                    <Text style={[styles.qrInfoValue, { 
                                        color: userData.clientId ? '#10B981' : '#F59E0B' 
                                    }]}>
                                        {userData.clientId ? 'Assigned to Client' : 'Not Assigned'}
                                    </Text>
                                </View>
                            </View>
                            
                            <Text style={styles.qrInstructions}>
                                This QR code contains your complete staff information. {userData.clientId 
                                    ? "Ask your admin to scan this to manage your project assignments."
                                    : "Ask your admin to scan this to assign you to their client organization and projects."}
                            </Text>

                            {/* Share Button in Modal */}
                            <TouchableOpacity
                                style={[styles.modalShareButton, isSharing && styles.shareButtonDisabled]}
                                onPress={() => shareQRCode(modalQRRef)}
                                activeOpacity={0.7}
                                disabled={isSharing}
                            >
                                <Ionicons 
                                    name={isSharing ? "hourglass-outline" : "share-outline"} 
                                    size={18} 
                                    color="#3B82F6" 
                                />
                                <Text style={styles.modalShareButtonText}>
                                    {isSharing ? 'Sharing...' : 'Share This QR Code'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        paddingTop: 20,
        paddingBottom: 30,
        alignItems: 'center',
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    avatarContainer: {
        marginBottom: 16,
    },
    avatar: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 8,
    },
    avatarText: {
        fontSize: 32,
        fontWeight: '700',
        color: '#3B82F6',
    },
    userName: {
        fontSize: 24,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 14,
        color: '#DBEAFE',
        marginBottom: 12,
    },
    companyBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        gap: 6,
    },
    companyText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#3B82F6',
    },
    staffBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ECFDF5',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        gap: 6,
        borderWidth: 1,
        borderColor: '#BBF7D0',
    },
    staffBadgeText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#10B981',
    },
    statsContainer: {
        padding: 16,
        marginTop: -20,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        borderWidth: 1,
    },
    statCardPrimary: {
        borderColor: '#DBEAFE',
    },
    statCardSuccess: {
        borderColor: '#D1FAE5',
    },
    statCardWarning: {
        borderColor: '#FEF3C7',
    },
    statCardDanger: {
        borderColor: '#FEE2E2',
    },
    cardClickIndicator: {
        position: 'absolute',
        top: 8,
        right: 8,
        opacity: 0.6,
    },
    statIconContainer: {
        marginBottom: 8,
    },
    statValue: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '500',
        textAlign: 'center',
    },
    section: {
        paddingHorizontal: 16,
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 12,
    },
    infoCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    urgentCard: {
        borderColor: '#FED7AA',
        backgroundColor: '#FFFBEB',
        shadowColor: '#F59E0B',
        shadowOpacity: 0.1,
    },
    shareCard: {
        borderColor: '#DBEAFE',
        backgroundColor: '#F8FAFC',
        shadowColor: '#3B82F6',
        shadowOpacity: 0.1,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    infoIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    infoContent: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 12,
        color: '#94A3B8',
        fontWeight: '500',
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 15,
        color: '#1E293B',
        fontWeight: '600',
    },
    menuCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: 16,
    },
    menuItemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    menuIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    menuItemText: {
        fontSize: 15,
        color: '#1E293B',
        fontWeight: '500',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        paddingVertical: 16,
        gap: 10,
        borderWidth: 2,
        borderColor: '#FEE2E2',
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    logoutText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#EF4444',
    },
    footer: {
        alignItems: 'center',
        paddingVertical: 24,
        paddingBottom: 40,
    },
    footerText: {
        fontSize: 13,
        color: '#94A3B8',
        fontWeight: '500',
        marginBottom: 4,
    },
    footerVersion: {
        fontSize: 12,
        color: '#CBD5E1',
    },
    // Activity button styles
    activityButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    activityButtonLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    activityButtonIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#EFF6FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    activityButtonContent: {
        flex: 1,
    },
    activityButtonTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1E293B',
        marginBottom: 2,
    },
    activityButtonSubtitle: {
        fontSize: 13,
        color: '#64748B',
    },
    // Report button styles
    reportButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
        borderWidth: 1,
        borderColor: '#D1FAE5',
    },
    reportButtonLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    reportButtonIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#ECFDF5',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    reportButtonContent: {
        flex: 1,
    },
    reportButtonTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1E293B',
        marginBottom: 2,
    },
    reportButtonSubtitle: {
        fontSize: 13,
        color: '#64748B',
    },
    reportButtonBadge: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: '#ECFDF5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    // QR Code button styles
    qrCodeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
        borderWidth: 1,
        borderColor: '#E9D5FF',
    },
    qrCodeButtonLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    qrCodeButtonIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#F3E8FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    qrCodeButtonContent: {
        flex: 1,
    },
    qrCodeButtonTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1E293B',
        marginBottom: 2,
    },
    qrCodeButtonSubtitle: {
        fontSize: 13,
        color: '#64748B',
    },
    qrCodeButtonBadge: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: '#F3E8FF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    // QR Code modal styles
    qrModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    qrModalContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 24,
        width: '100%',
        maxWidth: 350,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 10,
    },
    qrModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        marginBottom: 24,
    },
    qrModalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1E293B',
    },
    qrModalCloseButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        alignItems: 'center',
    },
    qrCodeContainer: {
        padding: 20,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    qrInfoContainer: {
        width: '100%',
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    qrInfoTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 12,
        textAlign: 'center',
    },
    qrInfoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    qrInfoLabel: {
        fontSize: 13,
        color: '#6B7280',
        fontWeight: '500',
    },
    qrInfoValue: {
        fontSize: 13,
        color: '#1F2937',
        fontWeight: '600',
        flex: 1,
        textAlign: 'right',
        marginLeft: 12,
    },
    qrInstructions: {
        fontSize: 12,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 18,
        paddingHorizontal: 8,
    },
    // Debug button styles
    debugButton: {
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        marginTop: 12,
        borderWidth: 1,
        borderColor: '#D1D5DB',
    },
    debugButtonText: {
        fontSize: 12,
        color: '#6B7280',
        textAlign: 'center',
        fontWeight: '500',
    },
    // Embedded QR code styles for staff
    embeddedQrContainer: {
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        marginBottom: 16,
    },
    embeddedQrInfo: {
        alignItems: 'center',
    },
    embeddedQrTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 4,
    },
    embeddedQrId: {
        fontSize: 12,
        fontFamily: 'monospace',
        color: '#6B7280',
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        marginBottom: 12,
    },
    embeddedQrInstructions: {
        fontSize: 12,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 16,
    },
    // Share functionality styles
    shareHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    shareIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#EFF6FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    shareContent: {
        flex: 1,
    },
    shareTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1E293B',
        marginBottom: 2,
    },
    shareSubtitle: {
        fontSize: 13,
        color: '#64748B',
    },
    shareButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#3B82F6',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 10,
        marginTop: 16,
        gap: 8,
    },
    shareButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    shareButtonSecondary: {
        backgroundColor: '#F3E8FF',
        borderWidth: 1,
        borderColor: '#E9D5FF',
        marginTop: 12,
    },
    shareButtonSecondaryText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#8B5CF6',
    },
    shareButtonDisabled: {
        opacity: 0.6,
    },
    // QR Code info styles
    qrCodeInfo: {
        alignItems: 'center',
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    qrCodeTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 4,
    },
    qrCodeSubtitle: {
        fontSize: 13,
        fontWeight: '500',
        color: '#1F2937',
        marginBottom: 2,
    },
    qrCodeId: {
        fontSize: 11,
        fontFamily: 'monospace',
        color: '#6B7280',
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    // Modal QR Code info styles
    modalQrCodeInfo: {
        alignItems: 'center',
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    modalQrCodeTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 4,
    },
    modalQrCodeSubtitle: {
        fontSize: 14,
        fontWeight: '500',
        color: '#1F2937',
        marginBottom: 4,
    },
    modalQrCodeId: {
        fontSize: 12,
        fontFamily: 'monospace',
        color: '#6B7280',
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 4,
    },
    // Modal share button styles
    modalShareButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        marginTop: 16,
        gap: 6,
        borderWidth: 1,
        borderColor: '#DBEAFE',
    },
    modalShareButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#3B82F6',
    },
});

export default CompanyProfile;
