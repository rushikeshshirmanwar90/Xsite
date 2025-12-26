import { domain } from '@/lib/domain';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, Platform, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';

interface Floor {
    _id: string;
    floorNumber: number;
    floorName: string;
    floorType: string;
    totalUnits: number;
    totalBookedUnits: number;
    unitTypes: UnitType[];
    units: Unit[];
    description: string;
    isActive: boolean;
}

interface UnitType {
    _id: string;
    type: string;
    count: number;
    bookedCount: number;
    area?: number;
    pricePerSqFt?: number;
}

interface Unit {
    _id: string;
    unitNumber: string;
    type: string;
    area: number;
    price?: number;
    status: string;
    customerInfo?: {
        name?: string;
        phone?: string;
        email?: string;
    };
    bookingDate?: string;
}

const BuildingFloorsPage = () => {
    const params = useLocalSearchParams();
    const { id: buildingId, buildingName } = params;

    // State management
    const [floors, setFloors] = useState<Floor[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showAddFloorModal, setShowAddFloorModal] = useState(false);
    const [showEditFloorModal, setShowEditFloorModal] = useState(false);
    const [showUnitsModal, setShowUnitsModal] = useState(false);
    const [selectedFloor, setSelectedFloor] = useState<Floor | null>(null);
    const [editingFloor, setEditingFloor] = useState<Floor | null>(null);

    // Form states
    const [newFloor, setNewFloor] = useState({
        floorNumber: 0,
        floorName: '',
        floorType: 'Residential',
        totalUnits: 0,
        description: ''
    });

    // Fetch floors from server
    const fetchFloors = async (showLoadingState = true) => {
        try {
            if (showLoadingState) {
                setLoading(true);
            }

            const response = await axios.get(`${domain}/api/floors?buildingId=${buildingId}`);
            const responseData = response.data as any;
            
            if (responseData && responseData.success) {
                setFloors(responseData.data || []);
            } else {
                setFloors([]);
            }
        } catch (error: any) {
            console.error('Error fetching floors:', error);
            if (error?.response?.status !== 404) {
                toast.error('Failed to load floors');
            }
            setFloors([]);
        } finally {
            setLoading(false);
        }
    };

    // Initialize data
    useEffect(() => {
        if (buildingId) {
            fetchFloors();
        }
    }, [buildingId]);

    // Pull to refresh
    const onRefresh = async () => {
        if (refreshing) return;
        setRefreshing(true);
        try {
            await fetchFloors(false);
        } finally {
            setRefreshing(false);
        }
    };

    // Handle add floor
    const handleAddFloor = async () => {
        if (!newFloor.floorName.trim()) {
            toast.error('Floor name is required');
            return;
        }

        let loadingToast: any = null;

        try {
            loadingToast = toast.loading('Adding floor...');

            const payload = {
                buildingId,
                ...newFloor,
                floorName: newFloor.floorName.trim()
            };

            const response = await axios.post(`${domain}/api/floors`, payload);

            toast.dismiss(loadingToast);

            if (response.status === 200 || response.status === 201) {
                toast.success('Floor added successfully!');
                setShowAddFloorModal(false);
                setNewFloor({
                    floorNumber: 0,
                    floorName: '',
                    floorType: 'Residential',
                    totalUnits: 0,
                    description: ''
                });
                await fetchFloors(false);
            }
        } catch (error: any) {
            if (loadingToast) {
                toast.dismiss(loadingToast);
            }

            console.error('Error adding floor:', error);
            const errorMessage = error?.response?.data?.error ||
                error?.response?.data?.message ||
                error?.message ||
                'Failed to add floor';
            toast.error(errorMessage);
        }
    };

    // Handle delete floor
    const handleDeleteFloor = async (floor: Floor) => {
        Alert.alert(
            'Delete Floor',
            `Are you sure you want to delete "${floor.floorName || `Floor ${floor.floorNumber}`}"? This will also delete all units on this floor.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        let loadingToast: any = null;

                        try {
                            loadingToast = toast.loading('Deleting floor...');

                            await axios.delete(`${domain}/api/floors?id=${floor._id}`);

                            toast.dismiss(loadingToast);
                            toast.success('Floor deleted successfully!');
                            await fetchFloors(false);
                        } catch (error: any) {
                            if (loadingToast) {
                                toast.dismiss(loadingToast);
                            }

                            console.error('Error deleting floor:', error);
                            const errorMessage = error?.response?.data?.error ||
                                error?.response?.data?.message ||
                                error?.message ||
                                'Failed to delete floor';
                            toast.error(errorMessage);
                        }
                    }
                }
            ]
        );
    };

    // Handle manage units
    const handleManageUnits = (floor: Floor) => {
        setSelectedFloor(floor);
        setShowUnitsModal(true);
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#000" />
                    </TouchableOpacity>
                    <View style={styles.headerInfo}>
                        <Text style={styles.headerTitle}>Building Floors</Text>
                        <Text style={styles.headerSubtitle}>{buildingName}</Text>
                    </View>
                </View>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => setShowAddFloorModal(true)}
                >
                    <Ionicons name="add-circle" size={24} color="#1F2937" />
                    <Text style={styles.addButtonText}>Add Floor</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.content}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#3B82F6']}
                        tintColor="#3B82F6"
                        title="Pull to refresh"
                        titleColor="#64748b"
                    />
                }
            >
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Floors & Units</Text>
                    <View style={styles.sectionDivider} />
                </View>

                {loading ? (
                    <View style={styles.centered}>
                        <View style={{ alignItems: 'center', marginBottom: 16 }}>
                            <Ionicons name="sync" size={48} color="#3B82F6" />
                        </View>
                        <Text style={styles.loadingText}>Loading floors...</Text>
                    </View>
                ) : floors.length === 0 ? (
                    <View style={styles.centered}>
                        <Ionicons name="layers-outline" size={64} color="#CBD5E1" />
                        <Text style={styles.emptyTitle}>No floors found</Text>
                        <Text style={styles.emptySubtitle}>Tap "Add Floor" to create your first floor</Text>
                    </View>
                ) : (
                    floors.map((floor, index) => (
                        <View key={floor._id || index} style={styles.floorCard}>
                            <View style={styles.floorCardHeader}>
                                <View style={styles.floorInfo}>
                                    <Text style={styles.floorName}>
                                        {floor.floorName || `Floor ${floor.floorNumber}`}
                                    </Text>
                                    <Text style={styles.floorType}>{floor.floorType}</Text>
                                </View>
                                <View style={styles.floorStats}>
                                    <Text style={styles.statText}>
                                        {floor.totalBookedUnits}/{floor.totalUnits} Units
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.floorCardBody}>
                                <View style={styles.floorDetails}>
                                    <Text style={styles.floorDescription} numberOfLines={2}>
                                        {floor.description || 'No description available'}
                                    </Text>
                                </View>

                                <View style={styles.actionButtonsRow}>
                                    <TouchableOpacity
                                        style={styles.manageUnitsButton}
                                        onPress={() => handleManageUnits(floor)}
                                    >
                                        <Ionicons name="grid-outline" size={18} color="#3B82F6" />
                                        <Text style={styles.manageUnitsText}>Manage Units</Text>
                                    </TouchableOpacity>

                                    <View style={styles.actionButtons}>
                                        <TouchableOpacity
                                            style={styles.editButton}
                                            onPress={() => {
                                                setEditingFloor(floor);
                                                setShowEditFloorModal(true);
                                            }}
                                        >
                                            <Ionicons name="create-outline" size={18} color="#F59E0B" />
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={styles.deleteButton}
                                            onPress={() => handleDeleteFloor(floor)}
                                        >
                                            <Ionicons name="trash-outline" size={18} color="#EF4444" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        </View>
                    ))
                )}
            </ScrollView>

            {/* Add Floor Modal */}
            <Modal
                visible={showAddFloorModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowAddFloorModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Add New Floor</Text>
                            <TouchableOpacity
                                onPress={() => setShowAddFloorModal(false)}
                                style={styles.closeButton}
                            >
                                <Ionicons name="close" size={24} color="#64748B" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Floor Number</Text>
                                <TextInput
                                    style={styles.input}
                                    value={newFloor.floorNumber.toString()}
                                    onChangeText={(text) => setNewFloor(prev => ({ ...prev, floorNumber: parseInt(text) || 0 }))}
                                    placeholder="Enter floor number"
                                    placeholderTextColor="#94A3B8"
                                    keyboardType="numeric"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Floor Name</Text>
                                <TextInput
                                    style={styles.input}
                                    value={newFloor.floorName}
                                    onChangeText={(text) => setNewFloor(prev => ({ ...prev, floorName: text }))}
                                    placeholder="e.g., Ground Floor, First Floor"
                                    placeholderTextColor="#94A3B8"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Floor Type</Text>
                                <View style={styles.pickerContainer}>
                                    {['Residential', 'Commercial', 'Mixed', 'Parking', 'Amenity'].map((type) => (
                                        <TouchableOpacity
                                            key={type}
                                            style={[styles.pickerButton, newFloor.floorType === type && styles.pickerButtonActive]}
                                            onPress={() => setNewFloor(prev => ({ ...prev, floorType: type }))}
                                        >
                                            <Text style={[styles.pickerButtonText, newFloor.floorType === type && styles.pickerButtonTextActive]}>
                                                {type}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Total Units</Text>
                                <TextInput
                                    style={styles.input}
                                    value={newFloor.totalUnits.toString()}
                                    onChangeText={(text) => setNewFloor(prev => ({ ...prev, totalUnits: parseInt(text) || 0 }))}
                                    placeholder="Enter total units on this floor"
                                    placeholderTextColor="#94A3B8"
                                    keyboardType="numeric"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Description</Text>
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    value={newFloor.description}
                                    onChangeText={(text) => setNewFloor(prev => ({ ...prev, description: text }))}
                                    placeholder="Enter floor description"
                                    placeholderTextColor="#94A3B8"
                                    multiline
                                    numberOfLines={3}
                                />
                            </View>
                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => setShowAddFloorModal(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.saveButton}
                                onPress={handleAddFloor}
                            >
                                <Text style={styles.saveButtonText}>Add Floor</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Units Management Modal - Coming Soon */}
            <Modal
                visible={showUnitsModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => {
                    setShowUnitsModal(false);
                    setSelectedFloor(null);
                }}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                Units - {selectedFloor?.floorName || `Floor ${selectedFloor?.floorNumber}`}
                            </Text>
                            <TouchableOpacity
                                onPress={() => {
                                    setShowUnitsModal(false);
                                    setSelectedFloor(null);
                                }}
                                style={styles.closeButton}
                            >
                                <Ionicons name="close" size={24} color="#64748B" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalBody}>
                            <View style={styles.comingSoonContainer}>
                                <Ionicons name="construct-outline" size={64} color="#94A3B8" />
                                <Text style={styles.comingSoonTitle}>Units Management</Text>
                                <Text style={styles.comingSoonText}>
                                    Individual unit management will be available in a future update. 
                                    You can currently manage floor-level information.
                                </Text>
                            </View>
                        </View>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => {
                                    setShowUnitsModal(false);
                                    setSelectedFloor(null);
                                }}
                            >
                                <Text style={styles.cancelButtonText}>Close</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

export default BuildingFloorsPage;

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
    headerInfo: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#000',
        marginBottom: 2,
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '500',
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
    floorCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    floorCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        backgroundColor: '#FAFBFC',
    },
    floorInfo: {
        flex: 1,
    },
    floorName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1E293B',
        marginBottom: 2,
    },
    floorType: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '500',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    floorStats: {
        alignItems: 'flex-end',
    },
    statText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#3B82F6',
    },
    floorCardBody: {
        padding: 16,
    },
    floorDetails: {
        marginBottom: 12,
    },
    floorDescription: {
        fontSize: 14,
        color: '#64748B',
        lineHeight: 20,
    },
    actionButtonsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
    },
    manageUnitsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EFF6FF',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        gap: 6,
        flex: 1,
        borderWidth: 1,
        borderColor: '#DBEAFE',
    },
    manageUnitsText: {
        color: '#3B82F6',
        fontWeight: '600',
        fontSize: 14,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    editButton: {
        width: 36,
        height: 36,
        borderRadius: 8,
        backgroundColor: '#FFFBEB',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FEF3C7',
    },
    deleteButton: {
        width: 36,
        height: 36,
        borderRadius: 8,
        backgroundColor: '#FEF2F2',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FEE2E2',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
        minHeight: 300,
    },
    loadingText: {
        fontSize: 14,
        color: '#64748b',
        fontWeight: '500',
    },
    emptyTitle: {
        marginTop: 16,
        fontSize: 18,
        fontWeight: '700',
        color: '#1e293b',
    },
    emptySubtitle: {
        marginTop: 8,
        fontSize: 14,
        color: '#64748b',
        textAlign: 'center',
    },
    // Modal Styles
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
        maxWidth: 400,
        maxHeight: '80%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E293B',
        flex: 1,
    },
    closeButton: {
        padding: 4,
    },
    modalBody: {
        padding: 20,
        maxHeight: 400,
    },
    inputGroup: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#475569',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 12,
        fontSize: 16,
        color: '#1E293B',
        backgroundColor: '#F8FAFC',
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    pickerContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    pickerButton: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        backgroundColor: '#F8FAFC',
    },
    pickerButtonActive: {
        backgroundColor: '#3B82F6',
        borderColor: '#3B82F6',
    },
    pickerButtonText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#64748B',
    },
    pickerButtonTextActive: {
        color: '#FFFFFF',
    },
    modalFooter: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
        paddingHorizontal: 20,
        paddingBottom: 20,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    cancelButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        backgroundColor: '#F1F5F9',
    },
    cancelButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#64748B',
    },
    saveButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        backgroundColor: '#3B82F6',
    },
    saveButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    comingSoonContainer: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    comingSoonTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#64748B',
        marginTop: 16,
        marginBottom: 8,
    },
    comingSoonText: {
        fontSize: 14,
        color: '#94A3B8',
        textAlign: 'center',
        lineHeight: 20,
    },
});