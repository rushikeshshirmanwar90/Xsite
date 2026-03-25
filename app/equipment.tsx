import React, { useEffect, useState, useRef } from 'react';
import { 
    View, 
    Text, 
    ScrollView, 
    TouchableOpacity, 
    StyleSheet, 
    Alert,
    Animated,
    RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import axios from 'axios';
import { domain } from '@/lib/domain';
import { getClientId } from '@/functions/clientId';
import { toast } from 'sonner-native';
import Header from '@/components/details/Header';
import EquipmentFormModal from '@/components/details/EquipmentFormModal';
import { styles } from '@/style/details';
import { useSimpleNotifications } from '@/hooks/useSimpleNotifications';
import { useAuth } from '@/contexts/AuthContext';

interface Equipment {
    _id: string;
    type: string;
    category: string;
    quantity: number;
    perUnitCost: number;
    totalCost: number;
    costType?: 'rental' | 'purchase' | 'lease';
    rentalPeriod?: 'hourly' | 'daily' | 'weekly' | 'monthly';
    rentalDuration?: number;
    specifications?: {
        model?: string;
        brand?: string;
        capacity?: string;
        fuelType?: 'diesel' | 'petrol' | 'electric' | 'hybrid';
        operatorRequired?: boolean;
    };
    status: 'active' | 'completed' | 'cancelled' | 'maintenance';
    notes?: string;
    usageDate?: string;
    createdAt: string;
    miniSectionId?: string;
}

interface EquipmentCategory {
    name: string;
    description: string;
    equipment: Array<{
        type: string;
        description: string;
        defaultCost: number;
        unit: string;
    }>;
}

// API Response Types
interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data: T;
}

// Function to get equipment icon and color based on category and type
const getEquipmentIconAndColor = (category: string, type: string) => {
    const categoryMap: { [key: string]: { icon: keyof typeof Ionicons.glyphMap, color: string } } = {
        'Earthmoving & Excavation Equipment': { icon: 'construct-outline', color: '#8B5CF6' },
        'Material Handling & Lifting': { icon: 'arrow-up-outline', color: '#10B981' },
        'Concrete & Paving Equipment': { icon: 'cube-outline', color: '#F59E0B' },
        'Hauling & Transport Vehicles': { icon: 'car-outline', color: '#EF4444' },
        'Specialty & Finishing Equipment': { icon: 'settings-outline', color: '#6366F1' },
    };

    // Specific equipment type overrides
    const typeMap: { [key: string]: { icon: keyof typeof Ionicons.glyphMap, color: string } } = {
        'Excavator': { icon: 'construct', color: '#8B5CF6' },
        'Tower Crane': { icon: 'arrow-up', color: '#10B981' },
        'Concrete Mixer Truck': { icon: 'cube', color: '#F59E0B' },
        'Dump Truck': { icon: 'car', color: '#EF4444' },
        'Generator': { icon: 'flash', color: '#6366F1' },
        'Compressor': { icon: 'radio', color: '#06B6D4' },
        'Welding Machine': { icon: 'flame', color: '#F97316' },
    };

    return typeMap[type] || categoryMap[category] || { icon: 'construct-outline', color: '#6B7280' };
};

// Equipment Card Component
interface EquipmentCardProps {
    equipment: Equipment;
    animation: Animated.Value;
    onDelete: () => void;
}

