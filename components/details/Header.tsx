import { styles } from '@/style/details';
import { Section } from '@/types/details';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import SectionManager from './SectionManager';

interface HeaderProps {
    selectedSection: string | null;
    onSectionSelect: (sectionId: string | null) => void;
    totalCost: number;
    formatPrice: (price: number) => string;
    getSectionName: (sectionId: string | undefined) => string;
}

const Header: React.FC<HeaderProps> = ({
    selectedSection,
    onSectionSelect,
    totalCost,
    formatPrice,
    getSectionName,
}) => {
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

    return (
        <View style={styles.header}>
            <View style={styles.headerLeft}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.backButton}
                    activeOpacity={0.7}
                >
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <View style={styles.projectInfo}>
                    <Text style={styles.projectNameSmall}>Villa Project</Text>
                    <Text style={styles.sectionNameMedium}>
                        {selectedSection ? getSectionName(selectedSection) : 'All Sections'}
                    </Text>
                    <Text style={styles.totalCostText}>{formatPrice(totalCost)}</Text>
                </View>
            </View>
            <View style={styles.headerRight}>
                <SectionManager
                    onSectionSelect={onSectionSelect}
                    selectedSection={selectedSection}
                    sections={sections}
                    compact={true}
                    style={styles.headerSectionManager}
                />
            </View>
        </View>
    );
};

export default Header;