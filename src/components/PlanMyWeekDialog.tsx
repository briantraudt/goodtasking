import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Brain, Calendar, CheckCircle, Edit3, Sparkles, Target, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format, addDays, startOfWeek } from 'date-fns';

interface TaskSuggestion {
  taskName: string;
  project: string;
  projectId: string;
  suggestedDate: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  selected?: boolean;
  editing?: boolean;
}

interface Project {
  id: string;
  name: string;
}

interface PlanMyWeekProps {
  projects: Project[];
  onTasksCreated?: () => void;
  triggerButton?: React.ReactNode;
}

const PlanMyWeekDialog = ({ projects, onTasksCreated, triggerButton }: PlanMyWeekProps) => {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<TaskSuggestion[]>([]);
  const [analysis, setAnalysis] = useState<any>(null);
  const [processing, setProcessing] = useState(false);

  const fetchSuggestions = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('plan-my-week', {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
      });

      if (error) {
        console.error('Error fetching suggestions:', error);
        toast({
          title: "Error",
          description: "Failed to generate weekly plan. Please try again.",
          variant: "destructive",
        });
        return;
      }

      if (data?.suggestions) {
        setSuggestions(data.suggestions.map((s: TaskSuggestion) => ({ ...s, selected: true })));
        setAnalysis(data.analysis);
      }
    } catch (err) {
      console.error('Error in fetchSuggestions:', err);
      toast({
        title: "Error",
        description: "Unable to connect to AI planning assistant.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen && suggestions.length === 0) {
      fetchSuggestions();
    }
  };

  const updateSuggestion = (index: number, updates: Partial<TaskSuggestion>) => {
    setSuggestions(prev => prev.map((suggestion, i) => 
      i === index ? { ...suggestion, ...updates } : suggestion
    ));
  };

  const removeSuggestion = (index: number) => {
    setSuggestions(prev => prev.filter((_, i) => i !== index));
  };

  const toggleSelection = (index: number) => {
    updateSuggestion(index, { selected: !suggestions[index].selected });
  };

  const createSelectedTasks = async () => {
    const selectedTasks = suggestions.filter(s => s.selected);
    if (selectedTasks.length === 0) {
      toast({
        title: "No tasks selected",
        description: "Please select at least one task to add to your week.",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    try {
      let createdCount = 0;
      
      for (const task of selectedTasks) {
        const { error } = await supabase
          .from('vibe_tasks')
          .insert({
            title: task.taskName,
            project_id: task.projectId,
            user_id: user?.id,
            scheduled_date: task.suggestedDate,
            description: `AI suggested: ${task.reason}`
          });

        if (!error) {
          createdCount++;
        } else {
          console.error('Error creating task:', error);
        }
      }

      if (createdCount > 0) {
        toast({
          title: "Week planned! 🎯",
          description: `Successfully added ${createdCount} AI-suggested tasks to your week.`,
        });
        
        setOpen(false);
        setSuggestions([]);
        onTasksCreated?.();
      } else {
        toast({
          title: "Error",
          description: "Failed to create tasks. Please try again.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error('Error creating tasks:', err);
      toast({
        title: "Error",
        description: "Failed to create tasks. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getWeekDays = () => {
    const today = new Date();
    const nextWeek = addDays(startOfWeek(today), 7);
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(nextWeek, i);
      return {
        value: format(date, 'yyyy-MM-dd'),
        label: format(date, 'EEE, MMM d')
      };
    });
  };

  const selectedCount = suggestions.filter(s => s.selected).length;

  const defaultTrigger = (
    <Button className="gap-2">
      <Brain className="h-4 w-4" />
      Plan My Week with AI
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {triggerButton || defaultTrigger}
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            Plan My Week with AI
          </DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground">Analyzing your patterns and generating suggestions...</p>
            </div>
          </div>
        ) : suggestions.length > 0 ? (
          <div className="space-y-6">
            {/* Analysis Summary */}
            {analysis && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">📊 Your Weekly Insights</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="font-medium text-blue-800">{analysis.completionRate}%</div>
                      <div className="text-blue-600">Completion Rate</div>
                    </div>
                    <div>
                      <div className="font-medium text-blue-800">{analysis.totalTasks}</div>
                      <div className="text-blue-600">Recent Tasks</div>
                    </div>
                    <div>
                      <div className="font-medium text-blue-800">{analysis.missedTasks}</div>
                      <div className="text-blue-600">Missed Tasks</div>
                    </div>
                    <div>
                      <div className="font-medium text-blue-800">{analysis.mostActiveProject?.name || 'None'}</div>
                      <div className="text-blue-600">Top Project</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Task Suggestions */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">AI Task Suggestions</h3>
                <Badge variant="outline">
                  {selectedCount} of {suggestions.length} selected
                </Badge>
              </div>
              
              <div className="space-y-3">
                {suggestions.map((suggestion, index) => (
                  <Card key={index} className={`transition-all ${suggestion.selected ? 'ring-2 ring-primary ring-opacity-20' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={suggestion.selected}
                          onCheckedChange={() => toggleSelection(index)}
                          className="mt-1"
                        />
                        
                        <div className="flex-1 space-y-2">
                          {suggestion.editing ? (
                            <div className="space-y-2">
                              <Input
                                value={suggestion.taskName}
                                onChange={(e) => updateSuggestion(index, { taskName: e.target.value })}
                                placeholder="Task name"
                              />
                              <div className="flex gap-2">
                                <Select
                                  value={suggestion.projectId}
                                  onValueChange={(value) => {
                                    const project = projects.find(p => p.id === value);
                                    updateSuggestion(index, { 
                                      projectId: value, 
                                      project: project?.name || '' 
                                    });
                                  }}
                                >
                                  <SelectTrigger className="flex-1">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {projects.map((project) => (
                                      <SelectItem key={project.id} value={project.id}>
                                        {project.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                
                                <Select
                                  value={suggestion.suggestedDate}
                                  onValueChange={(value) => updateSuggestion(index, { suggestedDate: value })}
                                >
                                  <SelectTrigger className="flex-1">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {getWeekDays().map((day) => (
                                      <SelectItem key={day.value} value={day.value}>
                                        {day.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium">{suggestion.taskName}</h4>
                                <Badge variant="outline" className={getPriorityColor(suggestion.priority)}>
                                  {suggestion.priority}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Target className="h-3 w-3" />
                                  {suggestion.project}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {format(new Date(suggestion.suggestedDate), 'EEE, MMM d')}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">{suggestion.reason}</p>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateSuggestion(index, { editing: !suggestion.editing })}
                            className="h-8 w-8 p-0"
                          >
                            {suggestion.editing ? <CheckCircle className="h-3 w-3" /> : <Edit3 className="h-3 w-3" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSuggestion(index)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <Button 
                onClick={() => setOpen(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={createSelectedTasks}
                disabled={processing || selectedCount === 0}
                className="flex-1"
              >
                {processing ? 'Adding Tasks...' : `Add ${selectedCount} Tasks to My Week`}
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-2">No suggestions available</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Try using the app for a few days to build up task history for better AI suggestions.
            </p>
            <Button onClick={fetchSuggestions} variant="outline">
              Try Again
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PlanMyWeekDialog;