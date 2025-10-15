import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  StyleSheet, 
  Platform, 
  KeyboardAvoidingView,
  ViewStyle,
  TextStyle,
  TextInputProps,
  StyleProp
} from 'react-native';
import 'react-native'; // This imports the JSX namespace
import { Ionicons } from '@expo/vector-icons';
import { MaterialTemplate, MaterialFormData } from '../../types/material';
import { SPEC_FIELD_CONFIG } from '../../constants/materials';

interface SpecFieldConfig {
  type: string;
  label: string;
  placeholder: string;
  options?: string[];
}

type ExtendedSpecField = SpecFieldConfig & {
  options?: string[];
  placeholder?: string;
};

interface MaterialFormProps {
  formData: MaterialFormData;
  selectedTemplateKey: string | null;
  specFields: string[];
  onTemplateSelect: (key: string) => void;
  onInputChange: (field: string, value: string) => void;
  onSpecChange: (field: string, value: string) => void;
  onSubmit: () => void;
  onClose: () => void;
  materialTemplates: Record<string, MaterialTemplate>;
}

const MaterialForm: React.FC<MaterialFormProps> = ({
  formData,
  selectedTemplateKey,
  specFields,
  onTemplateSelect,
  onInputChange,
  onSpecChange,
  onSubmit,
  onClose,
  materialTemplates,
}: MaterialFormProps) => {
  const [showSpecDropdown, setShowSpecDropdown] = useState<string | null>(null);

  const renderSpecField = (fieldName: string) => {
    const fieldConfig = SPEC_FIELD_CONFIG[fieldName as keyof typeof SPEC_FIELD_CONFIG] as ExtendedSpecField | undefined;
    if (!fieldConfig) return null;

    const value = formData.specs?.[fieldName] || '';

    if (fieldConfig.type === 'select') {
      return (
        <View key={fieldName} style={styles.inputGroup}>
          <Text style={styles.inputLabel}>{fieldConfig.label}</Text>
          <TouchableOpacity
            style={styles.selectInput}
            onPress={() => setShowSpecDropdown(showSpecDropdown === fieldName ? null : fieldName)}
          >
            <Text style={[styles.selectText, !value && { color: '#94A3B8' }]}>
              {value || `Select ${fieldConfig.label.toLowerCase()}`}
            </Text>
            <Ionicons
              name={showSpecDropdown === fieldName ? 'chevron-up' : 'chevron-down'}
              size={20}
              color="#64748B"
            />
          </TouchableOpacity>

          {showSpecDropdown === fieldName && (
            <View style={styles.dropdown}>
              {fieldConfig.options?.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={styles.dropdownItem}
                  onPress={() => {
                    onSpecChange(fieldName, option);
                    setShowSpecDropdown(null);
                  }}
                >
                  <Text style={styles.dropdownItemText}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      );
    }

    return (
      <View key={fieldName} style={styles.inputGroup}>
        <Text style={styles.inputLabel}>{fieldConfig.label}</Text>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={(text) => onSpecChange(fieldName, text)}
          placeholder={fieldConfig.placeholder}
          keyboardType={fieldConfig.type === 'number' ? 'numeric' : 'default'}
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formHeader}>
            <Text style={styles.formTitle}>Add Material Entry</Text>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="close-circle-outline" size={28} color="#64748B" />
            </TouchableOpacity>
          </View>

          <View style={styles.templateSection}>
            <Text style={styles.sectionLabel}>Quick Select Material Type</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.templateContainer}
            >
              {Object.entries(materialTemplates).map(([key, template]) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.templateButton,
                    selectedTemplateKey === key && styles.templateButtonActive,
                  ]}
                  onPress={() => onTemplateSelect(key)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={template.icon as keyof typeof Ionicons.glyphMap}
                    size={20}
                    color={selectedTemplateKey === key ? '#fff' : template.color}
                  />
                  <Text style={styles.templateButtonText}>
                    {template.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.sectionLabel}>Basic Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Material Name</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => onInputChange('name', text)}
                placeholder="e.g., Steel Rods, Bricks"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Category</Text>
              <TextInput
                style={styles.input}
                value={formData.category}
                onChangeText={(text) => onInputChange('category', text)}
                placeholder="e.g., Structural, Electrical"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Quantity</Text>
              <View style={styles.quantityContainer}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={formData.quantity?.toString() || ''}
                  onChangeText={(text) => onInputChange('quantity', text)}
                  placeholder="0"
                  keyboardType="numeric"
                />
                <View style={styles.unitContainer}>
                  <Text style={styles.unitText}>{formData.unit || 'unit'}</Text>
                </View>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Location</Text>
              <TextInput
                style={styles.input}
                value={formData.location}
                onChangeText={(text) => onInputChange('location', text)}
                placeholder="e.g., Warehouse A, Site 1"
              />
            </View>

            {specFields.map((field) => renderSpecField(field))}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Notes</Text>
            <TextInput
              style={[styles.input, styles.notesInput]}
              value={formData.notes || ''}
              onChangeText={(text) => onInputChange('notes', text)}
              placeholder="Any additional details or instructions..."
              multiline
              numberOfLines={3}
            />
          </View>

          <TouchableOpacity 
            style={styles.submitButton}
            onPress={onSubmit}
          >
            <Text style={styles.submitButtonText}>Save Material</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100, // Extra space for the floating button
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  templateSection: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  templateContainer: {
    paddingBottom: 8,
  },
  templateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  templateButtonActive: {
    backgroundColor: '#0EA5E9',
    borderColor: '#0EA5E9',
  },
  templateButtonText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#475569',
  },
  templateButtonTextActive: {
    color: '#fff',
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1E293B',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  formSection: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 6,
  },
  submitButton: {
    backgroundColor: '#0EA5E9',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  selectInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  selectText: {
    fontSize: 16,
    color: '#1E293B',
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginTop: 4,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 10,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#1E293B',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unitContainer: {
    position: 'absolute',
    right: 12,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  unitText: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '500',
  },
  notesInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 8,
      },
    }),
  },
});

export default React.memo(MaterialForm);
