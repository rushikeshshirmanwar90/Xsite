import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface NotificationData {
  activityId?: string;
  projectId?: string;
  activityType?: string;
  category?: string;
  action?: string;
  route?: string;
}

interface NotificationCardProps {
  id: string;
  title: string;
  body: string;
  data?: NotificationData;
  timestamp: Date;
  isRead?: boolean;
  onPress?: (notification: NotificationCardProps) => void;
  onMarkAsRead?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const NotificationCard: React.FC<NotificationCardProps> = ({
  id,
  title,
  body,
  data,
  timestamp,
  isRead = false,
  onPress,
  onMarkAsRead,
  onDelete,
}) => {
  const getIcon = () => {
    if (!data?.category) return { name: 'notifications', color: '#6B7280' };

    // Check for completion actions first
    if (data.action === 'section_completed' || data.action === 'mini_section_completed') {
      return { name: 'checkmark-circle', color: '#10B981' };
    }
    if (data.action === 'section_reopened' || data.action === 'mini_section_reopened') {
      return { name: 'refresh-circle', color: '#F59E0B' };
    }

    switch (data.category) {
      case 'project':
        return { name: 'folder', color: '#3B82F6' };
      case 'section':
        return { name: 'layers', color: '#8B5CF6' };
      case 'mini_section':
        return { name: 'grid', color: '#10B981' };
      case 'staff':
        return { name: 'people', color: '#EF4444' };
      case 'labor':
        return { name: 'hammer', color: '#F59E0B' };
      case 'material':
        if (data.action === 'imported') return { name: 'download', color: '#10B981' };
        if (data.action === 'used') return { name: 'arrow-forward', color: '#EF4444' };
        if (data.action === 'transferred') return { name: 'swap-horizontal', color: '#3B82F6' };
        return { name: 'cube', color: '#06B6D4' };
      case 'completion':
        if (data.action === 'section_completed' || data.action === 'mini_section_completed') {
          return { name: 'checkmark-circle', color: '#10B981' };
        }
        if (data.action === 'section_reopened' || data.action === 'mini_section_reopened') {
          return { name: 'refresh-circle', color: '#F59E0B' };
        }
        return { name: 'checkmark-circle', color: '#10B981' };
      default:
        return { name: 'information-circle', color: '#6B7280' };
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const icon = getIcon();

  return (
    <TouchableOpacity
      style={[
        styles.container,
        !isRead && styles.unreadContainer
      ]}
      onPress={() => onPress?.(arguments[0] as any)}
      activeOpacity={0.7}
    >
      {/* Unread indicator */}
      {!isRead && <View style={styles.unreadIndicator} />}

      {/* Icon */}
      <View style={[styles.iconContainer, { backgroundColor: icon.color }]}>
        <Ionicons name={icon.name as any} size={24} color="#FFFFFF" />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, !isRead && styles.unreadTitle]} numberOfLines={2}>
            {title}
          </Text>
          <Text style={styles.timestamp}>
            {formatTimeAgo(timestamp)}
          </Text>
        </View>

        <Text style={[styles.body, !isRead && styles.unreadBody]} numberOfLines={3}>
          {body}
        </Text>

        {/* Category badge */}
        {data?.category && (
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>
              {data.category.toUpperCase()}
            </Text>
          </View>
        )}
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        {!isRead && onMarkAsRead && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onMarkAsRead(id)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="checkmark-circle-outline" size={20} color="#10B981" />
          </TouchableOpacity>
        )}
        
        {onDelete && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onDelete(id)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  unreadContainer: {
    backgroundColor: '#FEFEFE',
    borderColor: '#E0E7FF',
    shadowColor: '#3B82F6',
    shadowOpacity: 0.1,
  },
  unreadIndicator: {
    position: 'absolute',
    left: 8,
    top: 16,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginLeft: 8, // Account for unread indicator
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    lineHeight: 20,
    marginRight: 8,
  },
  unreadTitle: {
    color: '#111827',
    fontWeight: '700',
  },
  timestamp: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  body: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 8,
  },
  unreadBody: {
    color: '#4B5563',
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.5,
  },
  actions: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: 8,
    marginLeft: 8,
  },
  actionButton: {
    padding: 4,
  },
});

export default NotificationCard;