import { Colors } from '@/constants/theme';
import { Project } from '@/types/project';
import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, Pressable, View, Alert, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import apiClient from '@/utils/axiosConfig';
import { toast } from 'sonner-native';

interface ProjectCardProps {
    project: Project;
    onViewDetails: (project: Project) => void;
    userType?: string; // Add userType prop to determine if user is admin or staff
    onPinToggle?: (projectId: string, isPinned: boolean) => void; // Add pin toggle callback
    onFeaturedToggle?: (projectId: string, isFeatured: boolean) => void; // Add featured toggle callback
    featured?: boolean; // Initial featured state, toggleable from the options menu
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onViewDetails, userType = 'admin', onPinToggle, onFeaturedToggle, featured = false }) => {
    // Seed from the list's already-loaded status so the pill doesn't flash "In progress" first
    const [projectCompleted, setProjectCompleted] = useState(Boolean(project.isCompleted));
    const [isUpdatingCompletion, setIsUpdatingCompletion] = useState(false);
    const [showOptionsMenu, setShowOptionsMenu] = useState(false);
    const [projectPinned, setProjectPinned] = useState(project.isPinned || false);
    const [isUpdatingPin, setIsUpdatingPin] = useState(false);
    const insets = useSafeAreaInsets();

    const formatCurrency = (amount: number): string => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    // Use the spent attribute from project for total expenses
    const totalExpenses = project?.spent || 0;
    const expectedBudget = project?.budget || 0;
    const budgetProgress = expectedBudget > 0 ? (totalExpenses / expectedBudget) * 100 : 0;

    // Helper function to validate MongoDB ObjectId
    const isValidMongoId = (id: string) => {
        return /^[0-9a-fA-F]{24}$/.test(id);
    };
    
    // Load project completion status on mount
    const loadProjectCompletionStatus = async () => {
        if (!project._id || !isValidMongoId(project._id)) {
            return;
        }
        
        try {
            const response = await apiClient.get(`/api/completion?updateType=project&id=${project._id}`);
            const responseData = response.data as any;
            if (responseData.success && responseData.data) {
                const isCompleted = Boolean(responseData.data.isCompleted);
                setProjectCompleted(isCompleted);
            }
        } catch (error) {
            console.warn('Could not load project completion status:', error);
        }
    };

    useEffect(() => {
        loadProjectCompletionStatus();
    }, [project._id]);

    // Function to toggle project completion
    const toggleProjectCompletion = async () => {
        if (isUpdatingCompletion) return;
        
        setIsUpdatingCompletion(true);
        try {
            console.log('🎯 Toggling project completion...');
            console.log('Project ID:', project._id);
            console.log('Current status:', projectCompleted);
            
            const response = await apiClient.patch(`/api/completion`, {
                updateType: 'project',
                id: project._id,
                isCompleted: !projectCompleted
            });
            
            const responseData = response.data as any;
            if (responseData.success) {
                const newCompletionStatus = responseData.data?.isCompleted;
                if (typeof newCompletionStatus === 'boolean') {
                    setProjectCompleted(newCompletionStatus);
                    toast.success(responseData.message || `Project ${newCompletionStatus ? 'completed' : 'reopened'} successfully`);
                } else {
                    // Fallback to toggle logic if API doesn't return the new status
                    setProjectCompleted(!projectCompleted);
                    toast.success(responseData.message || `Project completion updated successfully`);
                }
            } else {
                console.error('❌ Failed to update project completion:', responseData.message);
                toast.error(responseData.message || 'Failed to update project completion');
            }
        } catch (error: any) {
            console.error('❌ Error updating project completion:', error);
            const errorMessage = error?.response?.data?.message || error?.message || 'Unknown error';
            
            if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
                toast.error('Request timeout. Please check your connection and try again.');
            } else if (error?.response?.status === 404) {
                toast.error('Completion feature not available for this project.');
            } else {
                toast.error(`Failed to update project completion: ${errorMessage}`);
            }
        } finally {
            setIsUpdatingCompletion(false);
            setShowOptionsMenu(false);
        }
    };

    // Function to toggle project pin status
    const toggleProjectPin = async () => {
        if (isUpdatingPin || !project._id) return;
        
        setIsUpdatingPin(true);
        try {
            console.log('📌 Toggling project pin status...');
            console.log('Project ID:', project._id);
            console.log('Current pin status:', projectPinned);
            
            const newPinStatus = !projectPinned;
            setProjectPinned(newPinStatus);
            
            // Call the parent callback to update the project list
            if (onPinToggle) {
                onPinToggle(project._id, newPinStatus);
            }
            
            toast.success(`Project ${newPinStatus ? 'pinned' : 'unpinned'} successfully`);
            
        } catch (error: any) {
            console.error('❌ Error updating project pin status:', error);
            // Revert the pin status on error
            setProjectPinned(projectPinned);
            toast.error('Failed to update project pin status');
        } finally {
            setIsUpdatingPin(false);
            setShowOptionsMenu(false);
        }
    };

    const isBlocked = project.isAccessible === false;
    const statusLabel = isBlocked ? 'Blocked' : projectCompleted ? 'Completed' : 'In progress';
    const statusTone = isBlocked
        ? { bg: Colors.errorLight, fg: Colors.errorText }
        : projectCompleted
            ? { bg: Colors.successLight, fg: Colors.successText }
            : { bg: Colors.primaryLight, fg: Colors.primaryDark };

    // Bar fill can use the bright tone; the percentage text needs the darker one for contrast
    const progressTone = budgetProgress > 90
        ? { bar: Colors.error, text: Colors.errorText }
        : budgetProgress > 70
            ? { bar: Colors.warning, text: Colors.warningText }
            : { bar: '#10B981', text: Colors.successText };
    const isOverBudget = totalExpenses > expectedBudget;
    const percentLabel = `${Math.min(budgetProgress, 999).toFixed(1)}%`;

    const isStaffArray = Array.isArray(project.assignedStaff);
    const staffNames = isStaffArray
        ? project.assignedStaff.map((staff) =>
            typeof staff === 'string'
                ? staff
                : staff.fullName // adjust property as needed
        ).join(', ')
        : (project.assignedStaff as unknown as string);
    const staffCount = isStaffArray ? project.assignedStaff.length : (project.assignedStaff ? 1 : 0);
    const managerCaption = staffCount > 1 ? 'Team' : staffCount === 1 ? 'Project manager' : '';

    const handleOpen = () => {
        if (isBlocked) {
            Alert.alert(
                "Project Blocked",
                project.blockReason || "This project's client license has expired. Please contact the client to renew their subscription.",
                [{ text: "OK" }]
            );
        } else {
            onViewDetails(project);
        }
    };

    return (
        <View style={styles.cardShadowWrap}>
            <Pressable
                style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
                onPress={handleOpen}
                accessibilityRole="button"
                accessibilityLabel={`${project.name}, ${statusLabel}, ${percentLabel} of budget spent`}
                accessibilityHint={isBlocked ? 'Shows why this project is blocked' : 'Opens the project'}
            >
                {/* Header: name + address on the left, status and options on the right */}
                <View style={styles.headerRow}>
                    <View style={styles.titleBlock}>
                        <View style={styles.titleLine}>
                            <Text style={styles.title} numberOfLines={2}>{project.name}</Text>
                            {projectPinned && userType === 'admin' && (
                                <Ionicons name="bookmark" size={14} color={Colors.primary} style={styles.pinIcon} accessibilityLabel="Pinned" />
                            )}
                        </View>
                        {!!project.address && (
                            <View style={styles.metaLine}>
                                <Ionicons name="location-outline" size={14} color={Colors.textSecondary} />
                                <Text style={styles.metaText} numberOfLines={1}>{project.address}</Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.headerRight}>
                        <View style={[styles.statusPill, { backgroundColor: statusTone.bg }]}>
                            <View style={[styles.statusDot, { backgroundColor: statusTone.fg }]} />
                            <Text style={[styles.statusPillText, { color: statusTone.fg }]} numberOfLines={1}>{statusLabel}</Text>
                        </View>
                        {/* Reserves room for the options button, which sits outside the card's
                            Pressable so the two buttons never nest */}
                        {userType === 'admin' && <View style={styles.optionsButtonSpacer} />}
                    </View>
                </View>

                {/* People */}
                <View style={styles.peopleBlock}>
                    <View style={styles.metaLine}>
                        <Ionicons name={staffCount > 1 ? 'people-outline' : 'person-outline'} size={14} color={Colors.textSecondary} />
                        <Text style={styles.peopleText} numberOfLines={1}>
                            {staffNames || 'Unassigned'}
                            {!!managerCaption && <Text style={styles.peopleCaption}>{'  ·  '}{managerCaption}</Text>}
                        </Text>
                    </View>
                    {!!project.clientName && (
                        <View style={styles.metaLine}>
                            <Ionicons name="briefcase-outline" size={14} color={Colors.textSecondary} />
                            <Text style={styles.peopleText} numberOfLines={1}>
                                {project.clientName}
                                <Text style={styles.peopleCaption}>{'  ·  '}Client</Text>
                            </Text>
                        </View>
                    )}
                </View>

                {/* Budget */}
                <View style={styles.budget}>
                    <View style={styles.budgetTopRow}>
                        <Text style={styles.budgetSpent} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                            {formatCurrency(totalExpenses)}
                            <Text style={styles.budgetSpentLabel}> spent</Text>
                        </Text>
                        <Text style={[styles.budgetPercent, { color: progressTone.text }]} numberOfLines={1}>
                            {percentLabel}
                        </Text>
                    </View>

                    <View style={styles.progressTrack}>
                        <View style={[styles.progressFill, {
                            width: `${Math.min(Math.max(budgetProgress, budgetProgress > 0 ? 1.5 : 0), 100)}%`,
                            backgroundColor: progressTone.bar,
                        }]} />
                    </View>

                    <View style={styles.budgetBottomRow}>
                        <Text style={styles.budgetCaption} numberOfLines={1}>
                            of {formatCurrency(expectedBudget)}
                        </Text>
                        <Text style={[styles.budgetCaption, styles.budgetRemaining, isOverBudget && { color: Colors.errorText }]} numberOfLines={1}>
                            {isOverBudget
                                ? `${formatCurrency(totalExpenses - expectedBudget)} over`
                                : `${formatCurrency(expectedBudget - totalExpenses)} left`}
                        </Text>
                    </View>
                </View>

                {/* Footer action */}
                <View style={styles.footer}>
                    {isBlocked ? (
                        <>
                            <Ionicons name="lock-closed" size={16} color={Colors.errorText} />
                            <Text style={[styles.footerText, { color: Colors.errorText }]}>Project blocked</Text>
                        </>
                    ) : (
                        <>
                            <Text style={styles.footerText}>View details</Text>
                            <Ionicons name="arrow-forward" size={17} color={Colors.primary} />
                        </>
                    )}
                </View>

                {/* Show block reason below the footer if project is blocked */}
                {isBlocked && !!project.blockReason && (
                    <View style={styles.blockReasonContainer}>
                        <Ionicons name="information-circle" size={16} color={Colors.errorText} />
                        <Text style={styles.blockReasonText}>{project.blockReason}</Text>
                    </View>
                )}
            </Pressable>

            {userType === 'admin' && (
                <Pressable
                    style={({ pressed }) => [styles.optionsButton, pressed && styles.optionsButtonPressed]}
                    onPress={() => setShowOptionsMenu(true)}
                    hitSlop={6}
                    accessibilityRole="button"
                    accessibilityLabel={`More actions for ${project.name}`}
                >
                    <Ionicons name="ellipsis-horizontal" size={18} color={Colors.textSecondary} />
                </Pressable>
            )}

            {/* Options sheet - Only for admin users */}
            {userType === 'admin' && (
                <Modal
                    visible={showOptionsMenu}
                    transparent={true}
                    animationType="fade"
                    statusBarTranslucent
                    onRequestClose={() => setShowOptionsMenu(false)}
                >
                    <Pressable
                        style={styles.optionsOverlay}
                        onPress={() => setShowOptionsMenu(false)}
                        accessibilityLabel="Close actions"
                    >
                        <Pressable style={[styles.optionsSheet, { paddingBottom: Math.max(insets.bottom, 12) + 8 }]}>
                            <View style={styles.sheetGrabber} />
                            <Text style={styles.sheetTitle} numberOfLines={1}>{project.name}</Text>

                            <View style={styles.sheetGroup}>
                                <Pressable
                                    style={({ pressed }) => [styles.optionItem, pressed && styles.optionItemPressed, isUpdatingPin && styles.optionItemDisabled]}
                                    onPress={toggleProjectPin}
                                    disabled={isUpdatingPin}
                                    accessibilityRole="button"
                                >
                                    <Ionicons
                                        name={projectPinned ? "bookmark" : "bookmark-outline"}
                                        size={20}
                                        color={Colors.primary}
                                    />
                                    <Text style={styles.optionText}>
                                        {isUpdatingPin ? 'Updating...' : (projectPinned ? 'Unpin Project' : 'Pin Project')}
                                    </Text>
                                </Pressable>
                                <View style={styles.optionDivider} />
                                <Pressable
                                    style={({ pressed }) => [styles.optionItem, pressed && styles.optionItemPressed, isUpdatingCompletion && styles.optionItemDisabled]}
                                    onPress={toggleProjectCompletion}
                                    disabled={isUpdatingCompletion}
                                    accessibilityRole="button"
                                >
                                    <Ionicons
                                        name={projectCompleted ? "arrow-undo-outline" : "checkmark-circle-outline"}
                                        size={20}
                                        color={projectCompleted ? Colors.textSecondary : Colors.successText}
                                    />
                                    <Text style={styles.optionText}>
                                        {isUpdatingCompletion ? 'Updating...' : (projectCompleted ? 'Mark as Incomplete' : 'Mark as Complete')}
                                    </Text>
                                </Pressable>
                            </View>

                            <Pressable
                                style={({ pressed }) => [styles.cancelButton, pressed && styles.optionItemPressed]}
                                onPress={() => setShowOptionsMenu(false)}
                                accessibilityRole="button"
                            >
                                <Text style={styles.cancelText}>Cancel</Text>
                            </Pressable>
                        </Pressable>
                    </Pressable>
                </Modal>
            )}
        </View>
    );
};
export default ProjectCard;

