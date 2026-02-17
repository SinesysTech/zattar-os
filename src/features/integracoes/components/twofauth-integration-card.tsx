"use client";

/**
 * TwoFAuthIntegrationCard - Card de integração do 2FAuth
 * Exibe status e permite configurar a integração
 */

import { useState } from "react";
import { KeyRound, Settings, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AppBadge } from "@/components/ui/app-badge";
import { TwoFAuthConfigForm } from "./twofauth-config-form";
import type { Integracao } from "../domain";

interface TwoFAuthIntegrationCardProps {
  integracao?: Integracao | null;
}

export function TwoFAuthIntegrationCard({ integracao }: TwoFAuthIntegrationCardProps) {
  const [open, setOpen] = useState(false);
  
  const isConfigured = !!integracao;
  const isActive = integracao?.ativo ?? false;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <KeyRound className="h-10 w-10 mb-2 text-primary" />
          {isConfigured && (
            <AppBadge variant={isActive ? "success" : "secondary"}>
              {isActive ? (
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
          )}
        </div>
        <CardTitle>2FAuth</CardTitle>
        <CardDescription>
          Autenticação de dois fatores para acesso a tribunais e sistemas externos.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          {isConfigured
            ? "Integração configurada. Gerencie suas contas 2FA e tokens de acesso."
            : "Configure a conexão com seu servidor 2FAuth para gerenciar tokens de autenticação."}
        </p>
      </CardContent>
      <CardFooter>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full">
              <Settings className="h-4 w-4 mr-2" />
              {isConfigured ? "Gerenciar" : "Configurar"}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Configuração 2FAuth</DialogTitle>
              <DialogDescription>
                Configure a conexão com seu servidor 2FAuth para gerenciar tokens de autenticação de dois fatores.
              </DialogDescription>
            </DialogHeader>
            <TwoFAuthConfigForm integracao={integracao} onSuccess={() => setOpen(false)} />
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}
