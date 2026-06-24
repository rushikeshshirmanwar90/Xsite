import { Project } from '@/types/project';
import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Alert, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { domain } from '@/lib/domain';
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
    const [projectCompleted, setProjectCompleted] = useState(false);
    const [isUpdatingCompletion, setIsUpdatingCompletion] = useState(false);
    const [showOptionsMenu, setShowOptionsMenu] = useState(false);
    const [projectPinned, setProjectPinned] = useState(project.isPinned || false);
    const [isUpdatingPin, setIsUpdatingPin] = useState(false);

    // Debug: Log project license status
    useEffect(() => {
        console.log(`🎴 ProjectCard for "${project.name}":`, {
            isAccessible: project.isAccessible,
            licenseStatus: project.licenseStatus,
            blockReason: project.blockReason,
            userType: userType
        });
    }, [project.name, project.isAccessible, project.licenseStatus, userType]);

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

    // const statusColor = getStatusColor(project.status);

    const statusColor = project.isAccessible === false ? '#EF4444' : projectCompleted ? '#10B981' : '#3B82F6';
    const statusLabel = project.isAccessible === false ? 'Blocked' : projectCompleted ? 'Completed' : 'In Progress';
    const statusPillBg = project.isAccessible === false ? styles.statusPillBlocked : projectCompleted ? styles.statusPillCompleted : styles.statusPillOngoing;
    const progressColor = budgetProgress > 90 ? '#EF4444' : budgetProgress > 70 ? '#F59E0B' : '#10B981';
    const isOverBudget = totalExpenses > expectedBudget;

    const isStaffArray = Array.isArray(project.assignedStaff);
    const staffNames = isStaffArray
        ? project.assignedStaff.map((staff) =>
            typeof staff === 'string'
                ? staff
                : staff.fullName // adjust property as needed
        ).join(', ')
        : (project.assignedStaff as unknown as string);
    const staffCount = isStaffArray ? project.assignedStaff.length : (project.assignedStaff ? 1 : 0);
    const managerCaption = staffCount > 1 ? 'Team Members' : staffCount === 1 ? 'Project Manager' : 'Unassigned';

    return (
        <View style={styles.cardShadowWrap}>
            <View style={styles.card}>
                {/* Blue accent bar across the top of every card */}
                <LinearGradient
                    colors={['#3B82F6', '#4F46E5']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.topAccentBar}
                />

                {/* Corner badge: project status pill, anchored top-right; options button sits below it */}
                <View style={[styles.cornerBadge, statusPillBg]}>
                    <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                    <Text style={[styles.statusPillText, { color: statusColor }]} numberOfLines={1}>{statusLabel}</Text>
                </View>
                {userType === 'admin' && (
                    <TouchableOpacity
                        style={styles.cornerOptionsButton}
                        onPress={() => setShowOptionsMenu(true)}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="ellipsis-vertical" size={16} color="#94A3B8" />
                    </TouchableOpacity>
                )}

                <View style={styles.cardInner}>
                    <View style={styles.headerRow}>
                        <View style={styles.headerLeftCol}>
                            {/* Row 1: location icon + name/address */}
                            <View style={styles.row}>
                                <View style={styles.rowIconChip}>
                                    <Ionicons name="location" size={16} color="#3B82F6" />
                                </View>
                                <View style={styles.rowTextBlock}>
                                    <View style={styles.titleLine}>
                                        <Text style={styles.rowPrimaryText} numberOfLines={1}>{project.name}</Text>
                                        {projectPinned && userType === 'admin' && (
                                            <Ionicons name="bookmark" size={13} color="#F59E0B" style={styles.pinIcon} />
                                        )}
                                    </View>
                                    <View style={styles.addressLine}>
                                        <Ionicons name="location-sharp" size={10} color="#94A3B8" />
                                        <Text style={styles.rowSecondaryText} numberOfLines={1}>{project.address}</Text>
                                    </View>
                                </View>
                            </View>

                            {/* Row 2: manager/team icon + names/role */}
                            <View style={styles.row}>
                                <View style={[styles.rowIconChip, { backgroundColor: 'rgba(245,158,11,0.10)' }]}>
                                    <Ionicons name="person" size={16} color="#D97706" />
                                </View>
                                <View style={styles.rowTextBlock}>
                                    <Text style={styles.rowPrimaryText} numberOfLines={1}>{staffNames}</Text>
                                    <Text style={styles.rowSecondaryText} numberOfLines={1}>{managerCaption}</Text>
                                </View>
                            </View>
                        </View>

                    </View>

                    {/* Row 3 (optional): client */}
                    {project.clientName && (
                        <View style={styles.row}>
                            <View style={[styles.rowIconChip, { backgroundColor: 'rgba(99,102,241,0.10)' }]}>
                                <Ionicons name="briefcase" size={16} color="#6366F1" />
                            </View>
                            <View style={styles.rowTextBlock}>
                                <Text style={styles.rowPrimaryText} numberOfLines={1}>{project.clientName}</Text>
                                <Text style={styles.rowSecondaryText} numberOfLines={1}>Client</Text>
                            </View>
                        </View>
                    )}

                    {/* Budget / progress section */}
                    <View style={styles.progressPanel}>
                        <View style={styles.progressPanelLabelRow}>
                            <View style={styles.progressPanelIconChip}>
                                <Ionicons name="cash-outline" size={12} color="#10B981" />
                            </View>
                            <Text style={styles.progressPanelLabel}>Budget Overview</Text>
                        </View>

                        <View style={styles.progressAmountRow}>
                            <Text style={styles.progressAmount} numberOfLines={1}>
                                {formatCurrency(totalExpenses)}
                                <Text style={styles.progressAmountOf}> / {formatCurrency(expectedBudget)}</Text>
                            </Text>
                            <Text style={[styles.progressPercentText, { color: progressColor }]} numberOfLines={1}>
                                {Math.min(budgetProgress, 999).toFixed(1)}%
                            </Text>
                        </View>

                        <View style={styles.progressTrack}>
                            <View style={[styles.progressFill, {
                                width: `${Math.min(budgetProgress, 100)}%`,
                                backgroundColor: progressColor
                            }]} />
                        </View>

                        <Text style={styles.progressFooterText} numberOfLines={1}>
                            {isOverBudget ? 'Over by ' : 'Remaining: '}
                            <Text style={[styles.progressFooterValueInline, isOverBudget && styles.progressFooterValueDanger]}>
                                {isOverBudget
                                    ? formatCurrency(totalExpenses - expectedBudget)
                                    : formatCurrency(expectedBudget - totalExpenses)}
                            </Text>
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={[styles.ctaButton, project.isAccessible === false && styles.ctaButtonBlocked]}
                        onPress={() => {
                            if (project.isAccessible === false) {
                                Alert.alert(
                                    "Project Blocked",
                                    project.blockReason || "This project's client license has expired. Please contact the client to renew their subscription.",
                                    [{ text: "OK" }]
                                );
                            } else {
                                onViewDetails(project);
                            }
                        }}
                        activeOpacity={0.85}
                    >
                        {project.isAccessible === false ? (
                            <>
                                <Ionicons name="lock-closed" size={16} color="white" />
                                <Text style={styles.ctaButtonText}>Project Blocked</Text>
                            </>
                        ) : (
                            <>
                                <Text style={styles.ctaButtonText}>View Details</Text>
                                <Ionicons name="arrow-forward" size={16} color="white" />
                            </>
                        )}
                    </TouchableOpacity>

                    {/* Show block reason below button if project is blocked */}
                    {project.isAccessible === false && project.blockReason && (
                        <View style={styles.blockReasonContainer}>
                            <Ionicons name="information-circle" size={16} color="#DC2626" />
                            <Text style={styles.blockReasonText}>{project.blockReason}</Text>
                        </View>
                    )}
                </View>
            </View>

            {/* Options Menu Modal - Only for admin users */}
            {userType === 'admin' && (
                <Modal
                    visible={showOptionsMenu}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setShowOptionsMenu(false)}
                >
                    <TouchableOpacity
                        style={styles.optionsOverlay}
                        activeOpacity={1}
                        onPress={() => setShowOptionsMenu(false)}
                    >
                        <View style={styles.optionsMenu}>
                            <TouchableOpacity
                                style={[
                                    styles.optionItem,
                                    isUpdatingPin && styles.optionItemDisabled
                                ]}
                                onPress={toggleProjectPin}
                                disabled={isUpdatingPin}
                                activeOpacity={0.7}
                            >
                                <Ionicons 
                                    name={projectPinned ? "bookmark" : "bookmark-outline"} 
                                    size={20} 
                                    color={projectPinned ? "#F59E0B" : "#6B7280"} 
                                />
                                <Text style={[
                                    styles.optionText,
                                    projectPinned && styles.optionTextPinned,
                                    isUpdatingPin && styles.optionTextDisabled
                                ]}>
                                    {isUpdatingPin ? 'Updating...' : (projectPinned ? 'Unpin Project' : 'Pin Project')}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.optionItem,
                                    isUpdatingCompletion && styles.optionItemDisabled
                                ]}
                                onPress={toggleProjectCompletion}
                                disabled={isUpdatingCompletion}
                                activeOpacity={0.7}
                            >
                                <Ionicons
                                    name={projectCompleted ? "checkmark-circle" : "ellipse-outline"}
                                    size={20}
                                    color={projectCompleted ? "#10B981" : "#6B7280"}
                                />
                                <Text style={[
                                    styles.optionText,
                                    projectCompleted && styles.optionTextCompleted,
                                    isUpdatingCompletion && styles.optionTextDisabled
                                ]}>
                                    {isUpdatingCompletion ? 'Updating...' : (projectCompleted ? 'Mark as Incomplete' : 'Mark as Complete')}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </Modal>
            )}
        </View>
    );
};
export default ProjectCard;