const EquipmentCard: React.FC<EquipmentCardProps> = ({ 
    equipment, 
    animation, 
    onDelete 
}) => {
    const { icon, color } = getEquipmentIconAndColor(equipment.category, equipment.type);
    
    const formatCurrency = (amount: number) => {
        return `₹${amount.toLocaleString('en-IN')}`;
    };

    const getCostTypeDisplay = (equipment: Equipment) => {
        if (equipment.costType === 'rental' && equipment.rentalPeriod && equipment.rentalDuration) {
            return `${equipment.costType} - ${equipment.rentalDuration} ${equipment.rentalPeriod}`;
        }
        return equipment.costType;
    };

    return (
        <Animated.View style={[equipmentCardStyles.equipmentCard, { opacity: animation }]}>
            <View style={equipmentCardStyles.equipmentHeader}>
                <View style={[equipmentCardStyles.equipmentIcon, { backgroundColor: `${color}20` }]}>
                    <Ionicons name={icon} size={24} color={color} />
                </View>
                <View style={equipmentCardStyles.equipmentInfo}>
                    <Text style={equipmentCardStyles.equipmentName}>{equipment.type}</Text>
                    <Text style={equipmentCardStyles.equipmentCategory}>{equipment.category}</Text>
                </View>
                <TouchableOpacity 
                    style={equipmentCardStyles.deleteButton}
                    onPress={onDelete}
                >
                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                </TouchableOpacity>
            </View>

            <View style={equipmentCardStyles.equipmentDetails}>
                <View style={equipmentCardStyles.detailRow}>
                    <Text style={equipmentCardStyles.detailLabel}>Quantity:</Text>
                    <Text style={equipmentCardStyles.detailValue}>{equipment.quantity}</Text>
                </View>
                <View style={equipmentCardStyles.detailRow}>
                    <Text style={equipmentCardStyles.detailLabel}>Per Unit Cost:</Text>
                    <Text style={equipmentCardStyles.detailValue}>{formatCurrency(equipment.perUnitCost)}</Text>
                </View>
                <View style={equipmentCardStyles.detailRow}>
                    <Text style={equipmentCardStyles.detailLabel}>Total Cost:</Text>
                    <Text style={[equipmentCardStyles.detailValue, equipmentCardStyles.totalCost]}>
                        {formatCurrency(equipment.totalCost)}
                    </Text>
                </View>
                <View style={equipmentCardStyles.detailRow}>
                    <Text style={equipmentCardStyles.detailLabel}>Type:</Text>
                    <Text style={equipmentCardStyles.detailValue}>{getCostTypeDisplay(equipment)}</Text>
                </View>
                
                {equipment.specifications && (
                    <>
                        {equipment.specifications.model && (
                            <View style={equipmentCardStyles.detailRow}>
                                <Text style={equipmentCardStyles.detailLabel}>Model:</Text>
                                <Text style={equipmentCardStyles.detailValue}>{equipment.specifications.model}</Text>
                            </View>
                        )}
                        {equipment.specifications.brand && (
                            <View style={equipmentCardStyles.detailRow}>
                                <Text style={equipmentCardStyles.detailLabel}>Brand:</Text>
                                <Text style={equipmentCardStyles.detailValue}>{equipment.specifications.brand}</Text>
                            </View>
                        )}
                        {equipment.specifications.capacity && (
                            <View style={equipmentCardStyles.detailRow}>
                                <Text style={equipmentCardStyles.detailLabel}>Capacity:</Text>
                                <Text style={equipmentCardStyles.detailValue}>{equipment.specifications.capacity}</Text>
                            </View>
                        )}
                    </>
                )}
                
                {equipment.notes && (
                    <View style={equipmentCardStyles.notesContainer}>
                        <Text style={equipmentCardStyles.detailLabel}>Notes:</Text>
                        <Text style={equipmentCardStyles.notesText}>{equipment.notes}</Text>
                    </View>
                )}
            </View>

            <View style={equipmentCardStyles.equipmentFooter}>
                <View style={[equipmentCardStyles.statusBadge, { 
                    backgroundColor: equipment.status === 'active' ? '#10B981' : '#6B7280' 
                }]}>
                    <Text style={equipmentCardStyles.statusText}>
                        {equipment.status.toUpperCase()}
                    </Text>
                </View>
                <Text style={equipmentCardStyles.dateText}>
                    {new Date(equipment.createdAt).toLocaleDateString()}
                </Text>
            </View>
        </Animated.View>
    );
};

