"use client";

import { FileText, Bot, Sparkles, Wand2, Settings, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AppBadge } from "@/components/ui/app-badge";
import type { SystemPrompt, CategoriaPrompt } from "../domain";
import { LABELS_CATEGORIA, BUILT_IN_SLUGS } from "../domain";

const CATEGORIA_ICONS: Record<CategoriaPrompt, React.ElementType> = {
  plate_ai: FileText,
  copilotkit: Bot,
  copilot: Sparkles,
  custom: Wand2,
};

interface PromptCardProps {
  prompt: SystemPrompt;
  onEdit: () => void;
}

export function PromptCard({ prompt, onEdit }: PromptCardProps) {
  const Icon = CATEGORIA_ICONS[prompt.categoria];
  const isBuiltIn = BUILT_IN_SLUGS.has(prompt.slug);
  const preview =
    prompt.conteudo.length > 120
      ? `${prompt.conteudo.slice(0, 120)}...`
      : prompt.conteudo;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <Icon className="h-10 w-10 mb-2 text-primary" />
          <div className="flex items-center gap-1.5">
            {isBuiltIn && (
              <AppBadge variant="outline">Sistema</AppBadge>
            )}
            <AppBadge variant={prompt.ativo ? "success" : "secondary"}>
              {prompt.ativo ? (
                <>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Ativo
                </>
              ) : (
                <>
                  <XCircle className="h-3 w-3 mr-1" />
                  Inativo
                </>
              )}
            </AppBadge>
          </div>
        </div>
        <CardTitle>{prompt.nome}</CardTitle>
        <CardDescription>{LABELS_CATEGORIA[prompt.categoria]}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-xs font-mono text-muted-foreground whitespace-pre-wrap line-clamp-3">
          {preview}
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="flex-1" onClick={onEdit}>
          <Settings className="h-4 w-4 mr-2" />
          Editar
        </Button>
      </CardFooter>
    </Card>
  );
}
