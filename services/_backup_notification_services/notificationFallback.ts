/**
 * Fallback notification system for Expo Go on Android
 * This provides basic notification functionality without expo-notifications
 */

import { Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface FallbackNotification {
  id: string;
  title: string;
  body: string;
  data?: any;
  timestamp: Date;
  isRead: boolean;
}

class NotificationFallback {
  private static instance: NotificationFallback;
  private notifications: FallbackNotification[] = [];
  private listeners: ((notifications: FallbackNotification[]) => void)[] = [];

  static getInstance(): NotificationFallback {
    if (!NotificationFallback.instance) {
      NotificationFallback.instance = new NotificationFallback();
    }
    return NotificationFallback.instance;
  }

  constructor() {
    this.loadNotifications();
  }

  /**
   * Show a simple alert as notification fallback
   */
  async showNotificationAlert(title: string, body: string, data?: any) {
    // Add to local storage
    const notification: FallbackNotification = {
      id: Date.now().toString(),
      title,
      body,
      data,
      timestamp: new Date(),
      isRead: false,
    };

    this.addLocalNotification(notification);

    // Show alert on Android Expo Go
    if (Platform.OS === 'android') {
      Alert.alert(
        title,
        body,
        [
          {
            text: 'OK',
            onPress: () => {
              console.log('Notification acknowledged:', { title, body, data });
            },
          },
        ]
      );
    }
  }

  /**
   * Add a local notification to the list
   */
  addLocalNotification(notification: FallbackNotification) {
    this.notifications.unshift(notification);
    this.saveNotifications();
    this.notifyListeners();
  }

  /**
   * Get all notifications
   */
  getNotifications(): FallbackNotification[] {
    return [...this.notifications];
  }

  /**
   * Get unread notifications count
   */
  getUnreadCount(): number {
    return this.notifications.filter(n => !n.isRead).length;
  }

  /**
   * Mark notification as read
   */
  markAsRead(id: string) {
    const notification = this.notifications.find(n => n.id === id);
    if (notification) {
      notification.isRead = true;
      this.saveNotifications();
      this.notifyListeners();
    }
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead() {
    this.notifications.forEach(n => n.isRead = true);
    this.saveNotifications();
    this.notifyListeners();
  }

  /**
   * Delete notification
   */
  deleteNotification(id: string) {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.saveNotifications();
    this.notifyListeners();
  }

  /**
   * Clear all notifications
   */
  clearAll() {
    this.notifications = [];
    this.saveNotifications();
    this.notifyListeners();
  }

  /**
   * Subscribe to notification updates
   */
  subscribe(listener: (notifications: FallbackNotification[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Notify all listeners
   */
  private notifyListeners() {
    this.listeners.forEach(listener => listener([...this.notifications]));
  }

  /**
   * Save notifications to AsyncStorage
   */
  private async saveNotifications() {
    try {
      await AsyncStorage.setItem('fallback_notifications', JSON.stringify(this.notifications));
    } catch (error) {
      console.error('Error saving fallback notifications:', error);
    }
  }

  /**
   * Load notifications from AsyncStorage
   */
  private async loadNotifications() {
    try {
      const stored = await AsyncStorage.getItem('fallback_notifications');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.notifications = parsed.map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp),
        }));
        this.notifyListeners();
      }
    } catch (error) {
      console.error('Error loading fallback notifications:', error);
    }
  }
}

export default NotificationFallback;