import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UnifiedActivity } from '../hooks/useUnifiedActivities';

interface UnifiedActivityCardProps {
  activity: UnifiedActivity;
  onPress?: (activity: UnifiedActivity) => void;
}

const UnifiedActivityCard: React.FC<UnifiedActivityCardProps> = ({
  activity,
  onPress,
}) => {
  const getIcon = () => {
    if (activity.type === 'material') {
      switch (activity.action) {
        case 'imported':
          return { name: 'download', color: '#10B981' };
        case 'used':
          return { name: 'arrow-forward', color: '#EF4444' };
        case 'transferred':
          return { name: 'swap-horizontal', color: '#3B82F6' };
        default:
          return { name: 'cube', color: '#06B6D4' };
      }
    } else {
      // Completion activities
      switch (activity.action) {
        case 'complete':
          return { name: 'checkmark-circle', color: '#10B981' };
        case 'reopen':
          return { name: 'refresh-circle', color: '#F59E0B' };
        default:
          return { name: 'information-circle', color: '#6B7280' };
      }
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

  const getCategoryBadgeColor = () => {
    if (activity.type === 'material') {
      switch (activity.action) {
        case 'imported':
          return '#D1FAE5';
        case 'used':
          return '#FEE2E2';
        case 'transferred':
          return '#DBEAFE';
        default:
          return '#F0F9FF';
      }
    } else {
      // Completion activities
      switch (activity.action) {
        case 'complete':
          return '#D1FAE5';
        case 'reopen':
          return '#FEF3C7';
        default:
          return '#F3F4F6';
      }
    }
  };

  const getCategoryBadgeTextColor = () => {
    if (activity.type === 'material') {
      switch (activity.action) {
        case 'imported':
          return '#065F46';
        case 'used':
          return '#991B1B';
        case 'transferred':
          return '#1E40AF';
        default:
          return '#0C4A6E';
      }
    } else {
      // Completion activities
      switch (activity.action) {
        case 'complete':
          return '#065F46';
        case 'reopen':
          return '#92400E';
        default:
          return '#374151';
      }
    }
  };

  const icon = getIcon();

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress?.(activity)}
      activeOpacity={0.7}
    >
      {/* Icon */}
      <View style={[styles.iconContainer, { backgroundColor: icon.color }]}>
        <Ionicons name={icon.name as any} size={24} color="#FFFFFF" />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={2}>
            {activity.title}
          </Text>
          <Text style={styles.timestamp}>
            {formatTimeAgo(activity.timestamp)}
          </Text>
        </View>

        <Text style={styles.description} numberOfLines={3}>
          {activity.description}
        </Text>

        {/* Location info */}
        {activity.projectName && (
          <View style={styles.locationContainer}>
            <Ionicons name="location-outline" size={14} color="#6B7280" />
            <Text style={styles.locationText} numberOfLines={1}>
              {activity.projectName}
              {activity.sectionName && ` → ${activity.sectionName}`}
              {activity.miniSectionName && ` → ${activity.miniSectionName}`}
            </Text>
          </View>
        )}

        {/* Category and additional info */}
        <View style={styles.footer}>
          <View 
            style={[
              styles.categoryBadge, 
              { backgroundColor: getCategoryBadgeColor() }
            ]}
          >
            <Text 
              style={[
                styles.categoryBadgeText,
                { color: getCategoryBadgeTextColor() }
              ]}
            >
              {activity.type === 'material' ? activity.action.toUpperCase() : activity.action.toUpperCase()}
            </Text>
          </View>

          {/* Additional info based on type */}
          {activity.type === 'material' && activity.data?.materialCount && (
            <View style={styles.additionalInfo}>
              <Text style={styles.additionalInfoText}>
                {activity.data.materialCount} item{activity.data.materialCount > 1 ? 's' : ''}
              </Text>
              {activity.data.totalCost > 0 && (
                <Text style={styles.additionalInfoText}>
                  • ₹{activity.data.totalCost.toLocaleString()}
                </Text>
              )}
            </View>
          )}

          {activity.type === 'completion' && (
            <View style={styles.additionalInfo}>
              <Text style={styles.additionalInfoText}>
                {activity.category === 'section' ? 'Section' : 'Mini-Section'}
              </Text>
            </View>
          )}
        </View>
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
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
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
  timestamp: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  description: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  additionalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  additionalInfoText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
  },
});

export default UnifiedActivityCard;