"use client";

import { cn } from '@/lib/utils';
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/providers/user-provider";
import {
  ArrowLeft, CheckCircle2, Eye, EyeOff, XCircle} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Heading, Text } from '@/components/ui/typography';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import { LoadingSpinner } from "@/components/ui/loading-state"
const CLOUDRON_DEFAULTS = {
  imap_host: "my.zattaradvogados.com",
  imap_port: 993,
  smtp_host: "my.zattaradvogados.com",
  smtp_port: 587,
};

interface TestResult {
  imap: { success: boolean; error?: string };
  smtp: { success: boolean; error?: string };
}

export default function ConfigurarEmailPage() {
  const router = useRouter();
  const user = useUser();

  // Form state
  const [nomeConta, setNomeConta] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Advanced fields
  const [imapHost, setImapHost] = useState(CLOUDRON_DEFAULTS.imap_host);
  const [imapPort, setImapPort] = useState(String(CLOUDRON_DEFAULTS.imap_port));
  const [smtpHost, setSmtpHost] = useState(CLOUDRON_DEFAULTS.smtp_host);
  const [smtpPort, setSmtpPort] = useState(String(CLOUDRON_DEFAULTS.smtp_port));

  // Status
  const [isLoading, setIsLoading] = useState(true);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);

  // Load existing credentials (uses first account for backward compat)
  useEffect(() => {
    async function loadCredentials() {
      try {
        const res = await fetch("/api/mail/credentials");
        if (!res.ok) return;
        const data = await res.json();
        if (data.configured && data.accounts?.length > 0) {
          const first = data.accounts[0];
          setIsConfigured(true);
          setNomeConta(first.nome_conta || "");
          setEmail(first.imap_user);
          setImapHost(first.imap_host);
          setImapPort(String(first.imap_port));
          setSmtpHost(first.smtp_host);
          setSmtpPort(String(first.smtp_port));
        } else if (user?.emailCorporativo) {
          setEmail(user.emailCorporativo);
        }
      } catch {
        // Ignore load errors
      } finally {
        setIsLoading(false);
      }
    }
    loadCredentials();
  }, [user?.emailCorporativo]);

  const buildPayload = useCallback(() => {
    return {
      nome_conta: nomeConta.trim() || undefined,
      imap_host: imapHost || CLOUDRON_DEFAULTS.imap_host,
      imap_port: Number(imapPort) || CLOUDRON_DEFAULTS.imap_port,
      imap_user: email,
      imap_pass: password,
      smtp_host: smtpHost || CLOUDRON_DEFAULTS.smtp_host,
      smtp_port: Number(smtpPort) || CLOUDRON_DEFAULTS.smtp_port,
      smtp_user: email,
      smtp_pass: password,
    };
  }, [nomeConta, email, password, imapHost, imapPort, smtpHost, smtpPort]);

  const handleTest = useCallback(async () => {
    if (!email || !password) {
      setError("Preencha o e-mail e a senha antes de testar.");
      return;
    }

    setIsTesting(true);
    setTestResult(null);
    setError(null);

    try {
      const res = await fetch("/api/mail/credentials/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      });

      if (!res.ok) {
        throw new Error("Erro ao testar conexão");
      }

      const result = await res.json();
      setTestResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao testar conexão");
    } finally {
      setIsTesting(false);
    }
  }, [email, password, buildPayload]);

  const handleSave = useCallback(async () => {
    if (!email || !password) {
      setError("Preencha o e-mail e a senha.");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/mail/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao salvar credenciais");
      }

      router.push("/app/mail");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setIsSaving(false);
    }
  }, [email, password, buildPayload, router]);

  const handleDelete = useCallback(async () => {
    setIsSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/mail/credentials", { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao remover credenciais");

      setIsConfigured(false);
      setPassword("");
      setTestResult(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao remover");
    } finally {
      setIsSaving(false);
    }
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner className="text-muted-foreground size-6" />
      </div>
    );
  }

  return (
    <div className={cn(/* design-system-escape: space-y-6 → migrar para <Stack gap="loose">; py-6 padding direcional sem Inset equiv. */ "mx-auto max-w-xl space-y-6 py-6")}>
      <div className={cn(/* design-system-escape: gap-3 gap sem token DS */ "flex items-center gap-3")}>
        <Button variant="ghost" size="icon" aria-label="Voltar" onClick={() => router.push("/app/mail")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <Heading level="page">Configurar E-mail</Heading>
          <p className={cn("text-muted-foreground text-body-sm")}>
            Conecte sua conta de e-mail do Cloudron
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Credenciais</CardTitle>
          <CardDescription>
            {isConfigured
              ? "Suas credenciais estão configuradas. Atualize a senha se necessário."
              : "Informe o e-mail e senha da sua conta Cloudron."}
          </CardDescription>
        </CardHeader>
        <CardContent className={cn(/* design-system-escape: space-y-4 → migrar para <Stack gap="default"> */ "space-y-4")}>
          <div className={cn(/* design-system-escape: space-y-2 → migrar para <Stack gap="tight"> */ "space-y-2")}>
            <Label htmlFor="nome-conta">Nome da conta</Label>
            <Input
              id="nome-conta"
              placeholder="Ex: Pessoal, Trabalho, Escritório"
              value={nomeConta}
              onChange={(e) => setNomeConta(e.target.value)}
            />
            <Text variant="caption">
              Nome exibido na sidebar para identificar esta caixa de entrada.
            </Text>
          </div>

          <div className={cn(/* design-system-escape: space-y-2 → migrar para <Stack gap="tight"> */ "space-y-2")}>
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu.nome@zattaradvogados.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className={cn(/* design-system-escape: space-y-2 → migrar para <Stack gap="tight"> */ "space-y-2")}>
            <Label htmlFor="password">Senha</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder={isConfigured ? "••••••••  (deixe em branco para manter)" : "Sua senha"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon" aria-label="Ocultar"
                className={cn(/* design-system-escape: px-3 padding direcional sem Inset equiv. */ "absolute right-0 top-0 h-full px-3")}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <Accordion type="single" collapsible>
            <AccordionItem value="advanced">
              <AccordionTrigger className={cn("text-body-sm")}>
                Configurações avançadas
              </AccordionTrigger>
              <AccordionContent className={cn(/* design-system-escape: space-y-4 → migrar para <Stack gap="default">; pt-2 padding direcional sem Inset equiv. */ "space-y-4 pt-2")}>
                <div className={cn(/* design-system-escape: gap-4 → migrar para <Inline gap="default"> */ "grid grid-cols-2 gap-4")}>
                  <div className={cn(/* design-system-escape: space-y-2 → migrar para <Stack gap="tight"> */ "space-y-2")}>
                    <Label htmlFor="imap-host">Servidor IMAP</Label>
                    <Input
                      id="imap-host"
                      value={imapHost}
                      onChange={(e) => setImapHost(e.target.value)}
                    />
                  </div>
                  <div className={cn(/* design-system-escape: space-y-2 → migrar para <Stack gap="tight"> */ "space-y-2")}>
                    <Label htmlFor="imap-port">Porta IMAP</Label>
                    <Input
                      id="imap-port"
                      type="number"
                      value={imapPort}
                      onChange={(e) => setImapPort(e.target.value)}
                    />
                  </div>
                </div>
                <div className={cn(/* design-system-escape: gap-4 → migrar para <Inline gap="default"> */ "grid grid-cols-2 gap-4")}>
                  <div className={cn(/* design-system-escape: space-y-2 → migrar para <Stack gap="tight"> */ "space-y-2")}>
                    <Label htmlFor="smtp-host">Servidor SMTP</Label>
                    <Input
                      id="smtp-host"
                      value={smtpHost}
                      onChange={(e) => setSmtpHost(e.target.value)}
                    />
                  </div>
                  <div className={cn(/* design-system-escape: space-y-2 → migrar para <Stack gap="tight"> */ "space-y-2")}>
                    <Label htmlFor="smtp-port">Porta SMTP</Label>
                    <Input
                      id="smtp-port"
                      type="number"
                      value={smtpPort}
                      onChange={(e) => setSmtpPort(e.target.value)}
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Test result */}
          {testResult && (
            <div className={cn(/* design-system-escape: space-y-2 → migrar para <Stack gap="tight">; p-3 → usar <Inset> */ "space-y-2 rounded-md border p-3")}>
              <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex items-center gap-2 text-body-sm")}>
                {testResult.imap.success ? (
                  <CheckCircle2 className="h-4 w-4 text-success" />
                ) : (
                  <XCircle className="h-4 w-4 text-destructive" />
                )}
                <span>
                  IMAP: {testResult.imap.success ? "Conectado" : testResult.imap.error}
                </span>
              </div>
              <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex items-center gap-2 text-body-sm")}>
                {testResult.smtp.success ? (
                  <CheckCircle2 className="h-4 w-4 text-success" />
                ) : (
                  <XCircle className="h-4 w-4 text-destructive" />
                )}
                <span>
                  SMTP: {testResult.smtp.success ? "Conectado" : testResult.smtp.error}
                </span>
              </div>
            </div>
          )}

          {error && (
            <p className={cn("text-body-sm text-destructive")}>{error}</p>
          )}

          {/* Actions */}
          <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight">; pt-2 padding direcional sem Inset equiv. */ "flex items-center gap-2 pt-2")}>
            <Button
              variant="outline"
              onClick={handleTest}
              disabled={isTesting || !email || !password}
            >
              {isTesting && <LoadingSpinner className="mr-2" />}
              Testar Conexão
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || !email || !password}
            >
              {isSaving && <LoadingSpinner className="mr-2" />}
              Salvar
            </Button>
            {isConfigured && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isSaving}
                className="ml-auto"
              >
                Remover
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
