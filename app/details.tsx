import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState, useRef, useEffect } from 'react';
import {
    Animated,
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Import refactored components
import MaterialCharacteristicsView from './components/MaterialCharacteristicsView';
import AddMaterialCharacteristicsModal from './components/AddMaterialCharacteristicsModal';
import SearchModal from './components/SearchModal';

// Import types and data
import { Material, Period, MaterialCharacteristics } from './types/materialTypes';

// Extended Material interface for UI purposes
interface ExtendedMaterial extends Material {
  color?: string;
  icon?: string;
}
import { importedMaterials, usedMaterials, periods } from './data/materialData';

// Import styles
import { detailsStyles as styles } from './styles/detailsStyles';

/**
 * Details Component
 * 
 * This component displays material details with the following features:
 * - Material listing with filtering by period and type (imported/used)
 * - Material characteristics viewing and editing
 * - Search functionality for materials
 * - Cost calculation and availability tracking
 */
const Details = () => {
    // State variables
    const [activeTab, setActiveTab] = useState('imported');
    const [activePeriod, setActivePeriod] = useState('all');
    const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
    const [showCharacteristicsModal, setShowCharacteristicsModal] = useState(false);
    const [showSearchModal, setShowSearchModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Material[]>([]);

    // Animation references
    const cardAnimations = useRef<{ [key: string]: Animated.Value }>({});

    // Initialize card animations
    useEffect(() => {
        const currentData = getCurrentData();
        currentData.forEach((material) => {
            if (!cardAnimations.current[material.id]) {
                cardAnimations.current[material.id] = new Animated.Value(0);
                Animated.timing(cardAnimations.current[material.id], {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }).start();
            }
        });
    }, [activeTab, activePeriod]);

    /**
     * Helper function to get current data based on active tab
     * @returns Array of materials based on the active tab (imported/used)
     */
    const getCurrentData = () => {
        return activeTab === 'imported' ? importedMaterials : usedMaterials;
    };

    /**
     * Filter materials based on active period
     * @returns Filtered array of materials
     */
    const filteredMaterials = () => {
        const currentData = getCurrentData();
        if (activePeriod === 'all') {
            return currentData;
        }
        return currentData.filter((material) => material.period === activePeriod);
    };

    /**
     * Calculate total cost of filtered materials
     * @returns Total cost as a number
     */
    const totalCost = () => {
        return filteredMaterials().reduce((sum, material) => sum + material.price * material.quantity, 0);
    };

    /**
     * Format price with Indian Rupee symbol and thousands separator
     * @param price - The price to format
     * @returns Formatted price string
     */
    const formatPrice = (price: number) => {
        return `₹${price.toLocaleString('en-IN')}`;
    };

    /**
     * Get imported quantity for a specific material
     * @param materialId - ID of the material
     * @returns Quantity of imported material
     */
    const getImportedQuantity = (materialId: string) => {
        const material = importedMaterials.find((m) => m.id === materialId);
        return material ? material.quantity : 0;
    };

    /**
     * Calculate available quantity for a specific material
     * @param materialId - ID of the material
     * @returns Available quantity after usage
     */
    const getAvailableQuantity = (materialId: string) => {
        const importedMaterial = importedMaterials.find((m) => m.id === materialId);
        const usedMaterial = usedMaterials.find((m) => m.id === materialId);
        
        const importedQty = importedMaterial ? importedMaterial.quantity : 0;
        const usedQty = usedMaterial ? usedMaterial.quantity : 0;
        
        return importedQty - usedQty;
    };

    /**
     * Calculate availability percentage for a specific material
     * @param materialId - ID of the material
     * @returns Percentage of material still available
     */
    const getAvailabilityPercentage = (materialId: string) => {
        const importedQty = getImportedQuantity(materialId);
        const availableQty = getAvailableQuantity(materialId);
        
        if (importedQty === 0) return 0;
        return Math.round((availableQty / importedQty) * 100);
    };

    /**
     * Handle view details action for a material
     * @param material - The material to view details for
     */
    const handleViewDetails = (material: Material) => {
        setSelectedMaterial(material);
        // In a real app, this might navigate to a detailed view
        console.log('Viewing details for:', material.name);
    };

    /**
     * Handle search functionality
     * @param query - Search query string
     */
    const handleSearch = (query: string) => {
        setSearchQuery(query);
        if (query.trim() === '') {
            setSearchResults([]);
            return;
        }
        
        const allMaterials = [...importedMaterials, ...usedMaterials];
        const uniqueMaterials = allMaterials.filter(
            (material, index, self) => index === self.findIndex((m) => m.id === material.id)
        );
        
        const results = uniqueMaterials.filter((material) =>
            material.name.toLowerCase().includes(query.toLowerCase()) ||
            material.category.toLowerCase().includes(query.toLowerCase())
        );
        
        setSearchResults(results);
    };

    /**
     * Handle saving material characteristics
     * @param material - The material being updated
     * @param characteristics - The new characteristics to save
     */
    const handleSaveCharacteristics = (material: Material, characteristics: MaterialCharacteristics) => {
        // In a real app, this would update the data in a database or state management system
        console.log('Saving characteristics for material:', material.id, characteristics);
        setShowCharacteristicsModal(false);
    };

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <TouchableOpacity 
                            style={styles.backButton}
                            onPress={() => router.back()}
                        >
                            <Ionicons name="chevron-back" size={24} color="#000" />
                        </TouchableOpacity>
                        <View style={styles.projectInfo}>
                            <Text style={styles.projectName}>Materials</Text>
                            <Text style={styles.totalCostText}>{formatPrice(totalCost())}</Text>
                        </View>
                    </View>
                    <TouchableOpacity 
                        style={styles.searchButton} 
                        onPress={() => setShowSearchModal(true)}
                    >
                        <Ionicons name="search" size={20} color="#6B7280" />
                    </TouchableOpacity>
                </View>

                <ScrollView 
                    style={styles.scrollContainer} 
                    contentContainerStyle={styles.scrollContent}
                >
                    {/* Period Selection */}
                    <View style={styles.periodSection}>
                        <ScrollView 
                            horizontal 
                            showsHorizontalScrollIndicator={false} 
                            contentContainerStyle={styles.periodContainer}
                        >
                            <TouchableOpacity
                                style={[
                                    styles.periodButton,
                                    styles.firstPeriodButton,
                                    activePeriod === 'all' && styles.periodButtonActive,
                                ]}
                                onPress={() => setActivePeriod('all')}
                            >
                                <Text
                                    style={[
                                        styles.periodText,
                                        activePeriod === 'all' && styles.periodTextActive,
                                    ]}
                                >
                                    All Periods
                                </Text>
                            </TouchableOpacity>

                            {periods.map((period, index) => (
                                <TouchableOpacity
                                    key={period.id}
                                    style={[
                                        styles.periodButton,
                                        index === periods.length - 1 && styles.lastPeriodButton,
                                        activePeriod === period.id && styles.periodButtonActive,
                                    ]}
                                    onPress={() => setActivePeriod(period.id)}
                                >
                                    <Text
                                        style={[
                                            styles.periodText,
                                            activePeriod === period.id && styles.periodTextActive,
                                        ]}
                                    >
                                        {period.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    {/* Tabs */}
                    <View style={styles.tabContainer}>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'imported' && styles.activeTab]}
                            onPress={() => setActiveTab('imported')}
                        >
                            <Ionicons
                                name="cube-outline"
                                size={18}
                                color={activeTab === 'imported' ? '#000' : '#6B7280'}
                            />
                            <Text
                                style={[
                                    styles.tabText,
                                    activeTab === 'imported' && styles.activeTabText,
                                ]}
                            >
                                Imported
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'used' && styles.activeTab]}
                            onPress={() => setActiveTab('used')}
                        >
                            <Ionicons
                                name="hammer-outline"
                                size={18}
                                color={activeTab === 'used' ? '#000' : '#6B7280'}
                            />
                            <Text
                                style={[
                                    styles.tabText,
                                    activeTab === 'used' && styles.activeTabText,
                                ]}
                            >
                                Used
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Materials List */}
                    <View style={styles.materialsSection}>
                        {filteredMaterials().map((material) => {
                            const animatedStyle = {
                                opacity: cardAnimations.current[material.id] || new Animated.Value(1),
                                transform: [
                                    {
                                        translateY: (cardAnimations.current[material.id] || new Animated.Value(1)).interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [50, 0],
                                        }),
                                    },
                                ],
                            };

                            return (
                                <Animated.View key={material.id} style={[styles.materialCard, animatedStyle]}>
                                    <View style={styles.materialHeader}>
                                        <View style={styles.materialTitleSection}>
                                            <View
                                    style={[styles.iconContainer, { backgroundColor: `${(material as ExtendedMaterial).color || '#CCCCCC'}20` }]}
                                >
                                    <Ionicons name={(material as ExtendedMaterial).icon as any || 'cube'} size={24} color={(material as ExtendedMaterial).color || '#CCCCCC'} />
                                </View>
                                            <View style={styles.materialTitleInfo}>
                                                <Text style={styles.materialNameText}>{material.name}</Text>
                                                <View
                                    style={[styles.categoryTag, { backgroundColor: (material as ExtendedMaterial).color || '#CCCCCC' }]}
                                >
                                                    <Text style={styles.categoryText}>{material.category}</Text>
                                                </View>
                                            </View>
                                        </View>
                                        <View style={styles.dateContainer}>
                                            <Text style={styles.dateText}>{material.date}</Text>
                                            <TouchableOpacity style={styles.moreButton}>
                                                <Ionicons name="ellipsis-vertical" size={20} color="#64748B" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>

                                    <View style={styles.materialDetails}>
                                        <View style={styles.detailItem}>
                                            <Text style={styles.detailLabel}>Quantity</Text>
                                            <View style={styles.detailValueContainer}>
                                                <Text style={styles.detailValue}>{material.quantity}</Text>
                                                <Text style={styles.detailUnit}>{material.unit}</Text>
                                            </View>
                                        </View>

                                        <View style={styles.detailDivider} />

                                        <View style={styles.detailItem}>
                                            <Text style={styles.detailLabel}>Unit Price</Text>
                                            <View style={styles.detailValueContainer}>
                                                <Text style={styles.detailValue}>
                                                    {formatPrice(material.price)}
                                                </Text>
                                                <Text style={styles.detailUnit}>per {material.unit}</Text>
                                            </View>
                                        </View>

                                        <View style={styles.detailDivider} />

                                        <View style={styles.detailItem}>
                                            <Text style={styles.detailLabel}>Total</Text>
                                            <View style={styles.detailValueContainer}>
                                                <Text style={styles.priceValue}>
                                                    {formatPrice(material.price * material.quantity)}
                                                </Text>
                                                <Text style={styles.detailUnit}>total cost</Text>
                                            </View>
                                        </View>
                                    </View>

                                    {activeTab === 'used' && (
                                        <View style={styles.materialProgressSection}>
                                            <View style={styles.progressInfoContainer}>
                                                <View>
                                                    <Text style={styles.progressLabel}>Availability</Text>
                                                    <Text style={styles.progressValues}>
                                                        {getAvailableQuantity(material.id)} / {getImportedQuantity(material.id)} {material.unit}
                                                    </Text>
                                                </View>
                                                <View style={styles.progressPercentageContainer}>
                                                    <Text style={styles.progressPercentage}>
                                                        {getAvailabilityPercentage(material.id)}%
                                                    </Text>
                                                </View>
                                            </View>

                                            <View style={styles.progressBarContainer}>
                                                <View style={styles.progressBarBackground}>
                                                    <View
                                                        style={[
                                                            styles.progressBarFill,
                                                            { width: `${getAvailabilityPercentage(material.id)}%` },
                                                        ]}
                                                    />
                                                </View>
                                            </View>

                                            {material.wastedQuantity && material.wastedQuantity > 0 && (
                                                <View style={styles.progressBarWithLabels}>
                                                    <View style={styles.progressStartLabel}>
                                                        <Text style={styles.progressLabelText}>Used</Text>
                                                        <Text style={styles.progressLabelValue}>
                                                            {material.quantity - (material.wastedQuantity || 0)} {material.unit}
                                                        </Text>
                                                    </View>

                                                    <View style={styles.progressBarBackground}>
                                                        <View
                                                            style={[
                                                                styles.progressBarFillGreen,
                                                                {
                                                                    width: `${((material.quantity - (material.wastedQuantity || 0)) / material.quantity) * 100}%`,
                                                                },
                                                            ]}
                                                        />
                                                    </View>

                                                    <View style={styles.progressEndLabel}>
                                                        <Text style={styles.progressLabelText}>Wasted</Text>
                                                        <Text style={styles.progressLabelValue}>
                                                            {material.wastedQuantity} {material.unit}
                                                        </Text>
                                                    </View>
                                                </View>
                                            )}
                                        </View>
                                    )}

                                    {/* Use the MaterialCharacteristicsView component */}
                                    {material.characteristics && (
                                        <MaterialCharacteristicsView characteristics={material.characteristics} />
                                    )}

                                    {!material.characteristics && (
                                        <TouchableOpacity
                                            style={styles.addCharacteristicsButton}
                                            onPress={() => {
                                                setSelectedMaterial(material);
                                                setShowCharacteristicsModal(true);
                                            }}
                                        >
                                            <Text style={styles.addCharacteristicsButtonText}>
                                                Add Material Characteristics
                                            </Text>
                                            <Ionicons name="add-circle" size={16} color="#0EA5E9" />
                                        </TouchableOpacity>
                                    )}

                                    <TouchableOpacity
                                        style={styles.viewDetailsButton}
                                        onPress={() => handleViewDetails(material)}
                                    >
                                        <Text style={styles.viewDetailsButtonText}>View Details</Text>
                                        <Ionicons name="chevron-forward" size={14} color="#0EA5E9" />
                                    </TouchableOpacity>
                                </Animated.View>
                            );
                        })}
                    </View>
                </ScrollView>

                {/* Modals */}
                {selectedMaterial && (
                    <AddMaterialCharacteristicsModal
                        visible={showCharacteristicsModal}
                        material={selectedMaterial}
                        onClose={() => setShowCharacteristicsModal(false)}
                        onSave={handleSaveCharacteristics}
                    />
                )}

                <SearchModal
                    visible={showSearchModal}
                    searchQuery={searchQuery}
                    searchResults={searchResults}
                    onSearch={handleSearch}
                    onClose={() => {
                        setShowSearchModal(false);
                        setSearchQuery('');
                        setSearchResults([]);
                    }}
                    onSelectMaterial={(material: Material) => {
                        setShowSearchModal(false);
                        handleViewDetails(material);
                    }}
                />
            </View>
        </SafeAreaView>
    );
};

export default Details;