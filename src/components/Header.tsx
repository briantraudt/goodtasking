import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, Settings, CalendarCheck, Menu, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import NotificationCenter from '@/components/NotificationCenter';
import NotificationPermissionButton from '@/components/NotificationPermissionButton';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger, DrawerClose } from '@/components/ui/drawer';
import { format, isToday } from 'date-fns';
import { useIsTabletOrBelow } from '@/hooks/use-breakpoints';

const Header = () => {
  const { user, signOut } = useAuth();
  const isTablet = useIsTabletOrBelow();

  // Get user's first name from email for personalization
  const getUserName = () => {
    if (!user?.email) return "there";
    const emailPrefix = user.email.split('@')[0];
    // Capitalize first letter and handle common patterns
    return emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1).toLowerCase();
  };

  const location = useLocation();
  const isDashboard = location.pathname === '/dashboard';
  const isSettings = location.pathname === '/settings';
  const showDateHeader = isDashboard || isSettings;

  const [dateLabel, setDateLabel] = useState<string>('');

  useEffect(() => {
    // Initialize with today's label so non-dashboard pages show a date by default
    const today = new Date();
    setDateLabel(`Today, ${format(today, 'MMMM d')}`);

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
      {showDateHeader && (
        <div className="md:hidden w-full">
          <div className="flex items-center justify-between bg-primary text-primary-foreground rounded-lg px-3 py-2">
            <Button variant="ghost" size="icon" className="h-9 w-9 text-primary-foreground hover:bg-primary/20" onClick={goPrev} aria-label="Previous day">
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="text-base font-semibold truncate">
              {dateLabel || ''}
            </div>
            <Button variant="ghost" size="icon" className="h-9 w-9 text-primary-foreground hover:bg-primary/20" onClick={goNext} aria-label="Next day">
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      )}

      {/* Desktop actions */}
      <div className="hidden md:flex items-center gap-3">
        <NotificationCenter />
        <NotificationPermissionButton />
        <Link to="/settings">
          <Button variant="outline" size="icon" className="h-10 w-10 rounded-lg border-border transition-all" aria-label="Settings">
            <Settings className="h-5 w-5" />
          </Button>
        </Link>
        <Button 
          variant="outline" 
          size="icon" 
          onClick={signOut}
          className="h-10 w-10 rounded-lg border-border transition-all"
          aria-label="Sign Out"
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </div>

      {/* Mobile menu removed per request */}
      <div className="md:hidden hidden" />
    </header>
  );
};

export default Header;