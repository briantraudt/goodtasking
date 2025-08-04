import React, { useState, useEffect, useRef, useCallback } from 'react';
import { format, addDays, subDays, parseISO, isToday, startOfDay, addHours } from 'date-fns';
import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';

interface DroppableTimeSlotProps {
  hour: number;
  period: 'first' | 'second';
  children?: React.ReactNode;
  hasOverlap?: boolean;
  isCurrentTime?: boolean;
}

interface TimelineHeaderProps {
  currentDate: string;
  onDateChange: (date: string) => void;
}

const TimelineHeader = ({ currentDate, onDateChange }: TimelineHeaderProps) => {
  const formatHeaderDate = () => {
    const date = new Date(currentDate);
    const dayName = format(date, 'EEEE');
    const monthDay = format(date, 'MMMM d');
    
    if (isToday(date)) {
      return `Today, ${monthDay}`;
    }
    return `${dayName}, ${monthDay}`;
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const currentDateObj = new Date(currentDate);
    const newDate = direction === 'prev' ? subDays(currentDateObj, 1) : addDays(currentDateObj, 1);
    const newDateStr = newDate.toISOString().split('T')[0];
    onDateChange(newDateStr);
  };

  return (
    <div className="sticky top-0 z-30 bg-background border-b border-border p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateDate('prev')}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            aria-label="Previous day"
          >
            ←
          </button>
          <h2 className="text-lg font-semibold min-w-[200px] text-center">
            {formatHeaderDate()}
          </h2>
          <button
            onClick={() => navigateDate('next')}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            aria-label="Next day"
          >
            →
          </button>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const today = new Date().toISOString().split('T')[0];
              onDateChange(today);
            }}
            className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Today
          </button>
          <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            24-Hour View
          </div>
        </div>
      </div>
    </div>
  );
};

interface Enhanced24HourTimelineProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  timeBlocks: any[];
  onDrop?: (hour: number, period: 'first' | 'second', item: any) => void;
  children?: React.ReactNode;
}

