import { Edit, Trash2 } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TextStyle, TouchableOpacity, View, ViewStyle } from 'react-native';
import { sharedStyles } from './styles';
import { InternalMaterial } from './types';

interface AddedMaterialsListProps {
  materials: InternalMaterial[];
  editingIndex: number | null;
  onEdit: (index: number) => void;
  onRemove: (index: number) => void;
}

const AddedMaterialsList: React.FC<AddedMaterialsListProps> = ({
  materials,
  editingIndex,
  onEdit,
  onRemove,
}) => {
  if (materials.length === 0) return null;

  return (
    <View style={styles.addedMaterialsSection}>
      <Text style={sharedStyles.sectionLabel}>
        Added Materials ({materials.length}) {editingIndex !== null && '(Editing)'}
      </Text>
      {materials.map((material, index) => (
        <View
          key={material.id}
          style={[
            styles.addedMaterialItem,
            editingIndex === index && styles.editingMaterialItem,
          ]}
        >
          <Text style={styles.materialIcon}>
            {editingIndex === index ? '✏️' : '✓'}
          </Text>
          <View style={styles.addedMaterialInfo}>
            <Text style={styles.addedMaterialName}>{material.name}</Text>
            <Text style={styles.addedMaterialDetails}>
              {material.quantity} {material.unit}
            </Text>
            {Object.keys(material.specs).length > 0 && (
              <View style={styles.materialSpecsPreview}>
                <Text style={styles.materialSpecsTitle}>Specifications:</Text>
                {Object.entries(material.specs).map(([key, value]) => (
                  <Text key={key} style={styles.materialSpecItem}>
                    • {key}: {value}
                  </Text>
                ))}
              </View>
            )}
          </View>
          <View style={styles.materialActionButtons}>
            <TouchableOpacity
              style={styles.editMaterialButton}
              onPress={() => onEdit(index)}
              activeOpacity={0.7}
            >
              <Text style={styles.actionButtonText}> <Edit size={16} color="#3B82F6" /> </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.removeMaterialButton}
              onPress={() => onRemove(index)}
              activeOpacity={0.7}
            >
              <Text style={styles.actionButtonText}> <Trash2 size={16} color="#EF4444" /> </Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );
};

type Styles = {
  [key: string]: ViewStyle | TextStyle | any;
};

const styles = StyleSheet.create<Styles>({
  addedMaterialsSection: {
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  addedMaterialItem: {
    flexDirection: 'row' as const,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  editingMaterialItem: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  materialIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  addedMaterialInfo: {
    flex: 1,
  },
  addedMaterialName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1E293B',
    marginBottom: 4,
  },
  addedMaterialDetails: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
  },
  materialSpecsPreview: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  materialSpecsTitle: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#64748B',
    marginBottom: 4,
  },
  materialSpecItem: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 8,
    marginTop: 2,
  },
  materialActionButtons: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  editMaterialButton: {
    padding: 8,
    backgroundColor: '#DBEAFE',
    borderRadius: 6,
  },
  removeMaterialButton: {
    padding: 8,
    backgroundColor: '#FEE2E2',
    borderRadius: 6,
  },
  actionButtonText: {
    fontSize: 16,
  },
});

export default AddedMaterialsList;
