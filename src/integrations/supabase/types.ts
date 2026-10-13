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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      alerts: {
        Row: {
          acknowledged_at: string | null
          asset_id: string | null
          assignee_id: string | null
          created_at: string
          event_ids: string[]
          finding_id: string | null
          hit_count: number
          id: string
          notes: string | null
          reason: string
          resolved_at: string | null
          rule_id: string | null
          severity: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          acknowledged_at?: string | null
          asset_id?: string | null
          assignee_id?: string | null
          created_at?: string
          event_ids?: string[]
          finding_id?: string | null
          hit_count?: number
          id?: string
          notes?: string | null
          reason: string
          resolved_at?: string | null
          rule_id?: string | null
          severity: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          acknowledged_at?: string | null
          asset_id?: string | null
          assignee_id?: string | null
          created_at?: string
          event_ids?: string[]
          finding_id?: string | null
          hit_count?: number
          id?: string
          notes?: string | null
          reason?: string
          resolved_at?: string | null
          rule_id?: string | null
          severity?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "alerts_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_finding_id_fkey"
            columns: ["finding_id"]
            isOneToOne: false
            referencedRelation: "findings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "detection_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      assessments: {
        Row: {
          asset_ids: string[]
          authorization_note: string
          created_at: string
          description: string | null
          id: string
          is_sample: boolean
          name: string
          owner_id: string | null
          progress: number
          scope: string
          start_date: string
          status: string
        }
        Insert: {
          asset_ids?: string[]
          authorization_note: string
          created_at?: string
          description?: string | null
          id?: string
          is_sample?: boolean
          name: string
          owner_id?: string | null
          progress?: number
          scope: string
          start_date?: string
          status?: string
        }
        Update: {
          asset_ids?: string[]
          authorization_note?: string
          created_at?: string
          description?: string | null
          id?: string
          is_sample?: boolean
          name?: string
          owner_id?: string | null
          progress?: number
          scope?: string
          start_date?: string
          status?: string
        }
        Relationships: []
      }
      assets: {
        Row: {
          archived: boolean
          authorized: boolean
          created_at: string
          created_by: string | null
          environment: string
          hostname: string
          id: string
          ip_address: string | null
          is_sample: boolean
          os: string | null
          owner_name: string | null
          permitted_methods: string | null
          services: string | null
          tags: string[]
          updated_at: string
        }
        Insert: {
          archived?: boolean
          authorized?: boolean
          created_at?: string
          created_by?: string | null
          environment?: string
          hostname: string
          id?: string
          ip_address?: string | null
          is_sample?: boolean
          os?: string | null
          owner_name?: string | null
          permitted_methods?: string | null
          services?: string | null
          tags?: string[]
          updated_at?: string
        }
        Update: {
          archived?: boolean
          authorized?: boolean
          created_at?: string
          created_by?: string | null
          environment?: string
          hostname?: string
          id?: string
          ip_address?: string | null
          is_sample?: boolean
          os?: string | null
          owner_name?: string | null
          permitted_methods?: string | null
          services?: string | null
          tags?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          actor: string | null
          created_at: string
          details: Json | null
          entity: string
          entity_id: string | null
          id: number
        }
        Insert: {
          action: string
          actor?: string | null
          created_at?: string
          details?: Json | null
          entity: string
          entity_id?: string | null
          id?: number
        }
        Update: {
          action?: string
          actor?: string | null
          created_at?: string
          details?: Json | null
          entity?: string
          entity_id?: string | null
          id?: number
        }
        Relationships: []
      }
      detection_rules: {
        Row: {
          created_at: string
          description: string | null
          enabled: boolean
          field: string
          id: string
          name: string
          operator: string
          recommendation: string | null
          severity: string
          threshold: number
          value: string
          window_minutes: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          enabled?: boolean
          field: string
          id?: string
          name: string
          operator: string
          recommendation?: string | null
          severity: string
          threshold?: number
          value: string
          window_minutes?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          enabled?: boolean
          field?: string
          id?: string
          name?: string
          operator?: string
          recommendation?: string | null
          severity?: string
          threshold?: number
          value?: string
          window_minutes?: number
        }
        Relationships: []
      }
      evidence: {
        Row: {
          created_at: string
          description: string | null
          file_name: string
          file_path: string
          finding_id: string | null
          id: string
          incident_id: string | null
          mime_type: string | null
          sha256: string
          size_bytes: number
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          file_name: string
          file_path: string
          finding_id?: string | null
          id?: string
          incident_id?: string | null
          mime_type?: string | null
          sha256: string
          size_bytes: number
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          file_name?: string
          file_path?: string
          finding_id?: string | null
          id?: string
          incident_id?: string | null
          mime_type?: string | null
          sha256?: string
          size_bytes?: number
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evidence_finding_id_fkey"
            columns: ["finding_id"]
            isOneToOne: false
            referencedRelation: "findings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evidence_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
        ]
      }
      findings: {
        Row: {
          assessment_id: string | null
          asset_id: string | null
          assignee_id: string | null
          category: string | null
          created_at: string
          created_by: string | null
          cvss: number | null
          evidence: string | null
          id: string
          impact: string | null
          is_sample: boolean
          recommendation: string | null
          severity: string
          status: string
          steps: string | null
          title: string
          updated_at: string
          verified_at: string | null
        }
        Insert: {
          assessment_id?: string | null
          asset_id?: string | null
          assignee_id?: string | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          cvss?: number | null
          evidence?: string | null
          id?: string
          impact?: string | null
          is_sample?: boolean
          recommendation?: string | null
          severity: string
          status?: string
          steps?: string | null
          title: string
          updated_at?: string
          verified_at?: string | null
        }
        Update: {
          assessment_id?: string | null
          asset_id?: string | null
          assignee_id?: string | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          cvss?: number | null
          evidence?: string | null
          id?: string
          impact?: string | null
          is_sample?: boolean
          recommendation?: string | null
          severity?: string
          status?: string
          steps?: string | null
          title?: string
          updated_at?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "findings_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "findings_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      incidents: {
        Row: {
          alert_ids: string[]
          created_at: string
          id: string
          lessons: string | null
          owner_id: string | null
          root_cause: string | null
          severity: string
          status: string
          summary: string | null
          timeline: string | null
          title: string
          updated_at: string
        }
        Insert: {
          alert_ids?: string[]
          created_at?: string
          id?: string
          lessons?: string | null
          owner_id?: string | null
          root_cause?: string | null
          severity: string
          status?: string
          summary?: string | null
          timeline?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          alert_ids?: string[]
          created_at?: string
          id?: string
          lessons?: string | null
          owner_id?: string | null
          root_cause?: string | null
          severity?: string
          status?: string
          summary?: string | null
          timeline?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string
          id: string
          team_focus: string
        }
        Insert: {
          created_at?: string
          display_name?: string
          id: string
          team_focus?: string
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          team_focus?: string
        }
        Relationships: []
      }
      progress: {
        Row: {
          completed: boolean
          hints_used: number
          id: string
          item_key: string
          kind: string
          score: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          hints_used?: number
          id?: string
          item_key: string
          kind: string
          score?: number | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          completed?: boolean
          hints_used?: number
          id?: string
          item_key?: string
          kind?: string
          score?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      security_events: {
        Row: {
          asset_id: string | null
          created_at: string
          event_type: string
          id: string
          is_synthetic: boolean
          message: string
          occurred_at: string
          severity: string
          source: string
        }
        Insert: {
          asset_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          is_synthetic?: boolean
          message: string
          occurred_at?: string
          severity?: string
          source: string
        }
        Update: {
          asset_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          is_synthetic?: boolean
          message?: string
          occurred_at?: string
          severity?: string
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "security_events_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      task_comments: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          task_id: string
        }
        Insert: {
          author_id?: string
          body: string
          created_at?: string
          id?: string
          task_id: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "team_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      team_tasks: {
        Row: {
          assignee_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          finding_id: string | null
          id: string
          priority: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assignee_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          finding_id?: string | null
          id?: string
          priority?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assignee_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          finding_id?: string | null
          id?: string
          priority?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_tasks_finding_id_fkey"
            columns: ["finding_id"]
            isOneToOne: false
            referencedRelation: "findings"
            referencedColumns: ["id"]
          },
        ]
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      event_matches: {
        Args: {
          e: Database["public"]["Tables"]["security_events"]["Row"]
          r: Database["public"]["Tables"]["detection_rules"]["Row"]
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      test_rule: {
        Args: { _field: string; _operator: string; _value: string }
        Returns: {
          asset_id: string | null
          created_at: string
          event_type: string
          id: string
          is_synthetic: boolean
          message: string
          occurred_at: string
          severity: string
          source: string
        }[]
        SetofOptions: {
          from: "*"
          to: "security_events"
          isOneToOne: false
          isSetofReturn: true
        }
      }
    }
    Enums: {
      app_role: "admin" | "red_team" | "blue_team" | "member"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "red_team", "blue_team", "member"],
    },
  },
} as const
