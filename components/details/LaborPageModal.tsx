import React, { useState, useEffect } from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { toast } from 'sonner-native';
import axios from 'axios';
import { domain } from '@/lib/domain';

interface LaborEntry {
    _id: string;
    type: string;
    category: string;
    count: number;
    perLaborCost: number;
    totalCost: number;
    sectionId?: string;
    miniSectionId?: string;
    user: {
        userId: string;
        fullName: string;
    };
    message?: string;
    addedAt: string;
}

interface LaborPageModalProps {
    visible: boolean;
    onClose: () => void;
    projectId: string;
    sectionId: string;
    miniSectionId?: string;
    clientId: string;
}

const LaborPageModal: React.FC<LaborPageModalProps> = ({
    visible,
    onClose,
    projectId,
    sectionId,
    miniSectionId,
    clientId,
}) => {
    const [laborEntries, setLaborEntries] = useState<LaborEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [statistics, setStatistics] = useState({
        totalEntries: 0,
        totalLaborers: 0,
        totalCost: 0,
        avgCostPerLaborer: 0,
        categoriesUsed: [] as string[],
    });

    const fetchLaborEntries = async (showLoading = true) => {
        if (showLoading) setLoading(true);
        try {
            const params = new URLSearchParams({
                projectId,
                clientId,
                sectionId,
            });

            if (miniSectionId) {
                params.append('miniSectionId', miniSectionId);
            }

            const response = await axios.get(`${domain}/api/labor?${params.toString()}`);
            const data = response.data;

            if (data.success) {
                setLaborEntries(data.laborEntries || []);
                setStatistics(data.statistics || {
                    totalEntries: 0,
                    totalLaborers: 0,
                    totalCost: 0,
                    avgCostPerLaborer: 0,
                    categoriesUsed: [],
                });
            } else {
                toast.error(data.message || 'Failed to fetch labor entries');
            }
        } catch (error: any) {
            console.error('Error fetching labor entries:', error);
            toast.error('Failed to fetch labor entries');
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchLaborEntries(false);
        setRefreshing(false);
    };

    const deleteLaborEntry = async (entryId: string) => {
        try {
            const params = new URLSearchParams({
                id: entryId,
                projectId,
                clientId,
                sectionId,
            });

            if (miniSectionId) {
                params.append('miniSectionId', miniSectionId);
            }

            const response = await axios.delete(`${domain}/api/labor?${params.toString()}`);
            const data = response.data;

            if (data.success) {
                toast.success('Labor entry deleted successfully');
                await fetchLaborEntries(false);
            } else {
                toast.error(data.message || 'Failed to delete labor entry');
            }
        } catch (error: any) {
            console.error('Error deleting labor entry:', error);
            toast.error('Failed to delete labor entry');
        }
    };

    useEffect(() => {
        if (visible) {
            fetchLaborEntries();
        }
    }, [visible, projectId, sectionId, miniSectionId]);

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'skilled': return 'construct';
            case 'unskilled': return 'people';
            case 'semi-skilled': return 'hammer';
            case 'supervisor': return 'person-circle';
            case 'contractor': return 'business';
            default: return 'person';
        }
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'skilled': return '#10B981';
            case 'unskilled': return '#6B7280';
            case 'semi-skilled': return '#F59E0B';
            case 'supervisor': return '#3B82F6';
            case 'contractor': return '#8B5CF6';
            default: return '#6B7280';
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Labor Entries</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color="#6B7280" />
                        </TouchableOpacity>
                    </View>

                    {/* Statistics */}
                    <View style={styles.statisticsContainer}>
                        <View style={styles.statCard}>
                            <Text style={styles.statValue}>{statistics.totalEntries}</Text>
                            <Text style={styles.statLabel}>Entries</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statValue}>{statistics.totalLaborers}</Text>
                            <Text style={styles.statLabel}>Laborers</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statValue}>
                                ₹{statistics.totalCost.toLocaleString('en-IN')}
                            </Text>
                            <Text style={styles.statLabel}>Total Cost</Text>
                        </View>
                    </View>

                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#F59E0B" />
                            <Text style={styles.loadingText}>Loading labor entries...</Text>
                        </View>
                    ) : (
                        <ScrollView
                            style={styles.scrollContent}
                            showsVerticalScrollIndicator={false}
                            refreshControl={
                                <RefreshControl
                                    refreshing={refreshing}
                                    onRefresh={handleRefresh}
                                    colors={['#F59E0B']}
                                />
                            }
                        >
                            {laborEntries.length === 0 ? (
                                <View style={styles.emptyContainer}>
                                    <Ionicons name="hammer" size={64} color="#CBD5E1" />
                                    <Text style={styles.emptyTitle}>No Labor Entries</Text>
                                    <Text style={styles.emptyDescription}>
                                        No labor entries found for this section.
                                    </Text>
                                </View>
                            ) : (
                                laborEntries.map((entry) => (
                                    <View key={entry._id} style={styles.entryCard}>
                                        <View style={styles.entryHeader}>
                                            <View style={styles.entryInfo}>
                                                <View style={[
                                                    styles.categoryIcon,
                                                    { backgroundColor: getCategoryColor(entry.category) }
                                                ]}>
                                                    <Ionicons
                                                        name={getCategoryIcon(entry.category) as any}
                                                        size={20}
                                                        color="#FFFFFF"
                                                    />
                                                </View>
                                                <View style={styles.entryDetails}>
                                                    <Text style={styles.entryType}>{entry.type}</Text>
                                                    <Text style={styles.entryCategory}>
                                                        {entry.category.charAt(0).toUpperCase() + entry.category.slice(1)}
                                                    </Text>
                                                </View>
                                            </View>
                                            <TouchableOpacity
                                                onPress={() => deleteLaborEntry(entry._id)}
                                                style={styles.deleteButton}
                                            >
                                                <Ionicons name="trash" size={20} color="#EF4444" />
                                            </TouchableOpacity>
                                        </View>

                                        <View style={styles.entryStats}>
                                            <View style={styles.statItem}>
                                                <Text style={styles.statItemLabel}>Count</Text>
                                                <Text style={styles.statItemValue}>{entry.count}</Text>
                                            </View>
                                            <View style={styles.statItem}>
                                                <Text style={styles.statItemLabel}>Per Laborer</Text>
                                                <Text style={styles.statItemValue}>
                                                    ₹{entry.perLaborCost.toLocaleString('en-IN')}
                                                </Text>
                                            </View>
                                            <View style={styles.statItem}>
                                                <Text style={styles.statItemLabel}>Total</Text>
                                                <Text style={[styles.statItemValue, styles.totalCost]}>
                                                    ₹{entry.totalCost.toLocaleString('en-IN')}
                                                </Text>
                                            </View>
                                        </View>

                                        {entry.message && (
                                            <View style={styles.messageContainer}>
                                                <Text style={styles.messageText}>{entry.message}</Text>
                                            </View>
                                        )}

                                        <View style={styles.entryFooter}>
                                            <Text style={styles.entryUser}>
                                                Added by {entry.user.fullName}
                                            </Text>
                                            <Text style={styles.entryDate}>
                                                {formatDate(entry.addedAt)}
                                            </Text>
                                        </View>
                                    </View>
                                ))
                            )}
                        </ScrollView>
                    )}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        width: '90%',
        maxHeight: '90%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 8,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1F2937',
    },
    closeButton: {
        padding: 4,
    },
    statisticsContainer: {
        flexDirection: 'row',
        padding: 20,
        gap: 12,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#F9FAFB',
        borderRadius: 8,
        padding: 12,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 18,
        fontWeight: '600',
        color: '#F59E0B',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#6B7280',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#6B7280',
    },
    scrollContent: {
        maxHeight: 400,
        paddingHorizontal: 20,
    },
    emptyContainer: {
        alignItems: 'center',
        padding: 40,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1F2937',
        marginTop: 16,
        marginBottom: 8,
    },
    emptyDescription: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
    },
    entryCard: {
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    entryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    entryInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    categoryIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    entryDetails: {
        flex: 1,
    },
    entryType: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
    },
    entryCategory: {
        fontSize: 14,
        color: '#6B7280',
    },
    deleteButton: {
        padding: 8,
    },
    entryStats: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    statItem: {
        alignItems: 'center',
    },
    statItemLabel: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 4,
    },
    statItemValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937',
    },
    totalCost: {
        color: '#F59E0B',
    },
    messageContainer: {
        backgroundColor: '#EFF6FF',
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
    },
    messageText: {
        fontSize: 14,
        color: '#1F2937',
        fontStyle: 'italic',
    },
    entryFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    entryUser: {
        fontSize: 12,
        color: '#6B7280',
    },
    entryDate: {
        fontSize: 12,
        color: '#6B7280',
    },
});

export default LaborPageModal;