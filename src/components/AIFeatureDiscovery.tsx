import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Brain, 
  Calendar, 
  Target, 
  MessageSquare, 
  BarChart3, 
  Wand2, 
  Clock, 
  TrendingUp,
  Sparkles,
  X
} from 'lucide-react';

interface AIFeature {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: 'planning' | 'analysis' | 'automation' | 'insights';
  status: 'available' | 'new' | 'beta';
  actionText: string;
  actionFn: () => void;
}

interface AIFeatureDiscoveryProps {
  onFeatureSelect: (featureId: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const AIFeatureDiscovery: React.FC<AIFeatureDiscoveryProps> = ({
  onFeatureSelect,
  isOpen,
  onClose
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const aiFeatures: AIFeature[] = [
    {
      id: 'smart-parser',
      name: 'Smart Task Parser',
      description: 'Create tasks from natural language. Just type "Call John tomorrow at 3pm" and AI will handle the rest.',
      icon: <MessageSquare className="h-5 w-5" />,
      category: 'automation',
      status: 'available',
      actionText: 'Try Smart Parser',
      actionFn: () => onFeatureSelect('smart-parser')
    },
    {
      id: 'daily-planner',
      name: 'AI Daily Planner',
      description: 'Get personalized daily schedules that optimize your time and energy based on your tasks and calendar.',
      icon: <Calendar className="h-5 w-5" />,
      category: 'planning',
      status: 'available',
      actionText: 'Plan My Day',
      actionFn: () => onFeatureSelect('daily-planner')
    },
    {
      id: 'task-sequencer',
      name: 'AI Task Sequencer',
      description: 'Automatically order and schedule your tasks for maximum productivity and efficiency.',
      icon: <Target className="h-5 w-5" />,
      category: 'planning',
      status: 'available',
      actionText: 'Sequence Tasks',
      actionFn: () => onFeatureSelect('task-sequencer')
    },
    {
      id: 'daily-summary',
      name: 'Daily AI Summary',
      description: 'Get personalized insights about your daily productivity, completion rates, and recommendations.',
      icon: <BarChart3 className="h-5 w-5" />,
      category: 'analysis',
      status: 'available',
      actionText: 'View Summary',
      actionFn: () => onFeatureSelect('daily-summary')
    },
    {
      id: 'weekly-review',
      name: 'Weekly AI Review',
      description: 'Comprehensive weekly analysis with trends, achievements, and strategic recommendations.',
      icon: <TrendingUp className="h-5 w-5" />,
      category: 'analysis',
      status: 'available',
      actionText: 'View Review',
      actionFn: () => onFeatureSelect('weekly-review')
    },
    {
      id: 'smart-scheduling',
      name: 'Smart Scheduling',
      description: 'AI-powered scheduling that considers your calendar, preferences, and optimal productivity times.',
      icon: <Clock className="h-5 w-5" />,
      category: 'automation',
      status: 'new',
      actionText: 'Auto Schedule',
      actionFn: () => onFeatureSelect('smart-scheduling')
    },
    {
      id: 'ai-chat',
      name: 'AI Task Assistant',
      description: 'Chat with AI to get help with task planning, scheduling, and productivity optimization.',
      icon: <Brain className="h-5 w-5" />,
      category: 'insights',
      status: 'beta',
      actionText: 'Start Chat',
      actionFn: () => onFeatureSelect('ai-chat')
    },
    {
      id: 'productivity-insights',
      name: 'Productivity Insights',
      description: 'Real-time analysis of your work patterns, peak hours, and optimization opportunities.',
      icon: <Sparkles className="h-5 w-5" />,
      category: 'insights',
      status: 'new',
      actionText: 'View Insights',
      actionFn: () => onFeatureSelect('productivity-insights')
    }
  ];

  const categories = [
    { id: 'planning', name: 'Planning & Scheduling', icon: <Calendar className="h-4 w-4" /> },
    { id: 'analysis', name: 'Analysis & Reports', icon: <BarChart3 className="h-4 w-4" /> },
    { id: 'automation', name: 'Smart Automation', icon: <Wand2 className="h-4 w-4" /> },
    { id: 'insights', name: 'AI Insights', icon: <Brain className="h-4 w-4" /> }
  ];

  const getStatusColor = (status: AIFeature['status']) => {
    switch (status) {
      case 'new':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'beta':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  const filteredFeatures = selectedCategory 
    ? aiFeatures.filter(f => f.category === selectedCategory)
    : aiFeatures;

  const handleFeatureAction = (feature: AIFeature) => {
    feature.actionFn();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            AI Features & Capabilities
            <Badge variant="outline" className="ml-auto">
              {aiFeatures.length} Features Available
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[500px]">
          {/* Category Sidebar */}
          <div className="lg:col-span-1 space-y-2">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
              Categories
            </h3>
            <Button
              variant={selectedCategory === null ? "default" : "ghost"}
              className="w-full justify-start h-auto p-3"
              onClick={() => setSelectedCategory(null)}
            >
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                <span>All Features</span>
              </div>
            </Button>
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "ghost"}
                className="w-full justify-start h-auto p-3"
                onClick={() => setSelectedCategory(category.id)}
              >
                <div className="flex items-center gap-2">
                  {category.icon}
                  <span className="text-sm">{category.name}</span>
                </div>
              </Button>
            ))}
          </div>

          {/* Features Grid */}
          <div className="lg:col-span-3 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-2">
              {filteredFeatures.map((feature) => (
                <Card key={feature.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                          {feature.icon}
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm">{feature.name}</h4>
                          <Badge 
                            variant="outline" 
                            className={`text-xs mt-1 ${getStatusColor(feature.status)}`}
                          >
                            {feature.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                      {feature.description}
                    </p>
                    <Button
                      size="sm"
                      onClick={() => handleFeatureAction(feature)}
                      className="w-full bg-primary/10 hover:bg-primary/20 text-primary border-primary/20"
                      variant="outline"
                    >
                      {feature.actionText}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            More AI features are being added regularly
          </p>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AIFeatureDiscovery;