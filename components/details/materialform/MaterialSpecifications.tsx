import React from 'react';
import { StyleSheet, Text, TextInput, TextStyle, TouchableOpacity, View, ViewStyle } from 'react-native';
import { SPEC_FIELD_CONFIG } from './constants';
import { sharedStyles } from './styles';
import { CustomSpec, MaterialFormData } from './types';

interface MaterialSpecificationsProps {
  specFields: string[];
  formData: MaterialFormData;
  customSpecs: CustomSpec[];
  showSpecDropdown: string | null;
  onSpecChange: (field: string, value: string | number) => void;
  onToggleSpecDropdown: (field: string) => void;
  onAddSpecClick: () => void;
  onRemoveCustomSpec: (index: number) => void;
}

const MaterialSpecifications: React.FC<MaterialSpecificationsProps> = ({
  specFields,
  formData,
  customSpecs,
  showSpecDropdown,
  onSpecChange,
  onToggleSpecDropdown,
  onAddSpecClick,
  onRemoveCustomSpec,
}) => {
  return (
    <View style={sharedStyles.formSection}>
      <View style={styles.specSectionHeader}>
        <Text style={sharedStyles.sectionLabel}>Material Specifications</Text>
        <TouchableOpacity
          style={styles.addSpecButtonSmall}
          onPress={onAddSpecClick}
          activeOpacity={0.7}
        >
          <Text style={styles.addSpecButtonSmallText}>+ Add Spec</Text>
        </TouchableOpacity>
      </View>

      {specFields.length > 0 && specFields.map((field) => {
        const config = SPEC_FIELD_CONFIG[field];
        if (!config) return null;
        return (
          <View key={field} style={sharedStyles.formGroup}>
            <Text style={sharedStyles.label}>{config.label}</Text>
            {config.type === 'select' ? (
              <>
                <TouchableOpacity
                  style={sharedStyles.selectInput}
                  onPress={() => onToggleSpecDropdown(field)}
                >
                  <Text style={[sharedStyles.selectInputText, !formData.specs[field] && sharedStyles.placeholderText]}>
                    {formData.specs[field] || `Select ${config.label}`}
                  </Text>
                  <Text style={sharedStyles.dropdownIcon}>{showSpecDropdown === field ? '▲' : '▼'}</Text>
                </TouchableOpacity>
                {showSpecDropdown === field && (
                  <View style={sharedStyles.dropdown}>
                    {config.options?.map((opt) => (
                      <TouchableOpacity
                        key={opt}
                        style={sharedStyles.dropdownItem}
                        onPress={() => {
                          onSpecChange(field, opt);
                          onToggleSpecDropdown(field);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={sharedStyles.dropdownItemText}>{opt}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </>
            ) : (
              <TextInput
                style={sharedStyles.input}
                placeholder={config.placeholder}
                value={formData.specs[field] || ''}
                onChangeText={(value) => onSpecChange(field, value)}
                keyboardType={config.type === 'number' ? 'decimal-pad' : 'default'}
                placeholderTextColor="#94A3B8"
              />
            )}
          </View>
        );
      })}

      {customSpecs.length > 0 && (
        <View style={styles.customSpecsContainer}>
          {customSpecs.map((spec, index) => (
            <View key={index} style={styles.customSpecItem}>
              <View style={styles.customSpecContent}>
                <Text style={styles.customSpecName}>{spec.key}</Text>
                <Text style={styles.customSpecValue}>{spec.value}</Text>
              </View>
              <TouchableOpacity
                style={styles.removeSpecButton}
                onPress={() => onRemoveCustomSpec(index)}
                activeOpacity={0.7}
              >
                <Text style={styles.removeSpecButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {specFields.length === 0 && customSpecs.length === 0 && (
        <View style={styles.emptySpecsContainer}>
          <Text style={styles.emptySpecsText}>📋</Text>
          <Text style={styles.emptySpecsSubtext}>
            Add custom specifications to better describe your material
          </Text>
        </View>
      )}
    </View>
  );
};

type Styles = {
  [key: string]: ViewStyle | TextStyle | any;
};

const styles = StyleSheet.create<Styles>({
  specSectionHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 16,
  },
  addSpecButtonSmall: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#DBEAFE',
    borderRadius: 6,
  },
  addSpecButtonSmallText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#3B82F6',
  },
  customSpecsContainer: {
    marginTop: 12,
  },
  customSpecItem: {
    flexDirection: 'row' as const,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  },
  customSpecContent: {
    flex: 1,
  },
  customSpecName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1E293B',
    marginBottom: 2,
  },
  customSpecValue: {
    fontSize: 13,
    color: '#64748B',
  },
  removeSpecButton: {
    padding: 4,
  },
  removeSpecButtonText: {
    fontSize: 18,
    color: '#EF4444',
  },
  emptySpecsContainer: {
    alignItems: 'center' as const,
    paddingVertical: 32,
  },
  emptySpecsText: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptySpecsSubtext: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center' as const,
    maxWidth: 240,
  },
});

export default MaterialSpecifications;
