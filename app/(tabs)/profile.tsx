import { useAuth } from '@/contexts/AuthContext';
import { getClientId } from '@/functions/clientId';
import { getProjectData } from '@/functions/project';
import { domain } from '@/lib/domain';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
    activeProjects: number;
    totalMaterials: number;
    totalSpent: number;
}

const CompanyProfile: React.FC = () => {
    const { logout } = useAuth();
    const [userData, setUserData] = useState<UserData>({});
    const [clientData, setClientData] = useState<ClientData>({});
    const [stats, setStats] = useState<ProjectStats>({
        totalProjects: 0,
        activeProjects: 0,
        totalMaterials: 0,
        totalSpent: 0,
    });
    const [loading, setLoading] = useState(true);
    const [loadingClient, setLoadingClient] = useState(true);

    useEffect(() => {
        fetchUserData();
        fetchStats();
    }, []);

    const fetchUserData = async () => {
        try {
            const userDetailsString = await AsyncStorage.getItem("user");
            if (userDetailsString) {
                const data = JSON.parse(userDetailsString);
                const clientId = data.clientId || '';

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
                if (clientId) {
                    await fetchClientData(clientId);
                } else {
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
            const response = await axios.get(`${domain}/api/client?id=${clientId}`);

            const responseData = response.data as any;
            if (responseData && responseData.clientData) {
                const client = responseData.clientData;
                setClientData({
                    _id: client._id,
                    name: client.name,
                    email: client.email,
                    phone: client.phone,
                    address: client.address,
                    city: client.city,
                    state: client.state,
                    country: client.country,
                    companyName: client.companyName,
                    gstNumber: client.gstNumber,
                });
            }
        } catch (error) {
            console.error('Error fetching client data:', error);
        } finally {
            setLoadingClient(false);
        }
    };

    const fetchStats = async () => {
        try {
            const clientId = await getClientId();
            if (!clientId) return;

            // Fetch projects
            const projects = await getProjectData(clientId);
            const projectsArray = Array.isArray(projects) ? projects : [];

            // Calculate stats
            let totalMaterials = 0;
            let totalSpent = 0;
            let activeProjects = 0;

            projectsArray.forEach((project: any) => {
                const availableMaterials = project.MaterialAvailable || [];
                const usedMaterials = project.MaterialUsed || [];

                totalMaterials += availableMaterials.length + usedMaterials.length;

                const availableCost = availableMaterials.reduce((sum: number, m: any) => sum + (m.cost || 0), 0);
                const usedCost = usedMaterials.reduce((sum: number, m: any) => sum + (m.cost || 0), 0);
                totalSpent += availableCost + usedCost;

                if (availableMaterials.length > 0 || usedMaterials.length > 0) {
                    activeProjects++;
                }
            });

            setStats({
                totalProjects: projectsArray.length,
                activeProjects,
                totalMaterials,
                totalSpent,
            });
        } catch (error) {
            console.error('Error fetching stats:', error);
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

    const settingsItems = [
        { icon: 'person-outline', label: 'Edit Profile', action: () => Alert.alert('Coming Soon', 'Profile editing will be available soon') },
    ];

    const activityItems = [
        { icon: 'cube-outline', label: 'Material Activities', action: () => Alert.alert('Coming Soon', 'Material activity history coming soon') },
        { icon: 'hammer-outline', label: 'Project Activities', action: () => Alert.alert('Coming Soon', 'Project activity history coming soon') },
        { icon: 'people-outline', label: 'Staff Activities', action: () => Alert.alert('Coming Soon', 'Staff activity history coming soon') },
    ];

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#3B82F6" />

            <ScrollView showsVerticalScrollIndicator={false}>
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

                        <View style={[styles.statCard, styles.statCardSuccess]}>
                            <View style={styles.statIconContainer}>
                                <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                            </View>
                            <Text style={styles.statValue}>
                                {loading ? '...' : stats.activeProjects}
                            </Text>
                            <Text style={styles.statLabel}>Active Projects</Text>
                        </View>
                    </View>

                    <View style={styles.statsRow}>
                        <View style={[styles.statCard, styles.statCardWarning]}>
                            <View style={styles.statIconContainer}>
                                <Ionicons name="cube" size={24} color="#F59E0B" />
                            </View>
                            <Text style={styles.statValue}>
                                {loading ? '...' : stats.totalMaterials}
                            </Text>
                            <Text style={styles.statLabel}>Materials</Text>
                        </View>

                        <View style={[styles.statCard, styles.statCardDanger]}>
                            <View style={styles.statIconContainer}>
                                <Ionicons name="cash" size={24} color="#EF4444" />
                            </View>
                            <Text style={styles.statValue}>
                                {loading ? '...' : formatCurrency(stats.totalSpent)}
                            </Text>
                            <Text style={styles.statLabel}>Total Spent</Text>
                        </View>
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

                                {clientData.name && (
                                    <View style={styles.infoRow}>
                                        <View style={styles.infoIconContainer}>
                                            <Ionicons name="person-outline" size={20} color="#64748B" />
                                        </View>
                                        <View style={styles.infoContent}>
                                            <Text style={styles.infoLabel}>Contact Person</Text>
                                            <Text style={styles.infoValue}>{clientData.name}</Text>
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

                                {!clientData.name && !clientData.email && !clientData.phone && (
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

                {/* Settings */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Settings</Text>
                    <View style={styles.menuCard}>
                        {settingsItems.map((item, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.menuItem,
                                    index !== settingsItems.length - 1 && styles.menuItemBorder
                                ]}
                                onPress={item.action}
                                activeOpacity={0.7}
                            >
                                <View style={styles.menuItemLeft}>
                                    <View style={styles.menuIconContainer}>
                                        <Ionicons name={item.icon as any} size={22} color="#64748B" />
                                    </View>
                                    <Text style={styles.menuItemText}>{item.label}</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* My Activity */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>My Activity</Text>
                    <View style={styles.menuCard}>
                        {activityItems.map((item, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.menuItem,
                                    index !== activityItems.length - 1 && styles.menuItemBorder
                                ]}
                                onPress={item.action}
                                activeOpacity={0.7}
                            >
                                <View style={styles.menuItemLeft}>
                                    <View style={styles.menuIconContainer}>
                                        <Ionicons name={item.icon as any} size={22} color="#64748B" />
                                    </View>
                                    <Text style={styles.menuItemText}>{item.label}</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
                            </TouchableOpacity>
                        ))}
                    </View>
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
});

export default CompanyProfile;
