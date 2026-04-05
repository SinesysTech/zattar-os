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
      className="group bg-card border border-border/50 hover:border-primary/20 hover:shadow-md rounded-xl p-5 transition-all duration-200 block shadow-sm cursor-pointer"
    >
      <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform mb-4">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">
        {title}
      </h3>
      <p className="text-sm text-portal-text-muted">{description}</p>
    </Link>
  );
}
