import React from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

// Full page loading spinner
export const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <div className="w-12 h-12 border-4 border-primary/20 rounded-full"></div>
        <div className="absolute top-0 left-0 w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
      <p className="text-sm text-muted-foreground animate-pulse">Loading...</p>
    </div>
  </div>
);

// Inline loading spinner
export const InlineLoader = ({ size = 'sm', className }: { size?: 'sm' | 'md' | 'lg'; className?: string }) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3'
  };

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div className={cn(
        "border-primary/20 border-t-primary rounded-full animate-spin",
        sizeClasses[size]
      )}></div>
    </div>
  );
};

// Task skeleton loader
export const TaskSkeleton = ({ count = 3 }: { count?: number }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="bg-card rounded-lg p-3 border">
        <div className="flex items-start gap-3">
          <Skeleton className="h-5 w-5 rounded" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

// Project skeleton loader
export const ProjectSkeleton = ({ count = 2 }: { count?: number }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="bg-card rounded-xl p-4 border-2 border-border">
        <div className="flex items-center gap-3 mb-3">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    ))}
  </div>
);

// Calendar day skeleton
export const CalendarSkeleton = () => (
  <div className="space-y-2">
    <div className="flex items-center justify-between mb-4">
      <Skeleton className="h-6 w-32" />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-8 rounded" />
        <Skeleton className="h-8 w-8 rounded" />
      </div>
    </div>
    {Array.from({ length: 8 }).map((_, i) => (
      <div key={i} className="flex gap-3">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-12 flex-1 rounded" />
      </div>
    ))}
  </div>
);

// Dashboard header skeleton
export const HeaderSkeleton = () => (
  <div className="flex items-center justify-between p-4 border-b">
    <div className="flex items-center gap-3">
      <Skeleton className="h-8 w-8 rounded-lg" />
      <Skeleton className="h-6 w-32" />
    </div>
    <div className="flex items-center gap-3">
      <Skeleton className="h-9 w-24 rounded-lg" />
      <Skeleton className="h-9 w-9 rounded-lg" />
    </div>
  </div>
);

// Button loading state
export const ButtonLoader = ({ className }: { className?: string }) => (
  <div className={cn("flex items-center gap-2", className)}>
    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
    <span>Loading...</span>
  </div>
);

// Pulse animation for subtle loading
export const PulseLoader = ({ className }: { className?: string }) => (
  <div className={cn("flex gap-1 items-center", className)}>
    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
  </div>
);

export default PageLoader;
