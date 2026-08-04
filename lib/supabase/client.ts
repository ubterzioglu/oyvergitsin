import { createClient } from '@supabase/supabase-js'
import { getSupabaseConfigError } from '@/lib/supabase/config'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

const configError = getSupabaseConfigError(supabaseUrl, supabaseAnonKey)
if (configError && process.env.NODE_ENV !== 'production') {
  console.warn(`[Supabase config] ${configError}`)
}

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
          short_name: string | null
          color: string
          logo_url: string | null
          description: string | null
          registry_external_id: string | null
          canonical_slug: string | null
          official_name: string | null
          display_name: string | null
          registry_status: string
          match_status: string
          founded_on: string | null
          dissolved_on: string | null
          official_website_url: string | null
          registry_checked_at: string | null
          source_confidence: string
          metadata: Record<string, any>
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          short_name?: string | null
          color: string
          logo_url?: string | null
          description?: string | null
          registry_external_id?: string | null
          canonical_slug?: string | null
          official_name?: string | null
          display_name?: string | null
          registry_status?: string
          match_status?: string
          founded_on?: string | null
          dissolved_on?: string | null
          official_website_url?: string | null
          registry_checked_at?: string | null
          source_confidence?: string
          metadata?: Record<string, any>
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          short_name?: string | null
          color?: string
          logo_url?: string | null
          description?: string | null
          registry_external_id?: string | null
          canonical_slug?: string | null
          official_name?: string | null
          display_name?: string | null
          registry_status?: string
          match_status?: string
          founded_on?: string | null
          dissolved_on?: string | null
          official_website_url?: string | null
          registry_checked_at?: string | null
          source_confidence?: string
          metadata?: Record<string, any>
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
      news_sources: {
        Row: {
          id: string
          name: string
          source_type: string
          endpoint_url: string
          website_url: string | null
          language: string | null
          country: string | null
          category_default: string | null
          trust_level: string
          is_enabled: boolean
          terms_checked: boolean
          terms_checked_at: string | null
          terms_notes: string | null
          max_items_per_scan: number
          timeout_ms: number
          last_success_at: string | null
          last_error_at: string | null
          last_error_message: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          source_type: string
          endpoint_url: string
          website_url?: string | null
          language?: string | null
          country?: string | null
          category_default?: string | null
          trust_level?: string
          is_enabled?: boolean
          terms_checked?: boolean
          terms_checked_at?: string | null
          terms_notes?: string | null
          max_items_per_scan?: number
          timeout_ms?: number
          last_success_at?: string | null
          last_error_at?: string | null
          last_error_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          source_type?: string
          endpoint_url?: string
          website_url?: string | null
          language?: string | null
          country?: string | null
          category_default?: string | null
          trust_level?: string
          is_enabled?: boolean
          terms_checked?: boolean
          terms_checked_at?: string | null
          terms_notes?: string | null
          max_items_per_scan?: number
          timeout_ms?: number
          last_success_at?: string | null
          last_error_at?: string | null
          last_error_message?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      news_scan_runs: {
        Row: {
          id: string
          trigger_type: string
          status: string
          started_at: string
          completed_at: string | null
          started_by: string | null
          source_count: number
          fetched_count: number
          inserted_count: number
          duplicate_count: number
          filtered_count: number
          failed_source_count: number
          error_message: string | null
          created_at: string
        }
        Insert: {
          id?: string
          trigger_type: string
          status: string
          started_at?: string
          completed_at?: string | null
          started_by?: string | null
          source_count?: number
          fetched_count?: number
          inserted_count?: number
          duplicate_count?: number
          filtered_count?: number
          failed_source_count?: number
          error_message?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          trigger_type?: string
          status?: string
          started_at?: string
          completed_at?: string | null
          started_by?: string | null
          source_count?: number
          fetched_count?: number
          inserted_count?: number
          duplicate_count?: number
          filtered_count?: number
          failed_source_count?: number
          error_message?: string | null
          created_at?: string
        }
      }
      news_candidates: {
        Row: {
          id: string
          source_id: string
          scan_run_id: string | null
          source_name: string
          source_url: string | null
          original_url: string
          canonical_url: string
          title: string
          normalized_title: string
          summary: string | null
          image_source_url: string | null
          category: string | null
          language: string | null
          country: string | null
          published_at: string | null
          relevance_score: number
          relevance_reasons: RelevanceReason[]
          canonical_url_hash: string
          content_hash: string
          review_status: string
          approved_news_post_id: string | null
          duplicate_of_candidate_id: string | null
          reviewed_by: string | null
          reviewed_at: string | null
          review_note: string | null
          raw_payload: Record<string, any>
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          source_id: string
          scan_run_id?: string | null
          source_name: string
          source_url?: string | null
          original_url: string
          canonical_url: string
          title: string
          normalized_title: string
          summary?: string | null
          image_source_url?: string | null
          category?: string | null
          language?: string | null
          country?: string | null
          published_at?: string | null
          relevance_score?: number
          relevance_reasons?: RelevanceReason[]
          canonical_url_hash: string
          content_hash: string
          review_status?: string
          approved_news_post_id?: string | null
          duplicate_of_candidate_id?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          review_note?: string | null
          raw_payload?: Record<string, any>
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          source_id?: string
          scan_run_id?: string | null
          source_name?: string
          source_url?: string | null
          original_url?: string
          canonical_url?: string
          title?: string
          normalized_title?: string
          summary?: string | null
          image_source_url?: string | null
          category?: string | null
          language?: string | null
          country?: string | null
          published_at?: string | null
          relevance_score?: number
          relevance_reasons?: RelevanceReason[]
          canonical_url_hash?: string
          content_hash?: string
          review_status?: string
          approved_news_post_id?: string | null
          duplicate_of_candidate_id?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          review_note?: string | null
          raw_payload?: Record<string, any>
          created_at?: string
          updated_at?: string
        }
      }
      news_review_logs: {
        Row: {
          id: string
          candidate_id: string
          action: string
          actor_user_id: string | null
          note: string | null
          created_at: string
        }
        Insert: {
          id?: string
          candidate_id: string
          action: string
          actor_user_id?: string | null
          note?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          candidate_id?: string
          action?: string
          actor_user_id?: string | null
          note?: string | null
          created_at?: string
        }
      }
      news_keywords: {
        Row: {
          id: string
          keyword: string
          language: string
          category: string | null
          weight: number
          is_negative: boolean
          is_enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          keyword: string
          language: string
          category?: string | null
          weight?: number
          is_negative?: boolean
          is_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          keyword?: string
          language?: string
          category?: string | null
          weight?: number
          is_negative?: boolean
          is_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      news_posts: {
        Row: {
          id: string
          title: string
          summary: string | null
          source_name: string
          source_url: string | null
          original_url: string
          image_url: string | null
          category: string | null
          language: string | null
          country: string | null
          published_at: string | null
          status: string
          radar_candidate_id: string | null
          approved_by: string | null
          approved_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          summary?: string | null
          source_name: string
          source_url?: string | null
          original_url: string
          image_url?: string | null
          category?: string | null
          language?: string | null
          country?: string | null
          published_at?: string | null
          status?: string
          radar_candidate_id?: string | null
          approved_by?: string | null
          approved_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          summary?: string | null
          source_name?: string
          source_url?: string | null
          original_url?: string
          image_url?: string | null
          category?: string | null
          language?: string | null
          country?: string | null
          published_at?: string | null
          status?: string
          radar_candidate_id?: string | null
          approved_by?: string | null
          approved_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

export interface RelevanceReason {
  rule: string
  value?: string
  score: number
}
