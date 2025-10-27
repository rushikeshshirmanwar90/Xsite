import React from 'react';
import { StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';

interface ProgressIndicatorProps {
  currentStep: number;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ currentStep }) => {
  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressBar}>
        <View style={[styles.progressStep, currentStep >= 0 && styles.progressStepActive]}>
          <Text style={[styles.progressStepNumber, currentStep >= 0 && styles.progressStepNumberActive]}>1</Text>
        </View>
        <View style={[styles.progressLine, currentStep >= 1 && styles.progressLineActive]} />
        <View style={[styles.progressStep, currentStep >= 1 && styles.progressStepActive]}>
          <Text style={[styles.progressStepNumber, currentStep >= 1 && styles.progressStepNumberActive]}>2</Text>
        </View>
      </View>
      <View style={styles.progressLabels}>
        <Text style={[styles.progressLabel, currentStep >= 0 && styles.progressLabelActive]}>Add Materials</Text>
        <Text style={[styles.progressLabel, currentStep >= 1 && styles.progressLabelActive]}>Review & Purpose</Text>
      </View>
    </View>
  );
};

type Styles = {
  [key: string]: ViewStyle | TextStyle | any;
};

const styles = StyleSheet.create<Styles>({
  progressContainer: {
    backgroundColor: '#fff',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  progressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  progressStep: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E2E8F0',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  progressStepActive: {
    backgroundColor: '#3B82F6',
  },
  progressStepNumber: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#64748B',
  },
  progressStepNumberActive: {
    color: '#fff',
  },
  progressLine: {
    width: 80,
    height: 2,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 8,
  },
  progressLineActive: {
    backgroundColor: '#3B82F6',
  },
  progressLabels: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
  },
  progressLabel: {
    fontSize: 13,
    color: '#64748B',
    flex: 1,
    textAlign: 'center' as const,
  },
  progressLabelActive: {
    color: '#3B82F6',
    fontWeight: '600' as const,
  },
});

export default ProgressIndicator;
