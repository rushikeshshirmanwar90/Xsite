import ProjectCard from '@/components/ProjectCard';
import { ProjectListSkeleton } from '@/components/ProjectCardSkeleton';
import FloatingStatsButton from '@/components/FloatingStatsButton';
import { getClientId } from '@/functions/clientId';
import { getProjectData } from '@/functions/project';
import { isAdmin, useUser } from '@/hooks/useUser';
import { domain } from '@/lib/domain';
import { styles } from "@/style/adminHome";
import { Project } from '@/types/project';
import { StaffMembers } from '@/types/staff';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '@/utils/axiosConfig';
import { useRouter } from 'expo-router';
import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'react-native-qrcode-svg';
import * as Sharing from 'expo-sharing';
import ViewShot from 'react-native-view-shot';
import PushTokenStatusIndicator from '@/components/PushTokenStatusIndicator';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
import axios from 'axios';

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
    const [showCompletedProjects, setShowCompletedProjects] = useState(false); // Toggle for completed projects
    const [pinnedProjects, setPinnedProjects] = useState<Set<string>>(new Set()); // Track pinned projects
    const [featuredProjects, setFeaturedProjects] = useState<Set<string>>(new Set()); // Track featured projects
    const [urgentPayments, setUrgentPayments] = useState<{ count: number; totalAmount: number }>({ count: 0, totalAmount: 0 });
    const [scrollY, setScrollY] = useState(0);
    const [bannerCollapsed, setBannerCollapsed] = useState(false); // Urgent banner collapsed state

    const handleScroll = (event: any) => {
        const y = event.nativeEvent.contentOffset.y;
        setScrollY(y);
    };

    // Helper to fetch urgent pending payments (due within 3 days or overdue)
    const fetchUrgentPayments = async () => {
        try {
            const clientId = await getClientId();
            if (!clientId) return;
            const res = await apiClient.get(`/api/payment-commitment?clientId=${clientId}`);
            const responseData = res.data as any;
            const commitments = Array.isArray(responseData)
                ? responseData
                : (responseData?.data && Array.isArray(responseData.data) ? responseData.data : []);

            const now = new Date();
            const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

            const urgent = commitments.filter((item: any) => {
                if (item.status === 'resolved' || item.status === 'paid') return false;

                const dateStr = item.commitmentDate || item.dueDate;
                if (!dateStr) return true; // If no date specified, count as urgent pending

                const dueTime = new Date(dateStr).getTime();
                if (isNaN(dueTime)) return true;

                // Calendar days remaining until due date
                const diffMs = dueTime - startOfToday;
                const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

                // Urgent if due within 3 days (diffDays <= 3) or overdue (diffDays < 0 or status === 'overdue')
                return diffDays <= 3 || item.status === 'overdue';
            });

            const totalAmount = urgent.reduce((sum: number, item: any) => sum + (item.amountDue || 0), 0);

            setUrgentPayments({
                count: urgent.length,
                totalAmount,
            });
        } catch (err) {
            console.warn('Could not fetch urgent payments for home banner:', err);
        }
    };

    // Refs for capturing QR code views
    const embeddedQRRef = useRef<ViewShot | null>(null);

    // Get user role for access control
    const { user, refreshUser } = useUser();
    const userIsAdmin = isAdmin(user);

    // Check if user is staff (has role field)
    const isStaff = user && 'role' in user;

    // Performance optimization
    const isLoadingRef = React.useRef(false);
    const lastLoadTimeRef = React.useRef<number>(0);
    const isInitializedRef = React.useRef(false);
    const DEBOUNCE_DELAY = 500;

    // Load pinned projects from AsyncStorage
    const loadPinnedProjects = async () => {
        try {
            const savedPinnedProjects = await AsyncStorage.getItem('pinnedProjects');
            if (savedPinnedProjects) {
                const pinnedProjectIds = JSON.parse(savedPinnedProjects) as string[];
                setPinnedProjects(new Set(pinnedProjectIds));
                console.log('📌 Loaded pinned projects from storage:', pinnedProjectIds);
                return new Set(pinnedProjectIds);
            }
        } catch (error) {
            console.error('Failed to load pinned projects:', error);
        }
        return new Set<string>();
    };

    // Load featured projects from AsyncStorage
    const loadFeaturedProjects = async () => {
        try {
            const savedFeaturedProjects = await AsyncStorage.getItem('featuredProjects');
            if (savedFeaturedProjects) {
                const featuredProjectIds = JSON.parse(savedFeaturedProjects) as string[];
                setFeaturedProjects(new Set(featuredProjectIds));
                return new Set(featuredProjectIds);
            }
        } catch (error) {
            console.error('Failed to load featured projects:', error);
        }
        return new Set<string>();
    };

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
                    const response = await apiClient.get(`/api/users/staff?id=${user._id}&getAllProjects=true&skipCache=true`);
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

                            // ✅ Load completion status for all staff projects
                            const projectsWithCompletion = await Promise.all(
                                populatedProjects.map(async (project: any) => {
                                    try {
                                        if (project._id) {
                                            const response = await apiClient.get(`/api/completion?updateType=project&id=${project._id}`);
                                            const responseData = response.data as any;
                                            if (responseData.success && responseData.data) {
                                                const completionStatus = Boolean(responseData.data.isCompleted);
                                                console.log(`📊 Project ${project.name}: isCompleted = ${completionStatus}`);
                                                return {
                                                    ...project,
                                                    isCompleted: completionStatus
                                                };
                                            }
                                        }
                                    } catch (error) {
                                        console.warn(`Could not load completion status for project ${project._id}:`, error);
                                    }
                                    console.log(`📊 Project ${project.name}: isCompleted = false (default)`);
                                    return { ...project, isCompleted: false };
                                })
                            );

                            // Load pinned/featured projects and merge with project data
                            const savedPinnedProjects = await loadPinnedProjects();
                            const savedFeaturedProjects = await loadFeaturedProjects();
                            const projectsWithPinStatus = projectsWithCompletion.map(project => ({
                                ...project,
                                isPinned: savedPinnedProjects.has(project._id),
                                isFeatured: savedFeaturedProjects.has(project._id)
                            }));

                            console.log('✅ Staff projects with completion and pin status loaded:', projectsWithPinStatus.length);
                            console.log('📊 Completion status summary:', projectsWithPinStatus.map(p => `${p.name}: completed=${p.isCompleted}, pinned=${p.isPinned}`).join(', '));

                            setProjects(projectsWithPinStatus);
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

                // ✅ Load completion status for all projects
                const projectsWithCompletion = await Promise.all(
                    projectsArray.map(async (project) => {
                        try {
                            if (project._id) {
                                const response = await apiClient.get(`/api/completion?updateType=project&id=${project._id}`);
                                const responseData = response.data as any;
                                if (responseData.success && responseData.data) {
                                    const completionStatus = Boolean(responseData.data.isCompleted);
                                    console.log(`📊 Project ${project.name}: isCompleted = ${completionStatus}`);
                                    return {
                                        ...project,
                                        isCompleted: completionStatus
                                    };
                                }
                            }
                        } catch (error) {
                            console.warn(`Could not load completion status for project ${project._id}:`, error);
                        }
                        console.log(`📊 Project ${project.name}: isCompleted = false (default)`);
                        return { ...project, isCompleted: false };
                    })
                );

                // Load pinned/featured projects and merge with project data
                const savedPinnedProjects = await loadPinnedProjects();
                const savedFeaturedProjects = await loadFeaturedProjects();
                const projectsWithPinStatus = projectsWithCompletion.map(project => ({
                    ...project,
                    isPinned: savedPinnedProjects.has(project._id),
                    isFeatured: savedFeaturedProjects.has(project._id)
                }));

                console.log('✅ Projects with completion and pin status loaded:', projectsWithPinStatus.length);
                console.log('📊 Status summary:', projectsWithPinStatus.map(p => `${p.name}: completed=${p.isCompleted}, pinned=${p.isPinned}`).join(', '));

                setProjects(projectsWithPinStatus);
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
                const response = await apiClient.get(`/api/clients?id=${clientId}&_t=${Date.now()}`);
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

            // Then fetch project data & urgent payments
            fetchProjectData();
            fetchUrgentPayments();
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
            await Promise.all([
                fetchProjectData(false),
                fetchUrgentPayments(),
            ]);
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
                const res = await apiClient.get(`/api/staff?clientId=${clientId}`);
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
        console.log('🔍 [DEBUG] handleViewDetails called with project:', {
            projectId: project._id,
            projectName: project.name,
            sectionsRaw: project.section,
            sectionsLength: (project.section || []).length,
            sectionsData: (project.section || []).map(s => ({
                id: s._id || s.sectionId,
                name: s.name
            }))
        });

        const sections = project.section || [];

        const proceedWithStandardViewDetails = (proj: Project) => {
            const secs = proj.section || [];
            router.push({
                pathname: '/project-sections',
                params: {
                    id: proj._id ?? '',
                    name: proj.name,
                    sectionData: JSON.stringify(secs)
                }
            });
        };

        // Check if user is staff and has contractor status under this project's client
        const projClientId = typeof project.clientId === 'object'
            ? (project.clientId?._id?.toString() || project.clientId?.toString())
            : project.clientId?.toString();

        const clientAssignment = (user as any)?.clients?.find(
            (c: any) => c.clientId?.toString() === projClientId
        );

        console.log('🔍 [DEBUG] User and contractor detection:', {
            isStaff,
            userId: user?._id,
            projClientId,
            userHasClients: !!(user as any)?.clients,
            userClientsCount: (user as any)?.clients?.length || 0,
            clientAssignmentFound: !!clientAssignment,
            isContractorFlag: clientAssignment?.isContractor
        });

        if (isStaff && clientAssignment?.isContractor && user?._id) {
            console.log(`📡 Staff user is contractor for client ${projClientId}. Fetching details...`);
            console.log(`🔍 [DEBUG] Sections data:`, {
                sectionsLength: sections.length,
                sections: sections.map(s => ({
                    id: s._id || s.sectionId,
                    name: s.name
                }))
            });

            apiClient.get(`/api/contractor?projectId=${project._id}&staffId=${user._id}`)
                .then((res: any) => {
                    if (res.data?.success && res.data?.data) {
                        const contractor = res.data.data;

                        console.log(`🔍 [DEBUG] Contractor data:`, {
                            contractorId: contractor._id,
                            contractorSectionId: contractor.sectionId,
                            contractorType: contractor.contractType
                        });

                        // ✅ SECTION COUNT CHECK: Direct to labor for single section, section picker for multiple
                        if (sections.length <= 1) {
                            // Single section (or no sections) — go directly to labor.tsx
                            const defaultSec = sections.length > 0 ? sections[0] : null;
                            const secId = defaultSec?._id || defaultSec?.sectionId || 'no-section';
                            const secName = defaultSec?.name || 'General';

                            console.log(`🚀 Single section — redirecting contractor directly to labor.tsx`);
                            router.push({
                                pathname: '/labor',
                                params: {
                                    projectId: project._id ?? '',
                                    projectName: project.name,
                                    sectionId: secId,
                                    sectionName: secName,
                                    contractorId: contractor._id,
                                    contractorType: contractor.contractType,
                                    userId: user._id,
                                }
                            });
                        } else {
                            // Multiple sections — contractor MUST pick a section first
                            console.log(`📋 Multiple sections (${sections.length}) — showing section picker for contractor`);
                            router.push({
                                pathname: '/project-sections',
                                params: {
                                    id: project._id ?? '',
                                    name: project.name,
                                    sectionData: JSON.stringify(sections),
                                    contractorId: contractor._id,
                                    contractorType: contractor.contractType,
                                    userId: user._id,
                                }
                            });
                        }

                    } else {
                        console.log('📝 No contractor details found, proceeding with standard view');
                        proceedWithStandardViewDetails(project);
                    }
                })
                .catch((err) => {
                    // Handle 404 gracefully - it just means no contractor record exists yet
                    if (err.response?.status === 404) {
                        console.log('📝 No contractor record found for this project/staff combination, proceeding with standard view');
                    } else {
                        console.error('Error fetching contractor details:', err);
                    }
                    proceedWithStandardViewDetails(project);
                });
            return;
        }

        proceedWithStandardViewDetails(project);
    };

    // Handle pin toggle for projects
    const handlePinToggle = async (projectId: string, isPinned: boolean) => {
        console.log(`📌 ${isPinned ? 'Pinning' : 'Unpinning'} project:`, projectId);

        // Update the pinned projects set
        setPinnedProjects(prev => {
            const newSet = new Set(prev);
            if (isPinned) {
                newSet.add(projectId);
            } else {
                newSet.delete(projectId);
            }

            // Persist to AsyncStorage
            AsyncStorage.setItem('pinnedProjects', JSON.stringify(Array.from(newSet)))
                .catch(error => console.error('Failed to save pinned projects:', error));

            return newSet;
        });

        // Update the projects array to reflect the pin status
        setProjects(prevProjects =>
            prevProjects.map(project =>
                project._id === projectId
                    ? { ...project, isPinned: isPinned }
                    : project
            )
        );
    };

    // Handle featured toggle for projects
    const handleFeaturedToggle = async (projectId: string, isFeatured: boolean) => {
        setFeaturedProjects(prev => {
            const newSet = new Set(prev);
            if (isFeatured) {
                newSet.add(projectId);
            } else {
                newSet.delete(projectId);
            }

            AsyncStorage.setItem('featuredProjects', JSON.stringify(Array.from(newSet)))
                .catch(error => console.error('Failed to save featured projects:', error));

            return newSet;
        });

        setProjects(prevProjects =>
            prevProjects.map(project =>
                project._id === projectId
                    ? { ...project, isFeatured: isFeatured }
                    : project
            )
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

    const greetingHour = new Date().getHours();
    const timeGreeting = greetingHour < 12 ? 'Good Morning' : greetingHour < 17 ? 'Good Afternoon' : 'Good Evening';
    const firstName = user?.firstName || 'there';

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

            {/* Header - static Exponentor app branding, shown to every signed-in user */}
            <View style={homeStyles.brandHeader}>
                <View style={homeStyles.brandLeft}>
                    <View style={homeStyles.brandLogo}>
                        <Text style={homeStyles.brandLogoText}>EX</Text>
                    </View>
                    <View style={homeStyles.brandTextBlock}>
                        <Text style={homeStyles.brandTitle} numberOfLines={1}>Exponentor</Text>
                        <Text style={homeStyles.brandSubtitle} numberOfLines={1}>{timeGreeting}, {firstName} 👋</Text>
                    </View>
                </View>
                <TouchableOpacity style={homeStyles.heroNotifButton}
                    onPress={() => router.push({ pathname: '/notification', params: { tab: 'warnings' } } as any)}
                >
                    <Ionicons name="notifications-outline" size={20} color="#3A78B5" />
                    {urgentPayments.count > 0 && (
                        <View style={homeStyles.notifBadgeDot}>
                            <Text style={homeStyles.notifBadgeDotText}>
                                {urgentPayments.count > 99 ? '99+' : urgentPayments.count}
                            </Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            {/* Urgent Payment Banner – collapsible, expanded by default */}
            {urgentPayments.count > 0 && (
                <View style={homeStyles.urgentAlertBanner}>
                    {/* Banner header row – always visible */}
                    <TouchableOpacity
                        style={homeStyles.urgentBannerHeaderRow}
                        onPress={() => setBannerCollapsed(prev => !prev)}
                        activeOpacity={0.7}
                    >
                        <View style={homeStyles.urgentIconContainer}>
                            <Ionicons name="card-outline" size={18} color="#D97706" />
                        </View>
                        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={homeStyles.urgentAlertTitle}>
                                Urgent Pending Payment{urgentPayments.count === 1 ? '' : 's'}
                            </Text>
                            <View style={homeStyles.urgentBadge}>
                                <Text style={homeStyles.urgentBadgeText}>{urgentPayments.count}</Text>
                            </View>
                        </View>
                        <Ionicons
                            name={bannerCollapsed ? 'chevron-down' : 'chevron-up'}
                            size={16}
                            color="#B45309"
                        />
                    </TouchableOpacity>

                    {/* Expanded content */}
                    {!bannerCollapsed && (
                        <>
                            <View style={homeStyles.urgentBannerDivider} />
                            <TouchableOpacity
                                style={homeStyles.urgentBannerExpandedRow}
                                onPress={() => router.push({ pathname: '/notification', params: { tab: 'warnings' } } as any)}
                                activeOpacity={0.85}
                            >
                                <Text style={homeStyles.urgentAlertSubtitle} numberOfLines={1}>
                                    ₹{urgentPayments.totalAmount.toLocaleString('en-IN')} due across {urgentPayments.count} commitment{urgentPayments.count === 1 ? '' : 's'}
                                </Text>
                                <View style={homeStyles.urgentAlertAction}>
                                    <Text style={homeStyles.urgentAlertActionText}>Review</Text>
                                    <Ionicons name="chevron-forward" size={14} color="#B45309" />
                                </View>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            )}

            {/* QR Code Section - Priority for unassigned staff */}
            {isStaff && user && !clientId && (
                <View style={styles.section}>
                    <View style={[styles.qrCodeCard, styles.shareCard]}>
                        <View style={styles.shareHeader}>
                            <View style={styles.shareIconContainer}>
                                <Ionicons name="qr-code-outline" size={24} color="#3A78B5" />
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
            <View style={homeStyles.sectionHeader}>
                <Text style={homeStyles.sectionTitle}>Projects</Text>

                {/* Toggle Button - Only for non-staff users */}
                {!isStaff && (
                    <TouchableOpacity
                        style={[homeStyles.viewCompletedButton, showCompletedProjects && homeStyles.viewCompletedButtonActive]}
                        onPress={() => setShowCompletedProjects(!showCompletedProjects)}
                        activeOpacity={0.7}
                    >
                        <Ionicons
                            name={showCompletedProjects ? "list-outline" : "checkmark-done-outline"}
                            size={14}
                            color={showCompletedProjects ? "#295E94" : "#3A78B5"}
                        />
                        <Text
                            style={[homeStyles.viewCompletedButtonText, showCompletedProjects && homeStyles.viewCompletedButtonActive]}
                            numberOfLines={1}
                        >
                            {showCompletedProjects ? 'View Ongoing' : 'View Completed'}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>

            <ScrollView
                style={styles.projectsList}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#3A78B5']}
                        tintColor="#3A78B5"
                        title="Pull to refresh"
                        titleColor="#64748B"
                    />
                }
            >
                {loading ? (
                    <View style={{ marginBottom: 24 }}>
                        <ProjectListSkeleton count={3} />
                    </View>
                ) : error ? (
                    <View style={styles.centerContainer}>
                        <View style={[homeStyles.stateIconBadge, { backgroundColor: '#FFF1F2', borderColor: '#FECDD3' }]}>
                            <Ionicons name="alert-circle" size={40} color="#EF4444" />
                        </View>
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
                                {/* Filter projects based on completion status */}
                                {(() => {
                                    console.log('🔍 Filtering projects:', {
                                        totalProjects: projects.length,
                                        showCompletedProjects,
                                        isStaff,
                                        projectsWithStatus: projects.map(p => ({
                                            name: p.name,
                                            isCompleted: p.isCompleted,
                                            isPinned: p.isPinned
                                        }))
                                    });

                                    // For staff users, always show only ongoing projects (not completed)
                                    // For non-staff users, respect the toggle state
                                    const filteredProjects = isStaff
                                        ? projects.filter(p => p.isCompleted === false)
                                        : showCompletedProjects
                                            ? projects.filter(p => p.isCompleted === true)
                                            : projects.filter(p => p.isCompleted === false);

                                    // Sort projects: pinned projects first, then by name
                                    const sortedProjects = filteredProjects.sort((a, b) => {
                                        // First, sort by pin status (pinned projects first)
                                        if (a.isPinned && !b.isPinned) return -1;
                                        if (!a.isPinned && b.isPinned) return 1;

                                        // Then sort by name alphabetically
                                        return a.name.localeCompare(b.name);
                                    });

                                    console.log('✅ Filtered and sorted result:', {
                                        filteredCount: sortedProjects.length,
                                        sortedProjects: sortedProjects.map(p => ({
                                            name: p.name,
                                            isCompleted: p.isCompleted,
                                            isPinned: p.isPinned
                                        }))
                                    });

                                    // If nothing has been explicitly featured yet, default the first card to featured
                                    const anyFeatured = sortedProjects.some(p => p.isFeatured);

                                    return sortedProjects.length > 0 ? (
                                        sortedProjects.map((project, index) => (
                                            <View key={index} style={{ marginBottom: 18 }}>
                                                <ProjectCard
                                                    key={project._id}
                                                    project={project}
                                                    onViewDetails={handleViewDetails}
                                                    onPinToggle={handlePinToggle}
                                                    onFeaturedToggle={handleFeaturedToggle}
                                                    userType={userIsAdmin ? 'admin' : (isStaff ? 'staff' : 'client')}
                                                    featured={project.isFeatured || (index === 0 && !anyFeatured)}
                                                />
                                            </View>
                                        ))
                                    ) : (
                                        <View style={styles.centerContainer}>
                                            <View style={homeStyles.stateIconBadge}>
                                                <Ionicons
                                                    name={isStaff ? "folder-open-outline" : (showCompletedProjects ? "checkmark-done-circle-outline" : "folder-open-outline")}
                                                    size={40}
                                                    color="#3A78B5"
                                                />
                                            </View>
                                            <Text style={styles.emptyText}>
                                                {isStaff ? 'No ongoing projects' : (showCompletedProjects ? 'No completed projects' : 'No ongoing projects')}
                                            </Text>
                                            <Text style={styles.emptySubText}>
                                                {isStaff
                                                    ? 'Contact your admin to assign projects to you'
                                                    : showCompletedProjects
                                                        ? 'Mark projects as complete to see them here'
                                                        : 'All your projects are completed'}
                                            </Text>
                                        </View>
                                    );
                                })()}
                            </>
                        ) : (
                            <View style={styles.centerContainer}>
                                <View style={homeStyles.stateIconBadge}>
                                    <Ionicons name="folder-open-outline" size={40} color="#3A78B5" />
                                </View>
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

            {/* Floating stats button - admin only, mirrors where the old top stats strip lived */}
            {userIsAdmin && (
                <FloatingStatsButton
                    stats={[
                        { icon: 'briefcase', color: '#3A78B5', value: projects.length, label: 'Total Projects' },
                        { icon: 'pulse', color: '#3A78B5', value: projects.filter((p) => !p.isCompleted).length, label: 'Active Projects' },
                        { icon: 'checkmark-done', color: '#22C55E', value: projects.filter((p) => p.isCompleted).length, label: 'Completed' },
                    ]}
                />
            )}
        </SafeAreaView>
    );
};

export default Index;
const homeStyles = StyleSheet.create({
    brandHeader: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    brandLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 12,
    },
    brandLogo: {
        width: 46,
        height: 46,
        borderRadius: 15,
        backgroundColor: '#3A78B5',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#3A78B5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 3,
    },
    brandLogoText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 0.4,
    },
    brandTextBlock: {
        flex: 1,
    },
    brandTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0F172A',
        letterSpacing: -0.4,
    },
    brandSubtitle: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '500',
        marginTop: 2,
    },
    heroNotifButton: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: '#DCEEFF',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#B8D8F8',
    },
    greetingSection: {
        paddingHorizontal: 20,
        paddingTop: 4,
        paddingBottom: 10,
        backgroundColor: '#FFFFFF',
    },
    greetingTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#0F172A',
        letterSpacing: -0.2,
        marginBottom: 2,
    },
    greetingSubtitle: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '500',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 22,
        paddingBottom: 14,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#0F172A',
        letterSpacing: -0.4,
    },
    viewCompletedButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: '#EAF0FE',
        borderWidth: 1,
        borderColor: '#C4D8FC',
        borderRadius: 999,
        paddingHorizontal: 13,
        paddingVertical: 8,
    },
    viewCompletedButtonActive: {
        backgroundColor: '#DCEEFF',
        borderColor: '#B8D8F8',
    },
    viewCompletedButtonText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#3A78B5',
    },
    viewCompletedButtonTextActive: {
        color: '#295E94',
    },
    stateIconBadge: {
        width: 84,
        height: 84,
        borderRadius: 28,
        backgroundColor: '#DCEEFF',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 18,
        alignSelf: 'center',
        borderWidth: 1,
        borderColor: '#B8D8F8',
    },
    notifBadgeDot: {
        position: 'absolute',
        top: -2,
        right: -2,
        backgroundColor: '#EF4444',
        borderRadius: 9,
        paddingHorizontal: 4,
        paddingVertical: 1,
        minWidth: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#FFFFFF',
    },
    notifBadgeDotText: {
        color: '#FFFFFF',
        fontSize: 9,
        fontWeight: '800',
    },
    urgentAlertBanner: {
        marginHorizontal: 20,
        marginTop: 12,
        marginBottom: 4,
        borderRadius: 14,
        backgroundColor: '#FFFBEB',
        borderWidth: 1,
        borderColor: '#FCD34D',
        overflow: 'hidden',
        shadowColor: '#D97706',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 2,
    },
    urgentBannerHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
    },
    urgentBannerDivider: {
        height: 1,
        backgroundColor: '#FDE68A',
        marginHorizontal: 14,
    },
    urgentBannerExpandedRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 14,
        paddingVertical: 10,
    },
    urgentIconContainer: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: '#FEF3C7',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#FDE68A',
    },
    urgentAlertTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#92400E',
    },
    urgentBadge: {
        backgroundColor: '#D97706',
        borderRadius: 10,
        paddingHorizontal: 6,
        paddingVertical: 1,
    },
    urgentBadgeText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '800',
    },
    urgentAlertSubtitle: {
        fontSize: 12,
        color: '#B45309',
        marginTop: 2,
        fontWeight: '500',
    },
    urgentAlertAction: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#FDE68A',
    },
    urgentAlertActionText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#B45309',
    },
});