import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RefreshCw, BarChart3, Award, Target, Calendar, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, startOfWeek, endOfWeek, getWeek } from 'date-fns';

interface WeeklyStats {
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  topProject: string;
  projectDistribution: { [key: string]: number };
  scheduledTasks: number;
  unscheduledTasks: number;
  streakDays: number;
}

interface WeeklyReviewData {
  review: string;
  stats: WeeklyStats;
  cached: boolean;
  weekKey: string;
  generatedAt: string;
}

const WeeklyAIReview = () => {
  const { user, session } = useAuth();
  const [reviewData, setReviewData] = useState<WeeklyReviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showReview, setShowReview] = useState(false);
  const [aiEnabled, setAiEnabled] = useState<boolean | null>(null);

  // Check if user has AI assistant enabled
  const checkAIEnabled = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('ai_assistant_enabled')
        .eq('user_id', user.id)
        .single();
      
      if (error) {
        console.error('Error checking AI enabled status:', error);
        setAiEnabled(false);
        return;
      }
      
      setAiEnabled(data?.ai_assistant_enabled || false);
    } catch (err) {
      console.error('Error in checkAIEnabled:', err);
      setAiEnabled(false);
    }
  };

  const fetchWeeklyReview = async (forceRefresh = false) => {
    if (!user || aiEnabled === false) return;

    try {
      setError(null);
      if (forceRefresh) setRefreshing(true);
      else setLoading(true);

      const { data, error } = await supabase.functions.invoke('generate-weekly-review', {
        body: { forceRefresh },
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
      });

      if (error) {
        console.error('Error fetching weekly review:', error);
        setError('Failed to generate weekly review');
        return;
      }

      if (data?.review) {
        setReviewData({
          review: data.review,
          stats: data.stats,
          cached: data.cached || false,
          weekKey: data.weekKey,
          generatedAt: data.generatedAt
        });
      }
    } catch (err) {
      console.error('Error in fetchWeeklyReview:', err);
      setError('Unable to connect to AI assistant');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user) {
      checkAIEnabled();
    }
  }, [user]);

  // Check if it's Sunday or if user wants to see the review
  const shouldShowReview = () => {
    const today = new Date();
    const isSunday = today.getDay() === 0;
    return isSunday || showReview;
  };

  useEffect(() => {
    if (aiEnabled && shouldShowReview()) {
      fetchWeeklyReview();
    }
  }, [aiEnabled, user, showReview]);

  const handleRefresh = () => {
    fetchWeeklyReview(true);
  };

  const handleShowReview = () => {
    setShowReview(true);
    if (!reviewData) {
      fetchWeeklyReview();
    }
  };

  const getStreakEmoji = (days: number) => {
    if (days >= 7) return '🔥';
    if (days >= 5) return '⚡';
    if (days >= 3) return '💪';
    return '🎯';
  };

  const getCompletionColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600';
    if (rate >= 60) return 'text-blue-600';
    if (rate >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Don't render if AI is not enabled
  if (aiEnabled === false) return null;

  // Show "View Weekly Review" button if not Sunday and not already showing
  if (!shouldShowReview()) {
    return (
      <div className="mb-6">
        <Button 
          variant="outline" 
          onClick={handleShowReview}
          className="w-full sm:w-auto"
          disabled={loading}
        >
          <BarChart3 className="h-4 w-4 mr-2" />
          View Weekly Review
        </Button>
      </div>
    );
  }

  // Don't render if loading and no data yet
  if (loading && !reviewData) return null;

  return (
    <Card className="mb-6 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
              <Award className="h-4 w-4 text-white" />
            </div>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Your Weekly Review {reviewData?.stats && getStreakEmoji(reviewData.stats.streakDays)}
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {error ? (
          <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
            {error}
            <Button 
              variant="link" 
              size="sm" 
              onClick={() => fetchWeeklyReview()} 
              className="ml-2 h-auto p-0 text-destructive"
            >
              Retry
            </Button>
          </div>
        ) : reviewData ? (
          <div className="space-y-4">
            {/* AI Review Text */}
            <p className="text-sm text-gray-700 leading-relaxed">
              {reviewData.review}
            </p>
            
            {/* Stats Section */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="text-center p-3 bg-white/50 rounded-lg">
                <div className={`text-lg font-bold ${getCompletionColor(reviewData.stats.completionRate)}`}>
                  {reviewData.stats.completionRate}%
                </div>
                <div className="text-xs text-muted-foreground">Completed</div>
              </div>
              
              <div className="text-center p-3 bg-white/50 rounded-lg">
                <div className="text-lg font-bold text-blue-600">
                  {reviewData.stats.totalTasks}
                </div>
                <div className="text-xs text-muted-foreground">Total Tasks</div>
              </div>
              
              <div className="text-center p-3 bg-white/50 rounded-lg">
                <div className="text-lg font-bold text-purple-600">
                  {reviewData.stats.streakDays}
                </div>
                <div className="text-xs text-muted-foreground">Day Streak</div>
              </div>
              
              <div className="text-center p-3 bg-white/50 rounded-lg">
                <div className="text-lg font-bold text-green-600">
                  {Math.round((reviewData.stats.scheduledTasks / Math.max(reviewData.stats.totalTasks, 1)) * 100)}%
                </div>
                <div className="text-xs text-muted-foreground">Scheduled</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Weekly Progress</span>
                <span>{reviewData.stats.completedTasks}/{reviewData.stats.totalTasks} tasks</span>
              </div>
              <Progress 
                value={reviewData.stats.completionRate} 
                className="h-2"
              />
            </div>
            
            {/* Badges */}
            <div className="flex flex-wrap gap-2 pt-2">
              <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
                <Target className="h-3 w-3 mr-1" />
                Top: {reviewData.stats.topProject}
              </Badge>
              
              {reviewData.stats.streakDays > 0 && (
                <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200">
                  🔥 {reviewData.stats.streakDays} day streak
                </Badge>
              )}
              
              {reviewData.cached && (
                <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-200">
                  Cached
                </Badge>
              )}
            </div>
            
            {/* Week Range */}
            {reviewData.generatedAt && (
              <p className="text-xs text-muted-foreground mt-2">
                Week of {format(startOfWeek(new Date()), 'MMM d')} - {format(endOfWeek(new Date()), 'MMM d')} • 
                Generated {format(new Date(reviewData.generatedAt), 'h:mm a')}
              </p>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WeeklyAIReview;