"use client";

interface ToggleOptionProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function ToggleOption({
  label,
  description,
  checked,
  onChange,
}: ToggleOptionProps) {
  return (
    <label className="flex items-center justify-between p-4 bg-muted rounded-xl cursor-pointer hover:bg-muted/80 transition-colors">
      <div className="space-y-0.5">
        <span className="block font-bold text-foreground text-sm">
          {label}
        </span>
        <span className="block text-xs text-muted-foreground">
          {description}
        </span>
      </div>
      <div className="relative ml-4 shrink-0">
        <input
          type="checkbox"
          className="sr-only peer"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div className="w-12 h-6 bg-muted rounded-full peer peer-checked:bg-primary transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-transform peer-checked:after:translate-x-6" />
      </div>
    </label>
  );
}
