export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      kanji_dex: {
        Row: {
          id: string
          kanji: string
          dex_number: number
          meanings: string[]
          on_reading?: string[]
          kun_reading?: string[]
          created_at?: string
        }
        Insert: {
          id?: string
          kanji: string
          dex_number: number
          meanings: string[]
          on_reading?: string[]
          kun_reading?: string[]
          created_at?: string
        }
        Update: {
          id?: string
          kanji?: string
          dex_number?: number
          meanings?: string[]
          on_reading?: string[]
          kun_reading?: string[]
          created_at?: string
        }
      }
      user_kanji: {
        Row: {
          id: string
          user_id: string
          kanji_id: string
          created_at?: string
        }
        Insert: {
          id?: string
          user_id: string
          kanji_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          kanji_id?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
  }
} 