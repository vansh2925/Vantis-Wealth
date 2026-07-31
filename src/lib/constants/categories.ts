import {
  Wallet,
  Briefcase,
  Building2,
  TrendingUp,
  Gift,
  CirclePlus,
  Utensils,
  ShoppingCart,
  Bus,
  Home,
  Zap,
  ShoppingBag,
  Clapperboard,
  HeartPulse,
  GraduationCap,
  Plane,
  Repeat,
  ShieldCheck,
  Sparkles,
  Users,
  Receipt,
  CircleMinus,
  type LucideIcon,
} from "lucide-react";

/** Curated icon presets for categories. */
export const CATEGORY_ICONS: { key: string; icon: LucideIcon }[] = [
  { key: "wallet", icon: Wallet },
  { key: "briefcase", icon: Briefcase },
  { key: "building-2", icon: Building2 },
  { key: "trending-up", icon: TrendingUp },
  { key: "gift", icon: Gift },
  { key: "circle-plus", icon: CirclePlus },
  { key: "utensils", icon: Utensils },
  { key: "shopping-cart", icon: ShoppingCart },
  { key: "bus", icon: Bus },
  { key: "home", icon: Home },
  { key: "zap", icon: Zap },
  { key: "shopping-bag", icon: ShoppingBag },
  { key: "clapperboard", icon: Clapperboard },
  { key: "heart-pulse", icon: HeartPulse },
  { key: "graduation-cap", icon: GraduationCap },
  { key: "plane", icon: Plane },
  { key: "repeat", icon: Repeat },
  { key: "shield-check", icon: ShieldCheck },
  { key: "sparkles", icon: Sparkles },
  { key: "users", icon: Users },
  { key: "receipt", icon: Receipt },
  { key: "circle-minus", icon: CircleMinus },
];

export function categoryIcon(key: string): LucideIcon {
  return CATEGORY_ICONS.find((i) => i.key === key)?.icon ?? CirclePlus;
}

/** Palette offered in the category colour picker. */
export const CATEGORY_COLORS = [
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
  "#f59e0b",
  "#06b6d4",
  "#ec4899",
  "#f43f5e",
  "#eab308",
  "#14b8a6",
  "#6366f1",
  "#0ea5e9",
  "#64748b",
];
