import React from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, Settings, CalendarCheck, Menu } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import NotificationCenter from '@/components/NotificationCenter';
import NotificationPermissionButton from '@/components/NotificationPermissionButton';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger, DrawerClose } from '@/components/ui/drawer';

const Header = () => {
  const { user, signOut } = useAuth();

  // Get user's first name from email for personalization
  const getUserName = () => {
    if (!user?.email) return "there";
    const emailPrefix = user.email.split('@')[0];
    // Capitalize first letter and handle common patterns
    return emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1).toLowerCase();
  };

  return (
    <header className="flex items-center justify-between">
      {/* Left side - Good Tasking Logo as Home Button */}
      <Link to="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <CalendarCheck className="h-5 w-5 text-white" />
        </div>
        <span className="text-2xl font-bold text-foreground">
          Go<span className="text-primary">o</span>d Tasking
        </span>
      </Link>

      {/* Right side - Action buttons */}
      <div className="flex items-center gap-3">
        {/* Desktop actions */}
        <div className="hidden md:flex items-center gap-3">
          {/* Notification Center */}
          <NotificationCenter />
          
          {/* Permission Request Button */}
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

        {/* Mobile menu */}
        <div className="md:hidden">
          <Drawer shouldScaleBackground={false}>
            <DrawerTrigger asChild>
              <Button variant="outline" size="icon" className="h-10 w-10 rounded-lg border-border">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle className="text-left">Menu</DrawerTitle>
              </DrawerHeader>
              <div className="p-4 space-y-3">
                <NotificationCenter />
                <NotificationPermissionButton />
                <Link to="/settings">
                  <Button variant="outline" className="w-full">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                </Link>
                <Button variant="outline" className="w-full" onClick={signOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
              <div className="p-4">
                <DrawerClose asChild>
                  <Button variant="secondary" className="w-full">Close</Button>
                </DrawerClose>
              </div>
            </DrawerContent>
          </Drawer>
        </div>
      </div>
    </header>
  );
};

export default Header;