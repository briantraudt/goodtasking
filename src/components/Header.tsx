import React from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import BrandMark from '@/components/BrandMark';

const Header = () => {
  const { signOut } = useAuth();

  return (
    <header className="flex items-center justify-between">
      <Link to="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
        <BrandMark className="h-8 w-8" iconClassName="h-4 w-4" />
        <span className="text-2xl font-bold text-foreground">
          Go<span className="text-primary">o</span>d Tasking
        </span>
      </Link>
      <div className="flex items-center gap-3">
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
    </header>
  );
};

export default Header;
