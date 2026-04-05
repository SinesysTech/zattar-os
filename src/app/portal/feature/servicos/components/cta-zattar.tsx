"use client";

import { Phone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface CtaZattarProps {
  title?: string;
  description?: string;
  buttonText?: string;
  href?: string;
}

export function CtaZattar({
  title = "Ficou com dúvida?",
  description = "Fale com um advogado da Zattar e tire suas dúvidas sobre seus direitos trabalhistas.",
  buttonText = "Fale com a Zattar",
  href,
}: CtaZattarProps) {
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Phone className="w-5 h-5 text-primary shrink-0" />
          <span className="text-lg font-bold text-foreground">{title}</span>
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
        {href ? (
          <a
            href={href}
            className="inline-flex items-center justify-center gap-2 py-3 px-6 bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider rounded-xl transition-all hover:bg-primary/90 shadow-md hover:shadow-lg"
          >
            {buttonText}
          </a>
        ) : (
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 py-3 px-6 bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider rounded-xl transition-all hover:bg-primary/90 shadow-md hover:shadow-lg"
          >
            {buttonText}
          </button>
        )}
      </CardContent>
    </Card>
  );
}
