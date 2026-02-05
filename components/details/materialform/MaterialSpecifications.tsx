import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TextStyle, TouchableOpacity, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
  const [customSpecValues, setCustomSpecValues] = useState<{[key: string]: string}>({});
  const [isCustomSpecMode, setIsCustomSpecMode] = useState<{[key: string]: boolean}>({});

  const handleSpecSelect = (field: string, value: string) => {
    if (value === 'custom') {
      setIsCustomSpecMode(prev => ({ ...prev, [field]: true }));
      setCustomSpecValues(prev => ({ ...prev, [field]: '' }));
      onSpecChange(field, '');
    } else {
      setIsCustomSpecMode(prev => ({ ...prev, [field]: false }));
      setCustomSpecValues(prev => ({ ...prev, [field]: '' }));
      onSpecChange(field, value);
    }
    onToggleSpecDropdown(field);
  };

  const handleCustomSpecChange = (field: string, value: string) => {
    setCustomSpecValues(prev => ({ ...prev, [field]: value }));
    onSpecChange(field, value);
  };

  const handleCustomSpecSubmit = (field: string) => {
    const value = customSpecValues[field];
    if (value && value.trim()) {
      onSpecChange(field, value.trim());
      setIsCustomSpecMode(prev => ({ ...prev, [field]: false }));
    }
  };

  const cancelCustomSpec = (field: string) => {
    setIsCustomSpecMode(prev => ({ ...prev, [field]: false }));
    setCustomSpecValues(prev => ({ ...prev, [field]: '' }));
    onSpecChange(field, '');
  };

  // Check if current spec value is custom (not in predefined options)
  React.useEffect(() => {
    specFields.forEach(field => {
      const config = SPEC_FIELD_CONFIG[field];
      const currentValue = formData.specs[field];
      
      if (currentValue && config?.options && !config.options.includes(currentValue)) {
        setIsCustomSpecMode(prev => ({ ...prev, [field]: true }));
        setCustomSpecValues(prev => ({ ...prev, [field]: currentValue }));
      }
    });
  }, [specFields, formData.specs]);

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
        
        const isCustomMode = isCustomSpecMode[field];
        const customValue = customSpecValues[field] || '';
        
        return (
          <View key={field} style={sharedStyles.formGroup}>
            <Text style={sharedStyles.label}>{config.label}</Text>
            {config.type === 'select' ? (
              <>
                {isCustomMode ? (
                  // Custom specification input mode
                  <View style={styles.customSpecContainer}>
                    <TextInput
                      style={[sharedStyles.input, styles.customSpecInput]}
                      placeholder={`Enter custom ${config.label.toLowerCase()}`}
                      value={customValue}
                      onChangeText={(value) => handleCustomSpecChange(field, value)}
                      placeholderTextColor="#94A3B8"
                      returnKeyType="done"
                      onSubmitEditing={() => handleCustomSpecSubmit(field)}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <View style={styles.customSpecActions}>
                      <TouchableOpacity
                        style={styles.customSpecActionButton}
                        onPress={() => cancelCustomSpec(field)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="close" size={16} color="#EF4444" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.customSpecActionButton, styles.customSpecSaveButton]}
                        onPress={() => handleCustomSpecSubmit(field)}
                        activeOpacity={0.7}
                        disabled={!customValue.trim()}
                      >
                        <Ionicons name="checkmark" size={16} color="#10B981" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  // Dropdown selection mode
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
                        <ScrollView 
                          style={styles.dropdownScrollView}
                          nestedScrollEnabled={true}
                          showsVerticalScrollIndicator={true}
                          keyboardShouldPersistTaps="handled"
                        >
                          {/* Custom specification option - moved to top */}
                          <TouchableOpacity
                            style={[sharedStyles.dropdownItem, styles.customSpecOption]}
                            onPress={() => handleSpecSelect(field, 'custom')}
                            activeOpacity={0.7}
                          >
                            <View style={styles.customSpecOptionContent}>
                              <Ionicons name="create-outline" size={18} color="#3B82F6" />
                              <Text style={[sharedStyles.dropdownItemText, styles.customSpecOptionText]}>
                                Enter Custom Value
                              </Text>
                            </View>
                          </TouchableOpacity>
                          
                          {/* Separator line */}
                          <View style={styles.dropdownSeparator} />
                          
                          {/* Standard specification options */}
                          {config.options?.map((opt) => (
                            <TouchableOpacity
                              key={opt}
                              style={sharedStyles.dropdownItem}
                              onPress={() => handleSpecSelect(field, opt)}
                              activeOpacity={0.7}
                            >
                              <Text style={sharedStyles.dropdownItemText}>{opt}</Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    )}
                  </>
                )}
                
                {/* Show hint for custom specification */}
                {isCustomMode && (
                  <Text style={styles.customSpecHint}>
                    💡 Enter a custom {config.label.toLowerCase()} value
                  </Text>
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
          <Text style={styles.customSpecsTitle}>Custom Specifications</Text>
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
                <Ionicons name="trash-outline" size={16} color="#EF4444" />
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
  dropdownScrollView: {
    maxHeight: 200,
  },
  customSpecContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  customSpecInput: {
    flex: 1,
  },
  customSpecActions: {
    flexDirection: 'row' as const,
    gap: 4,
  },
  customSpecActionButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  customSpecSaveButton: {
    backgroundColor: '#DCFCE7',
    borderColor: '#10B981',
  },
  customSpecOption: {
    backgroundColor: '#EFF6FF',
    borderBottomWidth: 1,
    borderBottomColor: '#DBEAFE',
  },
  customSpecOptionContent: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  customSpecOptionText: {
    color: '#3B82F6',
    fontWeight: '600' as const,
  },
  customSpecHint: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    fontStyle: 'italic' as const,
  },
  dropdownSeparator: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 4,
  },
  customSpecsContainer: {
    marginTop: 12,
  },
  customSpecsTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#374151',
    marginBottom: 8,
  },
  customSpecItem: {
    flexDirection: 'row' as const,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    borderRadius: 4,
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
