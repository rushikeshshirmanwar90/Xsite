import AddSectionModal from '@/components/AddSection';
import { domain } from '@/lib/domain';
import { ProjectSection } from '@/types/project';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';

const ManageProject = () => {
    const params = useLocalSearchParams();
    const { id, name, sectionData } = params;

    const usableSectionData: ProjectSection[] = JSON.parse(Array.isArray(sectionData) ? sectionData[0] : sectionData)

    // State for modal visibility
    const [showAddModal, setShowAddModal] = useState(false);

    // Handle section addition
    const handleAddSection = async (type: string, title: string, totalHouses?: number) => {
        // Create the base payload
        const payload = {
            projectId: id,
            name: title
        }

        console.log(payload)

        try {
            let res;

            if (type === "building") {
                res = await axios.post(`${domain}/api/building`, payload);

                if (res) {
                    toast.success('Building added successfully!');
                }

            } else if (type === "rowhouse") {
                const rowhousePayload = {
                    ...payload,
                    totalHouses: totalHouses
                };

                res = await axios.post(`${domain}/api/rowHouse`, rowhousePayload);
                if (res) {
                    toast.success('Row house added successfully!');
                }
            } else {
                res = await axios.post(`${domain}/api/otherSection`, payload);
                if (res) {
                    toast.success('Other section added successfully!');
                }
            }

            setShowAddModal(false);

            Alert.alert('Success', 'Section added successfully!');

        } catch (error) {
            toast.error('Failed to add section. Please try again.');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#000" />
                    </TouchableOpacity>
                    <View style={styles.HeadingInfo}>
                        <Text style={styles.headingTitle}>{name}</Text>
                    </View>
                </View>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => setShowAddModal(true)}
                >
                    <Ionicons name="add-circle" size={24} color="#1F2937" />
                    <Text style={styles.addButtonText}>Add Section</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Project Sections</Text>
                    <View style={styles.sectionDivider} />
                </View>

                {/* Section Card Display */}
                {usableSectionData && usableSectionData.length > 0 && usableSectionData.map((section, index) => (
                    <View key={section._id || index} style={styles.sectionCard}>
                        <View style={styles.sectionCardHeader}>
                            <View style={styles.sectionTypeTag}>
                                <Text style={styles.sectionTypeText}>{section.type}</Text>
                            </View>
                            <View style={styles.sectionIdContainer}>
                                <Text style={styles.sectionIdLabel}>Section ID:</Text>
                                <Text style={styles.sectionIdValue}>{section.sectionId}</Text>
                            </View>
                        </View>

                        <View style={styles.sectionCardBody}>
                            <View style={styles.sectionIconContainer}>
                                {section.type === "Buildings" && (
                                    <Ionicons name="business" size={48} color="#3B82F6" />
                                )}
                                {section.type === 'rowhouse' && (
                                    <Ionicons name="home" size={48} color="#10B981" />
                                )}
                                {section.type === 'other' && (
                                    <Ionicons name="cube" size={48} color="#8B5CF6" />
                                )}
                            </View>

                            <View style={styles.sectionDetails}>
                                <Text style={styles.sectionName} numberOfLines={2}>{section.name}</Text>
                                <TouchableOpacity
                                    style={styles.viewDetailsButton}
                                    onPress={() => {
                                        router.push({
                                            pathname: '../section_details/[data]',
                                            params: {
                                                data: JSON.stringify(section)
                                            }
                                        });
                                    }}
                                >
                                    <Text style={styles.viewDetailsText}>View Details</Text>
                                    <Ionicons name="chevron-forward" size={16} color="#3B82F6" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                ))}
            </ScrollView>

            {/* Add Section Modal */}
            <AddSectionModal
                visible={showAddModal}
                onClose={() => setShowAddModal(false)}
                onAddSection={handleAddSection}
                projectId={id as string}
            />
        </SafeAreaView>
    );
};

export default ManageProject;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
        zIndex: 1000,
        marginBottom: 10
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    backButton: {
        padding: 8,
        marginRight: 12,
    },
    HeadingInfo: {
        flex: 1,
    },
    headingTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#000',
        marginBottom: 2,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E5E7EB',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
    },
    addButtonText: {
        marginLeft: 4,
        fontWeight: '600',
        color: '#1F2937',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    sectionHeader: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 8,
    },
    sectionDivider: {
        height: 1,
        backgroundColor: '#E5E7EB',
    },
    projectInfo: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 8,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    infoText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#1F2937',
        marginBottom: 8,
    },
    infoSubText: {
        fontSize: 14,
        color: '#6B7280',
    },
    // Section Card Styles
    sectionCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        overflow: 'hidden',
    },
    sectionCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        backgroundColor: '#F9FAFB',
    },
    sectionTypeTag: {
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#BFDBFE',
    },
    sectionTypeText: {
        color: '#3B82F6',
        fontWeight: '600',
        fontSize: 12,
        textTransform: 'capitalize',
    },
    sectionIdContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    sectionIdLabel: {
        fontSize: 12,
        color: '#6B7280',
        marginRight: 4,
    },
    sectionIdValue: {
        fontSize: 12,
        color: '#1F2937',
        fontWeight: '500',
    },
    sectionCardBody: {
        flexDirection: 'row',
        padding: 16,
        alignItems: 'center',
    },
    sectionIconContainer: {
        width: 80,
        height: 80,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        marginRight: 16,
    },
    sectionDetails: {
        flex: 1,
    },
    sectionName: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 10,
        letterSpacing: 0.3,
    },
    viewDetailsButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    viewDetailsText: {
        color: '#3B82F6',
        fontWeight: '600',
        marginRight: 4,
    }
});