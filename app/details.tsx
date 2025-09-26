import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
    Animated,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';


// Types
interface Material {
    id: number;
    name: string;
    category: string;
    quantity: number;
    unit: string;
    price: number;
    date: string;
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
}

// Sample data for imported materials
const importedMaterials: Material[] = [
    {
        id: 1,
        name: 'Concrete',
        category: 'foundation',
        quantity: 10,
        unit: 'cubic meters',
        price: 25000,
        date: '15/1/2024',
        icon: 'cube-outline',
        color: '#8B5CF6',
    },
    {
        id: 2,
        name: 'Steel Rebar',
        category: 'foundation',
        quantity: 500,
        unit: 'kg',
        price: 45000,
        date: '15/1/2024',
        icon: 'barbell-outline',
        color: '#64748B',
    },
    {
        id: 3,
        name: 'Cement',
        category: 'foundation',
        quantity: 50,
        unit: 'bags',
        price: 15000,
        date: '14/1/2024',
        icon: 'bag-outline',
        color: '#6B7280',
    },
    {
        id: 4,
        name: 'Bricks',
        category: 'walls',
        quantity: 5000,
        unit: 'pieces',
        price: 12000,
        date: '14/1/2024',
        icon: 'grid-outline',
        color: '#DC2626',
    },
    {
        id: 5,
        name: 'Electrical Wiring',
        category: 'electrical',
        quantity: 500,
        unit: 'meters',
        price: 15000,
        date: '13/1/2024',
        icon: 'flash-outline',
        color: '#F59E0B',
    },
    {
        id: 6,
        name: 'PVC Pipes',
        category: 'plumbing',
        quantity: 200,
        unit: 'meters',
        price: 8000,
        date: '13/1/2024',
        icon: 'water-outline',
        color: '#3B82F6',
    },
    {
        id: 7,
        name: 'Paint',
        category: 'walls',
        quantity: 20,
        unit: 'liters',
        price: 6500,
        date: '12/1/2024',
        icon: 'color-palette-outline',
        color: '#EF4444',
    },
    {
        id: 8,
        name: 'Wood Timber',
        category: 'structure',
        quantity: 50,
        unit: 'pieces',
        price: 35000,
        date: '12/1/2024',
        icon: 'leaf-outline',
        color: '#92400E',
    },
    {
        id: 9,
        name: 'Roofing Tiles',
        category: 'roofing',
        quantity: 500,
        unit: 'pieces',
        price: 25000,
        date: '11/1/2024',
        icon: 'home-outline',
        color: '#7C2D12',
    },
    {
        id: 10,
        name: 'Insulation',
        category: 'walls',
        quantity: 100,
        unit: 'sq meters',
        price: 18000,
        date: '11/1/2024',
        icon: 'shield-outline',
        color: '#059669',
    },
];

// Sample data for used materials (subset of imported)
const usedMaterials: Material[] = [
    {
        id: 1,
        name: 'Concrete',
        category: 'foundation',
        quantity: 8,
        unit: 'cubic meters',
        price: 20000,
        date: '16/1/2024',
        icon: 'cube-outline',
        color: '#8B5CF6',
    },
    {
        id: 4,
        name: 'Bricks',
        category: 'walls',
        quantity: 3000,
        unit: 'pieces',
        price: 7200,
        date: '15/1/2024',
        icon: 'grid-outline',
        color: '#DC2626',
    },
    {
        id: 5,
        name: 'Electrical Wiring',
        category: 'electrical',
        quantity: 300,
        unit: 'meters',
        price: 9000,
        date: '14/1/2024',
        icon: 'flash-outline',
        color: '#F59E0B',
    },
];

