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
