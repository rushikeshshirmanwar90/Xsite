import Header from '@/components/details/Header';
import LaborCardEnhanced from '@/components/details/LaborCardEnhanced';
import LaborFormModal from '@/components/details/LaborFormModal';
import { getClientId } from '@/functions/clientId';
import apiClient from '@/utils/axiosConfig';

import { styles } from '@/style/details';
import { Section } from '@/types/details';
import { Labor, LaborEntry } from '@/types/labor';
import { Ionicons } from '@expo/vector-icons';

import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';
import { useSimpleNotifications } from '@/hooks/useSimpleNotifications';
import { useAuth } from '@/contexts/AuthContext';

const LaborPage = () => {
    const params = useLocalSearchParams();
    const { user, clientId } = useAuth();
    const { sendProjectNotification } = useSimpleNotifications();
    
    const projectId = params.projectId as string;
    const projectName = params.projectName as string;
    const sectionId = params.sectionId as string;
    const sectionName = params.sectionName as string;

    const [laborEntries, setLaborEntries] = useState<Labor[]>([]);
    const [loading, setLoading] = useState(false);
    const [showLaborForm, setShowLaborForm] = useState(false);
    const [isAddingLabor, setIsAddingLabor] = useState(false);
    const cardAnimations = useRef<Animated.Value[]>([]).current;
    const scrollViewRef = useRef<ScrollView>(null);
    
    // Loading animation for adding labor
    const loadingAnimation = useRef(new Animated.Value(0)).current;

    // Function to fetch all labor entries from API
    const fetchLaborEntries = async () => {
        try {
            setLoading(true);
            console.log('📋 Fetching all labor entries - Project:', projectId);
            
            const clientId = await getClientId();
            if (!clientId) {
                throw new Error('Client ID not found');
            }

            // Use apiClient for authenticated requests - fetch all entries
            const response = await apiClient.get(`/api/labor`, {
                params: {
                    entityType: 'project',
                    entityId: projectId,
                    sectionId: sectionId
                }
            });

            const result = response.data;
            console.log('✅ Labor API response:', result);

            if (result.success && result.data) {
                // Transform API response to match our Labor interface
                const transformedEntries: Labor[] = (result.data.laborEntries || []).map((entry: any, index: number) => ({
                    id: index + 1,
                    _id: entry._id || `labor_${index}`,
                    type: entry.type,
                    category: entry.category,
                    count: entry.count,
                    perLaborCost: entry.perLaborCost,
                    totalCost: entry.totalCost,
                    date: entry.addedAt || entry.createdAt || new Date().toISOString(),
                    icon: getLaborIconAndColor(entry.category).icon,
                    color: getLaborIconAndColor(entry.category).color,
                    sectionId: sectionId,
                    miniSectionId: entry.miniSectionId,
                    addedAt: entry.addedAt || entry.createdAt || new Date().toISOString(),
                    createdAt: entry.createdAt || new Date().toISOString(),
                    updatedAt: entry.updatedAt || new Date().toISOString()
                }));

                console.log('📋 Total entries fetched:', transformedEntries.length);
                setLaborEntries(transformedEntries);

                // Clear animations array completely before reinitializing
                while (cardAnimations.length > 0) {
                    cardAnimations.pop();
                }
                
                // Initialize fresh animations for all items
                for (let i = 0; i < transformedEntries.length; i++) {
                    cardAnimations.push(new Animated.Value(0));
                }

                // Start stagger animation
                Animated.stagger(100,
                    cardAnimations.map((anim: Animated.Value) =>
                        Animated.timing(anim, {
                            toValue: 1,
                            duration: 300,
                            useNativeDriver: false,
                        })
                    )
                ).start();
            } else {
                // No labor entries found
                console.log('⚠️ No labor entries in response');
                setLaborEntries([]);
            }
        } catch (error: any) {
            console.error('❌ Error fetching labor entries:', error);
            console.error('❌ Error details:', error.response?.data || error.message);
            toast.error('Failed to load labor entries');
            setLaborEntries([]);
        } finally {
            setLoading(false);
        }
    };

    // Function to get labor icon and color based on category
    const getLaborIconAndColor = (category: string) => {
        const categoryMap: { [key: string]: { icon: keyof typeof import('@expo/vector-icons').Ionicons.glyphMap, color: string } } = {
            'Civil / Structural Works': { icon: 'hammer-outline', color: '#EF4444' },
            'Electrical Works': { icon: 'flash-outline', color: '#F59E0B' },
            'Plumbing & Sanitary Works': { icon: 'water-outline', color: '#3B82F6' },
            'Finishing Works': { icon: 'brush-outline', color: '#EC4899' },
            'Mechanical & HVAC Works': { icon: 'thermometer-outline', color: '#F97316' },
            'Fire Fighting & Safety Works': { icon: 'flame-outline', color: '#DC2626' },
            'External & Infrastructure Works': { icon: 'leaf-outline', color: '#65A30D' },
            'Waterproofing & Treatment Works': { icon: 'shield-outline', color: '#10B981' },
            'Site Management & Support Staff': { icon: 'people-outline', color: '#1E40AF' },
            'Equipment Operators': { icon: 'car-outline', color: '#7C2D12' },
            'Security & Housekeeping': { icon: 'shield-checkmark-outline', color: '#374151' }
        };

        return categoryMap[category] || { icon: 'people-outline', color: '#6B7280' };
    };

    // Function to load data
    const loadData = async () => {
        setLoading(true);
        
        try {
            // Load labor entries from API with pagination
            await fetchLaborEntries(1);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Function to start loading animation
    const startLoadingAnimation = () => {
        setIsAddingLabor(true);
        Animated.loop(
            Animated.timing(loadingAnimation, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            })
        ).start();
    };

    // Function to stop loading animation
    const stopLoadingAnimation = () => {
        setIsAddingLabor(false);
        loadingAnimation.stopAnimation();
        loadingAnimation.setValue(0);
    };
    // Function to handle adding labor entries (real API implementation)
    const handleAddLaborEntries = async (laborEntries: LaborEntry[], message: string) => {
        try {
            console.log('Adding labor entries:', laborEntries);

            // Start loading animation
            startLoadingAnimation();
            toast.loading(`Adding labor...`);

            const clientId = await getClientId();
            if (!clientId) {
                throw new Error('Client ID not found');
            }

            // Prepare data for the labor API
            const requestData = {
                laborEntries: laborEntries.map(entry => ({
                    type: entry.type,
                    category: entry.category,
                    count: entry.count,
                    perLaborCost: entry.perLaborCost,
                    totalCost: entry.count * entry.perLaborCost,
                    notes: message || '',
                    workDate: new Date().toISOString(),
                    status: 'active'
                })),
                entityType: 'project',
                entityId: projectId,
                sectionId: sectionId,
                addedBy: clientId
            };

            console.log('Sending labor data to API:', requestData);

            // Use apiClient for authenticated requests
            const response = await apiClient.post('/api/labor', requestData);

            const result = response.data;
            console.log('Labor API response:', result);

            if (result.success) {
                // Log activity for labor addition
                try {
                    console.log('🚀 Starting labor activity logging...');
                    
                    // Import the activity logger
                    const { logLaborAdded } = await import('@/utils/activityLogger');
                    
                    await logLaborAdded(
                        projectId,
                        projectName,
                        sectionId,
                        sectionName,
                        sectionId, // Use sectionId as miniSectionId since we removed mini-sections
                        sectionName, // Use sectionName as miniSectionName
                        laborEntries.map(entry => ({
                            type: entry.type,
                            category: entry.category,
                            count: entry.count,
                            perLaborCost: entry.perLaborCost,
                            totalCost: entry.count * entry.perLaborCost,
                        })),
                        message
                    );
                    
                    console.log('✅ Labor activity logged successfully');
                } catch (activityError: any) {
                    console.error('❌ Failed to log labor activity:', activityError);
                    // Don't fail the main operation if activity logging fails
                }

                // Refresh the labor entries list
                await fetchLaborEntries();

                // Stop loading animation and show success
                stopLoadingAnimation();
                toast.dismiss();
                toast.success(`Labor added successfully`);
                
                // Send simple notification for labor addition
                try {
                    console.log('\n🔔 Sending simple notification for labor addition...');
                    
                    const staffName = user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Staff Member';
                    const laborCount = laborEntries.length;
                    const totalValue = laborEntries.reduce((sum, entry) => sum + (entry.count * entry.perLaborCost), 0);
                    
                    const notificationDetails = `Added ${laborCount} labor ${laborCount === 1 ? 'entry' : 'entries'} worth ₹${totalValue.toLocaleString()}`;
                    
                    const notificationSent = await sendProjectNotification({
                        projectId: projectId,
                        clientId: clientId || undefined,
                        activityType: 'labor_added',
                        staffName: staffName,
                        projectName: projectName,
                        details: notificationDetails,
                        performerId: user?._id,
                        performerRole: user?.role,
                        recipientType: 'admins',
                    });
                    
                    if (notificationSent) {
                        console.log('✅ Labor notification sent successfully');
                    } else {
                        console.warn('⚠️ Labor notification failed to send');
                    }
                } catch (notificationError) {
                    console.error('❌ Labor notification error:', notificationError);
                }
            } else {
                throw new Error(result.message || 'Failed to add labor entries');
            }
            
        } catch (error: any) {
            console.error('Error adding labor entries:', error);
            stopLoadingAnimation();
            toast.dismiss();
            toast.error(error.message || 'Failed to add labor entries');
        }
    };

    // Function to format date for grouping
    const formatDateHeader = (dateString: string): string => {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });
        }
    };

    // Function to group labor entries by date
    const getGroupedByDate = () => {
        const grouped: { [date: string]: Labor[] } = {};
        
        laborEntries.forEach(labor => {
            const dateKey = new Date(labor.date).toDateString();
            if (!grouped[dateKey]) {
                grouped[dateKey] = [];
            }
            grouped[dateKey].push(labor);
        });

        return Object.keys(grouped)
            .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
            .map(date => ({
                date,
                laborEntries: grouped[date]
            }));
    };

    // Calculate total cost
    const totalCost = laborEntries.reduce((sum, labor) => sum + labor.totalCost, 0);

    const formatPrice = (price: number): string => {
        return `₹${price.toLocaleString('en-IN')}`;
    };

    const getSectionName = (sectionId: string | undefined): string => {
        return sectionName || 'Unknown Section';
    };

    // Load data on component mount
    useEffect(() => {
        loadData();
    }, [projectId, sectionId]);

    return (
        <SafeAreaView style={styles.container}>
            <Header
                selectedSection={null}
                onSectionSelect={() => { }}
                totalCost={totalCost}
                formatPrice={formatPrice}
                getSectionName={getSectionName}
                projectName={projectName}
                sectionName={`${sectionName} - Labor`}
                projectId={projectId}
                sectionId={sectionId}
                onShowSectionPrompt={() => { }}
                hideSection={true}
            />

            {/* Action Button - Add Labor */}
            <View style={actionStyles.stickyActionButtonsContainer}>
                <TouchableOpacity
                    style={[
                        actionStyles.addLaborButton,
                        isAddingLabor && actionStyles.addLaborButtonDisabled
                    ]}
                    onPress={() => setShowLaborForm(true)}
                    activeOpacity={0.7}
                    disabled={isAddingLabor}
                >
                    {isAddingLabor ? (
                        <Animated.View
                            style={{
                                transform: [
                                    {
                                        rotate: loadingAnimation.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: ['0deg', '360deg'],
                                        }),
                                    },
                                ],
                            }}
                        >
                            <Ionicons name="sync" size={20} color="#94A3B8" />
                        </Animated.View>
                    ) : (
                        <Ionicons name="people-circle-outline" size={20} color="#3B82F6" />
                    )}
                    <Text style={[
                        actionStyles.addLaborButtonText,
                        isAddingLabor && actionStyles.addLaborButtonTextDisabled
                    ]}>
                        {isAddingLabor ? 'Adding...' : 'Add Labor'}
                    </Text>
                </TouchableOpacity>
            </View>

            <LaborFormModal
                visible={showLaborForm}
                onClose={() => setShowLaborForm(false)}
                onSubmit={handleAddLaborEntries}
                projectId={projectId}
                projectName={projectName}
                sectionId={sectionId}
                sectionName={sectionName}
                miniSections={[]}
            />

            <ScrollView
                ref={scrollViewRef}
                style={styles.scrollContainer}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Labor Entries Display */}
                {loading ? (
                    <View style={styles.noMaterialsContainer}>
                        <Animated.View style={{
                            transform: [{
                                rotate: cardAnimations[0]?.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: ['0deg', '360deg'],
                                }) || '0deg'
                            }]
                        }}>
                            <Ionicons name="sync" size={48} color="#3B82F6" />
                        </Animated.View>
                        <Text style={styles.noMaterialsTitle}>Loading Labor Entries...</Text>
                        <Text style={styles.noMaterialsDescription}>
                            Please wait while we fetch your data...
                        </Text>
                    </View>
                ) : laborEntries.length > 0 ? (
                    // Display labor entries grouped by date
                    (() => {
                        const groupedByDate = getGroupedByDate();
                        
                        return groupedByDate.map((dateGroup, dateIndex) => (
                            <View key={dateGroup.date} style={dateGroupStyles.dateGroupContainer}>
                                {/* Date Header */}
                                <View style={dateGroupStyles.dateHeader}>
                                    <View style={dateGroupStyles.dateHeaderLeft}>
                                        <Ionicons name="people-outline" size={16} color="#64748B" />
                                        <Text style={dateGroupStyles.materialCountText}>
                                            {dateGroup.laborEntries.length} {dateGroup.laborEntries.length === 1 ? 'Entry' : 'Entries'}
                                        </Text>
                                    </View>
                                    <View style={dateGroupStyles.dateHeaderRight}>
                                        <Text style={dateGroupStyles.dateHeaderText}>
                                            {formatDateHeader(dateGroup.date)}
                                        </Text>
                                        <Ionicons name="calendar-outline" size={16} color="#64748B" />
                                    </View>
                                </View>

                                {/* Labor entries for this date */}
                                {dateGroup.laborEntries.map((labor: Labor, index: number) => (
                                    <LaborCardEnhanced
                                        key={`${dateGroup.date}-${labor._id}-${index}`}
                                        labor={labor}
                                        animation={cardAnimations[dateIndex * 10 + index] || new Animated.Value(1)}
                                        showMiniSectionLabel={false}
                                        miniSections={[]}
                                    />
                                ))}
                            </View>
                        ));
                    })()
                ) : (
                    <View style={styles.noMaterialsContainer}>
                        <Ionicons name="people-outline" size={64} color="#CBD5E1" />
                        <Text style={styles.noMaterialsTitle}>No Labor Entries Found</Text>
                        <Text style={styles.noMaterialsDescription}>
                            No labor entries found for this section. Add some labor entries to get started.
                        </Text>
                    </View>
                )}


            </ScrollView> 

            {/* Loading Overlay */}
            {isAddingLabor && (
                <View style={loadingStyles.loadingOverlay}>
                    <View style={loadingStyles.loadingContainer}>
                        <Animated.View
                            style={[
                                loadingStyles.loadingSpinner,
                                {
                                    transform: [
                                        {
                                            rotate: loadingAnimation.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: ['0deg', '360deg'],
                                            }),
                                        },
                                    ],
                                },
                            ]}
                        >
                            <Ionicons name="people-circle" size={48} color="#3B82F6" />
                        </Animated.View>
                        <Text style={loadingStyles.loadingTitle}>Adding Labor Entries</Text>
                        <Text style={loadingStyles.loadingSubtitle}>Please wait while we process your request...</Text>
                        
                        {/* Progress dots animation */}
                        <View style={loadingStyles.dotsContainer}>
                            <Animated.View
                                style={[
                                    loadingStyles.dot,
                                    {
                                        opacity: loadingAnimation.interpolate({
                                            inputRange: [0, 0.33, 0.66, 1],
                                            outputRange: [0.3, 1, 0.3, 0.3],
                                        }),
                                    },
                                ]}
                            />
                            <Animated.View
                                style={[
                                    loadingStyles.dot,
                                    {
                                        opacity: loadingAnimation.interpolate({
                                            inputRange: [0, 0.33, 0.66, 1],
                                            outputRange: [0.3, 0.3, 1, 0.3],
                                        }),
                                    },
                                ]}
                            />
                            <Animated.View
                                style={[
                                    loadingStyles.dot,
                                    {
                                        opacity: loadingAnimation.interpolate({
                                            inputRange: [0, 0.33, 0.66, 1],
                                            outputRange: [0.3, 0.3, 0.3, 1],
                                        }),
                                    },
                                ]}
                            />
                        </View>
                    </View>
                </View>
            )}
        </SafeAreaView>
    );
};

