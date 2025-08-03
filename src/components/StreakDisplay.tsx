import { useStreaks } from '@/hooks/useStreaks';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Flame, Trophy, Target, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StreakDisplayProps {
  className?: string;
  compact?: boolean;
}

const StreakDisplay = ({ className, compact = false }: StreakDisplayProps) => {
  const { streakData, loading } = useStreaks();

  if (loading || !streakData.streakTrackingEnabled) {
    return null;
  }

  const getStreakEmoji = (streak: number) => {
    if (streak === 0) return '💪';
    if (streak < 3) return '🔥';
    if (streak < 7) return '🚀';
    if (streak < 14) return '⭐';
    if (streak < 30) return '💎';
    if (streak < 50) return '🏆';
    if (streak < 100) return '👑';
    return '🌟';
  };

  const getStreakMessage = (streak: number) => {
    if (streak === 0) return "Let's start a new streak today";
    if (streak === 1) return "Great start! Keep it going";
    if (streak < 3) return "Building momentum";
    if (streak < 7) return "You're on a roll!";
    if (streak < 14) return "Incredible consistency!";
    if (streak < 30) return "Absolutely crushing it!";
    return "Legendary streak!";
  };

  const getStreakColor = (streak: number) => {
    if (streak === 0) return 'text-muted-foreground';
    if (streak < 3) return 'text-orange-600';
    if (streak < 7) return 'text-red-500';
    if (streak < 14) return 'text-blue-500';
    if (streak < 30) return 'text-purple-600';
    return 'text-yellow-500';
  };

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className="flex items-center gap-1">
          <span className="text-lg">{getStreakEmoji(streakData.currentStreak)}</span>
          <span className={cn("font-semibold", getStreakColor(streakData.currentStreak))}>
            {streakData.currentStreak}
          </span>
          <span className="text-sm text-muted-foreground">day streak</span>
        </div>
        {streakData.longestStreak > streakData.currentStreak && (
          <Badge variant="outline" className="text-xs">
            <Trophy className="h-3 w-3 mr-1" />
            Best: {streakData.longestStreak}
          </Badge>
        )}
      </div>
    );
  }

  return (
    <Card className={cn("bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20", className)}>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Current Streak */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{getStreakEmoji(streakData.currentStreak)}</span>
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className={cn("text-2xl font-bold", getStreakColor(streakData.currentStreak))}>
                      {streakData.currentStreak}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      day{streakData.currentStreak !== 1 ? 's' : ''} streak
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {getStreakMessage(streakData.currentStreak)}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Longest Streak Badge */}
            {streakData.longestStreak > 0 && (
              <Badge variant="outline" className="bg-background/50">
                <Trophy className="h-3 w-3 mr-1" />
                Longest: {streakData.longestStreak} day{streakData.longestStreak !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>

          {/* Progress Visualization */}
          {streakData.currentStreak > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Progress to next milestone</span>
                <span>{getNextMilestone(streakData.currentStreak) - streakData.currentStreak} days to go</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-primary to-primary/80 h-2 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${(streakData.currentStreak / getNextMilestone(streakData.currentStreak)) * 100}%` 
                  }}
                />
              </div>
            </div>
          )}

          {/* Weekly Calendar Preview */}
          <div className="flex items-center gap-1 pt-2">
            <Calendar className="h-3 w-3 text-muted-foreground mr-1" />
            <div className="flex gap-1">
              {getLastSevenDays().map((date, index) => {
                const isCheckedIn = streakData.checkInDates.includes(date);
                const isToday = date === new Date().toISOString().split('T')[0];
                return (
                  <div
                    key={index}
                    className={cn(
                      "w-2 h-2 rounded-full",
                      isCheckedIn ? "bg-primary" : "bg-muted",
                      isToday && "ring-2 ring-primary ring-offset-1"
                    )}
                    title={`${date}${isCheckedIn ? ' - Checked in' : ' - No activity'}`}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const getNextMilestone = (current: number) => {
  const milestones = [3, 5, 7, 10, 14, 21, 30, 50, 100];
  return milestones.find(m => m > current) || current + 10;
};

const getLastSevenDays = () => {
  const dates = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    dates.push(date.toISOString().split('T')[0]);
  }
  return dates;
};

export default StreakDisplay;