const styles = StyleSheet.create({
    cardShadowWrap: {
        borderRadius: 24,
        backgroundColor: '#FFFFFF',
        marginBottom: 4,
        shadowColor: '#1E293B',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.12,
        shadowRadius: 22,
        elevation: 8,
    },
    card: {
        borderRadius: 24,
        overflow: 'hidden',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#EEF2F8',
    },
    topAccentBar: {
        height: 4,
        width: '100%',
    },
    cardInner: {
        padding: 18,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 12,
    },
    rowIconChip: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: 'rgba(59,130,246,0.10)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    rowTextBlock: {
        flex: 1,
    },
    titleLine: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    rowPrimaryText: {
        fontSize: 14.5,
        fontWeight: '700',
        color: '#0F172A',
        letterSpacing: -0.2,
        flexShrink: 1,
    },
    rowSecondaryText: {
        fontSize: 12,
        color: '#94A3B8',
        fontWeight: '500',
        marginTop: 1,
    },
    pinIcon: {
        marginLeft: 1,
    },
    addressLine: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        marginTop: 1,
    },
    cornerBadge: {
        position: 'absolute',
        top: 14,
        right: 14,
        zIndex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#3B82F6',
        borderRadius: 999,
        paddingHorizontal: 9,
        paddingVertical: 4,
        gap: 4,
    },
    cornerOptionsButton: {
        position: 'absolute',
        top: 44,
        right: 18,
        zIndex: 1,
        width: 24,
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statusPillOngoing: {
        backgroundColor: 'rgba(59,130,246,0.10)',
    },
    statusPillCompleted: {
        backgroundColor: 'rgba(16,185,129,0.10)',
    },
    statusPillBlocked: {
        backgroundColor: 'rgba(239,68,68,0.10)',
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    statusPillText: {
        fontSize: 11,
        fontWeight: '700',
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 40,
    },
    headerLeftCol: {
        flex: 1,
    },
    progressPanel: {
        marginBottom: 16,
    },
    progressPanelLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 10,
    },
    progressPanelIconChip: {
        width: 20,
        height: 20,
        borderRadius: 7,
        backgroundColor: 'rgba(16,185,129,0.10)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    progressPanelLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#64748B',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    progressAmountRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        marginBottom: 8,
    },
    progressAmount: {
        fontSize: 15,
        fontWeight: '800',
        color: '#0F172A',
        letterSpacing: -0.3,
        flexShrink: 1,
    },
    progressAmountOf: {
        fontSize: 12,
        fontWeight: '600',
        color: '#94A3B8',
    },
    progressPercentText: {
        fontSize: 13,
        fontWeight: '800',
    },
    progressTrack: {
        height: 8,
        backgroundColor: '#E2E8F0',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 8,
    },
    progressFill: {
        height: '100%',
        borderRadius: 4,
    },
    progressFooterText: {
        fontSize: 11.5,
        color: '#94A3B8',
        fontWeight: '500',
    },
    progressFooterValueInline: {
        fontWeight: '700',
        color: '#0F172A',
    },
    progressFooterValueDanger: {
        color: '#EF4444',
    },
    ctaButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#3B82F6',
        paddingVertical: 13,
        borderRadius: 14,
        gap: 8,
    },
    ctaButtonBlocked: {
        backgroundColor: '#EF4444',
    },
    ctaButtonText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 14,
        letterSpacing: 0.2,
    },
    // Block reason styles
    blockReasonContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginTop: 12,
        padding: 12,
        backgroundColor: '#FEF2F2',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FEE2E2',
        gap: 8,
    },
    blockReasonText: {
        flex: 1,
        fontSize: 12,
        color: '#DC2626',
        lineHeight: 18,
        fontWeight: '500',
    },
    // Options menu styles
    optionsOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    optionsMenu: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        paddingVertical: 8,
        minWidth: 220,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 12,
    },
    optionItemDisabled: {
        opacity: 0.6,
    },
    optionText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#1F2937',
    },
    optionTextCompleted: {
        color: '#10B981',
    },
    optionTextPinned: {
        color: '#F59E0B',
    },
    optionTextFeatured: {
        color: '#3B82F6',
    },
    optionTextDisabled: {
        color: '#9CA3AF',
    },
});