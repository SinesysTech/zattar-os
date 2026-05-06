"use client";

import {
  cn } from '@/lib/utils';
import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, XCircle, AlertCircle} from "lucide-react";

import {
  TRIBUNAIS_ATIVOS,
  TRIBUNAIS_LABELS,
  GRAUS_LABELS,
  type Advogado,
  type GrauCredencial,
  type ModoDuplicata,
  type ResumoCriacaoEmLote,
} from "../domain";
import { actionCriarCredenciaisEmLote } from "../actions/credenciais-actions";

import { LoadingSpinner } from "@/components/ui/loading-state"
import { Text } from '@/components/ui/typography';
interface CredenciaisLoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  advogado: Advogado;
  onSuccess?: () => void;
}

export function CredenciaisLoteDialog({
  open,
  onOpenChange,
  advogado,
  onSuccess,
}: CredenciaisLoteDialogProps) {
  // Estados do formulário
  const [tribunais, setTribunais] = React.useState<string[]>([]);
  const [graus, setGraus] = React.useState<GrauCredencial[]>(["1", "2"]);
  const [senha, setSenha] = React.useState("");
  const [modoDuplicata, setModoDuplicata] =
    React.useState<ModoDuplicata>("pular");

  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [resultado, setResultado] = React.useState<ResumoCriacaoEmLote | null>(
    null
  );

  // Reset ao abrir
  React.useEffect(() => {
    if (open) {
      setTribunais([]);
      setGraus(["1", "2"]);
      setSenha("");
      setModoDuplicata("pular");
      setError(null);
      setResultado(null);
    }
  }, [open]);

  // Toggle tribunal
  const toggleTribunal = (trt: string) => {
    setTribunais((prev) =>
      prev.includes(trt) ? prev.filter((t) => t !== trt) : [...prev, trt]
    );
  };

  // Toggle grau
  const toggleGrau = (grau: GrauCredencial) => {
    setGraus((prev) => {
      if (prev.includes(grau) && prev.length === 1) return prev; // Manter pelo menos 1
      return prev.includes(grau)
        ? prev.filter((g) => g !== grau)
        : [...prev, grau];
    });
  };

  // Selecionar todos os tribunais
  const selectAllTribunais = () => setTribunais([...TRIBUNAIS_ATIVOS]);
  const clearTribunais = () => setTribunais([]);

  // Número de credenciais a serem criadas
  const totalCredenciais = tribunais.length * graus.length;

  // Salvar
  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setResultado(null);

    try {
      const result = await actionCriarCredenciaisEmLote({
        advogado_id: advogado.id,
        tribunais,
        graus,
        senha,
        modo_duplicata: modoDuplicata,
      });

      if (!result.success) {
        throw new Error(result.error || "Erro ao criar credenciais");
      }

      setResultado(result.data as ResumoCriacaoEmLote);
      onSuccess?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro desconhecido");
    } finally {
      setIsSaving(false);
    }
  };

  const isFormValid =
    tribunais.length > 0 && graus.length > 0 && senha.length > 0;

  // Formatar CPF para exibição
  const formatCpf = (cpf: string) => {
    const clean = cpf.replace(/\D/g, "");
    return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-3xl  overflow-hidden p-0 gap-0 max-h-[90vh] flex flex-col"
      >
        <DialogHeader className="px-6 py-4 border-b border-border/20 shrink-0">
          <DialogTitle>Criar Credenciais em Lote</DialogTitle>
          <DialogDescription className="sr-only">Selecione tribunais, graus e configure a senha para criar credenciais em lote</DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-4 [scrollbar-width:thin]">
      <div className={cn("flex flex-col px-6 py-4 stack-loose")}>
        <p className={cn("text-body-sm text-muted-foreground")}>
          Advogado: {advogado.nome_completo} (CPF: {formatCpf(advogado.cpf)})
        </p>
        {resultado ? (
          // Exibir resultado
          <ResultadoView resultado={resultado} onClose={() => onOpenChange(false)} />
        ) : (
          // Formulário
          <>
            {/* Tribunais */}
            <div className={cn("grid inline-tight")}>
              <div className="flex items-center justify-between">
                <Label>
                  Tribunais <span className="text-destructive">*</span>
                </Label>
                <div className={cn("flex inline-tight")}>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={selectAllTribunais}
                    disabled={isSaving}
                  >
                    Selecionar todos
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={clearTribunais}
                    disabled={isSaving}
                  >
                    Limpar
                  </Button>
                </div>
              </div>
              <ScrollArea className={cn("h-48 border rounded-md inset-medium")}>
                <div className={cn("grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 inline-tight")}>
                  {TRIBUNAIS_ATIVOS.map((trt) => (
                    <div key={trt} className={cn("flex items-center space-x-2")}>
                      <Checkbox
                        id={`trt-${trt}`}
                        checked={tribunais.includes(trt)}
                        onCheckedChange={() => toggleTribunal(trt)}
                        disabled={isSaving}
                      />
                      <label
                        htmlFor={`trt-${trt}`}
                        className={cn("text-body-sm cursor-pointer")}
                        title={TRIBUNAIS_LABELS[trt]}
                      >
                        {trt}
                      </label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <Text variant="caption">
                {tribunais.length} tribunal(is) selecionado(s)
              </Text>
            </div>

            {/* Graus */}
            <div className={cn("grid inline-tight")}>
              <Label>
                Graus <span className="text-destructive">*</span>
              </Label>
              <div className={cn("flex inline-default")}>
                {(["1", "2"] as GrauCredencial[]).map((grau) => (
                  <label
                    key={grau}
                    className={cn("flex items-center inline-tight cursor-pointer")}
                  >
                    <Checkbox
                      id={`grau-${grau}`}
                      checked={graus.includes(grau)}
                      onCheckedChange={() => toggleGrau(grau)}
                      disabled={isSaving}
                    />
                    <span className={cn("text-body-sm")}>{GRAUS_LABELS[grau]}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Senha */}
            <div className={cn("grid inline-tight")}>
              <Label htmlFor="senha">
                Senha <span className="text-destructive">*</span>
              </Label>
              <Input
                id="senha"
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Senha única para todas as credenciais"
                disabled={isSaving}
              />
              <Text variant="caption">
                Esta senha será usada para todas as credenciais criadas. O login
                (usuário) será o CPF do advogado.
              </Text>
            </div>

            {/* Modo duplicata */}
            <div className={cn("grid inline-tight")}>
              <Label>Credenciais existentes</Label>
              <RadioGroup
                value={modoDuplicata}
                onValueChange={(v) => setModoDuplicata(v as ModoDuplicata)}
                className={cn("flex inline-default")}
                disabled={isSaving}
              >
                <div className={cn("flex items-center space-x-2")}>
                  <RadioGroupItem value="pular" id="modo-pular" />
                  <label
                    htmlFor="modo-pular"
                    className={cn("text-body-sm cursor-pointer")}
                  >
                    Pular (manter existente)
                  </label>
                </div>
                <div className={cn("flex items-center space-x-2")}>
                  <RadioGroupItem value="sobrescrever" id="modo-sobrescrever" />
                  <label
                    htmlFor="modo-sobrescrever"
                    className={cn("text-body-sm cursor-pointer")}
                  >
                    Sobrescrever (atualizar senha)
                  </label>
                </div>
              </RadioGroup>
            </div>

            {/* Preview */}
            {totalCredenciais > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Resumo</AlertTitle>
                <AlertDescription>
                  Serão criadas até <strong>{totalCredenciais}</strong>{" "}
                  credencia{totalCredenciais === 1 ? "l" : "is"} (
                  {tribunais.length} tribunal(is) x {graus.length} grau(s))
                </AlertDescription>
              </Alert>
            )}

            {/* Erro */}
            {error && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Erro</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Botões */}
            <div className={cn("flex items-center inline-tight pt-4 border-t")}>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSaving}
                className="mr-auto"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving || !isFormValid}
              >
                {isSaving && <LoadingSpinner className="mr-2" />}
                Criar {totalCredenciais} Credencia
                {totalCredenciais === 1 ? "l" : "is"}
              </Button>
            </div>
          </>
        )}
      </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Componente para exibir resultado
function ResultadoView({
  resultado,
  onClose,
}: {
  resultado: ResumoCriacaoEmLote;
  onClose: () => void;
}) {
  const hasErrors = resultado.erros > 0;

  return (
    <div className={cn("flex flex-col stack-default")}>
      <Alert variant={hasErrors ? "destructive" : "default"}>
        <CheckCircle className="h-4 w-4" />
        <AlertTitle>Operação concluída</AlertTitle>
        <AlertDescription>
          <ul className="list-disc list-inside mt-2">
            <li>
              <strong>{resultado.criadas}</strong> credencial(is) criada(s)
            </li>
            <li>
              <strong>{resultado.atualizadas}</strong> credencial(is)
              atualizada(s)
            </li>
            <li>
              <strong>{resultado.puladas}</strong> credencial(is) pulada(s) (já
              existiam)
            </li>
            {resultado.erros > 0 && (
              <li className="text-destructive">
                <strong>{resultado.erros}</strong> erro(s)
              </li>
            )}
          </ul>
        </AlertDescription>
      </Alert>

      <ScrollArea className={cn("h-48 border rounded-md inset-medium")}>
        <table className={cn("w-full text-body-sm")}>
          <thead>
            <tr className="border-b">
              <th className={cn("text-left py-2")}>Tribunal</th>
              <th className={cn("text-left py-2")}>Grau</th>
              <th className={cn("text-left py-2")}>Status</th>
            </tr>
          </thead>
          <tbody>
            {resultado.detalhes.map((d, i) => (
              <tr key={i} className="border-b last:border-0">
                <td className={cn("py-2")}>{d.tribunal}</td>
                <td className={cn("py-2")}>{d.grau}° Grau</td>
                <td className={cn("py-2")}>
                  <StatusBadge status={d.status} mensagem={d.mensagem} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollArea>

      <div className={cn("flex justify-end pt-4 border-t")}>
        <Button onClick={onClose}>Fechar</Button>
      </div>
    </div>
  );
}

function StatusBadge({
  status,
  mensagem,
}: {
  status: string;
  mensagem?: string;
}) {
  const config = {
    criada: { color: "text-success", icon: CheckCircle, label: "Criada" },
    atualizada: {
      color: "text-info",
      icon: CheckCircle,
      label: "Atualizada",
    },
    pulada: { color: "text-warning", icon: AlertCircle, label: "Pulada" },
    erro: { color: "text-destructive", icon: XCircle, label: "Erro" },
  }[status] || { color: "text-muted-foreground", icon: AlertCircle, label: status };

  const Icon = config.icon;

  return (
    <span className={`flex items-center gap-1 ${config.color}`} title={mensagem}>
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}