const Details: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'imported' | 'used'>('imported');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPeriod, setSelectedPeriod] = useState('Today');
    const [searchModalVisible, setSearchModalVisible] = useState(false);

    const cardAnimations = useRef(importedMaterials.map(() => new Animated.Value(0))).current;
    const searchInputRef = useRef<TextInput>(null);

    const periods = ['Today', '1 Week', '15 Days', '1 Month', '3 Months', '6 Months', 'Custom'];

    React.useEffect(() => {
        // Animate cards on load
        const animations = cardAnimations.map((anim, index) =>
            Animated.timing(anim, {
                toValue: 1,
                duration: 300,
                delay: index * 100,
                useNativeDriver: true,
            })
        );
        Animated.stagger(50, animations).start();
    }, [cardAnimations]);

    React.useEffect(() => {
        if (searchModalVisible) {
            // Focus the search input when modal opens
            setTimeout(() => {
                searchInputRef.current?.focus();
            }, 100);
        }
    }, [searchModalVisible]);

    const getCurrentData = () => {
        return activeTab === 'imported' ? importedMaterials : usedMaterials;
    };

    const filteredMaterials = getCurrentData().filter(material =>
        material.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalCost = filteredMaterials.reduce((sum, material) => sum + material.price, 0);

    const formatPrice = (price: number) => {
        return `₹${price.toLocaleString('en-IN')}`;
    };

    // Helper function to get imported quantity for a material
    const getImportedQuantity = (material: Material) => {
        const importedMaterial = importedMaterials.find(m => m.id === material.id);
        return importedMaterial ? importedMaterial.quantity : 0;
    };

    // Helper function to get available quantity for a material
    const getAvailableQuantity = (material: Material) => {
        const importedMaterial = importedMaterials.find(m => m.id === material.id);
        const usedMaterial = usedMaterials.find(m => m.id === material.id);

        if (!importedMaterial) return 0;
        if (!usedMaterial) return importedMaterial.quantity;

        return importedMaterial.quantity - usedMaterial.quantity;
    };

    // Helper function to get availability percentage
    const getAvailabilityPercentage = (material: Material) => {
        const importedMaterial = importedMaterials.find(m => m.id === material.id);
        const usedMaterial = usedMaterials.find(m => m.id === material.id);

        if (!importedMaterial) return 0;
        if (!usedMaterial) return 100;

        const available = importedMaterial.quantity - usedMaterial.quantity;
        return Math.round((available / importedMaterial.quantity) * 100);
    };

    // Helper function to get quantity wasted
    const getQuantityWasted = (material: Material) => {
        const usedMaterial = usedMaterials.find(m => m.id === material.id);
        
        if (!usedMaterial) return 0;
        
        // Calculate wastage as 10% of used quantity (you can adjust this logic as needed)
        return Math.round(usedMaterial.quantity * 0.1);
    };

    // Handler for viewing material details
    const handleViewDetails = (material: Material) => {
        // Navigate to material details page with material ID and current tab context
        router.push({
            pathname: '/material-details/[id]' as const,
            params: {
                id: material.id.toString(),
                tab: activeTab, // Pass current tab context
                name: material.name,
                category: material.category,
                unit: material.unit
            }
        });
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            {/* Main Header - Fixed */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity onPress={() => { router.back() }} style={styles.backButton} activeOpacity={0.7}>
                        <Ionicons name="arrow-back" size={24} color="#000" />
                    </TouchableOpacity>
                    <View style={styles.projectInfo}>
                        <Text style={styles.projectName}>Villa Project</Text>
                        <Text style={styles.totalCostText}>{formatPrice(totalCost)}</Text>
                    </View>
                </View>
            </View>

            {/* Scrollable Content */}
            <ScrollView
                style={styles.scrollContainer}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Period Filters - Horizontal Scroll */}
                <View style={styles.periodSection}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.periodContainer}
                    >
                        {periods.map((period, index) => (
                            <TouchableOpacity
                                key={period}
                                style={[
                                    styles.periodButton,
                                    selectedPeriod === period && styles.periodButtonActive,
                                    index === 0 && styles.firstPeriodButton,
                                    index === periods.length - 1 && styles.lastPeriodButton
                                ]}
                                onPress={() => setSelectedPeriod(period)}
                                activeOpacity={0.8}
                            >
                                <Text style={[
                                    styles.periodText,
                                    selectedPeriod === period && styles.periodTextActive
                                ]}>
                                    {period}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Tab Selector */}
                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'imported' && styles.activeTab]}
                        onPress={() => setActiveTab('imported')}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="download-outline" size={16} color={activeTab === 'imported' ? '#000' : '#6B7280'} />
                        <Text style={[styles.tabText, activeTab === 'imported' && styles.activeTabText]}>
                            Material Availability
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'used' && styles.activeTab]}
                        onPress={() => setActiveTab('used')}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="trending-down-outline" size={16} color={activeTab === 'used' ? '#000' : '#6B7280'} />
                        <Text style={[styles.tabText, activeTab === 'used' && styles.activeTabText]}>
                            Material Used
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Materials List */}
                <View style={styles.materialsSection}>
                    <Text style={styles.sectionTitle}>
                        {activeTab === 'imported' ? 'Imported Materials' : 'Used Materials'}
                    </Text>
                    {filteredMaterials.map((material, index) => (
                        <Animated.View
                            key={material.id}
                            style={[
                                styles.materialCard,
                                {
                                    opacity: cardAnimations[index] || 1,
                                    transform: [{
                                        translateY: (cardAnimations[index] || new Animated.Value(1)).interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [50, 0],
                                        })
                                    }]
                                }
                            ]}
                        >
                            <TouchableOpacity activeOpacity={0.95}>
                                {/* Material Header */}
                                <View style={styles.materialHeader}>
                                    <View style={styles.materialTitleSection}>
                                        <View style={[styles.iconContainer, { backgroundColor: material.color + '20' }]}>
                                            <Ionicons name={material.icon} size={24} color={material.color} />
                                        </View>
                                        <View style={styles.materialTitleInfo}>
                                            <Text style={styles.materialNameText}>{material.name}</Text>
                                            <View style={[styles.categoryTag, { backgroundColor: material.color }]}>
                                                <Text style={styles.categoryText}>{material.category}</Text>
                                            </View>
                                        </View>
                                    </View>
                                    <View style={styles.dateContainer}>
                                        <Text style={styles.dateText}>{material.date}</Text>
                                        <TouchableOpacity style={styles.moreButton} activeOpacity={0.7}>
                                            <Ionicons name="ellipsis-vertical" size={16} color="#64748B" />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                {/* Simple Progress Bar */}
                                <View style={styles.simpleProgressContainer}>
                                    <View style={styles.progressBarWithLabels}>
                                        <View style={styles.progressStartLabel}>
                                            <Text style={styles.progressStartLabel}>
                                                {activeTab === 'imported' ? 'Available:' : 'Quantity Used:'}
                                            </Text>
                                            <Text style={styles.progressStartLabel}>
                                                {activeTab === 'imported' 
                                                    ? `${getAvailableQuantity(material)} ${material.unit}` 
                                                    : `${material.quantity} ${material.unit}`}
                                            </Text>
                                        </View>
                                        <View style={styles.progressBarBackground}>
                                            <View
                                                style={[
                                                    activeTab === 'imported' ? styles.progressBarFillGreen : styles.progressBarFillRed,
                                                    { width: activeTab === 'imported' 
                                                        ? `${getAvailabilityPercentage(material)}%` 
                                                        : '100%'}
                                                ]}
                                            />
                                        </View>

                                        <View style={styles.progressEndLabel}>
                                            <Text style={styles.progressEndLabel}>
                                                {activeTab === 'imported' ? 'Total:' : 'Quantity Wasted:'}
                                            </Text>
                                            <Text style={styles.progressEndLabel}>
                                                {activeTab === 'imported' 
                                                    ? `${getImportedQuantity(material)} ${material.unit}` 
                                                    : `${getQuantityWasted(material)} ${material.unit}`}
                                            </Text>
                                        </View>
                                    </View>
                                    <TouchableOpacity
                                        style={styles.viewDetailsButton}
                                        activeOpacity={0.7}
                                        onPress={() => handleViewDetails(material)}
                                    >
                                        <Text style={styles.viewDetailsButtonText}>
                                            {activeTab === 'imported' ? 'View Import History' : 'View Usage Details'}
                                        </Text>
                                        <Ionicons name="chevron-forward" size={16} color="#0EA5E9" />
                                    </TouchableOpacity>
                                </View>
                            </TouchableOpacity>
                        </Animated.View>
                    ))}
                </View>
            </ScrollView>

        </SafeAreaView>
    );
};

