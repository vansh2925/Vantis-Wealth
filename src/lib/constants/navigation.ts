import {
  LayoutDashboard,
  ArrowLeftRight,
  Landmark,
  Tags,
  Wallet,
  PiggyBank,
  BarChart3,
  FileText,
  Bell,
  Settings,
  UserRound,
  Repeat,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  /** Matches a page that isn't a section header. */
  command?: string;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

/** Primary sidebar navigation, grouped by area. */
export const NAV_SECTIONS: NavSection[] = [
  {
    label: "Overview",
    items: [{ title: "Dashboard", href: "/dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Manage",
    items: [
      { title: "Transactions", href: "/transactions", icon: ArrowLeftRight },
      { title: "Accounts", href: "/accounts", icon: Landmark },
      { title: "Categories", href: "/categories", icon: Tags },
      { title: "Budgets", href: "/budgets", icon: Wallet },
      { title: "Goals", href: "/goals", icon: PiggyBank },
      { title: "Recurring", href: "/recurring", icon: Repeat },
    ],
  },
  {
    label: "Insight",
    items: [
      { title: "Analytics", href: "/analytics", icon: BarChart3 },
      { title: "Reports", href: "/reports", icon: FileText },
    ],
  },
  {
    label: "System",
    items: [
      { title: "Notifications", href: "/notifications", icon: Bell },
      { title: "Profile", href: "/profile", icon: UserRound },
      { title: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

/** Flat list used by the command palette for global search. */
export const NAV_ITEMS_FLAT: NavItem[] = NAV_SECTIONS.flatMap((s) => s.items);
