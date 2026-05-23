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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      academic_years: {
        Row: {
          created_at: string
          end_date: string
          id: string
          institution_id: string | null
          is_current: boolean
          name: string
          start_date: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          institution_id?: string | null
          is_current?: boolean
          name: string
          start_date: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          institution_id?: string | null
          is_current?: boolean
          name?: string
          start_date?: string
        }
        Relationships: []
      }
      admissions: {
        Row: {
          academic_year: string | null
          application_no: string
          applied_at: string
          applied_grade: string | null
          created_at: string
          created_by: string | null
          dob: string | null
          documents_status: string | null
          email: string | null
          full_name: string
          gender: string | null
          id: string
          merit_score: number | null
          meta: Json
          phone: string | null
          status: string
          updated_at: string
        }
        Insert: {
          academic_year?: string | null
          application_no: string
          applied_at?: string
          applied_grade?: string | null
          created_at?: string
          created_by?: string | null
          dob?: string | null
          documents_status?: string | null
          email?: string | null
          full_name: string
          gender?: string | null
          id?: string
          merit_score?: number | null
          meta?: Json
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          academic_year?: string | null
          application_no?: string
          applied_at?: string
          applied_grade?: string | null
          created_at?: string
          created_by?: string | null
          dob?: string | null
          documents_status?: string | null
          email?: string | null
          full_name?: string
          gender?: string | null
          id?: string
          merit_score?: number | null
          meta?: Json
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      appraisals: {
        Row: {
          comments: string | null
          completed_at: string | null
          created_at: string
          id: string
          overall_rating: number | null
          review_period: string
          reviewer_id: string | null
          staff_id: string | null
          status: string
          submitted_at: string | null
        }
        Insert: {
          comments?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          overall_rating?: number | null
          review_period: string
          reviewer_id?: string | null
          staff_id?: string | null
          status?: string
          submitted_at?: string | null
        }
        Update: {
          comments?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          overall_rating?: number | null
          review_period?: string
          reviewer_id?: string | null
          staff_id?: string | null
          status?: string
          submitted_at?: string | null
        }
        Relationships: []
      }
      assignments: {
        Row: {
          class_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          max_marks: number | null
          status: string
          subject_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          class_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          max_marks?: number | null
          status?: string
          subject_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          class_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          max_marks?: number | null
          status?: string
          subject_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      attendance: {
        Row: {
          class_id: string | null
          created_at: string
          date: string
          id: string
          marked_by: string | null
          period: string | null
          remarks: string | null
          status: string
          student_id: string
        }
        Insert: {
          class_id?: string | null
          created_at?: string
          date: string
          id?: string
          marked_by?: string | null
          period?: string | null
          remarks?: string | null
          status?: string
          student_id: string
        }
        Update: {
          class_id?: string | null
          created_at?: string
          date?: string
          id?: string
          marked_by?: string | null
          period?: string | null
          remarks?: string | null
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_register"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_register"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          actor: string | null
          created_at: string
          entity: string | null
          entity_id: string | null
          id: string
          metadata: Json | null
        }
        Insert: {
          action: string
          actor?: string | null
          created_at?: string
          entity?: string | null
          entity_id?: string | null
          id?: string
          metadata?: Json | null
        }
        Update: {
          action?: string
          actor?: string | null
          created_at?: string
          entity?: string | null
          entity_id?: string | null
          id?: string
          metadata?: Json | null
        }
        Relationships: []
      }
      candidates: {
        Row: {
          applied_at: string
          created_at: string
          email: string | null
          id: string
          job_opening_id: string | null
          name: string
          notes: string | null
          phone: string | null
          status: string
        }
        Insert: {
          applied_at?: string
          created_at?: string
          email?: string | null
          id?: string
          job_opening_id?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          status?: string
        }
        Update: {
          applied_at?: string
          created_at?: string
          email?: string | null
          id?: string
          job_opening_id?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidates_job_opening_id_fkey"
            columns: ["job_opening_id"]
            isOneToOne: false
            referencedRelation: "job_openings"
            referencedColumns: ["id"]
          },
        ]
      }
      certificate_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          comments: string | null
          created_at: string
          id: string
          issued_at: string | null
          purpose: string | null
          qr_token: string
          revoke_reason: string | null
          revoked_at: string | null
          status: string
          student_id: string
          template_id: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          comments?: string | null
          created_at?: string
          id?: string
          issued_at?: string | null
          purpose?: string | null
          qr_token?: string
          revoke_reason?: string | null
          revoked_at?: string | null
          status?: string
          student_id: string
          template_id: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          comments?: string | null
          created_at?: string
          id?: string
          issued_at?: string | null
          purpose?: string | null
          qr_token?: string
          revoke_reason?: string | null
          revoked_at?: string | null
          status?: string
          student_id?: string
          template_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificate_requests_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_register"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificate_requests_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_register"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "certificate_requests_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificate_requests_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "certificate_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      certificate_templates: {
        Row: {
          active: boolean
          body: string | null
          code: string | null
          created_at: string
          id: string
          institution_id: string | null
          name: string
          status: string | null
          template_html: string | null
          variables: Json
        }
        Insert: {
          active?: boolean
          body?: string | null
          code?: string | null
          created_at?: string
          id?: string
          institution_id?: string | null
          name: string
          status?: string | null
          template_html?: string | null
          variables?: Json
        }
        Update: {
          active?: boolean
          body?: string | null
          code?: string | null
          created_at?: string
          id?: string
          institution_id?: string | null
          name?: string
          status?: string | null
          template_html?: string | null
          variables?: Json
        }
        Relationships: []
      }
      certificates: {
        Row: {
          certificate_no: string | null
          content_snapshot: string | null
          created_at: string
          id: string
          issued_by: string | null
          issued_on: string
          meta: Json
          qr_token: string | null
          request_id: string | null
          status: string
          student_id: string | null
          template_id: string | null
          verification_code: string | null
        }
        Insert: {
          certificate_no?: string | null
          content_snapshot?: string | null
          created_at?: string
          id?: string
          issued_by?: string | null
          issued_on?: string
          meta?: Json
          qr_token?: string | null
          request_id?: string | null
          status?: string
          student_id?: string | null
          template_id?: string | null
          verification_code?: string | null
        }
        Update: {
          certificate_no?: string | null
          content_snapshot?: string | null
          created_at?: string
          id?: string
          issued_by?: string | null
          issued_on?: string
          meta?: Json
          qr_token?: string | null
          request_id?: string | null
          status?: string
          student_id?: string | null
          template_id?: string | null
          verification_code?: string | null
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          attachments: Json
          created_at: string
          id: string
          message: string
          sender_id: string | null
          thread_id: string
        }
        Insert: {
          attachments?: Json
          created_at?: string
          id?: string
          message: string
          sender_id?: string | null
          thread_id: string
        }
        Update: {
          attachments?: Json
          created_at?: string
          id?: string
          message?: string
          sender_id?: string | null
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "chat_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_threads: {
        Row: {
          created_at: string
          id: string
          meta: Json
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          meta?: Json
          title: string
          type?: string
        }
        Update: {
          created_at?: string
          id?: string
          meta?: Json
          title?: string
          type?: string
        }
        Relationships: []
      }
      class_levels: {
        Row: {
          code: string | null
          created_at: string
          id: string
          institution_id: string | null
          label: string | null
          name: string
          sort_order: number | null
        }
        Insert: {
          code?: string | null
          created_at?: string
          id?: string
          institution_id?: string | null
          label?: string | null
          name: string
          sort_order?: number | null
        }
        Update: {
          code?: string | null
          created_at?: string
          id?: string
          institution_id?: string | null
          label?: string | null
          name?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      classes: {
        Row: {
          academic_year_id: string | null
          capacity: number
          class_teacher: string | null
          created_at: string
          grade: string
          id: string
          section: string
          stream: string | null
        }
        Insert: {
          academic_year_id?: string | null
          capacity?: number
          class_teacher?: string | null
          created_at?: string
          grade: string
          id?: string
          section?: string
          stream?: string | null
        }
        Update: {
          academic_year_id?: string | null
          capacity?: number
          class_teacher?: string | null
          created_at?: string
          grade?: string
          id?: string
          section?: string
          stream?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "classes_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollments: {
        Row: {
          academic_year_id: string | null
          class_id: string
          class_level_id: string | null
          created_at: string
          grade_label: string | null
          id: string
          roll_no: string | null
          roll_number: string | null
          section_label: string | null
          status: string
          stream: string | null
          student_id: string
        }
        Insert: {
          academic_year_id?: string | null
          class_id: string
          class_level_id?: string | null
          created_at?: string
          grade_label?: string | null
          id?: string
          roll_no?: string | null
          roll_number?: string | null
          section_label?: string | null
          status?: string
          stream?: string | null
          student_id: string
        }
        Update: {
          academic_year_id?: string | null
          class_id?: string
          class_level_id?: string | null
          created_at?: string
          grade_label?: string | null
          id?: string
          roll_no?: string | null
          roll_number?: string | null
          section_label?: string | null
          status?: string
          stream?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_class_level_id_fkey"
            columns: ["class_level_id"]
            isOneToOne: false
            referencedRelation: "class_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_register"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_register"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_marks: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          entered_by: string | null
          exam_id: string | null
          grade: string | null
          id: string
          marks_obtained: number | null
          moderated_at: string | null
          moderated_by: string | null
          remarks: string | null
          status: string
          student_id: string | null
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          entered_by?: string | null
          exam_id?: string | null
          grade?: string | null
          id?: string
          marks_obtained?: number | null
          moderated_at?: string | null
          moderated_by?: string | null
          remarks?: string | null
          status?: string
          student_id?: string | null
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          entered_by?: string | null
          exam_id?: string | null
          grade?: string | null
          id?: string
          marks_obtained?: number | null
          moderated_at?: string | null
          moderated_by?: string | null
          remarks?: string | null
          status?: string
          student_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_marks_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exam_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_schedules: {
        Row: {
          class_id: string | null
          created_at: string
          created_by: string | null
          date: string | null
          description: string | null
          end_time: string | null
          exam_date: string | null
          exam_type: string | null
          grade: string | null
          id: string
          instructions: string | null
          max_marks: number | null
          pass_marks: number | null
          passing_marks: number | null
          room: string | null
          section: string | null
          start_time: string | null
          status: string
          subject: string | null
          subject_id: string | null
          title: string
          total_marks: number | null
          updated_at: string
        }
        Insert: {
          class_id?: string | null
          created_at?: string
          created_by?: string | null
          date?: string | null
          description?: string | null
          end_time?: string | null
          exam_date?: string | null
          exam_type?: string | null
          grade?: string | null
          id?: string
          instructions?: string | null
          max_marks?: number | null
          pass_marks?: number | null
          passing_marks?: number | null
          room?: string | null
          section?: string | null
          start_time?: string | null
          status?: string
          subject?: string | null
          subject_id?: string | null
          title: string
          total_marks?: number | null
          updated_at?: string
        }
        Update: {
          class_id?: string | null
          created_at?: string
          created_by?: string | null
          date?: string | null
          description?: string | null
          end_time?: string | null
          exam_date?: string | null
          exam_type?: string | null
          grade?: string | null
          id?: string
          instructions?: string | null
          max_marks?: number | null
          pass_marks?: number | null
          passing_marks?: number | null
          room?: string | null
          section?: string | null
          start_time?: string | null
          status?: string
          subject?: string | null
          subject_id?: string | null
          title?: string
          total_marks?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      fee_categories: {
        Row: {
          code: string | null
          created_at: string
          description: string | null
          id: string
          institution_id: string | null
          name: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          description?: string | null
          id?: string
          institution_id?: string | null
          name: string
        }
        Update: {
          code?: string | null
          created_at?: string
          description?: string | null
          id?: string
          institution_id?: string | null
          name?: string
        }
        Relationships: []
      }
      fee_concessions: {
        Row: {
          amount: number
          approved_by: string | null
          created_at: string
          id: string
          invoice_id: string | null
          reason: string | null
          student_id: string | null
          type: string
          updated_at: string
        }
        Insert: {
          amount?: number
          approved_by?: string | null
          created_at?: string
          id?: string
          invoice_id?: string | null
          reason?: string | null
          student_id?: string | null
          type?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          approved_by?: string | null
          created_at?: string
          id?: string
          invoice_id?: string | null
          reason?: string | null
          student_id?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      fee_invoices: {
        Row: {
          amount: number
          amount_paid: number
          created_at: string
          due_date: string | null
          fee_structure_id: string | null
          id: string
          invoice_no: string
          status: string
          student_id: string
        }
        Insert: {
          amount: number
          amount_paid?: number
          created_at?: string
          due_date?: string | null
          fee_structure_id?: string | null
          id?: string
          invoice_no: string
          status?: string
          student_id: string
        }
        Update: {
          amount?: number
          amount_paid?: number
          created_at?: string
          due_date?: string | null
          fee_structure_id?: string | null
          id?: string
          invoice_no?: string
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fee_invoices_fee_structure_id_fkey"
            columns: ["fee_structure_id"]
            isOneToOne: false
            referencedRelation: "fee_structures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_invoices_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_register"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_invoices_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_register"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "fee_invoices_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_payments: {
        Row: {
          academic_year_id: string | null
          amount: number | null
          amount_paid: number | null
          created_by: string | null
          fee_category_id: string | null
          id: string
          institution_id: string | null
          invoice_id: string | null
          meta: Json
          method: string
          paid_at: string
          payment_date: string | null
          payment_method: string | null
          receipt_no: string | null
          received_by: string | null
          reference: string | null
          status: string | null
          student_id: string | null
          transaction_reference: string | null
          updated_at: string
        }
        Insert: {
          academic_year_id?: string | null
          amount?: number | null
          amount_paid?: number | null
          created_by?: string | null
          fee_category_id?: string | null
          id?: string
          institution_id?: string | null
          invoice_id?: string | null
          meta?: Json
          method?: string
          paid_at?: string
          payment_date?: string | null
          payment_method?: string | null
          receipt_no?: string | null
          received_by?: string | null
          reference?: string | null
          status?: string | null
          student_id?: string | null
          transaction_reference?: string | null
          updated_at?: string
        }
        Update: {
          academic_year_id?: string | null
          amount?: number | null
          amount_paid?: number | null
          created_by?: string | null
          fee_category_id?: string | null
          id?: string
          institution_id?: string | null
          invoice_id?: string | null
          meta?: Json
          method?: string
          paid_at?: string
          payment_date?: string | null
          payment_method?: string | null
          receipt_no?: string | null
          received_by?: string | null
          reference?: string | null
          status?: string | null
          student_id?: string | null
          transaction_reference?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fee_payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "fee_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_reminders: {
        Row: {
          channel: string
          id: string
          invoice_ids: string[]
          sent_at: string
          sent_by: string | null
          status: string
          student_id: string | null
          total_due: number
        }
        Insert: {
          channel?: string
          id?: string
          invoice_ids?: string[]
          sent_at?: string
          sent_by?: string | null
          status?: string
          student_id?: string | null
          total_due?: number
        }
        Update: {
          channel?: string
          id?: string
          invoice_ids?: string[]
          sent_at?: string
          sent_by?: string | null
          status?: string
          student_id?: string | null
          total_due?: number
        }
        Relationships: []
      }
      fee_structures: {
        Row: {
          academic_year_id: string | null
          amount: number
          class_level_id: string | null
          created_at: string
          due_date: string | null
          due_day: number | null
          fee_category_id: string | null
          frequency: string
          grade: string | null
          id: string
          institution_id: string | null
          meta: Json
          name: string | null
        }
        Insert: {
          academic_year_id?: string | null
          amount?: number
          class_level_id?: string | null
          created_at?: string
          due_date?: string | null
          due_day?: number | null
          fee_category_id?: string | null
          frequency?: string
          grade?: string | null
          id?: string
          institution_id?: string | null
          meta?: Json
          name?: string | null
        }
        Update: {
          academic_year_id?: string | null
          amount?: number
          class_level_id?: string | null
          created_at?: string
          due_date?: string | null
          due_day?: number | null
          fee_category_id?: string | null
          frequency?: string
          grade?: string | null
          id?: string
          institution_id?: string | null
          meta?: Json
          name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fee_structures_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_structures_class_level_id_fkey"
            columns: ["class_level_id"]
            isOneToOne: false
            referencedRelation: "class_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_structures_fee_category_id_fkey"
            columns: ["fee_category_id"]
            isOneToOne: false
            referencedRelation: "fee_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      hostel_allocations: {
        Row: {
          allocated_on: string
          id: string
          room_id: string
          status: string
          student_id: string
          vacated_on: string | null
        }
        Insert: {
          allocated_on?: string
          id?: string
          room_id: string
          status?: string
          student_id: string
          vacated_on?: string | null
        }
        Update: {
          allocated_on?: string
          id?: string
          room_id?: string
          status?: string
          student_id?: string
          vacated_on?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hostel_allocations_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "hostel_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hostel_allocations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_register"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hostel_allocations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_register"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "hostel_allocations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      hostel_rooms: {
        Row: {
          block: string
          capacity: number
          created_at: string
          hostel_id: string | null
          id: string
          occupied: number
          room_no: string
          room_number: string | null
          room_type: string | null
        }
        Insert: {
          block: string
          capacity?: number
          created_at?: string
          hostel_id?: string | null
          id?: string
          occupied?: number
          room_no: string
          room_number?: string | null
          room_type?: string | null
        }
        Update: {
          block?: string
          capacity?: number
          created_at?: string
          hostel_id?: string | null
          id?: string
          occupied?: number
          room_no?: string
          room_number?: string | null
          room_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hostel_rooms_hostel_id_fkey"
            columns: ["hostel_id"]
            isOneToOne: false
            referencedRelation: "hostels"
            referencedColumns: ["id"]
          },
        ]
      }
      hostels: {
        Row: {
          capacity: number | null
          created_at: string
          id: string
          name: string
          type: string | null
          warden: string | null
        }
        Insert: {
          capacity?: number | null
          created_at?: string
          id?: string
          name: string
          type?: string | null
          warden?: string | null
        }
        Update: {
          capacity?: number | null
          created_at?: string
          id?: string
          name?: string
          type?: string | null
          warden?: string | null
        }
        Relationships: []
      }
      institutions: {
        Row: {
          code: string | null
          created_at: string
          id: string
          meta: Json
          name: string
          updated_at: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          id?: string
          meta?: Json
          name: string
          updated_at?: string
        }
        Update: {
          code?: string | null
          created_at?: string
          id?: string
          meta?: Json
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      job_openings: {
        Row: {
          closes_at: string | null
          created_at: string
          department: string | null
          id: string
          location: string | null
          posted_at: string
          status: string
          title: string
          type: string | null
        }
        Insert: {
          closes_at?: string | null
          created_at?: string
          department?: string | null
          id?: string
          location?: string | null
          posted_at?: string
          status?: string
          title: string
          type?: string | null
        }
        Update: {
          closes_at?: string | null
          created_at?: string
          department?: string | null
          id?: string
          location?: string | null
          posted_at?: string
          status?: string
          title?: string
          type?: string | null
        }
        Relationships: []
      }
      leave_balances: {
        Row: {
          carried_days: number | null
          created_at: string
          id: string
          leave_type_id: string | null
          staff_id: string | null
          total_days: number | null
          used_days: number | null
          year: number
        }
        Insert: {
          carried_days?: number | null
          created_at?: string
          id?: string
          leave_type_id?: string | null
          staff_id?: string | null
          total_days?: number | null
          used_days?: number | null
          year?: number
        }
        Update: {
          carried_days?: number | null
          created_at?: string
          id?: string
          leave_type_id?: string | null
          staff_id?: string | null
          total_days?: number | null
          used_days?: number | null
          year?: number
        }
        Relationships: []
      }
      leave_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          days: number
          end_date: string
          id: string
          leave_type_id: string | null
          reason: string | null
          staff_id: string | null
          start_date: string
          status: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          days?: number
          end_date: string
          id?: string
          leave_type_id?: string | null
          reason?: string | null
          staff_id?: string | null
          start_date: string
          status?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          days?: number
          end_date?: string
          id?: string
          leave_type_id?: string | null
          reason?: string | null
          staff_id?: string | null
          start_date?: string
          status?: string
        }
        Relationships: []
      }
      leave_types: {
        Row: {
          active: boolean | null
          carry_forward: boolean | null
          code: string | null
          created_at: string
          days_per_year: number | null
          id: string
          name: string
          requires_approval: boolean | null
        }
        Insert: {
          active?: boolean | null
          carry_forward?: boolean | null
          code?: string | null
          created_at?: string
          days_per_year?: number | null
          id?: string
          name: string
          requires_approval?: boolean | null
        }
        Update: {
          active?: boolean | null
          carry_forward?: boolean | null
          code?: string | null
          created_at?: string
          days_per_year?: number | null
          id?: string
          name?: string
          requires_approval?: boolean | null
        }
        Relationships: []
      }
      library_books: {
        Row: {
          author: string | null
          available_copies: number
          category: string | null
          created_at: string
          id: string
          isbn: string | null
          shelf: string | null
          title: string
          total_copies: number
        }
        Insert: {
          author?: string | null
          available_copies?: number
          category?: string | null
          created_at?: string
          id?: string
          isbn?: string | null
          shelf?: string | null
          title: string
          total_copies?: number
        }
        Update: {
          author?: string | null
          available_copies?: number
          category?: string | null
          created_at?: string
          id?: string
          isbn?: string | null
          shelf?: string | null
          title?: string
          total_copies?: number
        }
        Relationships: []
      }
      library_issues: {
        Row: {
          book_id: string | null
          created_at: string
          due_at: string | null
          fine: number | null
          id: string
          issued_at: string
          returned_at: string | null
          status: string
          student_id: string | null
        }
        Insert: {
          book_id?: string | null
          created_at?: string
          due_at?: string | null
          fine?: number | null
          id?: string
          issued_at?: string
          returned_at?: string | null
          status?: string
          student_id?: string | null
        }
        Update: {
          book_id?: string | null
          created_at?: string
          due_at?: string | null
          fine?: number | null
          id?: string
          issued_at?: string
          returned_at?: string | null
          status?: string
          student_id?: string | null
        }
        Relationships: []
      }
      library_loans: {
        Row: {
          book_id: string
          due_date: string
          fine: number
          id: string
          issued_at: string
          returned_at: string | null
          staff_id: string | null
          status: string
          student_id: string | null
        }
        Insert: {
          book_id: string
          due_date: string
          fine?: number
          id?: string
          issued_at?: string
          returned_at?: string | null
          staff_id?: string | null
          status?: string
          student_id?: string | null
        }
        Update: {
          book_id?: string
          due_date?: string
          fine?: number
          id?: string
          issued_at?: string
          returned_at?: string | null
          staff_id?: string | null
          status?: string
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "library_loans_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "library_books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "library_loans_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "library_loans_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_register"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "library_loans_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_register"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "library_loans_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          meta: Json
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          meta?: Json
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          meta?: Json
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      payroll_runs: {
        Row: {
          created_at: string
          employee_count: number
          id: string
          name: string
          payment_date: string | null
          period_end: string
          period_start: string
          processed_at: string | null
          status: string
          total_amount: number
        }
        Insert: {
          created_at?: string
          employee_count?: number
          id?: string
          name: string
          payment_date?: string | null
          period_end: string
          period_start: string
          processed_at?: string | null
          status?: string
          total_amount?: number
        }
        Update: {
          created_at?: string
          employee_count?: number
          id?: string
          name?: string
          payment_date?: string | null
          period_end?: string
          period_start?: string
          processed_at?: string | null
          status?: string
          total_amount?: number
        }
        Relationships: []
      }
      permissions: {
        Row: {
          action: string
          id: string
          label: string
          module_key: string
        }
        Insert: {
          action: string
          id?: string
          label: string
          module_key: string
        }
        Update: {
          action?: string
          id?: string
          label?: string
          module_key?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          mfa_enrolled: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          mfa_enrolled?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          mfa_enrolled?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      question_banks: {
        Row: {
          correct_answer: string | null
          created_at: string
          created_by: string | null
          difficulty: string | null
          explanation: string | null
          grade: string | null
          id: string
          marks: number | null
          options: Json
          question_text: string
          question_type: string | null
          subject_id: string | null
          tags: string[] | null
          topic: string | null
          updated_at: string
        }
        Insert: {
          correct_answer?: string | null
          created_at?: string
          created_by?: string | null
          difficulty?: string | null
          explanation?: string | null
          grade?: string | null
          id?: string
          marks?: number | null
          options?: Json
          question_text: string
          question_type?: string | null
          subject_id?: string | null
          tags?: string[] | null
          topic?: string | null
          updated_at?: string
        }
        Update: {
          correct_answer?: string | null
          created_at?: string
          created_by?: string | null
          difficulty?: string | null
          explanation?: string | null
          grade?: string | null
          id?: string
          marks?: number | null
          options?: Json
          question_text?: string
          question_type?: string | null
          subject_id?: string | null
          tags?: string[] | null
          topic?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      result_publications: {
        Row: {
          created_at: string
          exam_id: string | null
          id: string
          notes: string | null
          notify_parents: boolean
          notify_students: boolean
          published_at: string | null
          published_by: string | null
          status: string
          updated_at: string
          visibility: string | null
        }
        Insert: {
          created_at?: string
          exam_id?: string | null
          id?: string
          notes?: string | null
          notify_parents?: boolean
          notify_students?: boolean
          published_at?: string | null
          published_by?: string | null
          status?: string
          updated_at?: string
          visibility?: string | null
        }
        Update: {
          created_at?: string
          exam_id?: string | null
          id?: string
          notes?: string | null
          notify_parents?: boolean
          notify_students?: boolean
          published_at?: string | null
          published_by?: string | null
          status?: string
          updated_at?: string
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "result_publications_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exam_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          id: string
          level: Database["public"]["Enums"]["access_level"]
          permission_id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          id?: string
          level?: Database["public"]["Enums"]["access_level"]
          permission_id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          id?: string
          level?: Database["public"]["Enums"]["access_level"]
          permission_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
        ]
      }
      staff: {
        Row: {
          created_at: string
          date_of_joining: string | null
          department: string | null
          designation: string | null
          email: string | null
          employee_no: string
          first_name: string
          id: string
          last_name: string | null
          phone: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          date_of_joining?: string | null
          department?: string | null
          designation?: string | null
          email?: string | null
          employee_no: string
          first_name: string
          id?: string
          last_name?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          date_of_joining?: string | null
          department?: string | null
          designation?: string | null
          email?: string | null
          employee_no?: string
          first_name?: string
          id?: string
          last_name?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      students: {
        Row: {
          academic_year: string | null
          address: string | null
          admission_no: string
          alternate_phone: string | null
          annual_income: number | null
          attendance_percent: number | null
          block: string | null
          blood_group: string | null
          community: string | null
          created_at: string
          created_by: string | null
          display_name: string | null
          district: string | null
          dob: string | null
          email: string | null
          emis_id: string | null
          enrollment_id: string | null
          enrollment_status: string | null
          father_name: string | null
          father_occupation: string | null
          fee_status: string | null
          first_graduate: boolean | null
          first_name: string
          gender: string | null
          grade: string | null
          guardian_annual_income: number | null
          guardian_email: string | null
          guardian_id: string | null
          guardian_name: string | null
          guardian_occupation: string | null
          guardian_phone: string | null
          house: string | null
          id: string
          income_verification_status: string | null
          income_verified: string | null
          last_name: string | null
          meta: Json
          mother_name: string | null
          mother_occupation: string | null
          nationality: string | null
          notes: string | null
          phone: string | null
          roll_number: string | null
          scholarship_notes: string | null
          section: string | null
          status: string
          stream: string | null
          umis_id: string | null
          updated_at: string
          updated_by: string | null
          user_id: string | null
        }
        Insert: {
          academic_year?: string | null
          address?: string | null
          admission_no: string
          alternate_phone?: string | null
          annual_income?: number | null
          attendance_percent?: number | null
          block?: string | null
          blood_group?: string | null
          community?: string | null
          created_at?: string
          created_by?: string | null
          display_name?: string | null
          district?: string | null
          dob?: string | null
          email?: string | null
          emis_id?: string | null
          enrollment_id?: string | null
          enrollment_status?: string | null
          father_name?: string | null
          father_occupation?: string | null
          fee_status?: string | null
          first_graduate?: boolean | null
          first_name: string
          gender?: string | null
          grade?: string | null
          guardian_annual_income?: number | null
          guardian_email?: string | null
          guardian_id?: string | null
          guardian_name?: string | null
          guardian_occupation?: string | null
          guardian_phone?: string | null
          house?: string | null
          id?: string
          income_verification_status?: string | null
          income_verified?: string | null
          last_name?: string | null
          meta?: Json
          mother_name?: string | null
          mother_occupation?: string | null
          nationality?: string | null
          notes?: string | null
          phone?: string | null
          roll_number?: string | null
          scholarship_notes?: string | null
          section?: string | null
          status?: string
          stream?: string | null
          umis_id?: string | null
          updated_at?: string
          updated_by?: string | null
          user_id?: string | null
        }
        Update: {
          academic_year?: string | null
          address?: string | null
          admission_no?: string
          alternate_phone?: string | null
          annual_income?: number | null
          attendance_percent?: number | null
          block?: string | null
          blood_group?: string | null
          community?: string | null
          created_at?: string
          created_by?: string | null
          display_name?: string | null
          district?: string | null
          dob?: string | null
          email?: string | null
          emis_id?: string | null
          enrollment_id?: string | null
          enrollment_status?: string | null
          father_name?: string | null
          father_occupation?: string | null
          fee_status?: string | null
          first_graduate?: boolean | null
          first_name?: string
          gender?: string | null
          grade?: string | null
          guardian_annual_income?: number | null
          guardian_email?: string | null
          guardian_id?: string | null
          guardian_name?: string | null
          guardian_occupation?: string | null
          guardian_phone?: string | null
          house?: string | null
          id?: string
          income_verification_status?: string | null
          income_verified?: string | null
          last_name?: string | null
          meta?: Json
          mother_name?: string | null
          mother_occupation?: string | null
          nationality?: string | null
          notes?: string | null
          phone?: string | null
          roll_number?: string | null
          scholarship_notes?: string | null
          section?: string | null
          status?: string
          stream?: string | null
          umis_id?: string | null
          updated_at?: string
          updated_by?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      subjects: {
        Row: {
          code: string
          created_at: string
          credits: number
          id: string
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          credits?: number
          id?: string
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          credits?: number
          id?: string
          name?: string
        }
        Relationships: []
      }
      submissions: {
        Row: {
          assignment_id: string | null
          content: string | null
          created_at: string
          feedback: string | null
          file_url: string | null
          graded_at: string | null
          graded_by: string | null
          id: string
          marks: number | null
          status: string
          student_id: string | null
          submitted_at: string | null
        }
        Insert: {
          assignment_id?: string | null
          content?: string | null
          created_at?: string
          feedback?: string | null
          file_url?: string | null
          graded_at?: string | null
          graded_by?: string | null
          id?: string
          marks?: number | null
          status?: string
          student_id?: string | null
          submitted_at?: string | null
        }
        Update: {
          assignment_id?: string | null
          content?: string | null
          created_at?: string
          feedback?: string | null
          file_url?: string | null
          graded_at?: string | null
          graded_by?: string | null
          id?: string
          marks?: number | null
          status?: string
          student_id?: string | null
          submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      substitutions: {
        Row: {
          created_at: string
          date: string
          id: string
          original_teacher_id: string | null
          reason: string | null
          status: string
          substitute_teacher_id: string | null
          timetable_entry_id: string | null
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          original_teacher_id?: string | null
          reason?: string | null
          status?: string
          substitute_teacher_id?: string | null
          timetable_entry_id?: string | null
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          original_teacher_id?: string | null
          reason?: string | null
          status?: string
          substitute_teacher_id?: string | null
          timetable_entry_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "substitutions_timetable_entry_id_fkey"
            columns: ["timetable_entry_id"]
            isOneToOne: false
            referencedRelation: "timetable_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      thread_participants: {
        Row: {
          created_at: string
          last_read_at: string | null
          role: string | null
          thread_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          last_read_at?: string | null
          role?: string | null
          thread_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          last_read_at?: string | null
          role?: string | null
          thread_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "thread_participants_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "chat_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      time_slots: {
        Row: {
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          is_break: boolean
          name: string
          start_time: string
        }
        Insert: {
          created_at?: string
          day_of_week?: number
          end_time: string
          id?: string
          is_break?: boolean
          name: string
          start_time: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          is_break?: boolean
          name?: string
          start_time?: string
        }
        Relationships: []
      }
      timetable_entries: {
        Row: {
          academic_year_id: string | null
          class_id: string | null
          created_at: string
          day_of_week: number
          id: string
          room: string | null
          subject_id: string | null
          teacher_id: string | null
          time_slot_id: string | null
          updated_at: string
        }
        Insert: {
          academic_year_id?: string | null
          class_id?: string | null
          created_at?: string
          day_of_week?: number
          id?: string
          room?: string | null
          subject_id?: string | null
          teacher_id?: string | null
          time_slot_id?: string | null
          updated_at?: string
        }
        Update: {
          academic_year_id?: string | null
          class_id?: string | null
          created_at?: string
          day_of_week?: number
          id?: string
          room?: string | null
          subject_id?: string | null
          teacher_id?: string | null
          time_slot_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "timetable_entries_time_slot_id_fkey"
            columns: ["time_slot_id"]
            isOneToOne: false
            referencedRelation: "time_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      transcripts: {
        Row: {
          academic_year: string | null
          academic_year_id: string | null
          body: Json
          certificate_no: string | null
          created_at: string
          created_by: string | null
          exam_ids: string[] | null
          gpa: number | null
          id: string
          issued_at: string | null
          obtained_marks: number | null
          percentage: number | null
          qr_token: string | null
          status: string
          student_id: string | null
          total_marks: number | null
        }
        Insert: {
          academic_year?: string | null
          academic_year_id?: string | null
          body?: Json
          certificate_no?: string | null
          created_at?: string
          created_by?: string | null
          exam_ids?: string[] | null
          gpa?: number | null
          id?: string
          issued_at?: string | null
          obtained_marks?: number | null
          percentage?: number | null
          qr_token?: string | null
          status?: string
          student_id?: string | null
          total_marks?: number | null
        }
        Update: {
          academic_year?: string | null
          academic_year_id?: string | null
          body?: Json
          certificate_no?: string | null
          created_at?: string
          created_by?: string | null
          exam_ids?: string[] | null
          gpa?: number | null
          id?: string
          issued_at?: string | null
          obtained_marks?: number | null
          percentage?: number | null
          qr_token?: string | null
          status?: string
          student_id?: string | null
          total_marks?: number | null
        }
        Relationships: []
      }
      transport_allocations: {
        Row: {
          allocated_on: string
          id: string
          route_id: string
          status: string
          stop_name: string | null
          student_id: string
        }
        Insert: {
          allocated_on?: string
          id?: string
          route_id: string
          status?: string
          stop_name?: string | null
          student_id: string
        }
        Update: {
          allocated_on?: string
          id?: string
          route_id?: string
          status?: string
          stop_name?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transport_allocations_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "transport_routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transport_allocations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_register"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transport_allocations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_register"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "transport_allocations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      transport_routes: {
        Row: {
          capacity: number
          created_at: string
          driver_name: string | null
          driver_phone: string | null
          fare: number
          id: string
          name: string
          route_name: string | null
          route_no: string
          vehicle_no: string | null
        }
        Insert: {
          capacity?: number
          created_at?: string
          driver_name?: string | null
          driver_phone?: string | null
          fare?: number
          id?: string
          name: string
          route_name?: string | null
          route_no: string
          vehicle_no?: string | null
        }
        Update: {
          capacity?: number
          created_at?: string
          driver_name?: string | null
          driver_phone?: string | null
          fare?: number
          id?: string
          name?: string
          route_name?: string | null
          route_no?: string
          vehicle_no?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      student_register: {
        Row: {
          academic_year: string | null
          address: string | null
          admission_no: string | null
          alternate_phone: string | null
          annual_income: number | null
          attendance_percent: number | null
          block: string | null
          blood_group: string | null
          community: string | null
          created_at: string | null
          created_by: string | null
          display_name: string | null
          district: string | null
          dob: string | null
          email: string | null
          emis_id: string | null
          enrollment_id: string | null
          enrollment_status: string | null
          father_name: string | null
          father_occupation: string | null
          fee_status: string | null
          first_graduate: boolean | null
          first_name: string | null
          gender: string | null
          grade: string | null
          guardian_annual_income: number | null
          guardian_email: string | null
          guardian_id: string | null
          guardian_name: string | null
          guardian_occupation: string | null
          guardian_phone: string | null
          house: string | null
          id: string | null
          income_verification_status: string | null
          income_verified: string | null
          last_name: string | null
          meta: Json | null
          mother_name: string | null
          mother_occupation: string | null
          nationality: string | null
          notes: string | null
          phone: string | null
          roll_number: string | null
          scholarship_notes: string | null
          section: string | null
          status: string | null
          stream: string | null
          student_id: string | null
          umis_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          academic_year?: string | null
          address?: string | null
          admission_no?: string | null
          alternate_phone?: string | null
          annual_income?: number | null
          attendance_percent?: number | null
          block?: string | null
          blood_group?: string | null
          community?: string | null
          created_at?: string | null
          created_by?: string | null
          display_name?: string | null
          district?: string | null
          dob?: string | null
          email?: string | null
          emis_id?: string | null
          enrollment_id?: string | null
          enrollment_status?: string | null
          father_name?: string | null
          father_occupation?: string | null
          fee_status?: string | null
          first_graduate?: boolean | null
          first_name?: string | null
          gender?: string | null
          grade?: string | null
          guardian_annual_income?: number | null
          guardian_email?: string | null
          guardian_id?: string | null
          guardian_name?: string | null
          guardian_occupation?: string | null
          guardian_phone?: string | null
          house?: string | null
          id?: string | null
          income_verification_status?: string | null
          income_verified?: string | null
          last_name?: string | null
          meta?: Json | null
          mother_name?: string | null
          mother_occupation?: string | null
          nationality?: string | null
          notes?: string | null
          phone?: string | null
          roll_number?: string | null
          scholarship_notes?: string | null
          section?: string | null
          status?: string | null
          stream?: string | null
          student_id?: string | null
          umis_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          academic_year?: string | null
          address?: string | null
          admission_no?: string | null
          alternate_phone?: string | null
          annual_income?: number | null
          attendance_percent?: number | null
          block?: string | null
          blood_group?: string | null
          community?: string | null
          created_at?: string | null
          created_by?: string | null
          display_name?: string | null
          district?: string | null
          dob?: string | null
          email?: string | null
          emis_id?: string | null
          enrollment_id?: string | null
          enrollment_status?: string | null
          father_name?: string | null
          father_occupation?: string | null
          fee_status?: string | null
          first_graduate?: boolean | null
          first_name?: string | null
          gender?: string | null
          grade?: string | null
          guardian_annual_income?: number | null
          guardian_email?: string | null
          guardian_id?: string | null
          guardian_name?: string | null
          guardian_occupation?: string | null
          guardian_phone?: string | null
          house?: string | null
          id?: string | null
          income_verification_status?: string | null
          income_verified?: string | null
          last_name?: string | null
          meta?: Json | null
          mother_name?: string | null
          mother_occupation?: string | null
          nationality?: string | null
          notes?: string | null
          phone?: string | null
          roll_number?: string | null
          scholarship_notes?: string | null
          section?: string | null
          status?: string | null
          stream?: string | null
          student_id?: string | null
          umis_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _uid: string }; Returns: boolean }
      is_staff: { Args: { _uid: string }; Returns: boolean }
    }
    Enums: {
      access_level:
        | "none"
        | "view"
        | "create"
        | "edit"
        | "approve"
        | "delete"
        | "export"
        | "manage"
      app_role:
        | "super_admin"
        | "admin"
        | "principal"
        | "hod"
        | "faculty"
        | "staff"
        | "finance"
        | "scholarship"
        | "certificate"
        | "librarian"
        | "hostel_warden"
        | "transport"
        | "student"
        | "parent"
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
      access_level: [
        "none",
        "view",
        "create",
        "edit",
        "approve",
        "delete",
        "export",
        "manage",
      ],
      app_role: [
        "super_admin",
        "admin",
        "principal",
        "hod",
        "faculty",
        "staff",
        "finance",
        "scholarship",
        "certificate",
        "librarian",
        "hostel_warden",
        "transport",
        "student",
        "parent",
      ],
    },
  },
} as const
