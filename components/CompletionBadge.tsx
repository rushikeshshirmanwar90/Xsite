import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CompletionBadgeProps {
  size?: 'small' | 'medium' | 'large';
  showIcon?: boolean;
  text?: string;
}

const CompletionBadge: React.FC<CompletionBadgeProps> = ({ 
  size = 'medium', 
  showIcon = true,
  text = 'Completed'
}) => {
  const getStyles = () => {
    switch (size) {
      case 'small':
        return {
          container: styles.containerSmall,
          icon: styles.iconSmall,
          text: styles.textSmall,
          iconSize: 10,
        };
      case 'large':
        return {
          container: styles.containerLarge,
          icon: styles.iconLarge,
          text: styles.textLarge,
          iconSize: 16,
        };
      default:
        return {
          container: styles.containerMedium,
          icon: styles.iconMedium,
          text: styles.textMedium,
          iconSize: 12,
        };
    }
  };

  const styleSet = getStyles();

  return (
    <View style={[styles.container, styleSet.container]}>
      {showIcon && (
        <View style={[styles.iconContainer, styleSet.icon]}>
          <Ionicons name="checkmark" size={styleSet.iconSize} color="#FFFFFF" />
        </View>
      )}
      <Text style={[styles.text, styleSet.text]}>{text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  containerSmall: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  containerMedium: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  containerLarge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  iconContainer: {
    backgroundColor: '#10B981',
    borderRadius: 10,
    padding: 2,
    marginRight: 6,
  },
  iconSmall: {
    padding: 1,
    marginRight: 4,
  },
  iconMedium: {
    padding: 2,
    marginRight: 6,
  },
  iconLarge: {
    padding: 3,
    marginRight: 8,
  },
  text: {
    fontWeight: '700',
    color: '#059669',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textSmall: {
    fontSize: 10,
  },
  textMedium: {
    fontSize: 12,
  },
  textLarge: {
    fontSize: 14,
  },
});

export default CompletionBadge;