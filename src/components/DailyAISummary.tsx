import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Sparkles, TrendingUp, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

interface DailySummaryData {
  summary: string;
  cached: boolean;
  taskCount: number;
  completionRate: number;
  generatedAt: string;
}

const DailyAISummary = () => {
  const { user, session } = useAuth();
  const [summaryData, setSummaryData] = useState<DailySummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  const fetchSummary = async (forceRefresh = false) => {
    if (!user) return;

    try {
      setError(null);
      if (forceRefresh) setRefreshing(true);
      else setLoading(true);

      const { data, error } = await supabase.functions.invoke('generate-daily-summary', {
        body: { forceRefresh },
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
      });

      if (error) {
        console.error('Error fetching summary:', error);
        setError('Failed to generate daily summary');
        return;
      }

      if (data?.summary) {
        setSummaryData({
          summary: data.summary,
          cached: data.cached || false,
          taskCount: data.taskCount || 0,
          completionRate: data.completionRate || 0,
          generatedAt: data.generatedAt
        });
      } else if (data?.message) {
        // AI assistant is not enabled
        setSummaryData(null);
      }
    } catch (err) {
      console.error('Error in fetchSummary:', err);
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

  useEffect(() => {
    if (aiEnabled) {
      fetchSummary();
    } else {
      setLoading(false);
    }
  }, [aiEnabled, user]);

  const handleRefresh = () => {
    fetchSummary(true);
  };

  const getMotivationalEmoji = (completionRate: number) => {
    if (completionRate >= 80) return '🚀';
    if (completionRate >= 60) return '💪';
    if (completionRate >= 40) return '👊';
    return '✨';
  };

  const getCompletionBadgeColor = (rate: number) => {
    if (rate >= 80) return 'bg-green-100 text-green-800 border-green-200';
    if (rate >= 60) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (rate >= 40) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // Don't render if AI is not enabled or if loading initial state
  if (aiEnabled === false) return null;
  if (loading && !summaryData) return null;

  return (
    <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Today's Focus {summaryData && getMotivationalEmoji(summaryData.completionRate)}
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {summaryData && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {format(new Date(), 'MMM d')}
              </div>
            )}
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
              onClick={() => fetchSummary()} 
              className="ml-2 h-auto p-0 text-destructive"
            >
              Retry
            </Button>
          </div>
        ) : summaryData ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-700 leading-relaxed">
              {summaryData.summary}
            </p>
            
            <div className="flex items-center gap-2 pt-2">
              <Badge variant="outline" className={getCompletionBadgeColor(summaryData.completionRate)}>
                <TrendingUp className="h-3 w-3 mr-1" />
                {summaryData.completionRate}% completion rate
              </Badge>
              
              <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
                {summaryData.taskCount} tasks today
              </Badge>
              
              {summaryData.cached && (
                <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-200">
                  Cached
                </Badge>
              )}
            </div>
            
            {summaryData.generatedAt && (
              <p className="text-xs text-muted-foreground mt-2">
                Generated {format(new Date(summaryData.generatedAt), 'h:mm a')}
              </p>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DailyAISummary;