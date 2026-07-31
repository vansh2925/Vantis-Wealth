"use client";

import { useCategories } from "@/hooks/use-categories";
import { categoryIcon } from "@/lib/constants/categories";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CategorySelectProps {
  value: string | null | undefined;
  onValueChange: (value: string | null) => void;
  type: "income" | "expense";
  placeholder?: string;
}

export function CategorySelect({
  value,
  onValueChange,
  type,
  placeholder = "Select category",
}: CategorySelectProps) {
  const { categories, isLoading } = useCategories();
  const list = categories?.filter((c) => c.type === type) ?? [];

  return (
    <Select
      value={value ?? undefined}
      onValueChange={(v) => onValueChange(v === "none" ? null : v)}
      disabled={isLoading}
    >
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="max-h-72">
        <SelectItem value="none" className="text-muted-foreground">
          No category
        </SelectItem>
        {list.map((c) => {
          const Icon = categoryIcon(c.icon);
          return (
            <SelectItem key={c.id} value={c.id}>
              <span className="flex items-center gap-2">
                <Icon className="h-4 w-4" style={{ color: c.color }} />
                <span className="h-2 w-2 rounded-full" style={{ background: c.color }} />
                {c.name}
              </span>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
