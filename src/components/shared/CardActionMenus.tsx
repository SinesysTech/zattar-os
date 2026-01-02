import { FolderUp } from "lucide-react";
import { cn } from "@/lib/utils";

import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

type ExportItem = {
  label: string;
  onSelect?: () => void;
  disabled?: boolean;
};

export function ExportButton({
  className,
  label = "Exportar",
  items,
}: {
  className?: string;
  label?: string;
  items?: ExportItem[];
}) {
  const menuItems = items?.length ? items : [{ label: "Em breve", disabled: true }];
  return (
    <div className={cn(className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            <FolderUp /> <span className="hidden lg:inline">{label}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {menuItems.map((item) => (
            <DropdownMenuItem
              key={item.label}
              disabled={item.disabled}
              onSelect={(e) => {
                e.preventDefault();
                if (item.disabled) return;
                item.onSelect?.();
              }}
            >
              {item.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
