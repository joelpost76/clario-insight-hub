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
      assessments: {
        Row: {
          client_id: string
          created_at: string
          current_step: number
          id: string
          is_complete: boolean
          module_type: string
          score_label: string | null
          status: string
          total_weighted_score: number | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          current_step?: number
          id?: string
          is_complete?: boolean
          module_type?: string
          score_label?: string | null
          status?: string
          total_weighted_score?: number | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          current_step?: number
          id?: string
          is_complete?: boolean
          module_type?: string
          score_label?: string | null
          status?: string
          total_weighted_score?: number | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessments_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          created_at: string
          headcount: number | null
          id: string
          industry: string | null
          name: string
          revenue_range: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          headcount?: number | null
          id?: string
          industry?: string | null
          name: string
          revenue_range?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          headcount?: number | null
          id?: string
          industry?: string | null
          name?: string
          revenue_range?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_workspace_id_fkey"
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
      flow_stabilization_state: {
        Row: {
          analysis: Json | null
          created_at: string
          id: string
          responses: Json
          updated_at: string
          workspace_id: string
        }
        Insert: {
          analysis?: Json | null
          created_at?: string
          id?: string
          responses?: Json
          updated_at?: string
          workspace_id: string
        }
        Update: {
          analysis?: Json | null
          created_at?: string
          id?: string
          responses?: Json
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flow_stabilization_state_workspace_id_fkey"
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
      invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          id: string
          invited_by: string
          role: Database["public"]["Enums"]["app_role"]
          status: string
          token: string
          workspace_id: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          id?: string
          invited_by: string
          role?: Database["public"]["Enums"]["app_role"]
          status?: string
          token?: string
          workspace_id: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          id?: string
          invited_by?: string
          role?: Database["public"]["Enums"]["app_role"]
          status?: string
          token?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_workspace_id_fkey"
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
      sales_leads: {
        Row: {
          accepted_at: string | null
          company_name: string
          contact_email: string
          contact_name: string
          contact_phone: string | null
          contact_title: string | null
          created_at: string
          headcount: number | null
          id: string
          industry: string | null
          notes: string | null
          pain_points: string[]
          qualified_at: string | null
          referral_source: string | null
          revenue_range: string | null
          services_selected: Json
          status: string
          total_estimated_investment: Json | null
          updated_at: string
          urgency: string
          utm_params: Json | null
          workspace_id: string | null
        }
        Insert: {
          accepted_at?: string | null
          company_name: string
          contact_email: string
          contact_name: string
          contact_phone?: string | null
          contact_title?: string | null
          created_at?: string
          headcount?: number | null
          id?: string
          industry?: string | null
          notes?: string | null
          pain_points?: string[]
          qualified_at?: string | null
          referral_source?: string | null
          revenue_range?: string | null
          services_selected: Json
          status?: string
          total_estimated_investment?: Json | null
          updated_at?: string
          urgency: string
          utm_params?: Json | null
          workspace_id?: string | null
        }
        Update: {
          accepted_at?: string | null
          company_name?: string
          contact_email?: string
          contact_name?: string
          contact_phone?: string | null
          contact_title?: string | null
          created_at?: string
          headcount?: number | null
          id?: string
          industry?: string | null
          notes?: string | null
          pain_points?: string[]
          qualified_at?: string | null
          referral_source?: string | null
          revenue_range?: string | null
          services_selected?: Json
          status?: string
          total_estimated_investment?: Json | null
          updated_at?: string
          urgency?: string
          utm_params?: Json | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_leads_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      scope_creep_assessments: {
        Row: {
          avg_estimate_accuracy: number | null
          client_id: string
          co_capture_rate: number | null
          constraint_score: number | null
          created_at: string
          current_step: number
          date_range_end: string | null
          date_range_start: string | null
          id: string
          impact_model: Json | null
          is_complete: boolean
          root_cause_notes: string | null
          total_jobs: number | null
          total_margin_leakage: number | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          avg_estimate_accuracy?: number | null
          client_id: string
          co_capture_rate?: number | null
          constraint_score?: number | null
          created_at?: string
          current_step?: number
          date_range_end?: string | null
          date_range_start?: string | null
          id?: string
          impact_model?: Json | null
          is_complete?: boolean
          root_cause_notes?: string | null
          total_jobs?: number | null
          total_margin_leakage?: number | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          avg_estimate_accuracy?: number | null
          client_id?: string
          co_capture_rate?: number | null
          constraint_score?: number | null
          created_at?: string
          current_step?: number
          date_range_end?: string | null
          date_range_start?: string | null
          id?: string
          impact_model?: Json | null
          is_complete?: boolean
          root_cause_notes?: string | null
          total_jobs?: number | null
          total_margin_leakage?: number | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scope_creep_assessments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scope_creep_assessments_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      scope_creep_column_map: {
        Row: {
          assessment_id: string
          created_at: string
          id: string
          mapping: Json | null
          raw_headers: Json | null
        }
        Insert: {
          assessment_id: string
          created_at?: string
          id?: string
          mapping?: Json | null
          raw_headers?: Json | null
        }
        Update: {
          assessment_id?: string
          created_at?: string
          id?: string
          mapping?: Json | null
          raw_headers?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "scope_creep_column_map_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "scope_creep_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      scope_creep_jobs: {
        Row: {
          actual_cost: number | null
          assessment_id: string
          co_value_issued: number | null
          co_value_signed: number | null
          contract_value: number | null
          cos_issued: number | null
          cos_signed: number | null
          estimated_cost: number | null
          estimator_name: string | null
          id: string
          is_excluded: boolean | null
          job_end_date: string | null
          job_name: string | null
          job_start_date: string | null
          project_type: string | null
        }
        Insert: {
          actual_cost?: number | null
          assessment_id: string
          co_value_issued?: number | null
          co_value_signed?: number | null
          contract_value?: number | null
          cos_issued?: number | null
          cos_signed?: number | null
          estimated_cost?: number | null
          estimator_name?: string | null
          id?: string
          is_excluded?: boolean | null
          job_end_date?: string | null
          job_name?: string | null
          job_start_date?: string | null
          project_type?: string | null
        }
        Update: {
          actual_cost?: number | null
          assessment_id?: string
          co_value_issued?: number | null
          co_value_signed?: number | null
          contract_value?: number | null
          cos_issued?: number | null
          cos_signed?: number | null
          estimated_cost?: number | null
          estimator_name?: string | null
          id?: string
          is_excluded?: boolean | null
          job_end_date?: string | null
          job_name?: string | null
          job_start_date?: string | null
          project_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scope_creep_jobs_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "scope_creep_assessments"
            referencedColumns: ["id"]
          },
        ]
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
          constraint_state: Json | null
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
          constraint_state?: Json | null
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
          constraint_state?: Json | null
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
      calculate_lead_score: { Args: { lead_id: string }; Returns: number }
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
