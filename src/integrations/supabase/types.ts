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
          is_current: boolean
          name: string
          start_date: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          is_current?: boolean
          name: string
          start_date: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          is_current?: boolean
          name?: string
          start_date?: string
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
      certificate_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
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
          body: string
          code: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          active?: boolean
          body: string
          code: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          active?: boolean
          body?: string
          code?: string
          created_at?: string
          id?: string
          name?: string
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
          created_at: string
          id: string
          roll_no: string | null
          status: string
          student_id: string
        }
        Insert: {
          academic_year_id?: string | null
          class_id: string
          created_at?: string
          id?: string
          roll_no?: string | null
          status?: string
          student_id: string
        }
        Update: {
          academic_year_id?: string | null
          class_id?: string
          created_at?: string
          id?: string
          roll_no?: string | null
          status?: string
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
            foreignKeyName: "enrollments_student_id_fkey"
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
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_payments: {
        Row: {
          amount: number
          id: string
          invoice_id: string
          method: string
          paid_at: string
          received_by: string | null
          reference: string | null
        }
        Insert: {
          amount: number
          id?: string
          invoice_id: string
          method?: string
          paid_at?: string
          received_by?: string | null
          reference?: string | null
        }
        Update: {
          amount?: number
          id?: string
          invoice_id?: string
          method?: string
          paid_at?: string
          received_by?: string | null
          reference?: string | null
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
      fee_structures: {
        Row: {
          academic_year_id: string | null
          amount: number
          created_at: string
          due_day: number | null
          frequency: string
          grade: string | null
          id: string
          name: string
        }
        Insert: {
          academic_year_id?: string | null
          amount?: number
          created_at?: string
          due_day?: number | null
          frequency?: string
          grade?: string | null
          id?: string
          name: string
        }
        Update: {
          academic_year_id?: string | null
          amount?: number
          created_at?: string
          due_day?: number | null
          frequency?: string
          grade?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "fee_structures_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
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
          id: string
          occupied: number
          room_no: string
          room_type: string | null
        }
        Insert: {
          block: string
          capacity?: number
          created_at?: string
          id?: string
          occupied?: number
          room_no: string
          room_type?: string | null
        }
        Update: {
          block?: string
          capacity?: number
          created_at?: string
          id?: string
          occupied?: number
          room_no?: string
          room_type?: string | null
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
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
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
          address: string | null
          admission_no: string
          alternate_phone: string | null
          annual_income: number | null
          block: string | null
          blood_group: string | null
          community: string | null
          created_at: string
          district: string | null
          dob: string | null
          email: string | null
          emis_id: string | null
          father_name: string | null
          father_occupation: string | null
          first_graduate: boolean | null
          first_name: string
          gender: string | null
          guardian_phone: string | null
          house: string | null
          id: string
          income_verified: string | null
          last_name: string | null
          mother_name: string | null
          mother_occupation: string | null
          nationality: string | null
          notes: string | null
          phone: string | null
          status: string
          umis_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          admission_no: string
          alternate_phone?: string | null
          annual_income?: number | null
          block?: string | null
          blood_group?: string | null
          community?: string | null
          created_at?: string
          district?: string | null
          dob?: string | null
          email?: string | null
          emis_id?: string | null
          father_name?: string | null
          father_occupation?: string | null
          first_graduate?: boolean | null
          first_name: string
          gender?: string | null
          guardian_phone?: string | null
          house?: string | null
          id?: string
          income_verified?: string | null
          last_name?: string | null
          mother_name?: string | null
          mother_occupation?: string | null
          nationality?: string | null
          notes?: string | null
          phone?: string | null
          status?: string
          umis_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          admission_no?: string
          alternate_phone?: string | null
          annual_income?: number | null
          block?: string | null
          blood_group?: string | null
          community?: string | null
          created_at?: string
          district?: string | null
          dob?: string | null
          email?: string | null
          emis_id?: string | null
          father_name?: string | null
          father_occupation?: string | null
          first_graduate?: boolean | null
          first_name?: string
          gender?: string | null
          guardian_phone?: string | null
          house?: string | null
          id?: string
          income_verified?: string | null
          last_name?: string | null
          mother_name?: string | null
          mother_occupation?: string | null
          nationality?: string | null
          notes?: string | null
          phone?: string | null
          status?: string
          umis_id?: string | null
          updated_at?: string
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
      [_ in never]: never
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
