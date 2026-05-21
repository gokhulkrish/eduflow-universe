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
        }
        Relationships: [
          {
            foreignKeyName: "students_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
            foreignKeyName: "guardians_profile_id_fkey"
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
            foreignKeyName: "student_guardians_student_id_fkey"
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
            foreignKeyName: "enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
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
      student_register: {
        Row: {
          academic_year: string | null
          address: string | null
          admission_no: string
          alternate_phone: string | null
          attendance_percent: number
          blood_group: string | null
          community: string | null
          created_at: string
          display_name: string
          dob: string | null
          email: string | null
          emis_id: string | null
          enrollment_id: string | null
          enrollment_status: Database["public"]["Enums"]["enrollment_status"] | null
          fee_status: string
          first_graduate: boolean
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
          income_verification_status: Database["public"]["Enums"]["verification_status"]
          last_name: string | null
          nationality: string | null
          phone: string | null
          roll_number: number | null
          scholarship_notes: string | null
          section: string | null
          status: Database["public"]["Enums"]["student_status"]
          stream: string | null
          student_id: string
          umis_id: string | null
          updated_at: string
        }
        Relationships: []
      }
    }
    Functions: {
      can_manage_people_academics: {
        Args: {
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
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
      guardian_relationship:
        | "father"
        | "mother"
        | "guardian"
        | "grandparent"
        | "sibling"
        | "other"
      person_status:
        | "active"
        | "inactive"
        | "archived"
      staff_status:
        | "active"
        | "on_leave"
        | "inactive"
        | "relieved"
      student_status:
        | "active"
        | "inactive"
        | "graduated"
        | "transferred"
        | "withdrawn"
        | "alumni"
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
      guardian_relationship: [
        "father",
        "mother",
        "guardian",
        "grandparent",
        "sibling",
        "other",
      ],
      person_status: ["active", "inactive", "archived"],
      staff_status: ["active", "on_leave", "inactive", "relieved"],
      student_status: [
        "active",
        "inactive",
        "graduated",
        "transferred",
        "withdrawn",
        "alumni",
      ],
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
