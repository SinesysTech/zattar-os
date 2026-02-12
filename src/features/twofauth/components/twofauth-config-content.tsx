"use client";

/**
 * TwoFAuthConfigContent - Componente principal da tab de configurações do 2FAuth
 *
 * Exibe:
 * - Status da conexão com o servidor 2FAuth
 * - Lista de contas 2FA cadastradas
 * - Ações de gerenciamento (ver OTP, editar, excluir)
 * - Grupos disponíveis
 */

import { useEffect, useState, useCallback } from "react";
import {
  ShieldCheckIcon,
  RefreshCwIcon,
  Loader2Icon,
  CheckCircleIcon,
  XCircleIcon,
  KeyRoundIcon,
  PlusIcon,
  TrashIcon,
  QrCodeIcon,
  CopyIcon,
  CheckIcon,
  SettingsIcon,
  FolderIcon,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

// =============================================================================
// TIPOS
// =============================================================================

interface TwoFAuthAccount {
  id: number;
  service: string | null;
  account: string | null;
  icon: string | null;
  otp_type: "totp" | "hotp";
  digits: number;
  algorithm: string;
  period: number | null;
  counter: number | null;
  group_id: number | null;
}

interface TwoFAuthGroup {
  id: number;
  name: string;
  twofaccounts_count?: number;
}

interface ConnectionStatus {
  connected: boolean;
  configured: boolean;
  error?: string;
  user?: {
    id: number;
    name: string;
    email: string;
    is_admin: boolean;
  };
}

interface OTPResult {
  password: string;
  nextPassword?: string;
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function TwoFAuthConfigContent() {
  // Estado
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [accounts, setAccounts] = useState<TwoFAuthAccount[]>([]);
  const [groups, setGroups] = useState<TwoFAuthGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estado do OTP
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [currentOTP, setCurrentOTP] = useState<OTPResult | null>(null);
  const [otpLoading, setOtpLoading] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [copied, setCopied] = useState(false);

  // Estado de exclusão
  const [accountToDelete, setAccountToDelete] = useState<TwoFAuthAccount | null>(null);

  // Buscar status da conexão
  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch("/api/twofauth/status");
      const data = await response.json();
      if (data.success) {
        setStatus(data.data);
      }
    } catch (err) {
      setError("Erro ao verificar conexão");
    }
  }, []);

  // Buscar contas
  const fetchAccounts = useCallback(async () => {
    try {
      const response = await fetch("/api/twofauth/accounts");
      const data = await response.json();
      if (data.success) {
        setAccounts(data.data || []);
      }
    } catch (err) {
      setError("Erro ao buscar contas");
    }
  }, []);

  // Buscar grupos
  const fetchGroups = useCallback(async () => {
    try {
      const response = await fetch("/api/twofauth/groups");
      const data = await response.json();
      if (data.success) {
        setGroups(data.data || []);
      }
    } catch {
      // Grupos são opcionais, ignorar erro
    }
  }, []);

  // Carregar dados iniciais
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    await Promise.all([fetchStatus(), fetchAccounts(), fetchGroups()]);
    setIsLoading(false);
  }, [fetchStatus, fetchAccounts, fetchGroups]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Buscar OTP de uma conta
  const fetchOTP = useCallback(async (accountId: number) => {
    setOtpLoading(true);
    setSelectedAccountId(accountId);
    try {
      const response = await fetch(`/api/twofauth/accounts/${accountId}/otp`);
      const data = await response.json();
      if (data.success) {
        setCurrentOTP(data.data);
        setTimeRemaining(30);
      }
    } catch {
      setCurrentOTP(null);
    } finally {
      setOtpLoading(false);
    }
  }, []);

  // Timer para countdown do OTP
  useEffect(() => {
    if (!selectedAccountId || !currentOTP) return;

    const account = accounts.find((a) => a.id === selectedAccountId);
    const period = account?.period || 30;

    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const remaining = period - (now % period);
      setTimeRemaining(remaining);

      // Quando o tempo acabar, buscar novo OTP
      if (remaining === period) {
        fetchOTP(selectedAccountId);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [selectedAccountId, currentOTP, accounts, fetchOTP]);

  // Copiar OTP
  const handleCopyOTP = async () => {
    if (!currentOTP?.password) return;
    try {
      await navigator.clipboard.writeText(currentOTP.password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignorar erro de clipboard
    }
  };

  // Excluir conta
  const handleDeleteAccount = async () => {
    if (!accountToDelete) return;

    try {
      const response = await fetch(`/api/twofauth/accounts/${accountToDelete.id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (data.success) {
        setAccounts((prev) => prev.filter((a) => a.id !== accountToDelete.id));
        if (selectedAccountId === accountToDelete.id) {
          setSelectedAccountId(null);
          setCurrentOTP(null);
        }
      }
    } catch {
      setError("Erro ao excluir conta");
    } finally {
      setAccountToDelete(null);
    }
  };

  // Renderizar ícone da conta
  const renderAccountIcon = (account: TwoFAuthAccount) => {
    const hasValidIcon =
      account.icon &&
      (account.icon.startsWith("http") ||
        account.icon.startsWith("data:image") ||
        account.icon.startsWith("/"));

    const initials = account.service
      ? account.service
          .split(" ")
          .map((w) => w[0])
          .join("")
          .slice(0, 2)
          .toUpperCase()
      : "2F";

    return (
      <Avatar className="h-10 w-10 bg-primary/10">
        {hasValidIcon ? (
          <AvatarImage src={account.icon!} alt={account.service || "2FA"} className="object-cover" />
        ) : null}
        <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
          {initials}
        </AvatarFallback>
      </Avatar>
    );
  };

  // Formatar OTP
  const formatOTP = (code: string) => {
    if (code.length === 6) {
      return `${code.slice(0, 3)} ${code.slice(3)}`;
    }
    return code;
  };

  // =============================================================================
  // RENDERIZAÇÃO
  // =============================================================================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2Icon className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Card de Status da Conexão */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheckIcon className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Conexão 2FAuth</CardTitle>
            </div>
            <Button variant="outline" size="sm" onClick={loadData} disabled={isLoading}>
              <RefreshCwIcon className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
              Atualizar
            </Button>
          </div>
          <CardDescription>Status da conexão com o servidor de autenticação</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            {status?.connected ? (
              <>
                <CheckCircleIcon className="h-8 w-8 text-green-500" />
                <div>
                  <div className="font-medium text-green-600">Conectado</div>
                  {status.user && (
                    <div className="text-sm text-muted-foreground">
                      Usuário: {status.user.name} ({status.user.email})
                      {status.user.is_admin && (
                        <Badge variant="secondary" className="ml-2">
                          Admin
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <XCircleIcon className="h-8 w-8 text-destructive" />
                <div>
                  <div className="font-medium text-destructive">Desconectado</div>
                  <div className="text-sm text-muted-foreground">
                    {status?.configured
                      ? status.error || "Não foi possível conectar ao servidor"
                      : "Servidor 2FAuth não configurado. Defina TWOFAUTH_API_URL e TWOFAUTH_API_TOKEN."}
                  </div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Card de Contas */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <KeyRoundIcon className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Contas 2FA</CardTitle>
              <Badge variant="secondary">{accounts.length}</Badge>
            </div>
            <Button variant="outline" size="sm" disabled>
              <PlusIcon className="h-4 w-4 mr-2" />
              Nova Conta
            </Button>
          </div>
          <CardDescription>Gerencie suas contas de autenticação de dois fatores</CardDescription>
        </CardHeader>
        <CardContent>
          {accounts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <KeyRoundIcon className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhuma conta 2FA cadastrada</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-2">
                {accounts.map((account) => (
                  <div
                    key={account.id}
                    className={cn(
                      "flex items-center gap-4 p-3 rounded-lg border",
                      selectedAccountId === account.id && "bg-accent border-primary"
                    )}
                  >
                    {renderAccountIcon(account)}

                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {account.service || `Conta #${account.id}`}
                      </div>
                      <div className="text-sm text-muted-foreground truncate">
                        {account.account || account.otp_type.toUpperCase()}
                      </div>
                    </div>

                    {/* OTP Display */}
                    {selectedAccountId === account.id && currentOTP && (
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <div
                            className={cn(
                              "font-mono text-xl font-bold cursor-pointer",
                              timeRemaining <= 5 && "text-destructive animate-pulse"
                            )}
                            onClick={handleCopyOTP}
                          >
                            {formatOTP(currentOTP.password)}
                          </div>
                          <Progress
                            value={(timeRemaining / (account.period || 30)) * 100}
                            className={cn("h-1 w-24", timeRemaining <= 5 && "[&>div]:bg-destructive")}
                          />
                        </div>
                        <Button variant="ghost" size="icon" onClick={handleCopyOTP}>
                          {copied ? (
                            <CheckIcon className="h-4 w-4 text-green-500" />
                          ) : (
                            <CopyIcon className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      {selectedAccountId !== account.id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => fetchOTP(account.id)}
                          disabled={otpLoading}
                        >
                          {otpLoading && selectedAccountId === account.id ? (
                            <Loader2Icon className="h-4 w-4 animate-spin" />
                          ) : (
                            <KeyRoundIcon className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setAccountToDelete(account)}
                        className="text-destructive hover:text-destructive"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Card de Grupos */}
      {groups.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <FolderIcon className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Grupos</CardTitle>
              <Badge variant="secondary">{groups.length}</Badge>
            </div>
            <CardDescription>Organize suas contas em grupos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {groups.map((group) => (
                <Badge key={group.id} variant="outline" className="px-3 py-1">
                  {group.name}
                  {group.twofaccounts_count !== undefined && (
                    <span className="ml-2 text-muted-foreground">({group.twofaccounts_count})</span>
                  )}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={!!accountToDelete} onOpenChange={() => setAccountToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Conta</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a conta{" "}
              <strong>{accountToDelete?.service || `#${accountToDelete?.id}`}</strong>?
              <br />
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default TwoFAuthConfigContent;