const styles = StyleSheet.create({
    cardShadowWrap: {
        borderRadius: 20,
        backgroundColor: Colors.surface,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.06,
        shadowRadius: 16,
        elevation: 3,
    },
    card: {
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: '#E8EDF4',
        paddingTop: 18,
        paddingHorizontal: 18,
    },
    cardPressed: {
        backgroundColor: '#FAFBFD',
    },

    // Header
    headerRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    titleBlock: {
        flex: 1,
        gap: 4,
    },
    titleLine: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    title: {
        fontSize: 18,
        lineHeight: 23,
        fontWeight: '700',
        color: '#0F172A',
        letterSpacing: -0.35,
        flexShrink: 1,
    },
    pinIcon: {
        marginTop: 1,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        marginRight: -10,
        marginTop: -2,
    },
    statusPill: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 5,
        gap: 6,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    statusPillText: {
        fontSize: 12,
        fontWeight: '600',
    },
    optionsButtonSpacer: {
        width: 36,
        height: 36,
    },
    optionsButton: {
        // Overlays optionsButtonSpacer: card border (1) + paddingTop (18) + headerRight offset (-2)
        position: 'absolute',
        top: 17,
        right: 9,
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    optionsButtonPressed: {
        backgroundColor: Colors.fill,
    },

    // Meta rows (address, people, client)
    metaLine: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    metaText: {
        flexShrink: 1,
        fontSize: 13.5,
        color: Colors.textSecondary,
        fontWeight: '500',
    },
    peopleBlock: {
        marginTop: 14,
        gap: 6,
    },
    peopleText: {
        flexShrink: 1,
        fontSize: 14,
        color: '#334155',
        fontWeight: '600',
    },
    peopleCaption: {
        color: Colors.textSecondary,
        fontWeight: '500',
    },

    // Budget
    budget: {
        marginTop: 18,
        paddingTop: 16,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: Colors.border,
    },
    budgetTopRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: 12,
        marginBottom: 10,
    },
    budgetSpent: {
        flexShrink: 1,
        fontSize: 22,
        fontWeight: '700',
        color: '#0F172A',
        letterSpacing: -0.5,
        fontVariant: ['tabular-nums'],
    },
    budgetSpentLabel: {
        fontSize: 13.5,
        fontWeight: '500',
        letterSpacing: 0,
        color: Colors.textSecondary,
    },
    budgetPercent: {
        fontSize: 14,
        fontWeight: '700',
        fontVariant: ['tabular-nums'],
    },
    progressTrack: {
        height: 6,
        backgroundColor: Colors.fill,
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 3,
    },
    budgetBottomRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
        marginTop: 8,
    },
    budgetCaption: {
        flexShrink: 1,
        fontSize: 12.5,
        color: Colors.textSecondary,
        fontWeight: '500',
        fontVariant: ['tabular-nums'],
    },
    budgetRemaining: {
        color: '#334155',
        fontWeight: '600',
    },

    // Footer
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        minHeight: 52,
        marginTop: 16,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: Colors.border,
    },
    footerText: {
        flex: 1,
        fontSize: 15,
        fontWeight: '600',
        color: Colors.primary,
    },

    // Block reason styles
    blockReasonContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 16,
        padding: 12,
        backgroundColor: Colors.errorLight,
        borderRadius: 12,
        gap: 8,
    },
    blockReasonText: {
        flex: 1,
        fontSize: 13,
        color: Colors.errorText,
        lineHeight: 18,
        fontWeight: '500',
    },

    // Options sheet
    optionsOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        justifyContent: 'flex-end',
    },
    optionsSheet: {
        backgroundColor: Colors.background,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 16,
        paddingTop: 8,
    },
    sheetGrabber: {
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
    sheetGroup: {
        backgroundColor: Colors.surface,
        borderRadius: 16,
        overflow: 'hidden',
    },
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 54,
        paddingHorizontal: 16,
        gap: 14,
    },
    optionItemPressed: {
        backgroundColor: Colors.fill,
    },
    optionItemDisabled: {
        opacity: 0.5,
    },
    optionDivider: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: Colors.border,
        marginLeft: 50,
    },
    optionText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#0F172A',
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
