import { Colors } from '@/constants/theme';
import { getSection } from '@/functions/details';
import { styles } from '@/style/details';
import { Section } from '@/types/details';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Text, Pressable, View, Modal, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
    // Report generation button — only passed (and shown) when a mini-section is selected
    onReportPress?: () => void;
    isGeneratingReport?: boolean;
    // Project-wide current material stock report (Sr No, Material Name, Total Imported/Used/Available)
    onStockReportPress?: () => void;
    isGeneratingStockReport?: boolean;
    // Material analysis (cost breakdown pie chart) for the selected mini-section
    onMaterialAnalysisPress?: () => void;
    subtitle?: string;
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
    onReportPress,
    isGeneratingReport = false,
    onStockReportPress,
    isGeneratingStockReport = false,
    onMaterialAnalysisPress,
    subtitle,
}) => {
    // State to store fetched sections
    const [sections, setSections] = useState<Section[]>([]);
    // State for menu visibility
    const [showMenu, setShowMenu] = useState(false);
    const insets = useSafeAreaInsets();

    const hasMenuItems = !!(onContractorPress || onLaborPress || onEquipmentPress || onOtherCostPress || onToggleSectionCompletion || onStockReportPress || onMaterialAnalysisPress);

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

    const menuItems: { key: string; icon: React.ComponentProps<typeof Ionicons>['name']; label: string; onPress?: () => void; disabled?: boolean }[] = [
        { key: 'contractor', icon: 'people-outline' as const, label: 'Add Contractor', onPress: onContractorPress },
        { key: 'labor', icon: 'people-circle-outline' as const, label: 'Manage Labor', onPress: onLaborPress },
        { key: 'equipment', icon: 'construct-outline' as const, label: 'Add Equipment', onPress: onEquipmentPress },
        { key: 'other', icon: 'receipt-outline' as const, label: 'Add Other Cost', onPress: onOtherCostPress },
        {
            key: 'stock', icon: 'stats-chart-outline' as const,
            label: isGeneratingStockReport ? 'Generating Report...' : 'Material Stock Report',
            onPress: onStockReportPress, disabled: isGeneratingStockReport,
        },
        { key: 'analysis', icon: 'pie-chart-outline' as const, label: 'Material Analysis', onPress: onMaterialAnalysisPress },
    ].filter(item => !!item.onPress);

    // Title hierarchy: an explicit subtitle (e.g. "Labor") is the screen's title and the
    // project › section path sits above it; otherwise the section itself is the title.
    const title = subtitle || sectionName || projectName;
    const pathParts = (subtitle ? [projectName, sectionName] : sectionName ? [projectName] : []).filter(Boolean) as string[];

    return (
        <View style={styles.headerWrapper}>
            <View style={styles.header}>
                <Pressable
                    onPress={() => router.back()}
                    style={({ pressed }) => [styles.backButton, pressed && menuStyles.iconButtonPressed]}
                    accessibilityRole="button"
                    accessibilityLabel="Back"
                >
                    <Ionicons name="arrow-back" size={22} color="#0F172A" />
                </Pressable>

                <View style={[styles.headerContent, { marginLeft: 12 }]}>
                    {pathParts.length > 0 && (
                        <View style={styles.breadcrumbContainer}>
                            {pathParts.map((part, i) => (
                                <React.Fragment key={`${part}-${i}`}>
                                    {i > 0 && <Ionicons name="chevron-forward" size={12} color={Colors.textTertiary} style={styles.breadcrumbSeparator} />}
                                    <Text style={styles.breadcrumbText} numberOfLines={1}>{part}</Text>
                                </React.Fragment>
                            ))}
                        </View>
                    )}
                    <Text style={styles.breadcrumbTextActive} numberOfLines={1} accessibilityRole="header">
                        {title}
                    </Text>
                </View>

                {/* Right side buttons */}
                <View style={styles.headerActions}>
                    {/* Add Contractor Button */}
                    {onAddContractor && (
                        <Pressable
                            style={[
                                styles.addContractorButton,
                                isAddingContractor && styles.addContractorButtonDisabled
                            ]}
                            onPress={onAddContractor}
                            disabled={isAddingContractor}
                            accessibilityRole="button"
                            accessibilityLabel="Add contractor"
                        >
                            {isAddingContractor ? (
                                <Ionicons name="sync" size={18} color="#FFFFFF" />
                            ) : (
                                <Ionicons name="add" size={22} color="#FFFFFF" />
                            )}
                        </Pressable>
                    )}

                    {/* Report Generation Button — only shown when a mini-section is selected */}
                    {onReportPress && (
                        <Pressable
                            style={({ pressed }) => [
                                menuStyles.menuButton,
                                pressed && menuStyles.iconButtonPressed,
                                isGeneratingReport && { opacity: 0.6 },
                            ]}
                            onPress={onReportPress}
                            disabled={isGeneratingReport}
                            accessibilityRole="button"
                            accessibilityLabel={isGeneratingReport ? 'Generating report' : 'Generate report'}
                        >
                            {isGeneratingReport ? (
                                <Ionicons name="sync" size={18} color={Colors.primary} />
                            ) : (
                                <Ionicons name="document-text-outline" size={21} color={Colors.primary} />
                            )}
                        </Pressable>
                    )}

                    {/* More actions */}
                    {!hideMenu && hasMenuItems && (
                        <Pressable
                            style={({ pressed }) => [menuStyles.menuButton, pressed && menuStyles.iconButtonPressed]}
                            onPress={() => setShowMenu(true)}
                            accessibilityRole="button"
                            accessibilityLabel="More actions"
                        >
                            <Ionicons name="ellipsis-horizontal" size={20} color="#0F172A" />
                        </Pressable>
                    )}
                </View>
            </View>

            {/* Actions sheet */}
            <Modal
                visible={showMenu}
                transparent={true}
                animationType="fade"
                statusBarTranslucent
                onRequestClose={() => setShowMenu(false)}
            >
                <Pressable
                    style={menuStyles.modalOverlay}
                    onPress={() => setShowMenu(false)}
                    accessibilityLabel="Close actions"
                >
                    <Pressable style={[menuStyles.sheet, { paddingBottom: Math.max(insets.bottom, 12) + 8 }]}>
                        <View style={menuStyles.grabber} />
                        <Text style={menuStyles.sheetTitle} numberOfLines={1}>{title}</Text>

                        {menuItems.length > 0 && (
                            <View style={menuStyles.group}>
                                {menuItems.map((item, i) => (
                                    <React.Fragment key={item.key}>
                                        {i > 0 && <View style={menuStyles.divider} />}
                                        <Pressable
                                            style={({ pressed }) => [menuStyles.menuItem, pressed && menuStyles.menuItemPressed, item.disabled && menuStyles.menuItemDisabled]}
                                            onPress={() => {
                                                setShowMenu(false);
                                                item.onPress?.();
                                            }}
                                            disabled={item.disabled}
                                            accessibilityRole="button"
                                        >
                                            <Ionicons name={item.icon} size={20} color={Colors.primary} />
                                            <Text style={menuStyles.menuItemText}>{item.label}</Text>
                                        </Pressable>
                                    </React.Fragment>
                                ))}
                            </View>
                        )}

                        {/* Mark Complete / Reopen — its own group, since it changes the section's state */}
                        {onToggleSectionCompletion && (
                            <View style={[menuStyles.group, menuItems.length > 0 && { marginTop: 10 }]}>
                                <Pressable
                                    style={({ pressed }) => [menuStyles.menuItem, pressed && menuStyles.menuItemPressed, isUpdatingCompletion && menuStyles.menuItemDisabled]}
                                    onPress={() => {
                                        setShowMenu(false);
                                        onToggleSectionCompletion();
                                    }}
                                    disabled={isUpdatingCompletion}
                                    accessibilityRole="button"
                                >
                                    <Ionicons
                                        name={sectionCompleted ? "refresh-outline" : "checkmark-circle-outline"}
                                        size={20}
                                        color={sectionCompleted ? Colors.errorText : Colors.successText}
                                    />
                                    <Text style={[
                                        menuStyles.menuItemText,
                                        { color: sectionCompleted ? Colors.errorText : Colors.successText }
                                    ]}>
                                        {isUpdatingCompletion
                                            ? 'Updating...'
                                            : sectionCompleted
                                                ? 'Reopen Section'
                                                : 'Mark Complete'}
                                    </Text>
                                </Pressable>
                            </View>
                        )}

                        <Pressable
                            style={({ pressed }) => [menuStyles.cancelButton, pressed && menuStyles.menuItemPressed]}
                            onPress={() => setShowMenu(false)}
                            accessibilityRole="button"
                        >
                            <Text style={menuStyles.cancelText}>Cancel</Text>
                        </Pressable>
                    </Pressable>
                </Pressable>
            </Modal>
        </View>
    );
};

// Menu styles
const menuStyles = StyleSheet.create({
    menuButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.fill,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconButtonPressed: {
        backgroundColor: '#E2E8F0',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        justifyContent: 'flex-end',
    },
    sheet: {
        backgroundColor: Colors.background,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 16,
        paddingTop: 8,
    },
    grabber: {
        alignSelf: 'center',
        width: 36,
        height: 5,
        borderRadius: 3,
        backgroundColor: '#CBD5E1',
        marginBottom: 14,
    },
    sheetTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.textSecondary,
        textAlign: 'center',
        marginBottom: 12,
    },
    group: {
        backgroundColor: Colors.surface,
        borderRadius: 16,
        overflow: 'hidden',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 54,
        paddingHorizontal: 16,
        gap: 14,
    },
    menuItemPressed: {
        backgroundColor: Colors.fill,
    },
    menuItemDisabled: {
        opacity: 0.5,
    },
    menuItemText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#0F172A',
    },
    divider: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: Colors.border,
        marginLeft: 50,
    },
    cancelButton: {
        marginTop: 10,
        minHeight: 54,
        borderRadius: 16,
        backgroundColor: Colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelText: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.primary,
    },
});

export default Header;
