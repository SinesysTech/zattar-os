"use client";

/**
 * TwoFAuthConfigForm - Formulário de configuração do 2FAuth
 */

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save, TestTube, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { actionAtualizarConfig2FAuth } from "../actions/integracoes-actions";
import { twofauthConfigSchema, type TwoFAuthConfig, type Integracao } from "../domain";

interface TwoFAuthConfigFormProps {
  integracao?: Integracao | null;
  onSuccess?: () => void;
}

export function TwoFAuthConfigForm({ integracao, onSuccess }: TwoFAuthConfigFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  // Extrair configuração existente
  const existingConfig = integracao?.configuracao as TwoFAuthConfig | undefined;

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<TwoFAuthConfig>({
    resolver: zodResolver(twofauthConfigSchema),
    defaultValues: {
      api_url: existingConfig?.api_url || "",
      api_token: existingConfig?.api_token || "",
      account_id: existingConfig?.account_id,
    },
  });

  const onSubmit = async (data: TwoFAuthConfig) => {
    setIsLoading(true);

    try {
      const result = await actionAtualizarConfig2FAuth(data);

      if (result.success) {
        toast({
          title: "Configuração salva",
          description: "A integração 2FAuth foi configurada com sucesso.",
        });
        onSuccess?.();
      } else {
        toast({
          title: "Erro ao salvar",
          description: result.error || "Não foi possível salvar a configuração.",
          variant: "error",
        });
      }
    } catch (error) {
      console.error("[TwoFAuthConfigForm] Erro ao salvar:", error);
      toast({
        title: "Erro ao salvar",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onValidationError = () => {
    toast({
      title: "Campos inválidos",
      description: "Verifique os campos destacados em vermelho.",
      variant: "error",
    });
  };

  const handleTest = async () => {
    setIsTesting(true);

    try {
      const values = getValues();

      // Testar conexão
      const response = await fetch("/api/twofauth/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (data.success && data.data.connected) {
        toast({
          title: "Conexão bem-sucedida",
          description: `Conectado como: ${data.data.user?.name || "Usuário"}`,
        });
      } else {
        toast({
          title: "Falha na conexão",
          description: data.data?.error || "Não foi possível conectar ao servidor 2FAuth.",
          variant: "error",
        });
      }
    } catch (error) {
      console.error("[TwoFAuthConfigForm] Erro ao testar:", error);
      toast({
        title: "Erro ao testar",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "error",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <form onSubmit={handleSubmit(onSubmit, onValidationError)} noValidate className="space-y-6">
      {/* Resumo de erros visível */}
      {hasErrors && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <div>
            Corrija os campos abaixo antes de salvar.
            {errors.api_url && <div>- {errors.api_url.message}</div>}
            {errors.api_token && <div>- {errors.api_token.message}</div>}
            {errors.account_id && <div>- {String(errors.account_id.message)}</div>}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {/* URL da API */}
        <div className="space-y-2">
          <Label htmlFor="api_url">URL da API</Label>
          <Input
            id="api_url"
            type="text"
            placeholder="https://authenticator.example.com/api/v1"
            {...register("api_url")}
          />
          {errors.api_url && (
            <p className="text-sm text-destructive">{errors.api_url.message}</p>
          )}
        </div>

        {/* Token da API */}
        <div className="space-y-2">
          <Label htmlFor="api_token">Token da API</Label>
          <Input
            id="api_token"
            type="password"
            placeholder="eyJ0eXAiOiJKV1QiLCJhbGc..."
            {...register("api_token")}
          />
          {errors.api_token && (
            <p className="text-sm text-destructive">{errors.api_token.message}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Gere um Personal Access Token no seu servidor 2FAuth
          </p>
        </div>

        {/* Account ID (opcional) */}
        <div className="space-y-2">
          <Label htmlFor="account_id">Account ID (opcional)</Label>
          <Input
            id="account_id"
            type="number"
            placeholder="3"
            {...register("account_id", { valueAsNumber: true })}
          />
          {errors.account_id && (
            <p className="text-sm text-destructive">{String(errors.account_id.message)}</p>
          )}
          <p className="text-xs text-muted-foreground">
            ID da conta padrão para operações automáticas
          </p>
        </div>
      </div>

      {/* Ações */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={handleTest}
          disabled={isTesting || isLoading}
          className="flex-1"
        >
          {isTesting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <TestTube className="h-4 w-4 mr-2" />
          )}
          Testar Conexão
        </Button>
        <Button type="submit" disabled={isLoading || isTesting} className="flex-1">
          {isLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Salvar
        </Button>
      </div>
    </form>
  );
}
