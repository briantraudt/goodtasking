import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNotifications } from '@/hooks/useNotifications';
import { Bell, CheckCircle, AlertTriangle, Info, Clock } from 'lucide-react';

export const NotificationDemo = () => {
  const { 
    sendBrowserNotification, 
    addInAppNotification, 
    permission,
    requestPermission 
  } = useNotifications();

  const testBrowserNotification = () => {
    sendBrowserNotification({
      title: "📅 Task Reminder",
      body: "Your meeting with the team starts in 15 minutes!",
      tag: "demo-reminder",
      requireInteraction: true,
    });
  };

  const testInAppNotifications = () => {
    addInAppNotification({
      title: "Task Completed",
      message: "Great job! You completed 'Review project proposal'",
      type: "success",
    });

    setTimeout(() => {
      addInAppNotification({
        title: "Task Due Soon",
        message: "Don't forget: 'Weekly team meeting' starts at 3:00 PM",
        type: "warning",
        actionUrl: "/dashboard?task=123",
      });
    }, 1000);

    setTimeout(() => {
      addInAppNotification({
        title: "Daily Summary",
        message: "Today: 3 tasks completed, 2 pending",
        type: "info",
      });
    }, 2000);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Demo
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Test the notification system
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {permission !== 'granted' && (
          <Button 
            onClick={requestPermission}
            className="w-full"
            variant="outline"
          >
            <Bell className="h-4 w-4 mr-2" />
            Enable Browser Notifications
          </Button>
        )}
        
        <Button 
          onClick={testBrowserNotification}
          disabled={permission !== 'granted'}
          className="w-full"
        >
          <Bell className="h-4 w-4 mr-2" />
          Test Browser Notification
        </Button>
        
        <Button 
          onClick={testInAppNotifications}
          variant="outline"
          className="w-full"
        >
          <Info className="h-4 w-4 mr-2" />
          Test In-App Notifications
        </Button>
        
        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>Status:</strong> {permission}</p>
          <p><CheckCircle className="inline h-3 w-3 mr-1" />Task completion notifications</p>
          <p><AlertTriangle className="inline h-3 w-3 mr-1" />Due date reminders</p>
          <p><Clock className="inline h-3 w-3 mr-1" />Scheduled task alerts</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationDemo;