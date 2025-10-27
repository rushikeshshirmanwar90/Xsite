import { ArrowLeft, Edit, MessageSquare, Package, Trash2, X } from 'lucide-react-native';
import React from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TextStyle, TouchableOpacity, View, ViewStyle } from 'react-native';
import { sharedStyles } from './styles';
import { InternalMaterial } from './types';

interface ReviewPurposeStepProps {
  addedMaterials: InternalMaterial[];
  purposeMessage: string;
  onPurposeChange: (text: string) => void;
  onBack: () => void;
  onClose: () => void;
  onEditMaterial: (index: number) => void;
  onRemoveMaterial: (index: number) => void;
  onSubmit?: () => void;
}

const ReviewPurposeStep: React.FC<ReviewPurposeStepProps> = ({
  addedMaterials,
  purposeMessage,
  onPurposeChange,
  onBack,
  onClose,
  onEditMaterial,
  onRemoveMaterial,
  onSubmit,
}) => {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <Text style={sharedStyles.formTitle}>Review & Purpose</Text>
        <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={styles.closeButtonContainer}>
          <X size={24} color="#64748B" />
        </TouchableOpacity>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled={true}
        scrollEnabled={true}
      >
          {/* Review Section */}
          <View style={styles.reviewSection}>
          <View style={styles.reviewTitleContainer}>
            <Package size={20} color="#1E293B" />
            <Text style={styles.reviewTitle}>Materials Summary</Text>
          </View>
          <Text style={styles.reviewCount}>
            {addedMaterials.length} Material{addedMaterials.length > 1 ? 's' : ''} Added
          </Text>

          <View style={styles.reviewMaterialsContainer}>
            {addedMaterials.map((material, index) => (
              <View key={material.id} style={styles.reviewMaterialCard}>
                <View style={styles.reviewMaterialHeader}>
                  <Text style={styles.reviewMaterialNumber}>#{index + 1}</Text>
                  <Text style={styles.reviewMaterialName}>{material.name}</Text>
                  <View style={styles.reviewActionButtons}>
                    <TouchableOpacity
                      style={styles.reviewEditButton}
                      onPress={() => {
                        onEditMaterial(index);
                        onBack();
                      }}
                      activeOpacity={0.7}
                    >
                      <Edit size={16} color="#3B82F6" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.reviewRemoveButton}
                      onPress={() => onRemoveMaterial(index)}
                      activeOpacity={0.7}
                    >
                      <Trash2 size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.reviewMaterialDetails}>
                  <View style={styles.reviewDetailRow}>
                    <Text style={styles.reviewDetailLabel}>Quantity:</Text>
                    <Text style={styles.reviewDetailValue}>
                      {material.quantity} {material.unit}
                    </Text>
                  </View>
                  {Object.keys(material.specs).length > 0 && (
                    <View style={styles.reviewSpecsSection}>
                      <Text style={styles.reviewSpecsTitle}>Specifications:</Text>
                      {Object.entries(material.specs).map(([key, value]) => (
                        <View key={key} style={styles.reviewSpecRow}>
                          <Text style={styles.reviewSpecKey}>• {key}:</Text>
                          <Text style={styles.reviewSpecValue}>{value}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Purpose Section */}
        <View style={styles.purposeSection}>
          <View style={styles.purposeTitleContainer}>
            <MessageSquare size={18} color="#1E293B" />
            <Text style={styles.purposeTitle}>What are these materials needed for?</Text>
          </View>
          <Text style={styles.purposeSubtitle}>Please describe the purpose or project</Text>
          <TextInput
            style={styles.purposeInput}
            placeholder="e.g., Construction of residential building, Renovation project, etc."
            value={purposeMessage}
            onChangeText={onPurposeChange}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            placeholderTextColor="#94A3B8"
          />
        </View>

        {/* Back Button at bottom of scroll */}
        <View style={styles.backButtonContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
          >
            <ArrowLeft size={16} color="#64748B" />
            <Text style={styles.backButtonText}>Back to Edit Materials</Text>
          </TouchableOpacity>
        </View>

        {/* Extra padding at bottom for floating button */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

type Styles = {
  [key: string]: ViewStyle | TextStyle | any;
};

const styles = StyleSheet.create<Styles>({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  closeButtonContainer: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  backButtonContainer: {
    marginTop: 20,
    marginBottom: 10,
  },
  reviewTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  purposeTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  reviewSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  reviewMaterialsContainer: {
    marginBottom: 10,
  },
  reviewTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  reviewCount: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 20,
    fontWeight: '500',
  },
  reviewMaterialCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  reviewMaterialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  reviewMaterialNumber: {
    backgroundColor: '#3B82F6',
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  reviewMaterialName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
  },
  reviewActionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reviewEditButton: {
    padding: 8,
    backgroundColor: '#DBEAFE',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    width: 32,
    height: 32,
  },
  reviewRemoveButton: {
    padding: 8,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    width: 32,
    height: 32,
  },
  reviewMaterialDetails: {
    gap: 8,
  },
  reviewDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewDetailLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  reviewDetailValue: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '600',
  },
  reviewSpecsSection: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  reviewSpecsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 6,
  },
  reviewSpecRow: {
    flexDirection: 'row',
    marginTop: 4,
    gap: 8,
  },
  reviewSpecKey: {
    fontSize: 13,
    color: '#64748B',
  },
  reviewSpecValue: {
    fontSize: 13,
    color: '#1E293B',
    fontWeight: '500',
    flex: 1,
  },
  purposeSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  purposeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  purposeSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 16,
  },
  purposeInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 14,
    fontSize: 15,
    color: '#1E293B',
    minHeight: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  backButton: {
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  backButtonText: {
    color: '#64748B',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default ReviewPurposeStep;