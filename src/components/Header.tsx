import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, Settings, CalendarCheck, Menu, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import NotificationCenter from '@/components/NotificationCenter';
import NotificationPermissionButton from '@/components/NotificationPermissionButton';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger, DrawerClose } from '@/components/ui/drawer';
import { format, isToday } from 'date-fns';

const Header = () => {
  const { user, signOut } = useAuth();

  // Get user's first name from email for personalization
  const getUserName = () => {
    if (!user?.email) return "there";
    const emailPrefix = user.email.split('@')[0];
    // Capitalize first letter and handle common patterns
    return emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1).toLowerCase();
  };

  const location = useLocation();
  const isDashboard = location.pathname === '/dashboard';

  const [dateLabel, setDateLabel] = useState<string>('');

  useEffect(() => {
    const onDateUpdate = (e: Event) => {
      const detail = (e as CustomEvent<{ selectedDate: string }>).detail;
      if (!detail?.selectedDate) return;
      const [y, m, d] = detail.selectedDate.split('-').map(Number);
      const date = new Date(y, m - 1, d);
      const label = isToday(date) ? `Today, ${format(date, 'MMMM d')}` : format(date, 'EEEE, MMMM d');
      setDateLabel(label);
    };
    window.addEventListener('dashboard-date-update', onDateUpdate as EventListener);
    return () => window.removeEventListener('dashboard-date-update', onDateUpdate as EventListener);
  }, []);

  const goPrev = () => window.dispatchEvent(new CustomEvent('dashboard-date-prev'));
  const goNext = () => window.dispatchEvent(new CustomEvent('dashboard-date-next'));
  const goWeek = () => window.dispatchEvent(new CustomEvent('dashboard-view-week'));

  return (
    <header className="flex items-center justify-between">
      {/* Desktop brand */}
      <Link to="/dashboard" className="hidden md:flex items-center gap-3 hover:opacity-80 transition-opacity">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <CalendarCheck className="h-5 w-5 text-white" />
        </div>
        <span className="text-2xl font-bold text-foreground">
          Go<span className="text-primary">o</span>d Tasking
        </span>
      </Link>

      {/* Mobile date controls on dashboard */}
      {isDashboard && (
        <div className="md:hidden flex w-full items-center justify-between">
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={goPrev} aria-label="Previous day">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="text-base font-semibold text-primary truncate">
            {dateLabel || ''}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={goNext} aria-label="Next day">
              <ChevronRight className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goWeek}
              className="rounded-lg border-border"
            >
              <Star className="h-4 w-4 mr-2" />
              Week
            </Button>
          </div>
        </div>
      )}

      {/* Desktop actions */}
      <div className="hidden md:flex items-center gap-3">
        <NotificationCenter />
        <NotificationPermissionButton />
        <Link to="/settings">
          <Button variant="outline" size="sm" className="h-10 px-4 rounded-lg border-border transition-all">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </Link>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={signOut}
          className="h-10 px-4 rounded-lg border-border transition-all"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>

      {/* Mobile menu removed per request */}
      <div className="md:hidden hidden" />
    </header>
  );
};

export default Header;