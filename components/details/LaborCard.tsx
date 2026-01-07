import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Labor } from '@/types/labor';

interface LaborCardProps {
  labor: Labor;
  onEdit?: (labor: Labor) => void;
  onDelete?: (labor: Labor) => void;
  showActions?: boolean;
}

const LaborCard: React.FC<LaborCardProps> = ({
  labor,
  onEdit,
  onDelete,
  showActions = true,
}) => {
  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconContainer, { backgroundColor: labor.color + '20' }]}>
            <Ionicons name={labor.icon} size={20} color={labor.color} />
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.laborType}>{labor.type}</Text>
            <Text style={styles.laborCategory}>{labor.category}</Text>
          </View>
        </View>
        
        {showActions && (
          <View style={styles.actions}>
            {onEdit && (
              <TouchableOpacity style={styles.actionButton} onPress={() => onEdit(labor)}>
                <Ionicons name="pencil-outline" size={16} color="#6B7280" />
              </TouchableOpacity>
            )}
            {onDelete && (
              <TouchableOpacity style={styles.actionButton} onPress={() => onDelete(labor)}>
                <Ionicons name="trash-outline" size={16} color="#EF4444" />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Details */}
      <View style={styles.details}>
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Ionicons name="people-outline" size={16} color="#6B7280" />
            <Text style={styles.detailLabel}>Count</Text>
            <Text style={styles.detailValue}>{labor.count}</Text>
          </View>
          
          <View style={styles.detailItem}>
            <Ionicons name="cash-outline" size={16} color="#6B7280" />
            <Text style={styles.detailLabel}>Per Labor</Text>
            <Text style={styles.detailValue}>{formatCurrency(labor.perLaborCost)}</Text>
          </View>
        </View>

        <View style={styles.totalCostContainer}>
          <Text style={styles.totalCostLabel}>Total Cost</Text>
          <Text style={styles.totalCostValue}>{formatCurrency(labor.totalCost)}</Text>
        </View>

        {/* Date */}
        <View style={styles.dateContainer}>
          <Ionicons name="calendar-outline" size={14} color="#9CA3AF" />
          <Text style={styles.dateText}>Added on {formatDate(labor.date)}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  laborType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  laborCategory: {
    fontSize: 14,
    color: '#6B7280',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#F9FAFB',
  },
  details: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  detailItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
  },
  detailLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '600',
    marginLeft: 'auto',
  },
  totalCostContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
  },
  totalCostLabel: {
    fontSize: 14,
    color: '#92400E',
    fontWeight: '500',
  },
  totalCostValue: {
    fontSize: 18,
    color: '#92400E',
    fontWeight: '700',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});

export default LaborCard;