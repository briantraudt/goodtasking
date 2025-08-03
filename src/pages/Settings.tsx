import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Brain, Settings as SettingsIcon, User, AlertTriangle, Calendar, Target, Save, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';

interface UserPreferences {
  ai_assistant_enabled: boolean;
  weekly_review_enabled: boolean;
  reminders_enabled: boolean;
  ai_tone_preference: 'coaching' | 'friendly' | 'direct' | 'motivational';
  ai_summary_time: 'morning' | 'evening';
  default_task_day: 'today' | 'tomorrow' | 'none';
  default_project_id: string | null;
  auto_schedule_unscheduled: boolean;
}

interface Project {
  id: string;
  name: string;
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
    ai_tone_preference: 'coaching',
    ai_summary_time: 'morning',
    default_task_day: 'today',
    default_project_id: null,
    auto_schedule_unscheduled: false,
  });
  const [projects, setProjects] = useState<Project[]>([]);
  const [fullName, setFullName] = useState('');

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

      // Load projects for default project selection
      const { data: projectsData, error: projectsError } = await supabase
        .from('vibe_projects')
        .select('id, name')
        .eq('user_id', user.id)
        .order('name');

      if (projectsError) {
        console.error('Error loading projects:', projectsError);
      } else {
        setProjects(projectsData || []);
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
      
      // This would typically be handled by a backend service
      // For now, we'll just sign out the user
      await signOut();
      
      toast({
        title: "Account deletion requested",
        description: "Please contact support to complete account deletion.",
        variant: "destructive",
      });
    } catch (error) {
      console.error('Error requesting account deletion:', error);
      toast({
        title: "Error",
        description: "Failed to process account deletion request.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
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
                <Calendar className="h-5 w-5" />
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
                    value={preferences.default_project_id || ''}
                    onValueChange={(value) => 
                      savePreferences({ default_project_id: value || null })
                    }
                    disabled={saving}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="No default project" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No default project</SelectItem>
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
        </div>
      </div>
    </div>
  );
};

export default Settings;