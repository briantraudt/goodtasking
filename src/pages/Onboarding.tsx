import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle, Target } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const dayOptions = Array.from({ length: 7 }, (_, index) => {
  const date = new Date();
  date.setDate(date.getDate() + index);

  return {
    label: date.toLocaleDateString(undefined, { weekday: 'long' }),
    value: date.toISOString().split('T')[0],
  };
});

const Onboarding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    projects: [''],
    taskTitle: '',
    taskProject: '',
    taskDay: '',
    aiAssistantEnabled: false,
  });

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const totalSteps = 5;

  const addProject = () => {
    if (formData.projects.length < 4) {
      setFormData((prev) => ({
        ...prev,
        projects: [...prev.projects, ''],
      }));
    }
  };

  const updateProject = (index: number, value: string) => {
    const projects = [...formData.projects];
    projects[index] = value;
    setFormData((prev) => ({ ...prev, projects }));
  };

  const removeProject = (index: number) => {
    if (formData.projects.length > 1) {
      const projects = formData.projects.filter((_, currentIndex) => currentIndex !== index);
      setFormData((prev) => ({ ...prev, projects }));
    }
  };

  const handleNext = async () => {
    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1);
      return;
    }

    await completeOnboarding();
  };

  const completeOnboarding = async () => {
    setLoading(true);

    try {
      const validProjects = formData.projects.filter((project) => project.trim() !== '');
      const projectPromises = validProjects.map((name) =>
        supabase
          .from('vibe_projects')
          .insert({
            name: name.trim(),
            category: 'work',
            user_id: user.id,
          })
          .select()
          .single()
      );

      const projectResults = await Promise.all(projectPromises);

      if (formData.taskTitle && formData.taskProject) {
        const selectedProject = projectResults.find((result) => result.data?.name === formData.taskProject);

        if (selectedProject?.data) {
          await supabase.from('vibe_tasks').insert({
            title: formData.taskTitle,
            project_id: selectedProject.data.id,
            due_date: formData.taskDay || null,
            scheduled_date: formData.taskDay || null,
            user_id: user.id,
          });
        }
      }

      await supabase.from('profiles').upsert({
        user_id: user.id,
        has_completed_onboarding: true,
        ai_assistant_enabled: formData.aiAssistantEnabled,
      });

      toast({
        title: 'Welcome to Good Tasking!',
        description: 'Your workspace is ready. Let’s start planning your day with clarity.',
      });

      navigate('/dashboard');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast({
        title: 'Setup Error',
        description: 'We had trouble setting up your workspace. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
      case 3:
      case 4:
      case 5:
        return true;
      case 2:
        return formData.projects.some((project) => project.trim() !== '');
      default:
        return false;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6 text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary">
              <Target className="h-8 w-8 text-primary-foreground" />
            </div>
            <div>
              <h2 className="mb-4 text-3xl font-bold">Welcome to Good Tasking</h2>
              <p className="text-lg text-muted-foreground">
                Let’s set up your workspace so every morning starts with a clear picture of what matters.
              </p>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="mb-4 text-2xl font-bold">What software projects or work streams are you managing?</h2>
              <p className="text-muted-foreground">
                Add the buckets you want to see in one daily command center. Examples: Client Work, Good Tasking, Marketing Site, Admin.
              </p>
            </div>

            <div className="space-y-4">
              {formData.projects.map((project, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder={`Project ${index + 1} (e.g., ${['Client Work', 'Good Tasking', 'Bug Fixes', 'Admin'][index] || 'Project'})`}
                    value={project}
                    onChange={(event) => updateProject(index, event.target.value)}
                    className="flex-1"
                  />
                  {formData.projects.length > 1 && (
                    <Button variant="outline" size="sm" onClick={() => removeProject(index)}>
                      Remove
                    </Button>
                  )}
                </div>
              ))}

              {formData.projects.length < 4 && (
                <Button variant="outline" onClick={addProject} className="w-full">
                  Add Another Project
                </Button>
              )}
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="mb-4 text-2xl font-bold">What’s one important thing you want to move forward next?</h2>
              <p className="text-muted-foreground">
                We’ll place one real task into your plan so the workspace is immediately useful.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="taskTitle">Task</Label>
                <Input
                  id="taskTitle"
                  placeholder="e.g., Ship onboarding polish, fix login bug, write API docs"
                  value={formData.taskTitle}
                  onChange={(event) => setFormData((prev) => ({ ...prev, taskTitle: event.target.value }))}
                />
              </div>

              {formData.projects.some((project) => project.trim() !== '') && (
                <div>
                  <Label>Project</Label>
                  <Select
                    value={formData.taskProject}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, taskProject: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a project" />
                    </SelectTrigger>
                    <SelectContent>
                      {formData.projects
                        .filter((project) => project.trim() !== '')
                        .map((project) => (
                          <SelectItem key={project} value={project}>
                            {project}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label>When do you want to see it?</Label>
                <Select
                  value={formData.taskDay}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, taskDay: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a day" />
                  </SelectTrigger>
                  <SelectContent>
                    {dayOptions.map((day) => (
                      <SelectItem key={day.value} value={day.value}>
                        {day.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="mb-4 text-2xl font-bold">Do you want help deciding what to focus on each day?</h2>
              <p className="text-muted-foreground">
                AI is optional. Turn it on if you want summaries and prioritization support when you’re planning your day.
              </p>
            </div>

            <div className="flex items-center space-x-2 rounded-lg border p-4">
              <Checkbox
                id="aiAssistant"
                checked={formData.aiAssistantEnabled}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, aiAssistantEnabled: checked as boolean }))
                }
              />
              <Label htmlFor="aiAssistant" className="text-sm font-medium leading-none">
                Enable daily summaries and priority suggestions
              </Label>
            </div>

            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• See a quick morning readout of what matters most</p>
              <p>• Get suggestions when your backlog is larger than your day</p>
              <p>• Keep momentum without rethinking your plan from scratch</p>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-6 text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-500">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="mb-4 text-3xl font-bold">You’re ready to get started</h2>
              <p className="text-lg text-muted-foreground">
                Your workspace is ready. Good Tasking should now help you see what deserves your attention first.
              </p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Step {currentStep} of {totalSteps}
            </div>
            <div className="flex space-x-1">
              {Array.from({ length: totalSteps }, (_, index) => (
                <div
                  key={index}
                  className={`h-2 w-2 rounded-full ${index + 1 <= currentStep ? 'bg-primary' : 'bg-muted'}`}
                />
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {renderStep()}

          <div className="flex justify-between pt-6">
            <Button
              variant="outline"
              onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
              disabled={currentStep === 1}
            >
              Back
            </Button>

            <Button onClick={handleNext} disabled={!canProceed() || loading} className="ml-auto">
              {loading ? (
                'Setting up...'
              ) : currentStep === totalSteps ? (
                'Open My Workspace'
              ) : (
                <>
                  {currentStep === 1 ? "Let's Go" : 'Continue'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Onboarding;
