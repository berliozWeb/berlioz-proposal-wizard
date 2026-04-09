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
      catalog_import_runs: {
        Row: {
          id: string
          imported_at: string | null
          normalization_summary: Json | null
          published_rows: number | null
          rows_with_missing_images: number | null
          source_file: string | null
          status: string | null
          total_rows: number | null
          warnings: string[] | null
        }
        Insert: {
          id?: string
          imported_at?: string | null
          normalization_summary?: Json | null
          published_rows?: number | null
          rows_with_missing_images?: number | null
          source_file?: string | null
          status?: string | null
          total_rows?: number | null
          warnings?: string[] | null
        }
        Update: {
          id?: string
          imported_at?: string | null
          normalization_summary?: Json | null
          published_rows?: number | null
          rows_with_missing_images?: number | null
          source_file?: string | null
          status?: string | null
          total_rows?: number | null
          warnings?: string[] | null
        }
        Relationships: []
      }
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
      generated_images_cache: {
        Row: {
          generated_at: string | null
          image_url: string
          product_id: string
          prompt_used: string | null
        }
        Insert: {
          generated_at?: string | null
          image_url: string
          product_id: string
          prompt_used?: string | null
        }
        Update: {
          generated_at?: string | null
          image_url?: string
          product_id?: string
          prompt_used?: string | null
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
      product_relations: {
        Row: {
          created_at: string | null
          id: string
          reason: string | null
          related_product_id: string
          relation_type: string
          source_product_id: string
          strength_score: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          reason?: string | null
          related_product_id: string
          relation_type: string
          source_product_id: string
          strength_score?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          reason?: string | null
          related_product_id?: string
          relation_type?: string
          source_product_id?: string
          strength_score?: number | null
        }
        Relationships: []
      }
      productos: {
        Row: {
          activo: boolean | null
          categoria: string | null
          cotizable: boolean | null
          created_at: string | null
          descripcion: string | null
          destacado: boolean | null
          dietary_tags: string[] | null
          id: string
          imagen: string | null
          imagen_url: string | null
          min_qty: number | null
          nombre: string
          orden: number | null
          parent_id: string | null
          precio: number | null
          precio_max: number | null
          precio_min: number | null
          precio_rebajado: number | null
          pricing_model: string | null
          score_comercial: number | null
          score_visual: number | null
          serves_up_to: number | null
          sku: string | null
          texto_busqueda: string | null
          tipo: string | null
          variante_nombre: string | null
          variantes: string | null
        }
        Insert: {
          activo?: boolean | null
          categoria?: string | null
          cotizable?: boolean | null
          created_at?: string | null
          descripcion?: string | null
          destacado?: boolean | null
          dietary_tags?: string[] | null
          id: string
          imagen?: string | null
          imagen_url?: string | null
          min_qty?: number | null
          nombre: string
          orden?: number | null
          parent_id?: string | null
          precio?: number | null
          precio_max?: number | null
          precio_min?: number | null
          precio_rebajado?: number | null
          pricing_model?: string | null
          score_comercial?: number | null
          score_visual?: number | null
          serves_up_to?: number | null
          sku?: string | null
          texto_busqueda?: string | null
          tipo?: string | null
          variante_nombre?: string | null
          variantes?: string | null
        }
        Update: {
          activo?: boolean | null
          categoria?: string | null
          cotizable?: boolean | null
          created_at?: string | null
          descripcion?: string | null
          destacado?: boolean | null
          dietary_tags?: string[] | null
          id?: string
          imagen?: string | null
          imagen_url?: string | null
          min_qty?: number | null
          nombre?: string
          orden?: number | null
          parent_id?: string | null
          precio?: number | null
          precio_max?: number | null
          precio_min?: number | null
          precio_rebajado?: number | null
          pricing_model?: string | null
          score_comercial?: number | null
          score_visual?: number | null
          serves_up_to?: number | null
          sku?: string | null
          texto_busqueda?: string | null
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
      quote_feedback: {
        Row: {
          accepted: boolean | null
          comments: string | null
          created_at: string | null
          id: string
          manual_changes: Json | null
          products_added: string[] | null
          products_removed: string[] | null
          proposal_id: string
          rating: number | null
          selected_tier: string | null
        }
        Insert: {
          accepted?: boolean | null
          comments?: string | null
          created_at?: string | null
          id?: string
          manual_changes?: Json | null
          products_added?: string[] | null
          products_removed?: string[] | null
          proposal_id: string
          rating?: number | null
          selected_tier?: string | null
        }
        Update: {
          accepted?: boolean | null
          comments?: string | null
          created_at?: string | null
          id?: string
          manual_changes?: Json | null
          products_added?: string[] | null
          products_removed?: string[] | null
          proposal_id?: string
          rating?: number | null
          selected_tier?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quote_feedback_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "quote_proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_package_items: {
        Row: {
          computed_price: number
          created_at: string | null
          id: string
          image_prompt: string | null
          image_source: string | null
          image_url: string | null
          metadata_json: Json | null
          package_id: string
          parent_product_id: string | null
          product_id: string | null
          product_name: string
          quantity: number
          recommendation_reason: string | null
          score: number | null
          source_type: string | null
          swap_group: string | null
          unit_price: number
        }
        Insert: {
          computed_price?: number
          created_at?: string | null
          id?: string
          image_prompt?: string | null
          image_source?: string | null
          image_url?: string | null
          metadata_json?: Json | null
          package_id: string
          parent_product_id?: string | null
          product_id?: string | null
          product_name: string
          quantity?: number
          recommendation_reason?: string | null
          score?: number | null
          source_type?: string | null
          swap_group?: string | null
          unit_price?: number
        }
        Update: {
          computed_price?: number
          created_at?: string | null
          id?: string
          image_prompt?: string | null
          image_source?: string | null
          image_url?: string | null
          metadata_json?: Json | null
          package_id?: string
          parent_product_id?: string | null
          product_id?: string | null
          product_name?: string
          quantity?: number
          recommendation_reason?: string | null
          score?: number | null
          source_type?: string | null
          swap_group?: string | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "quote_package_items_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "quote_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_packages: {
        Row: {
          created_at: string | null
          highlights: string[] | null
          id: string
          is_recommended: boolean | null
          iva: number | null
          price_per_person: number | null
          proposal_id: string
          ranking_score: number | null
          recommendation_reason: string | null
          shipping: number | null
          subtotal: number | null
          tagline: string | null
          tier: string
          title: string
          total: number | null
        }
        Insert: {
          created_at?: string | null
          highlights?: string[] | null
          id?: string
          is_recommended?: boolean | null
          iva?: number | null
          price_per_person?: number | null
          proposal_id: string
          ranking_score?: number | null
          recommendation_reason?: string | null
          shipping?: number | null
          subtotal?: number | null
          tagline?: string | null
          tier: string
          title: string
          total?: number | null
        }
        Update: {
          created_at?: string | null
          highlights?: string[] | null
          id?: string
          is_recommended?: boolean | null
          iva?: number | null
          price_per_person?: number | null
          proposal_id?: string
          ranking_score?: number | null
          recommendation_reason?: string | null
          shipping?: number | null
          subtotal?: number | null
          tagline?: string | null
          tier?: string
          title?: string
          total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quote_packages_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "quote_proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_proposals: {
        Row: {
          engine_version: string | null
          fallback_used: boolean | null
          generated_at: string | null
          id: string
          quote_request_id: string
          reasoning_json: Json | null
          recommendation_summary: string | null
          shipping_amount: number | null
          strategy_used: string | null
          tax_amount: number | null
          total_estimated: number | null
        }
        Insert: {
          engine_version?: string | null
          fallback_used?: boolean | null
          generated_at?: string | null
          id?: string
          quote_request_id: string
          reasoning_json?: Json | null
          recommendation_summary?: string | null
          shipping_amount?: number | null
          strategy_used?: string | null
          tax_amount?: number | null
          total_estimated?: number | null
        }
        Update: {
          engine_version?: string | null
          fallback_used?: boolean | null
          generated_at?: string | null
          id?: string
          quote_request_id?: string
          reasoning_json?: Json | null
          recommendation_summary?: string | null
          shipping_amount?: number | null
          strategy_used?: string | null
          tax_amount?: number | null
          total_estimated?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quote_proposals_quote_request_id_fkey"
            columns: ["quote_request_id"]
            isOneToOne: false
            referencedRelation: "quote_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_requests: {
        Row: {
          budget_enabled: boolean | null
          budget_per_person: number | null
          company_name: string | null
          contact_name: string | null
          created_at: string | null
          delivery_time: string | null
          dietary_restrictions: string[] | null
          duration_hours: number | null
          event_date: string | null
          event_time: string | null
          event_type: string
          id: string
          people_count: number
          raw_payload: Json | null
          source_flow: string | null
          status: string | null
          user_id: string | null
          zip_code: string | null
        }
        Insert: {
          budget_enabled?: boolean | null
          budget_per_person?: number | null
          company_name?: string | null
          contact_name?: string | null
          created_at?: string | null
          delivery_time?: string | null
          dietary_restrictions?: string[] | null
          duration_hours?: number | null
          event_date?: string | null
          event_time?: string | null
          event_type: string
          id?: string
          people_count: number
          raw_payload?: Json | null
          source_flow?: string | null
          status?: string | null
          user_id?: string | null
          zip_code?: string | null
        }
        Update: {
          budget_enabled?: boolean | null
          budget_per_person?: number | null
          company_name?: string | null
          contact_name?: string | null
          created_at?: string | null
          delivery_time?: string | null
          dietary_restrictions?: string[] | null
          duration_hours?: number | null
          event_date?: string | null
          event_time?: string | null
          event_type?: string
          id?: string
          people_count?: number
          raw_payload?: Json | null
          source_flow?: string | null
          status?: string | null
          user_id?: string | null
          zip_code?: string | null
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
      popular_products_by_event: {
        Row: {
          avg_people: number | null
          avg_price: number | null
          avg_score: number | null
          event_type: string | null
          product_id: string | null
          product_name: string | null
          tier: string | null
          times_accepted: number | null
          times_included: number | null
          times_selected: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_my_email_domain: { Args: never; Returns: string }
      search_products_for_quote: {
        Args: {
          p_budget_max?: number
          p_categoria?: string
          p_dietary_tags?: string[]
          p_limit?: number
        }
        Returns: {
          categoria: string
          descripcion: string
          destacado: boolean
          dietary_tags: string[]
          id: string
          imagen_url: string
          nombre: string
          parent_id: string
          precio: number
          precio_max: number
          precio_min: number
          pricing_model: string
          score_comercial: number
          score_visual: number
          serves_up_to: number
          tipo: string
          variantes: string
        }[]
      }
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
