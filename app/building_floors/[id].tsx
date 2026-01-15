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
    sold?: boolean; // New field
    customerInfo?: {
        name?: string | null;
        phone?: string | null;
        email?: string | null;
    } | null; // Can be null now
    bookingDate?: string;
    description?: string;
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

    // Unit management states
    const [showAddUnitModal, setShowAddUnitModal] = useState(false);
    const [showBulkAddModal, setShowBulkAddModal] = useState(false);
    const [showEditUnitModal, setShowEditUnitModal] = useState(false);
    const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
    const [newUnit, setNewUnit] = useState({
        unitNumber: '',
        type: '1BHK',
        area: 0,
        status: 'Available',
        sold: false,
        description: '',
        customerInfo: {
            name: '',
            phone: '',
            email: ''
        }
    });

    // Edit unit state
    const [editUnit, setEditUnit] = useState({
        unitNumber: '',
        type: '1BHK',
        area: 0,
        status: 'Available',
        sold: false,
        description: '',
        customerInfo: {
            name: '',
            phone: '',
            email: ''
        }
    });

    // Bulk unit creation states
    const [bulkUnit, setBulkUnit] = useState({
        type: '1BHK',
        area: 0,
        unitCount: 1,
        description: ''
    });

    // Unit types from the Building model
    const unitTypes = ['1BHK', '2BHK', '3BHK', '4BHK', '5BHK', 'Studio', 'Shop', 'Office', 'Parking', 'Storage', 'Other'];
    const unitStatuses = ['Available', 'Booked', 'Reserved'];

    // Fetch floors from server
    const fetchFloors = async (showLoadingState = true) => {
        try {
            if (showLoadingState) {
                setLoading(true);
            }

            console.log('🔍 Fetching floors for building:', buildingId);
            const response = await axios.get(`${domain}/api/floors?buildingId=${buildingId}`);
            const responseData = response.data as any;
            
            console.log('📦 Floors API Response:', JSON.stringify(responseData, null, 2));
            
            if (responseData && responseData.success) {
                const floorsData = responseData.data || [];
                console.log(`✅ Found ${floorsData.length} floors`);
                
                // Sort floors by floor number (basement first, then ground, then upper floors)
                const sortedFloors = floorsData.sort((a: Floor, b: Floor) => a.floorNumber - b.floorNumber);
                console.log('📊 Sorted floors:', sortedFloors.map((f: Floor) => `${f.floorName} (${f.floorNumber})`).join(', '));
                
                setFloors(sortedFloors);
            } else {
                console.warn('⚠️ No success flag in response');
                setFloors([]);
            }
        } catch (error: any) {
            console.error('❌ Error fetching floors:', error);
            console.error('Error response:', error?.response?.data);
            console.error('Error status:', error?.response?.status);
            
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
        console.log('🚀 Building Floors Page Initialized');
        console.log('Building ID:', buildingId);
        console.log('Building Name:', buildingName);
        
        if (buildingId) {
            fetchFloors();
        } else {
            console.error('❌ No building ID provided!');
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

    // Handle bulk add units
    const handleBulkAddUnits = async () => {
        if (!selectedFloor) return;
        
        if (bulkUnit.unitCount <= 0) {
            toast.error('Unit count must be greater than 0');
            return;
        }

        if (bulkUnit.area <= 0) {
            toast.error('Unit area must be greater than 0');
            return;
        }

        // Check if floor is basement and prevent unit creation
        if (selectedFloor.floorName?.toLowerCase().includes('basement') || selectedFloor.floorNumber < 0) {
            toast.error('Units cannot be added to basement floors');
            return;
        }

        let loadingToast: any = null;

        try {
            loadingToast = toast.loading(`Creating ${bulkUnit.unitCount} units...`);

            const payload = {
                buildingId,
                floorId: selectedFloor._id,
                type: bulkUnit.type,
                area: Number(bulkUnit.area),
                unitCount: Number(bulkUnit.unitCount),
                description: bulkUnit.description
            };

            const response = await axios.post(`${domain}/api/building/units`, payload);

            toast.dismiss(loadingToast);

            if (response.status === 200 || response.status === 201) {
                toast.success(`${bulkUnit.unitCount} units created successfully!`);
                setShowBulkAddModal(false);
                setBulkUnit({
                    type: '1BHK',
                    area: 0,
                    unitCount: 1,
                    description: ''
                });
                await fetchFloors(false);
            }
        } catch (error: any) {
            if (loadingToast) {
                toast.dismiss(loadingToast);
            }

            console.error('Error creating bulk units:', error);
            const errorMessage = error?.response?.data?.error ||
                error?.response?.data?.message ||
                error?.message ||
                'Failed to create units';
            toast.error(errorMessage);
        }
    };

    // Handle add unit
    const handleAddUnit = async () => {
        if (!selectedFloor) return;
        
        if (!newUnit.unitNumber.trim()) {
            toast.error('Unit number is required');
            return;
        }

        if (newUnit.area <= 0) {
            toast.error('Unit area must be greater than 0');
            return;
        }

        let loadingToast: any = null;

        try {
            loadingToast = toast.loading('Adding unit...');

            // Prepare customerInfo - only include if at least one field has a value
            const hasCustomerInfo = newUnit.customerInfo.name.trim() || 
                                   newUnit.customerInfo.phone.trim() || 
                                   newUnit.customerInfo.email.trim();

            const payload = {
                buildingId,
                floorId: selectedFloor._id,
                unitNumber: newUnit.unitNumber.trim(),
                type: newUnit.type,
                area: Number(newUnit.area),
                status: newUnit.status,
                sold: newUnit.sold,
                description: newUnit.description,
                customerInfo: hasCustomerInfo ? {
                    name: newUnit.customerInfo.name.trim() || null,
                    phone: newUnit.customerInfo.phone.trim() || null,
                    email: newUnit.customerInfo.email.trim() || null
                } : null
            };

            const response = await axios.post(`${domain}/api/building/units`, payload);

            toast.dismiss(loadingToast);

            if (response.status === 200 || response.status === 201) {
                toast.success('Unit added successfully!');
                setShowAddUnitModal(false);
                setNewUnit({
                    unitNumber: '',
                    type: '1BHK',
                    area: 0,
                    status: 'Available',
                    sold: false,
                    description: '',
                    customerInfo: {
                        name: '',
                        phone: '',
                        email: ''
                    }
                });
                await fetchFloors(false);
            }
        } catch (error: any) {
            if (loadingToast) {
                toast.dismiss(loadingToast);
            }

            console.error('Error adding unit:', error);
            const errorMessage = error?.response?.data?.error ||
                error?.response?.data?.message ||
                error?.message ||
                'Failed to add unit';
            toast.error(errorMessage);
        }
    };

    // Handle delete unit
    const handleDeleteUnit = async (unit: Unit) => {
        if (!selectedFloor) return;

        Alert.alert(
            'Delete Unit',
            `Are you sure you want to delete unit "${unit.unitNumber}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        let loadingToast: any = null;

                        try {
                            loadingToast = toast.loading('Deleting unit...');

                            await axios.delete(`${domain}/api/building/units?buildingId=${buildingId}&floorId=${selectedFloor._id}&unitId=${unit._id}`);

                            toast.dismiss(loadingToast);
                            toast.success('Unit deleted successfully!');
                            await fetchFloors(false);
                        } catch (error: any) {
                            if (loadingToast) {
                                toast.dismiss(loadingToast);
                            }

                            console.error('Error deleting unit:', error);
                            const errorMessage = error?.response?.data?.error ||
                                error?.response?.data?.message ||
                                error?.message ||
                                'Failed to delete unit';
                            toast.error(errorMessage);
                        }
                    }
                }
            ]
        );
    };

    // Handle edit unit
    const handleEditUnit = (unit: Unit) => {
        if (!selectedFloor) return;
        
        setEditingUnit(unit);
        setEditUnit({
            unitNumber: unit.unitNumber,
            type: unit.type,
            area: unit.area,
            status: unit.status,
            sold: unit.sold || false,
            description: unit.description || '',
            customerInfo: {
                name: unit.customerInfo?.name || '',
                phone: unit.customerInfo?.phone || '',
                email: unit.customerInfo?.email || ''
            }
        });
        setShowEditUnitModal(true);
    };

    // Handle update unit
    const handleUpdateUnit = async () => {
        if (!selectedFloor || !editingUnit) return;
        
        if (!editUnit.unitNumber.trim()) {
            toast.error('Unit number is required');
            return;
        }

        if (editUnit.area <= 0) {
            toast.error('Unit area must be greater than 0');
            return;
        }

        let loadingToast: any = null;

        try {
            loadingToast = toast.loading('Updating unit...');

            // Prepare customerInfo - only include if at least one field has a value
            const hasCustomerInfo = editUnit.customerInfo.name.trim() || 
                                   editUnit.customerInfo.phone.trim() || 
                                   editUnit.customerInfo.email.trim();

            const payload = {
                unitNumber: editUnit.unitNumber.trim(),
                type: editUnit.type,
                area: Number(editUnit.area),
                status: editUnit.status,
                sold: editUnit.sold,
                description: editUnit.description,
                customerInfo: hasCustomerInfo ? {
                    name: editUnit.customerInfo.name.trim() || null,
                    phone: editUnit.customerInfo.phone.trim() || null,
                    email: editUnit.customerInfo.email.trim() || null
                } : null
            };

            const response = await axios.put(
                `${domain}/api/building/units?buildingId=${buildingId}&floorId=${selectedFloor._id}&unitId=${editingUnit._id}`,
                payload
            );

            toast.dismiss(loadingToast);

            if (response.status === 200) {
                toast.success('Unit updated successfully!');
                setShowEditUnitModal(false);
                setEditingUnit(null);
                setEditUnit({
                    unitNumber: '',
                    type: '1BHK',
                    area: 0,
                    status: 'Available',
                    sold: false,
                    description: '',
                    customerInfo: {
                        name: '',
                        phone: '',
                        email: ''
                    }
                });
                await fetchFloors(false);
            }
        } catch (error: any) {
            if (loadingToast) {
                toast.dismiss(loadingToast);
            }

            console.error('Error updating unit:', error);
            const errorMessage = error?.response?.data?.error ||
                error?.response?.data?.message ||
                error?.message ||
                'Failed to update unit';
            toast.error(errorMessage);
        }
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
                contentContainerStyle={styles.scrollContent}
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
                showsVerticalScrollIndicator={false}
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
                    <View style={styles.floorsContainer}>
                        {floors.map((floor, index) => (
                            <View key={floor._id || index} style={[
                                styles.floorCard,
                                index === floors.length - 1 && styles.lastFloorCard // Add extra margin to last card
                            ]}>
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
                        ))}
                    </View>
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

                        <ScrollView 
                            style={styles.modalBody} 
                            showsVerticalScrollIndicator={false}
                        >
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

            {/* Units Management Modal */}
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
                    <View style={[styles.modalContent, { width: '98%', maxWidth: 550, height: '90%' }]}>
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

                        <View style={styles.unitsHeader}>
                            <Text style={styles.unitsStats}>
                                {selectedFloor?.totalBookedUnits || 0}/{selectedFloor?.totalUnits || 0} Units Booked
                            </Text>
                            <View style={styles.addUnitsButtonGroup}>
                                <TouchableOpacity
                                    style={styles.bulkAddButton}
                                    onPress={() => setShowBulkAddModal(true)}
                                >
                                    <Ionicons name="add-circle" size={16} color="#FFFFFF" />
                                    <Text style={styles.bulkAddButtonText}>Bulk Add</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.addUnitButton}
                                    onPress={() => setShowAddUnitModal(true)}
                                >
                                    <Ionicons name="add" size={16} color="#FFFFFF" />
                                    <Text style={styles.addUnitButtonText}>Add Unit</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <ScrollView 
                            style={styles.unitsContainer} 
                            contentContainerStyle={styles.unitsScrollContent}
                            showsVerticalScrollIndicator={true}
                        >
                            {selectedFloor?.units && selectedFloor.units.length > 0 ? (
                                selectedFloor.units.map((unit, index) => (
                                    <View key={unit._id || index} style={styles.unitCard}>
                                        <View style={styles.unitCardHeader}>
                                            <View style={styles.unitInfo}>
                                                <Text style={styles.unitNumber}>{unit.unitNumber}</Text>
                                                <Text style={styles.unitType}>{unit.type}</Text>
                                            </View>
                                            <View style={[styles.statusBadge, 
                                                unit.status === 'Available' && styles.statusAvailable,
                                                unit.status === 'Booked' && styles.statusBooked,
                                                unit.status === 'Reserved' && styles.statusReserved
                                            ]}>
                                                <Text style={[styles.statusText,
                                                    unit.status === 'Available' && styles.statusTextAvailable,
                                                    unit.status === 'Booked' && styles.statusTextBooked,
                                                    unit.status === 'Reserved' && styles.statusTextReserved
                                                ]}>
                                                    {unit.status}
                                                </Text>
                                            </View>
                                        </View>
                                        
                                        <View style={styles.unitCardBody}>
                                            <Text style={styles.unitArea}>{unit.area} sq ft</Text>
                                            {unit.customerInfo?.name && (
                                                <Text style={styles.customerInfo}>
                                                    Customer: {unit.customerInfo.name}
                                                </Text>
                                            )}
                                            {unit.description && (
                                                <Text style={styles.unitDescription} numberOfLines={2}>
                                                    {unit.description}
                                                </Text>
                                            )}
                                            
                                            <View style={styles.unitActions}>
                                                <TouchableOpacity
                                                    style={styles.editUnitButton}
                                                    onPress={() => handleEditUnit(unit)}
                                                >
                                                    <Ionicons name="create-outline" size={16} color="#F59E0B" />
                                                </TouchableOpacity>
                                                
                                                <TouchableOpacity
                                                    style={styles.deleteUnitButton}
                                                    onPress={() => handleDeleteUnit(unit)}
                                                >
                                                    <Ionicons name="trash-outline" size={16} color="#EF4444" />
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </View>
                                ))
                            ) : (
                                <View style={styles.emptyUnitsContainer}>
                                    <Ionicons name="grid-outline" size={48} color="#CBD5E1" />
                                    <Text style={styles.emptyUnitsTitle}>No units found</Text>
                                    <Text style={styles.emptyUnitsSubtitle}>Tap "Add Unit" to create your first unit</Text>
                                </View>
                            )}
                        </ScrollView>

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

            {/* Bulk Add Units Modal */}
            <Modal
                visible={showBulkAddModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowBulkAddModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Bulk Add Units</Text>
                            <TouchableOpacity
                                onPress={() => setShowBulkAddModal(false)}
                                style={styles.closeButton}
                            >
                                <Ionicons name="close" size={24} color="#64748B" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView 
                            style={styles.modalBody} 
                            contentContainerStyle={{ paddingBottom: 20 }}
                            showsVerticalScrollIndicator={false}
                        >
                            <View style={styles.bulkInfoCard}>
                                <Ionicons name="information-circle" size={20} color="#3B82F6" />
                                <Text style={styles.bulkInfoText}>
                                    Units will be numbered automatically: Ground floor (001, 002...), 1st floor (101, 102...), 2nd floor (201, 202...), etc.
                                </Text>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Unit Type *</Text>
                                <View style={styles.pickerContainer}>
                                    {unitTypes.map((type) => (
                                        <TouchableOpacity
                                            key={type}
                                            style={[styles.pickerButton, bulkUnit.type === type && styles.pickerButtonActive]}
                                            onPress={() => setBulkUnit(prev => ({ ...prev, type }))}
                                        >
                                            <Text style={[styles.pickerButtonText, bulkUnit.type === type && styles.pickerButtonTextActive]}>
                                                {type}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Number of Units *</Text>
                                <TextInput
                                    style={styles.input}
                                    value={bulkUnit.unitCount.toString()}
                                    onChangeText={(text) => setBulkUnit(prev => ({ ...prev, unitCount: parseInt(text) || 1 }))}
                                    placeholder="Enter number of units to create"
                                    placeholderTextColor="#94A3B8"
                                    keyboardType="numeric"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Area per Unit (sq ft) *</Text>
                                <TextInput
                                    style={styles.input}
                                    value={bulkUnit.area.toString()}
                                    onChangeText={(text) => setBulkUnit(prev => ({ ...prev, area: parseFloat(text) || 0 }))}
                                    placeholder="Enter area for each unit"
                                    placeholderTextColor="#94A3B8"
                                    keyboardType="numeric"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Description</Text>
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    value={bulkUnit.description}
                                    onChangeText={(text) => setBulkUnit(prev => ({ ...prev, description: text }))}
                                    placeholder="Enter description for all units"
                                    placeholderTextColor="#94A3B8"
                                    multiline
                                    numberOfLines={3}
                                />
                            </View>

                            {bulkUnit.unitCount > 0 && (
                                <View style={styles.previewCard}>
                                    <Text style={styles.previewTitle}>Preview:</Text>
                                    <Text style={styles.previewText}>
                                        {bulkUnit.unitCount} × {bulkUnit.type} units will be created
                                    </Text>
                                    <Text style={styles.previewText}>
                                        Units will be numbered: {Array.from({length: Math.min(bulkUnit.unitCount, 5)}, (_, i) => {
                                            const nextNumber = (selectedFloor?.units?.length || 0) + i + 1;
                                            const floorNumber = selectedFloor?.floorNumber || 0;
                                            
                                            if (floorNumber <= 0) {
                                                // Ground floor: 001, 002, 003...
                                                return nextNumber.toString().padStart(3, '0');
                                            } else {
                                                // Other floors: 101, 102... (1st), 201, 202... (2nd)
                                                const unitSequence = nextNumber.toString().padStart(2, '0');
                                                return `${floorNumber}${unitSequence}`;
                                            }
                                        }).join(', ')}
                                        {bulkUnit.unitCount > 5 ? '...' : ''}
                                    </Text>
                                </View>
                            )}
                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => setShowBulkAddModal(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.saveButton}
                                onPress={handleBulkAddUnits}
                            >
                                <Text style={styles.saveButtonText}>Create {bulkUnit.unitCount} Units</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Add Unit Modal */}
            <Modal
                visible={showAddUnitModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowAddUnitModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Add New Unit</Text>
                            <TouchableOpacity
                                onPress={() => setShowAddUnitModal(false)}
                                style={styles.closeButton}
                            >
                                <Ionicons name="close" size={24} color="#64748B" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView 
                            style={styles.modalBody} 
                            contentContainerStyle={{ paddingBottom: 20 }}
                            showsVerticalScrollIndicator={false}
                        >
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Unit Number *</Text>
                                <TextInput
                                    style={styles.input}
                                    value={newUnit.unitNumber}
                                    onChangeText={(text) => setNewUnit(prev => ({ ...prev, unitNumber: text }))}
                                    placeholder="e.g., A101, B205"
                                    placeholderTextColor="#94A3B8"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Unit Type *</Text>
                                <View style={styles.pickerContainer}>
                                    {unitTypes.map((type) => (
                                        <TouchableOpacity
                                            key={type}
                                            style={[styles.pickerButton, newUnit.type === type && styles.pickerButtonActive]}
                                            onPress={() => setNewUnit(prev => ({ ...prev, type }))}
                                        >
                                            <Text style={[styles.pickerButtonText, newUnit.type === type && styles.pickerButtonTextActive]}>
                                                {type}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Area (sq ft) *</Text>
                                <TextInput
                                    style={styles.input}
                                    value={newUnit.area.toString()}
                                    onChangeText={(text) => setNewUnit(prev => ({ ...prev, area: parseFloat(text) || 0 }))}
                                    placeholder="Enter unit area"
                                    placeholderTextColor="#94A3B8"
                                    keyboardType="numeric"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Status</Text>
                                <View style={styles.pickerContainer}>
                                    {unitStatuses.map((status) => (
                                        <TouchableOpacity
                                            key={status}
                                            style={[styles.pickerButton, newUnit.status === status && styles.pickerButtonActive]}
                                            onPress={() => setNewUnit(prev => ({ ...prev, status }))}
                                        >
                                            <Text style={[styles.pickerButtonText, newUnit.status === status && styles.pickerButtonTextActive]}>
                                                {status}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            {newUnit.status !== 'Available' && (
                                <>
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.inputLabel}>Customer Name</Text>
                                        <TextInput
                                            style={styles.input}
                                            value={newUnit.customerInfo.name}
                                            onChangeText={(text) => setNewUnit(prev => ({ 
                                                ...prev, 
                                                customerInfo: { ...prev.customerInfo, name: text }
                                            }))}
                                            placeholder="Enter customer name"
                                            placeholderTextColor="#94A3B8"
                                        />
                                    </View>

                                    <View style={styles.inputGroup}>
                                        <Text style={styles.inputLabel}>Customer Phone</Text>
                                        <TextInput
                                            style={styles.input}
                                            value={newUnit.customerInfo.phone}
                                            onChangeText={(text) => setNewUnit(prev => ({ 
                                                ...prev, 
                                                customerInfo: { ...prev.customerInfo, phone: text }
                                            }))}
                                            placeholder="Enter customer phone"
                                            placeholderTextColor="#94A3B8"
                                            keyboardType="phone-pad"
                                        />
                                    </View>

                                    <View style={styles.inputGroup}>
                                        <Text style={styles.inputLabel}>Customer Email</Text>
                                        <TextInput
                                            style={styles.input}
                                            value={newUnit.customerInfo.email}
                                            onChangeText={(text) => setNewUnit(prev => ({ 
                                                ...prev, 
                                                customerInfo: { ...prev.customerInfo, email: text }
                                            }))}
                                            placeholder="Enter customer email"
                                            placeholderTextColor="#94A3B8"
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                        />
                                    </View>
                                </>
                            )}

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Description</Text>
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    value={newUnit.description}
                                    onChangeText={(text) => setNewUnit(prev => ({ ...prev, description: text }))}
                                    placeholder="Enter unit description"
                                    placeholderTextColor="#94A3B8"
                                    multiline
                                    numberOfLines={3}
                                />
                            </View>
                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => setShowAddUnitModal(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.saveButton}
                                onPress={handleAddUnit}
                            >
                                <Text style={styles.saveButtonText}>Add Unit</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Edit Unit Modal */}
            <Modal
                visible={showEditUnitModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowEditUnitModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Edit Unit</Text>
                            <TouchableOpacity
                                onPress={() => setShowEditUnitModal(false)}
                                style={styles.closeButton}
                            >
                                <Ionicons name="close" size={24} color="#64748B" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView 
                            style={styles.modalBody} 
                            showsVerticalScrollIndicator={false}
                        >
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Unit Number *</Text>
                                <TextInput
                                    style={styles.input}
                                    value={editUnit.unitNumber}
                                    onChangeText={(text) => setEditUnit(prev => ({ ...prev, unitNumber: text }))}
                                    placeholder="e.g., A101, B205"
                                    placeholderTextColor="#94A3B8"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Unit Type *</Text>
                                <View style={styles.pickerContainer}>
                                    {unitTypes.map((type) => (
                                        <TouchableOpacity
                                            key={type}
                                            style={[styles.pickerButton, editUnit.type === type && styles.pickerButtonActive]}
                                            onPress={() => setEditUnit(prev => ({ ...prev, type }))}
                                        >
                                            <Text style={[styles.pickerButtonText, editUnit.type === type && styles.pickerButtonTextActive]}>
                                                {type}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Area (sq ft) *</Text>
                                <TextInput
                                    style={styles.input}
                                    value={editUnit.area.toString()}
                                    onChangeText={(text) => setEditUnit(prev => ({ ...prev, area: parseFloat(text) || 0 }))}
                                    placeholder="Enter unit area"
                                    placeholderTextColor="#94A3B8"
                                    keyboardType="numeric"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Status</Text>
                                <View style={styles.pickerContainer}>
                                    {unitStatuses.map((status) => (
                                        <TouchableOpacity
                                            key={status}
                                            style={[styles.pickerButton, editUnit.status === status && styles.pickerButtonActive]}
                                            onPress={() => setEditUnit(prev => ({ ...prev, status }))}
                                        >
                                            <Text style={[styles.pickerButtonText, editUnit.status === status && styles.pickerButtonTextActive]}>
                                                {status}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            {editUnit.status !== 'Available' && (
                                <>
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.inputLabel}>Customer Name</Text>
                                        <TextInput
                                            style={styles.input}
                                            value={editUnit.customerInfo.name}
                                            onChangeText={(text) => setEditUnit(prev => ({ 
                                                ...prev, 
                                                customerInfo: { ...prev.customerInfo, name: text }
                                            }))}
                                            placeholder="Enter customer name"
                                            placeholderTextColor="#94A3B8"
                                        />
                                    </View>

                                    <View style={styles.inputGroup}>
                                        <Text style={styles.inputLabel}>Customer Phone</Text>
                                        <TextInput
                                            style={styles.input}
                                            value={editUnit.customerInfo.phone}
                                            onChangeText={(text) => setEditUnit(prev => ({ 
                                                ...prev, 
                                                customerInfo: { ...prev.customerInfo, phone: text }
                                            }))}
                                            placeholder="Enter customer phone"
                                            placeholderTextColor="#94A3B8"
                                            keyboardType="phone-pad"
                                        />
                                    </View>

                                    <View style={styles.inputGroup}>
                                        <Text style={styles.inputLabel}>Customer Email</Text>
                                        <TextInput
                                            style={styles.input}
                                            value={editUnit.customerInfo.email}
                                            onChangeText={(text) => setEditUnit(prev => ({ 
                                                ...prev, 
                                                customerInfo: { ...prev.customerInfo, email: text }
                                            }))}
                                            placeholder="Enter customer email"
                                            placeholderTextColor="#94A3B8"
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                        />
                                    </View>
                                </>
                            )}

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Description</Text>
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    value={editUnit.description}
                                    onChangeText={(text) => setEditUnit(prev => ({ ...prev, description: text }))}
                                    placeholder="Enter unit description"
                                    placeholderTextColor="#94A3B8"
                                    multiline
                                    numberOfLines={3}
                                />
                            </View>
                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => setShowEditUnitModal(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.saveButton}
                                onPress={handleUpdateUnit}
                            >
                                <Text style={styles.saveButtonText}>Update Unit</Text>
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
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 80, // Extra bottom padding for last item visibility
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
    floorsContainer: {
        paddingBottom: 20, // Extra padding for the floors container
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
    lastFloorCard: {
        marginBottom: 40, // Extra margin for the last floor card
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
        width: '95%',
        maxWidth: 450,
        height: '90%', // Increased to 90% for much taller modals
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
        flex: 1,
        padding: 20,
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
    // Units Management Styles
    unitsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        backgroundColor: '#F8FAFC',
    },
    unitsStats: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748B',
    },
    addUnitsButtonGroup: {
        flexDirection: 'row',
        gap: 8,
    },
    bulkAddButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#3B82F6',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 6,
        gap: 4,
    },
    bulkAddButtonText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '600',
    },
    addUnitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#10B981',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 6,
        gap: 4,
    },
    addUnitButtonText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '600',
    },
    bulkInfoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EFF6FF',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        gap: 8,
        borderWidth: 1,
        borderColor: '#DBEAFE',
    },
    bulkInfoText: {
        flex: 1,
        fontSize: 13,
        color: '#1E40AF',
        lineHeight: 18,
    },
    previewCard: {
        backgroundColor: '#F8FAFC',
        padding: 12,
        borderRadius: 8,
        marginTop: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    previewTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 4,
    },
    previewText: {
        fontSize: 13,
        color: '#64748B',
        marginBottom: 2,
    },
    unitsContainer: {
        flex: 1,
    },
    unitsScrollContent: {
        padding: 16,
        paddingBottom: 40, // Extra bottom padding for units
    },
    unitCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    unitCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    unitInfo: {
        flex: 1,
    },
    unitNumber: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1E293B',
        marginBottom: 2,
    },
    unitType: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '500',
    },
    statusBadge: {
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 12,
        borderWidth: 1,
    },
    statusAvailable: {
        backgroundColor: '#ECFDF5',
        borderColor: '#10B981',
    },
    statusBooked: {
        backgroundColor: '#FEF2F2',
        borderColor: '#EF4444',
    },
    statusReserved: {
        backgroundColor: '#FEF3C7',
        borderColor: '#F59E0B',
    },
    statusText: {
        fontSize: 11,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    statusTextAvailable: {
        color: '#10B981',
    },
    statusTextBooked: {
        color: '#EF4444',
    },
    statusTextReserved: {
        color: '#F59E0B',
    },
    unitCardBody: {
        padding: 16,
    },
    unitArea: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 4,
    },
    customerInfo: {
        fontSize: 13,
        color: '#64748B',
        marginBottom: 4,
    },
    unitDescription: {
        fontSize: 13,
        color: '#64748B',
        lineHeight: 18,
        marginBottom: 8,
    },
    unitActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 8,
    },
    editUnitButton: {
        width: 32,
        height: 32,
        borderRadius: 6,
        backgroundColor: '#FFFBEB',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FEF3C7',
    },
    deleteUnitButton: {
        width: 32,
        height: 32,
        borderRadius: 6,
        backgroundColor: '#FEF2F2',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FEE2E2',
    },
    emptyUnitsContainer: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyUnitsTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#64748B',
        marginTop: 12,
        marginBottom: 4,
    },
    emptyUnitsSubtitle: {
        fontSize: 14,
        color: '#94A3B8',
        textAlign: 'center',
    },
});