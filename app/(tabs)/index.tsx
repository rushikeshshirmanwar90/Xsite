import ProjectCard from '@/components/ProjectCard';
import { ProjectListSkeleton } from '@/components/ProjectCardSkeleton';
import FloatingStatsButton from '@/components/FloatingStatsButton';
import CostSummaryProjectPicker from '@/components/CostSummaryProjectPicker';
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
import { Colors } from '@/constants/theme';
import * as Haptics from 'expo-haptics';
import {
    Alert,
    Platform,
    Pressable,
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
    const [isScrolled, setIsScrolled] = useState(false); // Shows the header hairline once content slides under it
    const [bannerCollapsed, setBannerCollapsed] = useState(false); // Urgent banner collapsed state
    const [showCostPicker, setShowCostPicker] = useState(false); // Project picker behind the Cost Summary button

    const handleScroll = (event: any) => {
        const scrolled = event.nativeEvent.contentOffset.y > 4;
        if (scrolled !== isScrolled) setIsScrolled(scrolled);
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
    const timeGreeting = greetingHour < 12 ? 'Good morning' : greetingHour < 17 ? 'Good afternoon' : 'Good evening';
    const firstName = user?.firstName || 'there';

    const ongoingCount = projects.filter(p => !p.isCompleted).length;
    const completedCount = projects.filter(p => p.isCompleted).length;

    // Only offer the Ongoing / Completed tabs once there is something completed to switch to.
    // Kept visible while loading so the layout doesn't jump for users who do have completed projects.
    const showStatusTabs = !isStaff && (loading || completedCount > 0);

    // If the last completed project goes away (e.g. after a refresh), fall back to Ongoing
    useEffect(() => {
        if (!loading && completedCount === 0) setShowCompletedProjects(false);
    }, [loading, completedCount]);

    // Staff always see ongoing projects; everyone else follows the segmented control.
    // Pinned projects first, then alphabetical.
    const visibleProjects = projects
        .filter(p => (isStaff || !showCompletedProjects) ? !p.isCompleted : p.isCompleted)
        .sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return a.name.localeCompare(b.name);
        });
    // If nothing has been explicitly featured yet, default the first card to featured
    const anyFeatured = visibleProjects.some(p => p.isFeatured);

    const selectFilter = (completed: boolean) => {
        if (completed === showCompletedProjects) return;
        if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => {});
        setShowCompletedProjects(completed);
    };

    const openWarnings = () => router.push({ pathname: '/notification', params: { tab: 'warnings' } } as any);

    // Cost Summary: pick a project first, then open the same screen Project Sections uses
    const openCostSummaryPicker = () => {
        if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => {});
        setShowCostPicker(true);
    };

    const openCostSummary = (project: Project) => {
        if (!project._id) return;
        setShowCostPicker(false);
        router.push({
            pathname: '/cost-summary',
            params: { projectId: project._id, projectName: project.name },
        } as any);
    };

    return (
        <SafeAreaView style={homeStyles.container} edges={['top', 'left', 'right']}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

            {/* Fixed top: app identity, greeting, notifications and the project filter */}
            <View style={[homeStyles.topBar, isScrolled && homeStyles.topBarScrolled]}>
                <View style={homeStyles.brandRow}>
                    <View style={homeStyles.brandLeft}>
                        <View style={homeStyles.brandLogo} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                            <Text style={homeStyles.brandLogoText}>EX</Text>
                        </View>
                        <View style={homeStyles.brandTextBlock}>
                            <Text style={homeStyles.brandTitle} numberOfLines={1}>Exponentor</Text>
                            <Text style={homeStyles.brandSubtitle} numberOfLines={1}>{timeGreeting}, {firstName}</Text>
                        </View>
                    </View>
                    <Pressable
                        style={({ pressed }) => [homeStyles.notifButton, pressed && homeStyles.notifButtonPressed]}
                        onPress={openWarnings}
                        accessibilityRole="button"
                        accessibilityLabel={urgentPayments.count > 0
                            ? `Notifications, ${urgentPayments.count} urgent payment${urgentPayments.count === 1 ? '' : 's'}`
                            : 'Notifications'}
                    >
                        <Ionicons name="notifications-outline" size={22} color="#0F172A" />
                        {urgentPayments.count > 0 && (
                            <View style={homeStyles.notifBadge}>
                                <Text style={homeStyles.notifBadgeText}>
                                    {urgentPayments.count > 99 ? '99+' : urgentPayments.count}
                                </Text>
                            </View>
                        )}
                    </Pressable>
                </View>

                <View style={homeStyles.sectionHeader}>
                    <View style={homeStyles.sectionTitleGroup}>
                        <Text style={homeStyles.sectionTitle} accessibilityRole="header">Projects</Text>
                        {!showStatusTabs && !loading && (
                            <Text style={homeStyles.sectionCount}>{ongoingCount} ongoing</Text>
                        )}
                    </View>

                    {/* Cost Summary works on the projects below, so it sits in their header:
                        always visible, and it never pushes the first project down. Admin only,
                        like the cost screen itself. */}
                    {userIsAdmin && !loading && !error && projects.length > 0 && (
                        <Pressable
                            style={({ pressed }) => [homeStyles.costButton, pressed && homeStyles.costButtonPressed]}
                            onPress={openCostSummaryPicker}
                            hitSlop={4}
                            accessibilityRole="button"
                            accessibilityLabel="Cost Summary"
                            accessibilityHint="Choose a project to see what has been spent on it"
                        >
                            <Ionicons name="pie-chart-outline" size={16} color={Colors.primaryDark} />
                            <Text style={homeStyles.costButtonText}>Cost Summary</Text>
                        </Pressable>
                    )}
                </View>

                {/* Ongoing / Completed - Only for non-staff users with at least one completed project */}
                {showStatusTabs && (
                    <View style={homeStyles.segmented} accessibilityRole="tablist">
                        {[
                            { key: 'ongoing', label: 'Ongoing', count: ongoingCount, completed: false },
                            { key: 'completed', label: 'Completed', count: completedCount, completed: true },
                        ].map(seg => {
                            const selected = showCompletedProjects === seg.completed;
                            return (
                                <Pressable
                                    key={seg.key}
                                    style={[homeStyles.segment, selected && homeStyles.segmentSelected]}
                                    onPress={() => selectFilter(seg.completed)}
                                    accessibilityRole="tab"
                                    accessibilityState={{ selected }}
                                    accessibilityLabel={loading ? seg.label : `${seg.label}, ${seg.count} projects`}
                                >
                                    <Text style={[homeStyles.segmentText, selected && homeStyles.segmentTextSelected]}>
                                        {seg.label}
                                    </Text>
                                    {!loading && (
                                        <View style={[homeStyles.segmentCount, selected && homeStyles.segmentCountSelected]}>
                                            <Text style={[homeStyles.segmentCountText, selected && homeStyles.segmentCountTextSelected]}>
                                                {seg.count}
                                            </Text>
                                        </View>
                                    )}
                                </Pressable>
                            );
                        })}
                    </View>
                )}
            </View>

            <ScrollView
                style={homeStyles.scroll}
                contentContainerStyle={[homeStyles.scrollContent, userIsAdmin && homeStyles.scrollContentWithFab]}
                onScroll={handleScroll}
                scrollEventThrottle={32}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[Colors.primary]}
                        tintColor={Colors.primary}
                        title="Pull to refresh"
                        titleColor={Colors.textSecondary}
                    />
                }
            >
                {/* Urgent Payment Banner – collapsible, expanded by default */}
                {urgentPayments.count > 0 && (
                    <View style={homeStyles.urgentBanner}>
                        <Pressable
                            style={homeStyles.urgentHeaderRow}
                            onPress={() => setBannerCollapsed(prev => !prev)}
                            accessibilityRole="button"
                            accessibilityState={{ expanded: !bannerCollapsed }}
                            accessibilityLabel={`${urgentPayments.count} urgent pending payment${urgentPayments.count === 1 ? '' : 's'}`}
                        >
                            <View style={homeStyles.urgentIcon}>
                                <Ionicons name="time-outline" size={18} color={Colors.warningText} />
                            </View>
                            <Text style={homeStyles.urgentTitle} numberOfLines={1}>
                                {urgentPayments.count} urgent payment{urgentPayments.count === 1 ? '' : 's'}
                            </Text>
                            <Ionicons
                                name={bannerCollapsed ? 'chevron-down' : 'chevron-up'}
                                size={18}
                                color={Colors.warningText}
                            />
                        </Pressable>

                        {!bannerCollapsed && (
                            <Pressable
                                style={({ pressed }) => [homeStyles.urgentBody, pressed && { opacity: 0.85 }]}
                                onPress={openWarnings}
                                accessibilityRole="button"
                                accessibilityLabel="Review urgent payments"
                            >
                                <View style={homeStyles.urgentAmountBlock}>
                                    <Text style={homeStyles.urgentAmount} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                                        ₹{urgentPayments.totalAmount.toLocaleString('en-IN')}
                                    </Text>
                                    <Text style={homeStyles.urgentSubtitle} numberOfLines={1}>
                                        due within 3 days or overdue
                                    </Text>
                                </View>
                                <View style={homeStyles.urgentAction}>
                                    <Text style={homeStyles.urgentActionText}>Review</Text>
                                    <Ionicons name="arrow-forward" size={15} color="#FFFFFF" />
                                </View>
                            </Pressable>
                        )}
                    </View>
                )}

                {/* QR Code Section - Priority for unassigned staff */}
                {isStaff && user && !clientId && (
                    <View style={styles.section}>
                        <View style={[styles.qrCodeCard, styles.shareCard]}>
                            <View style={styles.shareHeader}>
                                <View style={styles.shareIconContainer}>
                                    <Ionicons name="qr-code-outline" size={24} color={Colors.primary} />
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

                {loading ? (
                    <ProjectListSkeleton count={3} />
                ) : error ? (
                    <View style={homeStyles.stateContainer}>
                        <View style={[homeStyles.stateIconBadge, { backgroundColor: Colors.errorLight }]}>
                            <Ionicons name="cloud-offline-outline" size={32} color={Colors.errorText} />
                        </View>
                        <Text style={homeStyles.stateTitle}>Couldn't load projects</Text>
                        <Text style={homeStyles.stateBody}>Check your connection, then try again.</Text>
                        <Pressable
                            style={({ pressed }) => [homeStyles.stateButton, pressed && homeStyles.stateButtonPressed]}
                            onPress={() => fetchProjectData()}
                            accessibilityRole="button"
                        >
                            <Ionicons name="refresh" size={17} color="#FFFFFF" />
                            <Text style={homeStyles.stateButtonText}>Try Again</Text>
                        </Pressable>
                    </View>
                ) : visibleProjects.length > 0 ? (
                    visibleProjects.map((project, index) => (
                        <View key={project._id ?? index} style={homeStyles.cardSpacing}>
                            <ProjectCard
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
                    <View style={homeStyles.stateContainer}>
                        <View style={homeStyles.stateIconBadge}>
                            <Ionicons
                                name={projects.length > 0 && showCompletedProjects && !isStaff ? "checkmark-done-outline" : "folder-open-outline"}
                                size={32}
                                color={Colors.primary}
                            />
                        </View>
                        {projects.length === 0 ? (
                            <>
                                <Text style={homeStyles.stateTitle}>No projects yet</Text>
                                <Text style={homeStyles.stateBody}>
                                    {userIsAdmin
                                        ? 'Create your first project to start tracking budget, materials and labor.'
                                        : 'No projects available. Contact your admin to add projects.'}
                                </Text>
                                {userIsAdmin && (
                                    <Pressable
                                        style={({ pressed }) => [homeStyles.stateButton, pressed && homeStyles.stateButtonPressed]}
                                        onPress={() => router.push('/add-project' as any)}
                                        accessibilityRole="button"
                                    >
                                        <Ionicons name="add" size={18} color="#FFFFFF" />
                                        <Text style={homeStyles.stateButtonText}>Add Project</Text>
                                    </Pressable>
                                )}
                            </>
                        ) : (
                            <>
                                <Text style={homeStyles.stateTitle}>
                                    {isStaff ? 'No ongoing projects' : (showCompletedProjects ? 'No completed projects' : 'No ongoing projects')}
                                </Text>
                                <Text style={homeStyles.stateBody}>
                                    {isStaff
                                        ? 'Contact your admin to assign projects to you'
                                        : showCompletedProjects
                                            ? 'Mark projects as complete to see them here'
                                            : 'All your projects are completed'}
                                </Text>
                            </>
                        )}
                    </View>
                )}
            </ScrollView>

            {/* Floating stats button - admin only, mirrors where the old top stats strip lived */}
            {userIsAdmin && (
                <FloatingStatsButton
                    stats={[
                        { icon: 'briefcase', color: Colors.primary, value: projects.length, label: 'Total Projects' },
                        { icon: 'pulse', color: Colors.primary, value: ongoingCount, label: 'Active Projects' },
                        { icon: 'checkmark-done', color: Colors.success, value: completedCount, label: 'Completed' },
                    ]}
                />
            )}

            {userIsAdmin && (
                <CostSummaryProjectPicker
                    visible={showCostPicker}
                    projects={projects}
                    onClose={() => setShowCostPicker(false)}
                    onSelect={openCostSummary}
                />
            )}
        </SafeAreaView>
    );
};

export default Index;

const INK = '#0F172A';

const homeStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },

    // Fixed top bar
    topBar: {
        backgroundColor: Colors.background,
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'transparent',
        zIndex: 2,
    },
    topBarScrolled: {
        borderBottomColor: Colors.border,
    },
    brandRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
    },
    brandLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 12,
    },
    brandLogo: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    brandLogoText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '800',
        letterSpacing: 0.3,
    },
    brandTextBlock: {
        flex: 1,
    },
    brandTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: INK,
        letterSpacing: -0.3,
    },
    brandSubtitle: {
        fontSize: 13,
        color: Colors.textSecondary,
        fontWeight: '500',
        marginTop: 1,
    },
    notifButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    notifButtonPressed: {
        backgroundColor: Colors.fill,
    },
    notifBadge: {
        position: 'absolute',
        top: -3,
        right: -3,
        backgroundColor: Colors.errorText,
        borderRadius: 10,
        paddingHorizontal: 5,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: Colors.background,
    },
    notifBadgeText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '700',
        fontVariant: ['tabular-nums'],
    },

    // Section title + filter
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        // At large text sizes the Cost Summary button wraps under the title instead of squeezing it
        flexWrap: 'wrap',
        rowGap: 8,
        columnGap: 12,
        minHeight: 36, // same as the button, so the row doesn't grow when it appears after loading
        marginTop: 24,
        marginBottom: 12,
    },
    sectionTitleGroup: {
        flexDirection: 'row',
        alignItems: 'baseline',
        flexShrink: 1,
        gap: 10,
    },
    sectionTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: INK,
        letterSpacing: -0.7,
    },
    sectionCount: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.textSecondary,
    },
    // Tinted, not filled: the filled accent is kept for the Add Project tab.
    // #295E94 on #DCEEFF is 5.7:1.
    costButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        minHeight: 36, // + 4pt hitSlop each side = 44pt target
        paddingHorizontal: 14,
        borderRadius: 18,
        backgroundColor: Colors.primaryLight,
    },
    costButtonPressed: {
        backgroundColor: '#C7E1FB', // text stays 5.0:1
    },
    costButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.primaryDark,
    },
    segmented: {
        flexDirection: 'row',
        backgroundColor: Colors.fill,
        borderRadius: 14,
        padding: 4,
        gap: 4,
    },
    segment: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        minHeight: 40,
        borderRadius: 10,
    },
    segmentSelected: {
        backgroundColor: Colors.surface,
        shadowColor: INK,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
        elevation: 2,
    },
    segmentText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.textSecondary,
    },
    segmentTextSelected: {
        color: INK,
    },
    segmentCount: {
        minWidth: 22,
        height: 20,
        paddingHorizontal: 6,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#E2E8F0',
    },
    segmentCountSelected: {
        backgroundColor: Colors.primaryLight,
    },
    segmentCountText: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.textSecondary,
        fontVariant: ['tabular-nums'],
    },
    segmentCountTextSelected: {
        color: Colors.primaryDark,
    },

    // List
    scroll: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 32,
    },
    scrollContentWithFab: {
        // Clears the floating stats button so the last card's footer stays tappable
        paddingBottom: 104,
    },
    cardSpacing: {
        marginBottom: 16,
    },

    // Urgent payments
    urgentBanner: {
        marginBottom: 16,
        borderRadius: 20,
        backgroundColor: '#FFF8EB',
        borderWidth: 1,
        borderColor: '#FBE3B4',
        overflow: 'hidden',
    },
    urgentHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 14,
        minHeight: 52,
    },
    urgentIcon: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: '#FDEBC8',
        alignItems: 'center',
        justifyContent: 'center',
    },
    urgentTitle: {
        flex: 1,
        fontSize: 15,
        fontWeight: '700',
        color: '#7C2D12',
    },
    urgentBody: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 16,
        paddingBottom: 16,
        paddingTop: 2,
    },
    urgentAmountBlock: {
        flex: 1,
    },
    urgentAmount: {
        fontSize: 26,
        fontWeight: '800',
        color: '#7C2D12',
        letterSpacing: -0.6,
        fontVariant: ['tabular-nums'],
    },
    urgentSubtitle: {
        fontSize: 13,
        color: Colors.warningText,
        fontWeight: '500',
        marginTop: 2,
    },
    urgentAction: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: Colors.warningText,
        paddingHorizontal: 16,
        minHeight: 40,
        borderRadius: 20,
    },
    urgentActionText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFFFFF',
    },


    // Empty / error states
    stateContainer: {
        alignItems: 'center',
        paddingVertical: 48,
        paddingHorizontal: 24,
    },
    stateIconBadge: {
        width: 72,
        height: 72,
        borderRadius: 24,
        backgroundColor: Colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    stateTitle: {
        fontSize: 19,
        fontWeight: '700',
        color: INK,
        letterSpacing: -0.3,
        textAlign: 'center',
        marginBottom: 6,
    },
    stateBody: {
        fontSize: 15,
        lineHeight: 21,
        color: Colors.textSecondary,
        textAlign: 'center',
        maxWidth: 300,
    },
    stateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 20,
        paddingHorizontal: 22,
        minHeight: 48,
        borderRadius: 24,
        backgroundColor: Colors.primary,
    },
    stateButtonPressed: {
        backgroundColor: Colors.primaryDark,
    },
    stateButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
    },
});
