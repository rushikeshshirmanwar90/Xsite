import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MaterialCardEnhanced from '@/components/details/MaterialCardEnhanced';

// Sample material data (7 materials)
const sampleMaterials = [
    {
        id: 1,
        _id: 'mat_001',
        name: 'Cement',
        quantity: 50,
        unit: 'bags',
        price: 500,
        date: new Date().toLocaleDateString(),
        icon: 'cube-outline' as keyof typeof import('@expo/vector-icons').Ionicons.glyphMap,
        color: '#8B5CF6',
        specs: { grade: 'OPC 53', brand: 'UltraTech' },
        totalQuantity: 50,
        totalCost: 25000,
        totalUsed: 0,
        totalImported: 50,
        variants: []
    },
    {
        id: 2,
        _id: 'mat_002',
        name: 'Steel Rods',
        quantity: 100,
        unit: 'pieces',
        price: 800,
        date: new Date().toLocaleDateString(),
        icon: 'barbell-outline' as keyof typeof import('@expo/vector-icons').Ionicons.glyphMap,
        color: '#6B7280',
        specs: { diameter: '12mm', grade: 'Fe500' },
        totalQuantity: 100,
        totalCost: 80000,
        totalUsed: 0,
        totalImported: 100,
        variants: []
    },
    {
        id: 3,
        _id: 'mat_003',
        name: 'Bricks',
        quantity: 1000,
        unit: 'pieces',
        price: 8,
        date: new Date().toLocaleDateString(),
        icon: 'square-outline' as keyof typeof import('@expo/vector-icons').Ionicons.glyphMap,
        color: '#EF4444',
        specs: { type: 'Red Clay', size: '9x4x3 inches' },
        totalQuantity: 1000,
        totalCost: 8000,
        totalUsed: 0,
        totalImported: 1000,
        variants: []
    },
    {
        id: 4,
        _id: 'mat_004',
        name: 'Sand',
        quantity: 10,
        unit: 'cubic meters',
        price: 1200,
        date: new Date().toLocaleDateString(),
        icon: 'layers-outline' as keyof typeof import('@expo/vector-icons').Ionicons.glyphMap,
        color: '#F59E0B',
        specs: { type: 'River Sand', grade: 'Fine' },
        totalQuantity: 10,
        totalCost: 12000,
        totalUsed: 0,
        totalImported: 10,
        variants: []
    },
    {
        id: 5,
        _id: 'mat_005',
        name: 'Gravel',
        quantity: 15,
        unit: 'cubic meters',
        price: 1500,
        date: new Date().toLocaleDateString(),
        icon: 'diamond-outline' as keyof typeof import('@expo/vector-icons').Ionicons.glyphMap,
        color: '#10B981',
        specs: { size: '20mm', type: 'Crushed Stone' },
        totalQuantity: 15,
        totalCost: 22500,
        totalUsed: 0,
        totalImported: 15,
        variants: []
    },
    {
        id: 6,
        _id: 'mat_006',
        name: 'Paint',
        quantity: 20,
        unit: 'liters',
        price: 350,
        date: new Date().toLocaleDateString(),
        icon: 'color-palette-outline' as keyof typeof import('@expo/vector-icons').Ionicons.glyphMap,
        color: '#EC4899',
        specs: { type: 'Emulsion', color: 'White', brand: 'Asian Paints' },
        totalQuantity: 20,
        totalCost: 7000,
        totalUsed: 0,
        totalImported: 20,
        variants: []
    },
    {
        id: 7,
        _id: 'mat_007',
        name: 'Tiles',
        quantity: 200,
        unit: 'pieces',
        price: 45,
        date: new Date().toLocaleDateString(),
        icon: 'grid-outline' as keyof typeof import('@expo/vector-icons').Ionicons.glyphMap,
        color: '#06B6D4',
        specs: { size: '2x2 feet', type: 'Ceramic', finish: 'Glossy' },
        totalQuantity: 200,
        totalCost: 9000,
        totalUsed: 0,
        totalImported: 200,
        variants: []
    }
];

