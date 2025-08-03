import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";
import { Resend } from "npm:resend@4.0.0";

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
    console.log('Daily reminder cron job started');
    
    // Create Supabase client with service role key for admin access
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // Find users who need daily reminders
    const { data: usersNeedingReminders, error: queryError } = await supabase
      .from('user_preferences')
      .select('user_id, ai_assistant_enabled, reminders_enabled, last_login_date')
      .eq('ai_assistant_enabled', true)
      .eq('reminders_enabled', true)
      .neq('last_login_date', today); // Haven't logged in today

    if (queryError) {
      console.error('Error querying user preferences:', queryError);
      throw queryError;
    }

    console.log(`Found ${usersNeedingReminders?.length || 0} users needing reminders`);

    if (!usersNeedingReminders || usersNeedingReminders.length === 0) {
      return new Response(JSON.stringify({ 
        message: 'No users need reminders today',
        count: 0 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user emails and names
    const userIds = usersNeedingReminders.map(u => u.user_id);
    const { data: users, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      console.error('Error fetching user data:', userError);
      throw userError;
    }

    const emailPromises = [];
    
    for (const userPref of usersNeedingReminders) {
      const user = users.users.find(u => u.id === userPref.user_id);
      if (!user?.email) continue;

      // Check if we already sent a reminder today
      const { data: existingReminder } = await supabase
        .from('daily_reminders')
        .select('id')
        .eq('user_id', userPref.user_id)
        .eq('reminder_date', today)
        .single();

      if (existingReminder) {
        console.log(`Reminder already sent to ${user.email} today`);
        continue;
      }

      // Get user's first name from email
      const getUserName = (email: string) => {
        const emailPrefix = email.split('@')[0];
        return emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1).toLowerCase();
      };

      const userName = getUserName(user.email);
      
      // Send reminder email
      const emailPromise = resend.emails.send({
        from: 'Good Tasking <onboarding@resend.dev>',
        to: [user.email],
        subject: `Good morning, ${userName} 👋 Ready to plan your day?`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #333; font-size: 24px; margin-bottom: 10px;">Good morning, ${userName}! ☀️</h1>
              <p style="color: #666; font-size: 16px; line-height: 1.5;">Your AI assistant is ready with today's summary.</p>
            </div>
            
            <div style="background: #f8f9fa; border-radius: 12px; padding: 24px; margin-bottom: 30px;">
              <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
                <div style="width: 24px; height: 24px; background: #10b981; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                  <span style="color: white; font-size: 14px;">✓</span>
                </div>
                <span style="color: #374151; font-weight: 500;">See your top priority</span>
              </div>
              
              <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
                <div style="width: 24px; height: 24px; background: #10b981; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                  <span style="color: white; font-size: 14px;">✓</span>
                </div>
                <span style="color: #374151; font-weight: 500;">Track your progress</span>
              </div>
              
              <div style="display: flex; align-items: center; gap: 12px;">
                <div style="width: 24px; height: 24px; background: #10b981; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                  <span style="color: white; font-size: 14px;">✓</span>
                </div>
                <span style="color: #374151; font-weight: 500;">Add new tasks with just a sentence</span>
              </div>
            </div>
            
            <div style="text-align: center; margin-bottom: 30px;">
              <a href="https://ychheamigqjpxtnzqina.supabase.co/dashboard?view=today" 
                 style="background: #2563eb; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
                ➡️ View My Day
              </a>
            </div>
            
            <div style="text-align: center; color: #9ca3af; font-size: 14px;">
              <p style="margin: 0;">Make it a focused one,</p>
              <p style="margin: 5px 0 0 0; font-weight: 600;">– Good Tasking</p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                Don't want these reminders? 
                <a href="https://ychheamigqjpxtnzqina.supabase.co/settings" style="color: #2563eb;">Update your preferences</a>
              </p>
            </div>
          </div>
        `,
      });

      emailPromises.push(
        emailPromise.then(async (emailResult) => {
          if (emailResult.error) {
            console.error(`Failed to send email to ${user.email}:`, emailResult.error);
            return { success: false, email: user.email, error: emailResult.error };
          }

          // Record that we sent the reminder
          await supabase
            .from('daily_reminders')
            .insert({
              user_id: userPref.user_id,
              reminder_date: today
            });

          console.log(`Reminder sent successfully to ${user.email}`);
          return { success: true, email: user.email };
        }).catch((error) => {
          console.error(`Error sending email to ${user.email}:`, error);
          return { success: false, email: user.email, error: error.message };
        })
      );
    }

    // Wait for all emails to be sent
    const results = await Promise.all(emailPromises);
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`Daily reminder job completed: ${successful} sent, ${failed} failed`);

    return new Response(JSON.stringify({
      message: 'Daily reminder job completed',
      totalUsers: usersNeedingReminders.length,
      emailsSent: successful,
      emailsFailed: failed,
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in daily-reminder function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      stack: error.stack 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});