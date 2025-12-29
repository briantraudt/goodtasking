import { useState, useEffect } from 'react';
import { X, Sparkles, ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Feature {
  id: string;
  version: string;
  title: string;
  description: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  actionUrl?: string;
}

const CURRENT_VERSION = '1.2.0';

const NEW_FEATURES: Feature[] = [
  {
    id: 'ai-daily-planner',
    version: '1.2.0',
    title: 'AI Daily Planner',
    description: 'Let AI help you organize your day with smart scheduling suggestions based on your tasks and calendar.',
    icon: <Sparkles className="w-5 h-5" />,
    actionLabel: 'Try it now',
  },
  {
    id: 'weekly-review',
    version: '1.2.0',
    title: 'Weekly AI Review',
    description: 'Get personalized insights about your productivity patterns and suggestions for improvement.',
    icon: <Sparkles className="w-5 h-5" />,
  },
  {
    id: 'smart-task-parser',
    version: '1.1.0',
    title: 'Smart Task Input',
    description: 'Type naturally and let AI extract due dates, priorities, and project assignments automatically.',
    icon: <Sparkles className="w-5 h-5" />,
  },
];

const STORAGE_KEY = 'vibe-seen-features';
const LAST_VERSION_KEY = 'vibe-last-version';

function getSeenFeatures(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function markFeatureAsSeen(featureId: string) {
  const seen = getSeenFeatures();
  if (!seen.includes(featureId)) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...seen, featureId]));
  }
}

function getLastSeenVersion(): string | null {
  return localStorage.getItem(LAST_VERSION_KEY);
}

function setLastSeenVersion(version: string) {
  localStorage.setItem(LAST_VERSION_KEY, version);
}

export function useFeatureSpotlight() {
  const [unseenFeatures, setUnseenFeatures] = useState<Feature[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const lastVersion = getLastSeenVersion();
    const seenFeatures = getSeenFeatures();
    
    // Find features the user hasn't seen yet
    const unseen = NEW_FEATURES.filter(
      feature => !seenFeatures.includes(feature.id)
    );

    // Only show if there are new features and user has visited before
    if (unseen.length > 0 && lastVersion !== null) {
      setUnseenFeatures(unseen);
      // Small delay to let the app load first
      setTimeout(() => setIsOpen(true), 1000);
    }

    // Update last seen version
    setLastSeenVersion(CURRENT_VERSION);
  }, []);

  const dismissFeature = (featureId: string) => {
    markFeatureAsSeen(featureId);
    setUnseenFeatures(prev => prev.filter(f => f.id !== featureId));
    if (unseenFeatures.length <= 1) {
      setIsOpen(false);
    }
  };

  const dismissAll = () => {
    unseenFeatures.forEach(f => markFeatureAsSeen(f.id));
    setUnseenFeatures([]);
    setIsOpen(false);
  };

  return { unseenFeatures, isOpen, setIsOpen, dismissFeature, dismissAll };
}

interface FeatureSpotlightProps {
  features: Feature[];
  isOpen: boolean;
  onClose: () => void;
  onDismissFeature: (id: string) => void;
  onDismissAll: () => void;
}

export function FeatureSpotlight({
  features,
  isOpen,
  onClose,
  onDismissFeature,
  onDismissAll,
}: FeatureSpotlightProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!isOpen || features.length === 0) return null;

  const currentFeature = features[currentIndex];
  const isLast = currentIndex === features.length - 1;

  const handleNext = () => {
    onDismissFeature(currentFeature.id);
    if (!isLast) {
      setCurrentIndex(prev => prev);
    }
  };

  const handleSkipAll = () => {
    onDismissAll();
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Spotlight Card */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div 
          className={cn(
            "relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl pointer-events-auto",
            "animate-in zoom-in-95 fade-in slide-in-from-bottom-4 duration-300"
          )}
        >
          {/* New Badge */}
          <div className="absolute -top-3 left-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-full shadow-lg">
              <Sparkles className="w-3 h-3" />
              What's New
            </span>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>

          {/* Content */}
          <div className="p-6 pt-8">
            {/* Feature Icon */}
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary mb-4">
              {currentFeature.icon}
            </div>

            {/* Feature Info */}
            <h3 className="text-xl font-semibold text-foreground mb-2">
              {currentFeature.title}
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6">
              {currentFeature.description}
            </p>

            {/* Progress Dots */}
            {features.length > 1 && (
              <div className="flex items-center justify-center gap-1.5 mb-6">
                {features.map((_, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all duration-300",
                      idx === currentIndex 
                        ? "bg-primary w-6" 
                        : idx < currentIndex 
                          ? "bg-primary/40" 
                          : "bg-muted"
                    )}
                  />
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Button
                onClick={handleNext}
                className="flex-1 gap-2"
              >
                {isLast ? (
                  <>
                    <Check className="w-4 h-4" />
                    Got it!
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
              
              {features.length > 1 && !isLast && (
                <Button
                  variant="ghost"
                  onClick={handleSkipAll}
                  className="text-muted-foreground"
                >
                  Skip all
                </Button>
              )}
            </div>
          </div>

          {/* Feature Count */}
          <div className="px-6 py-3 border-t border-border bg-muted/30 rounded-b-2xl">
            <p className="text-xs text-muted-foreground text-center">
              {currentIndex + 1} of {features.length} new feature{features.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default FeatureSpotlight;
