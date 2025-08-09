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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      cards: {
        Row: {
          archived: boolean | null
          cache_ttl: number | null
          collection_id: string | null
          created_at: string | null
          dataset_query: Json
          description: string | null
          display: string
          id: string
          name: string
          updated_at: string | null
          visualization_settings: Json | null
        }
        Insert: {
          archived?: boolean | null
          cache_ttl?: number | null
          collection_id?: string | null
          created_at?: string | null
          dataset_query: Json
          description?: string | null
          display: string
          id?: string
          name: string
          updated_at?: string | null
          visualization_settings?: Json | null
        }
        Update: {
          archived?: boolean | null
          cache_ttl?: number | null
          collection_id?: string | null
          created_at?: string | null
          dataset_query?: Json
          description?: string | null
          display?: string
          id?: string
          name?: string
          updated_at?: string | null
          visualization_settings?: Json | null
        }
        Relationships: []
      }
      dashboard_cards: {
        Row: {
          card_id: string | null
          col: number
          created_at: string | null
          dashboard_id: string | null
          id: string
          parameter_mappings: Json | null
          row: number
          series: number | null
          size_x: number
          size_y: number
          updated_at: string | null
          visualization_settings_override: Json | null
        }
        Insert: {
          card_id?: string | null
          col?: number
          created_at?: string | null
          dashboard_id?: string | null
          id?: string
          parameter_mappings?: Json | null
          row?: number
          series?: number | null
          size_x?: number
          size_y?: number
          updated_at?: string | null
          visualization_settings_override?: Json | null
        }
        Update: {
          card_id?: string | null
          col?: number
          created_at?: string | null
          dashboard_id?: string | null
          id?: string
          parameter_mappings?: Json | null
          row?: number
          series?: number | null
          size_x?: number
          size_y?: number
          updated_at?: string | null
          visualization_settings_override?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "dashboard_cards_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dashboard_cards_dashboard_id_fkey"
            columns: ["dashboard_id"]
            isOneToOne: false
            referencedRelation: "dashboards"
            referencedColumns: ["id"]
          },
        ]
      }
      dashboards: {
        Row: {
          archived: boolean | null
          auto_apply_filters: boolean | null
          cache_ttl: number | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          parameters: Json | null
          refresh_interval_sec: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          archived?: boolean | null
          auto_apply_filters?: boolean | null
          cache_ttl?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          parameters?: Json | null
          refresh_interval_sec?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          archived?: boolean | null
          auto_apply_filters?: boolean | null
          cache_ttl?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          parameters?: Json | null
          refresh_interval_sec?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      deals_normalized: {
        Row: {
          campaign_name: string | null
          contact_email: string | null
          contact_name: string | null
          created_at: string
          deal_amount_total: number | null
          deal_amount_unique: number | null
          deal_closed_at: string | null
          deal_created_at: string | null
          deal_lost_reason_name: string | null
          deal_name: string | null
          deal_source_name: string | null
          deal_stage_id: string | null
          deal_stage_name: string | null
          deal_updated_at: string | null
          hold: boolean | null
          id: string
          interactions: number | null
          last_activity_at: string | null
          last_activity_content: string | null
          organization_name: string | null
          rd_deal_id: string
          sync_job_id: string | null
          updated_at: string
          user_id: string | null
          user_name: string | null
          win: boolean | null
        }
        Insert: {
          campaign_name?: string | null
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string
          deal_amount_total?: number | null
          deal_amount_unique?: number | null
          deal_closed_at?: string | null
          deal_created_at?: string | null
          deal_lost_reason_name?: string | null
          deal_name?: string | null
          deal_source_name?: string | null
          deal_stage_id?: string | null
          deal_stage_name?: string | null
          deal_updated_at?: string | null
          hold?: boolean | null
          id?: string
          interactions?: number | null
          last_activity_at?: string | null
          last_activity_content?: string | null
          organization_name?: string | null
          rd_deal_id: string
          sync_job_id?: string | null
          updated_at?: string
          user_id?: string | null
          user_name?: string | null
          win?: boolean | null
        }
        Update: {
          campaign_name?: string | null
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string
          deal_amount_total?: number | null
          deal_amount_unique?: number | null
          deal_closed_at?: string | null
          deal_created_at?: string | null
          deal_lost_reason_name?: string | null
          deal_name?: string | null
          deal_source_name?: string | null
          deal_stage_id?: string | null
          deal_stage_name?: string | null
          deal_updated_at?: string | null
          hold?: boolean | null
          id?: string
          interactions?: number | null
          last_activity_at?: string | null
          last_activity_content?: string | null
          organization_name?: string | null
          rd_deal_id?: string
          sync_job_id?: string | null
          updated_at?: string
          user_id?: string | null
          user_name?: string | null
          win?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "deals_normalized_sync_job_id_fkey"
            columns: ["sync_job_id"]
            isOneToOne: false
            referencedRelation: "rd_sync_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      rd_deals: {
        Row: {
          created_at: string
          id: string
          processed_data: Json | null
          raw_data: Json | null
          rd_deal_id: string | null
          sync_job_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          processed_data?: Json | null
          raw_data?: Json | null
          rd_deal_id?: string | null
          sync_job_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          processed_data?: Json | null
          raw_data?: Json | null
          rd_deal_id?: string | null
          sync_job_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rd_deals_sync_job_id_fkey"
            columns: ["sync_job_id"]
            isOneToOne: false
            referencedRelation: "rd_sync_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      rd_sync_jobs: {
        Row: {
          created_at: string
          end_date: string | null
          id: string
          last_sync_date: string | null
          start_date: string | null
          status: string
          total_deals: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          id?: string
          last_sync_date?: string | null
          start_date?: string | null
          status?: string
          total_deals?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          end_date?: string | null
          id?: string
          last_sync_date?: string | null
          start_date?: string | null
          status?: string
          total_deals?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      execute_analytics_query: {
        Args: { sql_query: string }
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
