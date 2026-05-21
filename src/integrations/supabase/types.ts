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
          ends_on: string | null
          id: string
          institution_id: string
          is_current: boolean
          label: string
          meta: Json
          starts_on: string | null
          status: Database["public"]["Enums"]["person_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          ends_on?: string | null
          id?: string
          institution_id: string
          is_current?: boolean
          label: string
          meta?: Json
          starts_on?: string | null
          status?: Database["public"]["Enums"]["person_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          ends_on?: string | null
          id?: string
          institution_id?: string
          is_current?: boolean
          label?: string
          meta?: Json
          starts_on?: string | null
          status?: Database["public"]["Enums"]["person_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "academic_years_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      appraisal_kpis: {
        Row: {
          appraisal_id: string
          id: string
          kpi_name: string
          remarks: string | null
          score: number | null
          weight: number
        }
        Insert: {
          appraisal_id: string
          id?: string
          kpi_name: string
          remarks?: string | null
          score?: number | null
          weight?: number
        }
        Update: {
          appraisal_id?: string
          id?: string
          kpi_name?: string
          remarks?: string | null
          score?: number | null
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "appraisal_kpis_appraisal_id_fkey"
            columns: ["appraisal_id"]
            isOneToOne: false
            referencedRelation: "appraisals"
            referencedColumns: ["id"]
          },
        ]
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
          staff_id: string
          status: string
          submitted_at: string | null
          updated_at: string
        }
        Insert: {
          comments?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          overall_rating?: number | null
          review_period: string
          reviewer_id?: string | null
          staff_id: string
          status?: string
          submitted_at?: string | null
          updated_at?: string
        }
        Update: {
          comments?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          overall_rating?: number | null
          review_period?: string
          reviewer_id?: string | null
          staff_id?: string
          status?: string
          submitted_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appraisals_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appraisals_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          attachments: Json | null
          class_id: string
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          max_marks: number
          status: string
          subject_id: string
          title: string
          updated_at: string
        }
        Insert: {
          attachments?: Json | null
          class_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          max_marks?: number
          status?: string
          subject_id: string
          title: string
          updated_at?: string
        }
        Update: {
          attachments?: Json | null
          class_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          max_marks?: number
          status?: string
          subject_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
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
            referencedRelation: "student_analytics_summary"
            referencedColumns: ["student_id"]
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
      automation_rules: {
        Row: {
          actions: Json
          conditions: Json
          created_at: string
          event_trigger: string
          id: string
          institution_id: string
          is_active: boolean
          meta: Json
          name: string
          updated_at: string
        }
        Insert: {
          actions?: Json
          conditions?: Json
          created_at?: string
          event_trigger: string
          id?: string
          institution_id: string
          is_active?: boolean
          meta?: Json
          name: string
          updated_at?: string
        }
        Update: {
          actions?: Json
          conditions?: Json
          created_at?: string
          event_trigger?: string
          id?: string
          institution_id?: string
          is_active?: boolean
          meta?: Json
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_rules_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      campuses: {
        Row: {
          address: string | null
          code: string | null
          created_at: string
          id: string
          institution_id: string
          meta: Json
          name: string
          slug: string
          status: Database["public"]["Enums"]["person_status"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          code?: string | null
          created_at?: string
          id?: string
          institution_id: string
          meta?: Json
          name: string
          slug: string
          status?: Database["public"]["Enums"]["person_status"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          code?: string | null
          created_at?: string
          id?: string
          institution_id?: string
          meta?: Json
          name?: string
          slug?: string
          status?: Database["public"]["Enums"]["person_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campuses_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      candidates: {
        Row: {
          applied_at: string
          created_at: string
          email: string | null
          id: string
          job_opening_id: string
          name: string
          notes: string | null
          phone: string | null
          resume_url: string | null
          status: string
          updated_at: string
        }
        Insert: {
          applied_at?: string
          created_at?: string
          email?: string | null
          id?: string
          job_opening_id: string
          name: string
          notes?: string | null
          phone?: string | null
          resume_url?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          applied_at?: string
          created_at?: string
          email?: string | null
          id?: string
          job_opening_id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          resume_url?: string | null
          status?: string
          updated_at?: string
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
          comments: string | null
          created_at: string
          id: string
          purpose: string | null
          qr_token: string
          requested_on: string
          status: Database["public"]["Enums"]["verification_status"]
          student_id: string
          template_id: string
          updated_at: string
        }
        Insert: {
          comments?: string | null
          created_at?: string
          id?: string
          purpose?: string | null
          qr_token?: string
          requested_on?: string
          status?: Database["public"]["Enums"]["verification_status"]
          student_id: string
          template_id: string
          updated_at?: string
        }
        Update: {
          comments?: string | null
          created_at?: string
          id?: string
          purpose?: string | null
          qr_token?: string
          requested_on?: string
          status?: Database["public"]["Enums"]["verification_status"]
          student_id?: string
          template_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificate_requests_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_analytics_summary"
            referencedColumns: ["student_id"]
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
          created_at: string
          id: string
          institution_id: string
          name: string
          status: Database["public"]["Enums"]["person_status"]
          template_html: string
          updated_at: string
          variables: string[] | null
        }
        Insert: {
          created_at?: string
          id?: string
          institution_id: string
          name: string
          status?: Database["public"]["Enums"]["person_status"]
          template_html: string
          updated_at?: string
          variables?: string[] | null
        }
        Update: {
          created_at?: string
          id?: string
          institution_id?: string
          name?: string
          status?: Database["public"]["Enums"]["person_status"]
          template_html?: string
          updated_at?: string
          variables?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "certificate_templates_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      certificates: {
        Row: {
          certificate_no: string
          content_snapshot: string
          created_at: string
          id: string
          issued_by: string | null
          issued_on: string
          meta: Json
          request_id: string | null
          student_id: string
          template_id: string
          updated_at: string
          verification_code: string
        }
        Insert: {
          certificate_no: string
          content_snapshot: string
          created_at?: string
          id?: string
          issued_by?: string | null
          issued_on?: string
          meta?: Json
          request_id?: string | null
          student_id: string
          template_id: string
          updated_at?: string
          verification_code: string
        }
        Update: {
          certificate_no?: string
          content_snapshot?: string
          created_at?: string
          id?: string
          issued_by?: string | null
          issued_on?: string
          meta?: Json
          request_id?: string | null
          student_id?: string
          template_id?: string
          updated_at?: string
          verification_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "certificate_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_analytics_summary"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "certificates_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_register"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "certificates_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "certificate_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          attachments: Json
          created_at: string
          id: string
          message: string
          sender_id: string
          thread_id: string
          updated_at: string
        }
        Insert: {
          attachments?: Json
          created_at?: string
          id?: string
          message: string
          sender_id: string
          thread_id: string
          updated_at?: string
        }
        Update: {
          attachments?: Json
          created_at?: string
          id?: string
          message?: string
          sender_id?: string
          thread_id?: string
          updated_at?: string
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
          institution_id: string | null
          meta: Json
          title: string | null
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          institution_id?: string | null
          meta?: Json
          title?: string | null
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          institution_id?: string | null
          meta?: Json
          title?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_threads_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      class_levels: {
        Row: {
          created_at: string
          id: string
          institution_id: string
          label: string
          meta: Json
          program_id: string | null
          sort_order: number
          status: Database["public"]["Enums"]["person_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          institution_id: string
          label: string
          meta?: Json
          program_id?: string | null
          sort_order?: number
          status?: Database["public"]["Enums"]["person_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          institution_id?: string
          label?: string
          meta?: Json
          program_id?: string | null
          sort_order?: number
          status?: Database["public"]["Enums"]["person_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_levels_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_levels_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
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
      dashboard_kpis: {
        Row: {
          calculated_at: string
          id: string
          institution_id: string
          label: string | null
          meta: Json
          metric_key: string
          metric_value: number | null
        }
        Insert: {
          calculated_at?: string
          id?: string
          institution_id: string
          label?: string | null
          meta?: Json
          metric_key: string
          metric_value?: number | null
        }
        Update: {
          calculated_at?: string
          id?: string
          institution_id?: string
          label?: string | null
          meta?: Json
          metric_key?: string
          metric_value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "dashboard_kpis_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          code: string | null
          created_at: string
          id: string
          institution_id: string
          meta: Json
          name: string
          status: Database["public"]["Enums"]["person_status"]
          updated_at: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          id?: string
          institution_id: string
          meta?: Json
          name: string
          status?: Database["public"]["Enums"]["person_status"]
          updated_at?: string
        }
        Update: {
          code?: string | null
          created_at?: string
          id?: string
          institution_id?: string
          meta?: Json
          name?: string
          status?: Database["public"]["Enums"]["person_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          institution_id: string
          meta: Json
          staff_id: string | null
          student_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          created_by?: string | null
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          institution_id: string
          meta?: Json
          staff_id?: string | null
          student_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          institution_id?: string
          meta?: Json
          staff_id?: string | null
          student_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_analytics_summary"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "documents_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_register"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "documents_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollments: {
        Row: {
          academic_year_id: string | null
          academic_year_label: string | null
          campus_id: string | null
          class_level_id: string | null
          created_at: string
          grade_label: string | null
          house: string | null
          id: string
          institution_id: string | null
          joined_on: string | null
          left_on: string | null
          meta: Json
          program_id: string | null
          roll_number: number | null
          section_id: string | null
          section_label: string | null
          status: Database["public"]["Enums"]["enrollment_status"]
          stream: string | null
          student_id: string
          updated_at: string
        }
        Insert: {
          academic_year_id?: string | null
          academic_year_label?: string | null
          campus_id?: string | null
          class_level_id?: string | null
          created_at?: string
          grade_label?: string | null
          house?: string | null
          id?: string
          institution_id?: string | null
          joined_on?: string | null
          left_on?: string | null
          meta?: Json
          program_id?: string | null
          roll_number?: number | null
          section_id?: string | null
          section_label?: string | null
          status?: Database["public"]["Enums"]["enrollment_status"]
          stream?: string | null
          student_id: string
          updated_at?: string
        }
        Update: {
          academic_year_id?: string | null
          academic_year_label?: string | null
          campus_id?: string | null
          class_level_id?: string | null
          created_at?: string
          grade_label?: string | null
          house?: string | null
          id?: string
          institution_id?: string | null
          joined_on?: string | null
          left_on?: string | null
          meta?: Json
          program_id?: string | null
          roll_number?: number | null
          section_id?: string | null
          section_label?: string | null
          status?: Database["public"]["Enums"]["enrollment_status"]
          stream?: string | null
          student_id?: string
          updated_at?: string
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
            foreignKeyName: "enrollments_campus_id_fkey"
            columns: ["campus_id"]
            isOneToOne: false
            referencedRelation: "campuses"
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
            foreignKeyName: "enrollments_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_analytics_summary"
            referencedColumns: ["student_id"]
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
          created_at: string
          entered_by: string | null
          exam_id: string
          grade: string | null
          id: string
          marks_obtained: number | null
          moderated_at: string | null
          moderated_by: string | null
          remarks: string
          status: Database["public"]["Enums"]["mark_status"]
          student_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          entered_by?: string | null
          exam_id: string
          grade?: string | null
          id?: string
          marks_obtained?: number | null
          moderated_at?: string | null
          moderated_by?: string | null
          remarks?: string
          status?: Database["public"]["Enums"]["mark_status"]
          student_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          entered_by?: string | null
          exam_id?: string
          grade?: string | null
          id?: string
          marks_obtained?: number | null
          moderated_at?: string | null
          moderated_by?: string | null
          remarks?: string
          status?: Database["public"]["Enums"]["mark_status"]
          student_id?: string
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
          {
            foreignKeyName: "exam_marks_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_analytics_summary"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "exam_marks_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_register"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "exam_marks_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_schedules: {
        Row: {
          created_at: string
          created_by: string | null
          date: string
          description: string
          end_time: string
          exam_type: Database["public"]["Enums"]["exam_type"]
          grade: string
          id: string
          max_marks: number
          pass_marks: number
          section: string
          start_time: string
          status: Database["public"]["Enums"]["exam_status"]
          subject: string
          subject_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          date: string
          description?: string
          end_time?: string
          exam_type?: Database["public"]["Enums"]["exam_type"]
          grade: string
          id?: string
          max_marks?: number
          pass_marks?: number
          section?: string
          start_time?: string
          status?: Database["public"]["Enums"]["exam_status"]
          subject: string
          subject_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          date?: string
          description?: string
          end_time?: string
          exam_type?: Database["public"]["Enums"]["exam_type"]
          grade?: string
          id?: string
          max_marks?: number
          pass_marks?: number
          section?: string
          start_time?: string
          status?: Database["public"]["Enums"]["exam_status"]
          subject?: string
          subject_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_schedules_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      faculty: {
        Row: {
          created_at: string
          department_id: string | null
          faculty_code: string | null
          id: string
          meta: Json
          qualification: string | null
          specialization: string | null
          staff_id: string
          status: Database["public"]["Enums"]["staff_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          department_id?: string | null
          faculty_code?: string | null
          id?: string
          meta?: Json
          qualification?: string | null
          specialization?: string | null
          staff_id: string
          status?: Database["public"]["Enums"]["staff_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          department_id?: string | null
          faculty_code?: string | null
          id?: string
          meta?: Json
          qualification?: string | null
          specialization?: string | null
          staff_id?: string
          status?: Database["public"]["Enums"]["staff_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "faculty_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faculty_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: true
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          institution_id: string
          name: string
          status: Database["public"]["Enums"]["person_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          institution_id: string
          name: string
          status?: Database["public"]["Enums"]["person_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          institution_id?: string
          name?: string
          status?: Database["public"]["Enums"]["person_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fee_categories_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_concessions: {
        Row: {
          amount: number
          approved_by: string | null
          created_at: string
          id: string
          invoice_id: string
          reason: string
          student_id: string
          type: string
          updated_at: string
        }
        Insert: {
          amount?: number
          approved_by?: string | null
          created_at?: string
          id?: string
          invoice_id: string
          reason?: string
          student_id: string
          type?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          approved_by?: string | null
          created_at?: string
          id?: string
          invoice_id?: string
          reason?: string
          student_id?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fee_concessions_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "fee_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_concessions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_analytics_summary"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "fee_concessions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_register"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "fee_concessions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
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
            referencedRelation: "student_analytics_summary"
            referencedColumns: ["student_id"]
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
          amount_paid: number
          created_at: string
          created_by: string | null
          fee_category_id: string | null
          id: string
          institution_id: string | null
          meta: Json
          payment_date: string
          payment_method: string
          receipt_no: string | null
          status: string
          student_id: string
          transaction_reference: string | null
          updated_at: string
        }
        Insert: {
          academic_year_id?: string | null
          amount_paid: number
          created_at?: string
          created_by?: string | null
          fee_category_id?: string | null
          id?: string
          institution_id?: string | null
          meta?: Json
          payment_date?: string
          payment_method?: string
          receipt_no?: string | null
          status?: string
          student_id: string
          transaction_reference?: string | null
          updated_at?: string
        }
        Update: {
          academic_year_id?: string | null
          amount_paid?: number
          created_at?: string
          created_by?: string | null
          fee_category_id?: string | null
          id?: string
          institution_id?: string | null
          meta?: Json
          payment_date?: string
          payment_method?: string
          receipt_no?: string | null
          status?: string
          student_id?: string
          transaction_reference?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fee_payments_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_payments_fee_category_id_fkey"
            columns: ["fee_category_id"]
            isOneToOne: false
            referencedRelation: "fee_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_payments_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_payments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_analytics_summary"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "fee_payments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_register"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "fee_payments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
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
          student_id: string
          total_due: number
        }
        Insert: {
          channel?: string
          id?: string
          invoice_ids?: string[]
          sent_at?: string
          sent_by?: string | null
          status?: string
          student_id: string
          total_due?: number
        }
        Update: {
          channel?: string
          id?: string
          invoice_ids?: string[]
          sent_at?: string
          sent_by?: string | null
          status?: string
          student_id?: string
          total_due?: number
        }
        Relationships: [
          {
            foreignKeyName: "fee_reminders_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_analytics_summary"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "fee_reminders_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_register"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "fee_reminders_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_structures: {
        Row: {
          academic_year_id: string
          amount: number
          class_level_id: string
          created_at: string
          due_date: string | null
          fee_category_id: string
          id: string
          institution_id: string
          meta: Json
          updated_at: string
        }
        Insert: {
          academic_year_id: string
          amount: number
          class_level_id: string
          created_at?: string
          due_date?: string | null
          fee_category_id: string
          id?: string
          institution_id: string
          meta?: Json
          updated_at?: string
        }
        Update: {
          academic_year_id?: string
          amount?: number
          class_level_id?: string
          created_at?: string
          due_date?: string | null
          fee_category_id?: string
          id?: string
          institution_id?: string
          meta?: Json
          updated_at?: string
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
          {
            foreignKeyName: "fee_structures_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      grade_schemes: {
        Row: {
          created_at: string
          grade_label: string
          grade_point: number
          id: string
          max_percentage: number
          min_percentage: number
          name: string
          remarks: string
        }
        Insert: {
          created_at?: string
          grade_label: string
          grade_point: number
          id?: string
          max_percentage: number
          min_percentage: number
          name: string
          remarks?: string
        }
        Update: {
          created_at?: string
          grade_label?: string
          grade_point?: number
          id?: string
          max_percentage?: number
          min_percentage?: number
          name?: string
          remarks?: string
        }
        Relationships: []
      }
      grievances: {
        Row: {
          category: string
          created_at: string
          description: string
          id: string
          institution_id: string
          meta: Json
          parent_profile_id: string | null
          priority: string
          resolution: string | null
          staff_id: string | null
          status: string
          student_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description: string
          id?: string
          institution_id: string
          meta?: Json
          parent_profile_id?: string | null
          priority?: string
          resolution?: string | null
          staff_id?: string | null
          status?: string
          student_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          id?: string
          institution_id?: string
          meta?: Json
          parent_profile_id?: string | null
          priority?: string
          resolution?: string | null
          staff_id?: string | null
          status?: string
          student_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "grievances_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grievances_parent_profile_id_fkey"
            columns: ["parent_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grievances_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grievances_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_analytics_summary"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "grievances_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_register"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "grievances_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      guardians: {
        Row: {
          address: string | null
          annual_income: number | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          institution_id: string | null
          is_primary: boolean
          meta: Json
          occupation: string | null
          phone: string | null
          profile_id: string | null
          relationship: Database["public"]["Enums"]["guardian_relationship"]
          status: Database["public"]["Enums"]["person_status"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          annual_income?: number | null
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          institution_id?: string | null
          is_primary?: boolean
          meta?: Json
          occupation?: string | null
          phone?: string | null
          profile_id?: string | null
          relationship?: Database["public"]["Enums"]["guardian_relationship"]
          status?: Database["public"]["Enums"]["person_status"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          annual_income?: number | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          institution_id?: string | null
          is_primary?: boolean
          meta?: Json
          occupation?: string | null
          phone?: string | null
          profile_id?: string | null
          relationship?: Database["public"]["Enums"]["guardian_relationship"]
          status?: Database["public"]["Enums"]["person_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "guardians_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guardians_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      health_records: {
        Row: {
          allergies: string[] | null
          blood_group: string | null
          created_at: string
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          id: string
          medical_history: string | null
          meta: Json
          student_id: string
          updated_at: string
        }
        Insert: {
          allergies?: string[] | null
          blood_group?: string | null
          created_at?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          id?: string
          medical_history?: string | null
          meta?: Json
          student_id: string
          updated_at?: string
        }
        Update: {
          allergies?: string[] | null
          blood_group?: string | null
          created_at?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          id?: string
          medical_history?: string | null
          meta?: Json
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "health_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "student_analytics_summary"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "health_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "student_register"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "health_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      hostel_allocations: {
        Row: {
          allocated_from: string
          allocated_to: string | null
          created_at: string
          hostel_room_id: string
          id: string
          status: Database["public"]["Enums"]["person_status"]
          student_id: string
          updated_at: string
        }
        Insert: {
          allocated_from?: string
          allocated_to?: string | null
          created_at?: string
          hostel_room_id: string
          id?: string
          status?: Database["public"]["Enums"]["person_status"]
          student_id: string
          updated_at?: string
        }
        Update: {
          allocated_from?: string
          allocated_to?: string | null
          created_at?: string
          hostel_room_id?: string
          id?: string
          status?: Database["public"]["Enums"]["person_status"]
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hostel_allocations_hostel_room_id_fkey"
            columns: ["hostel_room_id"]
            isOneToOne: false
            referencedRelation: "hostel_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hostel_allocations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_analytics_summary"
            referencedColumns: ["student_id"]
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
          capacity: number
          cost_per_term: number | null
          created_at: string
          floor: string | null
          hostel_id: string
          id: string
          room_number: string
          status: Database["public"]["Enums"]["person_status"]
          updated_at: string
        }
        Insert: {
          capacity: number
          cost_per_term?: number | null
          created_at?: string
          floor?: string | null
          hostel_id: string
          id?: string
          room_number: string
          status?: Database["public"]["Enums"]["person_status"]
          updated_at?: string
        }
        Update: {
          capacity?: number
          cost_per_term?: number | null
          created_at?: string
          floor?: string | null
          hostel_id?: string
          id?: string
          room_number?: string
          status?: Database["public"]["Enums"]["person_status"]
          updated_at?: string
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
          address: string | null
          campus_id: string | null
          capacity: number | null
          created_at: string
          id: string
          institution_id: string
          name: string
          status: Database["public"]["Enums"]["person_status"]
          type: string
          updated_at: string
          warden_id: string | null
        }
        Insert: {
          address?: string | null
          campus_id?: string | null
          capacity?: number | null
          created_at?: string
          id?: string
          institution_id: string
          name: string
          status?: Database["public"]["Enums"]["person_status"]
          type?: string
          updated_at?: string
          warden_id?: string | null
        }
        Update: {
          address?: string | null
          campus_id?: string | null
          capacity?: number | null
          created_at?: string
          id?: string
          institution_id?: string
          name?: string
          status?: Database["public"]["Enums"]["person_status"]
          type?: string
          updated_at?: string
          warden_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hostels_campus_id_fkey"
            columns: ["campus_id"]
            isOneToOne: false
            referencedRelation: "campuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hostels_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hostels_warden_id_fkey"
            columns: ["warden_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      institutions: {
        Row: {
          address: string | null
          code: string | null
          created_at: string
          email: string | null
          id: string
          meta: Json
          name: string
          phone: string | null
          slug: string
          status: Database["public"]["Enums"]["person_status"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          code?: string | null
          created_at?: string
          email?: string | null
          id?: string
          meta?: Json
          name: string
          phone?: string | null
          slug: string
          status?: Database["public"]["Enums"]["person_status"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          code?: string | null
          created_at?: string
          email?: string | null
          id?: string
          meta?: Json
          name?: string
          phone?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["person_status"]
          updated_at?: string
        }
        Relationships: []
      }
      job_openings: {
        Row: {
          closes_at: string | null
          created_at: string
          created_by: string | null
          department: string | null
          description: string | null
          id: string
          location: string | null
          posted_at: string
          requirements: string | null
          salary_range: string | null
          status: string
          title: string
          type: string
        }
        Insert: {
          closes_at?: string | null
          created_at?: string
          created_by?: string | null
          department?: string | null
          description?: string | null
          id?: string
          location?: string | null
          posted_at?: string
          requirements?: string | null
          salary_range?: string | null
          status?: string
          title: string
          type?: string
        }
        Update: {
          closes_at?: string | null
          created_at?: string
          created_by?: string | null
          department?: string | null
          description?: string | null
          id?: string
          location?: string | null
          posted_at?: string
          requirements?: string | null
          salary_range?: string | null
          status?: string
          title?: string
          type?: string
        }
        Relationships: []
      }
      leave_balances: {
        Row: {
          carried_days: number
          id: string
          leave_type_id: string
          staff_id: string
          total_days: number
          used_days: number
          year: number
        }
        Insert: {
          carried_days?: number
          id?: string
          leave_type_id: string
          staff_id: string
          total_days?: number
          used_days?: number
          year?: number
        }
        Update: {
          carried_days?: number
          id?: string
          leave_type_id?: string
          staff_id?: string
          total_days?: number
          used_days?: number
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "leave_balances_leave_type_id_fkey"
            columns: ["leave_type_id"]
            isOneToOne: false
            referencedRelation: "leave_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_balances_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          days: number
          end_date: string
          id: string
          leave_type_id: string
          reason: string | null
          staff_id: string
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          days: number
          end_date: string
          id?: string
          leave_type_id: string
          reason?: string | null
          staff_id: string
          start_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          days?: number
          end_date?: string
          id?: string
          leave_type_id?: string
          reason?: string | null
          staff_id?: string
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leave_requests_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_leave_type_id_fkey"
            columns: ["leave_type_id"]
            isOneToOne: false
            referencedRelation: "leave_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_types: {
        Row: {
          active: boolean
          carry_forward: boolean
          code: string
          created_at: string
          days_per_year: number
          id: string
          name: string
          requires_approval: boolean
        }
        Insert: {
          active?: boolean
          carry_forward?: boolean
          code: string
          created_at?: string
          days_per_year?: number
          id?: string
          name: string
          requires_approval?: boolean
        }
        Update: {
          active?: boolean
          carry_forward?: boolean
          code?: string
          created_at?: string
          days_per_year?: number
          id?: string
          name?: string
          requires_approval?: boolean
        }
        Relationships: []
      }
      library_books: {
        Row: {
          authors: string | null
          available_quantity: number
          created_at: string
          id: string
          institution_id: string
          isbn: string | null
          location_shelf: string | null
          meta: Json
          publisher: string | null
          quantity: number
          status: Database["public"]["Enums"]["person_status"]
          title: string
          updated_at: string
        }
        Insert: {
          authors?: string | null
          available_quantity?: number
          created_at?: string
          id?: string
          institution_id: string
          isbn?: string | null
          location_shelf?: string | null
          meta?: Json
          publisher?: string | null
          quantity?: number
          status?: Database["public"]["Enums"]["person_status"]
          title: string
          updated_at?: string
        }
        Update: {
          authors?: string | null
          available_quantity?: number
          created_at?: string
          id?: string
          institution_id?: string
          isbn?: string | null
          location_shelf?: string | null
          meta?: Json
          publisher?: string | null
          quantity?: number
          status?: Database["public"]["Enums"]["person_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "library_books_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      library_issues: {
        Row: {
          created_at: string
          due_on: string
          fine_amount: number
          id: string
          issued_on: string
          library_book_id: string
          returned_on: string | null
          staff_id: string | null
          status: string
          student_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          due_on: string
          fine_amount?: number
          id?: string
          issued_on?: string
          library_book_id: string
          returned_on?: string | null
          staff_id?: string | null
          status?: string
          student_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          due_on?: string
          fine_amount?: number
          id?: string
          issued_on?: string
          library_book_id?: string
          returned_on?: string | null
          staff_id?: string | null
          status?: string
          student_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "library_issues_library_book_id_fkey"
            columns: ["library_book_id"]
            isOneToOne: false
            referencedRelation: "library_books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "library_issues_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "library_issues_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_analytics_summary"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "library_issues_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_register"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "library_issues_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
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
            referencedRelation: "student_analytics_summary"
            referencedColumns: ["student_id"]
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
          body: string
          created_at: string
          id: string
          institution_id: string | null
          is_read: boolean
          meta: Json
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          institution_id?: string | null
          is_read?: boolean
          meta?: Json
          title: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          institution_id?: string | null
          is_read?: boolean
          meta?: Json
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_items: {
        Row: {
          allowances: number
          bank_account: string | null
          basic_pay: number
          deductions: number
          id: string
          net_pay: number
          payroll_run_id: string
          remarks: string | null
          staff_id: string
        }
        Insert: {
          allowances?: number
          bank_account?: string | null
          basic_pay?: number
          deductions?: number
          id?: string
          net_pay?: number
          payroll_run_id: string
          remarks?: string | null
          staff_id: string
        }
        Update: {
          allowances?: number
          bank_account?: string | null
          basic_pay?: number
          deductions?: number
          id?: string
          net_pay?: number
          payroll_run_id?: string
          remarks?: string | null
          staff_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_items_payroll_run_id_fkey"
            columns: ["payroll_run_id"]
            isOneToOne: false
            referencedRelation: "payroll_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_items_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
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
          processed_by: string | null
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
          processed_by?: string | null
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
          processed_by?: string | null
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
      programs: {
        Row: {
          code: string | null
          created_at: string
          department_id: string | null
          duration_years: number | null
          id: string
          institution_id: string
          level: string | null
          meta: Json
          name: string
          status: Database["public"]["Enums"]["person_status"]
          stream: string | null
          updated_at: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          department_id?: string | null
          duration_years?: number | null
          id?: string
          institution_id: string
          level?: string | null
          meta?: Json
          name: string
          status?: Database["public"]["Enums"]["person_status"]
          stream?: string | null
          updated_at?: string
        }
        Update: {
          code?: string | null
          created_at?: string
          department_id?: string | null
          duration_years?: number | null
          id?: string
          institution_id?: string
          level?: string | null
          meta?: Json
          name?: string
          status?: Database["public"]["Enums"]["person_status"]
          stream?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "programs_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programs_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      question_banks: {
        Row: {
          correct_answer: string
          created_at: string
          created_by: string | null
          difficulty: Database["public"]["Enums"]["question_difficulty"]
          explanation: string | null
          grade: string
          id: string
          marks: number
          options: Json | null
          question_text: string
          question_type: Database["public"]["Enums"]["question_type"]
          subject_id: string
          topic: string
          updated_at: string
        }
        Insert: {
          correct_answer?: string
          created_at?: string
          created_by?: string | null
          difficulty?: Database["public"]["Enums"]["question_difficulty"]
          explanation?: string | null
          grade: string
          id?: string
          marks?: number
          options?: Json | null
          question_text: string
          question_type?: Database["public"]["Enums"]["question_type"]
          subject_id: string
          topic?: string
          updated_at?: string
        }
        Update: {
          correct_answer?: string
          created_at?: string
          created_by?: string | null
          difficulty?: Database["public"]["Enums"]["question_difficulty"]
          explanation?: string | null
          grade?: string
          id?: string
          marks?: number
          options?: Json | null
          question_text?: string
          question_type?: Database["public"]["Enums"]["question_type"]
          subject_id?: string
          topic?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_banks_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      result_publications: {
        Row: {
          exam_id: string
          id: string
          meta: Json
          notify_parents: boolean
          notify_students: boolean
          published_at: string
          published_by: string | null
        }
        Insert: {
          exam_id: string
          id?: string
          meta?: Json
          notify_parents?: boolean
          notify_students?: boolean
          published_at?: string
          published_by?: string | null
        }
        Update: {
          exam_id?: string
          id?: string
          meta?: Json
          notify_parents?: boolean
          notify_students?: boolean
          published_at?: string
          published_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "result_publications_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: true
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
      scholarship_applications: {
        Row: {
          academic_year_id: string | null
          applied_on: string
          created_at: string
          id: string
          income_verified: boolean
          meta: Json
          scholarship_id: string
          status: Database["public"]["Enums"]["verification_status"]
          student_id: string
          updated_at: string
        }
        Insert: {
          academic_year_id?: string | null
          applied_on?: string
          created_at?: string
          id?: string
          income_verified?: boolean
          meta?: Json
          scholarship_id: string
          status?: Database["public"]["Enums"]["verification_status"]
          student_id: string
          updated_at?: string
        }
        Update: {
          academic_year_id?: string | null
          applied_on?: string
          created_at?: string
          id?: string
          income_verified?: boolean
          meta?: Json
          scholarship_id?: string
          status?: Database["public"]["Enums"]["verification_status"]
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scholarship_applications_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scholarship_applications_scholarship_id_fkey"
            columns: ["scholarship_id"]
            isOneToOne: false
            referencedRelation: "scholarships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scholarship_applications_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_analytics_summary"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "scholarship_applications_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_register"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "scholarship_applications_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      scholarship_verifications: {
        Row: {
          application_id: string
          comments: string | null
          created_at: string
          id: string
          status: Database["public"]["Enums"]["verification_status"]
          updated_at: string
          verification_date: string
          verified_by: string | null
        }
        Insert: {
          application_id: string
          comments?: string | null
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["verification_status"]
          updated_at?: string
          verification_date?: string
          verified_by?: string | null
        }
        Update: {
          application_id?: string
          comments?: string | null
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["verification_status"]
          updated_at?: string
          verification_date?: string
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scholarship_verifications_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "scholarship_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      scholarships: {
        Row: {
          amount: number | null
          created_at: string
          description: string | null
          eligibility_criteria: string | null
          id: string
          institution_id: string
          meta: Json
          name: string
          provider: string | null
          status: Database["public"]["Enums"]["person_status"]
          updated_at: string
        }
        Insert: {
          amount?: number | null
          created_at?: string
          description?: string | null
          eligibility_criteria?: string | null
          id?: string
          institution_id: string
          meta?: Json
          name: string
          provider?: string | null
          status?: Database["public"]["Enums"]["person_status"]
          updated_at?: string
        }
        Update: {
          amount?: number | null
          created_at?: string
          description?: string | null
          eligibility_criteria?: string | null
          id?: string
          institution_id?: string
          meta?: Json
          name?: string
          provider?: string | null
          status?: Database["public"]["Enums"]["person_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scholarships_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      sections: {
        Row: {
          academic_year_id: string | null
          campus_id: string | null
          capacity: number | null
          class_level_id: string | null
          created_at: string
          id: string
          institution_id: string
          label: string
          meta: Json
          program_id: string | null
          status: Database["public"]["Enums"]["person_status"]
          updated_at: string
        }
        Insert: {
          academic_year_id?: string | null
          campus_id?: string | null
          capacity?: number | null
          class_level_id?: string | null
          created_at?: string
          id?: string
          institution_id: string
          label: string
          meta?: Json
          program_id?: string | null
          status?: Database["public"]["Enums"]["person_status"]
          updated_at?: string
        }
        Update: {
          academic_year_id?: string | null
          campus_id?: string | null
          capacity?: number | null
          class_level_id?: string | null
          created_at?: string
          id?: string
          institution_id?: string
          label?: string
          meta?: Json
          program_id?: string | null
          status?: Database["public"]["Enums"]["person_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sections_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sections_campus_id_fkey"
            columns: ["campus_id"]
            isOneToOne: false
            referencedRelation: "campuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sections_class_level_id_fkey"
            columns: ["class_level_id"]
            isOneToOne: false
            referencedRelation: "class_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sections_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sections_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      staff: {
        Row: {
          campus_id: string | null
          created_at: string
          department_id: string | null
          designation: string | null
          email: string | null
          employee_no: string | null
          full_name: string
          id: string
          institution_id: string | null
          meta: Json
          phone: string | null
          profile_id: string | null
          status: Database["public"]["Enums"]["staff_status"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          campus_id?: string | null
          created_at?: string
          department_id?: string | null
          designation?: string | null
          email?: string | null
          employee_no?: string | null
          full_name: string
          id?: string
          institution_id?: string | null
          meta?: Json
          phone?: string | null
          profile_id?: string | null
          status?: Database["public"]["Enums"]["staff_status"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          campus_id?: string | null
          created_at?: string
          department_id?: string | null
          designation?: string | null
          email?: string | null
          employee_no?: string | null
          full_name?: string
          id?: string
          institution_id?: string | null
          meta?: Json
          phone?: string | null
          profile_id?: string | null
          status?: Database["public"]["Enums"]["staff_status"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_campus_id_fkey"
            columns: ["campus_id"]
            isOneToOne: false
            referencedRelation: "campuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_guardians: {
        Row: {
          can_pickup: boolean
          created_at: string
          guardian_id: string
          id: string
          is_primary: boolean
          meta: Json
          relationship: Database["public"]["Enums"]["guardian_relationship"]
          student_id: string
          updated_at: string
        }
        Insert: {
          can_pickup?: boolean
          created_at?: string
          guardian_id: string
          id?: string
          is_primary?: boolean
          meta?: Json
          relationship?: Database["public"]["Enums"]["guardian_relationship"]
          student_id: string
          updated_at?: string
        }
        Update: {
          can_pickup?: boolean
          created_at?: string
          guardian_id?: string
          id?: string
          is_primary?: boolean
          meta?: Json
          relationship?: Database["public"]["Enums"]["guardian_relationship"]
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_guardians_guardian_id_fkey"
            columns: ["guardian_id"]
            isOneToOne: false
            referencedRelation: "guardians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_guardians_guardian_id_fkey"
            columns: ["guardian_id"]
            isOneToOne: false
            referencedRelation: "student_register"
            referencedColumns: ["guardian_id"]
          },
          {
            foreignKeyName: "student_guardians_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_analytics_summary"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_guardians_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_register"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_guardians_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          address: string | null
          admission_no: string
          alternate_phone: string | null
          attendance_percent: number
          blood_group: string | null
          campus_id: string | null
          community: string | null
          created_at: string
          created_by: string | null
          dob: string | null
          email: string | null
          emis_id: string | null
          fee_status: string
          first_graduate: boolean
          first_name: string
          gender: string | null
          id: string
          income_verification_status: Database["public"]["Enums"]["verification_status"]
          institution_id: string | null
          last_name: string | null
          meta: Json
          nationality: string | null
          phone: string | null
          profile_id: string | null
          scholarship_notes: string | null
          status: Database["public"]["Enums"]["student_status"]
          umis_id: string | null
          updated_at: string
          updated_by: string | null
          user_id: string | null
        }
        Insert: {
          address?: string | null
          admission_no: string
          alternate_phone?: string | null
          attendance_percent?: number
          blood_group?: string | null
          campus_id?: string | null
          community?: string | null
          created_at?: string
          created_by?: string | null
          dob?: string | null
          email?: string | null
          emis_id?: string | null
          fee_status?: string
          first_graduate?: boolean
          first_name: string
          gender?: string | null
          id?: string
          income_verification_status?: Database["public"]["Enums"]["verification_status"]
          institution_id?: string | null
          last_name?: string | null
          meta?: Json
          nationality?: string | null
          phone?: string | null
          profile_id?: string | null
          scholarship_notes?: string | null
          status?: Database["public"]["Enums"]["student_status"]
          umis_id?: string | null
          updated_at?: string
          updated_by?: string | null
          user_id?: string | null
        }
        Update: {
          address?: string | null
          admission_no?: string
          alternate_phone?: string | null
          attendance_percent?: number
          blood_group?: string | null
          campus_id?: string | null
          community?: string | null
          created_at?: string
          created_by?: string | null
          dob?: string | null
          email?: string | null
          emis_id?: string | null
          fee_status?: string
          first_graduate?: boolean
          first_name?: string
          gender?: string | null
          id?: string
          income_verification_status?: Database["public"]["Enums"]["verification_status"]
          institution_id?: string | null
          last_name?: string | null
          meta?: Json
          nationality?: string | null
          phone?: string | null
          profile_id?: string | null
          scholarship_notes?: string | null
          status?: Database["public"]["Enums"]["student_status"]
          umis_id?: string | null
          updated_at?: string
          updated_by?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_campus_id_fkey"
            columns: ["campus_id"]
            isOneToOne: false
            referencedRelation: "campuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          code: string | null
          created_at: string
          department_id: string | null
          id: string
          institution_id: string
          meta: Json
          name: string
          program_id: string | null
          status: Database["public"]["Enums"]["person_status"]
          updated_at: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          department_id?: string | null
          id?: string
          institution_id: string
          meta?: Json
          name: string
          program_id?: string | null
          status?: Database["public"]["Enums"]["person_status"]
          updated_at?: string
        }
        Update: {
          code?: string | null
          created_at?: string
          department_id?: string | null
          id?: string
          institution_id?: string
          meta?: Json
          name?: string
          program_id?: string | null
          status?: Database["public"]["Enums"]["person_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subjects_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subjects_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subjects_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      submissions: {
        Row: {
          assignment_id: string
          content: string | null
          feedback: string | null
          file_url: string | null
          graded_at: string | null
          graded_by: string | null
          id: string
          marks: number | null
          status: string
          student_id: string
          submitted_at: string
        }
        Insert: {
          assignment_id: string
          content?: string | null
          feedback?: string | null
          file_url?: string | null
          graded_at?: string | null
          graded_by?: string | null
          id?: string
          marks?: number | null
          status?: string
          student_id: string
          submitted_at?: string
        }
        Update: {
          assignment_id?: string
          content?: string | null
          feedback?: string | null
          file_url?: string | null
          graded_at?: string | null
          graded_by?: string | null
          id?: string
          marks?: number | null
          status?: string
          student_id?: string
          submitted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_analytics_summary"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "submissions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_register"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "submissions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      substitutions: {
        Row: {
          created_at: string
          date: string
          id: string
          original_teacher_id: string
          reason: string | null
          status: string
          substitute_teacher_id: string
          timetable_entry_id: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          original_teacher_id: string
          reason?: string | null
          status?: string
          substitute_teacher_id: string
          timetable_entry_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          original_teacher_id?: string
          reason?: string | null
          status?: string
          substitute_teacher_id?: string
          timetable_entry_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "substitutions_original_teacher_id_fkey"
            columns: ["original_teacher_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "substitutions_substitute_teacher_id_fkey"
            columns: ["substitute_teacher_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "substitutions_timetable_entry_id_fkey"
            columns: ["timetable_entry_id"]
            isOneToOne: false
            referencedRelation: "timetable_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          institution_id: string | null
          meta: Json
          priority: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          institution_id?: string | null
          meta?: Json
          priority?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          institution_id?: string | null
          meta?: Json
          priority?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      thread_participants: {
        Row: {
          created_at: string
          id: string
          last_read_at: string
          thread_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_read_at?: string
          thread_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_read_at?: string
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
          day_of_week: number
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
          class_id: string
          created_at: string
          day_of_week: number
          id: string
          room: string | null
          subject_id: string
          teacher_id: string
          time_slot_id: string
          updated_at: string
        }
        Insert: {
          academic_year_id?: string | null
          class_id: string
          created_at?: string
          day_of_week: number
          id?: string
          room?: string | null
          subject_id: string
          teacher_id: string
          time_slot_id: string
          updated_at?: string
        }
        Update: {
          academic_year_id?: string | null
          class_id?: string
          created_at?: string
          day_of_week?: number
          id?: string
          room?: string | null
          subject_id?: string
          teacher_id?: string
          time_slot_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "timetable_entries_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetable_entries_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetable_entries_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetable_entries_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
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
          academic_year: string
          created_at: string
          created_by: string | null
          exam_ids: string[]
          gpa: number | null
          id: string
          issued_at: string | null
          obtained_marks: number | null
          pdf_url: string | null
          percentage: number | null
          qr_token: string | null
          status: Database["public"]["Enums"]["transcript_status"]
          student_id: string
          total_marks: number | null
          updated_at: string
        }
        Insert: {
          academic_year: string
          created_at?: string
          created_by?: string | null
          exam_ids?: string[]
          gpa?: number | null
          id?: string
          issued_at?: string | null
          obtained_marks?: number | null
          pdf_url?: string | null
          percentage?: number | null
          qr_token?: string | null
          status?: Database["public"]["Enums"]["transcript_status"]
          student_id: string
          total_marks?: number | null
          updated_at?: string
        }
        Update: {
          academic_year?: string
          created_at?: string
          created_by?: string | null
          exam_ids?: string[]
          gpa?: number | null
          id?: string
          issued_at?: string | null
          obtained_marks?: number | null
          pdf_url?: string | null
          percentage?: number | null
          qr_token?: string | null
          status?: Database["public"]["Enums"]["transcript_status"]
          student_id?: string
          total_marks?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transcripts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_analytics_summary"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "transcripts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_register"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "transcripts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      transport_allocations: {
        Row: {
          allocated_from: string
          allocated_to: string | null
          created_at: string
          id: string
          pickup_stop: string | null
          status: Database["public"]["Enums"]["person_status"]
          student_id: string
          transport_route_id: string
          updated_at: string
        }
        Insert: {
          allocated_from?: string
          allocated_to?: string | null
          created_at?: string
          id?: string
          pickup_stop?: string | null
          status?: Database["public"]["Enums"]["person_status"]
          student_id: string
          transport_route_id: string
          updated_at?: string
        }
        Update: {
          allocated_from?: string
          allocated_to?: string | null
          created_at?: string
          id?: string
          pickup_stop?: string | null
          status?: Database["public"]["Enums"]["person_status"]
          student_id?: string
          transport_route_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transport_allocations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_analytics_summary"
            referencedColumns: ["student_id"]
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
          {
            foreignKeyName: "transport_allocations_transport_route_id_fkey"
            columns: ["transport_route_id"]
            isOneToOne: false
            referencedRelation: "transport_routes"
            referencedColumns: ["id"]
          },
        ]
      }
      transport_routes: {
        Row: {
          cost_per_term: number | null
          created_at: string
          driver_id: string | null
          id: string
          institution_id: string
          route_code: string | null
          route_name: string
          status: Database["public"]["Enums"]["person_status"]
          updated_at: string
          vehicle_no: string | null
        }
        Insert: {
          cost_per_term?: number | null
          created_at?: string
          driver_id?: string | null
          id?: string
          institution_id: string
          route_code?: string | null
          route_name: string
          status?: Database["public"]["Enums"]["person_status"]
          updated_at?: string
          vehicle_no?: string | null
        }
        Update: {
          cost_per_term?: number | null
          created_at?: string
          driver_id?: string | null
          id?: string
          institution_id?: string
          route_code?: string | null
          route_name?: string
          status?: Database["public"]["Enums"]["person_status"]
          updated_at?: string
          vehicle_no?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transport_routes_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transport_routes_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
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
      fee_collection_summary: {
        Row: {
          academic_year_id: string | null
          average_payment: number | null
          fee_category_id: string | null
          institution_id: string | null
          max_payment: number | null
          min_payment: number | null
          payment_count: number | null
          payment_method: string | null
          status: string | null
          total_collected: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fee_payments_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_payments_fee_category_id_fkey"
            columns: ["fee_category_id"]
            isOneToOne: false
            referencedRelation: "fee_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_payments_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      student_analytics_summary: {
        Row: {
          academic_year_id: string | null
          attendance_percent: number | null
          class_level_id: string | null
          display_name: string | null
          enrollment_id: string | null
          enrollment_status:
            | Database["public"]["Enums"]["enrollment_status"]
            | null
          fee_status: string | null
          first_name: string | null
          gender: string | null
          institution_id: string | null
          last_name: string | null
          roll_number: number | null
          section_id: string | null
          student_id: string | null
          student_status: Database["public"]["Enums"]["student_status"] | null
          total_fees_paid: number | null
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
            foreignKeyName: "enrollments_class_level_id_fkey"
            columns: ["class_level_id"]
            isOneToOne: false
            referencedRelation: "class_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      student_register: {
        Row: {
          academic_year: string | null
          address: string | null
          admission_no: string | null
          alternate_phone: string | null
          attendance_percent: number | null
          blood_group: string | null
          community: string | null
          created_at: string | null
          display_name: string | null
          dob: string | null
          email: string | null
          emis_id: string | null
          enrollment_id: string | null
          enrollment_status:
            | Database["public"]["Enums"]["enrollment_status"]
            | null
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
          income_verification_status:
            | Database["public"]["Enums"]["verification_status"]
            | null
          last_name: string | null
          nationality: string | null
          phone: string | null
          roll_number: number | null
          scholarship_notes: string | null
          section: string | null
          status: Database["public"]["Enums"]["student_status"] | null
          stream: string | null
          student_id: string | null
          umis_id: string | null
          updated_at: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      can_manage_operations_finance: {
        Args: { _user_id: string }
        Returns: boolean
      }
      can_manage_people_academics: {
        Args: { _user_id: string }
        Returns: boolean
      }
      can_manage_success_compliance: {
        Args: { _user_id: string }
        Returns: boolean
      }
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
      enrollment_status:
        | "active"
        | "completed"
        | "promoted"
        | "transferred"
        | "withdrawn"
      exam_status: "draft" | "published" | "completed" | "cancelled"
      exam_type:
        | "quiz"
        | "unit_test"
        | "midterm"
        | "final"
        | "preboard"
        | "other"
      guardian_relationship:
        | "father"
        | "mother"
        | "guardian"
        | "grandparent"
        | "sibling"
        | "other"
      mark_status: "pending" | "approved" | "rejected"
      person_status: "active" | "inactive" | "archived"
      question_difficulty: "easy" | "medium" | "hard"
      question_type:
        | "mcq"
        | "short_answer"
        | "long_answer"
        | "true_false"
        | "fill_blank"
      staff_status: "active" | "on_leave" | "inactive" | "relieved"
      student_status:
        | "active"
        | "inactive"
        | "graduated"
        | "transferred"
        | "withdrawn"
        | "alumni"
      transcript_status: "draft" | "issued" | "revoked"
      verification_status:
        | "pending"
        | "agreed"
        | "appealed"
        | "verified"
        | "rejected"
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
      enrollment_status: [
        "active",
        "completed",
        "promoted",
        "transferred",
        "withdrawn",
      ],
      exam_status: ["draft", "published", "completed", "cancelled"],
      exam_type: ["quiz", "unit_test", "midterm", "final", "preboard", "other"],
      guardian_relationship: [
        "father",
        "mother",
        "guardian",
        "grandparent",
        "sibling",
        "other",
      ],
      mark_status: ["pending", "approved", "rejected"],
      person_status: ["active", "inactive", "archived"],
      question_difficulty: ["easy", "medium", "hard"],
      question_type: [
        "mcq",
        "short_answer",
        "long_answer",
        "true_false",
        "fill_blank",
      ],
      staff_status: ["active", "on_leave", "inactive", "relieved"],
      student_status: [
        "active",
        "inactive",
        "graduated",
        "transferred",
        "withdrawn",
        "alumni",
      ],
      transcript_status: ["draft", "issued", "revoked"],
      verification_status: [
        "pending",
        "agreed",
        "appealed",
        "verified",
        "rejected",
      ],
    },
  },
} as const
