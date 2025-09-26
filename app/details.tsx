import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
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

const MaterialsManager: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'imported' | 'used'>('imported');
    const [selectedPeriod, setSelectedPeriod] = useState('Today');
    const [searchQuery, setSearchQuery] = useState('');

    const periods = ['Today', '1 Week', '15 Days', '1 Month', 'Custom'];

    // Get current materials based on active tab
    const currentMaterials = activeTab === 'imported' ? importedMaterials : usedMaterials;
    
    // Filter materials based on search query
    const filteredMaterials = currentMaterials.filter(material => 
        material.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        material.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    // Calculate totals
    const totalMaterials = filteredMaterials.length;
    const totalCost = filteredMaterials.reduce((sum, material) => sum + material.price, 0);
    
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
        const importedMaterial = importedMaterials.find(m => m.id === material.id);
        const usedMaterial = usedMaterials.find(m => m.id === material.id);
        
        if (!importedMaterial || !usedMaterial) return 0;
        
        // Calculate wastage as 10% of used quantity (you can adjust this logic as needed)
        return Math.round(usedMaterial.quantity * 0.1);
    };
    
    // Helper function to get category color
    const getCategoryColor = (category: string) => {
        const colors = {
            foundation: '#8B5CF6',
            walls: '#DC2626',
            electrical: '#F59E0B',
            plumbing: '#3B82F6',
            structure: '#92400E',
            roofing: '#7C2D12',
        };
        return colors[category as keyof typeof colors] || '#6B7280';
    };

    const formatPrice = (price: number) => {
        return `₹${price.toLocaleString('en-IN')}`;
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            {/* Header - Fixed */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Ionicons name="stats-chart-outline" size={24} color="#000" />
                    <Text style={styles.headerTitle}>Materials Manager</Text>
                </View>
                <TouchableOpacity style={styles.addButton}>
                    <Ionicons name="add" size={20} color="#fff" />
                    <Text style={styles.addButtonText}>Add</Text>
                </TouchableOpacity>
            </View>

            {/* Scrollable Content */}
            <ScrollView
                style={styles.scrollContainer}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <Ionicons name="search-outline" size={20} color="#9CA3AF" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search materials..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                {/* Period Filters */}
                <View style={styles.periodContainer}>
                    {periods.map((period) => (
                        <TouchableOpacity
                            key={period}
                            style={[
                                styles.periodButton,
                                selectedPeriod === period && styles.periodButtonActive
                            ]}
                            onPress={() => setSelectedPeriod(period)}
                        >
                            <Text style={[
                                styles.periodText,
                                selectedPeriod === period && styles.periodTextActive
                            ]}>
                                {period}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Tab Selector */}
                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'imported' && styles.activeTab]}
                        onPress={() => setActiveTab('imported')}
                    >
                        <Ionicons name="download-outline" size={16} color={activeTab === 'imported' ? '#000' : '#6B7280'} />
                        <Text style={[styles.tabText, activeTab === 'imported' && styles.activeTabText]}>
                            Total Material Imported
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'used' && styles.activeTab]}
                        onPress={() => setActiveTab('used')}
                    >
                        <Ionicons name="trending-down-outline" size={16} color={activeTab === 'used' ? '#000' : '#6B7280'} />
                        <Text style={[styles.tabText, activeTab === 'used' && styles.activeTabText]}>
                            Total Material Used
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Summary Cards */}
                <View style={styles.summaryContainer}>
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryLabel}>Total Materials</Text>
                        <Text style={styles.summaryValue}>{totalMaterials}</Text>
                    </View>
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryLabel}>Total Cost</Text>
                        <Text style={styles.summaryValue}>{formatPrice(totalCost)}</Text>
                    </View>
                </View>

                {/* Materials List */}
                <View style={styles.materialsSection}>
                    {filteredMaterials.map((material, index) => (
                        <View key={material.id} style={styles.materialCard}>
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
                                <Text style={styles.dateText}>{material.date}</Text>
                            </View>

                            {/* Material Details */}
                            <View style={styles.materialDetails}>
                                <View style={styles.detailItem}>
                                    <Text style={styles.detailLabel}>
                                        {activeTab === 'imported' ? 'Quantity' : 'Quantity Used'}
                                    </Text>
                                    <View style={styles.detailValueContainer}>
                                        <Text style={styles.detailValue}>{material.quantity}</Text>
                                        <Text style={styles.detailUnit}>{material.unit}</Text>
                                    </View>
                                </View>

                                <View style={styles.detailDivider} />

                                <View style={styles.detailItem}>
                                    <Text style={styles.detailLabel}>
                                        {activeTab === 'imported' ? 'Total Price' : 'Quantity Wasted'}
                                    </Text>
                                    <Text style={activeTab === 'imported' ? styles.priceValue : styles.wastedValue}>
                                        {activeTab === 'imported' 
                                            ? formatPrice(material.price) 
                                            : `${getQuantityWasted(material)} ${material.unit}`}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        backgroundColor: '#fff',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '600',
        marginLeft: 8,
        color: '#000',
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#000',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    addButtonText: {
        color: '#fff',
        marginLeft: 4,
        fontWeight: '500',
    },
    scrollContainer: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 30,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 20,
        marginTop: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    searchIcon: {
        marginRight: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#000',
    },
    periodContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 16,
        justifyContent: 'space-between',
    },
    periodButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 16,
        backgroundColor: '#F3F4F6',
        minWidth: 60,
        alignItems: 'center',
    },
    periodButtonActive: {
        backgroundColor: '#000',
    },
    periodText: {
        color: '#6B7280',
        fontSize: 12,
        fontWeight: '500',
    },
    periodTextActive: {
        color: '#fff',
    },
    tabContainer: {
        flexDirection: 'row',
        marginHorizontal: 20,
        marginBottom: 20,
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        padding: 4,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    activeTab: {
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    tabText: {
        marginLeft: 8,
        fontSize: 14,
        fontWeight: '500',
        color: '#6B7280',
    },
    activeTabText: {
        color: '#000',
    },
    summaryContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    summaryCard: {
        flex: 1,
        backgroundColor: '#F9FAFB',
        padding: 20,
        borderRadius: 12,
        marginHorizontal: 4,
    },
    summaryLabel: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 8,
        fontWeight: '500',
    },
    summaryValue: {
        fontSize: 24,
        fontWeight: '700',
        color: '#000',
    },
    materialsSection: {
        paddingHorizontal: 20,
        backgroundColor: '#F8FAFC',
        paddingTop: 16,
    },
    materialCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        marginBottom: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
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
        fontSize: 12,
        fontWeight: '600',
        color: '#fff',
        textTransform: 'capitalize',
    },
    dateText: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '500',
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
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
        fontSize: 14,
        color: '#64748B',
        fontWeight: '500',
        marginBottom: 8,
    },
    detailValueContainer: {
        alignItems: 'center',
    },
    detailValue: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 2,
    },
    detailUnit: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '500',
    },
    detailDivider: {
        width: 1,
        height: 40,
        backgroundColor: '#E2E8F0',
        marginHorizontal: 20,
    },
    priceValue: {
        fontSize: 20,
        fontWeight: '700',
        color: '#059669',
    },
    wastedValue: {
        fontSize: 20,
        fontWeight: '700',
        color: '#DC2626',
    },
    editButton: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 8,
    },
});

export default MaterialsManager;