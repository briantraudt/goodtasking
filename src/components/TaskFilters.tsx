import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SlidersHorizontal, X } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface Project {
  id: string;
  name: string;
  tasks: any[];
}

interface TaskFiltersProps {
  projects: Project[];
  projectFilter: string;
  priorityFilter: string;
  dueDateFilter: string;
  onProjectFilterChange: (value: string) => void;
  onPriorityFilterChange: (value: string) => void;
  onDueDateFilterChange: (value: string) => void;
  onClearAllFilters: () => void;
}

const TaskFilters = ({
  projects,
  projectFilter,
  priorityFilter,
  dueDateFilter,
  onProjectFilterChange,
  onPriorityFilterChange,
  onDueDateFilterChange,
  onClearAllFilters
}: TaskFiltersProps) => {
  const [isOpen, setIsOpen] = useState(false);

  // Filter projects that have tasks
  const projectsWithTasks = projects.filter(project => 
    project.tasks.some(task => !task.completed)
  );

  // Get active filters for chips
  const activeFilters = [];
  
  if (projectFilter !== 'all') {
    const project = projects.find(p => p.id === projectFilter);
    activeFilters.push({
      type: 'project',
      label: `Project: ${project?.name || 'Unknown'}`,
      value: projectFilter,
      onRemove: () => onProjectFilterChange('all')
    });
  }
  
  if (priorityFilter !== 'all') {
    const priorityLabels = {
      high: 'High Priority',
      medium: 'Medium Priority',
      low: 'Low Priority'
    };
    activeFilters.push({
      type: 'priority',
      label: `Priority: ${priorityLabels[priorityFilter as keyof typeof priorityLabels] || priorityFilter}`,
      value: priorityFilter,
      onRemove: () => onPriorityFilterChange('all')
    });
  }
  
  if (dueDateFilter !== 'all') {
    const dueDateLabels = {
      overdue: 'Overdue',
      today: 'Due Today',
      'this-week': 'Due This Week'
    };
    activeFilters.push({
      type: 'dueDate',
      label: `Due: ${dueDateLabels[dueDateFilter as keyof typeof dueDateLabels] || dueDateFilter}`,
      value: dueDateFilter,
      onRemove: () => onDueDateFilterChange('all')
    });
  }

  const hasActiveFilters = activeFilters.length > 0;

  const handleApplyFilters = () => {
    setIsOpen(false);
  };

  const handleClearAll = () => {
    onClearAllFilters();
    setIsOpen(false);
  };

  return (
    <div className="space-y-3">
      {/* Filter Button */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2 h-8 text-xs"
          >
            <SlidersHorizontal className="h-3 w-3" />
            Filter Tasks
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-auto h-4 px-1 text-[10px]">
                {activeFilters.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-4" align="start">
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-sm mb-3">Filter Tasks</h4>
            </div>
            
            <Separator />
            
            {/* Project Filter */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Project
              </label>
              <Select value={projectFilter} onValueChange={onProjectFilterChange}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="All Projects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projectsWithTasks.map(project => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Priority Filter */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Priority
              </label>
              <Select value={priorityFilter} onValueChange={onPriorityFilterChange}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="All Priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="high">High Priority</SelectItem>
                  <SelectItem value="medium">Medium Priority</SelectItem>
                  <SelectItem value="low">Low Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Due Date Filter */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Due Date
              </label>
              <Select value={dueDateFilter} onValueChange={onDueDateFilterChange}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="All Due Dates" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Due Dates</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="today">Due Today</SelectItem>
                  <SelectItem value="this-week">Due This Week</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button 
                onClick={handleApplyFilters}
                size="sm" 
                className="flex-1 h-8 text-xs"
              >
                Apply Filters
              </Button>
              <Button 
                onClick={handleClearAll}
                variant="outline" 
                size="sm" 
                className="h-8 text-xs"
                disabled={!hasActiveFilters}
              >
                Clear All
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Filter Chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-1">
          {activeFilters.map((filter, index) => (
            <Badge
              key={`${filter.type}-${index}`}
              variant="secondary"
              className="text-[10px] py-0.5 px-2 gap-1 hover:bg-destructive hover:text-destructive-foreground transition-colors group"
            >
              <span className="truncate max-w-[120px]">{filter.label}</span>
              <button
                onClick={filter.onRemove}
                className="ml-1 hover:bg-destructive-foreground hover:text-destructive rounded-full p-0.5 transition-colors"
                aria-label={`Remove ${filter.label} filter`}
              >
                <X className="h-2 w-2" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskFilters;