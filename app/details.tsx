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
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPeriod, setSelectedPeriod] = useState('Today');

    const periods = ['Today', '1 Week', '15 Days', '1 Month', 'Custom'];

    const getCurrentData = () => {
        return activeTab === 'imported' ? importedMaterials : usedMaterials;
    };

    const filteredMaterials = getCurrentData().filter(material =>
        material.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalMaterials = filteredMaterials.length;
    const totalCost = filteredMaterials.reduce((sum, material) => sum + material.price, 0);

    const getCategoryColor = (category: string) => {
        const colors = {
            foundation: '#8B5CF6',
            walls: '#EF4444',
            electrical: '#F59E0B',
            plumbing: '#3B82F6',
            roofing: '#7C2D12',
            structure: '#92400E',
        };
        return colors[category as keyof typeof colors] || '#6B7280';
    };

    const formatPrice = (price: number) => {
        return `₹${price.toLocaleString('en-IN')}`;
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            {/* Header */}
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

            {/* Table Header */}
            <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, { flex: 3 }]}>Material</Text>
                <Text style={[styles.tableHeaderText, { flex: 2 }]}>Quantity</Text>
                <Text style={[styles.tableHeaderText, { flex: 2 }]}>Price</Text>
            </View>

            {/* Materials List */}
            <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
                {filteredMaterials.map((material, index) => (
                    <View key={material.id} style={styles.materialRow}>
                        <View style={[styles.materialName, { flex: 3 }]}>
                            <View style={[styles.iconContainer, { backgroundColor: material.color + '20' }]}>
                                <Ionicons name={material.icon} size={20} color={material.color} />
                            </View>
                            <View style={styles.materialInfo}>
                                <Text style={styles.materialNameText}>{material.name}</Text>
                                <View style={[styles.categoryTag, { backgroundColor: material.color }]}>
                                    <Text style={styles.categoryText}>{material.category}</Text>
                                </View>
                            </View>
                        </View>

                        <View style={[styles.quantityContainer, { flex: 2 }]}>
                            <Text style={styles.quantityNumber}>{material.quantity}</Text>
                            <Text style={styles.quantityUnit}>{material.unit}</Text>
                        </View>

                        <View style={[styles.priceContainer, { flex: 2 }]}>
                            <Text style={styles.priceText}>{formatPrice(material.price)}</Text>
                            <Text style={styles.dateText}>{material.date}</Text>
                        </View>
                    </View>
                ))}
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
    tableHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#9CA3AF',
        marginHorizontal: 20,
        borderRadius: 12,
        marginBottom: 4,
    },
    tableHeaderText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#fff',
        textAlign: 'left',
    },
    listContainer: {
        flex: 1,
        paddingHorizontal: 20,
    },
    materialRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 20,
        paddingHorizontal: 20,
        backgroundColor: '#fff',
        marginBottom: 2,
        borderRadius: 0,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    materialText: {
        fontSize: 14,
        color: '#000',
        textAlign: 'center',
    },
    materialName: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingRight: 16,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    materialInfo: {
        flex: 1,
    },
    materialNameText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
        marginBottom: 6,
    },
    categoryTag: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 16,
        alignSelf: 'flex-start',
    },
    categoryText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#fff',
        textTransform: 'capitalize',
    },
    quantityContainer: {
        alignItems: 'flex-start',
        paddingRight: 16,
    },
    quantityNumber: {
        fontSize: 18,
        fontWeight: '700',
        color: '#000',
        marginBottom: 4,
    },
    quantityUnit: {
        fontSize: 13,
        color: '#6B7280',
        fontWeight: '500',
    },
    priceContainer: {
        alignItems: 'flex-start',
    },
    priceText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#000',
        marginBottom: 4,
    },
    dateText: {
        fontSize: 13,
        color: '#6B7280',
        fontWeight: '500',
    },
    editButton: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 8,
    },
});

export default MaterialsManager;