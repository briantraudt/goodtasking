import React from 'react';
import { Bell, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';

export const NotificationPermissionButton = () => {
  const { permission, requestPermission } = useNotifications();

  const handleClick = async () => {
    if (permission === 'default') {
      await requestPermission();
    } else if (permission === 'denied') {
      // Show instructions to enable in browser settings
      alert(
        'To enable notifications:\n\n' +
        '1. Click the lock icon in your address bar\n' +
        '2. Allow notifications for this site\n' +
        '3. Refresh the page'
      );
    }
  };

  if (permission === 'granted') {
    return null; // Don't show if already granted
  }

  return (
    <Button
      variant={permission === 'denied' ? 'outline' : 'default'}
      size="sm"
      onClick={handleClick}
      className={cn(
        "gap-2",
        permission === 'denied' && "text-muted-foreground border-dashed"
      )}
    >
      {permission === 'denied' ? (
        <>
          <BellOff className="h-4 w-4" />
          Enable Notifications
        </>
      ) : (
        <>
          <Bell className="h-4 w-4" />
          Enable Notifications
        </>
      )}
    </Button>
  );
};

export default NotificationPermissionButton;