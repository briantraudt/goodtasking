import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
        global: {
          headers: {
            Authorization: req.headers.get('Authorization') || '',
          },
        },
      }
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(jwt);

    if (userError || !user) {
      throw new Error('Invalid user');
    }

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const { rawIdea, currentTitle } = await req.json();

    if (!rawIdea || typeof rawIdea !== 'string') {
      throw new Error('rawIdea is required');
    }

    const prompt = `You are helping a solo software builder turn an early product idea into a launchable project.

Return only valid JSON in this exact shape:
{
  "title": "short project title",
  "distilledSummary": "2-4 sentence crisp product summary",
  "gtmStrategy": "1-2 short paragraphs describing target user, positioning, acquisition approach, and first traction plan",
  "launchNeeds": ["string", "string", "string"],
  "launchChecklist": ["string", "string", "string"],
  "suggestedTechStack": ["string", "string", "string"]
}

Rules:
- Assume the user is a vibe coder / solo builder.
- Be concrete, practical, and launch-oriented.
- launchNeeds should be 4-8 concise bullets describing what needs to exist before launch.
- launchChecklist should be 6-12 initial execution steps in a sensible order.
- suggestedTechStack should be a realistic stack list, not prose.
- Avoid fluff.

Current title (if any): ${currentTitle || 'None'}

Idea:
${rawIdea}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You help founders sharpen software ideas into launch plans. Always respond with valid JSON only.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.4,
        max_tokens: 1400,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    const parsed = JSON.parse(content);

    const result = {
      title: parsed.title || currentTitle || 'Untitled idea',
      distilledSummary: parsed.distilledSummary || '',
      gtmStrategy: parsed.gtmStrategy || '',
      launchNeeds: Array.isArray(parsed.launchNeeds) ? parsed.launchNeeds : [],
      launchChecklist: Array.isArray(parsed.launchChecklist) ? parsed.launchChecklist : [],
      suggestedTechStack: Array.isArray(parsed.suggestedTechStack) ? parsed.suggestedTechStack : [],
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in ai-project-idea function:', error);
    return new Response(JSON.stringify({ error: error.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
