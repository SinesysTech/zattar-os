"use client";

interface SelectOptionProps {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  variant?: "buttons" | "dropdown";
}

export function SelectOption({
  label,
  options,
  value,
  onChange,
  variant = "dropdown",
}: SelectOptionProps) {
  return (
    <div className="space-y-3">
      <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest">
        {label}
      </label>

      {variant === "buttons" ? (
        <div className="flex gap-2 p-1 bg-muted rounded-xl">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={[
                "flex-1 py-3 rounded-lg font-bold text-sm transition-all",
                value === option.value
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/80",
              ].join(" ")}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-muted border-none rounded-lg p-4 text-foreground font-mono text-lg outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
