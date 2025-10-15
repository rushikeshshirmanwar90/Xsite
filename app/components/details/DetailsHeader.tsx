import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

interface DetailsHeaderProps {
  totalCost: number;
  onAddPress: () => void;
}

const DetailsHeader: React.FC<DetailsHeaderProps> = ({ totalCost, onAddPress }) => {
  const formatPrice = (price: number) => {
    return `₹${price.toLocaleString('en-IN')}`;
  };

  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <View style={styles.projectInfo}>
          <Text style={styles.projectName}>Villa Project</Text>
          <Text style={styles.totalCostText}>{formatPrice(totalCost)}</Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.addButton}
        onPress={onAddPress}
        activeOpacity={0.7}
      >
        <Ionicons name="add-circle-outline" size={28} color="#0EA5E9" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  projectInfo: {
    flexDirection: 'column',
  },
  projectName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  totalCostText: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  addButton: {
    padding: 8,
  },
});

export default React.memo(DetailsHeader);
