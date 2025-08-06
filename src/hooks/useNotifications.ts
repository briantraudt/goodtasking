import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  data?: any;
  requireInteraction?: boolean;
}

interface InAppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'reminder';
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  taskId?: string;
  projectId?: string;
}

export const useNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [inAppNotifications, setInAppNotifications] = useState<InAppNotification[]>([]);
  const { toast } = useToast();

  // Initialize notification permission status
  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  // Request notification permission
  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      toast({
        title: "Browser notifications not supported",
        description: "Your browser doesn't support notifications",
        variant: "destructive",
      });
      return false;
    }

    if (permission === 'granted') {
      return true;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        toast({
          title: "Notifications enabled! 🔔",
          description: "You'll receive task reminders and updates",
        });
        return true;
      } else {
        toast({
          title: "Notifications blocked",
          description: "Enable notifications in your browser settings to get reminders",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, [permission, toast]);

  // Send browser push notification
  const sendBrowserNotification = useCallback(async (options: NotificationOptions) => {
    if (!('Notification' in window)) {
      console.warn('Browser notifications not supported');
      return;
    }

    if (permission !== 'granted') {
      console.warn('Notification permission not granted');
      return;
    }

    try {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/favicon.ico',
        badge: '/favicon.ico',
        tag: options.tag,
        data: options.data,
        requireInteraction: options.requireInteraction || false,
      });

      // Auto-close after 5 seconds unless requireInteraction is true
      if (!options.requireInteraction) {
        setTimeout(() => {
          notification.close();
        }, 5000);
      }

      // Handle notification click
      notification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        
        // Handle custom actions based on notification data
        if (options.data?.url) {
          window.location.href = options.data.url;
        }
        
        notification.close();
      };

      return notification;
    } catch (error) {
      console.error('Error sending browser notification:', error);
    }
  }, [permission]);

  // Add in-app notification
  const addInAppNotification = useCallback((notification: Omit<InAppNotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: InAppNotification = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      read: false,
    };

    setInAppNotifications(prev => [newNotification, ...prev]);
    
    // Also show as toast for immediate visibility
    toast({
      title: notification.title,
      description: notification.message,
      variant: notification.type === 'error' ? 'destructive' : 'default',
    });

    return newNotification.id;
  }, [toast]);

  // Mark notification as read
  const markAsRead = useCallback((notificationId: string) => {
    setInAppNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    );
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    setInAppNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  }, []);

  // Remove notification
  const removeNotification = useCallback((notificationId: string) => {
    setInAppNotifications(prev => 
      prev.filter(notification => notification.id !== notificationId)
    );
  }, []);

  // Clear all notifications
  const clearAllNotifications = useCallback(() => {
    setInAppNotifications([]);
  }, []);

  // Get unread count
  const unreadCount = inAppNotifications.filter(n => !n.read).length;

  // Task-specific notification helpers
  const notifyTaskDue = useCallback((taskTitle: string, dueTime: string, taskId: string) => {
    const message = `Task "${taskTitle}" is due at ${dueTime}`;
    
    // Browser notification
    sendBrowserNotification({
      title: "📅 Task Due Soon!",
      body: message,
      tag: `task-due-${taskId}`,
      requireInteraction: true,
      data: { taskId, url: `/dashboard?task=${taskId}` }
    });

    // In-app notification
    addInAppNotification({
      title: "Task Due Soon",
      message,
      type: 'warning',
      taskId,
      actionUrl: `/dashboard?task=${taskId}`
    });
  }, [sendBrowserNotification, addInAppNotification]);

  const notifyTaskCompleted = useCallback((taskTitle: string, projectName: string) => {
    const message = `Great job! You completed "${taskTitle}" in ${projectName}`;
    
    // Browser notification
    sendBrowserNotification({
      title: "✅ Task Completed!",
      body: message,
      tag: `task-completed`,
    });

    // In-app notification
    addInAppNotification({
      title: "Task Completed",
      message,
      type: 'success',
    });
  }, [sendBrowserNotification, addInAppNotification]);

  const notifyDailySummary = useCallback((completedTasks: number, pendingTasks: number) => {
    const message = `Today: ${completedTasks} completed, ${pendingTasks} pending`;
    
    // Browser notification
    sendBrowserNotification({
      title: "📊 Daily Summary",
      body: message,
      tag: 'daily-summary',
    });

    // In-app notification
    addInAppNotification({
      title: "Daily Summary",
      message,
      type: 'info',
    });
  }, [sendBrowserNotification, addInAppNotification]);

  const notifyProjectUpdate = useCallback((projectName: string, updateType: string) => {
    const message = `Project "${projectName}" has been ${updateType}`;
    
    addInAppNotification({
      title: "Project Update",
      message,
      type: 'info',
    });
  }, [addInAppNotification]);

  return {
    // Permission management
    permission,
    requestPermission,
    
    // Browser notifications
    sendBrowserNotification,
    
    // In-app notifications
    inAppNotifications,
    addInAppNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
    unreadCount,
    
    // Task-specific helpers
    notifyTaskDue,
    notifyTaskCompleted,
    notifyDailySummary,
    notifyProjectUpdate,
  };
};