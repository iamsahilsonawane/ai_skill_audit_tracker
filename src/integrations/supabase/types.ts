export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      daily_logs: {
        Row: {
          created_at: string
          hours_spent: number | null
          id: string
          log_date: string
          mood: string
          profile_id: string
          summary: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          hours_spent?: number | null
          id?: string
          log_date: string
          mood?: string
          profile_id: string
          summary?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          hours_spent?: number | null
          id?: string
          log_date?: string
          mood?: string
          profile_id?: string
          summary?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_logs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_plan_weeks: {
        Row: {
          created_at: string
          description: string | null
          handson_hours: number | null
          hypothesis_exercise: string | null
          id: string
          profile_id: string
          status: string
          theory_hours: number | null
          title: string
          updated_at: string
          week: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          handson_hours?: number | null
          hypothesis_exercise?: string | null
          id?: string
          profile_id: string
          status?: string
          theory_hours?: number | null
          title: string
          updated_at?: string
          week: number
        }
        Update: {
          created_at?: string
          description?: string | null
          handson_hours?: number | null
          hypothesis_exercise?: string | null
          id?: string
          profile_id?: string
          status?: string
          theory_hours?: number | null
          title?: string
          updated_at?: string
          week?: number
        }
        Relationships: [
          {
            foreignKeyName: "learning_plan_weeks_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mentor_comments: {
        Row: {
          comment_text: string
          comment_type: string
          created_at: string
          id: string
          mentor_id: string
          review_id: string
          updated_at: string
        }
        Insert: {
          comment_text: string
          comment_type?: string
          created_at?: string
          id?: string
          mentor_id: string
          review_id: string
          updated_at?: string
        }
        Update: {
          comment_text?: string
          comment_type?: string
          created_at?: string
          id?: string
          mentor_id?: string
          review_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentor_comments_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentor_comments_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "weekly_reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      mentor_learner_pairs: {
        Row: {
          created_at: string
          id: string
          learner_id: string
          mentor_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          learner_id: string
          mentor_id: string
        }
        Update: {
          created_at?: string
          id?: string
          learner_id?: string
          mentor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentor_learner_pairs_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentor_learner_pairs_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          actual_hours: number | null
          created_at: string
          deployed_url: string | null
          description: string | null
          estimated_hours: number | null
          github_url: string | null
          id: string
          is_preloaded: boolean | null
          notes: string | null
          profile_id: string
          skills_practiced: string[] | null
          status: string
          title: string
          tools_used: string[] | null
          updated_at: string
        }
        Insert: {
          actual_hours?: number | null
          created_at?: string
          deployed_url?: string | null
          description?: string | null
          estimated_hours?: number | null
          github_url?: string | null
          id?: string
          is_preloaded?: boolean | null
          notes?: string | null
          profile_id: string
          skills_practiced?: string[] | null
          status?: string
          title: string
          tools_used?: string[] | null
          updated_at?: string
        }
        Update: {
          actual_hours?: number | null
          created_at?: string
          deployed_url?: string | null
          description?: string | null
          estimated_hours?: number | null
          github_url?: string | null
          id?: string
          is_preloaded?: boolean | null
          notes?: string | null
          profile_id?: string
          skills_practiced?: string[] | null
          status?: string
          title?: string
          tools_used?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      resources: {
        Row: {
          created_at: string
          id: string
          is_completed: boolean | null
          notes: string | null
          profile_id: string
          related_skills: string[] | null
          resource_type: string
          title: string
          updated_at: string
          url: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_completed?: boolean | null
          notes?: string | null
          profile_id: string
          related_skills?: string[] | null
          resource_type?: string
          title: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_completed?: boolean | null
          notes?: string | null
          profile_id?: string
          related_skills?: string[] | null
          resource_type?: string
          title?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resources_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_assessments: {
        Row: {
          created_at: string
          id: string
          level: string
          notes: string | null
          profile_id: string
          skill_id: string
          updated_at: string
          week: number
        }
        Insert: {
          created_at?: string
          id?: string
          level?: string
          notes?: string | null
          profile_id: string
          skill_id: string
          updated_at?: string
          week: number
        }
        Update: {
          created_at?: string
          id?: string
          level?: string
          notes?: string | null
          profile_id?: string
          skill_id?: string
          updated_at?: string
          week?: number
        }
        Relationships: [
          {
            foreignKeyName: "skill_assessments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_assessments_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      skills: {
        Row: {
          category: string
          created_at: string
          id: string
          name: string
          sort_order: number
          target_week: number
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          name: string
          sort_order?: number
          target_week: number
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
          target_week?: number
        }
        Relationships: []
      }
      week_tasks: {
        Row: {
          created_at: string
          description: string
          id: string
          is_completed: boolean | null
          learning_plan_week_id: string
          task_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          is_completed?: boolean | null
          learning_plan_week_id: string
          task_type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          is_completed?: boolean | null
          learning_plan_week_id?: string
          task_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "week_tasks_learning_plan_week_id_fkey"
            columns: ["learning_plan_week_id"]
            isOneToOne: false
            referencedRelation: "learning_plan_weeks"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_reviews: {
        Row: {
          build_links: Json | null
          business_connection: string | null
          created_at: string
          hours_spent: number | null
          hypothesis_tested: string | null
          id: string
          profile_id: string
          status: string
          updated_at: string
          week: number
          what_blocked: string | null
          what_built: string | null
          what_learned: string | null
        }
        Insert: {
          build_links?: Json | null
          business_connection?: string | null
          created_at?: string
          hours_spent?: number | null
          hypothesis_tested?: string | null
          id?: string
          profile_id: string
          status?: string
          updated_at?: string
          week: number
          what_blocked?: string | null
          what_built?: string | null
          what_learned?: string | null
        }
        Update: {
          build_links?: Json | null
          business_connection?: string | null
          created_at?: string
          hours_spent?: number | null
          hypothesis_tested?: string | null
          id?: string
          profile_id?: string
          status?: string
          updated_at?: string
          week?: number
          what_blocked?: string | null
          what_built?: string | null
          what_learned?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "weekly_reviews_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_profile_id: { Args: never; Returns: string }
      is_linked_mentor: {
        Args: { learner_profile_id: string }
        Returns: boolean
      }
      is_mentor: { Args: never; Returns: boolean }
      is_profile_owner: { Args: { p_id: string }; Returns: boolean }
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
