"use client";

interface RangeInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  unit?: string;
  labels?: [string, string, string];
}

export function RangeInput({
  label,
  value,
  onChange,
  min,
  max,
  unit,
  labels,
}: RangeInputProps) {
  const range = max - min;
  const progress = range > 0 ? ((value - min) / range) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-end">
        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
          {label}
        </label>
        <span className="text-2xl font-semibold text-primary leading-none">
          {value}
          {unit ? ` ${unit}` : ""}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-lg appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, var(--portal-primary) ${progress}%, var(--border) ${progress}%)`,
        }}
      />
      {labels && (
        <div className="flex justify-between text-xs text-portal-text-muted font-bold uppercase tracking-wider">
          <span>{labels[0]}</span>
          <span>{labels[1]}</span>
          <span>{labels[2]}</span>
        </div>
      )}
    </div>
  );
}
