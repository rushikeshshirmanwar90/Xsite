import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextStyle, TouchableOpacity, View, ViewStyle } from 'react-native';
import { MATERIAL_TEMPLATES } from './constants';
import { sharedStyles } from './styles';

interface MaterialTemplateSelectorProps {
  selectedTemplateKey: string | null;
  onSelectTemplate: (templateKey: string) => void;
}

const MaterialTemplateSelector: React.FC<MaterialTemplateSelectorProps> = ({
  selectedTemplateKey,
  onSelectTemplate,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);

  const selectedName = selectedTemplateKey ? MATERIAL_TEMPLATES[selectedTemplateKey]?.name : null;

  const handleSelect = (key: string) => {
    onSelectTemplate(key);
    setShowDropdown(false);
  };

  return (
    <View style={styles.templateSection}>
      <Text style={sharedStyles.sectionLabel}>Quick Select Material Type</Text>

      <TouchableOpacity
        style={sharedStyles.selectInput}
        onPress={() => setShowDropdown((prev) => !prev)}
        activeOpacity={0.8}
      >
        <Text style={[sharedStyles.selectInputText, !selectedName && sharedStyles.placeholderText]}>
          {selectedName || 'Select Material Type'}
        </Text>
        <Text style={sharedStyles.dropdownIcon}>{showDropdown ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {showDropdown && (
        <View style={sharedStyles.dropdown}>
          <ScrollView
            style={styles.dropdownScrollView}
            nestedScrollEnabled={true}
            showsVerticalScrollIndicator={true}
            keyboardShouldPersistTaps="handled"
          >
            {Object.entries(MATERIAL_TEMPLATES).map(([key, template]) => (
              <TouchableOpacity
                key={key}
                style={[
                  sharedStyles.dropdownItem,
                  selectedTemplateKey === key && styles.dropdownItemActive,
                ]}
                onPress={() => handleSelect(key)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    sharedStyles.dropdownItemText,
                    selectedTemplateKey === key && styles.dropdownItemTextActive,
                  ]}
                >
                  {template.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

type Styles = {
  [key: string]: ViewStyle | TextStyle | any;
};

const styles = StyleSheet.create<Styles>({
  templateSection: {
    marginBottom: 24,
  },
  dropdownScrollView: {
    maxHeight: 200,
  },
  dropdownItemActive: {
    backgroundColor: '#EAF0FE',
  },
  dropdownItemTextActive: {
    color: '#3A78B5',
    fontWeight: '600' as const,
  },
});

export default MaterialTemplateSelector;
