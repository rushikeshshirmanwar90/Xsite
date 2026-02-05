import { useState, useEffect } from 'react';
import NotificationManager, { LocalNotification } from '../services/notificationManager';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<LocalNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const initializeNotifications = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const notificationManager = NotificationManager.getInstance();
        
        // Wait a bit for the manager to load notifications
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Initial load
        const initialNotifications = notificationManager.getNotifications();
        const initialUnreadCount = notificationManager.getUnreadCount();
        
        setNotifications(initialNotifications);
        setUnreadCount(initialUnreadCount);

        // Subscribe to updates
        unsubscribe = notificationManager.subscribe((updatedNotifications) => {
          try {
            setNotifications(updatedNotifications);
            setUnreadCount(notificationManager.getUnreadCount());
            
            // Update badge count
            notificationManager.updateBadgeCount().catch(error => {
              console.warn('Failed to update badge count:', error);
            });
          } catch (subscriptionError) {
            console.error('Error in notification subscription:', subscriptionError);
          }
        });

        setIsLoading(false);
      } catch (initError) {
        console.error('Error initializing notifications:', initError);
        setError('Failed to load notifications');
        setIsLoading(false);
      }
    };

    initializeNotifications();

    return () => {
      if (unsubscribe) {
        try {
          unsubscribe();
        } catch (error) {
          console.error('Error unsubscribing from notifications:', error);
        }
      }
    };
  }, []);

  const markAsRead = async (id: string) => {
    try {
      const notificationManager = NotificationManager.getInstance();
      await notificationManager.markAsRead(id);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const notificationManager = NotificationManager.getInstance();
      await notificationManager.markAllAsRead();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const notificationManager = NotificationManager.getInstance();
      await notificationManager.deleteNotification(id);
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const clearAll = async () => {
    try {
      const notificationManager = NotificationManager.getInstance();
      await notificationManager.clearAll();
    } catch (error) {
      console.error('Error clearing all notifications:', error);
    }
  };

  const requestPermissions = async () => {
    try {
      const notificationManager = NotificationManager.getInstance();
      return await notificationManager.requestPermissions();
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return { granted: false, status: 'error' };
    }
  };

  const getPushToken = async () => {
    try {
      const notificationManager = NotificationManager.getInstance();
      return await notificationManager.getPushToken();
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  };

  const scheduleLocalNotification = async (
    title: string,
    body: string,
    data?: any
  ) => {
    try {
      const notificationManager = NotificationManager.getInstance();
      return await notificationManager.scheduleLocalNotification(title, body, data);
    } catch (error) {
      console.error('Error scheduling local notification:', error);
      return null;
    }
  };

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    requestPermissions,
    getPushToken,
    scheduleLocalNotification,
  };
};

export default useNotifications;