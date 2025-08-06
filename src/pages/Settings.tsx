import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Brain, Settings as SettingsIcon, User, AlertTriangle, Target, Save, ArrowLeft, CheckCircle, FolderOpen, TrendingUp, BarChart3, Edit2, Trash2, Check, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';

interface UserPreferences {
  ai_assistant_enabled: boolean;
  weekly_review_enabled: boolean;
  reminders_enabled: boolean;
  streak_tracking_enabled: boolean;
  ai_tone_preference: 'coaching' | 'friendly' | 'direct' | 'motivational';
  ai_summary_time: 'morning' | 'evening';
  default_task_day: 'today' | 'tomorrow' | 'none';
  default_project_id: string | null;
  auto_schedule_unscheduled: boolean;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  task_count?: number;
  completed_tasks?: number;
}

interface DashboardStats {
  totalTasks: number;
  completedTasks: number;
  totalProjects: number;
  completedProjects: number;
  currentStreak: number;
  completionRate: number;
}

const Settings = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences>({
    ai_assistant_enabled: true,
    weekly_review_enabled: true,
    reminders_enabled: true,
    streak_tracking_enabled: true,
    ai_tone_preference: 'coaching',
    ai_summary_time: 'morning',
    default_task_day: 'today',
    default_project_id: null,
    auto_schedule_unscheduled: false,
  });
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalTasks: 0,
    completedTasks: 0,
    totalProjects: 0,
    completedProjects: 0,
    currentStreak: 0,
    completionRate: 0,
  });
  const [fullName, setFullName] = useState('');
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingProjectName, setEditingProjectName] = useState('');
  const [showDeleteProjectDialog, setShowDeleteProjectDialog] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Load user preferences
      const { data: prefsData, error: prefsError } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (prefsError && prefsError.code !== 'PGRST116') {
        console.error('Error loading preferences:', prefsError);
      } else if (prefsData) {
        setPreferences({
          ai_assistant_enabled: prefsData.ai_assistant_enabled,
          weekly_review_enabled: prefsData.weekly_review_enabled,
          reminders_enabled: prefsData.reminders_enabled ?? true,
          streak_tracking_enabled: prefsData.streak_tracking_enabled ?? true,
          ai_tone_preference: prefsData.ai_tone_preference as 'coaching' | 'friendly' | 'direct' | 'motivational',
          ai_summary_time: prefsData.ai_summary_time as 'morning' | 'evening',
          default_task_day: prefsData.default_task_day as 'today' | 'tomorrow' | 'none',
          default_project_id: prefsData.default_project_id,
          auto_schedule_unscheduled: prefsData.auto_schedule_unscheduled,
        });
      }

      // Load user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('user_id', user.id)
        .single();

      if (profileError) {
        console.error('Error loading profile:', profileError);
      } else if (profileData) {
        setFullName(profileData.display_name || '');
      }

      // Load projects with task counts for dashboard and default project selection
      const { data: projectsData, error: projectsError } = await supabase
        .from('vibe_projects')
        .select(`
          id, 
          name, 
          description,
          vibe_tasks(
            id,
            completed
          )
        `)
        .eq('user_id', user.id)
        .order('name');

      if (projectsError) {
        console.error('Error loading projects:', projectsError);
      } else {
        const projectsWithStats = (projectsData || []).map(project => ({
          ...project,
          task_count: project.vibe_tasks?.length || 0,
          completed_tasks: project.vibe_tasks?.filter(task => task.completed).length || 0
        }));
        setProjects(projectsWithStats);
      }

      // Load dashboard statistics
      const { data: tasksData, error: tasksError } = await supabase
        .from('vibe_tasks')
        .select('id, completed')
        .eq('user_id', user.id);

      if (tasksError) {
        console.error('Error loading tasks:', tasksError);
      } else {
        const totalTasks = tasksData?.length || 0;
        const completedTasks = tasksData?.filter(task => task.completed).length || 0;
        const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        setStats({
          totalTasks,
          completedTasks,
          totalProjects: projectsData?.length || 0,
          completedProjects: projectsData?.filter(p => p.vibe_tasks?.every(t => t.completed)).length || 0,
          currentStreak: prefsData?.current_streak || 0,
          completionRate
        });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      toast({
        title: "Error",
        description: "Failed to load user settings. Please refresh the page.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async (updates: Partial<UserPreferences>) => {
    if (!user) return;

    try {
      setSaving(true);
      
      const newPreferences = { ...preferences, ...updates };
      
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          ...newPreferences
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error saving preferences:', error);
        toast({
          title: "Error",
          description: "Failed to save preferences. Please try again.",
          variant: "destructive",
        });
        return;
      }

      setPreferences(newPreferences);
      toast({
        title: "Settings saved",
        description: "Your preferences have been updated successfully.",
      });
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        title: "Error",
        description: "Failed to save preferences. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const saveProfile = async () => {
    if (!user) return;

    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          display_name: fullName
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error saving profile:', error);
        toast({
          title: "Error",
          description: "Failed to save profile. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Profile updated",
        description: "Your profile information has been saved.",
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: "Failed to save profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const clearAllTasks = async () => {
    if (!user) return;

    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('vibe_tasks')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        console.error('Error clearing tasks:', error);
        toast({
          title: "Error",
          description: "Failed to clear tasks. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Tasks cleared",
        description: "All your tasks have been deleted successfully.",
      });
    } catch (error) {
      console.error('Error clearing tasks:', error);
      toast({
        title: "Error",
        description: "Failed to clear tasks. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteAccount = async () => {
    if (!user) return;

    try {
      setSaving(true);
      
      // Step 1: Delete all user tasks
      const { error: tasksError } = await supabase
        .from('vibe_tasks')
        .delete()
        .eq('user_id', user.id);

      if (tasksError) {
        console.error('Error deleting tasks:', tasksError);
        toast({
          title: "Error",
          description: "Failed to delete tasks. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Step 2: Delete all user projects
      const { error: projectsError } = await supabase
        .from('vibe_projects')
        .delete()
        .eq('user_id', user.id);

      if (projectsError) {
        console.error('Error deleting projects:', projectsError);
        toast({
          title: "Error",
          description: "Failed to delete projects. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Step 3: Delete user preferences
      const { error: preferencesError } = await supabase
        .from('user_preferences')
        .delete()
        .eq('user_id', user.id);

      if (preferencesError) {
        console.error('Error deleting preferences:', preferencesError);
        // Don't return here as this is not critical
      }

      // Step 4: Delete user profile
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', user.id);

      if (profileError) {
        console.error('Error deleting profile:', profileError);
        // Don't return here as this is not critical
      }

      // Step 5: Sign out the user (account deletion from auth would need to be handled server-side)
      await signOut();
      
      toast({
        title: "Account data deleted",
        description: "All your projects and tasks have been permanently deleted. You have been signed out.",
        variant: "destructive",
      });
    } catch (error) {
      console.error('Error deleting account:', error);
      toast({
        title: "Error",
        description: "Failed to delete account. Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteProject = async (projectId: string) => {
    if (!user) return;

    try {
      setSaving(true);
      
      // Delete all tasks for this project first
      const { error: tasksError } = await supabase
        .from('vibe_tasks')
        .delete()
        .eq('project_id', projectId);

      if (tasksError) {
        console.error('Error deleting project tasks:', tasksError);
        toast({
          title: "Error",
          description: "Failed to delete project tasks. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Delete the project
      const { error: projectError } = await supabase
        .from('vibe_projects')
        .delete()
        .eq('id', projectId);

      if (projectError) {
        console.error('Error deleting project:', projectError);
        toast({
          title: "Error",
          description: "Failed to delete project. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Update local state
      setProjects(projects.filter(p => p.id !== projectId));
      
      toast({
        title: "Project deleted",
        description: "The project and all its tasks have been deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting project:', error);
      toast({
        title: "Error",
        description: "Failed to delete project. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
      setShowDeleteProjectDialog(null);
    }
  };

  const updateProjectName = async (projectId: string, newName: string) => {
    if (!user || !newName.trim()) return;

    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('vibe_projects')
        .update({ name: newName.trim() })
        .eq('id', projectId);

      if (error) {
        console.error('Error updating project name:', error);
        toast({
          title: "Error",
          description: "Failed to update project name. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Update local state
      setProjects(projects.map(p => 
        p.id === projectId ? { ...p, name: newName.trim() } : p
      ));
      
      toast({
        title: "Project updated",
        description: "Project name has been updated successfully.",
      });
    } catch (error) {
      console.error('Error updating project name:', error);
      toast({
        title: "Error",
        description: "Failed to update project name. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
      setEditingProjectId(null);
      setEditingProjectName('');
    }
  };

  const handleEditProject = (project: Project) => {
    setEditingProjectId(project.id);
    setEditingProjectName(project.name);
  };

  const handleSaveProjectName = () => {
    if (editingProjectId && editingProjectName.trim()) {
      updateProjectName(editingProjectId, editingProjectName);
    }
  };

  const handleCancelEdit = () => {
    setEditingProjectId(null);
    setEditingProjectName('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Settings</h1>
              <p className="text-muted-foreground">Manage your account and preferences</p>
            </div>
          </div>

          {/* Dashboard Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Tasks Completed</p>
                    <p className="text-2xl font-bold">{stats.completedTasks}/{stats.totalTasks}</p>
                    <div className="flex items-center gap-2">
                      <Progress value={stats.completionRate} className="h-2 flex-1" />
                      <span className="text-xs text-muted-foreground">{stats.completionRate}%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-success/10 rounded-lg">
                    <FolderOpen className="h-5 w-5 text-success" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Active Projects</p>
                    <p className="text-2xl font-bold">{stats.totalProjects}</p>
                    <p className="text-xs text-muted-foreground">
                      {stats.completedProjects} completed
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-accent/10 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-accent" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Current Streak</p>
                    <p className="text-2xl font-bold">{stats.currentStreak}</p>
                    <p className="text-xs text-muted-foreground">days</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-secondary/10 rounded-lg">
                    <BarChart3 className="h-5 w-5 text-secondary" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Productivity</p>
                    <p className="text-2xl font-bold">{stats.completionRate}%</p>
                    <p className="text-xs text-muted-foreground">completion rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Projects Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5" />
                Your Projects
              </CardTitle>
              <CardDescription>
                Overview of all your projects and their progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              {projects.length === 0 ? (
                <div className="text-center py-8">
                  <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-semibold">No projects yet</h3>
                  <p className="text-sm text-muted-foreground">Create your first project to get started!</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {projects.map((project) => (
                    <div key={project.id} className="flex items-center justify-between p-4 border rounded-lg group">
                      <div className="flex-1 space-y-1">
                        {editingProjectId === project.id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              value={editingProjectName}
                              onChange={(e) => setEditingProjectName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveProjectName();
                                if (e.key === 'Escape') handleCancelEdit();
                              }}
                              className="font-medium h-8 max-w-xs"
                              autoFocus
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={handleSaveProjectName}
                              className="h-8 w-8 p-0"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={handleCancelEdit}
                              className="h-8 w-8 p-0"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <h4 
                              className="font-medium cursor-pointer hover:bg-gray-100 rounded px-2 py-1 transition-colors flex-1"
                              onClick={() => handleEditProject(project)}
                            >
                              {project.name}
                            </h4>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEditProject(project)}
                                className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setShowDeleteProjectDialog(project.id)}
                                className="h-8 w-8 p-0 text-gray-400 hover:text-red-600"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        )}
                        {project.description && (
                          <p className="text-sm text-muted-foreground">{project.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{project.task_count || 0} tasks</span>
                          <span>{project.completed_tasks || 0} completed</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 ml-4">
                        {project.task_count && project.task_count > 0 ? (
                          <div className="flex items-center gap-2">
                            <Progress 
                              value={((project.completed_tasks || 0) / project.task_count) * 100} 
                              className="h-2 w-16" 
                            />
                            <span className="text-xs text-muted-foreground">
                              {Math.round(((project.completed_tasks || 0) / project.task_count) * 100)}%
                            </span>
                          </div>
                        ) : (
                          <Badge variant="outline">No tasks</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Assistant Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI Assistant Settings
              </CardTitle>
              <CardDescription>
                Configure your AI-powered productivity features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Daily AI Summary</Label>
                  <p className="text-sm text-muted-foreground">
                    Get personalized daily insights and task prioritization
                  </p>
                </div>
                <Switch
                  checked={preferences.ai_assistant_enabled}
                  onCheckedChange={(checked) => savePreferences({ ai_assistant_enabled: checked })}
                  disabled={saving}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Weekly AI Review</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive weekly progress analysis and recommendations
                  </p>
                </div>
                <Switch
                  checked={preferences.weekly_review_enabled}
                  onCheckedChange={(checked) => savePreferences({ weekly_review_enabled: checked })}
                  disabled={saving}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Send daily morning reminders</Label>
                  <p className="text-sm text-muted-foreground">
                    Get a gentle nudge each morning to check your AI summary and plan your day
                  </p>
                </div>
                <Switch
                  checked={preferences.reminders_enabled}
                  onCheckedChange={(checked) => savePreferences({ reminders_enabled: checked })}
                  disabled={saving}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable streak tracking</Label>
                  <p className="text-sm text-muted-foreground">
                    Track your daily check-ins and celebrate consistency milestones
                  </p>
                </div>
                <Switch
                  checked={preferences.streak_tracking_enabled}
                  onCheckedChange={(checked) => savePreferences({ streak_tracking_enabled: checked })}
                  disabled={saving}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Preferred AI Tone</Label>
                  <Select
                    value={preferences.ai_tone_preference}
                    onValueChange={(value: 'coaching' | 'friendly' | 'direct' | 'motivational') => 
                      savePreferences({ ai_tone_preference: value })
                    }
                    disabled={saving}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="coaching">Coaching - Supportive guidance</SelectItem>
                      <SelectItem value="friendly">Friendly - Casual and warm</SelectItem>
                      <SelectItem value="direct">Direct - Straight to the point</SelectItem>
                      <SelectItem value="motivational">Motivational - Energizing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>AI Summary Time</Label>
                  <Select
                    value={preferences.ai_summary_time}
                    onValueChange={(value: 'morning' | 'evening') => 
                      savePreferences({ ai_summary_time: value })
                    }
                    disabled={saving}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="morning">Morning - Start of day</SelectItem>
                      <SelectItem value="evening">Evening - End of day</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Default Behavior */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Default Behavior
              </CardTitle>
              <CardDescription>
                Set your preferred defaults for task creation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Default Day for New Tasks</Label>
                  <Select
                    value={preferences.default_task_day}
                    onValueChange={(value: 'today' | 'tomorrow' | 'none') => 
                      savePreferences({ default_task_day: value })
                    }
                    disabled={saving}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="tomorrow">Tomorrow</SelectItem>
                      <SelectItem value="none">No Default</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Default Project for Quick Tasks</Label>
                  <Select
                     value={preferences.default_project_id || 'none'}
                     onValueChange={(value) => 
                       savePreferences({ default_project_id: value === 'none' ? null : value })
                     }
                    disabled={saving}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="No default project" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No default project</SelectItem>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-schedule unscheduled tasks</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically move unscheduled tasks to tomorrow
                  </p>
                </div>
                <Switch
                  checked={preferences.auto_schedule_unscheduled}
                  onCheckedChange={(checked) => savePreferences({ auto_schedule_unscheduled: checked })}
                  disabled={saving}
                />
              </div>
            </CardContent>
          </Card>

          {/* Personal Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
              <CardDescription>
                Manage your account details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    value={user?.email || ''}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    Email cannot be changed. Contact support if needed.
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={saveProfile} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Profile
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>
                Irreversible actions that permanently affect your data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground">
                      Clear All Tasks
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Clear All Tasks</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete all your tasks and cannot be undone. 
                        Are you sure you want to continue?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={clearAllTasks}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Yes, Clear All Tasks
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      Delete Account
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Account</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete your account and all associated data. 
                        This action cannot be undone. Are you absolutely sure?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={deleteAccount}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Yes, Delete My Account
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>

          {/* Delete Project Dialog */}
          <AlertDialog open={showDeleteProjectDialog !== null} onOpenChange={() => setShowDeleteProjectDialog(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Project</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{projects.find(p => p.id === showDeleteProjectDialog)?.name}"? 
                  This will permanently delete the project and all its tasks. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => showDeleteProjectDialog && deleteProject(showDeleteProjectDialog)}
                  className="bg-red-600 hover:bg-red-700"
                  disabled={saving}
                >
                  Delete Project
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
};

export default Settings;