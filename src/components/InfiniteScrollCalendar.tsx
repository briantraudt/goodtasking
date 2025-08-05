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

// Enhanced configuration for Good Business styling
const HOUR_HEIGHT = 80;
const HOURS_PER_DAY = 24;
const DAYS_BUFFER = 60; // Increased buffer for smooth infinite scroll
const SLOT_HEIGHT = HOUR_HEIGHT / 2;
const TIME_COLUMN_WIDTH = 160; // Increased for better time visibility

const InfiniteScrollCalendar = ({ 
  selectedDate, 
  onDateChange, 
  timeBlocks, 
  onDrop,
  children 
}: InfiniteScrollCalendarProps) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isScrolling, setIsScrolling] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  
  // Center around actual today
  const baseDate = useMemo(() => {
    const today = new Date();
    return subDays(today, DAYS_BUFFER);
  }, []);

  // Update current time every minute for live time indicator
  useEffect(() => {
    const updateTime = () => setCurrentTime(new Date());
    updateTime();
    const interval = setInterval(updateTime, 60000);
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

    for (let dayIndex = 0; dayIndex < DAYS_BUFFER * 2; dayIndex++) {
      const currentDay = addDays(baseDate, dayIndex);
      const dateString = format(currentDay, 'yyyy-MM-dd');
      
      for (let hour = 0; hour < HOURS_PER_DAY; hour++) {
        items.push({
          index: dayIndex * HOURS_PER_DAY * 2 + hour * 2,
          date: currentDay,
          hour,
          period: 'first',
          dateString
        });
        
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

  // Enhanced virtual scrolling setup
  const virtualizer = useVirtualizer({
    count: virtualItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => SLOT_HEIGHT,
    overscan: 20, // Increased overscan for smoother scrolling
  });

  // FIXED: Scroll to selected date without snapping back - with initialization tracking
  useEffect(() => {
    if (!virtualItems.length) return;
    
    const selectedDay = new Date(selectedDate);
    const daysDiff = Math.floor((selectedDay.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff >= 0 && daysDiff < DAYS_BUFFER * 2) {
      // Scroll to 8 AM for better viewing, or current hour if today
      const hourToShow = isToday(selectedDay) ? Math.max(8, new Date().getHours() - 2) : 8;
      const indexToScroll = daysDiff * HOURS_PER_DAY * 2 + hourToShow * 2;
      
      // Use requestAnimationFrame for smooth scrolling
      requestAnimationFrame(() => {
        virtualizer.scrollToIndex(indexToScroll, { 
          align: 'start',
          behavior: isInitializing ? 'auto' : 'smooth'
        });
        
        // Mark initialization as complete after first scroll
        if (isInitializing) {
          setTimeout(() => setIsInitializing(false), 500);
        }
      });
    }
  }, [selectedDate, baseDate, virtualItems.length, virtualizer, isInitializing]);

  // FIXED: Handle visible date changes with debouncing - only after initialization
  useEffect(() => {
    if (isScrolling || isInitializing) return;
    
    const handleScroll = () => {
      const items = virtualizer.getVirtualItems();
      if (items.length === 0) return;
      
      // Use middle visible item for date detection
      const middleIndex = Math.floor(items.length / 2);
      const middleItem = items[middleIndex];
      
      if (middleItem) {
        const virtualItem = virtualItems[middleItem.index];
        if (virtualItem && virtualItem.dateString !== selectedDate) {
          // Debounce date changes to prevent rapid updates
          setTimeout(() => {
            if (!isScrolling && !isInitializing) {
              onDateChange(virtualItem.dateString);
            }
          }, 150);
        }
      }
    };

    const scrollElement = parentRef.current;
    if (scrollElement) {
      scrollElement.addEventListener('scroll', handleScroll, { passive: true });
      return () => scrollElement.removeEventListener('scroll', handleScroll);
    }
  }, [virtualizer, virtualItems, selectedDate, onDateChange, isScrolling, isInitializing]);

  // Enhanced format hour for Good Business styling
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

  // Enhanced current time position calculation
  const getCurrentTimePosition = () => {
    if (!isToday(new Date(selectedDate))) return null;
    
    const currentHour = currentTime.getHours();
    const currentMinutes = currentTime.getMinutes();
    
    // Find the current day in virtual items
    const todayItems = virtualItems.filter(item => isToday(item.date));
    if (todayItems.length === 0) return null;
    
    const currentHourFirstHalf = todayItems.find(item => 
      item.hour === currentHour && item.period === 'first'
    );
    
    if (!currentHourFirstHalf) return null;
    
    // Get virtual item for positioning
    const virtualItem = virtualizer.getVirtualItems().find(vi => 
      virtualItems[vi.index]?.index === currentHourFirstHalf.index
    );
    
    if (!virtualItem) return null;
    
    const minuteOffset = (currentMinutes / 60) * HOUR_HEIGHT;
    return virtualItem.start + minuteOffset;
  };

  const currentTimePosition = getCurrentTimePosition();

  // Enhanced time blocks rendering with Google Calendar integration
  const renderTimeBlocks = (virtualItem: typeof virtualItems[0]) => {
    const dayBlocks = timeBlocks.filter(block => {
      if (block.start.includes('T')) {
        const blockDate = parseISO(block.start);
        return isSameDay(blockDate, virtualItem.date);
      }
      return false;
    });

    return dayBlocks.map(block => {
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
      
      // Calculate overlap with current slot
      const itemStartMinutes = virtualItem.hour * 60 + (virtualItem.period === 'second' ? 30 : 0);
      const itemEndMinutes = itemStartMinutes + 30;
      const blockStartTotalMinutes = blockStartHour * 60 + blockStartMinutes;
      const blockEndTotalMinutes = blockEndHour * 60 + blockEndMinutes;
      
      if (blockEndTotalMinutes <= itemStartMinutes || blockStartTotalMinutes >= itemEndMinutes) {
        return null;
      }
      
      const overlapStart = Math.max(blockStartTotalMinutes, itemStartMinutes);
      const overlapEnd = Math.min(blockEndTotalMinutes, itemEndMinutes);
      const overlapDuration = overlapEnd - overlapStart;
      
      if (overlapDuration <= 0) return null;
      
      const relativeStart = overlapStart - itemStartMinutes;
      const relativeHeight = (overlapDuration / 30) * SLOT_HEIGHT;
      const relativeTop = (relativeStart / 30) * SLOT_HEIGHT;
      
      return (
        <div
          key={`${block.id}-${virtualItem.index}`}
          className={cn(
            "absolute left-2 right-2 rounded-lg p-2 text-xs font-semibold",
            "border-l-4 shadow-card transition-all duration-200 hover:shadow-elevated hover:scale-[1.02]",
            block.type === 'event' 
              ? 'bg-blue-50 border-blue-600 text-blue-900 hover:bg-blue-100' 
              : 'bg-green-50 border-green-600 text-green-900 hover:bg-green-100'
          )}
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

  // Handle scroll start/end for debouncing
  const handleScrollStart = useCallback(() => {
    setIsScrolling(true);
  }, []);

  const handleScrollEnd = useCallback(() => {
    setTimeout(() => setIsScrolling(false), 150);
  }, []);

  useEffect(() => {
    const scrollElement = parentRef.current;
    if (!scrollElement) return;

    scrollElement.addEventListener('scrollstart', handleScrollStart, { passive: true });
    scrollElement.addEventListener('scrollend', handleScrollEnd, { passive: true });
    
    // Fallback for browsers without scrollend
    let scrollTimeout: NodeJS.Timeout;
    const handleScroll = () => {
      if (!isScrolling) setIsScrolling(true);
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => setIsScrolling(false), 150);
    };
    
    scrollElement.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      scrollElement.removeEventListener('scrollstart', handleScrollStart);
      scrollElement.removeEventListener('scrollend', handleScrollEnd);
      scrollElement.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [handleScrollStart, handleScrollEnd, isScrolling]);

  return (
    <div className="flex flex-col h-full">
      {/* Enhanced Infinite Scrollable Timeline with Good Business styling */}
      <div 
        ref={parentRef}
        className="flex-1 overflow-auto bg-white rounded-lg border border-border shadow-card"
        style={{ 
          scrollBehavior: 'smooth',
          scrollbarWidth: 'thin',
          scrollbarColor: 'hsl(var(--border)) transparent'
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
                  "h-full border-t border-border",
                  // Enhanced alternating backgrounds for better visual hierarchy
                  Math.floor(item.hour / 2) % 2 === 0 ? "bg-off-white/20" : "bg-white"
                )} style={{ display: 'grid', gridTemplateColumns: `${TIME_COLUMN_WIDTH}px 1fr` }}>
                  
                  {/* Enhanced Time Label with Good Business Navy Styling */}
                  {isHourStart && (
                    <div 
                      className="border-r-2 border-border flex items-center justify-center font-bold text-white"
                      style={{ 
                        height: `${HOUR_HEIGHT}px`,
                        backgroundColor: '#172A45', // Good Business navy
                        fontSize: '16px',
                        fontWeight: '700',
                        textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                        position: 'sticky',
                        left: 0,
                        zIndex: 5,
                        paddingLeft: '12px',
                        lineHeight: '1.75rem'
                      }}
                    >
                      <span className="text-white font-semibold">
                        {formatHour(item.hour)}
                      </span>
                    </div>
                  )}
                  {!isHourStart && (
                    <div 
                      className="border-r-2 border-border"
                      style={{ 
                        backgroundColor: '#172A45',
                        position: 'sticky',
                        left: 0,
                        zIndex: 5
                      }}
                    />
                  )}
                  
                  {/* Enhanced Time Slot with proper half-hour grid lines and alternating backgrounds */}
                  <div 
                    className={cn(
                      "relative transition-all duration-200 px-3 py-2",
                      "border-r border-border hover:bg-forest-green/5",
                      // Alternating backgrounds for better hour scanning  
                      item.hour % 2 === 0 ? "bg-gray-50/50" : "bg-white",
                      // Enhanced border system for half-hour visibility
                      item.period === 'second' 
                        ? 'border-b-2 border-border' 
                        : 'border-b border-border/40',
                      isCurrentTimeSlot(item.date, item.hour, item.period) 
                        ? 'ring-2 ring-current-time-green/50 bg-current-time-green/10' 
                        : '',
                      "min-h-[40px]"
                    )}
                  >
                    {/* Enhanced current time indicator */}
                    {isCurrentTimeSlot(item.date, item.hour, item.period) && (
                      <div className="absolute inset-0 bg-current-time-green/10 animate-pulse border border-current-time-green/30 rounded-sm" />
                    )}
                    
                    {/* Render time blocks for this slot */}
                    {renderTimeBlocks(item)}
                  </div>
                </div>
              </div>
            );
          })}
          
          {/* Enhanced Current Time Indicator Line with Good Business styling */}
          {currentTimePosition !== null && (
            <div 
              className="absolute left-0 right-0 h-0.5 z-20 pointer-events-none"
              style={{ 
                top: `${currentTimePosition}px`,
                backgroundColor: 'hsl(var(--current-time-green))',
                boxShadow: '0 0 8px hsl(var(--current-time-green) / 0.6)'
              }}
            >
              <div 
                className="absolute w-3 h-3 rounded-full ring-2 ring-white"
                style={{ 
                  left: `${TIME_COLUMN_WIDTH - 6}px`,
                  top: '-6px',
                  backgroundColor: 'hsl(var(--current-time-green))'
                }}
              />
              <div 
                className="absolute right-4 -top-3 text-white text-xs px-3 py-1 rounded-full font-bold shadow-sm"
                style={{ backgroundColor: 'hsl(var(--current-time-green))' }}
              >
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