const TestMaterials = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(3); // Show 3 items per page to demonstrate pagination
    const [loading, setLoading] = useState(false);
    const scrollViewRef = useRef<ScrollView>(null);
    const cardAnimations = useRef<Animated.Value[]>([]).current;

    // Initialize animations
    useEffect(() => {
        cardAnimations.splice(0);
        for (let i = 0; i < sampleMaterials.length; i++) {
            cardAnimations.push(new Animated.Value(0));
        }

        // Animate cards in
        Animated.stagger(100,
            cardAnimations.map((anim: Animated.Value) =>
                Animated.timing(anim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: false,
                })
            )
        ).start();
    }, []);

    // Pagination logic
    const getTotalPages = () => Math.ceil(sampleMaterials.length / itemsPerPage);
    const getCurrentPageData = () => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return sampleMaterials.slice(startIndex, endIndex);
    };

    const handlePageChange = async (page: number) => {
        setLoading(true);
        setCurrentPage(page);
        
        // Simulate API loading
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Scroll to top
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
        setLoading(false);
    };

    const totalPages = getTotalPages();
    const currentPageData = getCurrentPageData();
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, sampleMaterials.length);

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Test Materials (7 Items)</Text>
            </View>

            <ScrollView
                ref={scrollViewRef}
                style={styles.scrollContainer}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Materials Section */}
                <View style={styles.materialsSection}>
                    <View style={styles.headerContainer}>
                        <Text style={styles.sectionTitle}>Available Materials</Text>
                        
                        {/* Material count and pagination info */}
                        <View style={styles.infoContainer}>
                            <Text style={styles.infoText}>
                                Showing {startItem}-{endItem} of {sampleMaterials.length} materials
                            </Text>
                            {totalPages > 1 && (
                                <Text style={styles.pageInfo}>
                                    Page {currentPage} of {totalPages}
                                </Text>
                            )}
                        </View>
                    </View>

                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <Animated.View style={{
                                transform: [{
                                    rotate: cardAnimations[0]?.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: ['0deg', '360deg'],
                                    }) || '0deg'
                                }]
                            }}>
                                <Ionicons name="sync" size={48} color="#3B82F6" />
                            </Animated.View>
                            <Text style={styles.loadingTitle}>Loading Materials...</Text>
                            <Text style={styles.loadingDescription}>
                                Please wait while we fetch your data...
                            </Text>
                        </View>
                    ) : (
                        // Render current page materials
                        currentPageData.map((material, index) => (
                            <MaterialCardEnhanced
                                key={`${material.name}-${material.unit}-${JSON.stringify(material.specs || {})}`}
                                material={material}
                                animation={cardAnimations[index] || new Animated.Value(1)}
                                activeTab="imported"
                                onAddUsage={() => {}}
                                miniSections={[]}
                                showMiniSectionLabel={false}
                            />
                        ))
                    )}

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <View style={styles.paginationContainer}>
                            {loading && (
                                <View style={styles.loadingIndicator}>
                                    <Animated.View style={{
                                        transform: [{
                                            rotate: cardAnimations[0]?.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: ['0deg', '360deg'],
                                            }) || '0deg'
                                        }]
                                    }}>
                                        <Ionicons name="sync" size={20} color="#3B82F6" />
                                    </Animated.View>
                                    <Text style={styles.loadingText}>Loading page...</Text>
                                </View>
                            )}
                            
                            <View style={[styles.paginationControls, loading && { opacity: 0.5 }]}>
                                {/* Previous Button */}
                                <TouchableOpacity
                                    style={[
                                        styles.paginationButton,
                                        (currentPage === 1 || loading) && styles.paginationButtonDisabled
                                    ]}
                                    onPress={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1 || loading}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons 
                                        name="chevron-back" 
                                        size={20} 
                                        color={(currentPage === 1 || loading) ? '#CBD5E1' : '#3B82F6'} 
                                    />
                                    <Text style={[
                                        styles.paginationButtonText,
                                        (currentPage === 1 || loading) && styles.paginationButtonTextDisabled
                                    ]}>
                                        Previous
                                    </Text>
                                </TouchableOpacity>

                                {/* Page Numbers */}
                                <View style={styles.pageNumbersContainer}>
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                        <TouchableOpacity
                                            key={page}
                                            style={[
                                                styles.pageNumberButton,
                                                page === currentPage && styles.pageNumberButtonActive,
                                                loading && { opacity: 0.5 }
                                            ]}
                                            onPress={() => handlePageChange(page)}
                                            disabled={loading}
                                            activeOpacity={0.7}
                                        >
                                            <Text style={[
                                                styles.pageNumberText,
                                                page === currentPage && styles.pageNumberTextActive
                                            ]}>
                                                {page}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                {/* Next Button */}
                                <TouchableOpacity
                                    style={[
                                        styles.paginationButton,
                                        (currentPage === totalPages || loading) && styles.paginationButtonDisabled
                                    ]}
                                    onPress={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages || loading}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[
                                        styles.paginationButtonText,
                                        (currentPage === totalPages || loading) && styles.paginationButtonTextDisabled
                                    ]}>
                                        Next
                                    </Text>
                                    <Ionicons 
                                        name="chevron-forward" 
                                        size={20} 
                                        color={(currentPage === totalPages || loading) ? '#CBD5E1' : '#3B82F6'} 
                                    />
                                </TouchableOpacity>
                            </View>

                            {/* Items per page info */}
                            <Text style={styles.itemsPerPageText}>
                                {itemsPerPage} items per page
                            </Text>
                        </View>
                    )}
                </View>
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
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        gap: 12,
    },
    backButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: '#F1F5F9',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1F2937',
        flex: 1,
    },
    scrollContainer: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 20,
    },
    materialsSection: {
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    headerContainer: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 8,
    },
    infoContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    infoText: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '500',
    },
    pageInfo: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '500',
    },
    loadingContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        gap: 12,
    },
    loadingTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1F2937',
    },
    loadingDescription: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
    },
    paginationContainer: {
        marginTop: 24,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        alignItems: 'center',
        gap: 12,
    },
    loadingIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    loadingText: {
        fontSize: 14,
        color: '#64748B',
        fontStyle: 'italic',
    },
    paginationControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    paginationButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        gap: 4,
    },
    paginationButtonDisabled: {
        backgroundColor: '#F1F5F9',
        borderColor: '#E2E8F0',
    },
    paginationButtonText: {
        fontSize: 14,
        color: '#3B82F6',
        fontWeight: '500',
    },
    paginationButtonTextDisabled: {
        color: '#CBD5E1',
    },
    pageNumbersContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    pageNumberButton: {
        width: 36,
        height: 36,
        borderRadius: 8,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    pageNumberButtonActive: {
        backgroundColor: '#3B82F6',
        borderColor: '#3B82F6',
    },
    pageNumberText: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '500',
    },
    pageNumberTextActive: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
    itemsPerPageText: {
        fontSize: 12,
        color: '#94A3B8',
        fontStyle: 'italic',
    },
});

export default TestMaterials;