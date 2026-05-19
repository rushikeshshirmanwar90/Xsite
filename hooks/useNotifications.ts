import { useState, useEffect } from 'react';
import { SimpleNotificationService } from '@/services/SimpleNotificationService';

export interface LocalNotification {
  id: string;
  title: string;
  body: string;
  data?: any;
  isRead: boolean;
  timestamp: number;
  source: 'backend' | 'push';
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<LocalNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const notificationService = SimpleNotificationService.getInstance();
        
        // Initialize the service
        await notificationService.initialize();
        
        // SimpleNotificationService doesn't store notifications locally
        // Notifications are managed by the system
        setNotifications([]);
        setUnreadCount(0);

        setIsLoading(false);
      } catch (initError) {
        console.error('Error initializing notifications:', initError);
        setError('Failed to load notifications');
        setIsLoading(false);
      }
    };

    initializeNotifications();
  }, []);

  const markAsRead = async (id: string) => {
    console.log('markAsRead not implemented in SimpleNotificationService');
  };

  const markAllAsRead = async () => {
    console.log('markAllAsRead not implemented in SimpleNotificationService');
  };

  const deleteNotification = async (id: string) => {
    console.log('deleteNotification not implemented in SimpleNotificationService');
  };

  const clearAll = async () => {
    console.log('clearAll not implemented in SimpleNotificationService');
  };

  const requestPermissions = async () => {
    try {
      const notificationService = SimpleNotificationService.getInstance();
      const success = await notificationService.initialize();
      return { granted: success, status: success ? 'granted' : 'denied' };
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return { granted: false, status: 'error' };
    }
  };

  const getPushToken = async () => {
    try {
      const notificationService = SimpleNotificationService.getInstance();
      return notificationService.getCurrentToken();
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
      const notificationService = SimpleNotificationService.getInstance();
      await notificationService.scheduleLocalNotification(title, body, data);
      return 'scheduled';
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