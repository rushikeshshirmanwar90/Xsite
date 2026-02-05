import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useNotifications } from '../hooks/useNotifications';
import NotificationCard from '../components/NotificationCard';

const NotificationsScreen: React.FC = () => {
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  } = useNotifications();

  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.isRead)
    : notifications;

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh - in real app, you might fetch from server
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const handleNotificationPress = (notification: any) => {
    // Mark as read when tapped
    if (!notification.isRead) {
      markAsRead(notification.id);
    }

    // Navigate based on notification data
    if (notification.data?.route) {
      switch (notification.data.route) {
        case 'notification':
          // Already on notification screen
          break;
        case 'project':
          if (notification.data.projectId) {
            router.push(`/project/${notification.data.projectId}`);
          }
          break;
        default:
          // Handle other routes
          break;
      }
    }
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to clear all notifications? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear All', 
          style: 'destructive',
          onPress: clearAll 
        },
      ]
    );
  };

  const handleDeleteNotification = (id: string) => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => deleteNotification(id) 
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>

        <View style={styles.headerActions}>
          {unreadCount > 0 && (
            <TouchableOpacity onPress={markAllAsRead} style={styles.headerActionButton}>
              <Ionicons name="checkmark-done" size={20} color="#10B981" />
            </TouchableOpacity>
          )}
          
          {notifications.length > 0 && (
            <TouchableOpacity onPress={handleClearAll} style={styles.headerActionButton}>
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterTabText, filter === 'all' && styles.filterTabTextActive]}>
            All ({notifications.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filterTab, filter === 'unread' && styles.filterTabActive]}
          onPress={() => setFilter('unread')}
        >
          <Text style={[styles.filterTabText, filter === 'unread' && styles.filterTabTextActive]}>
            Unread ({unreadCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Notifications List */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#3B82F6']}
            tintColor="#3B82F6"
          />
        }
      >
        {error ? (
          <View style={styles.errorState}>
            <View style={styles.errorIconContainer}>
              <Ionicons name="alert-circle" size={64} color="#EF4444" />
            </View>
            <Text style={styles.errorTitle}>Error Loading Notifications</Text>
            <Text style={styles.errorSubtitle}>{error}</Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={() => {
                // Force refresh by reloading the component
                setRefreshing(true);
                setTimeout(() => setRefreshing(false), 1000);
              }}
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : isLoading ? (
          <View style={styles.loadingState}>
            <View style={styles.loadingIconContainer}>
              <Ionicons name="hourglass" size={64} color="#6B7280" />
            </View>
            <Text style={styles.loadingTitle}>Loading Notifications...</Text>
            <Text style={styles.loadingSubtitle}>Please wait while we load your notifications.</Text>
          </View>
        ) : filteredNotifications.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Ionicons 
                name={filter === 'unread' ? "checkmark-circle" : "notifications-outline"} 
                size={64} 
                color="#9CA3AF" 
              />
            </View>
            <Text style={styles.emptyTitle}>
              {filter === 'unread' ? 'All caught up!' : 'No notifications yet'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {filter === 'unread' 
                ? 'You have no unread notifications.' 
                : 'When you receive notifications, they will appear here.'
              }
            </Text>
          </View>
        ) : (
          <View style={styles.notificationsList}>
            {filteredNotifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                id={notification.id}
                title={notification.title}
                body={notification.body}
                data={notification.data}
                timestamp={notification.timestamp}
                isRead={notification.isRead}
                onPress={handleNotificationPress}
                onMarkAsRead={markAsRead}
                onDelete={handleDeleteNotification}
              />
            ))}
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
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginRight: 8,
  },
  unreadBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerActionButton: {
    padding: 8,
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  filterTab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  filterTabActive: {
    borderBottomColor: '#3B82F6',
  },
  filterTabText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterTabTextActive: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  notificationsList: {
    padding: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  // Error state styles
  errorState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
    paddingHorizontal: 40,
  },
  errorIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#EF4444',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Loading state styles
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
    paddingHorizontal: 40,
  },
  loadingIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  loadingSubtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default NotificationsScreen;