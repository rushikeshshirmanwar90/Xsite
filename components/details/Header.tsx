import { getSection } from '@/functions/details';
import { styles } from '@/style/details';
import { Section } from '@/types/details';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect } from 'react';
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
}) => {
    // Get the building/main section name from selectedSection
    const buildingName = selectedSection ? getSectionName(selectedSection) : 'All Sections';

    const sections: Section[] = [
        {
            id: 'foundation',
            name: 'Foundation',
            description: 'Base foundation of the building',
            createdAt: '10/1/2024',
        },
        {
            id: 'ground-floor',
            name: 'Ground Floor',
            description: 'Ground floor construction materials',
            createdAt: '12/1/2024',
        },
        {
            id: 'first-floor',
            name: 'First Floor',
            description: 'First floor construction materials',
            createdAt: '20/1/2024',
        },
        {
            id: 'roof',
            name: 'Roof',
            description: 'Roof and terrace materials',
            createdAt: '25/1/2024',
        },
        {
            id: 'exterior',
            name: 'Exterior',
            description: 'Exterior finishing materials',
            createdAt: '28/1/2024',
        },
    ];


    useEffect(() => {
        if (selectedSection) {
            const res: any = getSection(selectedSection);
            const data = res.data
            console.log(data);

        }
    }, [selectedSection]);

    return (
        <View style={styles.headerWrapper}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.backButton}
                    activeOpacity={0.7}
                >
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>

                <View style={styles.headerContent}>
                    {/* Breadcrumb Navigation */}
                    <View style={styles.breadcrumbContainer}>
                        <Text style={styles.breadcrumbText}>{projectName}</Text>
                        {sectionName && (
                            <>
                                <Ionicons name="chevron-forward" size={14} color="#9CA3AF" style={styles.breadcrumbSeparator} />
                                <Text style={styles.breadcrumbTextActive}>{sectionName}</Text>
                            </>
                        )}
                        <Ionicons name="chevron-forward" size={14} color="#9CA3AF" style={styles.breadcrumbSeparator} />
                        <Text style={styles.breadcrumbText}>{buildingName}</Text>
                    </View>

                    {/* Section Dropdown - Replaces the building name title */}
                    <View style={styles.sectionDropdownContainer}>
                        <SectionManager
                            onSectionSelect={onSectionSelect}
                            selectedSection={selectedSection}
                            sections={sections}
                            compact={true}
                            projectDetails={{
                                projectName: projectName || "Villa Project",
                                projectId: projectId || "unknown"
                            }}
                            mainSectionDetails={{
                                sectionName: sectionName || "Main Section",
                                sectionId: sectionId || "unknown"
                            }}
                        />
                    </View>
                </View>
            </View>
        </View>
    );
};

export default Header;