const EquipmentManagement = () => {
    const params = useLocalSearchParams();
    const router = useRouter();
    const { user } = useAuth();
    const { sendProjectNotification } = useSimpleNotifications();
    
    const projectId = params.projectId as string;
    const projectName = params.projectName as string;
    const sectionId = params.sectionId as string;
    const sectionName = params.sectionName as string;

    const [equipment, setEquipment] = useState<Equipment[]>([]);
    const [categories, setCategories] = useState<{[key: string]: EquipmentCategory}>({});
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [showEquipmentForm, setShowEquipmentForm] = useState(false);
    const [isAddingEquipment, setIsAddingEquipment] = useState(false);
    
    const cardAnimations = useRef<Animated.Value[]>([]).current;
    const scrollViewRef = useRef<ScrollView>(null);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const loadingAnimation = useRef(new Animated.Value(0)).current;

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [totalCount, setTotalCount] = useState(0);

    // Animation for equipment cards
    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
        }).start();
    }, [equipment]);
    // Function to get equipment icon and color based on category and type
    const getEquipmentIconAndColor = (category: string, type: string) => {
        const categoryMap: { [key: string]: { icon: keyof typeof Ionicons.glyphMap, color: string } } = {
            'Earthmoving & Excavation Equipment': { icon: 'construct-outline', color: '#8B5CF6' },
            'Material Handling & Lifting': { icon: 'arrow-up-outline', color: '#10B981' },
            'Concrete & Paving Equipment': { icon: 'cube-outline', color: '#F59E0B' },
            'Hauling & Transport Vehicles': { icon: 'car-outline', color: '#EF4444' },
            'Specialty & Finishing Equipment': { icon: 'settings-outline', color: '#6366F1' },
        };

        // Specific equipment type overrides
        const typeMap: { [key: string]: { icon: keyof typeof Ionicons.glyphMap, color: string } } = {
            'Excavator': { icon: 'construct', color: '#8B5CF6' },
            'Tower Crane': { icon: 'arrow-up', color: '#10B981' },
            'Concrete Mixer Truck': { icon: 'cube', color: '#F59E0B' },
            'Dump Truck': { icon: 'car', color: '#EF4444' },
            'Generator': { icon: 'flash', color: '#6366F1' },
            'Compressor': { icon: 'radio', color: '#06B6D4' },
            'Welding Machine': { icon: 'flame', color: '#F97316' },
        };

        return typeMap[type] || categoryMap[category] || { icon: 'construct-outline', color: '#6B7280' };
    };

    // Function to fetch mini-sections from API (removed - not used for equipment)

    // Load equipment data
    const loadEquipment = async () => {
        if (!projectId) return;
        
        setLoading(true);
        try {
            const clientId = await getClientId();
            if (!clientId) {
                toast.error('Client ID not found');
                return;
            }

            const response = await axios.get<ApiResponse<Equipment[]>>(`${domain}/api/equipment`, {
                params: {
                    projectId,
                    projectSectionId: sectionId,
                    status: 'active'
                }
            });

            if (response.data && response.data.success) {
                const equipmentData = response.data.data || [];
                setEquipment(equipmentData);
                setTotalCount(equipmentData.length);

                // Initialize animations
                cardAnimations.splice(0);
                for (let i = 0; i < equipmentData.length; i++) {
                    cardAnimations.push(new Animated.Value(0));
                }

                Animated.stagger(100,
                    cardAnimations.map((anim: Animated.Value) =>
                        Animated.timing(anim, {
                            toValue: 1,
                            duration: 300,
                            useNativeDriver: false,
                        })
                    )
                ).start();
            } else {
                setEquipment([]);
                setTotalCount(0);
            }
        } catch (error: any) {
            console.error('Error loading equipment:', error);
            toast.error('Failed to load equipment');
            setEquipment([]);
            setTotalCount(0);
        } finally {
            setLoading(false);
        }
    };

    // Load equipment categories
    const loadCategories = async () => {
        try {
            const response = await axios.get<ApiResponse<{[key: string]: EquipmentCategory}>>(`${domain}/api/equipment/categories`);
            if (response.data && response.data.success) {
                setCategories(response.data.data);
            }
        } catch (error: any) {
            console.error('Error loading categories:', error);
        }
    };

    // Function to load data
    const loadData = async () => {
        setLoading(true);
        
        try {
            // Load equipment entries from API
            await loadEquipment();
            
            // Load categories
            await loadCategories();
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Function to start loading animation
    const startLoadingAnimation = () => {
        setIsAddingEquipment(true);
        Animated.loop(
            Animated.timing(loadingAnimation, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            })
        ).start();
    };

    // Function to stop loading animation
    const stopLoadingAnimation = () => {
        setIsAddingEquipment(false);
        loadingAnimation.stopAnimation();
        loadingAnimation.setValue(0);
    };

    // Function to handle adding equipment entries (simplified like labor)
    const handleAddEquipmentEntries = async (equipmentEntries: any[], message: string) => {
        try {
            console.log('Adding equipment entries:', equipmentEntries);

            // Start loading animation and disable form
            setIsAddingEquipment(true);
            startLoadingAnimation();
            toast.loading(`Adding ${equipmentEntries.length} equipment ${equipmentEntries.length === 1 ? 'entry' : 'entries'}...`);

            const clientId = await getClientId();
            if (!clientId) {
                throw new Error('Client ID not found');
            }

            // Prepare data for the bulk equipment API
            const requestData = {
                operation: 'create',
                data: equipmentEntries.map(entry => {
                    // Create clean equipment entry with only the required fields
                    const mappedEntry = {
                        // Required equipment fields
                        type: entry.type,
                        category: entry.category,
                        quantity: Number(entry.quantity),
                        perUnitCost: Number(entry.perUnitCost),
                        totalCost: Number(entry.quantity) * Number(entry.perUnitCost),
                        
                        // Required project tracking fields
                        projectId: projectId,
                        projectName: projectName,
                        projectSectionId: sectionId,
                        projectSectionName: sectionName,
                        
                        // Optional fields
                        costType: entry.costType || 'purchase',
                        rentalPeriod: entry.costType === 'rental' ? entry.rentalPeriod : undefined,
                        rentalDuration: entry.costType === 'rental' ? Number(entry.rentalDuration) : undefined,
                        status: 'active',
                        notes: message || '',
                        usageDate: new Date(),
                        
                        // Audit fields
                        addedBy: clientId
                    };
                    
                    // Remove undefined fields to avoid validation issues
                    Object.keys(mappedEntry).forEach(key => {
                        if (mappedEntry[key as keyof typeof mappedEntry] === undefined) {
                            delete mappedEntry[key as keyof typeof mappedEntry];
                        }
                    });
                    
                    // Debug: Log each mapped entry
                    console.log('Mapped equipment entry:', mappedEntry);
                    
                    // Validate required fields
                    const requiredFields = ['type', 'category', 'quantity', 'perUnitCost', 'projectId', 'projectName', 'projectSectionId', 'projectSectionName'];
                    for (const field of requiredFields) {
                        if (!(mappedEntry as any)[field]) {
                            console.error(`Missing required field: ${field}`, mappedEntry);
                            throw new Error(`Missing required field: ${field}`);
                        }
                    }
                    
                    return mappedEntry;
                })
            };

            console.log('Sending equipment data to bulk API:', requestData);

            // Call the bulk equipment API
            const response = await fetch(`${domain}/api/equipment/bulk`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData)
            });

            const result = await response.json();
            console.log('Equipment API response:', result);

            if (result.success) {
                // Log activity for equipment addition (without loading toast)
                try {
                    console.log('🚀 Starting equipment activity logging...');
                    
                    // Import the activity logger
                    const { logEquipmentAdded } = await import('@/utils/activityLogger');
                    
                    // Get client ID for activity logging
                    const clientId = await getClientId();
                    
                    // Send equipment activity notification
                    const staffName = user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Staff Member';
                    const equipmentCount = equipmentEntries.length;
                    const totalValue = equipmentEntries.reduce((sum, entry) => sum + (entry.quantity * entry.perUnitCost), 0);
                    
                    // Log the equipment addition activity to database
                    console.log('🚀 Calling logEquipmentAdded function...');
                    await logEquipmentAdded(
                        projectId,
                        projectName,
                        sectionId,
                        sectionName,
                        undefined, // miniSectionId - equipment doesn't use mini-sections in this implementation
                        undefined, // miniSectionName
                        equipmentEntries.map(entry => ({
                            type: entry.type,
                            category: entry.category,
                            quantity: entry.quantity,
                            perUnitCost: entry.perUnitCost,
                            totalCost: entry.quantity * entry.perUnitCost,
                            costType: entry.costType,
                            rentalPeriod: entry.rentalPeriod,
                            rentalDuration: entry.rentalDuration
                        })),
                        message || `Added ${equipmentCount} equipment ${equipmentCount === 1 ? 'entry' : 'entries'}`
                    );
                    
                    console.log('✅ Equipment activity logged to database successfully');
                    
                    // Prepare equipment data for notification (similar to materials format)
                    const equipmentData = equipmentEntries.map(entry => ({
                        name: entry.type,
                        unit: entry.unit || 'units',
                        qnt: entry.quantity,
                        cost: entry.totalCost,
                        costType: entry.costType,
                        rentalPeriod: entry.rentalPeriod,
                        rentalDuration: entry.rentalDuration
                    }));
                    
                    const notificationDetails = `Added ${equipmentCount} equipment ${equipmentCount === 1 ? 'entry' : 'entries'} worth ₹${totalValue.toLocaleString()}`;
                    
                    const notificationSent = await sendProjectNotification({
                        projectId: projectId,
                        clientId: clientId || undefined,
                        activityType: 'equipment_added',
                        category: 'equipment',
                        staffName: staffName,
                        projectName: projectName,
                        sectionName: sectionName,
                        details: notificationDetails,
                        materials: equipmentData, // Use materials field for equipment data
                        message: `Equipment added: ${equipmentEntries.map(e => e.type).join(', ')}`
                    });
                    
                    if (notificationSent) {
                        console.log('✅ Equipment notification sent successfully');
                    }
                } catch (activityError: any) {
                    console.error('❌ Failed to log equipment activity:', activityError);
                }

                // Refresh the equipment list (without loading toast)
                await loadEquipment();

                // Stop loading animation and show success
                stopLoadingAnimation();
                setIsAddingEquipment(false);
                toast.dismiss();
                toast.success(`🎉 Successfully added ${equipmentEntries.length} equipment ${equipmentEntries.length === 1 ? 'entry' : 'entries'} to your project!`);
                
                // Close the form modal
                setShowEquipmentForm(false);
            } else {
                throw new Error(result.message || 'Failed to add equipment entries');
            }
            
        } catch (error: any) {
            console.error('Error adding equipment entries:', error);
            stopLoadingAnimation();
            setIsAddingEquipment(false);
            toast.dismiss();
            toast.error(error.message || 'Failed to add equipment entries');
        }
    };

    // Function to format date for grouping
    const formatDateHeader = (dateString: string): string => {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });
        }
    };

    // Function to group equipment entries by date
    const getGroupedByDate = () => {
        const grouped: { [date: string]: Equipment[] } = {};
        
        equipment.forEach(item => {
            const dateKey = new Date(item.createdAt).toDateString();
            if (!grouped[dateKey]) {
                grouped[dateKey] = [];
            }
            grouped[dateKey].push(item);
        });

        return Object.keys(grouped)
            .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
            .map(date => ({
                date,
                equipment: grouped[date]
            }));
    };

    // Delete equipment
    const deleteEquipment = (equipmentId: string) => {
        Alert.alert(
            'Delete Equipment',
            'Are you sure you want to delete this equipment entry?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const response = await axios.delete<ApiResponse<Equipment>>(`${domain}/api/equipment?id=${equipmentId}`);
                            if (response.data.success) {
                                toast.success('Equipment deleted successfully');
                                loadEquipment();
                            } else {
                                toast.error('Failed to delete equipment');
                            }
                        } catch (error: any) {
                            console.error('Error deleting equipment:', error);
                            toast.error('Failed to delete equipment');
                        }
                    }
                }
            ]
        );
    };

    // Refresh data
    const onRefresh = async () => {
        setRefreshing(true);
        await loadEquipment();
        setRefreshing(false);
    };

    // Load data on component mount
    useEffect(() => {
        loadData();
    }, [projectId, sectionId]);

    // Handle pagination
    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        console.log('Page changed to:', page);
    };

    // Calculate total cost
    const totalCost = equipment.reduce((sum, item) => sum + item.totalCost, 0);

    const formatPrice = (price: number): string => {
        return `₹${price.toLocaleString('en-IN')}`;
    };

    const getSectionName = (sectionId: string | undefined): string => {
        return sectionName || 'Unknown Section';
    };



    const totalPages = Math.ceil(totalCount / itemsPerPage);
    return (
        <SafeAreaView style={styles.container}>
            <Header
                selectedSection={null}
                onSectionSelect={() => { }}
                totalCost={totalCost}
                formatPrice={formatPrice}
                getSectionName={getSectionName}
                projectName={projectName}
                sectionName={`${sectionName} - Equipment`}
                projectId={projectId}
                sectionId={sectionId}
                onShowSectionPrompt={() => { }}
                hideSection={true}
            />

            {/* Action Button - Add Equipment */}
            <View style={actionStyles.stickyActionButtonsContainer}>
                <TouchableOpacity
                    style={[
                        actionStyles.addEquipmentButton,
                        isAddingEquipment && actionStyles.addEquipmentButtonDisabled
                    ]}
                    onPress={() => setShowEquipmentForm(true)}
                    activeOpacity={0.7}
                    disabled={isAddingEquipment}
                >
                    {isAddingEquipment ? (
                        <Animated.View
                            style={{
                                transform: [
                                    {
                                        rotate: loadingAnimation.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: ['0deg', '360deg'],
                                        }),
                                    },
                                ],
                            }}
                        >
                            <Ionicons name="sync" size={20} color="#94A3B8" />
                        </Animated.View>
                    ) : (
                        <Ionicons name="construct-outline" size={20} color="#F59E0B" />
                    )}
                    <Text style={[
                        actionStyles.addEquipmentButtonText,
                        isAddingEquipment && actionStyles.addEquipmentButtonTextDisabled
                    ]}>
                        {isAddingEquipment ? 'Adding...' : 'Add Equipment'}
                    </Text>
                </TouchableOpacity>
            </View>

            <EquipmentFormModal
                visible={showEquipmentForm}
                onClose={() => setShowEquipmentForm(false)}
                onSubmit={handleAddEquipmentEntries}
                projectId={projectId}
                projectName={projectName}
                sectionId={sectionId}
                sectionName={sectionName}
            />

            <ScrollView
                ref={scrollViewRef}
                style={styles.scrollContainer}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#F59E0B']}
                        tintColor="#F59E0B"
                    />
                }
            >
                {/* Equipment Entries Display */}
                {loading ? (
                    <View style={styles.noMaterialsContainer}>
                        <Animated.View style={{
                            transform: [{
                                rotate: cardAnimations[0]?.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: ['0deg', '360deg'],
                                }) || '0deg'
                            }]
                        }}>
                            <Ionicons name="sync" size={48} color="#F59E0B" />
                        </Animated.View>
                        <Text style={styles.noMaterialsTitle}>Loading Equipment...</Text>
                        <Text style={styles.noMaterialsDescription}>
                            Please wait while we fetch your data...
                        </Text>
                    </View>
                ) : equipment.length > 0 ? (
                    // Display equipment entries grouped by date
                    (() => {
                        const groupedByDate = getGroupedByDate();
                        
                        return groupedByDate.map((dateGroup, dateIndex) => (
                            <View key={dateGroup.date} style={dateGroupStyles.dateGroupContainer}>
                                {/* Date Header */}
                                <View style={dateGroupStyles.dateHeader}>
                                    <View style={dateGroupStyles.dateHeaderLeft}>
                                        <Ionicons name="construct-outline" size={16} color="#64748B" />
                                        <Text style={dateGroupStyles.materialCountText}>
                                            {dateGroup.equipment.length} {dateGroup.equipment.length === 1 ? 'Entry' : 'Entries'}
                                        </Text>
                                    </View>
                                    <View style={dateGroupStyles.dateHeaderRight}>
                                        <Text style={dateGroupStyles.dateHeaderText}>
                                            {formatDateHeader(dateGroup.date)}
                                        </Text>
                                        <Ionicons name="calendar-outline" size={16} color="#64748B" />
                                    </View>
                                </View>

                                {/* Equipment entries for this date */}
                                {dateGroup.equipment.map((item: Equipment, index: number) => (
                                    <EquipmentCard
                                        key={`${dateGroup.date}-${item._id}-${index}`}
                                        equipment={item}
                                        animation={cardAnimations[dateIndex * 10 + index] || new Animated.Value(1)}
                                        onDelete={() => deleteEquipment(item._id)}
                                    />
                                ))}
                            </View>
                        ));
                    })()
                ) : (
                    <View style={styles.noMaterialsContainer}>
                        <Ionicons name="construct-outline" size={64} color="#CBD5E1" />
                        <Text style={styles.noMaterialsTitle}>No Equipment Found</Text>
                        <Text style={styles.noMaterialsDescription}>
                            No equipment entries found for this section. Add some equipment to get started.
                        </Text>
                    </View>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <View style={paginationStyles.paginationContainer}>
                        <TouchableOpacity
                            style={[paginationStyles.paginationButton, currentPage === 1 && paginationStyles.paginationButtonDisabled]}
                            onPress={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                        >
                            <Ionicons name="chevron-back" size={16} color={currentPage === 1 ? "#CBD5E1" : "#F59E0B"} />
                        </TouchableOpacity>

                        <View style={paginationStyles.pageNumbers}>
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let page;
                                if (totalPages <= 5) {
                                    page = i + 1;
                                } else if (currentPage <= 3) {
                                    page = i + 1;
                                } else if (currentPage >= totalPages - 2) {
                                    page = totalPages - 4 + i;
                                } else {
                                    page = currentPage - 2 + i;
                                }

                                return (
                                    <TouchableOpacity
                                        key={page}
                                        style={[
                                            paginationStyles.pageNumber,
                                            currentPage === page && paginationStyles.pageNumberActive
                                        ]}
                                        onPress={() => handlePageChange(page)}
                                    >
                                        <Text style={[
                                            paginationStyles.pageNumberText,
                                            currentPage === page && paginationStyles.pageNumberTextActive
                                        ]}>
                                            {page}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        <TouchableOpacity
                            style={[paginationStyles.paginationButton, currentPage === totalPages && paginationStyles.paginationButtonDisabled]}
                            onPress={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                        >
                            <Ionicons name="chevron-forward" size={16} color={currentPage === totalPages ? "#CBD5E1" : "#F59E0B"} />
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>

            {/* Loading Overlay */}
            {isAddingEquipment && (
                <View style={loadingStyles.loadingOverlay}>
                    <View style={loadingStyles.loadingContainer}>
                        <Animated.View
                            style={[
                                loadingStyles.loadingSpinner,
                                {
                                    transform: [
                                        {
                                            rotate: loadingAnimation.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: ['0deg', '360deg'],
                                            }),
                                        },
                                    ],
                                },
                            ]}
                        >
                            <Ionicons name="construct" size={48} color="#F59E0B" />
                        </Animated.View>
                        <Text style={loadingStyles.loadingTitle}>Adding Equipment</Text>
                        <Text style={loadingStyles.loadingSubtitle}>Please wait while we process your request...</Text>
                        
                        {/* Progress dots animation */}
                        <View style={loadingStyles.dotsContainer}>
                            <Animated.View
                                style={[
                                    loadingStyles.dot,
                                    {
                                        opacity: loadingAnimation.interpolate({
                                            inputRange: [0, 0.33, 0.66, 1],
                                            outputRange: [0.3, 1, 0.3, 0.3],
                                        }),
                                    },
                                ]}
                            />
                            <Animated.View
                                style={[
                                    loadingStyles.dot,
                                    {
                                        opacity: loadingAnimation.interpolate({
                                            inputRange: [0, 0.33, 0.66, 1],
                                            outputRange: [0.3, 0.3, 1, 0.3],
                                        }),
                                    },
                                ]}
                            />
                            <Animated.View
                                style={[
                                    loadingStyles.dot,
                                    {
                                        opacity: loadingAnimation.interpolate({
                                            inputRange: [0, 0.33, 0.66, 1],
                                            outputRange: [0.3, 0.3, 0.3, 1],
                                        }),
                                    },
                                ]}
                            />
                        </View>
                    </View>
                </View>
            )}
        </SafeAreaView>
    );
};

