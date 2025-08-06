import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { CalendarIcon, Edit2, Check, Trash2, Home, User, Briefcase } from 'lucide-react';
import { format } from 'date-fns';
import DraggableTaskItem from '@/components/DraggableTaskItem';
import TaskFilters from '@/components/TaskFilters';
import AddTaskDialog from '@/components/AddTaskDialog';
import TaskEditDialog from '@/components/TaskEditDialog';
import ProjectEditDialog from '@/components/ProjectEditDialog';
import { useCategories } from '@/hooks/useCategories';
import { Plus, CheckSquare } from 'lucide-react';
import { isToday, isPast, isThisWeek } from 'date-fns';
import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';

interface Task {
  id: string;
  title: string;
  priority?: 'high' | 'medium' | 'low';
  estimated_duration?: number;
  due_date?: string | null;
  scheduled_date?: string | null;
  completed: boolean;
  vibe_projects?: { name: string };
}

interface Project {
  id: string;
  name: string;
  description?: string;
  category: string;
  color?: string;
  tasks: Task[];
}

interface TaskSidebarProps {
  projects: Project[];
  selectedDate: string;
  onCreateTask?: (projectId: string, title: string, description?: string, dueDate?: Date, duration?: number, priority?: 'low' | 'medium' | 'high') => void;
  onCreateProject?: (project: { name: string; description: string; category: string; tasks: any[] }) => void;
  onUpdateProject?: (id: string, updates: Partial<Project>) => Promise<void>;
  onDeleteProject?: (id: string) => Promise<void>;
  onUpdateTask?: (taskId: string, updates: Partial<Task>) => Promise<void>;
  onDeleteTask?: (taskId: string) => Promise<void>;
  className?: string;
}

