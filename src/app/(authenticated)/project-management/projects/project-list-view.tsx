"use client";

import { cn } from '@/lib/utils';
import * as React from "react";
import { useRouter } from "next/navigation";
import { LayoutGrid, List, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ProjectTable } from "../components/projects/project-table";
import { ProjectCard } from "../components/projects/project-card";
import type { Projeto } from "../domain";
import { Heading } from '@/components/ui/typography';

interface ProjectListViewProps {
  projetos: Projeto[];
}

export function ProjectListView({ projetos }: ProjectListViewProps) {
  const router = useRouter();
  const [viewMode, setViewMode] = React.useState<"table" | "cards">("table");

  const viewModeToggle = (
    <ToggleGroup
      type="single"
      value={viewMode}
      onValueChange={(v) => {
        if (v) setViewMode(v as "table" | "cards");
      }}
      variant="outline"
    >
      <ToggleGroupItem value="table" aria-label="Visualização em tabela">
        <List className="size-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="cards" aria-label="Visualização em cards">
        <LayoutGrid className="size-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  );

  if (viewMode === "cards") {
    return (
      <div className={cn(/* design-system-escape: space-y-4 → migrar para <Stack gap="default"> */ "space-y-4")}>
        <div className={cn(/* design-system-escape: py-4 padding direcional sem Inset equiv. */ "flex items-center justify-between py-4")}>
          <Heading level="page">
            Projetos
          </Heading>
          <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex items-center gap-2")}>
            {viewModeToggle}
            <Button
              onClick={() =>
                router.push("/app/project-management/projects/new")
              }
            >
              <Plus className="mr-1 size-4" />
              Novo Projeto
            </Button>
          </div>
        </div>
        <div className={cn(/* design-system-escape: gap-4 → migrar para <Inline gap="default"> */ "grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-4")}>
          {projetos.map((projeto) => (
            <ProjectCard key={projeto.id} projeto={projeto} />
          ))}
          {projetos.length === 0 && (
            <p className={cn(/* design-system-escape: py-12 padding direcional sem Inset equiv. */ "text-muted-foreground col-span-full text-center py-12")}>
              Nenhum projeto encontrado.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <ProjectTable projetos={projetos} viewModeSlot={viewModeToggle} />
  );
}
