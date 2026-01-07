import Header from '@/components/details/Header';
import LaborCardEnhanced from '@/components/details/LaborCardEnhanced';
import LaborFormModal from '@/components/details/LaborFormModal';
import SectionManager from '@/components/details/SectionManager';

import { styles } from '@/style/details';
import { Section } from '@/types/details';
import { Labor, LaborEntry } from '@/types/labor';
import { Ionicons } from '@expo/vector-icons';

import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';

const LaborPage = () => {
    const params = useLocalSearchParams();
    const projectId = params.projectId as string;
    const projectName = params.projectName as string;
    const sectionId = params.sectionId as string;
    const sectionName = params.sectionName as string;

    const [laborEntries, setLaborEntries] = useState<Labor[]>([]);
    const [miniSections, setMiniSections] = useState<Section[]>([]);
    const [loading, setLoading] = useState(false);
    const [showLaborForm, setShowLaborForm] = useState(false);
    const [selectedMiniSection, setSelectedMiniSection] = useState<string | null>(null);
    const cardAnimations = useRef<Animated.Value[]>([]).current;
    const scrollViewRef = useRef<ScrollView>(null);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [totalCount, setTotalCount] = useState(0);

    // Mock data for demonstration
    const mockMiniSections: Section[] = [
        { 
            _id: '1', 
            name: 'Foundation Work', 
            projectDetails: { projectName, projectId },
            mainSectionDetails: { sectionName, sectionId },
            MaterialUsed: [],
            MaterialAvailable: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            __v: 0
        },
        { 
            _id: '2', 
            name: 'Structural Work', 
            projectDetails: { projectName, projectId },
            mainSectionDetails: { sectionName, sectionId },
            MaterialUsed: [],
            MaterialAvailable: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            __v: 0
        },
        { 
            _id: '3', 
            name: 'Finishing Work', 
            projectDetails: { projectName, projectId },
            mainSectionDetails: { sectionName, sectionId },
            MaterialUsed: [],
            MaterialAvailable: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            __v: 0
        },
    ];

    const mockLaborEntries: Labor[] = [
        {
            id: 1,
            _id: 'labor1',
            type: 'Mason',
            category: 'skilled',
            count: 5,
            perLaborCost: 800,
            totalCost: 4000,
            date: new Date().toISOString(),
            icon: 'hammer-outline',
            color: '#EF4444',
            sectionId: sectionId,
            miniSectionId: '1',
            addedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: 2,
            _id: 'labor2',
            type: 'Electrician',
            category: 'skilled',
            count: 3,
            perLaborCost: 1000,
            totalCost: 3000,
            date: new Date().toISOString(),
            icon: 'flash-outline',
            color: '#F59E0B',
            sectionId: sectionId,
            miniSectionId: '2',
            addedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: 3,
            _id: 'labor3',
            type: 'Helper',
            category: 'unskilled',
            count: 8,
            perLaborCost: 500,
            totalCost: 4000,
            date: new Date().toISOString(),
            icon: 'people-outline',
            color: '#6B7280',
            sectionId: sectionId,
            miniSectionId: '1',
            addedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }
    ];

    // Function to get labor icon and color based on category
    const getLaborIconAndColor = (category: string) => {
        const categoryMap: { [key: string]: { icon: keyof typeof import('@expo/vector-icons').Ionicons.glyphMap, color: string } } = {
            'Civil Works Labour': { icon: 'hammer-outline', color: '#EF4444' },
            'Electrical Works Labour': { icon: 'flash-outline', color: '#F59E0B' },
            'Plumbing & Sanitary Labour': { icon: 'water-outline', color: '#3B82F6' },
            'Carpentry & Shuttering Labour': { icon: 'construct-outline', color: '#84CC16' },
            'Steel / Reinforcement Labour': { icon: 'barbell-outline', color: '#6B7280' },
            'Finishing Works Labour': { icon: 'brush-outline', color: '#EC4899' },
            'Painting Labour': { icon: 'color-palette-outline', color: '#8B5CF6' },
            'Flooring & Tiling Labour': { icon: 'grid-outline', color: '#06B6D4' },
            'Waterproofing Labour': { icon: 'shield-outline', color: '#10B981' },
            'HVAC / Mechanical Labour': { icon: 'thermometer-outline', color: '#F97316' },
            'Fire Fighting Labour': { icon: 'flame-outline', color: '#DC2626' },
            'External Development Labour': { icon: 'leaf-outline', color: '#65A30D' },
            'Equipment Operator': { icon: 'car-outline', color: '#7C2D12' },
            'Site Supervision Staff': { icon: 'people-outline', color: '#1E40AF' },
            'Security & Housekeeping': { icon: 'shield-checkmark-outline', color: '#374151' }
        };

        return categoryMap[category] || { icon: 'people-outline', color: '#6B7280' };
    };

    // Function to load mock data
    const loadMockData = () => {
        setLoading(true);
        
        // Simulate loading delay
        setTimeout(() => {
            setMiniSections(mockMiniSections);
            setLaborEntries(mockLaborEntries);
            setTotalCount(mockLaborEntries.length);
            
            // Initialize animations
            cardAnimations.splice(0);
            for (let i = 0; i < mockLaborEntries.length; i++) {
                cardAnimations.push(new Animated.Value(0));
            }

            Animated.stagger(100,
                cardAnimations.map((anim: Animated.Value) =>
                    Animated.timing(anim, {
                        toValue: 1,
                        duration: 300,
                        useNativeDriver: false,
                    })
                )
            ).start();
            
            setLoading(false);
        }, 1000);
    };

    // Function to handle adding labor entries (mock implementation)
    const handleAddLaborEntries = async (laborEntries: LaborEntry[], message: string, miniSectionId?: string) => {
        try {
            console.log('Adding labor entries (mock):', laborEntries);
            
            if (!miniSectionId) {
                toast.error('Mini-section is required for labor entries');
                return;
            }

            // Create new labor entries with mock data
            const newEntries: Labor[] = laborEntries.map((entry, index) => ({
                id: laborEntries.length + index + 1,
                _id: `labor_${Date.now()}_${index}`,
                type: entry.type,
                category: entry.category,
                count: entry.count,
                perLaborCost: entry.perLaborCost,
                totalCost: entry.count * entry.perLaborCost,
                date: new Date().toISOString(),
                icon: getLaborIconAndColor(entry.category).icon,
                color: getLaborIconAndColor(entry.category).color,
                sectionId: sectionId,
                miniSectionId: miniSectionId,
                addedAt: new Date().toISOString(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }));

            // Add to existing entries
            setLaborEntries(prev => [...newEntries, ...prev]);
            setTotalCount(prev => prev + newEntries.length);
            
            toast.success(`Successfully added ${newEntries.length} labor entries`);
            
        } catch (error: any) {
            console.error('Error adding labor entries:', error);
            toast.error('Failed to add labor entries');
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

    // Load mock data on component mount
    useEffect(() => {
        loadMockData();
    }, [projectId, sectionId]);

    // Filter entries when mini-section selection changes
    useEffect(() => {
        // This would normally trigger a new API call, but for mock data we'll just filter locally
        if (selectedMiniSection && selectedMiniSection !== 'all-sections') {
            const filtered = mockLaborEntries.filter(entry => entry.miniSectionId === selectedMiniSection);
            setLaborEntries(filtered);
            setTotalCount(filtered.length);
        } else {
            setLaborEntries(mockLaborEntries);
            setTotalCount(mockLaborEntries.length);
        }
        setCurrentPage(1);
    }, [selectedMiniSection]);

    // Handle pagination (mock implementation)
    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        // In a real app, this would trigger an API call
        console.log('Page changed to:', page);
    };

    const totalPages = Math.ceil(totalCount / itemsPerPage);

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
                    style={actionStyles.addLaborButton}
                    onPress={() => setShowLaborForm(true)}
                    activeOpacity={0.7}
                >
                    <Ionicons name="people-circle-outline" size={20} color="#3B82F6" />
                    <Text style={actionStyles.addLaborButtonText}>Add Labor</Text>
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
                miniSections={miniSections}
            />

            <ScrollView
                ref={scrollViewRef}
                style={styles.scrollContainer}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Filters - Mini Section Selection */}
                {miniSections.length > 0 && (
                    <View style={sectionStyles.filtersContainer}>
                        <View style={sectionStyles.filterRow}>
                            <Ionicons name="layers-outline" size={16} color="#64748B" style={sectionStyles.filterIcon} />
                            <View style={sectionStyles.compactSectionSelector}>
                                <SectionManager
                                    onSectionSelect={(sectionId) => {
                                        setSelectedMiniSection(sectionId === 'all-sections' ? null : sectionId);
                                    }}
                                    onAddSection={async (newSection) => {
                                        // Mock implementation - just add to local state
                                        const newMockSection: Section = {
                                            _id: `section_${Date.now()}`,
                                            name: newSection.name,
                                            projectDetails: { projectName, projectId },
                                            mainSectionDetails: { sectionName, sectionId },
                                            MaterialUsed: [],
                                            MaterialAvailable: [],
                                            createdAt: new Date().toISOString(),
                                            updatedAt: new Date().toISOString(),
                                            __v: 0
                                        };
                                        setMiniSections(prev => [...prev, newMockSection]);
                                        toast.success('Section added successfully (mock)');
                                    }}
                                    selectedSection={selectedMiniSection || 'all-sections'}
                                    sections={[
                                        { id: 'all-sections', name: 'All Sections', createdAt: new Date().toISOString() },
                                        ...miniSections.map(s => ({
                                            id: s._id,
                                            name: s.name,
                                            createdAt: s.createdAt
                                        }))
                                    ]}
                                    compact={true}
                                    projectDetails={{
                                        projectName: projectName,
                                        projectId: projectId
                                    }}
                                    mainSectionDetails={{
                                        sectionName: sectionName,
                                        sectionId: sectionId
                                    }}
                                />
                            </View>
                        </View>
                    </View>
                )}

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
                                        showMiniSectionLabel={!selectedMiniSection}
                                        miniSections={miniSections}
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

                {/* Pagination */}
                {totalPages > 1 && (
                    <View style={paginationStyles.paginationContainer}>
                        <TouchableOpacity
                            style={[paginationStyles.paginationButton, currentPage === 1 && paginationStyles.paginationButtonDisabled]}
                            onPress={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                        >
                            <Ionicons name="chevron-back" size={16} color={currentPage === 1 ? "#CBD5E1" : "#3B82F6"} />
                        </TouchableOpacity>

                        <View style={paginationStyles.pageNumbers}>
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let page;
                                if (totalPages <= 5) {
                                    page = i + 1;
                                } else if (currentPage <= 3) {
                                    page = i + 1;
                                } else if (currentPage >= totalPages - 2) {
                                    page = totalPages - 4 + i;
                                } else {
                                    page = currentPage - 2 + i;
                                }

                                return (
                                    <TouchableOpacity
                                        key={page}
                                        style={[
                                            paginationStyles.pageNumber,
                                            currentPage === page && paginationStyles.pageNumberActive
                                        ]}
                                        onPress={() => handlePageChange(page)}
                                    >
                                        <Text style={[
                                            paginationStyles.pageNumberText,
                                            currentPage === page && paginationStyles.pageNumberTextActive
                                        ]}>
                                            {page}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        <TouchableOpacity
                            style={[paginationStyles.paginationButton, currentPage === totalPages && paginationStyles.paginationButtonDisabled]}
                            onPress={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                        >
                            <Ionicons name="chevron-forward" size={16} color={currentPage === totalPages ? "#CBD5E1" : "#3B82F6"} />
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView> 
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
        gap: 10,
        width: '90%',
        justifyContent: 'center',
    },
    addLaborButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#3B82F6',
    },
});

const sectionStyles = StyleSheet.create({
    filtersContainer: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: 20,
        marginVertical: 12,
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    filterRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    filterIcon: {
        marginRight: 8,
    },
    compactSectionSelector: {
        flex: 1,
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

const paginationStyles = StyleSheet.create({
    paginationContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 20,
        paddingHorizontal: 20,
        gap: 12,
    },
    paginationButton: {
        width: 36,
        height: 36,
        borderRadius: 8,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    paginationButtonDisabled: {
        backgroundColor: '#F1F5F9',
        borderColor: '#E2E8F0',
    },
    pageNumbers: {
        flexDirection: 'row',
        gap: 4,
    },
    pageNumber: {
        width: 36,
        height: 36,
        borderRadius: 8,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    pageNumberActive: {
        backgroundColor: '#3B82F6',
        borderColor: '#3B82F6',
    },
    pageNumberText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748B',
    },
    pageNumberTextActive: {
        color: '#FFFFFF',
    },
});

export default LaborPage;