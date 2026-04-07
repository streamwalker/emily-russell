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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      agreement_config: {
        Row: {
          broker_fee_pct: number | null
          client_user_id: string
          id: string
          term_end: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          broker_fee_pct?: number | null
          client_user_id: string
          id?: string
          term_end?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          broker_fee_pct?: number | null
          client_user_id?: string
          id?: string
          term_end?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          created_at: string | null
          duration_ms: number | null
          event_type: string
          id: string
          label: string | null
          page: string | null
          referrer: string | null
          session_id: string | null
          target: string | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string | null
          duration_ms?: number | null
          event_type: string
          id?: string
          label?: string | null
          page?: string | null
          referrer?: string | null
          session_id?: string | null
          target?: string | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string | null
          duration_ms?: number | null
          event_type?: string
          id?: string
          label?: string | null
          page?: string | null
          referrer?: string | null
          session_id?: string | null
          target?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      client_dossiers: {
        Row: {
          created_at: string
          dossier_data: Json
          id: string
          prepared_date: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dossier_data?: Json
          id?: string
          prepared_date?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          dossier_data?: Json
          id?: string
          prepared_date?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_dossiers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      dossier_templates: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          dossier_data: Json
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          dossier_data?: Json
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          dossier_data?: Json
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      property_interactions: {
        Row: {
          comments: string | null
          created_at: string | null
          dossier_id: string | null
          grade: string | null
          id: string
          is_favorite: boolean | null
          preferred_tour_date: string | null
          preferred_tour_time: string | null
          property_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          comments?: string | null
          created_at?: string | null
          dossier_id?: string | null
          grade?: string | null
          id?: string
          is_favorite?: boolean | null
          preferred_tour_date?: string | null
          preferred_tour_time?: string | null
          property_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          comments?: string | null
          created_at?: string | null
          dossier_id?: string | null
          grade?: string | null
          id?: string
          is_favorite?: boolean | null
          preferred_tour_date?: string | null
          preferred_tour_time?: string | null
          property_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      saved_estimates: {
        Row: {
          created_at: string
          down_pct: number
          hoa: number
          id: string
          insurance: number
          offer_price: number
          property_id: string
          rate: number
          tax_rate: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          down_pct?: number
          hoa?: number
          id?: string
          insurance?: number
          offer_price: number
          property_id: string
          rate?: number
          tax_rate?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          down_pct?: number
          hoa?: number
          id?: string
          insurance?: number
          offer_price?: number
          property_id?: string
          rate?: number
          tax_rate?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      signed_agreements: {
        Row: {
          agreement_type: string
          broker_fee_pct: number | null
          client_address: string | null
          client_city_state_zip: string | null
          client_email: string | null
          client_name: string
          client_phone: string | null
          created_at: string | null
          form_data: Json | null
          id: string
          market_area: string | null
          signature_data: string | null
          signature_type: string | null
          signed_at: string
          term_end: string | null
          term_start: string | null
          user_id: string
        }
        Insert: {
          agreement_type?: string
          broker_fee_pct?: number | null
          client_address?: string | null
          client_city_state_zip?: string | null
          client_email?: string | null
          client_name: string
          client_phone?: string | null
          created_at?: string | null
          form_data?: Json | null
          id?: string
          market_area?: string | null
          signature_data?: string | null
          signature_type?: string | null
          signed_at?: string
          term_end?: string | null
          term_start?: string | null
          user_id: string
        }
        Update: {
          agreement_type?: string
          broker_fee_pct?: number | null
          client_address?: string | null
          client_city_state_zip?: string | null
          client_email?: string | null
          client_name?: string
          client_phone?: string | null
          created_at?: string | null
          form_data?: Json | null
          id?: string
          market_area?: string | null
          signature_data?: string | null
          signature_type?: string | null
          signed_at?: string
          term_end?: string | null
          term_start?: string | null
          user_id?: string
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
    }
    Enums: {
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
      app_role: ["admin", "user"],
    },
  },
} as const
