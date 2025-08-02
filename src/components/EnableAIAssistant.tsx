import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const EnableAIAssistant = () => {
  const { user, session } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const enableAI = async () => {
      if (!user || !session) return;

      try {
        const { data, error } = await supabase.functions.invoke('enable-ai-assistant', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        if (error) {
          console.error('Error enabling AI assistant:', error);
          return;
        }

        if (data?.success) {
          toast({
            title: "AI Assistant Enabled! 🤖",
            description: "Your AI assistant is now active. Refresh the page to see your daily summary and weekly insights.",
          });
          
          // Refresh the page after a short delay to show the AI features
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        }
      } catch (err) {
        console.error('Error calling enable-ai-assistant:', err);
      }
    };

    enableAI();
  }, [user, session, toast]);

  return null; // This component doesn't render anything
};

export default EnableAIAssistant;