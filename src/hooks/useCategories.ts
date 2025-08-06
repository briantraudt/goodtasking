import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Category {
  id: string;
  name: string;
  color: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchCategories = async () => {
    if (!user) {
      setCategories([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('project_categories')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) {
        console.error('Error fetching categories:', error);
        return;
      }

      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const createCategory = async (name: string, color: string) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('project_categories')
        .insert({
          name,
          color,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating category:', error);
        throw error;
      }

      setCategories(prev => [...prev, data]);
      return data;
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  };

  const updateCategory = async (id: string, updates: Partial<Pick<Category, 'name' | 'color'>>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('project_categories')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating category:', error);
        throw error;
      }

      setCategories(prev => prev.map(cat => cat.id === id ? data : cat));
      return data;
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  };

  const deleteCategory = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('project_categories')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting category:', error);
        throw error;
      }

      setCategories(prev => prev.filter(cat => cat.id !== id));
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  };

  const ensureDefaultCategories = async () => {
    if (!user || categories.length > 0) return;

    const defaultCategories = [
      { name: 'Work', color: '#4DA8DA' },
      { name: 'Personal', color: 'hsl(150, 45%, 45%)' },
      { name: 'Home', color: 'hsl(25, 95%, 53%)' },
    ];

    try {
      for (const category of defaultCategories) {
        await createCategory(category.name, category.color);
      }
    } catch (error) {
      console.error('Error creating default categories:', error);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [user]);

  useEffect(() => {
    if (!loading && categories.length === 0 && user) {
      ensureDefaultCategories();
    }
  }, [loading, categories.length, user]);

  return {
    categories,
    loading,
    createCategory,
    updateCategory,
    deleteCategory,
    refetch: fetchCategories,
  };
};