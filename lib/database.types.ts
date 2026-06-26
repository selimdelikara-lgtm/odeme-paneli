export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      odemeler: {
        Row: {
          id: number;
          user_id: string;
          proje: string | null;
          tutar: number | null;
          odendi: boolean | null;
          grup: string | null;
          fatura_tarihi: string | null;
          fatura_kesildi: boolean | null;
          kdvli: boolean | null;
          gvkli: boolean | null;
          sira: number | null;
        };
        Insert: {
          id?: number;
          user_id: string;
          proje?: string | null;
          tutar?: number | null;
          odendi?: boolean | null;
          grup?: string | null;
          fatura_tarihi?: string | null;
          fatura_kesildi?: boolean | null;
          kdvli?: boolean | null;
          gvkli?: boolean | null;
          sira?: number | null;
        };
        Update: {
          id?: number;
          user_id?: string;
          proje?: string | null;
          tutar?: number | null;
          odendi?: boolean | null;
          grup?: string | null;
          fatura_tarihi?: string | null;
          fatura_kesildi?: boolean | null;
          kdvli?: boolean | null;
          gvkli?: boolean | null;
          sira?: number | null;
        };
        Relationships: [];
      };
      fatura_ekleri: {
        Row: {
          id: number;
          odeme_id: number;
          user_id: string;
          name: string;
          path: string;
          url: string;
          uploaded_at: string;
          created_at: string;
        };
        Insert: {
          id?: number;
          odeme_id: number;
          user_id: string;
          name: string;
          path: string;
          url: string;
          uploaded_at?: string;
          created_at?: string;
        };
        Update: {
          id?: number;
          odeme_id?: number;
          user_id?: string;
          name?: string;
          path?: string;
          url?: string;
          uploaded_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      security_rate_limits: {
        Row: {
          key: string;
          count: number;
          reset_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          key: string;
          count?: number;
          reset_at: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          key?: string;
          count?: number;
          reset_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          detail: string;
          source: string | null;
          ip: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          detail: string;
          source?: string | null;
          ip?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          detail?: string;
          source?: string | null;
          ip?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      admin_user: {
        Row: {
          id: string;
          user_id: string;
          email: string;
          is_active: boolean;
          created_at: string;
          last_login_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          email: string;
          is_active?: boolean;
          created_at?: string;
          last_login_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          email?: string;
          is_active?: boolean;
          created_at?: string;
          last_login_at?: string | null;
        };
        Relationships: [];
      };
      admin_audit_logs: {
        Row: {
          id: string;
          action: string;
          entity_type: string;
          entity_id: string | null;
          old_value: Json | null;
          new_value: Json | null;
          admin_user_id: string | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          old_value?: Json | null;
          new_value?: Json | null;
          admin_user_id?: string | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          action?: string;
          entity_type?: string;
          entity_id?: string | null;
          old_value?: Json | null;
          new_value?: Json | null;
          admin_user_id?: string | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      traffic_events: {
        Row: {
          id: string;
          path: string;
          referrer: string | null;
          device_type: string | null;
          browser: string | null;
          country: string | null;
          city: string | null;
          ip_hash: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          path: string;
          referrer?: string | null;
          device_type?: string | null;
          browser?: string | null;
          country?: string | null;
          city?: string | null;
          ip_hash?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          path?: string;
          referrer?: string | null;
          device_type?: string | null;
          browser?: string | null;
          country?: string | null;
          city?: string | null;
          ip_hash?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      admin_user_status: {
        Row: {
          user_id: string;
          is_active: boolean;
          note: string | null;
          updated_by: string | null;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          is_active?: boolean;
          note?: string | null;
          updated_by?: string | null;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          is_active?: boolean;
          note?: string | null;
          updated_by?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      system_settings: {
        Row: {
          key: string;
          value: Json;
          updated_by: string | null;
          updated_at: string;
        };
        Insert: {
          key: string;
          value?: Json;
          updated_by?: string | null;
          updated_at?: string;
        };
        Update: {
          key?: string;
          value?: Json;
          updated_by?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      contact_messages: {
        Row: {
          id: string;
          name: string;
          email: string;
          subject: string;
          message: string;
          status: "new" | "reviewed" | "resolved" | "archived";
          admin_note: string | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          subject: string;
          message: string;
          status?: "new" | "reviewed" | "resolved" | "archived";
          admin_note?: string | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          subject?: string;
          message?: string;
          status?: "new" | "reviewed" | "resolved" | "archived";
          admin_note?: string | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      contact_message_replies: {
        Row: {
          id: string;
          contact_message_id: string;
          admin_user_id: string | null;
          email: string;
          subject: string;
          message: string;
          provider: string;
          provider_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          contact_message_id: string;
          admin_user_id?: string | null;
          email: string;
          subject: string;
          message: string;
          provider?: string;
          provider_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          contact_message_id?: string;
          admin_user_id?: string | null;
          email?: string;
          subject?: string;
          message?: string;
          provider?: string;
          provider_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "contact_message_replies_contact_message_id_fkey";
            columns: ["contact_message_id"];
            referencedRelation: "contact_messages";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "contact_message_replies_admin_user_id_fkey";
            columns: ["admin_user_id"];
            referencedRelation: "admin_user";
            referencedColumns: ["id"];
          },
        ];
      };
      user_sessions: {
        Row: {
          id: string;
          user_id: string;
          device_id: string;
          user_agent: string | null;
          ip: string | null;
          created_at: string;
          last_seen_at: string;
          expires_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          device_id: string;
          user_agent?: string | null;
          ip?: string | null;
          created_at?: string;
          last_seen_at?: string;
          expires_at: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          device_id?: string;
          user_agent?: string | null;
          ip?: string | null;
          created_at?: string;
          last_seen_at?: string;
          expires_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type OdemeRow = Database["public"]["Tables"]["odemeler"]["Row"];
export type OdemeInsert = Database["public"]["Tables"]["odemeler"]["Insert"];
export type OdemeUpdate = Database["public"]["Tables"]["odemeler"]["Update"];
export type FaturaEkiRow = Database["public"]["Tables"]["fatura_ekleri"]["Row"];
export type FaturaEkiInsert = Database["public"]["Tables"]["fatura_ekleri"]["Insert"];
