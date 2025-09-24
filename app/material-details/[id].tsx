import React, { useState } from 'react';
import {
    View,
    Text,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    Alert,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

// Types for material details
interface MaterialImportRecord {
    id: number;
    date: string;
    quantity: number;
    unit: string;
    totalCost: number;
    perUnitCost: number;
    supplier: string;
    invoiceNumber: string;
}

interface MaterialUsageRecord {
    id: number;
    date: string;
    quantityUsed: number;
    unit: string;
    wastage: number;
    workArea: string;
    contractor: string;
}

interface MaterialDetailsParams {
    id: string;
    tab: 'imported' | 'used';
    name: string;
    category: string;
    unit: string;
}

const MaterialDetails: React.FC = () => {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { id, tab, name, category, unit } = params;
    
    // Ensure parameters are strings
    const materialId = Array.isArray(id) ? id[0] : id;
    const materialTab = Array.isArray(tab) ? tab[0] : tab;
    const materialName = Array.isArray(name) ? name[0] : name;
    const materialCategory = Array.isArray(category) ? category[0] : category;
    const materialUnit = Array.isArray(unit) ? unit[0] : unit;

    const [activeTab, setActiveTab] = useState<'import' | 'usage'>(materialTab === 'imported' ? 'import' : 'usage');

    // Mock data for import records
    const importRecords: MaterialImportRecord[] = [
        {
            id: 1,
            date: '15/01/2024',
            quantity: 10,
            unit: materialUnit || 'cubic meters',
            totalCost: 25000,
            perUnitCost: 2500,
            supplier: 'ABC Construction Supplies',
            invoiceNumber: 'INV-2024-001'
        },
        {
            id: 2,
            date: '20/01/2024',
            quantity: 5,
            unit: materialUnit || 'cubic meters',
            totalCost: 12500,
            perUnitCost: 2500,
            supplier: 'XYZ Building Materials',
            invoiceNumber: 'INV-2024-002'
        },
        {
            id: 3,
            date: '05/02/2024',
            quantity: 8,
            unit: materialUnit || 'cubic meters',
            totalCost: 20000,
            perUnitCost: 2500,
            supplier: 'ABC Construction Supplies',
            invoiceNumber: 'INV-2024-003'
        }
    ];

    // Mock data for usage records
    const usageRecords: MaterialUsageRecord[] = [
        {
            id: 1,
            date: '16/01/2024',
            quantityUsed: 3,
            unit: materialUnit || 'cubic meters',
            wastage: 0.2,
            workArea: 'Foundation',
            contractor: 'John Construction'
        },
        {
            id: 2,
            date: '18/01/2024',
            quantityUsed: 2.5,
            unit: materialUnit || 'cubic meters',
            wastage: 0.1,
            workArea: 'Foundation',
            contractor: 'John Construction'
        },
        {
            id: 3,
            date: '22/01/2024',
            quantityUsed: 4,
            unit: materialUnit || 'cubic meters',
            wastage: 0.3,
            workArea: 'Columns',
            contractor: 'Smith Builders'
        },
        {
            id: 4,
            date: '25/01/2024',
            quantityUsed: 1.5,
            unit: materialUnit || 'cubic meters',
            wastage: 0.05,
            workArea: 'Beams',
            contractor: 'John Construction'
        }
    ];

    const formatPrice = (price: number) => {
        return `₹${price.toLocaleString('en-IN')}`;
    };

    const getTotalImported = () => {
        return importRecords.reduce((sum, record) => sum + record.quantity, 0);
    };

    const getTotalUsed = () => {
        return usageRecords.reduce((sum, record) => sum + record.quantityUsed, 0);
    };

    const getTotalWastage = () => {
        return usageRecords.reduce((sum, record) => sum + record.wastage, 0);
    };

    const getAverageCost = () => {
        const totalCost = importRecords.reduce((sum, record) => sum + record.totalCost, 0);
        const totalQuantity = getTotalImported();
        return totalQuantity > 0 ? totalCost / totalQuantity : 0;
    };

    const renderImportTable = () => (
        <View style={styles.tableContainer}>
            <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, styles.tableCellDate]}>Date</Text>
                <Text style={[styles.tableHeaderText, styles.tableCellQuantity]}>Quantity</Text>
                <Text style={[styles.tableHeaderText, styles.tableCellCost]}>Total Cost</Text>
                <Text style={[styles.tableHeaderText, styles.tableCellUnitCost]}>Unit Cost</Text>
                <Text style={[styles.tableHeaderText, styles.tableCellSupplier]}>Supplier</Text>
            </View>
            
            <ScrollView style={styles.tableBody}>
                {importRecords.map((record) => (
                    <View key={record.id} style={styles.tableRow}>
                        <Text style={[styles.tableCellText, styles.tableCellDate]}>{record.date}</Text>
                        <Text style={[styles.tableCellText, styles.tableCellQuantity]}>
                            {record.quantity} {record.unit}
                        </Text>
                        <Text style={[styles.tableCellText, styles.tableCellCost]}>
                            {formatPrice(record.totalCost)}
                        </Text>
                        <Text style={[styles.tableCellText, styles.tableCellUnitCost]}>
                            {formatPrice(record.perUnitCost)}
                        </Text>
                        <Text style={[styles.tableCellText, styles.tableCellSupplier]} numberOfLines={1}>
                            {record.supplier}
                        </Text>
                    </View>
                ))}
            </ScrollView>
        </View>
    );

    const renderUsageTable = () => (
        <View style={styles.tableContainer}>
            <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, styles.tableCellDate]}>Date</Text>
                <Text style={[styles.tableHeaderText, styles.tableCellUsage]}>Used</Text>
                <Text style={[styles.tableHeaderText, styles.tableCellWastage]}>Wastage</Text>
                <Text style={[styles.tableHeaderText, styles.tableCellWorkArea]}>Work Area</Text>
                <Text style={[styles.tableHeaderText, styles.tableCellContractor]}>Contractor</Text>
            </View>
            
            <ScrollView style={styles.tableBody}>
                {usageRecords.map((record) => (
                    <View key={record.id} style={styles.tableRow}>
                        <Text style={[styles.tableCellText, styles.tableCellDate]}>{record.date}</Text>
                        <Text style={[styles.tableCellText, styles.tableCellUsage]}>
                            {record.quantityUsed} {record.unit}
                        </Text>
                        <Text style={[styles.tableCellText, styles.tableCellWastage]}>
                            {record.wastage} {record.unit}
                        </Text>
                        <Text style={[styles.tableCellText, styles.tableCellWorkArea]} numberOfLines={1}>
                            {record.workArea}
                        </Text>
                        <Text style={[styles.tableCellText, styles.tableCellContractor]} numberOfLines={1}>
                            {record.contractor}
                        </Text>
                    </View>
                ))}
            </ScrollView>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Text style={styles.materialName}>{materialName}</Text>
                    <Text style={styles.materialCategory}>{materialCategory}</Text>
                </View>
            </View>

            {/* Summary Cards */}
            <View style={styles.summaryContainer}>
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryLabel}>Total Imported</Text>
                    <Text style={styles.summaryValue}>{getTotalImported()} {materialUnit}</Text>
                </View>
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryLabel}>Total Used</Text>
                    <Text style={styles.summaryValue}>{getTotalUsed()} {materialUnit}</Text>
                </View>
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryLabel}>Total Wastage</Text>
                    <Text style={styles.summaryValue}>{getTotalWastage()} {materialUnit}</Text>
                </View>
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryLabel}>Avg. Cost</Text>
                    <Text style={styles.summaryValue}>{formatPrice(getAverageCost())}/{materialUnit}</Text>
                </View>
            </View>

            {/* Tab Selector */}
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'import' && styles.activeTab]}
                    onPress={() => setActiveTab('import')}
                >
                    <Text style={[styles.tabText, activeTab === 'import' && styles.activeTabText]}>
                        Import History
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'usage' && styles.activeTab]}
                    onPress={() => setActiveTab('usage')}
                >
                    <Text style={[styles.tabText, activeTab === 'usage' && styles.activeTabText]}>
                        Daily Usage
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Table Content */}
            <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
                {activeTab === 'import' ? renderImportTable() : renderUsageTable()}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    backButton: {
        padding: 8,
        marginRight: 16,
    },
    headerContent: {
        flex: 1,
    },
    materialName: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 4,
    },
    materialCategory: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748B',
        textTransform: 'capitalize',
    },
    summaryContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 20,
        paddingVertical: 16,
        gap: 12,
    },
    summaryCard: {
        flex: 1,
        minWidth: Dimensions.get('window').width / 2 - 32,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    summaryLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748B',
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    summaryValue: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
    },
    tabContainer: {
        flexDirection: 'row',
        marginHorizontal: 20,
        marginBottom: 20,
        backgroundColor: '#F1F5F9',
        borderRadius: 16,
        padding: 6,
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
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
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
    },
    activeTabText: {
        color: '#000',
    },
    contentContainer: {
        flex: 1,
        paddingHorizontal: 20,
    },
    tableContainer: {
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        overflow: 'hidden',
        marginBottom: 20,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#F8FAFC',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    tableHeaderText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#374151',
        textTransform: 'uppercase',
    },
    tableBody: {
        maxHeight: 400,
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        paddingHorizontal: 16,
        paddingVertical: 12,
        alignItems: 'center',
    },
    tableCellText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#1F2937',
    },
    tableCellDate: {
        width: 80,
    },
    tableCellQuantity: {
        width: 80,
        textAlign: 'center',
    },
    tableCellCost: {
        width: 80,
        textAlign: 'center',
    },
    tableCellUnitCost: {
        width: 70,
        textAlign: 'center',
    },
    tableCellSupplier: {
        flex: 1,
        textAlign: 'left',
    },
    tableCellUsage: {
        width: 70,
        textAlign: 'center',
    },
    tableCellWastage: {
        width: 70,
        textAlign: 'center',
    },
    tableCellWorkArea: {
        width: 80,
        textAlign: 'left',
    },
    tableCellContractor: {
        flex: 1,
        textAlign: 'left',
    },
});

export default MaterialDetails;
