"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SystemPrompt } from "../domain";
import { CATEGORIAS_PROMPT, LABELS_CATEGORIA, DESCRICOES_CATEGORIA } from "../domain";
import type { CategoriaPrompt } from "../domain";
import { PromptCard } from "./prompt-card";
import { PromptEditDialog } from "./prompt-edit-dialog";
import { CreatePromptDialog } from "./create-prompt-dialog";

interface PromptsIaContentProps {
  systemPrompts?: SystemPrompt[];
}

export function PromptsIAContent({ systemPrompts = [] }: PromptsIaContentProps) {
  const router = useRouter();
  const [editingPrompt, setEditingPrompt] = useState<SystemPrompt | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const promptsByCategoria = Object.keys(CATEGORIAS_PROMPT).reduce<
    Record<string, SystemPrompt[]>
  >((acc, cat) => {
    acc[cat] = systemPrompts.filter((p) => p.categoria === cat);
    return acc;
  }, {});

  const hasAnyPrompt = systemPrompts.length > 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Prompts de IA</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie os prompts utilizados pelos assistentes e ferramentas de IA do sistema.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Criar Prompt Personalizado
        </Button>
      </div>

      {!hasAnyPrompt ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-muted-foreground text-sm">
            Nenhum prompt encontrado. Crie um prompt personalizado para começar.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {Object.keys(CATEGORIAS_PROMPT).map((cat) => {
            const categoria = cat as CategoriaPrompt;
            const prompts = promptsByCategoria[categoria];

            if (!prompts || prompts.length === 0) return null;

            return (
              <section key={categoria}>
                <div className="mb-4">
                  <h3 className="text-lg font-semibold">{LABELS_CATEGORIA[categoria]}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {DESCRICOES_CATEGORIA[categoria]}
                  </p>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {prompts.map((prompt) => (
                    <PromptCard
                      key={prompt.id}
                      prompt={prompt}
                      onEdit={() => setEditingPrompt(prompt)}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {editingPrompt && (
        <PromptEditDialog
          prompt={editingPrompt}
          open
          onOpenChange={(open) => {
            if (!open) setEditingPrompt(null);
          }}
          onSuccess={() => {
            setEditingPrompt(null);
            router.refresh();
          }}
        />
      )}

      <CreatePromptDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={() => {
          setCreateOpen(false);
          router.refresh();
        }}
      />
    </div>
  );
}
