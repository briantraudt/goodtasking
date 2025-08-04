import React from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, Settings, Calendar, CalendarCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

const Header = () => {
  const { user, signOut } = useAuth();

  // Get user's first name from email for personalization
  const getUserName = () => {
    if (!user?.email) return "there";
    const emailPrefix = user.email.split('@')[0];
    // Capitalize first letter and handle common patterns
    return emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1).toLowerCase();
  };

  const today = format(new Date(), 'EEEE, MMMM d, yyyy');

  return (
    <header className="flex items-center justify-between pb-8">
      {/* Left side - Modern greeting */}
      <div className="flex flex-col">
        <h1 className="text-3xl font-bold text-foreground mb-1">
          👋 Welcome back, {getUserName()}!
        </h1>
        <p className="text-muted-foreground text-lg">
          Let's plan a productive day together.
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          {today}
        </p>
      </div>

      {/* Right side - Action buttons */}
      <div className="flex items-center gap-3">
        <Link to="/settings">
          <Button variant="outline" size="sm" className="h-10 px-4 rounded-lg border-border hover:shadow-soft transition-all">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </Link>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={signOut}
          className="h-10 px-4 rounded-lg border-border hover:shadow-soft transition-all"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </header>
  );
};

export default Header;