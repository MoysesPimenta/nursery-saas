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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      allergies: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          severity_level: string | null
          tenant_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          severity_level?: string | null
          tenant_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          severity_level?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "allergies_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          after_data: Json | null
          before_data: Json | null
          created_at: string | null
          entity_id: string | null
          entity_type: string
          id: number
          ip_address: unknown
          tenant_id: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string | null
          entity_id?: string | null
          entity_type: string
          id?: number
          ip_address?: unknown
          tenant_id: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: number
          ip_address?: unknown
          tenant_id?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      authorizations: {
        Row: {
          assigned_to: string | null
          child_id: string
          created_at: string | null
          id: string
          notes: string | null
          priority: string | null
          requested_at: string | null
          requested_by: string
          responded_at: string | null
          responded_by: string | null
          status: string | null
          symptoms: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          child_id: string
          created_at?: string | null
          id?: string
          notes?: string | null
          priority?: string | null
          requested_at?: string | null
          requested_by: string
          responded_at?: string | null
          responded_by?: string | null
          status?: string | null
          symptoms?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          child_id?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          priority?: string | null
          requested_at?: string | null
          requested_by?: string
          responded_at?: string | null
          responded_by?: string | null
          status?: string | null
          symptoms?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "authorizations_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "authorizations_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "authorizations_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "v_allergy_alerts"
            referencedColumns: ["child_id"]
          },
          {
            foreignKeyName: "authorizations_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "authorizations_responded_by_fkey"
            columns: ["responded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "authorizations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      child_allergies: {
        Row: {
          allergy_id: string
          child_id: string
          created_at: string | null
          diagnosed_date: string | null
          id: string
          notes: string | null
          reaction_description: string | null
        }
        Insert: {
          allergy_id: string
          child_id: string
          created_at?: string | null
          diagnosed_date?: string | null
          id?: string
          notes?: string | null
          reaction_description?: string | null
        }
        Update: {
          allergy_id?: string
          child_id?: string
          created_at?: string | null
          diagnosed_date?: string | null
          id?: string
          notes?: string | null
          reaction_description?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "child_allergies_allergy_id_fkey"
            columns: ["allergy_id"]
            isOneToOne: false
            referencedRelation: "allergies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "child_allergies_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "child_allergies_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "v_allergy_alerts"
            referencedColumns: ["child_id"]
          },
        ]
      }
      child_medications: {
        Row: {
          authorization_document_url: string | null
          child_id: string
          created_at: string | null
          dosage: string
          end_date: string | null
          frequency: string | null
          id: string
          medication_id: string
          notes: string | null
          prescribed_by: string | null
          start_date: string | null
        }
        Insert: {
          authorization_document_url?: string | null
          child_id: string
          created_at?: string | null
          dosage: string
          end_date?: string | null
          frequency?: string | null
          id?: string
          medication_id: string
          notes?: string | null
          prescribed_by?: string | null
          start_date?: string | null
        }
        Update: {
          authorization_document_url?: string | null
          child_id?: string
          created_at?: string | null
          dosage?: string
          end_date?: string | null
          frequency?: string | null
          id?: string
          medication_id?: string
          notes?: string | null
          prescribed_by?: string | null
          start_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "child_medications_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "child_medications_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "v_allergy_alerts"
            referencedColumns: ["child_id"]
          },
          {
            foreignKeyName: "child_medications_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
        ]
      }
      child_parents: {
        Row: {
          child_id: string
          consent_date: string | null
          consent_given: boolean | null
          created_at: string | null
          id: string
          is_primary_contact: boolean | null
          parent_user_id: string
          relationship: string | null
        }
        Insert: {
          child_id: string
          consent_date?: string | null
          consent_given?: boolean | null
          created_at?: string | null
          id?: string
          is_primary_contact?: boolean | null
          parent_user_id: string
          relationship?: string | null
        }
        Update: {
          child_id?: string
          consent_date?: string | null
          consent_given?: boolean | null
          created_at?: string | null
          id?: string
          is_primary_contact?: boolean | null
          parent_user_id?: string
          relationship?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "child_parents_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "child_parents_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "v_allergy_alerts"
            referencedColumns: ["child_id"]
          },
          {
            foreignKeyName: "child_parents_parent_user_id_fkey"
            columns: ["parent_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      children: {
        Row: {
          blood_type: string | null
          class_id: string | null
          created_at: string | null
          date_of_birth: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relation: string | null
          first_name: string
          gender: string | null
          id: string
          is_archived: boolean | null
          last_name: string
          notes: string | null
          photo_url: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          blood_type?: string | null
          class_id?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relation?: string | null
          first_name: string
          gender?: string | null
          id?: string
          is_archived?: boolean | null
          last_name: string
          notes?: string | null
          photo_url?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          blood_type?: string | null
          class_id?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relation?: string | null
          first_name?: string
          gender?: string | null
          id?: string
          is_archived?: boolean | null
          last_name?: string
          notes?: string | null
          photo_url?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "children_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "children_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          academic_year: string | null
          capacity: number | null
          created_at: string | null
          grade_level: string | null
          id: string
          name: string
          teacher_id: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          academic_year?: string | null
          capacity?: number | null
          created_at?: string | null
          grade_level?: string | null
          id?: string
          name: string
          teacher_id?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          academic_year?: string | null
          capacity?: number | null
          created_at?: string | null
          grade_level?: string | null
          id?: string
          name?: string
          teacher_id?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "classes_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_field_values: {
        Row: {
          created_at: string | null
          custom_field_id: string
          entity_id: string
          id: string
          updated_at: string | null
          value: Json | null
        }
        Insert: {
          created_at?: string | null
          custom_field_id: string
          entity_id: string
          id?: string
          updated_at?: string | null
          value?: Json | null
        }
        Update: {
          created_at?: string | null
          custom_field_id?: string
          entity_id?: string
          id?: string
          updated_at?: string | null
          value?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_field_values_custom_field_id_fkey"
            columns: ["custom_field_id"]
            isOneToOne: false
            referencedRelation: "custom_fields"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_fields: {
        Row: {
          created_at: string | null
          display_order: number | null
          entity_type: string
          field_name: string
          field_options: Json | null
          field_type: string
          id: string
          is_active: boolean | null
          is_required: boolean | null
          tenant_id: string
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          entity_type: string
          field_name: string
          field_options?: Json | null
          field_type: string
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          tenant_id: string
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          entity_type?: string
          field_name?: string
          field_options?: Json | null
          field_type?: string
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_fields_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          created_at: string | null
          description: string | null
          head_id: string | null
          id: string
          name: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          head_id?: string | null
          id?: string
          name: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          head_id?: string | null
          id?: string
          name?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "departments_head_id_fkey"
            columns: ["head_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "departments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_allergies: {
        Row: {
          allergy_id: string
          created_at: string | null
          diagnosed_date: string | null
          employee_id: string
          id: string
          notes: string | null
          reaction_description: string | null
        }
        Insert: {
          allergy_id: string
          created_at?: string | null
          diagnosed_date?: string | null
          employee_id: string
          id?: string
          notes?: string | null
          reaction_description?: string | null
        }
        Update: {
          allergy_id?: string
          created_at?: string | null
          diagnosed_date?: string | null
          employee_id?: string
          id?: string
          notes?: string | null
          reaction_description?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_allergies_allergy_id_fkey"
            columns: ["allergy_id"]
            isOneToOne: false
            referencedRelation: "allergies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_allergies_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_medications: {
        Row: {
          authorization_document_url: string | null
          created_at: string | null
          dosage: string
          employee_id: string
          end_date: string | null
          frequency: string | null
          id: string
          medication_id: string
          notes: string | null
          prescribed_by: string | null
          start_date: string | null
        }
        Insert: {
          authorization_document_url?: string | null
          created_at?: string | null
          dosage: string
          employee_id: string
          end_date?: string | null
          frequency?: string | null
          id?: string
          medication_id: string
          notes?: string | null
          prescribed_by?: string | null
          start_date?: string | null
        }
        Update: {
          authorization_document_url?: string | null
          created_at?: string | null
          dosage?: string
          employee_id?: string
          end_date?: string | null
          frequency?: string | null
          id?: string
          medication_id?: string
          notes?: string | null
          prescribed_by?: string | null
          start_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_medications_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_medications_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          blood_type: string | null
          created_at: string | null
          date_of_birth: string | null
          department_id: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          first_name: string
          hire_date: string | null
          id: string
          is_archived: boolean | null
          last_name: string
          notes: string | null
          photo_url: string | null
          position: string | null
          tenant_id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          blood_type?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          department_id?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name: string
          hire_date?: string | null
          id?: string
          is_archived?: boolean | null
          last_name: string
          notes?: string | null
          photo_url?: string | null
          position?: string | null
          tenant_id: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          blood_type?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          department_id?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name?: string
          hire_date?: string | null
          id?: string
          is_archived?: boolean | null
          last_name?: string
          notes?: string | null
          photo_url?: string | null
          position?: string | null
          tenant_id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      medications: {
        Row: {
          created_at: string | null
          default_dosage: string | null
          dosage_form: string | null
          generic_name: string | null
          id: string
          instructions: string | null
          is_active: boolean | null
          name: string
          requires_authorization: boolean | null
          tenant_id: string
        }
        Insert: {
          created_at?: string | null
          default_dosage?: string | null
          dosage_form?: string | null
          generic_name?: string | null
          id?: string
          instructions?: string | null
          is_active?: boolean | null
          name: string
          requires_authorization?: boolean | null
          tenant_id: string
        }
        Update: {
          created_at?: string | null
          default_dosage?: string | null
          dosage_form?: string | null
          generic_name?: string | null
          id?: string
          instructions?: string | null
          is_active?: boolean | null
          name?: string
          requires_authorization?: boolean | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "medications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          action: string
          created_at: string | null
          description: string | null
          id: string
          name: string
          resource: string
        }
        Insert: {
          action: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          resource: string
        }
        Update: {
          action?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          resource?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          permission_id: string
          role_id: string
        }
        Insert: {
          permission_id: string
          role_id: string
        }
        Update: {
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_system: boolean | null
          name: string
          tenant_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_system?: boolean | null
          name: string
          tenant_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_system?: boolean | null
          name?: string
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "roles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string | null
          favicon_url: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          max_children: number | null
          max_employees: number | null
          max_storage_mb: number | null
          name: string
          settings: Json | null
          slug: string
          subdomain: string | null
          subscription_tier: string | null
          theme_color: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          favicon_url?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          max_children?: number | null
          max_employees?: number | null
          max_storage_mb?: number | null
          name: string
          settings?: Json | null
          slug: string
          subdomain?: string | null
          subscription_tier?: string | null
          theme_color?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          favicon_url?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          max_children?: number | null
          max_employees?: number | null
          max_storage_mb?: number | null
          name?: string
          settings?: Json | null
          slug?: string
          subdomain?: string | null
          subscription_tier?: string | null
          theme_color?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          granted_at: string | null
          granted_by: string | null
          id: string
          role_id: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          role_id: string
          tenant_id: string
          user_id: string
        }
        Update: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          role_id?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          is_active: boolean | null
          last_login_at: string | null
          mfa_enabled: boolean | null
          phone: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          is_active?: boolean | null
          last_login_at?: string | null
          mfa_enabled?: boolean | null
          phone?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          mfa_enabled?: boolean | null
          phone?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      visits: {
        Row: {
          assessment: string | null
          attachments: Json | null
          authorization_id: string | null
          chief_complaint: string | null
          child_id: string | null
          created_at: string | null
          disposition: string | null
          employee_id: string | null
          ended_at: string | null
          id: string
          medications_administered: Json | null
          nurse_id: string
          parent_notified: boolean | null
          parent_notified_at: string | null
          started_at: string | null
          tenant_id: string
          treatment: string | null
          updated_at: string | null
          visit_type: string
          vitals: Json | null
        }
        Insert: {
          assessment?: string | null
          attachments?: Json | null
          authorization_id?: string | null
          chief_complaint?: string | null
          child_id?: string | null
          created_at?: string | null
          disposition?: string | null
          employee_id?: string | null
          ended_at?: string | null
          id?: string
          medications_administered?: Json | null
          nurse_id: string
          parent_notified?: boolean | null
          parent_notified_at?: string | null
          started_at?: string | null
          tenant_id: string
          treatment?: string | null
          updated_at?: string | null
          visit_type: string
          vitals?: Json | null
        }
        Update: {
          assessment?: string | null
          attachments?: Json | null
          authorization_id?: string | null
          chief_complaint?: string | null
          child_id?: string | null
          created_at?: string | null
          disposition?: string | null
          employee_id?: string | null
          ended_at?: string | null
          id?: string
          medications_administered?: Json | null
          nurse_id?: string
          parent_notified?: boolean | null
          parent_notified_at?: string | null
          started_at?: string | null
          tenant_id?: string
          treatment?: string | null
          updated_at?: string | null
          visit_type?: string
          vitals?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "visits_authorization_id_fkey"
            columns: ["authorization_id"]
            isOneToOne: false
            referencedRelation: "authorizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "v_allergy_alerts"
            referencedColumns: ["child_id"]
          },
          {
            foreignKeyName: "visits_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_nurse_id_fkey"
            columns: ["nurse_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_allergy_alerts: {
        Row: {
          allergy_name: string | null
          child_id: string | null
          class_id: string | null
          diagnosed_date: string | null
          first_name: string | null
          last_name: string | null
          notes: string | null
          reaction_description: string | null
          severity_level: string | null
          tenant_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "children_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "children_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      v_medication_errors: {
        Row: {
          child_id: string | null
          created_at: string | null
          error_type: string | null
          medication: Json | null
          notes: string | null
          tenant_id: string | null
          visit_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "visits_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "v_allergy_alerts"
            referencedColumns: ["child_id"]
          },
          {
            foreignKeyName: "visits_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      v_visit_counts: {
        Row: {
          count: number | null
          tenant_id: string | null
          visit_date: string | null
          visit_type: string | null
        }
        Relationships: [
          {
            foreignKeyName: "visits_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      get_user_id: { Args: never; Returns: string }
      get_user_role: { Args: never; Returns: string }
      get_user_tenant_id: { Args: never; Returns: string }
      is_super_admin: { Args: never; Returns: boolean }
      is_tenant_admin: { Args: { p_tenant_id: string }; Returns: boolean }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      user_has_role: {
        Args: { p_tenant_id: string; role_name: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
