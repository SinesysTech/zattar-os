"use client";

/**
 * RegiaoFormDialog - Dialog para criar/editar região de atribuição
 */

import * as React from "react";

import { DialogFormShell } from "@/components/shared/dialog-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";

import type { RegiaoAtribuicao, MetodoBalanceamento } from "../domain";
import {
  TRTS_DISPONIVEIS,
  TRT_LABELS,
  METODO_BALANCEAMENTO_LABELS,
  METODO_BALANCEAMENTO_DESCRICOES,
} from "../domain";
import {
  actionCriarRegiaoAtribuicao,
  actionAtualizarRegiaoAtribuicao,
} from "../actions/config-atribuicao-actions";

interface UsuarioOption {
  id: number;
  nomeExibicao: string;
}

interface RegiaoFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  regiao: RegiaoAtribuicao | null;
  usuarios: UsuarioOption[];
  onSuccess?: () => void;
}

export function RegiaoFormDialog({
  open,
  onOpenChange,
  regiao,
  usuarios,
  onSuccess,
}: RegiaoFormDialogProps) {
  const isEditing = !!regiao;

  // Estados do formulário
  const [nome, setNome] = React.useState("");
  const [descricao, setDescricao] = React.useState("");
  const [trts, setTrts] = React.useState<string[]>([]);
  const [responsaveisIds, setResponsaveisIds] = React.useState<number[]>([]);
  const [metodoBalanceamento, setMetodoBalanceamento] =
    React.useState<MetodoBalanceamento>("contagem_processos");
  const [ativo, setAtivo] = React.useState(true);
  const [prioridade, setPrioridade] = React.useState(0);

  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Preencher formulário ao editar
  React.useEffect(() => {
    if (open) {
      if (regiao) {
        setNome(regiao.nome);
        setDescricao(regiao.descricao || "");
        setTrts(regiao.trts);
        setResponsaveisIds(regiao.responsaveisIds);
        setMetodoBalanceamento(regiao.metodoBalanceamento);
        setAtivo(regiao.ativo);
        setPrioridade(regiao.prioridade);
      } else {
        // Reset para nova região
        setNome("");
        setDescricao("");
        setTrts([]);
        setResponsaveisIds([]);
        setMetodoBalanceamento("contagem_processos");
        setAtivo(true);
        setPrioridade(0);
      }
      setError(null);
    }
  }, [open, regiao]);

  // Toggle TRT
  const toggleTrt = (trt: string) => {
    setTrts((prev) =>
      prev.includes(trt) ? prev.filter((t) => t !== trt) : [...prev, trt]
    );
  };

  // Selecionar todos os TRTs
  const selectAllTrts = () => {
    setTrts([...TRTS_DISPONIVEIS]);
  };

  // Limpar seleção de TRTs
  const clearTrts = () => {
    setTrts([]);
  };

  // Toggle responsável
  const toggleResponsavel = (id: number) => {
    setResponsaveisIds((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  // Salvar
  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      const formData = new FormData();
      if (isEditing && regiao) {
        formData.append("id", String(regiao.id));
      }
      formData.append("nome", nome);
      formData.append("descricao", descricao);
      formData.append("trts", JSON.stringify(trts));
      formData.append("responsaveisIds", JSON.stringify(responsaveisIds));
      formData.append("metodoBalanceamento", metodoBalanceamento);
      formData.append("ativo", String(ativo));
      formData.append("prioridade", String(prioridade));

      const result = isEditing
        ? await actionAtualizarRegiaoAtribuicao(formData)
        : await actionCriarRegiaoAtribuicao(formData);

      if (!result.success) {
        throw new Error(result.message);
      }

      onSuccess?.();
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro desconhecido");
    } finally {
      setIsSaving(false);
    }
  };

  const isFormValid =
    nome.trim().length > 0 && trts.length > 0 && responsaveisIds.length > 0;

  return (
    <DialogFormShell
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? "Editar Região" : "Nova Região"}
      maxWidth="2xl"
      footer={
        <Button onClick={handleSave} disabled={isSaving || !isFormValid}>
          {isSaving ? "Salvando..." : isEditing ? "Salvar Alterações" : "Criar Região"}
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Nome */}
        <div className="grid gap-2">
          <Label htmlFor="nome">
            Nome <span className="text-destructive">*</span>
          </Label>
          <Input
            id="nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex: Sudeste, Outras Regiões"
            disabled={isSaving}
          />
        </div>

        {/* Descrição */}
        <div className="grid gap-2">
          <Label htmlFor="descricao">Descrição</Label>
          <Textarea
            id="descricao"
            value={descricao}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setDescricao(e.target.value)
            }
            placeholder="Descrição opcional da região..."
            className="resize-none"
            rows={2}
            disabled={isSaving}
          />
        </div>

        {/* TRTs */}
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label>
              TRTs <span className="text-destructive">*</span>
            </Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={selectAllTrts}
                disabled={isSaving}
              >
                Selecionar todos
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearTrts}
                disabled={isSaving}
              >
                Limpar
              </Button>
            </div>
          </div>
          <ScrollArea className="h-40 border rounded-md p-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {TRTS_DISPONIVEIS.map((trt) => (
                <div key={trt} className="flex items-center space-x-2">
                  <Checkbox
                    id={`trt-${trt}`}
                    checked={trts.includes(trt)}
                    onCheckedChange={() => toggleTrt(trt)}
                    disabled={isSaving}
                  />
                  <label
                    htmlFor={`trt-${trt}`}
                    className="text-sm cursor-pointer"
                    title={TRT_LABELS[trt]}
                  >
                    {trt}
                  </label>
                </div>
              ))}
            </div>
          </ScrollArea>
          <p className="text-xs text-muted-foreground">
            {trts.length} TRT(s) selecionado(s)
          </p>
        </div>

        {/* Responsáveis */}
        <div className="grid gap-2">
          <Label>
            Responsáveis <span className="text-destructive">*</span>
          </Label>
          <ScrollArea className="h-32 border rounded-md p-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {usuarios.map((usuario) => (
                <div key={usuario.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`resp-${usuario.id}`}
                    checked={responsaveisIds.includes(usuario.id)}
                    onCheckedChange={() => toggleResponsavel(usuario.id)}
                    disabled={isSaving}
                  />
                  <label
                    htmlFor={`resp-${usuario.id}`}
                    className="text-sm cursor-pointer truncate"
                  >
                    {usuario.nomeExibicao}
                  </label>
                </div>
              ))}
            </div>
          </ScrollArea>
          <p className="text-xs text-muted-foreground">
            {responsaveisIds.length} responsável(eis) selecionado(s)
          </p>
        </div>

        {/* Método de Balanceamento */}
        <div className="grid gap-2">
          <Label>Método de Balanceamento</Label>
          <RadioGroup
            value={metodoBalanceamento}
            onValueChange={(v) => setMetodoBalanceamento(v as MetodoBalanceamento)}
            className="space-y-2"
            disabled={isSaving}
          >
            {(
              Object.entries(METODO_BALANCEAMENTO_LABELS) as [
                MetodoBalanceamento,
                string
              ][]
            ).map(([value, label]) => (
              <div key={value} className="flex items-start space-x-3">
                <RadioGroupItem value={value} id={`metodo-${value}`} className="mt-1" />
                <div>
                  <label htmlFor={`metodo-${value}`} className="text-sm font-medium cursor-pointer">
                    {label}
                  </label>
                  <p className="text-xs text-muted-foreground">
                    {METODO_BALANCEAMENTO_DESCRICOES[value]}
                  </p>
                </div>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Prioridade e Ativo */}
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="prioridade">Prioridade</Label>
            <Input
              id="prioridade"
              type="number"
              min={0}
              max={100}
              value={prioridade}
              onChange={(e) => setPrioridade(Number(e.target.value))}
              disabled={isSaving}
            />
            <p className="text-xs text-muted-foreground">
              Maior valor = mais prioritário quando TRT está em múltiplas regiões
            </p>
          </div>

          <div className="flex items-center space-x-2 pt-6">
            <Checkbox
              id="ativo"
              checked={ativo}
              onCheckedChange={(checked) => setAtivo(checked === true)}
              disabled={isSaving}
            />
            <label htmlFor="ativo" className="text-sm font-medium cursor-pointer">
              Região ativa
            </label>
          </div>
        </div>

        {/* Erro */}
        {error && (
          <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
            {error}
          </div>
        )}
      </div>
    </DialogFormShell>
  );
}
