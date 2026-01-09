import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { domain } from '@/lib/domain';
import ClientStaffsManager from '@/components/client/ClientStaffsManager';

interface ClientData {
  _id: string;
  name: string;
  email: string;
  phoneNumber: number;
  city: string;
  state: string;
  address: string;
  staffs: {
    staffId: string;
    staffName: string;
    assignedAt: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

const ClientDetailsPage: React.FC = () => {
  const router = useRouter();
  const { clientId } = useLocalSearchParams<{ clientId: string }>();
  
  const [client, setClient] = useState<ClientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'staffs'>('info');

  const fetchClientDetails = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching client details for:', clientId);
      
      const response = await axios.get(`${domain}/api/clients?id=${clientId}`);
      const responseData = response.data as any;
      
      if (responseData.success) {
        setClient(responseData.data);
        console.log('✅ Client details loaded');
      } else {
        throw new Error(responseData.message || 'Failed to fetch client details');
      }
    } catch (error: any) {
      console.error('❌ Error fetching client details:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to load client details'
      );
      router.back();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clientId) {
      fetchClientDetails();
    }
  }, [clientId]);

  const handleStaffRemoved = () => {
    // Refresh client details to update staff count
    fetchClientDetails();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading client details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!client) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={styles.errorText}>Client not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const renderClientInfo = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Basic Information</Text>
        
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoIconContainer}>
              <Ionicons name="business-outline" size={20} color="#3B82F6" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Company Name</Text>
              <Text style={styles.infoValue}>{client.name}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIconContainer}>
              <Ionicons name="mail-outline" size={20} color="#3B82F6" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{client.email}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIconContainer}>
              <Ionicons name="call-outline" size={20} color="#3B82F6" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Phone Number</Text>
              <Text style={styles.infoValue}>{client.phoneNumber}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIconContainer}>
              <Ionicons name="location-outline" size={20} color="#3B82F6" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Address</Text>
              <Text style={styles.infoValue}>
                {client.address}, {client.city}, {client.state}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Statistics</Text>
        
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="people" size={24} color="#10B981" />
            </View>
            <Text style={styles.statValue}>{client.staffs?.length || 0}</Text>
            <Text style={styles.statLabel}>Staff Members</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="calendar" size={24} color="#F59E0B" />
            </View>
            <Text style={styles.statValue}>
              {new Date(client.createdAt).toLocaleDateString()}
            </Text>
            <Text style={styles.statLabel}>Created</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderStaffsTab = () => (
    <View style={styles.tabContent}>
      <ClientStaffsManager
        clientId={client._id}
        clientName={client.name}
        onStaffRemoved={handleStaffRemoved}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{client.name}</Text>
          <Text style={styles.headerSubtitle}>Client Details</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'info' && styles.activeTab]}
          onPress={() => setActiveTab('info')}
        >
          <Ionicons 
            name="information-circle-outline" 
            size={20} 
            color={activeTab === 'info' ? '#3B82F6' : '#6B7280'} 
          />
          <Text style={[styles.tabText, activeTab === 'info' && styles.activeTabText]}>
            Information
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'staffs' && styles.activeTab]}
          onPress={() => setActiveTab('staffs')}
        >
          <Ionicons 
            name="people-outline" 
            size={20} 
            color={activeTab === 'staffs' ? '#3B82F6' : '#6B7280'} 
          />
          <Text style={[styles.tabText, activeTab === 'staffs' && styles.activeTabText]}>
            Staff ({client.staffs?.length || 0})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === 'info' ? renderClientInfo() : renderStaffsTab()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#EF4444',
    marginTop: 16,
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#3B82F6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginLeft: 8,
  },
  activeTabText: {
    color: '#3B82F6',
  },
  tabContent: {
    flex: 1,
  },
  infoSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statIconContainer: {
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default ClientDetailsPage;