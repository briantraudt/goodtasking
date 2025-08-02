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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admin_roles: {
        Row: {
          admin_id: string | null
          id: string
          role: Database["public"]["Enums"]["admin_role"]
        }
        Insert: {
          admin_id?: string | null
          id?: string
          role?: Database["public"]["Enums"]["admin_role"]
        }
        Update: {
          admin_id?: string | null
          id?: string
          role?: Database["public"]["Enums"]["admin_role"]
        }
        Relationships: [
          {
            foreignKeyName: "admin_roles_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_users: {
        Row: {
          created_at: string
          email: string
          id: string
          password: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          password: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          password?: string
        }
        Relationships: []
      }
      beta_signups: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      business_evaluations: {
        Row: {
          created_at: string | null
          email: string | null
          evaluation_date: string | null
          id: string
          idea: string
          name: string | null
          result: string | null
          score: number | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          evaluation_date?: string | null
          id?: string
          idea: string
          name?: string | null
          result?: string | null
          score?: number | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          evaluation_date?: string | null
          id?: string
          idea?: string
          name?: string | null
          result?: string | null
          score?: number | null
        }
        Relationships: []
      }
      business_submissions: {
        Row: {
          additional_info: string | null
          budget: string
          business_idea: string
          business_stage: string
          company_name: string | null
          created_at: string
          customers: string | null
          email: string
          full_name: string
          help_types: string[] | null
          id: string
          idea_score: number | null
          other_help_explanation: string | null
          phone: string | null
          problem_solution: string
          profit_type: string
          social_impact: string | null
        }
        Insert: {
          additional_info?: string | null
          budget: string
          business_idea: string
          business_stage: string
          company_name?: string | null
          created_at?: string
          customers?: string | null
          email: string
          full_name: string
          help_types?: string[] | null
          id?: string
          idea_score?: number | null
          other_help_explanation?: string | null
          phone?: string | null
          problem_solution: string
          profit_type: string
          social_impact?: string | null
        }
        Update: {
          additional_info?: string | null
          budget?: string
          business_idea?: string
          business_stage?: string
          company_name?: string | null
          created_at?: string
          customers?: string | null
          email?: string
          full_name?: string
          help_types?: string[] | null
          id?: string
          idea_score?: number | null
          other_help_explanation?: string | null
          phone?: string | null
          problem_solution?: string
          profit_type?: string
          social_impact?: string | null
        }
        Relationships: []
      }
      client_access: {
        Row: {
          access_code: string
          client_id: string
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          access_code: string
          client_id: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          access_code?: string
          client_id?: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_access_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      project_updates: {
        Row: {
          created_at: string
          date: string
          description: string
          id: string
          project_id: string
          title: string
        }
        Insert: {
          created_at?: string
          date?: string
          description: string
          id?: string
          project_id: string
          title: string
        }
        Update: {
          created_at?: string
          date?: string
          description?: string
          id?: string
          project_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_updates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          client_id: string
          created_at: string
          description: string | null
          embed_project: boolean | null
          id: string
          name: string
          project_url: string | null
          status: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          description?: string | null
          embed_project?: boolean | null
          id?: string
          name: string
          project_url?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          description?: string | null
          embed_project?: boolean | null
          id?: string
          name?: string
          project_url?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      training_bookings: {
        Row: {
          booking_date: string
          booking_time: string
          created_at: string
          email: string
          id: string
          name: string
          stripe_session_id: string | null
          updated_at: string
        }
        Insert: {
          booking_date: string
          booking_time: string
          created_at?: string
          email: string
          id?: string
          name: string
          stripe_session_id?: string | null
          updated_at?: string
        }
        Update: {
          booking_date?: string
          booking_time?: string
          created_at?: string
          email?: string
          id?: string
          name?: string
          stripe_session_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          userid: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          userid: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          userid?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          created_at: string
          enableaisuggestions: boolean
          name: string | null
          timezone: string
          updated_at: string
          user_id: string
          workinghourend: string
          workinghourstart: string
          workstyle: string
        }
        Insert: {
          created_at?: string
          enableaisuggestions?: boolean
          name?: string | null
          timezone?: string
          updated_at?: string
          user_id: string
          workinghourend?: string
          workinghourstart?: string
          workstyle?: string
        }
        Update: {
          created_at?: string
          enableaisuggestions?: boolean
          name?: string | null
          timezone?: string
          updated_at?: string
          user_id?: string
          workinghourend?: string
          workinghourstart?: string
          workstyle?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_tasks: {
        Row: {
          category: string | null
          completed: boolean
          created_at: string
          description: string | null
          duedate: string | null
          id: string
          priority: string
          timeestimate: number | null
          title: string
          updated_at: string
          userid: string
        }
        Insert: {
          category?: string | null
          completed?: boolean
          created_at?: string
          description?: string | null
          duedate?: string | null
          id?: string
          priority?: string
          timeestimate?: number | null
          title: string
          updated_at?: string
          userid: string
        }
        Update: {
          category?: string | null
          completed?: boolean
          created_at?: string
          description?: string | null
          duedate?: string | null
          id?: string
          priority?: string
          timeestimate?: number | null
          title?: string
          updated_at?: string
          userid?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_admin_credentials: {
        Args: { email_param: string; password_param: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      validate_client_access: {
        Args: { slug: string; code: string }
        Returns: boolean
      }
    }
    Enums: {
      admin_role: "admin"
      app_role: "admin" | "user"
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
    Enums: {
      admin_role: ["admin"],
      app_role: ["admin", "user"],
    },
  },
} as const
