export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      daily_reminders: {
        Row: {
          created_at: string
          email_sent_at: string
          id: string
          reminder_date: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_sent_at?: string
          id?: string
          reminder_date: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_sent_at?: string
          id?: string
          reminder_date?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_summaries: {
        Row: {
          completion_rate: number | null
          created_at: string
          id: string
          summary: string
          summary_date: string
          task_count: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completion_rate?: number | null
          created_at?: string
          id?: string
          summary: string
          summary_date: string
          task_count?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completion_rate?: number | null
          created_at?: string
          id?: string
          summary?: string
          summary_date?: string
          task_count?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      google_calendar_tokens: {
        Row: {
          access_token: string
          created_at: string
          expires_at: string
          id: string
          refresh_token: string | null
          scope: string
          token_type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string
          expires_at: string
          id?: string
          refresh_token?: string | null
          scope?: string
          token_type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string
          expires_at?: string
          id?: string
          refresh_token?: string | null
          scope?: string
          token_type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          ai_assistant_enabled: boolean | null
          avatar_url: string | null
          created_at: string
          display_name: string | null
          has_completed_onboarding: boolean | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_assistant_enabled?: boolean | null
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          has_completed_onboarding?: boolean | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_assistant_enabled?: boolean | null
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          has_completed_onboarding?: boolean | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          ai_assistant_enabled: boolean | null
          ai_summary_time: string | null
          ai_tone_preference: string | null
          auto_schedule_unscheduled: boolean | null
          check_in_dates: string[] | null
          created_at: string
          current_streak: number | null
          default_project_id: string | null
          default_task_day: string | null
          google_calendar_enabled: boolean | null
          id: string
          last_login_date: string | null
          last_milestone_celebrated: number | null
          longest_streak: number | null
          reminders_enabled: boolean | null
          streak_tracking_enabled: boolean | null
          updated_at: string
          user_id: string
          weekly_review_enabled: boolean | null
        }
        Insert: {
          ai_assistant_enabled?: boolean | null
          ai_summary_time?: string | null
          ai_tone_preference?: string | null
          auto_schedule_unscheduled?: boolean | null
          check_in_dates?: string[] | null
          created_at?: string
          current_streak?: number | null
          default_project_id?: string | null
          default_task_day?: string | null
          google_calendar_enabled?: boolean | null
          id?: string
          last_login_date?: string | null
          last_milestone_celebrated?: number | null
          longest_streak?: number | null
          reminders_enabled?: boolean | null
          streak_tracking_enabled?: boolean | null
          updated_at?: string
          user_id: string
          weekly_review_enabled?: boolean | null
        }
        Update: {
          ai_assistant_enabled?: boolean | null
          ai_summary_time?: string | null
          ai_tone_preference?: string | null
          auto_schedule_unscheduled?: boolean | null
          check_in_dates?: string[] | null
          created_at?: string
          current_streak?: number | null
          default_project_id?: string | null
          default_task_day?: string | null
          google_calendar_enabled?: boolean | null
          id?: string
          last_login_date?: string | null
          last_milestone_celebrated?: number | null
          longest_streak?: number | null
          reminders_enabled?: boolean | null
          streak_tracking_enabled?: boolean | null
          updated_at?: string
          user_id?: string
          weekly_review_enabled?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_default_project_id_fkey"
            columns: ["default_project_id"]
            isOneToOne: false
            referencedRelation: "vibe_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      vibe_projects: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          scheduled_day: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          scheduled_day?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          scheduled_day?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      vibe_tasks: {
        Row: {
          completed: boolean
          created_at: string
          description: string | null
          id: string
          project_id: string
          scheduled_date: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          description?: string | null
          id?: string
          project_id: string
          scheduled_date?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          description?: string | null
          id?: string
          project_id?: string
          scheduled_date?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vibe_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "vibe_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_reviews: {
        Row: {
          created_at: string
          id: string
          review: string
          stats: Json | null
          updated_at: string
          user_id: string
          week_end: string
          week_key: string
          week_start: string
        }
        Insert: {
          created_at?: string
          id?: string
          review: string
          stats?: Json | null
          updated_at?: string
          user_id: string
          week_end: string
          week_key: string
          week_start: string
        }
        Update: {
          created_at?: string
          id?: string
          review?: string
          stats?: Json | null
          updated_at?: string
          user_id?: string
          week_end?: string
          week_key?: string
          week_start?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_current_streak: {
        Args: { check_dates: string[] }
        Returns: number
      }
      record_check_in: {
        Args: { user_uuid: string }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
