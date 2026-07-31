"use client";

import { cn } from "@/lib/utils";

interface ColorPickerProps {
  value: string;
  onValueChange: (color: string) => void;
  colors: string[];
}

/** Simple swatch grid for picking a hex colour. */
export function ColorPicker({ value, onValueChange, colors }: ColorPickerProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {colors.map((c) => (
        <button
          key={c}
          type="button"
          aria-label={`Color ${c}`}
          onClick={() => onValueChange(c)}
          className={cn(
            "h-7 w-7 rounded-full ring-2 ring-offset-2 ring-offset-background transition-transform hover:scale-110",
            value === c ? "ring-ring" : "ring-transparent"
          )}
          style={{ background: c }}
        />
      ))}
    </div>
  );
}
