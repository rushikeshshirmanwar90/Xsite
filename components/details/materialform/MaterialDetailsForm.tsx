import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UNIT_OPTIONS } from './constants';
import { sharedStyles } from './styles';
import { MaterialFormData } from './types';

interface MaterialDetailsFormProps {
  formData: MaterialFormData;
  onInputChange: (field: string, value: string) => void;
  showUnitDropdown: boolean;
  onToggleUnitDropdown: () => void;
}

const MaterialDetailsForm: React.FC<MaterialDetailsFormProps> = ({
  formData,
  onInputChange,
  showUnitDropdown,
  onToggleUnitDropdown,
}) => {
  const [isCustomUnit, setIsCustomUnit] = useState(false);
  const [customUnitValue, setCustomUnitValue] = useState('');

  // Check if current unit is a custom value (not in predefined options)
  React.useEffect(() => {
    if (formData.unit && !UNIT_OPTIONS.includes(formData.unit)) {
      setIsCustomUnit(true);
      setCustomUnitValue(formData.unit);
    } else {
      setIsCustomUnit(false);
      setCustomUnitValue('');
    }
  }, [formData.unit]);

  const handleUnitSelect = (unit: string) => {
    if (unit === 'custom') {
      setIsCustomUnit(true);
      setCustomUnitValue('');
      onInputChange('unit', '');
    } else {
      setIsCustomUnit(false);
      setCustomUnitValue('');
      onInputChange('unit', unit);
    }
    onToggleUnitDropdown();
  };

  const handleCustomUnitChange = (value: string) => {
    setCustomUnitValue(value);
    onInputChange('unit', value);
  };

  const handleCustomUnitSubmit = () => {
    if (customUnitValue.trim()) {
      onInputChange('unit', customUnitValue.trim());
      setIsCustomUnit(false);
    }
  };

  return (
    <View style={sharedStyles.formSection}>
      <Text style={sharedStyles.sectionLabel}>Material Details</Text>
      
      <View style={sharedStyles.formGroup}>
        <Text style={sharedStyles.label}>Material Name *</Text>
        <TextInput
          style={sharedStyles.input}
          placeholder="e.g., Steel Rod, Brick"
          value={formData.name}
          onChangeText={(value) => onInputChange('name', value)}
          placeholderTextColor="#94A3B8"
          returnKeyType="next"
          autoCapitalize="words"
        />
      </View>

      <View style={sharedStyles.formGroup}>
        <Text style={sharedStyles.label}>Unit *</Text>
        
        {isCustomUnit ? (
          // Custom unit input mode
          <View style={styles.customUnitContainer}>
            <TextInput
              style={[sharedStyles.input, styles.customUnitInput]}
              placeholder="Enter custom unit (e.g., boxes, rolls, liters)"
              value={customUnitValue}
              onChangeText={handleCustomUnitChange}
              placeholderTextColor="#94A3B8"
              returnKeyType="done"
              onSubmitEditing={handleCustomUnitSubmit}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View style={styles.customUnitActions}>
              <TouchableOpacity
                style={styles.customUnitActionButton}
                onPress={() => {
                  setIsCustomUnit(false);
                  setCustomUnitValue('');
                  onInputChange('unit', '');
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={16} color="#EF4444" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.customUnitActionButton, styles.customUnitSaveButton]}
                onPress={handleCustomUnitSubmit}
                activeOpacity={0.7}
                disabled={!customUnitValue.trim()}
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
              onPress={onToggleUnitDropdown}
            >
              <Text style={[sharedStyles.selectInputText, !formData.unit && sharedStyles.placeholderText]}>
                {formData.unit || 'Select Unit'}
              </Text>
              <Text style={sharedStyles.dropdownIcon}>{showUnitDropdown ? '▲' : '▼'}</Text>
            </TouchableOpacity>
            {showUnitDropdown && (
              <View style={sharedStyles.dropdown}>
                <ScrollView 
                  style={styles.dropdownScrollView}
                  nestedScrollEnabled={true}
                  showsVerticalScrollIndicator={true}
                  keyboardShouldPersistTaps="handled"
                >
                  {/* Custom unit option - moved to top */}
                  <TouchableOpacity
                    style={[sharedStyles.dropdownItem, styles.customUnitOption]}
                    onPress={() => handleUnitSelect('custom')}
                    activeOpacity={0.7}
                  >
                    <View style={styles.customUnitOptionContent}>
                      <Ionicons name="add-circle-outline" size={18} color="#3B82F6" />
                      <Text style={[sharedStyles.dropdownItemText, styles.customUnitOptionText]}>
                        Enter Custom Unit
                      </Text>
                    </View>
                  </TouchableOpacity>
                  
                  {/* Separator line */}
                  <View style={styles.dropdownSeparator} />
                  
                  {/* Standard unit options */}
                  {UNIT_OPTIONS.map((unit) => (
                    <TouchableOpacity
                      key={unit}
                      style={sharedStyles.dropdownItem}
                      onPress={() => handleUnitSelect(unit)}
                      activeOpacity={0.7}
                    >
                      <Text style={sharedStyles.dropdownItemText}>{unit}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </>
        )}
        
        {/* Show hint for custom unit */}
        {isCustomUnit && (
          <Text style={styles.customUnitHint}>
            💡 Enter a custom unit like "boxes", "rolls", "liters", etc.
          </Text>
        )}
      </View>

      <View style={sharedStyles.formGroup}>
        <Text style={sharedStyles.label}>Quantity *</Text>
        <TextInput
          style={sharedStyles.input}
          placeholder="Enter quantity"
          value={formData.quantity}
          onChangeText={(value) => onInputChange('quantity', value)}
          keyboardType="decimal-pad"
          placeholderTextColor="#94A3B8"
          returnKeyType="next"
        />
      </View>

      <View style={sharedStyles.formGroup}>
        <Text style={sharedStyles.label}>Cost Per Unit (₹) *</Text>
        <TextInput
          style={sharedStyles.input}
          placeholder="Enter cost per unit"
          value={formData.perUnitCost}
          onChangeText={(value) => onInputChange('perUnitCost', value)}
          keyboardType="decimal-pad"
          placeholderTextColor="#94A3B8"
          returnKeyType="done"
        />
        {formData.quantity && formData.perUnitCost && (
          <Text style={{ fontSize: 12, color: '#10B981', marginTop: 4, fontWeight: '500' }}>
            Total Cost: ₹{(parseFloat(formData.quantity) * parseFloat(formData.perUnitCost)).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  dropdownScrollView: {
    maxHeight: 200,
  },
  customUnitContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  customUnitInput: {
    flex: 1,
  },
  customUnitActions: {
    flexDirection: 'row',
    gap: 4,
  },
  customUnitActionButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  customUnitSaveButton: {
    backgroundColor: '#DCFCE7',
    borderColor: '#10B981',
  },
  customUnitOption: {
    backgroundColor: '#EFF6FF',
    borderBottomWidth: 1,
    borderBottomColor: '#DBEAFE',
  },
  customUnitOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  customUnitOptionText: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  customUnitHint: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    fontStyle: 'italic',
  },
  dropdownSeparator: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 4,
  },
});

export default MaterialDetailsForm;
