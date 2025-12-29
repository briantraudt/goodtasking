import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CalendarCheck, 
  CheckSquare, 
  FolderOpen, 
  Brain, 
  Sparkles,
  ArrowRight,
  ArrowLeft,
  X,
  GripVertical,
  Target,
  Rocket
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  tip?: string;
}

const tutorialSteps: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Good Tasking! 🎉',
    description: 'Your AI-powered task manager that helps you plan your perfect day. Let me show you around.',
    icon: CalendarCheck,
    color: 'from-primary to-primary/80',
  },
  {
    id: 'projects',
    title: 'Organize with Projects',
    description: 'Create projects to group related tasks. Think Work, Personal, Side Hustle, or whatever fits your life.',
    icon: FolderOpen,
    color: 'from-amber-500 to-orange-500',
    tip: 'Tip: Each project gets its own color to help you quickly identify tasks.',
  },
  {
    id: 'tasks',
    title: 'Add Tasks Easily',
    description: 'Add tasks to your projects with titles, due dates, priorities, and estimated durations.',
    icon: CheckSquare,
    color: 'from-emerald-500 to-green-500',
    tip: 'Tip: Use the quick add button (+) at the bottom of your screen on mobile.',
  },
  {
    id: 'calendar',
    title: 'Drag to Schedule',
    description: 'Drag tasks from the sidebar onto your calendar to schedule them at specific times. It\'s that simple!',
    icon: GripVertical,
    color: 'from-blue-500 to-cyan-500',
    tip: 'Tip: You can resize tasks on the calendar to adjust their duration.',
  },
  {
    id: 'ai',
    title: 'Let AI Help You',
    description: 'Use AI features to automatically plan your day, get smart suggestions, and optimize your schedule.',
    icon: Brain,
    color: 'from-purple-500 to-pink-500',
    tip: 'Tip: Click the "AI Features" button in the header to explore all AI capabilities.',
  },
  {
    id: 'ready',
    title: 'You\'re All Set!',
    description: 'Start by creating your first project, add some tasks, and experience the power of organized productivity.',
    icon: Rocket,
    color: 'from-primary to-accent',
  },
];

interface WelcomeTutorialProps {
  onComplete: () => void;
}

const WelcomeTutorial = ({ onComplete }: WelcomeTutorialProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isOpen, setIsOpen] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);

  const step = tutorialSteps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === tutorialSteps.length - 1;
  const progress = ((currentStep + 1) / tutorialSteps.length) * 100;

  const handleNext = useCallback(() => {
    if (isLastStep) {
      handleComplete();
    } else {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(prev => prev + 1);
        setIsAnimating(false);
      }, 150);
    }
  }, [isLastStep]);

  const handlePrev = () => {
    if (!isFirstStep) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(prev => prev - 1);
        setIsAnimating(false);
      }, 150);
    }
  };

  const handleComplete = () => {
    setIsOpen(false);
    onComplete();
  };

  const handleSkip = () => {
    setIsOpen(false);
    onComplete();
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'Escape') {
        handleSkip();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext]);

  const IconComponent = step.icon;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleSkip()}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden gap-0">
        {/* Progress bar */}
        <div className="h-1 bg-muted">
          <div 
            className="h-full bg-primary transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Skip button */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors z-10"
          aria-label="Skip tutorial"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Step indicator */}
        <div className="px-6 pt-4">
          <Badge variant="secondary" className="text-xs">
            Step {currentStep + 1} of {tutorialSteps.length}
          </Badge>
        </div>

        {/* Content */}
        <div className={cn(
          "px-6 py-6 transition-all duration-150",
          isAnimating && "opacity-0 translate-x-4"
        )}>
          {/* Icon */}
          <div className={cn(
            "w-16 h-16 rounded-2xl bg-gradient-to-br flex items-center justify-center mb-6 shadow-lg",
            step.color
          )}>
            <IconComponent className="h-8 w-8 text-white" />
          </div>

          {/* Title & Description */}
          <DialogHeader className="text-left space-y-3">
            <DialogTitle className="text-2xl font-bold">
              {step.title}
            </DialogTitle>
            <DialogDescription className="text-base text-muted-foreground leading-relaxed">
              {step.description}
            </DialogDescription>
          </DialogHeader>

          {/* Tip */}
          {step.tip && (
            <div className="mt-4 p-3 bg-primary/5 border border-primary/10 rounded-lg flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-sm text-foreground">{step.tip}</p>
            </div>
          )}
        </div>

        {/* Step dots */}
        <div className="flex justify-center gap-2 pb-4">
          {tutorialSteps.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setIsAnimating(true);
                setTimeout(() => {
                  setCurrentStep(index);
                  setIsAnimating(false);
                }, 150);
              }}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-200",
                index === currentStep 
                  ? "bg-primary w-6" 
                  : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
              )}
              aria-label={`Go to step ${index + 1}`}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between px-6 py-4 border-t bg-muted/30">
          <Button
            variant="ghost"
            onClick={handlePrev}
            disabled={isFirstStep}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          <Button
            onClick={handleNext}
            className="gap-2 min-w-[120px]"
          >
            {isLastStep ? (
              <>
                Get Started
                <Rocket className="h-4 w-4" />
              </>
            ) : (
              <>
                Next
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Hook to manage tutorial state
export const useWelcomeTutorial = () => {
  const { user } = useAuth();
  const [showTutorial, setShowTutorial] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkTutorialStatus = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      // Check localStorage first for immediate response
      const localKey = `tutorial_completed_${user.id}`;
      const localCompleted = localStorage.getItem(localKey);
      
      if (localCompleted === 'true') {
        setShowTutorial(false);
        setIsLoading(false);
        return;
      }

      // Check if user has completed onboarding (they're not brand new)
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('has_completed_onboarding, created_at')
          .eq('user_id', user.id)
          .single();

        // Show tutorial if user just completed onboarding or is new
        // But only if they haven't seen it before (check localStorage)
        if (profile?.has_completed_onboarding && !localCompleted) {
          setShowTutorial(true);
        }
      } catch (error) {
        console.error('Error checking tutorial status:', error);
      }
      
      setIsLoading(false);
    };

    checkTutorialStatus();
  }, [user?.id]);

  const completeTutorial = useCallback(() => {
    if (user?.id) {
      localStorage.setItem(`tutorial_completed_${user.id}`, 'true');
    }
    setShowTutorial(false);
  }, [user?.id]);

  const resetTutorial = useCallback(() => {
    if (user?.id) {
      localStorage.removeItem(`tutorial_completed_${user.id}`);
    }
    setShowTutorial(true);
  }, [user?.id]);

  return {
    showTutorial,
    isLoading,
    completeTutorial,
    resetTutorial,
  };
};

export default WelcomeTutorial;
