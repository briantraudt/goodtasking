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
  category: string;
  color?: string;
  logo_url?: string | null;
  website_url?: string | null;
  repo_url?: string | null;
  tech_stack?: string[] | null;
  created_at: string;
  updated_at: string;
  scheduledDay?: string;
  tasks: Task[];
}

export interface Idea {
  id: string;
  title?: string | null;
  rawIdea: string;
  distilledSummary?: string | null;
  gtmStrategy?: string | null;
  launchNeeds: string[];
  launchChecklist: string[];
  suggestedTechStack: string[];
  status: string;
  projectId?: string | null;
  created_at: string;
  updated_at: string;
}

export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchWorkspace = async () => {
    if (!user) return;

    try {
      const { data: projectsData, error: projectsError } = await supabase
        .from('vibe_projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (projectsError) throw projectsError;

      const { data: tasksData, error: tasksError } = await supabase
        .from('vibe_tasks')
        .select('*')
        .order('created_at', { ascending: true });

      if (tasksError) throw tasksError;

      const { data: ideasData, error: ideasError } = await supabase
        .from('vibe_ideas')
        .select('*')
        .order('created_at', { ascending: false });

      if (ideasError) throw ideasError;

      const projectsWithTasks = projectsData.map(project => ({
        ...project,
        category: project.category || 'work',
        scheduledDay: project.scheduled_day,
        tasks: tasksData.filter(task => task.project_id === project.id)
      }));

      setProjects(projectsWithTasks);
      setIdeas(
        (ideasData || []).map((idea) => ({
          id: idea.id,
          title: idea.title,
          rawIdea: idea.raw_idea,
          distilledSummary: idea.distilled_summary,
          gtmStrategy: idea.gtm_strategy,
          launchNeeds: Array.isArray(idea.launch_needs)
            ? idea.launch_needs
            : typeof idea.launch_needs === 'string'
              ? idea.launch_needs
                  .split('\n')
                  .map((item) => item.replace(/^-\s*/, '').trim())
                  .filter(Boolean)
              : [],
          launchChecklist: Array.isArray(idea.launch_checklist)
            ? idea.launch_checklist.map((item) => String(item))
            : [],
          suggestedTechStack: idea.suggested_tech_stack || [],
          status: idea.status,
          projectId: idea.project_id,
          created_at: idea.created_at,
          updated_at: idea.updated_at,
        }))
      );
    } catch (error: any) {
      console.error('Error loading workspace:', error);
    } finally {
      setLoading(false);
    }
  };

  const createProject = async (
    name: string,
    description?: string,
    category: string = 'work',
    color?: string,
    logoUrl?: string,
    websiteUrl?: string,
    repoUrl?: string,
    techStack?: string[]
  ) => {
    if (!user) return;

    try {
      const projectData: any = { 
        name, 
        description, 
        category, 
        user_id: user.id 
      };
      
      if (color) {
        projectData.color = color;
      }
      if (logoUrl) {
        projectData.logo_url = logoUrl;
      }
      if (websiteUrl) {
        projectData.website_url = websiteUrl;
      }
      if (repoUrl) {
        projectData.repo_url = repoUrl;
      }
      if (techStack && techStack.length > 0) {
        projectData.tech_stack = techStack;
      }

      const { data, error } = await supabase
        .from('vibe_projects')
        .insert([projectData])
        .select()
        .single();

      if (error) throw error;

      const newProject = { 
        ...data, 
        category: data.category || 'work',
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
        // Format date in local timezone to avoid timezone conversion issues
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

  const createIdea = async (idea: {
    title?: string;
    rawIdea: string;
    distilledSummary?: string;
    gtmStrategy?: string;
    launchNeeds?: string[];
    launchChecklist?: string[];
    suggestedTechStack?: string[];
    status?: string;
  }) => {
    if (!user) return null;

    try {
      const payload = {
        user_id: user.id,
        title: idea.title?.trim() || null,
        raw_idea: idea.rawIdea.trim(),
        distilled_summary: idea.distilledSummary?.trim() || null,
        gtm_strategy: idea.gtmStrategy?.trim() || null,
        launch_needs: (idea.launchNeeds || []).join('\n'),
        launch_checklist: idea.launchChecklist || [],
        suggested_tech_stack: idea.suggestedTechStack || [],
        status: idea.status || 'draft',
      };

      const { data, error } = await supabase
        .from('vibe_ideas')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;

      const newIdea: Idea = {
        id: data.id,
        title: data.title,
        rawIdea: data.raw_idea,
        distilledSummary: data.distilled_summary,
        gtmStrategy: data.gtm_strategy,
        launchNeeds: (idea.launchNeeds || []).filter(Boolean),
        launchChecklist: Array.isArray(data.launch_checklist)
          ? data.launch_checklist.map((item) => String(item))
          : [],
        suggestedTechStack: data.suggested_tech_stack || [],
        status: data.status,
        projectId: data.project_id,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };

      setIdeas((current) => [newIdea, ...current]);
      return newIdea;
    } catch (error: any) {
      console.error('Error creating idea:', error);
      return null;
    }
  };

  const updateIdea = async (
    id: string,
    updates: Partial<{
      title: string | null;
      rawIdea: string;
      distilledSummary: string | null;
      gtmStrategy: string | null;
      launchNeeds: string[];
      launchChecklist: string[];
      suggestedTechStack: string[];
      status: string;
      projectId: string | null;
    }>
  ) => {
    if (!user) return;

    try {
      const dbUpdates: Record<string, unknown> = {};

      if ('title' in updates) dbUpdates.title = updates.title?.trim() || null;
      if ('rawIdea' in updates) dbUpdates.raw_idea = updates.rawIdea?.trim() || '';
      if ('distilledSummary' in updates) dbUpdates.distilled_summary = updates.distilledSummary?.trim() || null;
      if ('gtmStrategy' in updates) dbUpdates.gtm_strategy = updates.gtmStrategy?.trim() || null;
      if ('launchNeeds' in updates) dbUpdates.launch_needs = (updates.launchNeeds || []).join('\n');
      if ('launchChecklist' in updates) dbUpdates.launch_checklist = updates.launchChecklist || [];
      if ('suggestedTechStack' in updates) dbUpdates.suggested_tech_stack = updates.suggestedTechStack || [];
      if ('status' in updates) dbUpdates.status = updates.status;
      if ('projectId' in updates) dbUpdates.project_id = updates.projectId;

      const { error } = await supabase
        .from('vibe_ideas')
        .update(dbUpdates)
        .eq('id', id);

      if (error) throw error;

      setIdeas((current) =>
        current.map((idea) =>
          idea.id === id
            ? {
                ...idea,
                ...updates,
                title: 'title' in updates ? updates.title : idea.title,
                rawIdea: 'rawIdea' in updates ? updates.rawIdea || '' : idea.rawIdea,
                distilledSummary: 'distilledSummary' in updates ? updates.distilledSummary : idea.distilledSummary,
                gtmStrategy: 'gtmStrategy' in updates ? updates.gtmStrategy : idea.gtmStrategy,
                launchNeeds: 'launchNeeds' in updates ? updates.launchNeeds || [] : idea.launchNeeds,
                launchChecklist: 'launchChecklist' in updates ? updates.launchChecklist || [] : idea.launchChecklist,
                suggestedTechStack:
                  'suggestedTechStack' in updates ? updates.suggestedTechStack || [] : idea.suggestedTechStack,
                status: 'status' in updates ? updates.status || idea.status : idea.status,
                projectId: 'projectId' in updates ? updates.projectId : idea.projectId,
              }
            : idea
        )
      );
    } catch (error: any) {
      console.error('Error updating idea:', error);
    }
  };

  const deleteIdea = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase.from('vibe_ideas').delete().eq('id', id);
      if (error) throw error;
      setIdeas((current) => current.filter((idea) => idea.id !== id));
    } catch (error: any) {
      console.error('Error deleting idea:', error);
    }
  };

  const convertIdeaToProject = async (ideaId: string) => {
    if (!user) return null;

    const idea = ideas.find((item) => item.id === ideaId);
    if (!idea) return null;

    try {
      const { data: project, error: projectError } = await supabase
        .from('vibe_projects')
        .insert([
          {
            user_id: user.id,
            name: idea.title?.trim() || 'New project',
            description: idea.distilledSummary?.trim() || idea.rawIdea.trim(),
            category: 'work',
            tech_stack: idea.suggestedTechStack || [],
          },
        ])
        .select()
        .single();

      if (projectError) throw projectError;

      const checklist = idea.launchChecklist.filter(Boolean);
      if (checklist.length > 0) {
        const { error: tasksError } = await supabase.from('vibe_tasks').insert(
          checklist.map((title) => ({
            user_id: user.id,
            project_id: project.id,
            title,
          }))
        );

        if (tasksError) throw tasksError;
      }

      await updateIdea(idea.id, { status: 'converted', projectId: project.id });
      await fetchWorkspace();
      return project;
    } catch (error: any) {
      console.error('Error converting idea to project:', error);
      return null;
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
      fetchWorkspace();
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
    ideas,
    loading,
    createProject,
    updateProject,
    deleteProject,
    createIdea,
    updateIdea,
    deleteIdea,
    convertIdeaToProject,
    createTask,
    updateTask,
    deleteTask,
    refetch: fetchWorkspace,
  };
};
