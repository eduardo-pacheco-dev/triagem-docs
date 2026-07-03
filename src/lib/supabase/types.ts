export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      queue_entries: {
        Row: {
          created_at: string
          full_name: string
          id: string
          identifier: string
          position_seq: number
          protocol: string
          request_type: string
          site_id: string
          status: string
          technician_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name: string
          id?: string
          identifier: string
          position_seq?: number
          protocol: string
          request_type: string
          site_id: string
          status?: string
          technician_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          identifier?: string
          position_seq?: number
          protocol?: string
          request_type?: string
          site_id?: string
          status?: string
          technician_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      request_types: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