// Styles
const actionStyles = StyleSheet.create({
    stickyActionButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        gap: 8,
        flexWrap: 'wrap',
    },
    addLaborButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EFF6FF',
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#DBEAFE',
        gap: 8,
        justifyContent: 'center',
        minWidth: 180,
        flex: 0.8,
    },
    addLaborButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#3B82F6',
    },
    addLaborButtonDisabled: {
        backgroundColor: '#F1F5F9',
        borderColor: '#E2E8F0',
        opacity: 0.7,
    },
    addLaborButtonTextDisabled: {
        color: '#94A3B8',
    },
});

const dateGroupStyles = StyleSheet.create({
    dateGroupContainer: {
        marginBottom: 16,
    },
    dateHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: '#F8FAFC',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    dateHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    dateHeaderRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    materialCountText: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '600',
    },
    dateHeaderText: {
        fontSize: 13,
        color: '#1E293B',
        fontWeight: '600',
    },
});



const loadingStyles = StyleSheet.create({
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    loadingContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 32,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 8,
        minWidth: 280,
    },
    loadingSpinner: {
        marginBottom: 20,
    },
    loadingTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 8,
        textAlign: 'center',
    },
    loadingSubtitle: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
    },
    dotsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#3B82F6',
    },
});

export default LaborPage;