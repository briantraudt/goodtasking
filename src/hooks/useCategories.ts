import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Home, User, Briefcase, LucideIcon } from 'lucide-react';

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: LucideIcon;
  user_id: string;
  created_at: string;
  updated_at: string;
}

// Static default categories with icons
const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'home',
    name: 'Home',
    color: '#F97316', // Orange
    icon: Home,
    user_id: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'personal', 
    name: 'Personal',
    color: '#10B981', // Green
    icon: User,
    user_id: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'work',
    name: 'Work', 
    color: '#3B82F6', // Blue
    icon: Briefcase,
    user_id: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export const useCategories = () => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      // Set user_id for all categories
      setCategories(DEFAULT_CATEGORIES.map(cat => ({ ...cat, user_id: user.id })));
    }
  }, [user]);

  // Return static categories - no create/update/delete functionality needed
  return {
    categories,
    loading,
    createCategory: () => Promise.resolve(null), // No-op
    updateCategory: () => Promise.resolve(null), // No-op  
    deleteCategory: () => Promise.resolve(), // No-op
    refetch: () => Promise.resolve(), // No-op
  };
};