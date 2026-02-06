import { Project } from '@/types/project';
import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Alert, Modal } from 'react-native';
import { domain } from '@/lib/domain';
import axios from 'axios';
import { toast } from 'sonner-native';

interface ProjectCardProps {
    project: Project;
    onViewDetails: (project: Project) => void;
    userType?: string; // Add userType prop to determine if user is admin or staff
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onViewDetails, userType = 'admin' }) => {
    const [projectCompleted, setProjectCompleted] = useState(false);
    const [isUpdatingCompletion, setIsUpdatingCompletion] = useState(false);
    const [showOptionsMenu, setShowOptionsMenu] = useState(false);

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
            const response = await axios.get(`${domain}/api/completion?updateType=project&id=${project._id}`);
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
            
            const response = await axios.patch(`${domain}/api/completion`, {
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



    // const statusColor = getStatusColor(project.status);

    return (
        <View style={[styles.card && styles.overdueCard]}>
            <View style={styles.cardHeader}>
                <View style={styles.cardHeaderTop}>
                    <View style={styles.badgeRow}>
                    </View>
                </View>
                <View style={styles.projectTitleContainer}>
                    <View style={styles.projectTitleRow}>
                        {projectCompleted && (
                            <View style={styles.completedIconContainer}>
                                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                            </View>
                        )}
                        <Text style={styles.projectTitle}>{project.name}</Text>
                    </View>
                    <View style={styles.headerRight}>
                        {project.clientName && (
                            <View style={styles.clientBadge}>
                                <Ionicons name="business-outline" size={12} color="#6B7280" />
                                <Text style={styles.clientName}>{project.clientName}</Text>
                            </View>
                        )}
                        
                        {/* Three-dot menu - Only show for admin users */}
                        {userType === 'admin' && (
                            <TouchableOpacity
                                style={styles.optionsButton}
                                onPress={() => setShowOptionsMenu(true)}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="ellipsis-vertical" size={20} color="#6B7280" />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>

            <View style={styles.cardBody}>
                <View style={styles.infoRow}>
                    <View style={[styles.iconContainer, { backgroundColor: '#E0F2FE' }]}>
                        <Ionicons name="location" size={16} color={'#0EA5E9'} />
                    </View>
                    <Text style={styles.infoText} numberOfLines={2}>{project.address}</Text>
                </View>

                <View style={styles.infoRow}>
                    <View style={[styles.iconContainer, { backgroundColor: '#FEF3C7' }]}>
                        <Ionicons name="person" size={16} color="#D97706" />
                    </View>
                    <Text style={styles.infoTextBold}>
                        {Array.isArray(project.assignedStaff)
                            ? project.assignedStaff.map((staff) =>
                                typeof staff === 'string'
                                    ? staff
                                    : staff.fullName // adjust property as needed
                            ).join(', ')
                            : project.assignedStaff}
                    </Text>
                </View>

                <View style={styles.budgetRow}>
                    <View style={[styles.iconContainer, { backgroundColor: '#ECFDF5' }]}>
                        <Ionicons name="card" size={16} color="#10B981" />
                    </View>
                    <View style={styles.budgetInfo}>
                        <View style={styles.budgetHeader}>
                            <Text style={styles.budgetLabel}>Budget Overview</Text>
                            <Text style={[styles.budgetPercentage, {
                                color: budgetProgress > 90 ? '#EF4444' : budgetProgress > 70 ? '#F59E0B' : '#10B981'
                            }]}>
                                {budgetProgress.toFixed(1)}%
                            </Text>
                        </View>
                        <Text style={styles.budgetText}>
                            {formatCurrency(totalExpenses)} / {formatCurrency(expectedBudget)}
                        </Text>
                        <View style={styles.budgetProgressBar}>
                            <View style={[styles.budgetProgressFill, {
                                width: `${Math.min(budgetProgress, 100)}%`,
                                backgroundColor: budgetProgress > 90 ? '#EF4444' : budgetProgress > 70 ? '#F59E0B' : '#10B981'
                            }]} />
                        </View>
                        <Text style={styles.budgetSubtext}>
                            {totalExpenses > expectedBudget 
                                ? `Over budget by ${formatCurrency(totalExpenses - expectedBudget)}`
                                : `Remaining: ${formatCurrency(expectedBudget - totalExpenses)}`
                            }
                        </Text>
                    </View>
                </View>

                <TouchableOpacity
                    style={[styles.viewButton, { backgroundColor: '#0EA5E9' }]}
                    onPress={() => onViewDetails(project)}
                    activeOpacity={0.8}
                >
                    <Text style={styles.viewButtonText}>View Details</Text>
                    <Ionicons name="arrow-forward" size={16} color="white" />
                </TouchableOpacity>
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
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    fixedHeader: {
        backgroundColor: '#FFFFFF',
        paddingLeft: 24,
        paddingRight: 16,
        paddingTop: 16,
        paddingBottom: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 4,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatarContainer: {
        width: 48,
        height: 48,
        backgroundColor: '#0EA5E9',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        shadowColor: '#0EA5E9',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    avatarText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    userDetails: {
        flex: 1,
    },
    userName: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 2,
        letterSpacing: -0.3,
    },
    userSubtitle: {
        fontSize: 13,
        color: '#6B7280',
        fontWeight: '500',
        letterSpacing: 0.2,
        marginBottom: 2,
    },
    dateText: {
        fontSize: 11,
        color: '#9CA3AF',
        fontWeight: '400',
        letterSpacing: 0.1,
    },
    notificationButton: {
        width: 44,
        height: 44,
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        position: 'relative',
    },
    notificationDot: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 8,
        height: 8,
        backgroundColor: '#EF4444',
        borderRadius: 4,
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    scrollableContent: {
        flex: 1,
    },
    scrollableContentContainer: {
        paddingBottom: 24,
    },
    statsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 24,
        paddingTop: 24,
        gap: 16,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        position: 'relative',
    },
    statIconContainer: {
        position: 'absolute',
        top: 16,
        right: 16,
        width: 36,
        height: 36,
        backgroundColor: '#E0F2FE',
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statNumber: {
        fontSize: 28,
        fontWeight: '800',
        color: '#1F2937',
        marginBottom: 4,
        letterSpacing: -1,
    },
    statLabel: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        textAlign: 'center',
    },
    additionalStatsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 24,
        paddingTop: 16,
        gap: 12,
    },
    additionalStatCard: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    additionalStatNumber: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 2,
    },
    additionalStatLabel: {
        fontSize: 10,
        color: '#6B7280',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        textAlign: 'center',
    },
    sectionHeader: {
        paddingHorizontal: 24,
        paddingTop: 32,
        paddingBottom: 20,
    },
    sectionTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    sectionDivider: {
        width: 40,
        height: 3,
        backgroundColor: '#0EA5E9',
        borderRadius: 2,
    },
    projectsContainer: {
        paddingHorizontal: 24,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 5,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        overflow: 'hidden',
    },
    overdueCard: {
        borderColor: '#FEE2E2',
        borderWidth: 2,
    },
    cardHeader: {
        padding: 20,
        backgroundColor: '#FAFBFC',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    cardHeaderTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    badgeRow: {
        flexDirection: 'row',
        gap: 8,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    priorityBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    priorityText: {
        fontSize: 9,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    progressBadge: {
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    progressText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#374151',
    },
    projectTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
    },
    projectTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 8,
    },
    completedIconContainer: {
        flexShrink: 0,
    },
    projectTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
        letterSpacing: -0.3,
        flex: 1,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    clientBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        gap: 4,
    },
    clientName: {
        fontSize: 11,
        fontWeight: '600',
        color: '#6B7280',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    overdueWarning: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        padding: 8,
        backgroundColor: '#FEE2E2',
        borderRadius: 8,
        gap: 6,
    },
    overdueText: {
        fontSize: 12,
        color: '#DC2626',
        fontWeight: '600',
    },
    cardBody: {
        padding: 20,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    iconContainer: {
        width: 32,
        height: 32,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    infoText: {
        fontSize: 14,
        color: '#111',
        flex: 1,
        lineHeight: 20,
        fontWeight: '600',
    },
    infoTextBold: {
        fontSize: 14,
        color: '#374151',
        fontWeight: '600',
        flex: 1,
    },
    budgetRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 16,
        paddingTop: 4,
    },
    budgetInfo: {
        flex: 1,
    },
    budgetHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    budgetLabel: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    budgetPercentage: {
        fontSize: 13,
        fontWeight: '700',
    },
    budgetText: {
        fontSize: 15,
        color: '#1F2937',
        fontWeight: '700',
        marginBottom: 8,
    },
    budgetProgressBar: {
        height: 6,
        backgroundColor: '#F1F5F9',
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: 6,
    },
    budgetProgressFill: {
        height: '100%',
        borderRadius: 3,
    },
    budgetSubtext: {
        fontSize: 11,
        color: '#6B7280',
        fontWeight: '500',
    },

    viewButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
    },
    viewButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 14,
        letterSpacing: 0.3,
    },
    footer: {
        alignItems: 'center',
        paddingVertical: 40,
        marginTop: 20,
    },
    footerBrand: {
        alignItems: 'center',
    },
    brandContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: '#1F2937',
        borderRadius: 16,
        shadowColor: '#1F2937',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 8,
    },
    brandIconContainer: {
        width: 32,
        height: 32,
        backgroundColor: '#0EA5E9',
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    brandTextContainer: {
        alignItems: 'flex-start',
    },
    footerText: {
        fontSize: 10,
        fontWeight: '500',
        color: '#9CA3AF',
        marginBottom: 2,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    exponentorText: {
        fontSize: 18,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: -0.5,
    },
    footerSubtext: {
        fontSize: 13,
        color: '#6B7280',
        textAlign: 'center',
        fontWeight: '500',
        letterSpacing: 0.2,
        marginBottom: 8,
    },
    footerVersion: {
        fontSize: 11,
        color: '#9CA3AF',
        textAlign: 'center',
        fontWeight: '400',
        letterSpacing: 0.3,
    },
    // Options menu styles
    optionsButton: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    optionsOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    optionsMenu: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        paddingVertical: 8,
        minWidth: 200,
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
    optionTextDisabled: {
        color: '#9CA3AF',
    },
});