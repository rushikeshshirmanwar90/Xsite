import { Ionicons } from '@expo/vector-icons';
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
      <Text style={sharedStyles.sectionLabel}>Quick Select the Material</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={true}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.chipsRow}
      >
        {Object.entries(MATERIAL_TEMPLATES).map(([key, template]) => {
          const selected = selectedTemplateKey === key;
          return (
            <TouchableOpacity
              key={key}
              style={[styles.chip, selected && styles.chipActive]}
              onPress={() => onSelectTemplate(key)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={template.icon as React.ComponentProps<typeof Ionicons>['name']}
                size={16}
                color={selected ? '#fff' : '#3A78B5'}
              />
              <Text style={[styles.chipText, selected && styles.chipTextActive]}>
                {template.name}
              </Text>
            </TouchableOpacity>
          );
        })}
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
  chipsRow: {
    flexDirection: 'row' as const,
    gap: 8,
    paddingVertical: 4,
    paddingBottom: 10,
  },
  chip: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  chipActive: {
    backgroundColor: '#3A78B5',
    borderColor: '#3A78B5',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#374151',
  },
  chipTextActive: {
    color: '#fff',
  },
});

export default MaterialTemplateSelector;
