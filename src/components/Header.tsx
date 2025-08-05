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

  return (
    <header className="flex items-center justify-between">
      {/* Left side - Good Tasking Logo */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <CalendarCheck className="h-5 w-5 text-white" />
        </div>
        <span className="text-2xl font-bold text-foreground">
          Go<span className="text-primary">o</span>d Tasking
        </span>
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