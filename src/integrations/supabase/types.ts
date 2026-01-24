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
      accounts: {
        Row: {
          created_at: string
          headcount: number | null
          id: string
          industry: string | null
          locations: string[] | null
          name: string
          revenue_range: string | null
          tools: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          headcount?: number | null
          id?: string
          industry?: string | null
          locations?: string[] | null
          name: string
          revenue_range?: string | null
          tools?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          headcount?: number | null
          id?: string
          industry?: string | null
          locations?: string[] | null
          name?: string
          revenue_range?: string | null
          tools?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      artifacts: {
        Row: {
          created_at: string
          id: string
          link_or_file: string
          notes: string | null
          tags: string[] | null
          title: string | null
          type: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link_or_file: string
          notes?: string | null
          tags?: string[] | null
          title?: string | null
          type: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link_or_file?: string
          notes?: string | null
          tags?: string[] | null
          title?: string | null
          type?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "artifacts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      flow_baselines: {
        Row: {
          ar_aging_30: number | null
          ar_aging_60: number | null
          ar_aging_90: number | null
          billing_cycle_days: number | null
          confidence_level: string | null
          created_at: string
          id: string
          lead_time_days: number | null
          rework_rate: number | null
          throughput_per_week: number | null
          updated_at: string
          wip_count: number | null
          workspace_id: string
        }
        Insert: {
          ar_aging_30?: number | null
          ar_aging_60?: number | null
          ar_aging_90?: number | null
          billing_cycle_days?: number | null
          confidence_level?: string | null
          created_at?: string
          id?: string
          lead_time_days?: number | null
          rework_rate?: number | null
          throughput_per_week?: number | null
          updated_at?: string
          wip_count?: number | null
          workspace_id: string
        }
        Update: {
          ar_aging_30?: number | null
          ar_aging_60?: number | null
          ar_aging_90?: number | null
          billing_cycle_days?: number | null
          confidence_level?: string | null
          created_at?: string
          id?: string
          lead_time_days?: number | null
          rework_rate?: number | null
          throughput_per_week?: number | null
          updated_at?: string
          wip_count?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flow_baselines_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      intake_responses: {
        Row: {
          created_at: string
          decisions_bottleneck: string | null
          id: string
          metrics_tracked_today: string | null
          pain_ratings: Json | null
          recurring_fire_sentence: string | null
          symptom_clusters: string[] | null
          toc_one_fix_effect: string | null
          toc_replanning_points: string | null
          toc_wait_points: string | null
          tools_list: Json | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          decisions_bottleneck?: string | null
          id?: string
          metrics_tracked_today?: string | null
          pain_ratings?: Json | null
          recurring_fire_sentence?: string | null
          symptom_clusters?: string[] | null
          toc_one_fix_effect?: string | null
          toc_replanning_points?: string | null
          toc_wait_points?: string | null
          tools_list?: Json | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          decisions_bottleneck?: string | null
          id?: string
          metrics_tracked_today?: string | null
          pain_ratings?: Json | null
          recurring_fire_sentence?: string | null
          symptom_clusters?: string[] | null
          toc_one_fix_effect?: string | null
          toc_replanning_points?: string | null
          toc_wait_points?: string | null
          tools_list?: Json | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "intake_responses_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      interviews: {
        Row: {
          created_at: string
          email: string | null
          id: string
          interviewee_name: string
          notes: string | null
          role: string
          scheduled_at: string | null
          status: string
          themes: string[] | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          interviewee_name: string
          notes?: string | null
          role: string
          scheduled_at?: string | null
          status?: string
          themes?: string[] | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          interviewee_name?: string
          notes?: string | null
          role?: string
          scheduled_at?: string | null
          status?: string
          themes?: string[] | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interviews_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sipocs: {
        Row: {
          created_at: string
          customers: string[] | null
          id: string
          inputs: string[] | null
          outputs: string[] | null
          process_steps: string[] | null
          suppliers: string[] | null
          updated_at: string
          workflow_name: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          customers?: string[] | null
          id?: string
          inputs?: string[] | null
          outputs?: string[] | null
          process_steps?: string[] | null
          suppliers?: string[] | null
          updated_at?: string
          workflow_name: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          customers?: string[] | null
          id?: string
          inputs?: string[] | null
          outputs?: string[] | null
          process_steps?: string[] | null
          suppliers?: string[] | null
          updated_at?: string
          workflow_name?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sipocs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      surveys: {
        Row: {
          aggregates: Json | null
          burnout_risk_avg: number | null
          created_at: string
          id: string
          response_count: number | null
          sent_at: string | null
          share_link: string | null
          themes: string[] | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          aggregates?: Json | null
          burnout_risk_avg?: number | null
          created_at?: string
          id?: string
          response_count?: number | null
          sent_at?: string | null
          share_link?: string | null
          themes?: string[] | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          aggregates?: Json | null
          burnout_risk_avg?: number | null
          created_at?: string
          id?: string
          response_count?: number | null
          sent_at?: string | null
          share_link?: string | null
          themes?: string[] | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "surveys_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      workflow_maps: {
        Row: {
          created_at: string
          handoffs: Json | null
          id: string
          queues: Json | null
          rework_loops: Json | null
          steps: Json | null
          updated_at: string
          workflow_name: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          handoffs?: Json | null
          id?: string
          queues?: Json | null
          rework_loops?: Json | null
          steps?: Json | null
          updated_at?: string
          workflow_name: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          handoffs?: Json | null
          id?: string
          queues?: Json | null
          rework_loops?: Json | null
          steps?: Json | null
          updated_at?: string
          workflow_name?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_maps_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_members: {
        Row: {
          created_at: string
          id: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          account_id: string
          constraints_nonnegotiables: string[] | null
          created_at: string
          day_counter: number | null
          id: string
          outcomes_90_day: string[] | null
          phase_statuses: Json | null
          readout_date: string | null
          scope_teams: string[] | null
          scope_workflows: string[] | null
          start_date: string | null
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          account_id: string
          constraints_nonnegotiables?: string[] | null
          created_at?: string
          day_counter?: number | null
          id?: string
          outcomes_90_day?: string[] | null
          phase_statuses?: Json | null
          readout_date?: string | null
          scope_teams?: string[] | null
          scope_workflows?: string[] | null
          start_date?: string | null
          status?: string
          type?: string
          updated_at?: string
        }
        Update: {
          account_id?: string
          constraints_nonnegotiables?: string[] | null
          created_at?: string
          day_counter?: number | null
          id?: string
          outcomes_90_day?: string[] | null
          phase_statuses?: Json | null
          readout_date?: string | null
          scope_teams?: string[] | null
          scope_workflows?: string[] | null
          start_date?: string | null
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspaces_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_workspace_member: {
        Args: { _user_id: string; _workspace_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "client_user" | "client_admin" | "unburnt_admin"
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
      app_role: ["client_user", "client_admin", "unburnt_admin"],
    },
  },
} as const
