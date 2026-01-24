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
  // Safety check - if no materials, show error state
  if (!addedMaterials || addedMaterials.length === 0) {
    return (
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <Text style={sharedStyles.formTitle}>Review & Purpose</Text>
          <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={styles.closeButtonContainer}>
            <X size={24} color="#64748B" />
          </TouchableOpacity>
        </View>

        {/* Error State */}
        <View style={styles.errorContainer}>
          <Package size={64} color="#EF4444" />
          <Text style={styles.errorTitle}>No Materials Added</Text>
          <Text style={styles.errorDescription}>
            You need to add at least one material before proceeding to review.
          </Text>
          <TouchableOpacity
            style={styles.backToAddButton}
            onPress={onBack}
            activeOpacity={0.7}
          >
            <ArrowLeft size={16} color="#FFFFFF" />
            <Text style={styles.backToAddButtonText}>Back to Add Materials</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

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
                  <View style={styles.reviewDetailRow}>
                    <Text style={styles.reviewDetailLabel}>Cost:</Text>
                    <Text style={styles.reviewDetailValue}>
                      ₹{material.perUnitCost.toLocaleString('en-IN')} {/* ✅ UPDATED: Use perUnitCost */}
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
            <Text style={styles.purposeTitle}>What are these materials needed for? *</Text>
          </View>
          <Text style={styles.purposeSubtitle}>Please describe the purpose or project (required)</Text>
          <TextInput
            style={styles.purposeInput}
            placeholder="e.g., Construction of residential building, Renovation project, etc."
            value={purposeMessage}
            onChangeText={onPurposeChange}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            placeholderTextColor="#94A3B8"
            selectionColor="#3B82F6"
            autoCorrect={true}
            autoCapitalize="sentences"
          />
        </View>

        {/* Back Button at bottom of scroll */}
        <View style={styles.backButtonContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
          >
            <ArrowLeft size={16} color="#FFFFFF" />
            <Text style={styles.backButtonText}>Back to Edit Materials</Text>
          </TouchableOpacity>
        </View>

        {/* Extra padding at bottom for floating button */}
        <View style={{ height: 140 }} />
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
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: '#1E293B',
    minHeight: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    fontWeight: '400',
    // Fix text visibility issues
    textAlignVertical: 'top',
    includeFontPadding: false,
    textDecorationLine: 'none',
  },
  backButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#3B82F6',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    minHeight: 56,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Error state styles
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#EF4444',
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  errorDescription: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  backToAddButton: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  backToAddButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ReviewPurposeStep;