import React from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
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
        />
      </View>

      <View style={sharedStyles.formGroup}>
        <Text style={sharedStyles.label}>Unit *</Text>
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
            {UNIT_OPTIONS.map((unit) => (
              <TouchableOpacity
                key={unit}
                style={sharedStyles.dropdownItem}
                onPress={() => {
                  onInputChange('unit', unit);
                  onToggleUnitDropdown();
                }}
                activeOpacity={0.7}
              >
                <Text style={sharedStyles.dropdownItemText}>{unit}</Text>
              </TouchableOpacity>
            ))}
          </View>
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
        />
      </View>
    </View>
  );
};

export default MaterialDetailsForm;
