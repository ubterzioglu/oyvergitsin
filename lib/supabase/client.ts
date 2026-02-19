import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      roles: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
      }
      user_roles: {
        Row: {
          id: string
          user_id: string
          role_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          role_id?: string
          created_at?: string
        }
      }
      consent_texts: {
        Row: {
          id: string
          version: number
          text: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          version: number
          text: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          version?: number
          text?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      axis_models: {
        Row: {
          id: string
          name: string
          version: string
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          version: string
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          version?: string
          is_active?: boolean
          created_at?: string
        }
      }
      axes: {
        Row: {
          id: string
          axis_model_id: string
          name: string
          description: string
          slug: string
          order_index: number
          created_at: string
        }
        Insert: {
          id?: string
          axis_model_id: string
          name: string
          description: string
          slug: string
          order_index: number
          created_at?: string
        }
        Update: {
          id?: string
          axis_model_id?: string
          name?: string
          description?: string
          slug?: string
          order_index?: number
          created_at?: string
        }
      }
      parties: {
        Row: {
          id: string
          name: string
          short_name: string
          color: string
          logo_url: string | null
          description: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          short_name: string
          color: string
          logo_url?: string | null
          description: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          short_name?: string
          color?: string
          logo_url?: string | null
          description?: string
          created_at?: string
          updated_at?: string
        }
      }
      party_positions: {
        Row: {
          id: string
          party_id: string
          axis_id: string
          score: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          party_id: string
          axis_id: string
          score: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          party_id?: string
          axis_id?: string
          score?: number
          created_at?: string
          updated_at?: string
        }
      }
      questions: {
        Row: {
          id: string
          text: string
          type: string
          description: string | null
          required: boolean
          order_index: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          text: string
          type: string
          description?: string | null
          required?: boolean
          order_index: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          text?: string
          type?: string
          description?: string | null
          required?: boolean
          order_index?: number
          created_at?: string
          updated_at?: string
        }
      }
      question_options: {
        Row: {
          id: string
          question_id: string
          text: string
          value: string
          order_index: number
          created_at: string
        }
        Insert: {
          id?: string
          question_id: string
          text: string
          value: string
          order_index: number
          created_at?: string
        }
        Update: {
          id?: string
          question_id?: string
          text?: string
          value?: string
          order_index?: number
          created_at?: string
        }
      }
      scoring_rules: {
        Row: {
          id: string
          question_id: string
          answer_value: string
          axis_id: string
          score_modifier: number
          created_at: string
        }
        Insert: {
          id?: string
          question_id: string
          answer_value: string
          axis_id: string
          score_modifier: number
          created_at?: string
        }
        Update: {
          id?: string
          question_id?: string
          answer_value?: string
          axis_id?: string
          score_modifier?: number
          created_at?: string
        }
      }
      sessions: {
        Row: {
          id: string
          user_id: string | null
          ip_hash: string
          device_hash: string
          consent_version: number
          is_guest: boolean
          risk_score: number
          created_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          ip_hash: string
          device_hash: string
          consent_version: number
          is_guest?: boolean
          risk_score?: number
          created_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          ip_hash?: string
          device_hash?: string
          consent_version?: number
          is_guest?: boolean
          risk_score?: number
          created_at?: string
          completed_at?: string | null
        }
      }
      answers: {
        Row: {
          id: string
          session_id: string
          question_id: string
          answer_value: string
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          question_id: string
          answer_value: string
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          question_id?: string
          answer_value?: string
          created_at?: string
        }
      }
      result_snapshots: {
        Row: {
          id: string
          session_id: string
          axis_scores: Record<string, number>
          party_similarities: Record<string, number>
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          axis_scores: Record<string, number>
          party_similarities: Record<string, number>
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          axis_scores?: Record<string, number>
          party_similarities?: Record<string, number>
          created_at?: string
        }
      }
      behavior_events: {
        Row: {
          id: string
          session_id: string
          event_type: string
          event_data: Record<string, any>
          timestamp: string
        }
        Insert: {
          id?: string
          session_id: string
          event_type: string
          event_data: Record<string, any>
          timestamp?: string
        }
        Update: {
          id?: string
          session_id?: string
          event_type?: string
          event_data?: Record<string, any>
          timestamp?: string
        }
      }
    }
  }
}
