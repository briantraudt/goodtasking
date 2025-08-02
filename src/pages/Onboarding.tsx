import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Target, ArrowRight, CheckCircle } from 'lucide-react';

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
    aiAssistantEnabled: false
  });

  // Redirect if not authenticated
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const totalSteps = 5;

  const addProject = () => {
    if (formData.projects.length < 4) {
      setFormData(prev => ({
        ...prev,
        projects: [...prev.projects, '']
      }));
    }
  };

  const updateProject = (index: number, value: string) => {
    const newProjects = [...formData.projects];
    newProjects[index] = value;
    setFormData(prev => ({
      ...prev,
      projects: newProjects
    }));
  };

  const removeProject = (index: number) => {
    if (formData.projects.length > 1) {
      const newProjects = formData.projects.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        projects: newProjects
      }));
    }
  };

  const handleNext = async () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    } else {
      await completeOnboarding();
    }
  };

  const completeOnboarding = async () => {
    setLoading(true);
    
    try {
      // Create projects
      const validProjects = formData.projects.filter(p => p.trim() !== '');
      const projectPromises = validProjects.map(name => 
        supabase.from('vibe_projects').insert({
          name: name.trim(),
          user_id: user.id
        }).select().single()
      );
      
      const projectResults = await Promise.all(projectPromises);
      
      // Create first task if provided
      if (formData.taskTitle && formData.taskProject) {
        const projectResult = projectResults.find(result => 
          result.data?.name === formData.taskProject
        );
        
        if (projectResult?.data) {
          await supabase.from('vibe_tasks').insert({
            title: formData.taskTitle,
            project_id: projectResult.data.id,
            user_id: user.id
          });
        }
      }
      
      // Update profile with onboarding completion
      await supabase.from('profiles').upsert({
        user_id: user.id,
        has_completed_onboarding: true,
        ai_assistant_enabled: formData.aiAssistantEnabled
      });
      
      toast({
        title: "Welcome to Good Tasking!",
        description: "Your workspace is ready. Let's start planning your week.",
      });
      
      navigate('/dashboard');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast({
        title: "Setup Error",
        description: "We had trouble setting up your workspace. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
              <Target className="h-8 w-8 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-4">Welcome to Good Tasking 👋</h2>
              <p className="text-muted-foreground text-lg">
                Let's set up your workspace so you can start planning your week with clarity.
              </p>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">What kinds of projects do you want to track?</h2>
              <p className="text-muted-foreground">
                Add 2-4 project categories to organize your tasks (e.g., Work, Personal, Side Hustle)
              </p>
            </div>
            
            <div className="space-y-4">
              {formData.projects.map((project, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder={`Project ${index + 1} (e.g., ${['Work', 'Personal', 'Side Hustle', 'Fitness'][index] || 'Project'})`}
                    value={project}
                    onChange={(e) => updateProject(index, e.target.value)}
                    className="flex-1"
                  />
                  {formData.projects.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeProject(index)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}
              
              {formData.projects.length < 4 && (
                <Button
                  variant="outline"
                  onClick={addProject}
                  className="w-full"
                >
                  Add Another Project
                </Button>
              )}
            </div>
          </div>
        );

      case 3:
        const validProjects = formData.projects.filter(p => p.trim() !== '');
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">What's one thing you want to get done this week?</h2>
              <p className="text-muted-foreground">
                Let's add your first task to get you started
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="taskTitle">Task</Label>
                <Input
                  id="taskTitle"
                  placeholder="e.g., Finish project proposal"
                  value={formData.taskTitle}
                  onChange={(e) => setFormData(prev => ({ ...prev, taskTitle: e.target.value }))}
                />
              </div>
              
              {validProjects.length > 0 && (
                <div>
                  <Label>Project</Label>
                  <Select 
                    value={formData.taskProject} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, taskProject: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a project" />
                    </SelectTrigger>
                    <SelectContent>
                      {validProjects.map((project, index) => (
                        <SelectItem key={index} value={project}>
                          {project}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div>
                <Label>Day</Label>
                <Select 
                  value={formData.taskDay} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, taskDay: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a day" />
                  </SelectTrigger>
                  <SelectContent>
                    {days.map((day) => (
                      <SelectItem key={day} value={day}>
                        {day}
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
              <h2 className="text-2xl font-bold mb-4">Want daily help from our AI assistant?</h2>
              <p className="text-muted-foreground">
                Get smart summaries and priority suggestions to stay focused
              </p>
            </div>
            
            <div className="flex items-center space-x-2 p-4 border rounded-lg">
              <Checkbox
                id="aiAssistant"
                checked={formData.aiAssistantEnabled}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, aiAssistantEnabled: checked as boolean }))
                }
              />
              <Label htmlFor="aiAssistant" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Enable Smart Summaries + Priorities
              </Label>
            </div>
            
            <div className="text-sm text-muted-foreground space-y-2">
              <p>• Get daily insights about your tasks and priorities</p>
              <p>• Receive suggestions for optimizing your schedule</p>
              <p>• Smart reminders for important deadlines</p>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-4">You're ready to get started!</h2>
              <p className="text-muted-foreground text-lg">
                Your workspace is set up and ready. Let's start planning your productive week.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return true;
      case 2:
        return formData.projects.some(p => p.trim() !== '');
      case 3:
        return true; // Task creation is optional
      case 4:
        return true;
      case 5:
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-muted-foreground">
              Step {currentStep} of {totalSteps}
            </div>
            <div className="flex space-x-1">
              {Array.from({ length: totalSteps }, (_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full ${
                    i + 1 <= currentStep ? 'bg-primary' : 'bg-muted'
                  }`}
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
              onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
              disabled={currentStep === 1}
            >
              Back
            </Button>
            
            <Button
              onClick={handleNext}
              disabled={!canProceed() || loading}
              className="ml-auto"
            >
              {loading ? (
                "Setting up..."
              ) : currentStep === totalSteps ? (
                "Go to My Week"
              ) : (
                <>
                  {currentStep === 1 ? "Let's Go" : "Continue"}
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