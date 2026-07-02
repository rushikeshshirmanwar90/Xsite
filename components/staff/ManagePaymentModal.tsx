// components/staff/ManagePaymentModal.tsx
import { Staff } from '@/types/staff';
import { updateStaffProjectPayment } from '@/functions/staff';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { toast } from 'sonner-native';

interface ManagePaymentModalProps {
    visible: boolean;
    onClose: () => void;
    staff: Staff | null;
    // Called with the staffId + the updated project assignment after a successful save,
    // so the caller can patch its local state without a full refetch.
    onPaymentUpdated: (staffId: string, projectId: string, monthlyPayment: number) => void;
}

const ManagePaymentModal: React.FC<ManagePaymentModalProps> = ({ visible, onClose, staff, onPaymentUpdated }) => {
    const [amounts, setAmounts] = useState<{ [projectId: string]: string }>({});
    const [savingProjectId, setSavingProjectId] = useState<string | null>(null);

    useEffect(() => {
        if (staff) {
            const initial: { [projectId: string]: string } = {};
            (staff.assignedProjects || []).forEach(p => {
                initial[p.projectId] = p.monthlyPayment ? String(p.monthlyPayment) : '';
            });
            setAmounts(initial);
        }
    }, [staff]);

    if (!staff) return null;

    const fullName = `${staff.firstName} ${staff.lastName}`;
    const projects = staff.assignedProjects || [];

    const handleAmountChange = (projectId: string, value: string) => {
        const sanitized = value.replace(/[^0-9.]/g, '');
        setAmounts(prev => ({ ...prev, [projectId]: sanitized }));
    };

    const handleSave = async (projectId: string) => {
        const raw = amounts[projectId] ?? '';
        const amount = raw === '' ? 0 : Number(raw);

        if (isNaN(amount) || amount < 0) {
            toast.error('Please enter a valid amount');
            return;
        }
        if (!staff._id) {
            toast.error('Missing staff ID');
            return;
        }

        setSavingProjectId(projectId);
        try {
            await updateStaffProjectPayment(staff._id, projectId, amount);
            toast.success('Monthly payment updated');
            onPaymentUpdated(staff._id, projectId, amount);
        } catch (error: any) {
            console.error('❌ Error saving monthly payment:', error);
            toast.error(error?.response?.data?.message || 'Failed to update payment. Please try again.');
        } finally {
            setSavingProjectId(null);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.content}>
                    <View style={styles.header}>
                        <View style={styles.headerIcon}>
                            <Ionicons name="cash-outline" size={20} color="#059669" />
                        </View>
                        <View style={styles.headerText}>
                            <Text style={styles.title}>Manage Payment</Text>
                            <Text style={styles.subtitle}>{fullName}</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                            <Ionicons name="close" size={24} color="#6B7280" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
                        {projects.length === 0 ? (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="folder-open-outline" size={40} color="#CBD5E1" />
                                <Text style={styles.emptyText}>
                                    {fullName} isn't assigned to any project for this client yet.
                                </Text>
                            </View>
                        ) : (
                            projects.map(project => {
                                const isSaving = savingProjectId === project.projectId;
                                return (
                                    <View key={project.projectId} style={styles.projectRow}>
                                        <View style={styles.projectInfo}>
                                            <Ionicons name="folder-outline" size={16} color="#3A78B5" />
                                            <Text style={styles.projectName} numberOfLines={1}>
                                                {project.projectName}
                                            </Text>
                                        </View>

                                        <View style={styles.paymentInputRow}>
                                            <Text style={styles.currencyPrefix}>₹</Text>
                                            <TextInput
                                                style={styles.paymentInput}
                                                value={amounts[project.projectId] ?? ''}
                                                onChangeText={(value) => handleAmountChange(project.projectId, value)}
                                                placeholder="0"
                                                placeholderTextColor="#9CA3AF"
                                                keyboardType="numeric"
                                                editable={!isSaving}
                                            />
                                            <Text style={styles.perMonth}>/ month</Text>
                                            <TouchableOpacity
                                                style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
                                                onPress={() => handleSave(project.projectId)}
                                                disabled={isSaving}
                                            >
                                                {isSaving ? (
                                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                                ) : (
                                                    <Text style={styles.saveButtonText}>Save</Text>
                                                )}
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                );
                            })
                        )}
                    </ScrollView>

                    <View style={styles.footer}>
                        <TouchableOpacity style={styles.doneButton} onPress={onClose}>
                            <Text style={styles.doneButtonText}>Done</Text>
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
        justifyContent: 'flex-end',
    },
    content: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '80%',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 20,
        paddingVertical: 18,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    headerIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: '#ECFDF5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerText: {
        flex: 1,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E293B',
    },
    subtitle: {
        fontSize: 13,
        color: '#64748B',
        marginTop: 2,
    },
    body: {
        paddingHorizontal: 20,
        paddingTop: 16,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 40,
        gap: 12,
    },
    emptyText: {
        fontSize: 14,
        color: '#94A3B8',
        textAlign: 'center',
        paddingHorizontal: 24,
    },
    projectRow: {
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        padding: 14,
        marginBottom: 12,
    },
    projectInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 10,
    },
    projectName: {
        flex: 1,
        fontSize: 15,
        fontWeight: '600',
        color: '#1E293B',
    },
    paymentInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    currencyPrefix: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
    },
    paymentInput: {
        flex: 1,
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        paddingHorizontal: 10,
        paddingVertical: 8,
    },
    perMonth: {
        fontSize: 12,
        color: '#6B7280',
    },
    saveButton: {
        backgroundColor: '#10B981',
        borderRadius: 8,
        paddingHorizontal: 14,
        paddingVertical: 9,
        minWidth: 60,
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveButtonDisabled: {
        backgroundColor: '#9CA3AF',
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '600',
    },
    footer: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    doneButton: {
        backgroundColor: '#F1F5F9',
        borderRadius: 10,
        paddingVertical: 12,
        alignItems: 'center',
    },
    doneButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#374151',
    },
});

export default ManagePaymentModal;