export default Details;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
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
    projectInfo: {
        flex: 1,
    },
    projectName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#000',
        marginBottom: 2,
    },
    totalCostText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#059669',
    },
    searchButton: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#F8FAFC',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-start',
        paddingTop: 100,
    },
    searchModal: {
        backgroundColor: '#fff',
        margin: 20,
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 10,
    },
    searchModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    searchModalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E293B',
    },
    closeButton: {
        padding: 4,
    },
    searchInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    searchIcon: {
        marginRight: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: '#000',
        fontWeight: '500',
    },
    searchResults: {
        marginTop: 16,
    },
    searchResultsTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748B',
    },
    scrollContainer: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 30,
    },
    periodSection: {
        marginTop: 16,
    },
    periodContainer: {
        paddingHorizontal: 15,
        paddingVertical: 8,
    },
    periodButton: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 20,
        backgroundColor: '#fff',
        marginHorizontal: 5,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    firstPeriodButton: {
        marginLeft: 0,
    },
    lastPeriodButton: {
        marginRight: 0,
    },
    periodButtonActive: {
        backgroundColor: '#000',
        borderColor: '#000',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
    },
    periodText: {
        color: '#6B7280',
        fontSize: 14,
        fontWeight: '600',
    },
    periodTextActive: {
        color: '#fff',
    },
    tabContainer: {
        flexDirection: 'row',
        marginHorizontal: 20,
        marginTop: 20,
        marginBottom: 20,
        backgroundColor: '#F1F5F9',
        borderRadius: 16,
        padding: 6,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 12,
    },
    activeTab: {
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    tabText: {
        marginLeft: 8,
        fontSize: 13,
        fontWeight: '600',
        color: '#6B7280',
    },
    activeTabText: {
        color: '#000',
    },
    materialsSection: {
        paddingHorizontal: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 16,
        paddingLeft: 4,
    },
    materialCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        marginBottom: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 6,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    materialHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    materialTitleSection: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    materialTitleInfo: {
        flex: 1,
    },
    materialNameText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 8,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.8)',
    },
    categoryTag: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        alignSelf: 'flex-start',
    },
    categoryText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#fff',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    dateContainer: {
        alignItems: 'flex-end',
    },
    dateText: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '600',
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        marginBottom: 8,
    },
    moreButton: {
        padding: 4,
    },
    materialDetails: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    detailItem: {
        flex: 1,
        alignItems: 'center',
    },
    detailLabel: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '600',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    detailValueContainer: {
        alignItems: 'center',
    },
    detailValue: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1E293B',
        marginBottom: 2,
    },
    detailUnit: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '600',
    },
    detailDivider: {
        width: 1,
        height: 40,
        backgroundColor: '#E2E8F0',
        marginHorizontal: 20,
    },
    priceValue: {
        fontSize: 20,
        fontWeight: '800',
        color: '#059669',
    },
    // Progress Section Styles
    materialProgressSection: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    progressInfoContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    progressLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748B',
        marginBottom: 4,
    },
    progressValues: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1F2937',
    },
    progressPercentageContainer: {
        backgroundColor: '#F0F9FF',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E0F2FE',
    },
    progressPercentage: {
        fontSize: 12,
        fontWeight: '700',
        color: '#0EA5E9',
    },
    progressBarContainer: {
        marginBottom: 16,
    },
    progressBarBackground: {
        flex: 1,
        height: 8,
        backgroundColor: '#F1F5F9',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#0EA5E9',
        borderRadius: 4,
    },
    viewDetailsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F0F9FF',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E0F2FE',
    },
    viewDetailsButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#0EA5E9',
        marginRight: 8,
    },
    // Progress Bar with Labels Styles
    progressBarWithLabels: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    progressStartLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#10B981',
        marginBottom: 4,
        alignItems: 'flex-start',
        marginRight: 12,
        minWidth: 80,
    },
    progressEndLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748B',
        marginBottom: 4,
        textAlign: 'right',
        alignItems: 'flex-end',
        marginLeft: 12,
        minWidth: 80,
    },
    progressLabelText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#64748B',
        marginBottom: 2,
        textTransform: 'uppercase',
    },
    progressLabelValue: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1F2937',
    },
    // Simple Progress Bar Styles
    simpleProgressContainer: {
        padding: 16,
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    progressBarFillGreen: {
        height: '100%',
        backgroundColor: '#10B981',
        borderRadius: 4,
    },
    progressBarFillRed: {
        height: '100%',
        backgroundColor: '#EF4444',
        borderRadius: 4,
    },
});