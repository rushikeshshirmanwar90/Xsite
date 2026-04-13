import ProjectCard from '@/components/ProjectCard';
import { getClientId } from '@/functions/clientId';
import { getProjectData } from '@/functions/project';
import { isAdmin, useUser } from '@/hooks/useUser';
import { domain } from '@/lib/domain';
import { generateInitials } from '@/lib/functions';
import { styles } from "@/style/adminHome";
import { Project } from '@/types/project';
import { StaffMembers } from '@/types/staff';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useRouter } from 'expo-router';
import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'react-native-qrcode-svg';
import * as Sharing from 'expo-sharing';
import ViewShot from 'react-native-view-shot';
import PushTokenStatusIndicator from '@/components/PushTokenStatusIndicator';
import {
    Alert,
    Image,
    RefreshControl,
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Main App Component
const Index: React.FC = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [staffMembers, setStaffMembers] = useState<StaffMembers[]>([]);
    const [clientId, setClientId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [companyName, setCompanyName] = useState<string>('Company Name');
    const [companyLogo, setCompanyLogo] = useState<string | null>(null);
    const [logoError, setLogoError] = useState<boolean>(false);
    const [isSharing, setIsSharing] = useState(false);

    // Refs for capturing QR code views
    const embeddedQRRef = useRef<ViewShot | null>(null);

    // Get user role for access control
    const { user, refreshUser } = useUser();
    const userIsAdmin = isAdmin(user);
    
    // Check if user is staff (has role field)
    const isStaff = user && 'role' in user;
    
    // Get user name from user data
    const userName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'User';

    // Performance optimization
    const isLoadingRef = React.useRef(false);
    const lastLoadTimeRef = React.useRef<number>(0);
    const isInitializedRef = React.useRef(false);
    const DEBOUNCE_DELAY = 500;

    // Simplified fetch project data function
    const fetchProjectData = async (showLoadingState = true) => {
        // Prevent duplicate calls
        if (isLoadingRef.current) {
            console.log('⏸️ Skipping fetch - already loading');
            return;
        }

        // Debounce
        const now = Date.now();
        if (now - lastLoadTimeRef.current < DEBOUNCE_DELAY) {
            console.log('⏸️ Skipping fetch - debounced');
            return;
        }
        lastLoadTimeRef.current = now;

        // Wait for user data to be available
        if (!user) {
            console.log('⏳ User data not available, skipping project fetch');
            return;
        }

        try {
            isLoadingRef.current = true;
            if (showLoadingState) {
                setLoading(true);
            }
            setError(null);

            const clientId = await getClientId();
            setClientId(clientId);

            // Check if user is staff and handle assigned projects
            if (isStaff && user) {
                console.log('👤 Staff user detected - fetching staff data with populated projects');
                
                try {
                    // Fetch staff data with populated projects in one API call
                    // Use skipCache=true to ensure fresh data with license status
                    const response = await axios.get(`${domain}/api/users/staff?id=${user._id}&getAllProjects=true&skipCache=true`);
                    const responseData = response.data as any;
                    
                    if (responseData.success && responseData.data) {
                        const staffData = responseData.data;
                        console.log('✅ Staff data fetched:', staffData);
                        
                        // Extract populated project data from assignedProjects
                        if (staffData.assignedProjects && Array.isArray(staffData.assignedProjects) && staffData.assignedProjects.length > 0) {
                            const populatedProjects = staffData.assignedProjects
                                .map((assignment: any) => {
                                    const projectData = assignment.projectData || assignment.projectId;
                                    if (projectData && projectData._id) {
                                        // Add client information AND license status to the project data
                                        return {
                                            ...projectData,
                                            clientName: assignment.clientName || 'Unknown Client',
                                            clientId: assignment.clientId,
                                            // License status fields are already in projectData from backend
                                            isAccessible: projectData.isAccessible,
                                            licenseStatus: projectData.licenseStatus,
                                            blockReason: projectData.blockReason
                                        };
                                    }
                                    return null;
                                })
                                .filter((project: any) => project !== null);
                            
                            console.log(`📊 Found ${populatedProjects.length} populated projects for staff user`);
                            console.log('🔍 Sample project with license status:', populatedProjects[0]);
                            
                            // Debug: Log all projects with their license status
                            populatedProjects.forEach((proj: any, idx: number) => {
                                console.log(`Project ${idx + 1}: ${proj.name}`, {
                                    isAccessible: proj.isAccessible,
                                    licenseStatus: proj.licenseStatus,
                                    blockReason: proj.blockReason,
                                    clientName: proj.clientName
                                });
                            });
                            
                            setProjects(populatedProjects);
                            return;
                        } else {
                            console.log('⚠️ Staff has no assigned projects');
                        }
                    } else {
                        console.log('❌ Failed to fetch staff data');
                    }
                } catch (error) {
                    console.error('❌ Error fetching staff data:', error);
                    setError('Failed to fetch assigned projects');
                }
                
                // If we reach here, no projects were found for staff
                setProjects([]);
                
            } else if (clientId) {
                // For non-staff users (admin/client), fetch all client projects
                console.log('👔 Admin/Client user detected - fetching all client projects');
                
                const userRole = user && 'role' in user ? 'staff' : 'admin';
                const projectData = await getProjectData(clientId, undefined, true, userRole);
                const projectsArray = Array.isArray(projectData) ? projectData : [];
                setProjects(projectsArray);
            } else {
                // No clientId - staff without clients
                console.log('⚠️ No clientId - skipping project fetch');
                setProjects([]);
            }
        } catch (error) {
            console.error('Failed to fetch projects:', error);
            setError('Failed to fetch projects');
        } finally {
            isLoadingRef.current = false;
            setLoading(false);
        }
    };

    // Fetch client data for company name and logo
    useEffect(() => {
        const fetchClientData = async () => {
            try {
                const clientId = await getClientId();
                
                if (!clientId) {
                    console.log('⚠️ No clientId - skipping client data fetch');
                    return;
                }
                
                console.log('📝 Fetching client data for:', clientId);
                // Add cache-busting parameter to ensure fresh data
                const response = await axios.get(`${domain}/api/clients?id=${clientId}&_t=${Date.now()}`);
                const responseData = response.data as any;

                console.log('📦 Client API Response:', responseData);

                // Handle new response structure: { success, message, data }
                if (responseData.success && responseData.data) {
                    const client = responseData.data;
                    console.log('✅ Client data loaded:', {
                        name: client.companyName || client.name,
                        hasLogo: !!client.logo,
                        logoUrl: client.logo
                    });
                    
                    setCompanyName(client.companyName || client.name || 'Company Name');
                    
                    if (client.logo) {
                        console.log('🖼️ Setting company logo:', client.logo);
                        setCompanyLogo(client.logo);
                        setLogoError(false); // Reset error state
                    } else {
                        console.log('⚠️ No logo found in client data');
                        setCompanyLogo(null);
                    }
                }
                // Fallback for old response structure: { clientData }
                else if (responseData.clientData) {
                    const client = responseData.clientData;
                    console.log('✅ Client data loaded (legacy):', {
                        name: client.companyName || client.name,
                        hasLogo: !!client.logo,
                        logoUrl: client.logo
                    });
                    
                    setCompanyName(client.companyName || client.name || 'Company Name');
                    
                    if (client.logo) {
                        console.log('🖼️ Setting company logo:', client.logo);
                        setCompanyLogo(client.logo);
                        setLogoError(false); // Reset error state
                    } else {
                        console.log('⚠️ No logo found in client data');
                        setCompanyLogo(null);
                    }
                } else {
                    console.warn('⚠️ Unexpected client response structure:', responseData);
                }
            } catch (error: unknown) {
                console.error('❌ Error fetching client data:', error);
                if (axios.isAxiosError(error)) {
                    console.error('Response data:', error.response?.data);
                    console.error('Response status:', error.response?.status);
                }
            }
        };

        fetchClientData();
    }, []);

    // Initial data fetch
    useEffect(() => {
        const initializeData = async () => {
            // Prevent multiple initializations
            if (isInitializedRef.current) {
                console.log('⏸️ Already initialized, skipping...');
                return;
            }
            
            // Wait for user data to be available before fetching projects
            if (!user) {
                console.log('⏳ User data not available yet, waiting...');
                return;
            }
            
            console.log('🚀 Initializing data with user:', user);
            isInitializedRef.current = true;
            
            // For staff users, refresh user data first to ensure we have latest assignedProjects
            if (user && 'role' in user) {
                console.log('🔄 Staff user detected - refreshing user data');
                try {
                    await refreshUser();
                    console.log('✅ User data refreshed successfully');
                } catch (error) {
                    console.error('❌ Failed to refresh user data:', error);
                }
            }
            
            // Then fetch project data
            fetchProjectData();
        };
        
        initializeData();
    }, [user?._id]);

    // Pull to refresh handler
    const onRefresh = async () => {
        if (refreshing || isLoadingRef.current) {
            return;
        }

        setRefreshing(true);
        try {
            isInitializedRef.current = false; // Reset initialization flag
            await fetchProjectData(false); // Don't show loading state during refresh
        } finally {
            setRefreshing(false);
        }
    };

    const router = useRouter();

    // Fetch staff data
    useEffect(() => {
        const getStaffData = async () => {
            if (!clientId) {
                console.log('⚠️ No clientId - skipping staff fetch');
                return;
            }
            
            try {
                const res = await axios.get(`${domain}/api/staff?clientId=${clientId}`);
                const data = (res.data as any)?.data || [];
                const filterData = data.map((item: any) => {
                    return {
                        fullName: `${item.firstName} ${item.lastName}`,
                        _id: item._id,
                    }
                });
                setStaffMembers(filterData);
            } catch (error) {
                console.error('Failed to fetch staff data:', error);
            }
        };

        getStaffData();
    }, [clientId]);

    const handleViewDetails = (project: Project) => {
        console.log('Navigating to project:', project._id);

        const sections = project.section || [];

        // If only one section, navigate directly to details
        if (sections.length === 1) {
            const section = sections[0];
            router.push({
                pathname: '/details',
                params: {
                    projectId: project._id ?? '',
                    projectName: project.name,
                    sectionId: section._id || section.sectionId,
                    sectionName: section.name
                    // ✅ OPTIMIZED: Removed material data - will be fetched in details page
                }
            });
        } else if (sections.length > 1) {
            // Multiple sections - show section selection page
            router.push({
                pathname: '/project-sections',
                params: {
                    id: project._id ?? '',
                    name: project.name,
                    sectionData: JSON.stringify(sections)
                    // ✅ OPTIMIZED: Removed material data - will be fetched when needed
                }
            });
        } else {
            // No sections - show section selection with empty state
            router.push({
                pathname: '/project-sections',
                params: {
                    id: project._id ?? '',
                    name: project.name,
                    sectionData: JSON.stringify([])
                    // ✅ OPTIMIZED: Removed material data - will be fetched when needed
                }
            });
        }
    };

    const companyInitials = generateInitials(companyName);

    const shareQRCode = async (viewShotRef: React.RefObject<ViewShot | null>) => {
        if (!viewShotRef.current || !user) {
            Alert.alert('Error', 'QR code not ready for sharing. Please try again.');
            return;
        }

        setIsSharing(true);
        try {
            console.log('📱 Starting QR code sharing process...');
            
            const isAvailable = await Sharing.isAvailableAsync();
            if (!isAvailable) {
                Alert.alert(
                    'Sharing Not Available',
                    'Sharing is not available on this device. Please take a screenshot instead.',
                    [{ text: 'OK' }]
                );
                return;
            }

            const uri = await (viewShotRef.current as any)?.capture({
                format: 'png',
                quality: 1.0,
            });

            if (!uri) {
                throw new Error('Failed to capture QR code image');
            }

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

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
            
            {/* Header - Show only for admin users */}
            {userIsAdmin && (
                <View style={styles.fixedHeader}>
                    <View style={styles.userInfo}>
                        {companyLogo && !logoError ? (
                            <Image
                                source={{ uri: companyLogo }}
                                style={styles.companyLogo}
                                resizeMode="contain"
                                onError={(error) => {
                                    console.error('❌ Error loading company logo:', error.nativeEvent.error);
                                    console.log('Logo URL that failed:', companyLogo);
                                    setLogoError(true);
                                }}
                                onLoad={() => {
                                    console.log('✅ Company logo loaded successfully');
                                }}
                            />
                        ) : (
                            <View style={styles.avatarContainer}>
                                <Text style={styles.avatarText}>{companyInitials}</Text>
                            </View>
                        )}
                        <View style={styles.userDetails}>
                            <Text style={styles.userName}>{companyName}</Text>
                            <Text style={styles.userSubtitle}>Project Management Dashboard</Text>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.notificationButton}
                        onPress={() => router.push('/notification' as any)}
                    >
                        <Ionicons name="notifications" size={22} color="#1F2937" />
                    </TouchableOpacity>
                </View>
            )}

            {/* QR Code Section - Priority for unassigned staff */}
            {isStaff && user && !clientId && (
                <View style={styles.section}>  
                    <View style={[styles.qrCodeCard, styles.shareCard]}>
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
                        
                        {/* Push Token Status for Staff */}
                        <PushTokenStatusIndicator showDetails={true} />
                    </View>
                </View>
            )}

            {/* Section Header */}
            <View style={styles.sectionHeader}>
                <View>
                    <Text style={styles.sectionTitle}>My Projects</Text>
                    {userIsAdmin && <View style={styles.sectionDivider} />}
                </View>
            </View>

            <ScrollView
                style={styles.projectsList}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#3B82F6']}
                        tintColor="#3B82F6"
                        title="Pull to refresh"
                        titleColor="#64748B"
                    />
                }
            >
                {loading ? (
                    <View style={styles.centerContainer}>
                        <View style={{ alignItems: 'center', marginBottom: 16 }}>
                            <Ionicons name="sync" size={48} color="#3B82F6" />
                        </View>
                        <Text style={styles.loadingText}>Loading projects...</Text>
                        <Text style={[styles.loadingText, { fontSize: 12, marginTop: 4, color: '#94A3B8' }]}>Please wait...</Text>
                    </View>
                ) : error ? (
                    <View style={styles.centerContainer}>
                        <Text style={styles.errorText}>{error}</Text>
                        <TouchableOpacity
                            style={[styles.retryButton, loading && { opacity: 0.5 }]}
                            onPress={() => fetchProjectData()}
                            disabled={loading}
                        >
                            <Text style={styles.retryButtonText}>
                                {loading ? 'Loading...' : 'Retry'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={{ marginBottom: 24 }}>
                        {projects && projects.length > 0 ? (
                            <>
                                {projects.map((project, index) => (
                                    <View key={index} style={{ marginBottom: 10 }}>
                                        <ProjectCard
                                            key={project._id}
                                            project={project}
                                            onViewDetails={handleViewDetails}
                                            userType={userIsAdmin ? 'admin' : (isStaff ? 'staff' : 'client')}
                                        />
                                    </View>
                                ))}
                            </>
                        ) : (
                            <View style={styles.centerContainer}>
                                <Text style={styles.emptyText}>No projects found</Text>
                                <Text style={styles.emptySubText}>
                                    {userIsAdmin
                                        ? 'Tap "Add Project" to create your first project'
                                        : 'No projects available. Contact your admin to add projects.'}
                                </Text>
                            </View>
                        )}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

export default Index;