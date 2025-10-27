import { getSection } from '@/functions/details';
import { Section } from '@/types/details';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface SectionSelectionPromptProps {
    visible: boolean;
    onSelectSection: (sectionId: string) => void;
    onClose: () => void;
    sectionId: string;
    projectName?: string;
    sectionName?: string;
}

const SectionSelectionPrompt: React.FC<SectionSelectionPromptProps> = ({
    visible,
    onSelectSection,
    onClose,
    sectionId,
    projectName = "Project",
    sectionName = "Section",
}) => {
    const [sections, setSections] = useState<Section[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (visible) {
            fetchSections();
        }
    }, [visible, sectionId]);

    const fetchSections = async () => {
        try {
            setLoading(true);
            console.log('SectionPrompt: Fetching sections for sectionId:', sectionId);
            const fetchedSections = await getSection(sectionId);
            console.log('SectionPrompt: Fetched sections:', fetchedSections);
            
            if (fetchedSections && Array.isArray(fetchedSections)) {
                setSections(fetchedSections);
            }
        } catch (error) {
            console.error('SectionPrompt: Failed to fetch sections:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSectionSelect = (selectedSectionId: string) => {
        onSelectSection(selectedSectionId);
        onClose();
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerContent}>
                            <Ionicons name="layers-outline" size={24} color="#3B82F6" />
                            <Text style={styles.title}>Select a Mini-Section</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color="#64748B" />
                        </TouchableOpacity>
                    </View>

                    {/* Subtitle */}
                    <View style={styles.subtitleContainer}>
                        <Text style={styles.subtitle}>
                            Choose a mini-section from <Text style={styles.projectName}>{projectName}</Text>
                            {sectionName && (
                                <>
                                    <Text style={styles.separator}> › </Text>
                                    <Text style={styles.sectionName}>{sectionName}</Text>
                                </>
                            )}
                        </Text>
                        <Text style={styles.description}>
                            Select a mini-section (like Foundation, First Slab, etc.) to view and manage materials
                        </Text>
                    </View>

                    {/* Sections List */}
                    <ScrollView style={styles.sectionsList} showsVerticalScrollIndicator={false}>
                        {loading ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color="#3B82F6" />
                                <Text style={styles.loadingText}>Loading sections...</Text>
                            </View>
                        ) : sections.length > 0 ? (
                            sections.map((section, index) => (
                                <TouchableOpacity
                                    key={section._id}
                                    style={[
                                        styles.sectionItem,
                                        index === sections.length - 1 && styles.lastSectionItem
                                    ]}
                                    onPress={() => handleSectionSelect(section._id)}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.sectionIcon}>
                                        <Ionicons name="cube-outline" size={20} color="#3B82F6" />
                                    </View>
                                    <View style={styles.sectionInfo}>
                                        <Text style={styles.sectionName}>{section.name}</Text>
                                        <Text style={styles.sectionDescription}>
                                            Tap to view materials for this mini-section
                                        </Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                                </TouchableOpacity>
                            ))
                        ) : (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="cube-outline" size={48} color="#9CA3AF" />
                                <Text style={styles.emptyTitle}>No Sections Found</Text>
                                <Text style={styles.emptyDescription}>
                                    No mini-sections are available for this section yet.
                                </Text>
                            </View>
                        )}
                    </ScrollView>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <TouchableOpacity style={styles.skipButton} onPress={onClose}>
                            <Text style={styles.skipButtonText}>Skip for now</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    container: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        width: '100%',
        maxWidth: 400,
        maxHeight: '80%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1E293B',
    },
    closeButton: {
        padding: 4,
        borderRadius: 8,
        backgroundColor: '#F8FAFC',
    },
    subtitleContainer: {
        padding: 20,
        paddingBottom: 16,
    },
    subtitle: {
        fontSize: 16,
        color: '#64748B',
        lineHeight: 24,
        marginBottom: 8,
    },
    projectName: {
        fontWeight: '600',
        color: '#1E293B',
    },
    separator: {
        color: '#9CA3AF',
    },
    sectionName: {
        fontWeight: '600',
        color: '#3B82F6',
    },
    description: {
        fontSize: 14,
        color: '#9CA3AF',
        lineHeight: 20,
    },
    sectionsList: {
        flex: 1,
        paddingHorizontal: 20,
    },
    loadingContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
        gap: 16,
    },
    loadingText: {
        fontSize: 16,
        color: '#64748B',
    },
    sectionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    lastSectionItem: {
        marginBottom: 0,
    },
    sectionIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#DBEAFE',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    sectionInfo: {
        flex: 1,
    },
    sectionDescription: {
        fontSize: 14,
        color: '#64748B',
        marginTop: 2,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
        gap: 16,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#64748B',
    },
    emptyDescription: {
        fontSize: 14,
        color: '#9CA3AF',
        textAlign: 'center',
        lineHeight: 20,
    },
    footer: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    skipButton: {
        alignItems: 'center',
        paddingVertical: 12,
    },
    skipButtonText: {
        fontSize: 16,
        color: '#64748B',
        fontWeight: '500',
    },
});

export default SectionSelectionPrompt;