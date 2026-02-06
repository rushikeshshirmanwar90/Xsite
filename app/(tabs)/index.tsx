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
import NotificationPermissionFixer from '@/components/NotificationPermissionFixer';
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
    const [isSharing, setIsSharing] = useState(false);

    // Refs for capturing QR code views
    const embeddedQRRef = useRef<ViewShot | null>(null);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalProjects, setTotalProjects] = useState(0);
    const [hasNextPage, setHasNextPage] = useState(false);
    const [hasPrevPage, setHasPrevPage] = useState(false);
    const [itemsPerPage] = useState(10);

    // Get user role for access control
    const { user, refreshUser } = useUser();
    const userIsAdmin = isAdmin(user);
    
    // Check if user is a client (has clientId but is not staff)
    const isClient = user && 'clientId' in user && !('role' in user);
    
    // Check if user is staff (has role field)
    const isStaff = user && 'role' in user;
    
    // Get user name from user data
    const userName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'User';

    // Performance optimization
    const isLoadingRef = React.useRef(false);
    const lastLoadTimeRef = React.useRef<number>(0);
    const isInitializedRef = React.useRef(false);
    const DEBOUNCE_DELAY = 500;

    // Fetch project data function with pagination
    const fetchProjectData = async (page: number = currentPage, showLoadingState = true) => {
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

            // ✅ Check if user is staff and handle assigned projects
            const isStaff = user && 'role' in user;
            
            if (isStaff && user) {
                console.log('👤 Staff user detected - fetching staff data with populated projects');
                
                try {
                    // ✅ OPTIMIZED APPROACH: Fetch staff data with populated projects in one API call
                    // For staff users, we need ALL their assigned projects from ALL clients, not just one client
                    console.log('🔄 Fetching staff data with ALL populated assignedProjects...');
                    const response = await axios.get(`${domain}/api/users/staff?id=${user._id}&getAllProjects=true`);
                    const responseData = response.data as any;
                    
                    if (responseData.success && responseData.data) {
                        const staffData = responseData.data;
                        console.log('✅ Staff data fetched:', staffData);
                        console.log('🔍 Staff assignedProjects structure:', staffData.assignedProjects);
                        
                        // Extract populated project data from assignedProjects
                        if (staffData.assignedProjects && Array.isArray(staffData.assignedProjects) && staffData.assignedProjects.length > 0) {
                            console.log('🔍 Processing assignedProjects...');
                            
                            const populatedProjects = staffData.assignedProjects
                                .map((assignment: any, index: number) => {
                                    console.log(`🔍 Assignment ${index}:`, {
                                        clientId: assignment.clientId,
                                        clientName: assignment.clientName,
                                        projectName: assignment.projectName,
                                        projectData: assignment.projectData ? 'Present' : 'Missing'
                                    });
                                    
                                    const projectData = assignment.projectData || assignment.projectId;
                                    if (projectData && projectData._id) {
                                        // Add client information to the project data
                                        const finalProject = {
                                            ...projectData,
                                            clientName: assignment.clientName || 'Unknown Client', // Get clientName from assignment
                                            clientId: assignment.clientId
                                        };
                                        
                                        console.log(`✅ Final project ${index}:`, {
                                            name: finalProject.name,
                                            clientName: finalProject.clientName,
                                            clientId: finalProject.clientId
                                        });
                                        
                                        return finalProject;
                                    }
                                    console.log(`❌ Invalid project data for assignment ${index}`);
                                    return null;
                                })
                                .filter((project: any) => project !== null); // Filter out null/invalid projects
                            
                            console.log(`📊 Found ${populatedProjects.length} populated projects for staff user`);
                            console.log('🔍 Sample project with client info:', populatedProjects[0]);
                            
                            if (populatedProjects.length > 0) {
                                // ✅ Show ALL assigned projects for staff users
                                console.log(`📄 Showing all ${populatedProjects.length} assigned projects for staff user`);
                                
                                setProjects(populatedProjects); // Show ALL assigned projects
                                setCurrentPage(1); // Always page 1 for staff
                                setTotalPages(1); // Only 1 page since we show all
                                setTotalProjects(populatedProjects.length);
                                setHasNextPage(false); // No pagination for staff
                                setHasPrevPage(false); // No pagination for staff
                                return;
                            } else {
                                console.log('❌ No valid populated projects found');
                            }
                        } else {
                            console.log('⚠️ Staff has no assigned projects or assignedProjects is empty');
                        }
                    } else {
                        console.log('❌ Failed to fetch staff data or invalid response structure');
                    }
                } catch (error) {
                    console.error('❌ Error fetching staff data with populated projects:', error);
                    setError('Failed to fetch assigned projects');
                }
                
                // If we reach here, no projects were found
                console.log('📭 No assigned projects found for staff user - showing empty state');
                setProjects([]);
                setCurrentPage(1);
                setTotalPages(1);
                setTotalProjects(0);
                setHasNextPage(false);
                setHasPrevPage(false);
                
            } else if (clientId) {
                // For non-staff users (admin/client), fetch all client projects
                console.log('👔 Admin/Client user detected - fetching all client projects');
                
                const { projects: projectData, meta } = await getProjectData(
                    clientId, 
                    page, 
                    itemsPerPage
                );
                setProjects(Array.isArray(projectData) ? projectData : []);

                // Update pagination state
                setCurrentPage(meta.page);
                setTotalPages(meta.totalPages);
                setTotalProjects(meta.total);
                setHasNextPage(meta.hasNextPage);
                setHasPrevPage(meta.hasPrevPage);
            } else {
                // No clientId - staff without clients
                console.log('⚠️ No clientId - skipping project fetch');
                setProjects([]);
                setCurrentPage(1);
                setTotalPages(1);
                setTotalProjects(0);
                setHasNextPage(false);
                setHasPrevPage(false);
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
                
                // ✅ Only fetch client data if clientId exists
                if (!clientId) {
                    console.log('⚠️ No clientId - skipping client data fetch');
                    return;
                }
                
                console.log('📝 Fetching client data for:', clientId);
                const response = await axios.get(`${domain}/api/client?id=${clientId}`);
                const responseData = response.data as any;

                console.log('📦 Client API Response:', JSON.stringify(responseData, null, 2));

                // Handle new response structure: { success, message, data }
                if (responseData.success && responseData.data) {
                    const client = responseData.data;
                    setCompanyName(client.companyName || client.name || 'Company Name');
                    setCompanyLogo(client.logo || null);
                    console.log('✅ Client data loaded:', client.companyName || client.name);
                }
                // Fallback for old response structure: { clientData }
                else if (responseData.clientData) {
                    const client = responseData.clientData;
                    setCompanyName(client.companyName || client.name || 'Company Name');
                    setCompanyLogo(client.logo || null);
                    console.log('✅ Client data loaded (legacy):', client.companyName || client.name);
                } else {
                    console.warn('⚠️ Unexpected client response structure:', responseData);
                }
            } catch (error: unknown) {
                console.error('❌ Error fetching client data:', error);
                if (error && typeof error === 'object' && 'response' in error) {
                    const axiosError = error as { response?: { data?: unknown; status?: number } };
                    console.error('Response:', axiosError.response?.data);
                    console.error('Status:', axiosError.response?.status);
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
                console.log('🔄 Staff user detected - refreshing user data to get latest assignedProjects');
                try {
                    await refreshUser();
                    console.log('✅ User data refreshed successfully');
                } catch (error) {
                    console.error('❌ Failed to refresh user data:', error);
                }
            }
            
            // Then fetch project data
            fetchProjectData(1);
        };
        
        initializeData();
    }, [user?._id]); // Only depend on user ID to prevent infinite loops

    // Pull to refresh handler
    const onRefresh = async () => {
        // Prevent multiple refresh calls
        if (refreshing || isLoadingRef.current) {
            return;
        }

        setRefreshing(true);
        try {
            setCurrentPage(1); // Reset to first page on refresh
            isInitializedRef.current = false; // Reset initialization flag to allow fresh data fetch
            await fetchProjectData(1, false); // Don't show loading state during refresh
        } finally {
            setRefreshing(false);
        }
    };

    // Pagination handlers
    const handleNextPage = () => {
        if (hasNextPage && !loading) {
            const nextPage = currentPage + 1;
            setCurrentPage(nextPage);
            fetchProjectData(nextPage);
        }
    };

    const handlePrevPage = () => {
        if (hasPrevPage && !loading) {
            const prevPage = currentPage - 1;
            setCurrentPage(prevPage);
            fetchProjectData(prevPage);
        }
    };

    const handleGoToPage = (page: number) => {
        if (page >= 1 && page <= totalPages && page !== currentPage && !loading) {
            setCurrentPage(page);
            fetchProjectData(page);
        }
    };


    const router = useRouter();

    // Fetch project data

    // Fetch staff data
    useEffect(() => {
        const getStaffData = async () => {
            // ✅ Only fetch staff if clientId exists
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
        console.log('Navigating to project with materials:', {
            projectId: project._id,
            materialAvailableCount: project.MaterialAvailable?.length || 0,
            materialUsedCount: project.MaterialUsed?.length || 0,
            sectionsCount: project.section?.length || 0
        });

        const sections = project.section || [];

        // If only one section, navigate directly to details
        if (sections.length === 1) {
            const section = sections[0];
            console.log('Single section found - navigating directly to details:', section.name);

            router.push({
                pathname: '/details',
                params: {
                    projectId: project._id ?? '',
                    projectName: project.name,
                    sectionId: section._id || section.sectionId,
                    sectionName: section.name,
                    materialAvailable: JSON.stringify(project.MaterialAvailable || []),
                    materialUsed: JSON.stringify(project.MaterialUsed || [])
                }
            });
        } else if (sections.length > 1) {
            // Multiple sections - show section selection page
            console.log('Multiple sections found - showing section selection');

            router.push({
                pathname: '/project-sections',
                params: {
                    id: project._id ?? '',
                    name: project.name,
                    sectionData: JSON.stringify(sections),
                    materialAvailable: JSON.stringify(project.MaterialAvailable || []),
                    materialUsed: JSON.stringify(project.MaterialUsed || [])
                }
            });
        } else {
            // No sections - show empty state or create section option
            console.log('No sections found - showing section selection with empty state');

            router.push({
                pathname: '/project-sections',
                params: {
                    id: project._id ?? '',
                    name: project.name,
                    sectionData: JSON.stringify([]),
                    materialAvailable: JSON.stringify(project.MaterialAvailable || []),
                    materialUsed: JSON.stringify(project.MaterialUsed || [])
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

    // Temporary function to sync client names - can be removed after data is fixed
    const syncClientNames = async () => {
        try {
            console.log('🔄 Starting client name sync...');
            const response = await axios.post(`${domain}/api/users/staff?action=sync-client-names`, {});
            const responseData = response.data as any;
            
            if (responseData.success) {
                console.log('✅ Client name sync completed:', responseData.message);
                Alert.alert('Success', `Sync completed. ${responseData.data?.updatedStaffCount || 0} staff members updated.`);
                
                // Refresh the project data after sync
                await fetchProjectData(1, false);
            } else {
                console.error('❌ Sync failed:', responseData.message);
                Alert.alert('Error', 'Failed to sync client names');
            }
        } catch (error) {
            console.error('❌ Error during sync:', error);
            Alert.alert('Error', 'Failed to sync client names');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
            
            {/* Conditional Header - Show only for admin users */}
            {userIsAdmin && (
                <View style={styles.fixedHeader}>
                    <View style={styles.userInfo}>
                        {companyLogo ? (
                            <Image
                                source={{ uri: companyLogo }}
                                style={styles.companyLogo}
                                resizeMode="contain"
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
                        onPress={() => router.push('/notification')}
                    >
                        <Ionicons name="notifications" size={22} color="#1F2937" />
                        {/* {projectStats.overdueProjects > 0 && <View style={styles.notificationDot} />} */}
                    </TouchableOpacity>
                    
                    {/* Push Token Status Indicator */}
                     {/* <PushTokenStatusIndicator showDetails={false} /> */}
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
                        
                        {/* Temporary Sync Button - Remove after data is fixed */}
                        <TouchableOpacity
                            style={[styles.shareButton, { backgroundColor: '#F59E0B', marginTop: 8 }]}
                            onPress={syncClientNames}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="sync" size={20} color="#FFFFFF" />
                            <Text style={styles.shareButtonText}>Fix Client Names</Text>
                        </TouchableOpacity>
                        
                        {/* Push Token Status for Staff */}
                        <PushTokenStatusIndicator showDetails={true} />
                    </View>
                </View>
            )}


            {/* Section Header - Simple for all users */}
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
                        colors={['#3B82F6']} // Android
                        tintColor="#3B82F6" // iOS
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
                    <View style={{ marginBottom: 24 }} >
                        {projects && projects.length > 0 ? (
                            <>
                                {projects.map((project, index) => (
                                    <View key={index} style={{ marginBottom: 10 }}  >
                                        <ProjectCard
                                            key={project._id}
                                            project={project}
                                            onViewDetails={handleViewDetails}
                                            userType={userIsAdmin ? 'admin' : (isStaff ? 'staff' : 'client')}
                                        />
                                    </View>
                                ))}

                                {/* Pagination Controls - Only show for admin/client users, not staff */}
                                {totalPages > 1 && !isStaff && (
                                    <View style={styles.paginationContainer}>
                                        <View style={styles.paginationInfo}>
                                            <Text style={styles.paginationText}>
                                                Page {currentPage} of {totalPages}
                                            </Text>
                                            <Text style={styles.paginationSubText}>
                                                Total: {totalProjects} project{totalProjects !== 1 ? 's' : ''}
                                            </Text>
                                        </View>

                                        <View style={styles.paginationButtons}>
                                            <TouchableOpacity
                                                style={[
                                                    styles.paginationButton,
                                                    (!hasPrevPage || loading) && styles.paginationButtonDisabled
                                                ]}
                                                onPress={handlePrevPage}
                                                disabled={!hasPrevPage || loading}
                                            >
                                                <Ionicons
                                                    name="chevron-back"
                                                    size={20}
                                                    color={(!hasPrevPage || loading) ? '#CBD5E1' : '#3B82F6'}
                                                />
                                                <Text style={[
                                                    styles.paginationButtonText,
                                                    (!hasPrevPage || loading) && styles.paginationButtonTextDisabled
                                                ]}>
                                                    Previous
                                                </Text>
                                            </TouchableOpacity>

                                            {/* Page Numbers */}
                                            <View style={styles.pageNumbers}>
                                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                                    let pageNum;
                                                    if (totalPages <= 5) {
                                                        pageNum = i + 1;
                                                    } else if (currentPage <= 3) {
                                                        pageNum = i + 1;
                                                    } else if (currentPage >= totalPages - 2) {
                                                        pageNum = totalPages - 4 + i;
                                                    } else {
                                                        pageNum = currentPage - 2 + i;
                                                    }

                                                    return (
                                                        <TouchableOpacity
                                                            key={pageNum}
                                                            style={[
                                                                styles.pageNumberButton,
                                                                currentPage === pageNum && styles.pageNumberButtonActive
                                                            ]}
                                                            onPress={() => handleGoToPage(pageNum)}
                                                            disabled={loading}
                                                        >
                                                            <Text style={[
                                                                styles.pageNumberText,
                                                                currentPage === pageNum && styles.pageNumberTextActive
                                                            ]}>
                                                                {pageNum}
                                                            </Text>
                                                        </TouchableOpacity>
                                                    );
                                                })}
                                            </View>

                                            <TouchableOpacity
                                                style={[
                                                    styles.paginationButton,
                                                    (!hasNextPage || loading) && styles.paginationButtonDisabled
                                                ]}
                                                onPress={handleNextPage}
                                                disabled={!hasNextPage || loading}
                                            >
                                                <Text style={[
                                                    styles.paginationButtonText,
                                                    (!hasNextPage || loading) && styles.paginationButtonTextDisabled
                                                ]}>
                                                    Next
                                                </Text>
                                                <Ionicons
                                                    name="chevron-forward"
                                                    size={20}
                                                    color={(!hasNextPage || loading) ? '#CBD5E1' : '#3B82F6'}
                                                />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                )}
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
                
                {/* Notification Permission Fixer - Temporary for debugging */}
                {/* <NotificationPermissionFixer /> */}
            </ScrollView>
        </SafeAreaView>
    );
};

export default Index;