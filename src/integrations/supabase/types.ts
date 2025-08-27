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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      connections: {
        Row: {
          countries: Json
          created_at: string | null
          custom_domain: string | null
          domain_verified: boolean | null
          id: string
          name: string
          pixel_access_token: string
          pixel_id: string
          ssl_enabled: boolean | null
          submission_link: string | null
          updated_at: string | null
          use_custom_domain: boolean | null
          user_id: string
        }
        Insert: {
          countries?: Json
          created_at?: string | null
          custom_domain?: string | null
          domain_verified?: boolean | null
          id?: string
          name: string
          pixel_access_token: string
          pixel_id: string
          ssl_enabled?: boolean | null
          submission_link?: string | null
          updated_at?: string | null
          use_custom_domain?: boolean | null
          user_id: string
        }
        Update: {
          countries?: Json
          created_at?: string | null
          custom_domain?: string | null
          domain_verified?: boolean | null
          id?: string
          name?: string
          pixel_access_token?: string
          pixel_id?: string
          ssl_enabled?: boolean | null
          submission_link?: string | null
          updated_at?: string | null
          use_custom_domain?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      opt_in_settings: {
        Row: {
          created_at: string | null
          font_family: string | null
          form_title: string | null
          id: string
          logo_url: string | null
          page_subtitle: string | null
          page_title: string | null
          primary_color: string | null
          secondary_color: string | null
          submit_button_text: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          font_family?: string | null
          form_title?: string | null
          id?: string
          logo_url?: string | null
          page_subtitle?: string | null
          page_title?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          submit_button_text?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          font_family?: string | null
          form_title?: string | null
          id?: string
          logo_url?: string | null
          page_subtitle?: string | null
          page_title?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          submit_button_text?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_id: string
          billing_address: Json | null
          created_at: string | null
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          system_currency: Database["public"]["Enums"]["currency_type"] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_id?: string
          billing_address?: Json | null
          created_at?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          system_currency?: Database["public"]["Enums"]["currency_type"] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_id?: string
          billing_address?: Json | null
          created_at?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          system_currency?: Database["public"]["Enums"]["currency_type"] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      submissions: {
        Row: {
          connection_id: string
          country: string
          created_at: string | null
          deposit_amount: number
          email: string
          first_name: string
          id: string
          last_name: string
          meta_response: Json | null
          phone: string
          status: Database["public"]["Enums"]["submission_status"] | null
          submitted_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          connection_id: string
          country: string
          created_at?: string | null
          deposit_amount: number
          email: string
          first_name: string
          id?: string
          last_name: string
          meta_response?: Json | null
          phone: string
          status?: Database["public"]["Enums"]["submission_status"] | null
          submitted_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          connection_id?: string
          country?: string
          created_at?: string | null
          deposit_amount?: number
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          meta_response?: Json | null
          phone?: string
          status?: Database["public"]["Enums"]["submission_status"] | null
          submitted_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "submissions_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "connections"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      currency_type: "EUR" | "USD"
      submission_status: "pending" | "submitted" | "failed"
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
      currency_type: ["EUR", "USD"],
      submission_status: ["pending", "submitted", "failed"],
    },
  },
} as const
