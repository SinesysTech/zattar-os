"use client";

interface DisclaimerProps {
  text: string;
}

export function Disclaimer({ text }: DisclaimerProps) {
  return (
    <p className="text-[10px] text-muted-foreground/40 italic mt-4 leading-relaxed">
      {text}
    </p>
  );
}
