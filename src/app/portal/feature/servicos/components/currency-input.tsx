"use client";

interface CurrencyInputProps {
  label: string;
  value: string;
  onChange: (raw: string, parsed: number) => void;
  placeholder?: string;
}

export function CurrencyInput({
  label,
  value,
  onChange,
  placeholder = "0,00",
}: CurrencyInputProps) {
  return (
    <div className="space-y-3">
      <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest">
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold select-none">
          R$
        </span>
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
          className="w-full bg-muted border-none rounded-lg p-4 pl-12 text-foreground font-mono text-lg outline-none focus:ring-2 focus:ring-primary/40 transition-shadow placeholder:text-muted-foreground/20"
        />
      </div>
    </div>
  );
}