export default EquipmentManagement;

// Styles
const actionStyles = StyleSheet.create({
    stickyActionButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        gap: 8,
        flexWrap: 'wrap',
    },
    addEquipmentButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF3C7',
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FDE68A',
        gap: 8,
        justifyContent: 'center',
        minWidth: 180,
        flex: 0.8,
    },
    addEquipmentButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#F59E0B',
    },
    addEquipmentButtonDisabled: {
        backgroundColor: '#F1F5F9',
        borderColor: '#E2E8F0',
        opacity: 0.7,
    },
    addEquipmentButtonTextDisabled: {
        color: '#94A3B8',
    },
});

const dateGroupStyles = StyleSheet.create({
    dateGroupContainer: {
        marginBottom: 16,
    },
    dateHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: '#F8FAFC',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    dateHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    dateHeaderRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    materialCountText: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '600',
    },
    dateHeaderText: {
        fontSize: 13,
        color: '#1E293B',
        fontWeight: '600',
    },
});

const equipmentCardStyles = StyleSheet.create({
    equipmentCard: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: 20,
        marginVertical: 8,
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    equipmentHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    equipmentIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    equipmentInfo: {
        flex: 1,
    },
    equipmentName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 2,
    },
    equipmentCategory: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 4,
    },
    deleteButton: {
        padding: 8,
    },
    equipmentDetails: {
        gap: 8,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    detailLabel: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500',
    },
    detailValue: {
        fontSize: 14,
        color: '#1F2937',
        fontWeight: '600',
    },
    totalCost: {
        color: '#F59E0B',
        fontSize: 16,
    },
    notesContainer: {
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    notesText: {
        fontSize: 14,
        color: '#4B5563',
        marginTop: 4,
        lineHeight: 20,
    },
    equipmentFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    dateText: {
        fontSize: 12,
        color: '#9CA3AF',
    },
});

const paginationStyles = StyleSheet.create({
    paginationContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 20,
        paddingHorizontal: 20,
        gap: 12,
    },
    paginationButton: {
        width: 36,
        height: 36,
        borderRadius: 8,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    paginationButtonDisabled: {
        backgroundColor: '#F1F5F9',
        borderColor: '#E2E8F0',
    },
    pageNumbers: {
        flexDirection: 'row',
        gap: 4,
    },
    pageNumber: {
        width: 36,
        height: 36,
        borderRadius: 8,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    pageNumberActive: {
        backgroundColor: '#F59E0B',
        borderColor: '#F59E0B',
    },
    pageNumberText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748B',
    },
    pageNumberTextActive: {
        color: '#FFFFFF',
    },
});

const loadingStyles = StyleSheet.create({
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    loadingContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 32,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 8,
        minWidth: 280,
    },
    loadingSpinner: {
        marginBottom: 20,
    },
    loadingTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 8,
        textAlign: 'center',
    },
    loadingSubtitle: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
    },
    dotsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#F59E0B',
    },
});
