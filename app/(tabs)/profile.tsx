import { useAuth } from '@/contexts/AuthContext';
import { getClientId } from '@/functions/clientId';
import { getProjectData } from '@/functions/project';
import { domain } from '@/lib/domain';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
    Alert,
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
            
            // Refetch everything fresh
            fetchUserData();
            fetchStats();
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
            const projectData = await getProjectData(clientId);
            console.log('📊 Raw project data response:', projectData);
            
            // Handle both old and new response formats
            let projectsArray = [];
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
            
            console.log('📊 Projects array for stats:', projectsArray.length, 'projects');

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
                    {userData.company && (
                        <View style={styles.companyBadge}>
                            <Ionicons name="business" size={14} color="#3B82F6" />
                            <Text style={styles.companyText}>{userData.company}</Text>
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

                {/* Client Details */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Client Information</Text>
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
                    </View>
                </View>

                {/* Account Info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Account Information</Text>
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

                        {!loading && userData.clientId && (
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
});

export default CompanyProfile;
