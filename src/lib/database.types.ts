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
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          role: 'user' | 'it_team'
          created_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          role?: 'user' | 'it_team'
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          role?: 'user' | 'it_team'
          created_at?: string
        }
      }
      ticket_categories: {
        Row: {
          id: string
          name: string
          description: string
          resolution_time_hours: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string
          resolution_time_hours?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          resolution_time_hours?: number
          created_at?: string
        }
      }
      tickets: {
        Row: {
          id: string
          ticket_number: string
          user_id: string
          category_id: string
          title: string
          description: string
          status: 'new' | 'in_progress' | 'resolved' | 'closed'
          priority: 'low' | 'medium' | 'high' | 'critical'
          assigned_to: string | null
          created_at: string
          updated_at: string
          resolved_at: string | null
          closed_at: string | null
          sla_due_date: string
          sla_breached: boolean
        }
        Insert: {
          id?: string
          ticket_number?: string
          user_id: string
          category_id: string
          title: string
          description: string
          status?: 'new' | 'in_progress' | 'resolved' | 'closed'
          priority?: 'low' | 'medium' | 'high' | 'critical'
          assigned_to?: string | null
          created_at?: string
          updated_at?: string
          resolved_at?: string | null
          closed_at?: string | null
          sla_due_date?: string
          sla_breached?: boolean
        }
        Update: {
          id?: string
          ticket_number?: string
          user_id?: string
          category_id?: string
          title?: string
          description?: string
          status?: 'new' | 'in_progress' | 'resolved' | 'closed'
          priority?: 'low' | 'medium' | 'high' | 'critical'
          assigned_to?: string | null
          created_at?: string
          updated_at?: string
          resolved_at?: string | null
          closed_at?: string | null
          sla_due_date?: string
          sla_breached?: boolean
        }
      }
      ticket_attachments: {
        Row: {
          id: string
          ticket_id: string
          file_name: string
          file_path: string
          file_size: number
          mime_type: string
          uploaded_by: string
          created_at: string
        }
        Insert: {
          id?: string
          ticket_id: string
          file_name: string
          file_path: string
          file_size: number
          mime_type: string
          uploaded_by: string
          created_at?: string
        }
        Update: {
          id?: string
          ticket_id?: string
          file_name?: string
          file_path?: string
          file_size?: number
          mime_type?: string
          uploaded_by?: string
          created_at?: string
        }
      }
      ticket_chat_messages: {
        Row: {
          id: string
          ticket_id: string
          user_id: string
          message: string
          created_at: string
        }
        Insert: {
          id?: string
          ticket_id: string
          user_id: string
          message: string
          created_at?: string
        }
        Update: {
          id?: string
          ticket_id?: string
          user_id?: string
          message?: string
          created_at?: string
        }
      }
      ticket_assignments: {
        Row: {
          id: string
          ticket_id: string
          assigned_to: string
          assigned_by: string
          created_at: string
        }
        Insert: {
          id?: string
          ticket_id: string
          assigned_to: string
          assigned_by: string
          created_at?: string
        }
        Update: {
          id?: string
          ticket_id?: string
          assigned_to?: string
          assigned_by?: string
          created_at?: string
        }
      }
      ticket_feedback: {
        Row: {
          id: string
          ticket_id: string
          user_id: string
          rating: number
          comments: string
          created_at: string
        }
        Insert: {
          id?: string
          ticket_id: string
          user_id: string
          rating: number
          comments?: string
          created_at?: string
        }
        Update: {
          id?: string
          ticket_id?: string
          user_id?: string
          rating?: number
          comments?: string
          created_at?: string
        }
      }
    }
  }
}
