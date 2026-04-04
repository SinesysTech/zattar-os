"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";

interface ServiceCardProps {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
}

export function ServiceCard({
  title,
  description,
  href,
  icon: Icon,
}: ServiceCardProps) {
  return (
    <Link
      href={href}
      className="group bg-[#191919]/60 backdrop-blur-xl border border-white/5 hover:border-primary/40 rounded-2xl p-8 transition-all duration-300 hover:-translate-y-1 block shadow-lg"
    >
      <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform mb-6">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-2xl font-bold font-headline text-white mb-3">
        {title}
      </h3>
      <p className="text-sm text-on-surface-variant">{description}</p>
    </Link>
  );
}
