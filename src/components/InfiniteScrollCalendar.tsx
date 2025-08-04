import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { format, addDays, subDays, parseISO, isToday, startOfDay, addHours, addMinutes, isSameDay } from 'date-fns';
import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';

interface TimeBlock {
  id: string;
  title: string;
  start: string;
  end: string;
  type: 'event' | 'task';
  color?: string;
  priority?: string;
  taskId?: string;
}

interface InfiniteScrollCalendarProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  timeBlocks: TimeBlock[];
  onDrop?: (hour: number, period: 'first' | 'second', item: any) => void;
  children?: React.ReactNode;
}

// Configuration
const HOUR_HEIGHT = 76; // Height per hour (38px * 2 for two 30-min slots)
const HOURS_PER_DAY = 24;
const INITIAL_DAYS_BUFFER = 7; // Show 7 days initially (3 before, current, 3 after)
const TOTAL_VIRTUAL_HOURS = INITIAL_DAYS_BUFFER * HOURS_PER_DAY; // Total virtual hours

const InfiniteScrollCalendar = ({ 
  selectedDate, 
  onDateChange, 
  timeBlocks, 
  onDrop,
  children 
}: InfiniteScrollCalendarProps) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [visibleDate, setVisibleDate] = useState(selectedDate);
  const [baseDate, setBaseDate] = useState(() => subDays(new Date(selectedDate), 3)); // Start 3 days before selected

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Calculate virtual items (each representing a half-hour slot)
  const virtualItems = useMemo(() => {
    const items: Array<{
      index: number;
      date: Date;
      hour: number;
      period: 'first' | 'second';
      dateString: string;
    }> = [];

    for (let dayIndex = 0; dayIndex < INITIAL_DAYS_BUFFER; dayIndex++) {
      const currentDay = addDays(baseDate, dayIndex);
      const dateString = format(currentDay, 'yyyy-MM-dd');
      
      for (let hour = 0; hour < HOURS_PER_DAY; hour++) {
        // First half hour (XX:00)
        items.push({
          index: dayIndex * HOURS_PER_DAY * 2 + hour * 2,
          date: currentDay,
          hour,
          period: 'first',
          dateString
        });
        
        // Second half hour (XX:30)
        items.push({
          index: dayIndex * HOURS_PER_DAY * 2 + hour * 2 + 1,
          date: currentDay,
          hour,
          period: 'second',
          dateString
        });
      }
    }
    return items;
  }, [baseDate]);

  // Virtual scrolling setup
  const virtualizer = useVirtualizer({
    count: virtualItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => HOUR_HEIGHT / 2, // Half-hour slot height
    overscan: 10,
  });

  // Handle visible date changes based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      const items = virtualizer.getVirtualItems();
      if (items.length > 0) {
        const firstVisibleItem = items[Math.floor(items.length / 3)]; // Middle visible item
        if (firstVisibleItem) {
          const virtualItem = virtualItems[firstVisibleItem.index];
          if (virtualItem && virtualItem.dateString !== visibleDate) {
            setVisibleDate(virtualItem.dateString);
            onDateChange(virtualItem.dateString);
          }
        }
      }
    };

    const scrollElement = parentRef.current;
    if (scrollElement) {
      scrollElement.addEventListener('scroll', handleScroll);
      return () => scrollElement.removeEventListener('scroll', handleScroll);
    }
  }, [virtualizer, virtualItems, visibleDate, onDateChange]);

  // Auto-scroll to current time on mount
  useEffect(() => {
    if (isToday(new Date(selectedDate))) {
      const currentHour = new Date().getHours();
      const currentMinutes = new Date().getMinutes();
      
      // Find the index for current time
      const dayOffset = 3; // baseDate is 3 days before selectedDate
      const hourIndex = dayOffset * HOURS_PER_DAY * 2 + currentHour * 2 + (currentMinutes >= 30 ? 1 : 0);
      
      setTimeout(() => {
        virtualizer.scrollToIndex(hourIndex, { align: 'center' });
      }, 100);
    }
  }, [selectedDate, virtualizer]);

  // Format hour for display
  const formatHour = (hour: number) => {
    if (hour === 0) return '12:00 AM';
    if (hour === 12) return '12:00 PM';
    if (hour < 12) return `${hour}:00 AM`;
    return `${hour - 12}:00 PM`;
  };

  // Check if current time slot is active
  const isCurrentTimeSlot = (date: Date, hour: number, period: 'first' | 'second') => {
    if (!isToday(date)) return false;
    
    const currentHour = currentTime.getHours();
    const currentMinutes = currentTime.getMinutes();
    
    if (hour !== currentHour) return false;
    
    return period === 'first' ? currentMinutes < 30 : currentMinutes >= 30;
  };

  // Get current time position for the red line indicator
  const getCurrentTimePosition = () => {
    if (!isToday(new Date(visibleDate))) return null;
    
    const currentHour = currentTime.getHours();
    const currentMinutes = currentTime.getMinutes();
    
    // Find the current day in virtual items
    const todayItems = virtualItems.filter(item => isToday(item.date));
    if (todayItems.length === 0) return null;
    
    const currentHourFirstHalf = todayItems.find(item => 
      item.hour === currentHour && item.period === 'first'
    );
    
    if (!currentHourFirstHalf) return null;
    
    const basePosition = currentHourFirstHalf.index * (HOUR_HEIGHT / 2);
    const minuteOffset = (currentMinutes / 60) * HOUR_HEIGHT;
    
    return basePosition + minuteOffset;
  };

  const currentTimePosition = getCurrentTimePosition();

  // Render time blocks for each virtual item
  const renderTimeBlocks = (virtualItem: typeof virtualItems[0]) => {
    const dayBlocks = timeBlocks.filter(block => {
      // Match blocks to this specific date
      if (block.start.includes('T')) {
        const blockDate = parseISO(block.start);
        return isSameDay(blockDate, virtualItem.date);
      }
      return false;
    });

    return dayBlocks.map(block => {
      // Calculate position for each block
      let blockStartHour: number;
      let blockStartMinutes: number;
      let blockEndHour: number;
      let blockEndMinutes: number;
      
      if (block.start.includes('T')) {
        const startDate = parseISO(block.start);
        const endDate = parseISO(block.end);
        blockStartHour = startDate.getHours();
        blockStartMinutes = startDate.getMinutes();
        blockEndHour = endDate.getHours();
        blockEndMinutes = endDate.getMinutes();
      } else {
        [blockStartHour, blockStartMinutes] = block.start.split(':').map(Number);
        [blockEndHour, blockEndMinutes] = block.end.split(':').map(Number);
      }
      
      // Calculate if this block overlaps with current virtual item
      const itemStartMinutes = virtualItem.hour * 60 + (virtualItem.period === 'second' ? 30 : 0);
      const itemEndMinutes = itemStartMinutes + 30;
      const blockStartTotalMinutes = blockStartHour * 60 + blockStartMinutes;
      const blockEndTotalMinutes = blockEndHour * 60 + blockEndMinutes;
      
      // Check if block overlaps with this 30-minute slot
      if (blockEndTotalMinutes <= itemStartMinutes || blockStartTotalMinutes >= itemEndMinutes) {
        return null; // No overlap
      }
      
      // Calculate relative position within this slot
      const overlapStart = Math.max(blockStartTotalMinutes, itemStartMinutes);
      const overlapEnd = Math.min(blockEndTotalMinutes, itemEndMinutes);
      const overlapDuration = overlapEnd - overlapStart;
      
      if (overlapDuration <= 0) return null;
      
      const relativeStart = overlapStart - itemStartMinutes;
      const relativeHeight = (overlapDuration / 30) * (HOUR_HEIGHT / 2);
      const relativeTop = (relativeStart / 30) * (HOUR_HEIGHT / 2);
      
      return (
        <div
          key={`${block.id}-${virtualItem.index}`}
          className={`
            absolute left-2 right-2 rounded-lg p-2 text-xs font-medium
            border-l-4 shadow-md border border-black/5 transition-all duration-200 hover:shadow-lg
            ${block.type === 'event' 
              ? 'bg-blue-200 border-blue-600 text-blue-900' 
              : 'bg-green-200 border-green-600 text-green-900'
            }
          `}
          style={{
            top: `${relativeTop}px`,
            height: `${relativeHeight}px`,
            zIndex: 10
          }}
        >
          <div className="font-semibold truncate">{block.title}</div>
          {relativeHeight > 25 && (
            <div className="text-xs opacity-75 mt-1">
              {format(new Date().setHours(blockStartHour, blockStartMinutes, 0, 0), 'h:mm a')}
            </div>
          )}
        </div>
      );
    }).filter(Boolean);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Fixed Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const prevDay = subDays(new Date(visibleDate), 1);
                const prevDateStr = format(prevDay, 'yyyy-MM-dd');
                setVisibleDate(prevDateStr);
                onDateChange(prevDateStr);
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Previous day"
            >
              ←
            </button>
            <h2 className="text-lg font-semibold min-w-[200px] text-center">
              {(() => {
                const date = new Date(visibleDate);
                const dayName = format(date, 'EEEE');
                const monthDay = format(date, 'MMMM d');
                
                if (isToday(date)) {
                  return `Today, ${monthDay}`;
                }
                return `${dayName}, ${monthDay}`;
              })()}
            </h2>
            <button
              onClick={() => {
                const nextDay = addDays(new Date(visibleDate), 1);
                const nextDateStr = format(nextDay, 'yyyy-MM-dd');
                setVisibleDate(nextDateStr);
                onDateChange(nextDateStr);
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Next day"
            >
              →
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const today = format(new Date(), 'yyyy-MM-dd');
                setVisibleDate(today);
                onDateChange(today);
              }}
              className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Today
            </button>
          </div>
        </div>
      </div>
      
      {/* Infinite Scrollable Timeline */}
      <div 
        ref={parentRef}
        className="flex-1 overflow-auto"
        style={{ 
          scrollBehavior: 'smooth' 
        }}
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualizer.getVirtualItems().map((virtualItem) => {
            const item = virtualItems[virtualItem.index];
            if (!item) return null;
            
            const isHourStart = item.period === 'first';
            
            return (
              <div
                key={virtualItem.index}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                <div className={cn(
                  "grid grid-cols-[90px_1fr] h-full border-t",
                  "border-timeline-gray", // Good Business timeline gray
                  // Add subtle alternating backgrounds for better visual hierarchy
                  Math.floor(item.hour / 2) % 2 === 0 ? "bg-off-white/50" : "bg-white"
                )}>
                  {/* Time Label - Navy styled headers */}
                  {isHourStart && (
                    <div className="sticky left-0 bg-navy-blue text-white text-sm font-bold text-center border-r-2 border-timeline-gray flex items-center justify-center row-span-2"
                         style={{ height: `${HOUR_HEIGHT}px` }}>
                      {formatHour(item.hour)}
                    </div>
                  )}
                  {!isHourStart && (
                    <div className="border-r-2 border-timeline-gray bg-navy-blue"></div>
                  )}
                  
                  {/* Time Slot with Good Business styling */}
                  <div 
                    className={cn(
                      "relative border-r transition-all duration-200 px-2 py-1",
                      "border-timeline-gray", // Timeline gray borders
                      isCurrentTimeSlot(item.date, item.hour, item.period) 
                        ? 'bg-forest-green/10 ring-1 ring-current-time-green/30' 
                        : 'hover:bg-forest-green/5',
                      item.period === 'second' ? 'border-b border-timeline-gray' : '',
                      "min-h-[40px]" // Increased padding for better visual hierarchy
                    )}
                  >
                    {isCurrentTimeSlot(item.date, item.hour, item.period) && (
                      <div className="absolute inset-0 bg-current-time-green/10 animate-pulse border border-current-time-green/20 rounded-sm" />
                    )}
                    
                    {/* Render time blocks for this slot with enhanced Good Business cards */}
                    {renderTimeBlocks(item)}
                  </div>
                </div>
              </div>
            );
          })}
          
          {/* Current Time Indicator Line - Good Business Green */}
          {currentTimePosition !== null && (
            <div 
              className="absolute left-0 right-0 h-0.5 bg-current-time-green z-20 pointer-events-none"
              style={{ 
                top: `${currentTimePosition}px`,
                boxShadow: '0 0 4px rgba(39, 174, 96, 0.5)'
              }}
            >
              <div className="absolute -left-2 -top-1.5 w-3 h-3 bg-current-time-green rounded-full" />
              <div className="absolute right-4 -top-2 bg-current-time-green text-white text-xs px-2 py-0.5 rounded">
                {format(currentTime, 'h:mm a')}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Additional children (e.g., action buttons) */}
      {children}
    </div>
  );
};

export default InfiniteScrollCalendar;