import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLicenseCheck } from '@/hooks/useLicenseCheck';
import { useAuth } from '@/contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface LicenseGuardProps {
    children: React.ReactNode;
}

export const LicenseGuard: React.FC<LicenseGuardProps> = ({ children }) => {
    const { hasAccess, license, loading, error, recheckLicense } = useLicenseCheck();
    const { logout } = useAuth();
    const [userRole, setUserRole] = React.useState<string>('admin');

    React.useEffect(() => {
        const getUserRole = async () => {
            const userDetailsString = await AsyncStorage.getItem("user");
            if (userDetailsString) {
                const userData = JSON.parse(userDetailsString);
                setUserRole(userData.role || 'admin');
            }
        };
        getUserRole();
    }, []);

    const isStaff = userRole && userRole !== 'admin';

    // Show loading state
    if (loading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text style={styles.loadingText}>Verifying license...</Text>
            </View>
        );
    }

    // Show error state
    if (error) {
        return (
            <View style={styles.container}>
                <Ionicons name="alert-circle" size={64} color="#F59E0B" />
                <Text style={styles.errorTitle}>Unable to Verify License</Text>
                <Text style={styles.errorMessage}>{error}</Text>
                <View style={styles.errorButtonsContainer}>
                    <TouchableOpacity style={styles.retryButton} onPress={recheckLicense}>
                        <Ionicons name="refresh" size={20} color="#FFFFFF" />
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={styles.errorLogoutButton} 
                        onPress={async () => {
                            await logout();
                        }}
                    >
                        <Ionicons name="log-out-outline" size={20} color="#64748B" />
                        <Text style={styles.errorLogoutButtonText}>Logout</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    // Block access if license expired
    if (!hasAccess) {
        return (
            <LinearGradient
                colors={['#FEF2F2', '#FFFFFF']}
                style={styles.blockedContainer}
            >
                <View style={styles.blockedContent}>
                    {/* Icon */}
                    <View style={styles.iconContainer}>
                        <Ionicons name="lock-closed" size={80} color="#EF4444" />
                    </View>

                    {/* Title */}
                    <Text style={styles.blockedTitle}>License Expired</Text>

                    {/* Message */}
                    <Text style={styles.blockedMessage}>
                        {isStaff 
                            ? "Your assigned client's subscription has expired. Please contact your admin or the client to renew their license and regain access."
                            : "Your subscription has expired. Please contact support to renew your license and regain access to the application."
                        }
                    </Text>

                    {/* License Info */}
                    <View style={styles.infoCard}>
                        <View style={styles.infoRow}>
                            <Ionicons name="calendar-outline" size={20} color="#64748B" />
                            <Text style={styles.infoLabel}>License Status:</Text>
                            <Text style={styles.infoValueExpired}>Expired</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Ionicons name="time-outline" size={20} color="#64748B" />
                            <Text style={styles.infoLabel}>Days Remaining:</Text>
                            <Text style={styles.infoValueExpired}>{license} days</Text>
                        </View>
                    </View>

                    {/* Actions */}
                    <View style={styles.actionsContainer}>
                        {!isStaff && (
                            <>
                                <TouchableOpacity
                                    style={styles.contactButton}
                                    onPress={() => {
                                        // Open email or phone
                                        Linking.openURL('mailto:support@example.com?subject=License Renewal Request');
                                    }}
                                >
                                    <Ionicons name="mail" size={20} color="#FFFFFF" />
                                    <Text style={styles.contactButtonText}>Contact Support</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.callButton}
                                    onPress={() => {
                                        Linking.openURL('tel:+1234567890');
                                    }}
                                >
                                    <Ionicons name="call" size={20} color="#3B82F6" />
                                    <Text style={styles.callButtonText}>Call Support</Text>
                                </TouchableOpacity>
                            </>
                        )}

                        {isStaff && (
                            <View style={styles.staffNotice}>
                                <Ionicons name="information-circle" size={24} color="#3B82F6" />
                                <Text style={styles.staffNoticeText}>
                                    Please contact your admin to resolve this issue.
                                </Text>
                            </View>
                        )}

                        <TouchableOpacity
                            style={styles.logoutButton}
                            onPress={async () => {
                                await logout();
                            }}
                        >
                            <Ionicons name="log-out-outline" size={20} color="#64748B" />
                            <Text style={styles.logoutButtonText}>Logout</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Refresh Button */}
                    <TouchableOpacity
                        style={styles.refreshButton}
                        onPress={recheckLicense}
                    >
                        <Ionicons name="refresh" size={16} color="#64748B" />
                        <Text style={styles.refreshButtonText}>Check Again</Text>
                    </TouchableOpacity>
                </View>
            </LinearGradient>
        );
    }

    // License valid - show children
    return <>{children}</>;
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        padding: 20,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#64748B',
        fontWeight: '500',
    },
    errorTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1E293B',
        marginTop: 16,
        marginBottom: 8,
    },
    errorMessage: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
        marginBottom: 24,
    },
    errorButtonsContainer: {
        width: '100%',
        gap: 12,
        alignItems: 'center',
    },
    retryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#3B82F6',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
        gap: 8,
    },
    retryButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    errorLogoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
        gap: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    errorLogoutButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#64748B',
    },
    blockedContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    blockedContent: {
        width: '100%',
        maxWidth: 400,
        alignItems: 'center',
    },
    iconContainer: {
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: '#FEE2E2',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    blockedTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: '#EF4444',
        marginBottom: 12,
        textAlign: 'center',
    },
    blockedMessage: {
        fontSize: 16,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
        paddingHorizontal: 20,
    },
    infoCard: {
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 8,
    },
    infoLabel: {
        fontSize: 14,
        color: '#64748B',
        flex: 1,
    },
    infoValueExpired: {
        fontSize: 14,
        fontWeight: '700',
        color: '#EF4444',
    },
    actionsContainer: {
        width: '100%',
        gap: 12,
    },
    contactButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#EF4444',
        paddingVertical: 16,
        borderRadius: 12,
        gap: 8,
    },
    contactButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    callButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        paddingVertical: 16,
        borderRadius: 12,
        gap: 8,
        borderWidth: 2,
        borderColor: '#3B82F6',
    },
    callButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#3B82F6',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F8FAFC',
        paddingVertical: 16,
        borderRadius: 12,
        gap: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    logoutButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#64748B',
    },
    refreshButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 24,
        gap: 6,
    },
    refreshButtonText: {
        fontSize: 14,
        color: '#64748B',
    },
    staffNotice: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EFF6FF',
        padding: 16,
        borderRadius: 12,
        gap: 12,
        borderWidth: 1,
        borderColor: '#BFDBFE',
    },
    staffNoticeText: {
        flex: 1,
        fontSize: 14,
        color: '#1E40AF',
        lineHeight: 20,
    },
});
