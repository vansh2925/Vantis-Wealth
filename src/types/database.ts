// ═══════════════════════════════════════════════════════════════════════
// Finance App — Database types (hand-maintained to match src/db/schema.sql)
// These are passed to createClient/createServerClient for full type safety.
// If you change the schema, update this file to match. (Phase 6: can be
// regenerated with `supabase gen types typescript`.)
// ═══════════════════════════════════════════════════════════════════════

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type CategoryType = "income" | "expense";
export type TransactionType = "income" | "expense" | "transfer";
export type AccountType =
  | "cash"
  | "checking"
  | "savings"
  | "credit"
  | "investment"
  | "wallet"
  | "upi"
  | "business"
  | "other";
export type RecurringFrequency = "daily" | "weekly" | "monthly" | "yearly";
export type NotificationType =
  | "budget_alert"
  | "goal_reached"
  | "bill_upcoming"
  | "recurring_reminder"
  | "system";

export interface Database {
  public: {
    Tables: {
      currencies: {
        Row: {
          code: string;
          name: string;
          symbol: string;
          decimal_places: number;
          position: "prefix" | "suffix";
          created_at: string;
        };
        Insert: {
          code: string;
          name: string;
          symbol: string;
          decimal_places?: number;
          position?: "prefix" | "suffix";
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["currencies"]["Insert"]>;
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          currency_code: string;
          bio: string | null;
          onboarded: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          currency_code?: string;
          bio?: string | null;
          onboarded?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [
          { foreignKeyName: "profiles_id_fkey"; columns: ["id"]; referencedRelation: "users"; referencedColumns: ["id"] },
          { foreignKeyName: "profiles_currency_code_fkey"; columns: ["currency_code"]; referencedRelation: "currencies"; referencedColumns: ["code"] }
        ];
      };
      settings: {
        Row: {
          user_id: string;
          currency_code: string;
          theme: "light" | "dark" | "system";
          language: string;
          week_start: string;
          date_format: string;
          number_format: string;
          show_income: boolean;
          show_expense: boolean;
          notify_budget_alerts: boolean;
          notify_goal_reached: boolean;
          notify_bills_upcoming: boolean;
          notify_recurring: boolean;
          monthly_budget_limit: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          currency_code?: string;
          theme?: "light" | "dark" | "system";
          language?: string;
          week_start?: string;
          date_format?: string;
          number_format?: string;
          show_income?: boolean;
          show_expense?: boolean;
          notify_budget_alerts?: boolean;
          notify_goal_reached?: boolean;
          notify_bills_upcoming?: boolean;
          notify_recurring?: boolean;
          monthly_budget_limit?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["settings"]["Insert"]>;
        Relationships: [
          { foreignKeyName: "settings_user_id_fkey"; columns: ["user_id"]; referencedRelation: "users"; referencedColumns: ["id"] },
          { foreignKeyName: "settings_currency_code_fkey"; columns: ["currency_code"]; referencedRelation: "currencies"; referencedColumns: ["code"] }
        ];
      };
      categories: {
        Row: {
          id: string;
          user_id: string | null;
          parent_id: string | null;
          type: CategoryType;
          name: string;
          icon: string;
          color: string;
          is_custom: boolean;
          is_default: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          parent_id?: string | null;
          type: CategoryType;
          name: string;
          icon?: string;
          color?: string;
          is_custom?: boolean;
          is_default?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["categories"]["Insert"]>;
        Relationships: [
          { foreignKeyName: "categories_user_id_fkey"; columns: ["user_id"]; referencedRelation: "users"; referencedColumns: ["id"] },
          { foreignKeyName: "categories_parent_id_fkey"; columns: ["parent_id"]; referencedRelation: "categories"; referencedColumns: ["id"] }
        ];
      };
      accounts: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          type: AccountType;
          balance: number;
          currency_code: string;
          bank_name: string | null;
          color: string;
          icon: string;
          is_archived: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          type?: AccountType;
          balance?: number;
          currency_code?: string;
          bank_name?: string | null;
          color?: string;
          icon?: string;
          is_archived?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["accounts"]["Insert"]>;
        Relationships: [
          { foreignKeyName: "accounts_user_id_fkey"; columns: ["user_id"]; referencedRelation: "users"; referencedColumns: ["id"] },
          { foreignKeyName: "accounts_currency_code_fkey"; columns: ["currency_code"]; referencedRelation: "currencies"; referencedColumns: ["code"] }
        ];
      };
      tags: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          color: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          color?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["tags"]["Insert"]>;
        Relationships: [
          { foreignKeyName: "tags_user_id_fkey"; columns: ["user_id"]; referencedRelation: "users"; referencedColumns: ["id"] }
        ];
      };
      recurring_transactions: {
        Row: {
          id: string;
          user_id: string;
          account_id: string | null;
          category_id: string | null;
          type: Exclude<TransactionType, "transfer">;
          amount: number;
          currency_code: string;
          merchant: string | null;
          note: string | null;
          frequency: RecurringFrequency;
          interval_every: number;
          day_of_month: number | null;
          start_date: string;
          end_date: string | null;
          last_run_date: string | null;
          next_run_date: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          account_id?: string | null;
          category_id?: string | null;
          type: Exclude<TransactionType, "transfer">;
          amount: number;
          currency_code?: string;
          merchant?: string | null;
          note?: string | null;
          frequency: RecurringFrequency;
          interval_every?: number;
          day_of_month?: number | null;
          start_date: string;
          end_date?: string | null;
          last_run_date?: string | null;
          next_run_date?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["recurring_transactions"]["Insert"]>;
        Relationships: [
          { foreignKeyName: "recurring_transactions_user_id_fkey"; columns: ["user_id"]; referencedRelation: "users"; referencedColumns: ["id"] },
          { foreignKeyName: "recurring_transactions_account_id_fkey"; columns: ["account_id"]; referencedRelation: "accounts"; referencedColumns: ["id"] },
          { foreignKeyName: "recurring_transactions_category_id_fkey"; columns: ["category_id"]; referencedRelation: "categories"; referencedColumns: ["id"] }
        ];
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          account_id: string | null;
          transfer_account_id: string | null;
          category_id: string | null;
          recurring_id: string | null;
          type: TransactionType;
          amount: number;
          currency_code: string;
          merchant: string | null;
          note: string | null;
          date: string;
          status: "cleared" | "pending";
          attachment_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          account_id?: string | null;
          transfer_account_id?: string | null;
          category_id?: string | null;
          recurring_id?: string | null;
          type: TransactionType;
          amount: number;
          currency_code?: string;
          merchant?: string | null;
          note?: string | null;
          date?: string;
          status?: "cleared" | "pending";
          attachment_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["transactions"]["Insert"]>;
        Relationships: [
          { foreignKeyName: "transactions_user_id_fkey"; columns: ["user_id"]; referencedRelation: "users"; referencedColumns: ["id"] },
          { foreignKeyName: "transactions_account_id_fkey"; columns: ["account_id"]; referencedRelation: "accounts"; referencedColumns: ["id"] },
          { foreignKeyName: "transactions_transfer_account_id_fkey"; columns: ["transfer_account_id"]; referencedRelation: "accounts"; referencedColumns: ["id"] },
          { foreignKeyName: "transactions_category_id_fkey"; columns: ["category_id"]; referencedRelation: "categories"; referencedColumns: ["id"] },
          { foreignKeyName: "transactions_recurring_id_fkey"; columns: ["recurring_id"]; referencedRelation: "recurring_transactions"; referencedColumns: ["id"] }
        ];
      };
      transaction_tags: {
        Row: { transaction_id: string; tag_id: string };
        Insert: { transaction_id: string; tag_id: string };
        Update: Partial<Database["public"]["Tables"]["transaction_tags"]["Insert"]>;
        Relationships: [
          { foreignKeyName: "transaction_tags_transaction_id_fkey"; columns: ["transaction_id"]; referencedRelation: "transactions"; referencedColumns: ["id"] },
          { foreignKeyName: "transaction_tags_tag_id_fkey"; columns: ["tag_id"]; referencedRelation: "tags"; referencedColumns: ["id"] }
        ];
      };
      budgets: {
        Row: {
          id: string;
          user_id: string;
          category_id: string | null;
          month: string;
          amount: number;
          currency_code: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          category_id?: string | null;
          month: string;
          amount: number;
          currency_code?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["budgets"]["Insert"]>;
        Relationships: [
          { foreignKeyName: "budgets_user_id_fkey"; columns: ["user_id"]; referencedRelation: "users"; referencedColumns: ["id"] },
          { foreignKeyName: "budgets_category_id_fkey"; columns: ["category_id"]; referencedRelation: "categories"; referencedColumns: ["id"] }
        ];
      };
      savings_goals: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          target_amount: number;
          current_amount: number;
          currency_code: string;
          target_date: string | null;
          icon: string;
          color: string;
          is_archived: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          target_amount: number;
          current_amount?: number;
          currency_code?: string;
          target_date?: string | null;
          icon?: string;
          color?: string;
          is_archived?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["savings_goals"]["Insert"]>;
        Relationships: [
          { foreignKeyName: "savings_goals_user_id_fkey"; columns: ["user_id"]; referencedRelation: "users"; referencedColumns: ["id"] }
        ];
      };
      notes: {
        Row: {
          id: string;
          user_id: string;
          transaction_id: string | null;
          title: string;
          body: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          transaction_id?: string | null;
          title: string;
          body?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["notes"]["Insert"]>;
        Relationships: [
          { foreignKeyName: "notes_user_id_fkey"; columns: ["user_id"]; referencedRelation: "users"; referencedColumns: ["id"] },
          { foreignKeyName: "notes_transaction_id_fkey"; columns: ["transaction_id"]; referencedRelation: "transactions"; referencedColumns: ["id"] }
        ];
      };
      attachments: {
        Row: {
          id: string;
          user_id: string;
          transaction_id: string | null;
          filename: string;
          storage_path: string;
          mime_type: string | null;
          size_bytes: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          transaction_id?: string | null;
          filename: string;
          storage_path: string;
          mime_type?: string | null;
          size_bytes?: number | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["attachments"]["Insert"]>;
        Relationships: [
          { foreignKeyName: "attachments_user_id_fkey"; columns: ["user_id"]; referencedRelation: "users"; referencedColumns: ["id"] },
          { foreignKeyName: "attachments_transaction_id_fkey"; columns: ["transaction_id"]; referencedRelation: "transactions"; referencedColumns: ["id"] }
        ];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: NotificationType;
          title: string;
          body: string | null;
          data: Json | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: NotificationType;
          title: string;
          body?: string | null;
          data?: Json | null;
          is_read?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Insert"]>;
        Relationships: [
          { foreignKeyName: "notifications_user_id_fkey"; columns: ["user_id"]; referencedRelation: "users"; referencedColumns: ["id"] }
        ];
      };
      monthly_analytics: {
        Row: {
          user_id: string;
          month: string;
          total_income: number;
          total_expense: number;
          net_savings: number;
          savings_rate: number;
          budget_used: number;
          net_worth: number;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          month: string;
          total_income?: number;
          total_expense?: number;
          net_savings?: number;
          savings_rate?: number;
          budget_used?: number;
          net_worth?: number;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["monthly_analytics"]["Insert"]>;
        Relationships: [
          { foreignKeyName: "monthly_analytics_user_id_fkey"; columns: ["user_id"]; referencedRelation: "users"; referencedColumns: ["id"] }
        ];
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          old_data: Json | null;
          new_data: Json | null;
          ip_address: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          old_data?: Json | null;
          new_data?: Json | null;
          ip_address?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["audit_logs"]["Insert"]>;
        Relationships: [
          { foreignKeyName: "audit_logs_user_id_fkey"; columns: ["user_id"]; referencedRelation: "users"; referencedColumns: ["id"] }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      set_updated_at: {
        Args: Record<PropertyKey, never>;
        Returns: unknown;
      };
      refresh_monthly_analytics: {
        Args: { p_user_id: string; p_month: string };
        Returns: undefined;
      };
      create_transaction: {
        Args: {
          p_user_id: string;
          p_account_id: string;
          p_category_id: string | null;
          p_type: TransactionType;
          p_amount: number;
          p_currency_code: string;
          p_date: string;
          p_merchant?: string | null;
          p_note?: string | null;
          p_status?: "cleared" | "pending";
          p_transfer_account_id?: string | null;
          p_recurring_id?: string | null;
          p_attachment_url?: string | null;
        };
        Returns: Database["public"]["Tables"]["transactions"]["Row"];
      };
      delete_transaction: {
        Args: { p_txn_id: string; p_user_id: string };
        Returns: undefined;
      };
      update_transaction: {
        Args: {
          p_txn_id: string;
          p_user_id: string;
          p_account_id: string;
          p_category_id: string | null;
          p_type: TransactionType;
          p_amount: number;
          p_currency_code: string;
          p_date: string;
          p_merchant?: string | null;
          p_note?: string | null;
          p_status?: "cleared" | "pending";
          p_transfer_account_id?: string | null;
        };
        Returns: Database["public"]["Tables"]["transactions"]["Row"];
      };
      handle_new_user: {
        Args: Record<PropertyKey, never>;
        Returns: unknown;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type Tables = Database["public"]["Tables"];
