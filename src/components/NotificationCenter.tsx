import React, { useState } from 'react';
import { Bell, Check, X, Trash2, CheckCheck, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { useNotifications } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

export const NotificationCenter = () => {
  const [isOpen, setIsOpen] = useState(false);
  const {
    inAppNotifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
  } = useNotifications();

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      case 'reminder': return '⏰';
      case 'info':
      default: return 'ℹ️';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-green-600 bg-green-50 border-green-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      case 'reminder': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'info':
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const handleNotificationClick = (notification: any) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative h-9 w-9 p-0"
          aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80 p-0" align="end">
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Notifications</CardTitle>
              {inAppNotifications.length > 0 && (
                <div className="flex gap-1">
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={markAllAsRead}
                    >
                      <CheckCheck className="h-3 w-3 mr-1" />
                      Read all
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs text-destructive hover:text-destructive"
                    onClick={() => {
                      clearAllNotifications();
                      setIsOpen(false);
                    }}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Clear
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          
          <Separator />
          
          <CardContent className="p-0">
            {inAppNotifications.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No notifications yet</p>
                <p className="text-xs">You'll see task reminders and updates here</p>
              </div>
            ) : (
              <ScrollArea className="h-[300px]">
                <div className="space-y-1 p-1">
                  {inAppNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        "group relative p-3 rounded-lg border cursor-pointer transition-all hover:shadow-sm",
                        notification.read 
                          ? "bg-muted/50 border-muted" 
                          : getNotificationColor(notification.type),
                        !notification.read && "shadow-sm"
                      )}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-lg flex-shrink-0 mt-0.5">
                          {getNotificationIcon(notification.type)}
                        </span>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className={cn(
                              "text-sm font-medium truncate",
                              notification.read ? "text-muted-foreground" : "text-foreground"
                            )}>
                              {notification.title}
                            </h4>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {notification.actionUrl && (
                                <ExternalLink className="h-3 w-3 opacity-60" />
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeNotification(notification.id);
                                }}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          
                          <p className={cn(
                            "text-xs mt-1 line-clamp-2",
                            notification.read ? "text-muted-foreground" : "text-foreground/80"
                          )}>
                            {notification.message}
                          </p>
                          
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                          </p>
                        </div>
                        
                        {!notification.read && (
                          <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationCenter;