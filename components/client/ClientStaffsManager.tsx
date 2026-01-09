import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { domain } from '@/lib/domain';

interface StaffMember {
  staffId: string;
  staffName: string;
  assignedAt: string;
}

interface ClientStaffsManagerProps {
  clientId: string;
  clientName: string;
  onStaffRemoved?: () => void;
}

const ClientStaffsManager: React.FC<ClientStaffsManagerProps> = ({
  clientId,
  clientName,
  onStaffRemoved,
}) => {
  const [staffs, setStaffs] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [removingStaffId, setRemovingStaffId] = useState<string | null>(null);

  const fetchClientStaffs = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }

      console.log('🔍 Fetching staffs for client:', clientId);
      const response = await axios.get(`${domain}/api/clients/staffs?clientId=${clientId}`);
      const responseData = response.data as any;
      
      if (responseData.success) {
        const staffsData = responseData.data.staffs || [];
        setStaffs(staffsData);
        console.log('✅ Loaded', staffsData.length, 'staff members');
      } else {
        console.error('❌ Failed to fetch staffs:', responseData.message);
        setStaffs([]);
      }
    } catch (error: any) {
      console.error('❌ Error fetching client staffs:', error);
      if (error.response?.status === 404) {
        setStaffs([]);
      } else {
        Alert.alert('Error', 'Failed to load staff members');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRemoveStaff = async (staffId: string, staffName: string) => {
    Alert.alert(
      'Remove Staff Member',
      `Are you sure you want to remove ${staffName} from ${clientName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              setRemovingStaffId(staffId);
              console.log('🗑️ Removing staff:', staffId, 'from client:', clientId);

              const response = await axios.delete(
                `${domain}/api/clients/staffs?clientId=${clientId}&staffId=${staffId}`
              );
              const responseData = response.data as any;

              if (responseData.success) {
                console.log('✅ Staff removed successfully');
                
                // Remove from local state
                setStaffs(prev => prev.filter(staff => staff.staffId !== staffId));
                
                // Call callback if provided
                if (onStaffRemoved) {
                  onStaffRemoved();
                }

                Alert.alert('Success', `${staffName} has been removed from ${clientName}`);
              } else {
                throw new Error(responseData.message || 'Failed to remove staff');
              }
            } catch (error: any) {
              console.error('❌ Error removing staff:', error);
              Alert.alert(
                'Error',
                error.response?.data?.message || 'Failed to remove staff member'
              );
            } finally {
              setRemovingStaffId(null);
            }
          },
        },
      ]
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchClientStaffs(false);
  };

  useEffect(() => {
    if (clientId) {
      fetchClientStaffs();
    }
  }, [clientId]);

  const renderStaffItem = ({ item }: { item: StaffMember }) => {
    const isRemoving = removingStaffId === item.staffId;
    const assignedDate = new Date(item.assignedAt).toLocaleDateString();

    return (
      <View style={styles.staffItem}>
        <View style={styles.staffInfo}>
          <View style={styles.staffHeader}>
            <View style={styles.staffIcon}>
              <Ionicons name="person" size={20} color="#3B82F6" />
            </View>
            <View style={styles.staffDetails}>
              <Text style={styles.staffName}>{item.staffName}</Text>
              <Text style={styles.staffMeta}>Assigned on {assignedDate}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.removeButton, isRemoving && styles.removeButtonDisabled]}
          onPress={() => handleRemoveStaff(item.staffId, item.staffName)}
          disabled={isRemoving}
        >
          {isRemoving ? (
            <ActivityIndicator size="small" color="#EF4444" />
          ) : (
            <Ionicons name="trash-outline" size={18} color="#EF4444" />
          )}
        </TouchableOpacity>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="people-outline" size={48} color="#9CA3AF" />
      <Text style={styles.emptyTitle}>No Staff Members</Text>
      <Text style={styles.emptySubtitle}>
        No staff members are currently assigned to {clientName}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading staff members...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Staff Members</Text>
        <Text style={styles.subtitle}>
          {staffs.length} staff member{staffs.length !== 1 ? 's' : ''} assigned to {clientName}
        </Text>
      </View>

      <FlatList
        data={staffs}
        keyExtractor={(item) => item.staffId}
        renderItem={renderStaffItem}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#3B82F6']}
            tintColor="#3B82F6"
          />
        }
        contentContainerStyle={staffs.length === 0 ? styles.emptyContainer : undefined}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  staffItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 4,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  staffInfo: {
    flex: 1,
  },
  staffHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  staffIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  staffDetails: {
    flex: 1,
  },
  staffName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  staffMeta: {
    fontSize: 12,
    color: '#6B7280',
  },
  removeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  removeButtonDisabled: {
    opacity: 0.5,
  },
  emptyContainer: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4B5563',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default ClientStaffsManager;