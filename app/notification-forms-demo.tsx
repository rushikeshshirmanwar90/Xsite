import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MaterialAddForm from '@/components/forms/MaterialAddForm';
import UsageUpdateForm from '@/components/forms/UsageUpdateForm';
import LaborCostForm from '@/components/forms/LaborCostForm';

type FormType = 'material' | 'usage' | 'labor' | null;

const NotificationFormsDemo: React.FC = () => {
  const [activeForm, setActiveForm] = useState<FormType>(null);

  // Demo project data
  const demoProject = {
    id: 'demo-project-123',
    name: 'Sample Building Construction',
  };

  const renderFormSelector = () => (
    <View style={styles.selectorContainer}>
      <Text style={styles.title}>📱 Notification Forms Demo</Text>
      <Text style={styles.subtitle}>
        Test the notification system with these sample forms
      </Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.selectorButton, styles.materialButton]}
          onPress={() => setActiveForm('material')}
        >
          <Ionicons name="cube" size={24} color="white" />
          <Text style={styles.selectorButtonText}>📦 Add Material</Text>
          <Text style={styles.selectorButtonSubtext}>Notify Admins</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.selectorButton, styles.usageButton]}
          onPress={() => setActiveForm('usage')}
        >
          <Ionicons name="bar-chart" size={24} color="white" />
          <Text style={styles.selectorButtonText}>📊 Update Usage</Text>
          <Text style={styles.selectorButtonSubtext}>Notify Admins</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.selectorButton, styles.laborButton]}
          onPress={() => setActiveForm('labor')}
        >
          <Ionicons name="people" size={24} color="white" />
          <Text style={styles.selectorButtonText}>👷 Add Labor Cost</Text>
          <Text style={styles.selectorButtonSubtext}>Notify Admins</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>ℹ️ How It Works</Text>
        <Text style={styles.infoText}>
          • Staff fills out forms for materials, usage, or labor{'\n'}
          • Form data is saved to database{'\n'}
          • Automatic notification sent to project admins{'\n'}
          • Admins receive push notifications instantly
        </Text>
      </View>
    </View>
  );

  const renderActiveForm = () => {
    const handleBack = () => setActiveForm(null);

    const commonProps = {
      projectId: demoProject.id,
      projectName: demoProject.name,
      onMaterialAdded: handleBack,
      onUsageUpdated: handleBack,
      onLaborAdded: handleBack,
    };

    switch (activeForm) {
      case 'material':
        return (
          <View style={styles.formContainer}>
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Ionicons name="arrow-back" size={24} color="#374151" />
              <Text style={styles.backButtonText}>Back to Forms</Text>
            </TouchableOpacity>
            <MaterialAddForm {...commonProps} />
          </View>
        );

      case 'usage':
        return (
          <View style={styles.formContainer}>
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Ionicons name="arrow-back" size={24} color="#374151" />
              <Text style={styles.backButtonText}>Back to Forms</Text>
            </TouchableOpacity>
            <UsageUpdateForm {...commonProps} />
          </View>
        );

      case 'labor':
        return (
          <View style={styles.formContainer}>
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Ionicons name="arrow-back" size={24} color="#374151" />
              <Text style={styles.backButtonText}>Back to Forms</Text>
            </TouchableOpacity>
            <LaborCostForm {...commonProps} />
          </View>
        );

      default:
        return renderFormSelector();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {renderActiveForm()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  selectorContainer: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 30,
  },
  buttonContainer: {
    gap: 16,
    marginBottom: 30,
  },
  selectorButton: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  materialButton: {
    backgroundColor: '#10B981',
  },
  usageButton: {
    backgroundColor: '#3B82F6',
  },
  laborButton: {
    backgroundColor: '#F59E0B',
  },
  selectorButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
  },
  selectorButtonSubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginTop: 4,
  },
  infoCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  formContainer: {
    flex: 1,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '600',
  },
});

export default NotificationFormsDemo;