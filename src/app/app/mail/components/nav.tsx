"use client";

import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

import { buttonVariants } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

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
      className="group flex flex-col gap-4 py-2 data-[collapsed=true]:py-2">
      <nav className="grid gap-1 px-2 group-data-[collapsed=true]:justify-center group-data-[collapsed=true]:px-2">
        {links.map((link, index) =>
          isCollapsed ? (
            <Tooltip key={index} delayDuration={0}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => link.folder && onSelect?.(link.folder)}
                  className={cn(
                    buttonVariants({ variant: link.variant, size: "icon" }),
                    "size-9",
                    link.variant === "default" &&
                      "dark:bg-muted dark:text-muted-foreground dark:hover:bg-muted dark:hover:text-white"
                  )}>
                  {link.dot ?? <link.icon className="size-4" />}
                  <span className="sr-only">{link.title}</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="flex items-center gap-4">
                {link.title}
                {link.label && <span className="text-muted-foreground ml-auto">{link.label}</span>}
              </TooltipContent>
            </Tooltip>
          ) : (
            <button
              key={index}
              onClick={() => link.folder && onSelect?.(link.folder)}
              className={cn(
                buttonVariants({ variant: link.variant, size: "sm" }),
                link.variant === "default" &&
                  "dark:bg-muted dark:hover:bg-muted dark:text-white dark:hover:text-white",
                "flex justify-start gap-3"
              )}>
              {link.dot ?? <link.icon className="size-4" />}
              {link.title}
              {link.label && (
                <Badge
                  variant={link.variant === "default" ? "default" : "outline"}
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
