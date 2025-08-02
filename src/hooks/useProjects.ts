import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  due_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
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

      // Combine projects with their tasks
      const projectsWithTasks = projectsData.map(project => ({
        ...project,
        tasks: tasksData.filter(task => task.project_id === project.id)
      }));

      setProjects(projectsWithTasks);
    } catch (error: any) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const createProject = async (name: string, description?: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('vibe_projects')
        .insert([{ name, description, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;

      const newProject = { ...data, tasks: [] };
      setProjects([newProject, ...projects]);

      return newProject;
    } catch (error: any) {
      console.error('Error creating project:', error);
    }
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('vibe_projects')
        .update(updates)
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
      if (dueDate) taskData.due_date = dueDate.toISOString();

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
    }
  }, [user]);

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