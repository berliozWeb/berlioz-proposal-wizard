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
      delivery_addresses: {
        Row: {
          address_text: string
          created_at: string
          id: string
          is_default: boolean
          notes: string | null
          user_id: string
        }
        Insert: {
          address_text: string
          created_at?: string
          id?: string
          is_default?: boolean
          notes?: string | null
          user_id: string
        }
        Update: {
          address_text?: string
          created_at?: string
          id?: string
          is_default?: boolean
          notes?: string | null
          user_id?: string
        }
        Relationships: []
      }
      discount_codes: {
        Row: {
          code: string
          created_at: string | null
          discount_amount: number
          discount_type: string
          expires_at: string | null
          id: string
          is_active: boolean | null
          min_order: number | null
        }
        Insert: {
          code: string
          created_at?: string | null
          discount_amount?: number
          discount_type?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          min_order?: number | null
        }
        Update: {
          code?: string
          created_at?: string | null
          discount_amount?: number
          discount_type?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          min_order?: number | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          order_id: string
          product_name: string
          quantity: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          order_id: string
          product_name: string
          quantity: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          order_id?: string
          product_name?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          delivery_address_id: string | null
          delivery_address_text: string | null
          delivery_date: string
          delivery_slot: string
          discount: number
          discount_code: string | null
          id: string
          invoice_razon_social: string | null
          invoice_rfc: string | null
          invoice_uso_cfdi: string | null
          iva: number
          notes: string | null
          order_number: string
          payment_method: string
          points_earned: number
          rating: number | null
          shipping: number
          status: string
          subtotal: number
          total: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          delivery_address_id?: string | null
          delivery_address_text?: string | null
          delivery_date: string
          delivery_slot: string
          discount?: number
          discount_code?: string | null
          id?: string
          invoice_razon_social?: string | null
          invoice_rfc?: string | null
          invoice_uso_cfdi?: string | null
          iva?: number
          notes?: string | null
          order_number?: string
          payment_method?: string
          points_earned?: number
          rating?: number | null
          shipping?: number
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          delivery_address_id?: string | null
          delivery_address_text?: string | null
          delivery_date?: string
          delivery_slot?: string
          discount?: number
          discount_code?: string | null
          id?: string
          invoice_razon_social?: string | null
          invoice_rfc?: string | null
          invoice_uso_cfdi?: string | null
          iva?: number
          notes?: string | null
          order_number?: string
          payment_method?: string
          points_earned?: number
          rating?: number | null
          shipping?: number
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_delivery_address_id_fkey"
            columns: ["delivery_address_id"]
            isOneToOne: false
            referencedRelation: "delivery_addresses"
            referencedColumns: ["id"]
          },
        ]
      }
      productos: {
        Row: {
          activo: boolean | null
          categoria: string | null
          created_at: string | null
          descripcion: string | null
          destacado: boolean | null
          id: string
          imagen: string | null
          imagen_url: string | null
          nombre: string
          orden: number | null
          parent_id: string | null
          precio: number | null
          precio_max: number | null
          precio_min: number | null
          precio_rebajado: number | null
          sku: string | null
          tipo: string | null
          variante_nombre: string | null
          variantes: string | null
        }
        Insert: {
          activo?: boolean | null
          categoria?: string | null
          created_at?: string | null
          descripcion?: string | null
          destacado?: boolean | null
          id: string
          imagen?: string | null
          imagen_url?: string | null
          nombre: string
          orden?: number | null
          parent_id?: string | null
          precio?: number | null
          precio_max?: number | null
          precio_min?: number | null
          precio_rebajado?: number | null
          sku?: string | null
          tipo?: string | null
          variante_nombre?: string | null
          variantes?: string | null
        }
        Update: {
          activo?: boolean | null
          categoria?: string | null
          created_at?: string | null
          descripcion?: string | null
          destacado?: boolean | null
          id?: string
          imagen?: string | null
          imagen_url?: string | null
          nombre?: string
          orden?: number | null
          parent_id?: string | null
          precio?: number | null
          precio_max?: number | null
          precio_min?: number | null
          precio_rebajado?: number | null
          sku?: string | null
          tipo?: string | null
          variante_nombre?: string | null
          variantes?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          created_at: string | null
          description: string | null
          dietary_tags: string[] | null
          id: string
          image_url: string | null
          included_items: string[] | null
          is_active: boolean | null
          is_bestseller: boolean | null
          name: string
          occasion: string[] | null
          price_per_person: number
          short_description: string | null
          slug: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          dietary_tags?: string[] | null
          id?: string
          image_url?: string | null
          included_items?: string[] | null
          is_active?: boolean | null
          is_bestseller?: boolean | null
          name: string
          occasion?: string[] | null
          price_per_person?: number
          short_description?: string | null
          slug: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          dietary_tags?: string[] | null
          id?: string
          image_url?: string | null
          included_items?: string[] | null
          is_active?: boolean | null
          is_bestseller?: boolean | null
          name?: string
          occasion?: string[] | null
          price_per_person?: number
          short_description?: string | null
          slug?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company_name: string | null
          created_at: string
          email: string | null
          email_domain: string | null
          fiscal_direccion: string | null
          fiscal_razon_social: string | null
          fiscal_regimen: string | null
          fiscal_rfc: string | null
          fiscal_uso_cfdi: string | null
          full_name: string | null
          id: string
          loyalty_points: number
          notification_preferences: Json
          onboarding_complete: boolean
          order_frequency: Database["public"]["Enums"]["order_frequency"] | null
          profile_type: Database["public"]["Enums"]["profile_type"] | null
          referral_code: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          email?: string | null
          email_domain?: string | null
          fiscal_direccion?: string | null
          fiscal_razon_social?: string | null
          fiscal_regimen?: string | null
          fiscal_rfc?: string | null
          fiscal_uso_cfdi?: string | null
          full_name?: string | null
          id: string
          loyalty_points?: number
          notification_preferences?: Json
          onboarding_complete?: boolean
          order_frequency?:
            | Database["public"]["Enums"]["order_frequency"]
            | null
          profile_type?: Database["public"]["Enums"]["profile_type"] | null
          referral_code?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          email?: string | null
          email_domain?: string | null
          fiscal_direccion?: string | null
          fiscal_razon_social?: string | null
          fiscal_regimen?: string | null
          fiscal_rfc?: string | null
          fiscal_uso_cfdi?: string | null
          full_name?: string | null
          id?: string
          loyalty_points?: number
          notification_preferences?: Json
          onboarding_complete?: boolean
          order_frequency?:
            | Database["public"]["Enums"]["order_frequency"]
            | null
          profile_type?: Database["public"]["Enums"]["profile_type"] | null
          referral_code?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      quotes: {
        Row: {
          ai_options: Json | null
          budget_per_person: number | null
          client_name: string | null
          created_at: string | null
          dietary_restrictions: string[] | null
          event_date: string | null
          event_type: string
          id: string
          people_count: number
          selected_option_index: number | null
          status: string
          time_slot: string | null
          total_estimated: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_options?: Json | null
          budget_per_person?: number | null
          client_name?: string | null
          created_at?: string | null
          dietary_restrictions?: string[] | null
          event_date?: string | null
          event_type: string
          id?: string
          people_count: number
          selected_option_index?: number | null
          status?: string
          time_slot?: string | null
          total_estimated?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_options?: Json | null
          budget_per_person?: number | null
          client_name?: string | null
          created_at?: string | null
          dietary_restrictions?: string[] | null
          event_date?: string | null
          event_type?: string
          id?: string
          people_count?: number
          selected_option_index?: number | null
          status?: string
          time_slot?: string | null
          total_estimated?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      scheduled_orders: {
        Row: {
          created_at: string
          day_of_week: number
          delivery_address_id: string | null
          frequency: string
          id: string
          is_active: boolean
          items: Json
          next_delivery_date: string | null
          time_slot: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          day_of_week?: number
          delivery_address_id?: string | null
          frequency?: string
          id?: string
          is_active?: boolean
          items?: Json
          next_delivery_date?: string | null
          time_slot: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          delivery_address_id?: string | null
          frequency?: string
          id?: string
          is_active?: boolean
          items?: Json
          next_delivery_date?: string | null
          time_slot?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_orders_delivery_address_id_fkey"
            columns: ["delivery_address_id"]
            isOneToOne: false
            referencedRelation: "delivery_addresses"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_my_email_domain: { Args: never; Returns: string }
    }
    Enums: {
      order_frequency: "daily" | "weekly" | "monthly" | "occasional"
      profile_type: "company" | "agency" | "personal"
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
      order_frequency: ["daily", "weekly", "monthly", "occasional"],
      profile_type: ["company", "agency", "personal"],
    },
  },
} as const
