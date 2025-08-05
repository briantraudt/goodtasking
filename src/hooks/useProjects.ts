import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  due_date?: string;
  scheduled_date?: string;
  created_at: string;
  updated_at: string;
  project_id: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  category: 'work' | 'home' | 'personal';
  created_at: string;
  updated_at: string;
  scheduledDay?: string;
  tasks: Task[];
}

export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchProjects = async () => {
    if (!user) return;

    try {
      // Fetch projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('vibe_projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (projectsError) throw projectsError;

      // Fetch tasks for all projects
      const { data: tasksData, error: tasksError } = await supabase
        .from('vibe_tasks')
        .select('*')
        .order('created_at', { ascending: true });

      if (tasksError) throw tasksError;

      // Combine projects with their tasks and convert scheduled_day to scheduledDay
      const projectsWithTasks = projectsData.map(project => ({
        ...project,
        category: (project.category || 'work') as 'work' | 'home' | 'personal',
        scheduledDay: project.scheduled_day,
        tasks: tasksData.filter(task => task.project_id === project.id)
      }));

      setProjects(projectsWithTasks);
    } catch (error: any) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const createProject = async (name: string, description?: string, category: 'work' | 'home' | 'personal' = 'work') => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('vibe_projects')
        .insert([{ name, description, category, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;

      const newProject = { 
        ...data, 
        category: (data.category || 'work') as 'work' | 'home' | 'personal',
        tasks: [] 
      };
      setProjects([newProject, ...projects]);

      return newProject;
    } catch (error: any) {
      console.error('Error creating project:', error);
    }
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    if (!user) return;

    try {
      // Convert scheduledDay to scheduled_day for database
      const dbUpdates: any = { ...updates };
      if ('scheduledDay' in updates) {
        dbUpdates.scheduled_day = updates.scheduledDay;
        delete dbUpdates.scheduledDay;
      }

      const { error } = await supabase
        .from('vibe_projects')
        .update(dbUpdates)
        .eq('id', id);

      if (error) throw error;

      setProjects(projects.map(project => 
        project.id === id ? { ...project, ...updates } : project
      ));
    } catch (error: any) {
      console.error('Error updating project:', error);
    }
  };

  const deleteProject = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('vibe_projects')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setProjects(projects.filter(project => project.id !== id));
    } catch (error: any) {
      console.error('Error deleting project:', error);
    }
  };

  const createTask = async (projectId: string, title: string, description?: string, dueDate?: Date) => {
    if (!user) return;

    try {
      const taskData: any = { 
        title, 
        project_id: projectId, 
        user_id: user.id 
      };
      
      if (description) taskData.description = description;
      if (dueDate) {
        taskData.due_date = dueDate.toISOString();
        taskData.scheduled_date = dueDate.toISOString().split('T')[0]; // YYYY-MM-DD format
      }

      const { data, error } = await supabase
        .from('vibe_tasks')
        .insert([taskData])
        .select()
        .single();

      if (error) throw error;

      setProjects(projects.map(project => 
        project.id === projectId 
          ? { ...project, tasks: [...project.tasks, data] }
          : project
      ));

      return data;
    } catch (error: any) {
      console.error('Error creating task:', error);
    }
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('vibe_tasks')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setProjects(projects.map(project => ({
        ...project,
        tasks: project.tasks.map(task => 
          task.id === id ? { ...task, ...updates } : task
        )
      })));
    } catch (error: any) {
      console.error('Error updating task:', error);
    }
  };

  const deleteTask = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('vibe_tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setProjects(projects.map(project => ({
        ...project,
        tasks: project.tasks.filter(task => task.id !== id)
      })));
    } catch (error: any) {
      console.error('Error deleting task:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProjects();
      // Update last login date when user logs in
      updateLastLogin();
    }
  }, [user]);

  const updateLastLogin = async () => {
    if (!user) return;
    
    try {
      await supabase
        .from('user_preferences')
        .upsert({ 
          user_id: user.id,
          last_login_date: new Date().toISOString().split('T')[0] // YYYY-MM-DD format
        });
    } catch (error) {
      console.error('Error updating last login:', error);
    }
  };

  return {
    projects,
    loading,
    createProject,
    updateProject,
    deleteProject,
    createTask,
    updateTask,
    deleteTask,
    refetch: fetchProjects,
  };
};