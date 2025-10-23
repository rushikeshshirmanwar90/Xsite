import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { 
  Alert, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { domain } from '@/lib/domain';
import axios from 'axios';
import { ProjectSection } from '@/types/project';

const ProjectSections = () => {
  const params = useLocalSearchParams();
  const { id, name, sectionData } = params;
  
  const [sections, setSections] = useState<ProjectSection[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (sectionData) {
      const parsedData = JSON.parse(Array.isArray(sectionData) ? sectionData[0] : sectionData);
      setSections(parsedData);
    }
  }, [sectionData]);

  const getSectionIcon = (type: string) => {
    switch(type?.toLowerCase()) {
      case 'building':
      case 'buildings':
        return 'business';
      case 'rowhouse':
        return 'home';
      default:
        return 'grid';
    }
  };

  const handleViewDetails = (section: ProjectSection) => {
    router.push({
      pathname: '../details',
      params: {
        projectId: id as string,
        projectName: name as string,
        sectionId: section._id || section.sectionId,
        sectionName: section.name
      }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#0EA5E9" />
          </TouchableOpacity>
          <View>
            <Text style={styles.projectName}>{name}</Text>
            <Text style={styles.projectSubtitle}>Project Sections</Text>
          </View>
        </View>
      </View>

      {/* Sections List */}
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {sections && sections.length > 0 ? (
          sections.map((section, index) => (
            <View key={section._id || index} style={styles.sectionCard}>
              <View style={styles.sectionContent}>
                <View style={styles.sectionIconContainer}>
                  <Ionicons 
                    name={getSectionIcon(section.type)} 
                    size={24} 
                    color="#0EA5E9" 
                  />
                </View>
                <Text style={styles.sectionName}>{section.name}</Text>
              </View>
              <TouchableOpacity
                style={styles.viewButton}
                onPress={() => handleViewDetails(section)}
              >
                <Text style={styles.viewButtonText}>View Details</Text>
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No Sections Yet</Text>
            <Text style={styles.emptySubtitle}>
              This project doesn't have any sections yet
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 12,
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  projectName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  projectSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  viewButton: {
    backgroundColor: '#0EA5E9',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  viewButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: '80%',
  },
});

export default ProjectSections;