import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Material } from '../../types/material';

interface MaterialCardProps {
  material: Material;
  activeTab: 'imported' | 'used';
  onPress: () => void;
  style?: any;
}

const MaterialCard: React.FC<MaterialCardProps> = ({ 
  material, 
  activeTab, 
  onPress,
  style 
}) => {
  const formatPrice = (price: number) => {
    return `₹${price.toLocaleString('en-IN')}`;
  };

  return (
    <Animated.View style={[styles.card, style]}>
      <TouchableOpacity onPress={onPress} style={styles.cardContent}>
        <View style={[styles.iconContainer, { backgroundColor: `${material.color}20` }]}>
          <Ionicons 
            name={material.icon as any} 
            size={24} 
            color={material.color} 
          />
        </View>
        
        <View style={styles.detailsContainer}>
          <Text style={styles.materialName} numberOfLines={1}>
            {material.name}
          </Text>
          <Text style={styles.materialCategory}>
            {material.category} • {material.quantity} {material.unit}
          </Text>
          
          {activeTab === 'imported' ? (
            <View style={styles.priceContainer}>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Per Unit:</Text>
                <Text style={styles.priceValue}>{formatPrice(material.price)}/{material.unit}</Text>
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Total:</Text>
                <Text style={styles.priceValue}>{formatPrice(material.price * material.quantity)}</Text>
              </View>
            </View>
          ) : (
            <View style={styles.usageContainer}>
              <View style={styles.usageRow}>
                <Text style={styles.usageLabel}>Used:</Text>
                <Text style={styles.usageValue}>{material.quantity} {material.unit}</Text>
              </View>
              <View style={styles.usageRow}>
                <Text style={styles.usageLabel}>Wasted:</Text>
                <Text style={styles.wastedValue}>
                  {Math.round(material.quantity * 0.1)} {material.unit}
                </Text>
              </View>
            </View>
          )}
        </View>
        
        <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  detailsContainer: {
    flex: 1,
    marginRight: 8,
  },
  materialName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  materialCategory: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 6,
  },
  priceContainer: {
    marginTop: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  priceLabel: {
    fontSize: 12,
    color: '#64748B',
    marginRight: 4,
    minWidth: 50,
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
  },
  usageContainer: {
    marginTop: 2,
  },
  usageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  usageLabel: {
    fontSize: 12,
    color: '#64748B',
    marginRight: 4,
    minWidth: 50,
  },
  usageValue: {
    fontSize: 13,
    color: '#1E293B',
  },
  wastedValue: {
    fontSize: 13,
    color: '#DC2626',
  },
});

export default React.memo(MaterialCard);
