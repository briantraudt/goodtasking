import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

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
  category: string;
  color?: string;
  created_at: string;
  updated_at: string;
  scheduledDay?: string;
  tasks: Task[];
}

export const useProjects = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const fetchProjects = async () => {
    if (!user) return [];

    const { data, error } = await supabase.rpc('get_projects_with_tasks');

    if (error) throw error;
    return data as Project[];
  };

  const { data: projects = [], isLoading, isError, error, refetch } = useQuery<Project[]>({
    queryKey: ['projects', user?.id],
    queryFn: fetchProjects,
    enabled: !!user,
  });

  const createProjectMutation = useMutation({
    mutationFn: async ({ name, description, category = 'work', color }: { name: string, description?: string, category?: string, color?: string }) => {
      if (!user) throw new Error("User not authenticated");

      const projectData: any = { name, description, category, user_id: user.id };
      if (color) projectData.color = color;

      const { data, error } = await supabase
        .from('vibe_projects')
        .insert([projectData])
        .select()
        .single();

      if (error) throw error;
      return { ...data, category: data.category || 'work', tasks: [] };
    },
    onMutate: async (newProject) => {
      await queryClient.cancelQueries({ queryKey: ['projects', user?.id] });
      const previousProjects = queryClient.getQueryData(['projects', user?.id]);
      queryClient.setQueryData(['projects', user?.id], (old: Project[] | undefined) => [...(old || []), { id: 'temp-id', ...newProject, tasks: [] } as Project]);
      return { previousProjects };
    },
    onError: (err, newProject, context) => {
      queryClient.setQueryData(['projects', user?.id], context?.previousProjects);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', user?.id] });
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string, updates: Partial<Project> }) => {
      if (!user) throw new Error("User not authenticated");

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
    },
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: ['projects', user?.id] });
      const previousProjects = queryClient.getQueryData(['projects', user?.id]);
      queryClient.setQueryData(['projects', user?.id], (old: Project[] | undefined) =>
        old?.map(p => p.id === id ? { ...p, ...updates } : p)
      );
      return { previousProjects };
    },
    onError: (err, newProject, context) => {
      queryClient.setQueryData(['projects', user?.id], context?.previousProjects);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', user?.id] });
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase
        .from('vibe_projects')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['projects', user?.id] });
      const previousProjects = queryClient.getQueryData(['projects', user?.id]);
      queryClient.setQueryData(['projects', user?.id], (old: Project[] | undefined) =>
        old?.filter(p => p.id !== id)
      );
      return { previousProjects };
    },
    onError: (err, newProject, context) => {
      queryClient.setQueryData(['projects', user?.id], context?.previousProjects);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', user?.id] });
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async ({ projectId, title, description, dueDate }: { projectId: string, title: string, description?: string, dueDate?: Date }) => {
      if (!user) throw new Error("User not authenticated");

      const taskData: any = { title, project_id: projectId, user_id: user.id };
      if (description) taskData.description = description;
      if (dueDate) {
        const year = dueDate.getFullYear();
        const month = String(dueDate.getMonth() + 1).padStart(2, '0');
        const day = String(dueDate.getDate()).padStart(2, '0');
        const localDateString = `${year}-${month}-${day}`;
        taskData.due_date = localDateString;
        taskData.scheduled_date = localDateString;
      }

      const { data, error } = await supabase
        .from('vibe_tasks')
        .insert([taskData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async (newTask) => {
      await queryClient.cancelQueries({ queryKey: ['projects', user?.id] });
      const previousProjects = queryClient.getQueryData(['projects', user?.id]);
      queryClient.setQueryData(['projects', user?.id], (old: Project[] | undefined) =>
        old?.map(p => p.id === newTask.projectId ? { ...p, tasks: [...p.tasks, {id: 'temp-id', ...newTask} as Task] } : p)
      );
      return { previousProjects };
    },
    onError: (err, newTask, context) => {
      queryClient.setQueryData(['projects', user?.id], context?.previousProjects);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', user?.id] });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string, updates: Partial<Task> }) => {
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase
        .from('vibe_tasks')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: ['projects', user?.id] });
      const previousProjects = queryClient.getQueryData(['projects', user?.id]);
      queryClient.setQueryData(['projects', user?.id], (old: Project[] | undefined) =>
        old?.map(p => ({ ...p, tasks: p.tasks.map(t => t.id === id ? { ...t, ...updates } : t) }))
      );
      return { previousProjects };
    },
    onError: (err, newProject, context) => {
      queryClient.setQueryData(['projects', user?.id], context?.previousProjects);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', user?.id] });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase
        .from('vibe_tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['projects', user?.id] });
      const previousProjects = queryClient.getQueryData(['projects', user?.id]);
      queryClient.setQueryData(['projects', user?.id], (old: Project[] | undefined) =>
        old?.map(p => ({ ...p, tasks: p.tasks.filter(t => t.id !== id) }))
      );
      return { previousProjects };
    },
    onError: (err, newProject, context) => {
      queryClient.setQueryData(['projects', user?.id], context?.previousProjects);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', user?.id] });
    },
  });

  const updateLastLogin = async () => {
    if (!user) return;
    try {
      await supabase
        .from('user_preferences')
        .upsert({ 
          user_id: user.id,
          last_login_date: new Date().toISOString().split('T')[0]
        });
    } catch (error) {
      console.error('Error updating last login:', error);
    }
  };

  useEffect(() => {
    if (user) {
      updateLastLogin();
    }
  }, [user]);

  return {
    projects,
    loading: isLoading,
    error: isError ? error : null,
    createProject: createProjectMutation.mutateAsync,
    updateProject: updateProjectMutation.mutateAsync,
    deleteProject: deleteProjectMutation.mutateAsync,
    createTask: createTaskMutation.mutateAsync,
    updateTask: updateTaskMutation.mutateAsync,
    deleteTask: deleteTaskMutation.mutateAsync,
    refetch,
  };
};