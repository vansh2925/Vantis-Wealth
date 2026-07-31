import {
  Landmark,
  PiggyBank,
  CreditCard,
  Banknote,
  TrendingUp,
  Wallet,
  Smartphone,
  Briefcase,
  CircleDollarSign,
  type LucideIcon,
} from "lucide-react";
import type { AccountType } from "@/types";

interface AccountTypeMeta {
  label: string;
  icon: LucideIcon;
  color: string;
}

export const ACCOUNT_TYPE_META: Record<AccountType, AccountTypeMeta> = {
  checking: { label: "Checking", icon: Landmark, color: "#3b82f6" },
  savings: { label: "Savings", icon: PiggyBank, color: "#10b981" },
  credit: { label: "Credit card", icon: CreditCard, color: "#8b5cf6" },
  cash: { label: "Cash", icon: Banknote, color: "#f59e0b" },
  investment: { label: "Investment", icon: TrendingUp, color: "#06b6d4" },
  wallet: { label: "Wallet", icon: Wallet, color: "#ec4899" },
  upi: { label: "UPI", icon: Smartphone, color: "#6366f1" },
  business: { label: "Business", icon: Briefcase, color: "#14b8a6" },
  other: { label: "Other", icon: CircleDollarSign, color: "#64748b" },
};

export const ACCOUNT_TYPES = Object.keys(ACCOUNT_TYPE_META) as AccountType[];
