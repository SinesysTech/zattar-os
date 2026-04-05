"use client";

interface NumberInputProps {
  label: string;
  value: string;
  onChange: (raw: string, parsed: number) => void;
  placeholder: string;
  suffix?: string;
  prefix?: string;
}

export function NumberInput({
  label,
  value,
  onChange,
  placeholder,
  suffix,
  prefix,
}: NumberInputProps) {
  return (
    <div className="space-y-3">
      <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
        {label}
      </label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold select-none">
            {prefix}
          </span>
        )}
        <input
          type="number"
          inputMode="decimal"
          value={value}
          placeholder={placeholder}
          onChange={(e) => {
            const raw = e.target.value;
            const parsed = parseFloat(raw.replace(",", "."));
            onChange(raw, isNaN(parsed) ? 0 : parsed);
          }}
          className={[
            "w-full bg-muted border-none rounded-lg p-4 text-foreground font-mono text-lg outline-none focus:ring-2 focus:ring-primary/40 transition-shadow placeholder:text-muted-foreground/50",
            prefix ? "pl-12" : "",
            suffix ? "pr-14" : "",
          ].join(" ")}
        />
        {suffix && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/60 text-sm font-bold select-none">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}
