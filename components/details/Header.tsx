import { getSection } from '@/functions/details';
import { styles } from '@/style/details';
import { Section } from '@/types/details';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import SectionManager from './SectionManager';

interface HeaderProps {
    selectedSection: string | null;
    onSectionSelect: (sectionId: string | null) => void;
    totalCost: number;
    formatPrice: (price: number) => string;
    getSectionName: (sectionId: string | undefined) => string;
    projectName?: string;
    sectionName?: string;
    projectId?: string;
    sectionId?: string;
    onShowSectionPrompt?: () => void;
    hideSection?: boolean;
    // New props for section completion
    sectionCompleted?: boolean;
    onToggleSectionCompletion?: () => void;
    isUpdatingCompletion?: boolean;
}

const Header: React.FC<HeaderProps> = ({
    selectedSection,
    onSectionSelect,
    totalCost,
    formatPrice,
    getSectionName,
    projectName = "Villa Project",
    sectionName,
    projectId,
    sectionId,
    onShowSectionPrompt,
    hideSection = false,
    // New props for section completion
    sectionCompleted = false,
    onToggleSectionCompletion,
    isUpdatingCompletion = false,
}) => {
    // State to store fetched sections
    const [sections, setSections] = useState<Section[]>([]);

    // Get the building/main section name from selectedSection
    const getBuildingName = () => {
        console.log('Header getBuildingName:', {
            selectedSection,
            sectionsLength: sections.length,
            sectionId,
            sections: sections.map(s => ({ id: s._id, name: s.name }))
        });

        if (!selectedSection) return 'All Sections';

        // First try to find in fetched sections (dynamic)
        const dynamicSection = sections.find(s => s._id === selectedSection);
        if (dynamicSection) {
            console.log('Header: Found dynamic section:', dynamicSection.name);
            return dynamicSection.name;
        }

        // Fallback to static sections via getSectionName
        const staticName = getSectionName(selectedSection);
        console.log('Header: Static name result:', staticName);

        // If still "Unassigned", try to show a more meaningful name
        if (staticName === 'Unassigned') {
            // If sections are still loading, show loading state
            if (sections.length === 0) {
                return 'Loading...';
            }
            // Otherwise show a generic name
            return 'Selected Section';
        }

        return staticName;
    };

    const buildingName = getBuildingName();

    // Map the sections to ensure they have the expected id field
    const mappedSections = sections.map((section: Section) => ({
        ...section,
        id: section._id // Map _id to id for compatibility
    }));


    useEffect(() => {
        const getSectionData = async () => {
            try {
                // Use sectionId prop to fetch mini-sections
                const sectionIdToUse = sectionId || selectedSection || '';
                console.log('Header: Fetching sections for sectionId:', sectionIdToUse);

                if (sectionIdToUse) {
                    const sections = await getSection(sectionIdToUse);
                    console.log('Header: Fetched sections:', sections);
                    if (sections && Array.isArray(sections) && sections.length > 0) {
                        setSections(sections);
                    } else {
                        console.log('Header: No sections returned from API, using static fallback');
                        // If no sections from API, we'll rely on static sections
                    }
                } else {
                    console.log('Header: No sectionId available, using static sections only');
                }
            } catch (error) {
                console.error("Header: Failed to fetch sections:", error);
                // If API fails, we'll rely on static sections via getSectionName
            }
        };

        getSectionData();
    }, [sectionId, selectedSection]); // Add dependencies back since we need them

    return (
        <View style={styles.headerWrapper}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.backButton}
                    activeOpacity={0.7}
                >
                    <Ionicons name="arrow-back" size={20} color="#1F2937" />
                </TouchableOpacity>

                <View style={[styles.headerContent, { marginLeft: 12 }]}>
                    {/* Breadcrumb Navigation */}
                    <View style={styles.breadcrumbContainer}>
                        <Text style={styles.breadcrumbText}>{projectName}</Text>
                        {sectionName && (
                            <>
                                <Ionicons name="chevron-forward" size={14} color="#9CA3AF" style={styles.breadcrumbSeparator} />
                                <Text style={styles.breadcrumbTextActive}>{sectionName}</Text>
                            </>
                        )}
                    </View>
                </View>

                {/* Right side buttons */}
                <View style={styles.headerActions}>
                    {/* Section Completion Button */}
                    {onToggleSectionCompletion && (
                        <>
                            {sectionCompleted ? (
                                <View style={[
                                    styles.completionButton,
                                    { backgroundColor: '#ECFDF5', borderColor: '#10B981' }
                                ]}>
                                    <Ionicons 
                                        name="checkmark-circle" 
                                        size={16} 
                                        color="#10B981" 
                                    />
                                    <Text style={[
                                        styles.completionButtonText,
                                        { color: '#059669' }
                                    ]}>
                                        Complete
                                    </Text>
                                </View>
                            ) : (
                                <TouchableOpacity
                                    style={[
                                        styles.completionButton,
                                        isUpdatingCompletion && { opacity: 0.6 }
                                    ]}
                                    onPress={onToggleSectionCompletion}
                                    disabled={isUpdatingCompletion}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons 
                                        name="ellipse-outline" 
                                        size={16} 
                                        color="#6B7280" 
                                    />
                                    <Text style={styles.completionButtonText}>
                                        {isUpdatingCompletion ? 'Updating...' : 'Mark Complete'}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </>
                    )}
                </View>
            </View>
        </View>
    );
};

export default Header;