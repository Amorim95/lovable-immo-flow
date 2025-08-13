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
      campaigns: {
        Row: {
          created_at: string
          data_fim: string | null
          data_inicio: string | null
          id: string
          nome: string
          plataforma: Database["public"]["Enums"]["campaign_platform"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_fim?: string | null
          data_inicio?: string | null
          id?: string
          nome: string
          plataforma: Database["public"]["Enums"]["campaign_platform"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_fim?: string | null
          data_inicio?: string | null
          id?: string
          nome?: string
          plataforma?: Database["public"]["Enums"]["campaign_platform"]
          updated_at?: string
        }
        Relationships: []
      }
      companies: {
        Row: {
          created_at: string
          id: string
          logo_url: string | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      company_settings: {
        Row: {
          company_id: string | null
          created_at: string
          custom_domain: string | null
          domain_status: string | null
          domain_verified_at: string | null
          id: string
          logo: string | null
          name: string
          site_about: string | null
          site_address: string | null
          site_description: string | null
          site_email: string | null
          site_facebook: string | null
          site_horario_domingo: string | null
          site_horario_sabado: string | null
          site_horario_semana: string | null
          site_instagram: string | null
          site_observacoes_horario: string | null
          site_phone: string | null
          site_title: string | null
          site_whatsapp: string | null
          ssl_status: string | null
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          custom_domain?: string | null
          domain_status?: string | null
          domain_verified_at?: string | null
          id?: string
          logo?: string | null
          name: string
          site_about?: string | null
          site_address?: string | null
          site_description?: string | null
          site_email?: string | null
          site_facebook?: string | null
          site_horario_domingo?: string | null
          site_horario_sabado?: string | null
          site_horario_semana?: string | null
          site_instagram?: string | null
          site_observacoes_horario?: string | null
          site_phone?: string | null
          site_title?: string | null
          site_whatsapp?: string | null
          ssl_status?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          custom_domain?: string | null
          domain_status?: string | null
          domain_verified_at?: string | null
          id?: string
          logo?: string | null
          name?: string
          site_about?: string | null
          site_address?: string | null
          site_description?: string | null
          site_email?: string | null
          site_facebook?: string | null
          site_horario_domingo?: string | null
          site_horario_sabado?: string | null
          site_horario_semana?: string | null
          site_instagram?: string | null
          site_observacoes_horario?: string | null
          site_phone?: string | null
          site_title?: string | null
          site_whatsapp?: string | null
          ssl_status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      equipes: {
        Row: {
          company_id: string | null
          created_at: string
          id: string
          nome: string
          responsavel_id: string | null
          responsavel_nome: string | null
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          id?: string
          nome: string
          responsavel_id?: string | null
          responsavel_nome?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          id?: string
          nome?: string
          responsavel_id?: string | null
          responsavel_nome?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipes_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      imoveis: {
        Row: {
          aceita_animais: boolean | null
          banheiros: number | null
          closet: boolean | null
          company_id: string | null
          condominio: number | null
          condominio_fechado: boolean | null
          created_at: string
          descricao: string
          endereco: string
          id: string
          iptu: number | null
          localizacao: string
          portao_eletronico: boolean | null
          portaria_24h: boolean | null
          preco: number
          publico: boolean | null
          quartos: number | null
          slug: string | null
          updated_at: string
          user_id: string
          vaga_carro: boolean | null
        }
        Insert: {
          aceita_animais?: boolean | null
          banheiros?: number | null
          closet?: boolean | null
          company_id?: string | null
          condominio?: number | null
          condominio_fechado?: boolean | null
          created_at?: string
          descricao: string
          endereco: string
          id?: string
          iptu?: number | null
          localizacao: string
          portao_eletronico?: boolean | null
          portaria_24h?: boolean | null
          preco: number
          publico?: boolean | null
          quartos?: number | null
          slug?: string | null
          updated_at?: string
          user_id: string
          vaga_carro?: boolean | null
        }
        Update: {
          aceita_animais?: boolean | null
          banheiros?: number | null
          closet?: boolean | null
          company_id?: string | null
          condominio?: number | null
          condominio_fechado?: boolean | null
          created_at?: string
          descricao?: string
          endereco?: string
          id?: string
          iptu?: number | null
          localizacao?: string
          portao_eletronico?: boolean | null
          portaria_24h?: boolean | null
          preco?: number
          publico?: boolean | null
          quartos?: number | null
          slug?: string | null
          updated_at?: string
          user_id?: string
          vaga_carro?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "imoveis_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      imovel_midias: {
        Row: {
          created_at: string
          id: string
          imovel_id: string
          ordem: number | null
          tipo: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          imovel_id: string
          ordem?: number | null
          tipo: string
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          imovel_id?: string
          ordem?: number | null
          tipo?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "imovel_midias_imovel_id_fkey"
            columns: ["imovel_id"]
            isOneToOne: false
            referencedRelation: "imoveis"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          status: Database["public"]["Enums"]["invitation_status"]
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          status?: Database["public"]["Enums"]["invitation_status"]
          token: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          status?: Database["public"]["Enums"]["invitation_status"]
          token?: string
        }
        Relationships: []
      }
      lead_campaign: {
        Row: {
          campaign_id: string
          created_at: string
          id: string
          lead_id: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          id?: string
          lead_id: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          id?: string
          lead_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_campaign_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_campaign_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_queue: {
        Row: {
          assigned_at: string | null
          assigned_to: string | null
          created_at: string
          id: string
          lead_id: string
          status: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_to?: string | null
          created_at?: string
          id?: string
          lead_id: string
          status?: string
        }
        Update: {
          assigned_at?: string | null
          assigned_to?: string | null
          created_at?: string
          id?: string
          lead_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_queue_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_queue_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_tag_relations: {
        Row: {
          created_at: string
          id: string
          lead_id: string
          tag_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lead_id: string
          tag_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lead_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_tag_relations_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_tag_relations_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "lead_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_tags: {
        Row: {
          cor: string | null
          created_at: string
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          cor?: string | null
          created_at?: string
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          cor?: string | null
          created_at?: string
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          atividades: Json | null
          company_id: string | null
          created_at: string
          dados_adicionais: string | null
          etapa: Database["public"]["Enums"]["lead_stage"]
          id: string
          nome: string
          primeiro_contato_whatsapp: string | null
          telefone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          atividades?: Json | null
          company_id?: string | null
          created_at?: string
          dados_adicionais?: string | null
          etapa?: Database["public"]["Enums"]["lead_stage"]
          id?: string
          nome: string
          primeiro_contato_whatsapp?: string | null
          telefone: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          atividades?: Json | null
          company_id?: string | null
          created_at?: string
          dados_adicionais?: string | null
          etapa?: Database["public"]["Enums"]["lead_stage"]
          id?: string
          nome?: string
          primeiro_contato_whatsapp?: string | null
          telefone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      logs: {
        Row: {
          action: string
          company_id: string | null
          created_at: string
          details: Json | null
          entity: string
          entity_id: string | null
          id: string
          user_id: string
        }
        Insert: {
          action: string
          company_id?: string | null
          created_at?: string
          details?: Json | null
          entity: string
          entity_id?: string | null
          id?: string
          user_id: string
        }
        Update: {
          action?: string
          company_id?: string | null
          created_at?: string
          details?: Json | null
          entity?: string
          entity_id?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      metas: {
        Row: {
          ano: number
          company_id: string | null
          created_at: string
          id: string
          mes: number
          meta_conversao: number | null
          meta_leads: number
          meta_vendas: number
          referencia_id: string | null
          tipo: string
          updated_at: string
        }
        Insert: {
          ano: number
          company_id?: string | null
          created_at?: string
          id?: string
          mes: number
          meta_conversao?: number | null
          meta_leads?: number
          meta_vendas?: number
          referencia_id?: string | null
          tipo: string
          updated_at?: string
        }
        Update: {
          ano?: number
          company_id?: string | null
          created_at?: string
          id?: string
          mes?: number
          meta_conversao?: number | null
          meta_leads?: number
          meta_vendas?: number
          referencia_id?: string | null
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "metas_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          can_access_configurations: boolean
          can_invite_users: boolean
          can_manage_leads: boolean
          can_manage_properties: boolean
          can_manage_teams: boolean
          can_view_all_leads: boolean
          can_view_reports: boolean
          created_at: string
          id: string
          is_super_admin: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          can_access_configurations?: boolean
          can_invite_users?: boolean
          can_manage_leads?: boolean
          can_manage_properties?: boolean
          can_manage_teams?: boolean
          can_view_all_leads?: boolean
          can_view_reports?: boolean
          created_at?: string
          id?: string
          is_super_admin?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          can_access_configurations?: boolean
          can_invite_users?: boolean
          can_manage_leads?: boolean
          can_manage_properties?: boolean
          can_manage_teams?: boolean
          can_view_all_leads?: boolean
          can_view_reports?: boolean
          created_at?: string
          id?: string
          is_super_admin?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "permissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          company_id: string | null
          created_at: string
          email: string
          equipe_id: string | null
          has_completed_onboarding: boolean | null
          id: string
          name: string
          password_hash: string
          role: Database["public"]["Enums"]["user_role"]
          status: Database["public"]["Enums"]["user_status"]
          telefone: string | null
          ultimo_lead_recebido: string | null
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          email: string
          equipe_id?: string | null
          has_completed_onboarding?: boolean | null
          id?: string
          name: string
          password_hash: string
          role?: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["user_status"]
          telefone?: string | null
          ultimo_lead_recebido?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          email?: string
          equipe_id?: string | null
          has_completed_onboarding?: boolean | null
          id?: string
          name?: string
          password_hash?: string
          role?: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["user_status"]
          telefone?: string | null
          ultimo_lead_recebido?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_equipe_id_fkey"
            columns: ["equipe_id"]
            isOneToOne: false
            referencedRelation: "equipes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_invite_users: {
        Args: { _user_id: string }
        Returns: boolean
      }
      can_view_all_leads: {
        Args: { _user_id: string }
        Returns: boolean
      }
      crypt_password: {
        Args: { password: string }
        Returns: string
      }
      get_current_user_company_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_next_user_round_robin: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_company_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      is_admin: {
        Args: { _user_id: string }
        Returns: boolean
      }
      is_admin_or_dono: {
        Args: { _user_id: string }
        Returns: boolean
      }
      is_admin_or_owner: {
        Args: { _user_id: string }
        Returns: boolean
      }
      is_super_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      user_role_check: {
        Args: { _user_id: string; _company_id: string }
        Returns: string
      }
      validate_email: {
        Args: { email_input: string }
        Returns: boolean
      }
      verify_password: {
        Args: { password: string; hash: string }
        Returns: boolean
      }
    }
    Enums: {
      campaign_platform:
        | "meta-ads"
        | "google-ads"
        | "indicacao"
        | "manual"
        | "outros"
      invitation_status: "pendente" | "aceito" | "expirado"
      lead_stage:
        | "aguardando-atendimento"
        | "tentativas-contato"
        | "atendeu"
        | "visita"
        | "vendas-fechadas"
        | "em-pausa"
        | "descarte"
      user_role: "admin" | "corretor" | "gestor" | "dono"
      user_status: "ativo" | "inativo" | "pendente"
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
      campaign_platform: [
        "meta-ads",
        "google-ads",
        "indicacao",
        "manual",
        "outros",
      ],
      invitation_status: ["pendente", "aceito", "expirado"],
      lead_stage: [
        "aguardando-atendimento",
        "tentativas-contato",
        "atendeu",
        "visita",
        "vendas-fechadas",
        "em-pausa",
        "descarte",
      ],
      user_role: ["admin", "corretor", "gestor", "dono"],
      user_status: ["ativo", "inativo", "pendente"],
    },
  },
} as const
