import { getSection } from '@/functions/details';
import { styles } from '@/style/details';
import { Section } from '@/types/details';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View, Modal, StyleSheet } from 'react-native';
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
    // New prop for contractor addition
    onAddContractor?: () => void;
    isAddingContractor?: boolean;
    // New props for menu actions
    onContractorPress?: () => void;
    onEquipmentPress?: () => void;
    onOtherCostPress?: () => void;
    onLaborPress?: () => void;
    hideMenu?: boolean;
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
    // New props for contractor addition
    onAddContractor,
    isAddingContractor = false,
    // New props for menu actions
    onContractorPress,
    onEquipmentPress,
    onOtherCostPress,
    onLaborPress,
    hideMenu = false,
}) => {
    // State to store fetched sections
    const [sections, setSections] = useState<Section[]>([]);
    // State for menu visibility
    const [showMenu, setShowMenu] = useState(false);

    const hasMenuItems = !!(onContractorPress || onLaborPress || onEquipmentPress || onOtherCostPress || onToggleSectionCompletion);

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
                    {/* Add Contractor Button */}
                    {onAddContractor && (
                        <TouchableOpacity
                            style={[
                                styles.addContractorButton,
                                isAddingContractor && styles.addContractorButtonDisabled
                            ]}
                            onPress={onAddContractor}
                            disabled={isAddingContractor}
                            activeOpacity={0.7}
                        >
                            {isAddingContractor ? (
                                <Ionicons name="sync" size={18} color="#FFFFFF" />
                            ) : (
                                <Ionicons name="add" size={20} color="#FFFFFF" />
                            )}
                        </TouchableOpacity>
                    )}

                    {/* Three Dot Menu Button */}
                    {!hideMenu && hasMenuItems && (
                        <TouchableOpacity
                            style={menuStyles.menuButton}
                            onPress={() => setShowMenu(true)}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="ellipsis-vertical" size={20} color="#374151" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Menu Modal */}
            <Modal
                visible={showMenu}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowMenu(false)}
            >
                <TouchableOpacity
                    style={menuStyles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowMenu(false)}
                >
                    <View style={menuStyles.menuContainer}>
                        {/* Contractor Option */}
                        {onContractorPress && (
                            <TouchableOpacity
                                style={menuStyles.menuItem}
                                onPress={() => {
                                    setShowMenu(false);
                                    onContractorPress();
                                }}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="people-outline" size={20} color="#374151" />
                                <Text style={menuStyles.menuItemText}>Add Contractor</Text>
                            </TouchableOpacity>
                        )}

                        {/* Labor Option */}
                        {onLaborPress && (
                            <TouchableOpacity
                                style={menuStyles.menuItem}
                                onPress={() => {
                                    setShowMenu(false);
                                    onLaborPress();
                                }}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="people-circle" size={20} color="#374151" />
                                <Text style={menuStyles.menuItemText}>Manage Labor</Text>
                            </TouchableOpacity>
                        )}

                        {/* Equipment Option */}
                        {onEquipmentPress && (
                            <TouchableOpacity
                                style={menuStyles.menuItem}
                                onPress={() => {
                                    setShowMenu(false);
                                    onEquipmentPress();
                                }}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="construct-outline" size={20} color="#374151" />
                                <Text style={menuStyles.menuItemText}>Add Equipment</Text>
                            </TouchableOpacity>
                        )}

                        {/* Other Cost Option */}
                        {onOtherCostPress && (
                            <TouchableOpacity
                                style={menuStyles.menuItem}
                                onPress={() => {
                                    setShowMenu(false);
                                    onOtherCostPress();
                                }}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="receipt-outline" size={20} color="#374151" />
                                <Text style={menuStyles.menuItemText}>Add Other Cost</Text>
                            </TouchableOpacity>
                        )}

                        {/* Divider */}
                        {onToggleSectionCompletion && (onContractorPress || onEquipmentPress || onOtherCostPress) && (
                            <View style={menuStyles.divider} />
                        )}

                        {/* Mark Complete Option */}
                        {onToggleSectionCompletion && (
                            <TouchableOpacity
                                style={[
                                    menuStyles.menuItem,
                                    isUpdatingCompletion && menuStyles.menuItemDisabled
                                ]}
                                onPress={() => {
                                    setShowMenu(false);
                                    onToggleSectionCompletion();
                                }}
                                disabled={isUpdatingCompletion}
                                activeOpacity={0.7}
                            >
                                <Ionicons 
                                    name={sectionCompleted ? "refresh-outline" : "checkmark-circle-outline"}
                                    size={20} 
                                    color={sectionCompleted ? "#EF4444" : "#10B981"}
                                />
                                <Text style={[
                                    menuStyles.menuItemText,
                                    sectionCompleted ? { color: '#EF4444' } : { color: '#10B981' }
                                ]}>
                                    {isUpdatingCompletion 
                                        ? 'Updating...' 
                                        : sectionCompleted 
                                            ? 'Reopen Section' 
                                            : 'Mark Complete'}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
};

// Menu styles
const menuStyles = StyleSheet.create({
    menuButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-start',
        alignItems: 'flex-end',
        paddingTop: 100, // Adjust based on header height
        paddingRight: 16,
    },
    menuContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        paddingVertical: 8,
        minWidth: 180,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    menuItemDisabled: {
        opacity: 0.6,
    },
    menuItemText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#374151',
        marginLeft: 12,
    },
    divider: {
        height: 1,
        backgroundColor: '#E5E7EB',
        marginVertical: 4,
        marginHorizontal: 16,
    },
});

export default Header;