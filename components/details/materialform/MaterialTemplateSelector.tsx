import React from 'react';
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
  return (
    <View style={styles.templateSection}>
      <Text style={sharedStyles.sectionLabel}>Quick Select Material Type</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.templateContainer}
      >
        {Object.entries(MATERIAL_TEMPLATES).map(([key, template]) => (
          <TouchableOpacity
            key={key}
            style={[
              styles.templateButton,
              selectedTemplateKey === key && styles.templateButtonActive,
            ]}
            onPress={() => onSelectTemplate(key)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.templateButtonText,
                selectedTemplateKey === key && styles.templateButtonTextActive,
              ]}
            >
              {template.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
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
  templateContainer: {
    flexDirection: 'row' as const,
    paddingVertical: 8,
  },
  templateButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 12,
    minWidth: 100,
    alignItems: 'center' as const,
  },
  templateButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  templateButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#3B82F6',
  },
  templateButtonTextActive: {
    color: '#fff',
  },
});

export default MaterialTemplateSelector;
