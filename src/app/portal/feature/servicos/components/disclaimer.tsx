"use client";

interface DisclaimerProps {
  text: string;
}

export function Disclaimer({ text }: DisclaimerProps) {
  return (
    <p className="text-xs text-portal-text-subtle italic mt-4 leading-relaxed">
      {text}
    </p>
  );
}
