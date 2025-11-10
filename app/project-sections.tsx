import { ProjectSection } from '@/types/project';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ProjectSections = () => {
  const params = useLocalSearchParams();
  const { id, name, sectionData, materialAvailable, materialUsed } = params;
  
  const [sections, setSections] = useState<ProjectSection[]>([]);

  useEffect(() => {
    if (sectionData) {
      const parsedData = JSON.parse(Array.isArray(sectionData) ? sectionData[0] : sectionData);
      setSections(parsedData);
      
      // If there's only one section and we're on this page, show a helpful message
      if (parsedData.length === 1) {
        console.log('Single section detected on sections page - user could have been redirected directly');
      }
    }
  }, [sectionData]);

  useEffect(() => {
    console.log('Project sections received materials:', {
      materialAvailableCount: materialAvailable ? JSON.parse(Array.isArray(materialAvailable) ? materialAvailable[0] : materialAvailable).length : 0,
      materialUsedCount: materialUsed ? JSON.parse(Array.isArray(materialUsed) ? materialUsed[0] : materialUsed).length : 0
    });
  }, [materialAvailable, materialUsed]);

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
    console.log('Navigating to details with materials:', {
      sectionId: section._id || section.sectionId,
      passingMaterialsData: true
    });
    
    router.push({
      pathname: '../details',
      params: {
        projectId: id as string,
        projectName: name as string,
        sectionId: section._id || section.sectionId,
        sectionName: section.name,
        materialAvailable: materialAvailable as string,
        materialUsed: materialUsed as string
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
        {/* Single Section Notice */}
        {sections && sections.length === 1 && (
          <View style={styles.singleSectionNotice}>
            <Ionicons name="information-circle" size={20} color="#3B82F6" />
            <Text style={styles.singleSectionText}>
              This project has only one section. You can go directly to details.
            </Text>
          </View>
        )}
        
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
                <View style={styles.sectionInfo}>
                  <Text style={styles.sectionName}>{section.name}</Text>
                  {sections.length === 1 && (
                    <Text style={styles.sectionHint}>Tap to view materials and details</Text>
                  )}
                </View>
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
            <Ionicons name="folder-open-outline" size={64} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No Sections Found</Text>
            <Text style={styles.emptySubtitle}>
              This project doesn't have any sections yet. Sections help organize your project materials and work areas.
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
    flex: 1,
    marginRight: 12,
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
  singleSectionNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
  },
  singleSectionText: {
    fontSize: 14,
    color: '#1E40AF',
    marginLeft: 8,
    flex: 1,
  },
  sectionInfo: {
    flex: 1,
    marginRight: 8,
  },
  sectionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    flexShrink: 1,
  },
  sectionHint: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  viewButton: {
    backgroundColor: '#0EA5E9',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    flexShrink: 0,
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