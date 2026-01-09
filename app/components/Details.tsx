import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Animated,
  TextInput,
} from 'react-native';
import { Ionicons , MaterialIcons , MaterialCommunityIcons } from '@expo/vector-icons';



// Import components
import MaterialCharacteristicsView from './MaterialCharacteristicsView';
import AddMaterialCharacteristicsModal from './AddMaterialCharacteristicsModal';
import SearchModal from './SearchModal';

// Import types and data
import { Material, Period, MaterialCharacteristics } from '../types/materialTypes';
import { importedMaterials, usedMaterials, periods } from '../data/materialData';

// Import styles
import { detailsStyles as styles } from '../styles/detailsStyles';

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
  const searchInputRef = useRef<TextInput>(null);

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

  // Helper functions
  const getCurrentData = () => {
    return activeTab === 'imported' ? importedMaterials : usedMaterials;
  };

  const filteredMaterials = () => {
    const currentData = getCurrentData();
    if (activePeriod === 'all') {
      return currentData;
    }
    return currentData.filter((material) => material.period === activePeriod);
  };

  const totalCost = () => {
    return filteredMaterials().reduce((sum, material) => sum + material.price * material.quantity, 0);
  };

  const formatPrice = (price: number) => {
    return `₹${price.toLocaleString('en-IN')}`;
  };

  const getImportedQuantity = (materialId: string) => {
    const material = importedMaterials.find((m) => m.id === materialId);
    return material ? material.quantity : 0;
  };

  const getAvailableQuantity = (materialId: string) => {
    const importedMaterial = importedMaterials.find((m) => m.id === materialId);
    const usedMaterial = usedMaterials.find((m) => m.id === materialId);
    
    const importedQty = importedMaterial ? importedMaterial.quantity : 0;
    const usedQty = usedMaterial ? usedMaterial.quantity : 0;
    
    return importedQty - usedQty;
  };

  const getAvailabilityPercentage = (materialId: string) => {
    const importedQty = getImportedQuantity(materialId);
    const availableQty = getAvailableQuantity(materialId);
    
    if (importedQty === 0) return 0;
    return Math.round((availableQty / importedQty) * 100);
  };

  const getQuantityWasted = (materialId: string) => {
    const material = usedMaterials.find((m) => m.id === materialId);
    return material && material.wastedQuantity ? material.wastedQuantity : 0;
  };

  const handleViewDetails = (material: Material) => {
    setSelectedMaterial(material);
  };

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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.backButton}>
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
            <MaterialCommunityIcons
              name="package-variant-closed"
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
            <MaterialIcons
              name="construction"
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

            let iconName: string = '';
            let iconColor = '';
            let categoryColor = '';

            switch (material.category.toLowerCase()) {
              case 'steel':
                iconName = 'construction';
                iconColor = '#3B82F6';
                categoryColor = '#3B82F6';
                break;
              case 'brick':
                iconName = 'foundation';
                iconColor = '#EF4444';
                categoryColor = '#EF4444';
                break;
              case 'electrical':
                iconName = 'electrical-services';
                iconColor = '#F59E0B';
                categoryColor = '#F59E0B';
                break;
              case 'plumbing':
                iconName = 'plumbing';
                iconColor = '#10B981';
                categoryColor = '#10B981';
                break;
              case 'granite':
                iconName = 'dashboard';
                iconColor = '#8B5CF6';
                categoryColor = '#8B5CF6';
                break;
              case 'wall putty':
                iconName = 'format-paint';
                iconColor = '#EC4899';
                categoryColor = '#EC4899';
                break;
              default:
                iconName = 'category';
                iconColor = '#6B7280';
                categoryColor = '#6B7280';
            }

            return (
              <Animated.View key={material.id} style={[styles.materialCard, animatedStyle]}>
                <View style={styles.materialHeader}>
                  <View style={styles.materialTitleSection}>
                    <View
                      style={[styles.iconContainer, { backgroundColor: `${iconColor}20` }]}
                    >
                      <MaterialIcons name={iconName as any} size={24} color={iconColor} />
                    </View>
                    <View style={styles.materialTitleInfo}>
                      <Text style={styles.materialNameText}>{material.name}</Text>
                      <View
                        style={[styles.categoryTag, { backgroundColor: categoryColor }]}
                      >
                        <Text style={styles.categoryText}>{material.category}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.dateContainer}>
                    <Text style={styles.dateText}>{material.date}</Text>
                    <TouchableOpacity style={styles.moreButton}>
                      <MaterialIcons name="more-vert" size={20} color="#64748B" />
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
          onSave={(material: Material, characteristics: MaterialCharacteristics) => {
            // In a real app, this would update the data in a database or state management system
            console.log('Saving characteristics for material:', material.id, characteristics);
            setShowCharacteristicsModal(false);
          }}
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
  );
};

export default Details;