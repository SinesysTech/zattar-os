"use client";

import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

import { buttonVariants } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AppBadge as Badge } from "@/components/ui/app-badge";

interface NavLink {
  title: string;
  label?: string;
  icon: LucideIcon;
  dot?: ReactNode;
  variant: "default" | "ghost";
  folder?: string;
}

interface NavProps {
  isCollapsed: boolean;
  links: NavLink[];
  onSelect?: (folder: string) => void;
}

export function Nav({ links, isCollapsed, onSelect }: NavProps) {
  return (
    <div
      data-collapsed={isCollapsed}
      className={cn(/* design-system-escape: py-2 padding direcional sem Inset equiv.; data-[collapsed=true]:py-2 sem equivalente DS */ "group flex flex-col inline-default py-2 data-[collapsed=true]:py-2")}>
      <nav
        role="navigation"
        aria-label="Pastas de e-mail"
        className={cn(/* design-system-escape: gap-1 gap sem token DS; px-2 padding direcional sem Inset equiv.; group-data-[collapsed=true]:px-2 sem equivalente DS */ "grid gap-1 px-2 group-data-[collapsed=true]:justify-center group-data-[collapsed=true]:px-2")}>
        {links.map((link) =>
          isCollapsed ? (
            <Tooltip key={link.folder ?? link.title} delayDuration={0}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => link.folder && onSelect?.(link.folder)}
                  aria-current={link.variant === "default" ? "page" : undefined}
                  className={cn(
                    buttonVariants({ variant: link.variant === "default" ? "secondary" : "ghost", size: "icon" }),
                    "size-9",
                    link.variant === "default" && /* design-system-escape: font-semibold → className de <Text>/<Heading> */ "font-semibold"
                  )}>
                  {link.dot ?? <link.icon className="size-4" />}
                  <span className="sr-only">{link.title}</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className={cn("flex items-center inline-default")}>
                {link.title}
                {link.label && <span className="text-muted-foreground ml-auto">{link.label}</span>}
              </TooltipContent>
            </Tooltip>
          ) : (
            <button
              key={link.folder ?? link.title}
              onClick={() => link.folder && onSelect?.(link.folder)}
              aria-current={link.variant === "default" ? "page" : undefined}
              className={cn(
                buttonVariants({ variant: link.variant === "default" ? "secondary" : "ghost", size: "sm" }),
                link.variant === "default" && /* design-system-escape: font-semibold → className de <Text>/<Heading> */ "font-semibold",
                /* design-system-escape: gap-3 gap sem token DS */ "flex justify-start gap-3"
              )}>
              {link.dot ?? <link.icon className="size-4" />}
              {link.title}
              {link.label && (
                <Badge
                  variant="secondary"
                  className="ml-auto">
                  {link.label}
                </Badge>
              )}
            </button>
          )
        )}
      </nav>
    </div>
  );
}
