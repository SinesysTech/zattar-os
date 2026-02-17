"use client";

/**
 * TwoFAuthConfigForm - Formulário de configuração do 2FAuth
 */

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save, TestTube } from "lucide-react";
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
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
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
          description: data.data.error || "Não foi possível conectar ao servidor 2FAuth.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro ao testar",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        {/* URL da API */}
        <div className="space-y-2">
          <Label htmlFor="api_url">URL da API</Label>
          <Input
            id="api_url"
            type="url"
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
            <p className="text-sm text-destructive">{errors.account_id.message}</p>
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