const TaskSidebar = ({ projects, selectedDate, onCreateTask, onCreateProject, onUpdateProject, onDeleteProject, onUpdateTask, onDeleteTask, className }: TaskSidebarProps) => {
  const { categories } = useCategories();
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [dueDateFilter, setDueDateFilter] = useState<string>('all');
  const [showAddTaskDialog, setShowAddTaskDialog] = useState(false);
  const [activeInlineAdd, setActiveInlineAdd] = useState<string | null>(null);
  const [inlineTaskTitle, setInlineTaskTitle] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [showEditTaskDialog, setShowEditTaskDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingProjectName, setEditingProjectName] = useState('');
  const [showDeleteProjectDialog, setShowDeleteProjectDialog] = useState<string | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  
  // Add Task Form State
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskDueDate, setTaskDueDate] = useState<Date | undefined>(undefined);
  const [taskPriority, setTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [taskDuration, setTaskDuration] = useState('30');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set up droppable for the sidebar to accept projects and tasks
  const { isOver, setNodeRef } = useDroppable({
    id: 'task-sidebar',
    data: {
      accepts: ['task', 'project'],
    },
  });

  // Get all tasks that are not scheduled for the selected date
  const allTasks = useMemo(() => {
    const tasks = projects.flatMap(project => 
      project.tasks
        .filter(task => task.scheduled_date !== selectedDate) // Filter out tasks scheduled for the selected date
        .map(task => ({
          ...task,
          vibe_projects: { name: project.name }
        }))
    );
    
    // Sort tasks: incomplete tasks first, then completed tasks (both sorted by creation date)
    return tasks.sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1; // Completed tasks go to bottom
      }
      return 0; // Keep relative order for same completion status
    });
  }, [projects, selectedDate]);

  // Apply filters
  const filteredTasks = useMemo(() => {
    return allTasks.filter(task => {
      // Project filter
      if (projectFilter !== 'all') {
        const projectMatch = projects.find(p => 
          p.tasks.some(t => t.id === task.id) && p.id === projectFilter
        );
        if (!projectMatch) return false;
      }

      // Priority filter
      if (priorityFilter !== 'all' && task.priority !== priorityFilter) {
        return false;
      }

      // Due date filter
      if (dueDateFilter !== 'all' && task.due_date) {
        const dueDate = new Date(task.due_date);
        switch (dueDateFilter) {
          case 'today':
            if (!isToday(dueDate)) return false;
            break;
          case 'overdue':
            if (!isPast(dueDate) || isToday(dueDate)) return false;
            break;
          case 'this-week':
            if (!isThisWeek(dueDate)) return false;
            break;
        }
      } else if (dueDateFilter !== 'all' && !task.due_date) {
        return false;
      }

      return true;
    });
  }, [allTasks, projectFilter, priorityFilter, dueDateFilter, projects]);

  // Get unique projects that have unscheduled tasks (including completed ones for display)
  const projectsWithTasks = useMemo(() => {
    return projects.filter(project => 
      project.tasks.some(task => task.scheduled_date !== selectedDate)
    );
  }, [projects, selectedDate]);

  // Wrapper to handle type compatibility with SmartAddButton
  const handleCreateTask = (projectId: string, title: string, description?: string, dueDate?: Date, duration?: number, priority?: 'low' | 'medium' | 'high') => {
    onCreateTask?.(projectId, title, description, dueDate);
  };

  // Handle task click for editing
  const handleTaskClick = (task: Task) => {
    console.log('🎯 Task clicked for editing:', task.title);
    setSelectedTask(task);
    setShowEditTaskDialog(true);
  };

  // Handle task edit
  const handleTaskEdit = async (taskId: string, updates: Partial<Task>) => {
    if (onUpdateTask) {
      await onUpdateTask(taskId, updates);
    }
  };

  // Handle task completion
  const handleTaskComplete = (taskId: string, completed: boolean) => {
    if (onUpdateTask) {
      onUpdateTask(taskId, { completed });
    }
  };

  // Handle task delete
  const handleTaskDelete = async (taskId: string) => {
    if (onDeleteTask) {
      await onDeleteTask(taskId);
    }
  };

  // Handle project name editing
  const handleEditProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      setEditingProjectId(projectId);
      setEditingProjectName(project.name);
    }
  };

  const handleSaveProjectName = () => {
    if (editingProjectName.trim() && editingProjectId) {
      onUpdateProject?.(editingProjectId, { name: editingProjectName.trim() });
      setEditingProjectId(null);
      setEditingProjectName('');
    }
  };

  const handleCancelEditProjectName = () => {
    setEditingProjectId(null);
    setEditingProjectName('');
  };

  const handleDeleteProject = async (projectId: string) => {
    if (onDeleteProject) {
      await onDeleteProject(projectId);
    }
    setShowDeleteProjectDialog(null);
  };

  const handleProjectEdit = async (projectId: string, updates: Partial<Project>) => {
    if (onUpdateProject) {
      await onUpdateProject(projectId, updates);
    }
  };

  const handleProjectDelete = async (projectId: string) => {
    if (onDeleteProject) {
      await onDeleteProject(projectId);
    }
  };
  
  
  const getTaskCountByPriority = (priority: string) => {
    return allTasks.filter(task => task.priority === priority).length;
  };

  // Dynamic Color System Based on Project Category or Custom Color
  const getProjectColor = (category: string = 'work', customColor?: string) => {
    // Use custom color if provided
    if (customColor) {
      return {
        hex: customColor,
        border: `border-[${customColor}]`,
        text: `text-[${customColor}]`, 
        accent: `text-[${customColor}]`,
        taskBg: `bg-[${customColor}]`,
        taskHover: 'hover:brightness-110',
        name: 'custom',
        cssVar: customColor
      };
    }
    
    // Fallback to category-based colors
    switch (category) {
      case 'personal':
        return {
          hex: 'hsl(150, 45%, 45%)', // Darker professional green
          border: 'border-[hsl(150,45%,45%)]',
          text: 'text-[hsl(150,45%,45%)]', 
          accent: 'text-[hsl(150,45%,45%)]',
          taskBg: 'bg-[hsl(150,45%,45%)]',
          taskHover: 'hover:brightness-110',
          name: 'personal-green',
          cssVar: 'hsl(var(--personal))'
        };
      case 'home':
        return {
          hex: 'hsl(25, 95%, 53%)', // Orange
          border: 'border-[hsl(25,95%,53%)]',
          text: 'text-[hsl(25,95%,53%)]', 
          accent: 'text-[hsl(25,95%,53%)]',
          taskBg: 'bg-[hsl(25,95%,53%)]',
          taskHover: 'hover:brightness-110',
          name: 'home-orange',
          cssVar: 'hsl(var(--home))'
        };
      case 'work':
      default:
        return {
          hex: '#4DA8DA', // Blue - keep existing work color
          border: 'border-[#4DA8DA]',
          text: 'text-[#4DA8DA]', 
          accent: 'text-[#4DA8DA]',
          taskBg: 'bg-[#4DA8DA]',
          taskHover: 'hover:brightness-110',
          name: 'work-blue',
          cssVar: 'hsl(var(--work))'
        };
    }
  };

  // Get category icon function
  const getCategoryIcon = (category: string) => {
    const categoryLower = category.toLowerCase();
    const categoryData = categories.find(cat => cat.name.toLowerCase() === categoryLower);
    
    // Fallback to direct icon mapping if category not found
    if (!categoryData) {
      switch (categoryLower) {
        case 'home': return Home;
        case 'personal': return User;
        case 'work': return Briefcase;
        default: return Briefcase;
      }
    }
    
    return categoryData.icon || Briefcase;
  };

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "h-full",
        isOver && "ring-2 ring-primary ring-offset-2 bg-primary/5 transition-all duration-200"
      )}
    >
      {/* Tasks Section Header */}
      <div className="flex items-center justify-between mb-4 pb-2 border-b">
        <div className="flex items-center gap-2">
          <CheckSquare className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-medium text-primary">Tasks</h1>
        </div>
        {/* Only show Add Task button if there are projects with tasks available */}
        {projectsWithTasks.length > 0 && (
          <Button
            onClick={() => {
              // Select the first project by default
              setSelectedProjectId(projectsWithTasks[0].id);
              setShowAddTaskDialog(true);
            }}
            size="sm"
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        )}
      </div>
      
      {/* No header section needed - Add button is now in parent component */}

      {/* Removed filter section as requested */}

      {/* Projects Grid - Single Column for Narrower Container */}
      <div className="grid grid-cols-1 gap-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 350px)' }}>
        {projectsWithTasks.map((project, index) => {
          // Get filtered tasks for this project
          const projectTasks = allTasks.filter(task => {
            // Check if task belongs to this project
            const belongsToProject = projects.find(p => 
              p.tasks.some(t => t.id === task.id) && p.id === project.id
            );
            if (!belongsToProject) return false;

            // Apply other filters
            if (priorityFilter !== 'all' && task.priority !== priorityFilter) {
              return false;
            }

            if (dueDateFilter !== 'all' && task.due_date) {
              const dueDate = new Date(task.due_date);
              switch (dueDateFilter) {
                case 'today':
                  if (!isToday(dueDate)) return false;
                  break;
                case 'overdue':
                  if (!isPast(dueDate) || isToday(dueDate)) return false;
                  break;
                case 'this-week':
                  if (!isThisWeek(dueDate)) return false;
                  break;
              }
            } else if (dueDateFilter !== 'all' && !task.due_date) {
              return false;
            }

            return true;
          });

          if (projectTasks.length === 0) return null;

          const projectColor = getProjectColor(project.category, project.color);

          return (
            <div 
              key={project.id} 
              className={cn(
                "bg-white rounded-xl p-4 shadow-sm w-full transition-all duration-150 border-2 hover:shadow-gb-card"
              )}
              style={{ borderColor: project.color || (typeof projectColor === 'string' ? projectColor : projectColor.hex) }}
            >
              {/* Project Header with Edit/Delete Options */}
              <div className="flex justify-between items-center mb-2 group">
                <div className="flex items-center gap-2 flex-1">
                  {editingProjectId === project.id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        value={editingProjectName}
                        onChange={(e) => setEditingProjectName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveProjectName();
                          if (e.key === 'Escape') handleCancelEditProjectName();
                        }}
                        className="text-sm font-semibold h-7 px-2"
                        autoFocus
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleSaveProjectName}
                        className="h-7 w-7 p-0"
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                     <div className="flex-1">
                       <h3 
                         className="text-base font-semibold text-primary cursor-pointer transition-colors flex items-center gap-2"
                         onClick={() => setEditingProject(project)}
                       >
                          {(() => {
                            const CategoryIcon = getCategoryIcon(project.category);
                            const projectColor = getProjectColor(project.category, project.color);
                            return <CategoryIcon className="w-4 h-4" style={{ color: project.color || '#6B7280' }} />;
                          })()}
                         {project.name}
                       </h3>
                     </div>
                  )}
                </div>
              </div>

              {/* Task Pills */}
              <div className="flex flex-col gap-2">
                {projectTasks.map(task => {
                  // Determine if task is overdue for red border styling
                  const isOverdue = task.due_date && isPast(new Date(task.due_date)) && !isToday(new Date(task.due_date));
                  
                  return (
                    <div
                      key={task.id}
                      className={cn(
                        "rounded-lg transition-all duration-150 cursor-pointer",
                        "hover:scale-[1.02] hover:shadow-md",
                        isOverdue && "border-2 border-red-500"
                      )}
                      title="Click to edit or delete this task"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 truncate">
                          <DraggableTaskItem 
                            task={task} 
                            onTaskClick={handleTaskClick} 
                            onTaskComplete={handleTaskComplete}
                            projectColor={project.color || projectColor.hex}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {/* Inline Add Task Button/Input */}
                {activeInlineAdd === project.id ? (
                  <input
                    type="text"
                    value={inlineTaskTitle}
                    onChange={(e) => setInlineTaskTitle(e.target.value)}
                    onKeyDown={async (e) => {
                      if (e.key === 'Enter' && inlineTaskTitle.trim()) {
                        try {
                          await onCreateTask?.(project.id, inlineTaskTitle.trim());
                          setInlineTaskTitle("");
                          setActiveInlineAdd(null);
                        } catch (error) {
                          console.error('Error creating task:', error);
                        }
                      } else if (e.key === 'Escape') {
                        setInlineTaskTitle("");
                        setActiveInlineAdd(null);
                      }
                    }}
                    onBlur={() => {
                      setInlineTaskTitle("");
                      setActiveInlineAdd(null);
                    }}
                    placeholder="Type task name and press Enter..."
                    className="text-sm px-3 py-1 rounded-md border-2 border-dashed w-full focus:outline-none text-foreground"
                    style={{ 
                      borderColor: project.color || projectColor.hex,
                      backgroundColor: 'transparent'
                    }}
                    autoFocus
                  />
                ) : (
                  <button
                    onClick={() => {
                      setActiveInlineAdd(project.id);
                    }}
                    onDoubleClick={() => {
                      setSelectedProjectId(project.id);
                      setShowAddTaskDialog(true);
                    }}
                    className={cn(
                      "text-sm font-medium px-3 py-1 rounded-md border-2 border-dashed transition-all duration-150 hover:bg-gray-50",
                      "flex items-center justify-center gap-2"
                    )}
                    style={{ 
                      borderColor: project.color || projectColor.hex,
                      color: project.color || projectColor.hex
                    }}
                    title="Click to quick add, double-click for detailed add"
                  >
                    + Add
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* Show message if no projects have tasks */}
        {projectsWithTasks.length === 0 && (
          <div className="col-span-full text-center py-12">
            <div className="rounded-xl bg-white p-8 border-2 border-dashed border-[#E2E8F0] shadow-sm">
              {allTasks.length === 0 && projects.length === 0 ? (
                // No projects at all - first time user
                <div>
                  <h3 className="text-lg font-semibold text-[#0F172A] mb-2">Let's Get Started</h3>
                  <p className="text-[#64748B] mb-6">You haven't added any tasks yet.</p>
                  <Button
                    className="bg-[#172B4D] hover:bg-[#172B4D]/90 text-white flex items-center gap-2"
                    onClick={() => {
                      // Show add task dialog if there are projects
                      if (projects.length > 0) {
                        setSelectedProjectId(projects[0].id);
                        setShowAddTaskDialog(true);
                      }
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    Add Task
                  </Button>
                </div>
              ) : allTasks.length === 0 ? (
                // No tasks but have projects
                <div>
                  <h3 className="text-lg font-semibold text-[#0F172A] mb-2">All tasks complete!</h3>
                  <p className="text-[#64748B]">Great job staying on top of everything.</p>
                </div>
              ) : (
                // Have tasks but none match filters
                <div>
                  <h3 className="text-lg font-semibold text-[#0F172A] mb-2">No matching tasks</h3>
                  <p className="text-[#64748B]">Try adjusting your filters to see more tasks.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add Task Dialog */}
      {showAddTaskDialog && (
        <Dialog open={showAddTaskDialog} onOpenChange={setShowAddTaskDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Task</DialogTitle>
            </DialogHeader>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!taskTitle.trim()) return;
              
              setIsSubmitting(true);
              try {
                await onCreateTask?.(
                  selectedProjectId, 
                  taskTitle.trim(), 
                  taskDescription.trim() || undefined,
                  taskDueDate,
                  parseInt(taskDuration),
                  taskPriority
                );
                
                // Reset form
                setTaskTitle('');
                setTaskDescription('');
                setTaskDueDate(undefined);
                setTaskPriority('medium');
                setTaskDuration('30');
                setShowAddTaskDialog(false);
                setSelectedProjectId('');
              } catch (error) {
                console.error('Error creating task:', error);
              } finally {
                setIsSubmitting(false);
              }
            }} className="space-y-4">
              <div>
                <Label htmlFor="task-title">Task Name</Label>
                <Input
                  id="task-title"
                  placeholder="What needs to be done?"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="task-description">Description (optional)</Label>
                <Input
                  id="task-description"
                  placeholder="Add more details..."
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                />
              </div>

              <div>
                <Label>Due Date (optional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !taskDueDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {taskDueDate ? format(taskDueDate, "PPP") : <span>Choose a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={taskDueDate}
                      onSelect={setTaskDueDate}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label>Priority</Label>
                <Select value={taskPriority} onValueChange={(value) => setTaskPriority(value as 'low' | 'medium' | 'high')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Duration</Label>
                <Select value={taskDuration} onValueChange={setTaskDuration}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                    <SelectItem value="180">3 hours</SelectItem>
                    <SelectItem value="360">6 hours</SelectItem>
                    <SelectItem value="480">8 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowAddTaskDialog(false);
                    setSelectedProjectId('');
                    setTaskTitle('');
                    setTaskDescription('');
                    setTaskDueDate(undefined);
                    setTaskPriority('medium');
                    setTaskDuration('30');
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting || !taskTitle.trim()}
                  className="flex-1"
                >
                  {isSubmitting ? 'Adding...' : 'Add Task'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Task Dialog */}
      <TaskEditDialog
        task={selectedTask}
        isOpen={showEditTaskDialog}
        onClose={() => {
          setShowEditTaskDialog(false);
          setSelectedTask(null);
        }}
        onSave={handleTaskEdit}
        onDelete={handleTaskDelete}
      />

      {/* Edit Project Dialog */}
      <ProjectEditDialog
        project={editingProject}
        isOpen={!!editingProject}
        onClose={() => setEditingProject(null)}
        onSave={handleProjectEdit}
        onDelete={handleProjectDelete}
      />

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
              onClick={() => showDeleteProjectDialog && handleDeleteProject(showDeleteProjectDialog)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TaskSidebar;