const Enhanced24HourTimeline = ({ 
  selectedDate, 
  onDateChange, 
  timeBlocks, 
  onDrop,
  children 
}: Enhanced24HourTimelineProps) => {
  const [currentDisplayDate, setCurrentDisplayDate] = useState(selectedDate);
  const timelineRef = useRef<HTMLDivElement>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Generate all 24 hours (0-23)
  const timeSlots = Array.from({ length: 24 }, (_, i) => i);
  
  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll to current time on mount or date change to today
  useEffect(() => {
    if (isToday(new Date(selectedDate)) && timelineRef.current) {
      const currentHour = new Date().getHours();
      const hourElement = timelineRef.current.querySelector(`[data-hour="${currentHour}"]`);
      if (hourElement) {
        // Scroll with some offset to show context
        const offset = Math.max(0, currentHour - 2) * 76; // 76px per hour
        timelineRef.current.scrollTop = offset;
      }
    }
  }, [selectedDate]);

  // Handle scroll-based day switching
  const handleScroll = useCallback(() => {
    if (!timelineRef.current) return;
    
    const scrollTop = timelineRef.current.scrollTop;
    const hourHeight = 76; // Height per hour (38px * 2 for two 30-min slots)
    
    // Calculate which hour is currently at the top of the viewport
    const currentHour = Math.floor(scrollTop / hourHeight);
    
    // If we've scrolled past midnight (24:00), move to next day
    if (currentHour >= 24) {
      const nextDay = addDays(new Date(currentDisplayDate), 1);
      const nextDateStr = nextDay.toISOString().split('T')[0];
      setCurrentDisplayDate(nextDateStr);
      onDateChange(nextDateStr);
      
      // Reset scroll to the equivalent hour of the new day
      timelineRef.current.scrollTop = (currentHour - 24) * hourHeight;
    }
    // If we've scrolled before midnight (negative), move to previous day  
    else if (currentHour < 0) {
      const prevDay = subDays(new Date(currentDisplayDate), 1);
      const prevDateStr = prevDay.toISOString().split('T')[0];
      setCurrentDisplayDate(prevDateStr);
      onDateChange(prevDateStr);
      
      // Reset scroll to the equivalent hour of the previous day
      timelineRef.current.scrollTop = (24 + currentHour) * hourHeight;
    }
  }, [currentDisplayDate, onDateChange]);

  // Format hour for display
  const formatHour = (hour: number) => {
    if (hour === 0) return '12:00 AM';
    if (hour === 12) return '12:00 PM';
    if (hour < 12) return `${hour}:00 AM`;
    return `${hour - 12}:00 PM`;
  };

  // Check if current time slot is active
  const isCurrentTimeSlot = (hour: number, period: 'first' | 'second') => {
    if (!isToday(new Date(currentDisplayDate))) return false;
    
    const currentHour = currentTime.getHours();
    const currentMinutes = currentTime.getMinutes();
    
    if (hour !== currentHour) return false;
    
    return period === 'first' ? currentMinutes < 30 : currentMinutes >= 30;
  };

  // Get current time position for the red line indicator
  const getCurrentTimePosition = () => {
    if (!isToday(new Date(currentDisplayDate))) return null;
    
    const currentHour = currentTime.getHours();
    const currentMinutes = currentTime.getMinutes();
    
    // Calculate position as percentage within the day
    const totalMinutes = currentHour * 60 + currentMinutes;
    const hourHeight = 76; // Height per hour
    const position = (totalMinutes / 60) * hourHeight;
    
    return position;
  };

  const currentTimePosition = getCurrentTimePosition();

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <TimelineHeader 
        currentDate={currentDisplayDate} 
        onDateChange={(date) => {
          setCurrentDisplayDate(date);
          onDateChange(date);
        }} 
      />
      
      {/* Scrollable Timeline */}
      <div 
        ref={timelineRef}
        className="flex-1 overflow-y-auto relative"
        onScroll={handleScroll}
        style={{ 
          scrollBehavior: 'smooth',
          scrollSnapType: 'y proximity' 
        }}
      >
        {/* Time Grid */}
        <div className="relative">
          {timeSlots.map(hour => (
            <div 
              key={hour} 
              data-hour={hour}
              className="grid grid-cols-[90px_1fr] border-b border-[#E5E7EB] last:border-b-0"
              style={{ 
                scrollSnapAlign: 'start',
                height: '76px' // Fixed height for consistent scrolling
              }}
            >
              {/* Time Label - Sticky */}
              <div className="sticky left-0 bg-muted/30 backdrop-blur-sm text-sm font-semibold text-center border-r border-[#E5E7EB] flex items-center justify-center" style={{ padding: '0' }}>
                {formatHour(hour)}
              </div>
              
              {/* Time Slots */}
              <div className="grid grid-rows-2 relative">
                {/* First half hour (XX:00) */}
                <div 
                  className={`
                    relative border-b border-[#E5E7EB] border-r border-[#E5E7EB] transition-colors duration-200
                    ${isCurrentTimeSlot(hour, 'first') ? 'bg-primary/5' : 'hover:bg-muted/30'}
                  `}
                  style={{ height: '38px' }}
                >
                  {isCurrentTimeSlot(hour, 'first') && (
                    <div className="absolute inset-0 bg-primary/10 animate-pulse" />
                  )}
                </div>
                
                {/* Second half hour (XX:30) */}
                <div 
                  className={`
                    relative border-b border-[#E5E7EB] border-r border-[#E5E7EB] transition-colors duration-200
                    ${isCurrentTimeSlot(hour, 'second') ? 'bg-primary/5' : 'hover:bg-muted/30'}
                  `}
                  style={{ height: '38px' }}
                >
                  {isCurrentTimeSlot(hour, 'second') && (
                    <div className="absolute inset-0 bg-primary/10 animate-pulse" />
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {/* Current Time Indicator Line */}
          {currentTimePosition !== null && (
            <div 
              className="absolute left-0 right-0 h-0.5 bg-red-500 z-20 pointer-events-none"
              style={{ 
                top: `${currentTimePosition}px`,
                boxShadow: '0 0 4px rgba(239, 68, 68, 0.5)'
              }}
            >
              <div className="absolute -left-2 -top-1.5 w-3 h-3 bg-red-500 rounded-full" />
              <div className="absolute right-4 -top-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded">
                {format(currentTime, 'h:mm a')}
              </div>
            </div>
          )}
          
          {/* Event and Task Blocks Container */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="relative h-full ml-[90px] pointer-events-auto">
              {timeBlocks.map(block => {
                // Calculate position for each block
                let blockStartHour: number;
                let blockStartMinutes: number;
                let blockEndHour: number;
                let blockEndMinutes: number;
                
                if (block.start.includes('T')) {
                  // ISO datetime
                  const startDate = parseISO(block.start);
                  const endDate = parseISO(block.end);
                  blockStartHour = startDate.getHours();
                  blockStartMinutes = startDate.getMinutes();
                  blockEndHour = endDate.getHours();
                  blockEndMinutes = endDate.getMinutes();
                } else {
                  // HH:mm format
                  [blockStartHour, blockStartMinutes] = block.start.split(':').map(Number);
                  [blockEndHour, blockEndMinutes] = block.end.split(':').map(Number);
                }
                
                // Handle cross-day events (e.g., 11:30 PM to 1:00 AM)
                let adjustedEndHour = blockEndHour;
                if (blockEndHour < blockStartHour) {
                  adjustedEndHour = blockEndHour + 24;
                }
                
                // Calculate positioning (24-hour scale)
                const startTimeInMinutes = blockStartHour * 60 + blockStartMinutes;
                const endTimeInMinutes = adjustedEndHour * 60 + blockEndMinutes;
                const durationInMinutes = endTimeInMinutes - startTimeInMinutes;
                
                // Each hour is 76px
                const pixelsPerMinute = 76 / 60;
                const topOffset = Math.round(startTimeInMinutes * pixelsPerMinute);
                const height = Math.max(Math.round(durationInMinutes * pixelsPerMinute), 20);
                
                return (
                  <div
                    key={block.id}
                    className={`
                      absolute left-2 right-2 rounded-lg p-2 text-xs font-medium
                      border-l-4 shadow-md border border-black/5 transition-all duration-200 hover:shadow-lg
                      ${block.type === 'event' 
                        ? 'bg-blue-200 border-blue-600 text-blue-900' 
                        : 'bg-green-200 border-green-600 text-green-900'
                      }
                    `}
                    style={{
                      top: `${topOffset}px`,
                      height: `${height}px`,
                      zIndex: 10
                    }}
                  >
                    <div className="font-semibold truncate">{block.title}</div>
                    {height > 40 && (
                      <div className="text-xs opacity-75 mt-1">
                        {format(new Date().setHours(blockStartHour, blockStartMinutes, 0, 0), 'h:mm a')} - 
                        {format(new Date().setHours(blockEndHour, blockEndMinutes, 0, 0), 'h:mm a')}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        
        {/* Footer spacer for easier scrolling */}
        <div style={{ height: '100px' }} />
      </div>
      
      {/* Additional children (e.g., action buttons) */}
      {children}
    </div>
  );
};

export default Enhanced24HourTimeline;