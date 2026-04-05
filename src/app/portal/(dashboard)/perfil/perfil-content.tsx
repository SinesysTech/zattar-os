"use client"

import { EmptyState } from "@/components/shared/empty-state"
import { PortalSectionHeader } from "@/app/portal/feature"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  User,
  Mail,
  Phone,
  MapPin,
  Scale,
  FileText,
} from "lucide-react"
import Link from "next/link"
import type { PerfilPortal } from "./domain"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mascaraCPF(cpf: string): string {
  // Show only last 2 digits: ***.***.***-XX
  if (cpf.length < 2) return cpf
  const ultimos = cpf.slice(-2)
  return `***.***.**${cpf.length >= 3 ? cpf[cpf.length - 3] : "*"}-${ultimos}`
}

function formatarData(iso: string | null): string {
  if (!iso) return "—"
  try {
    const date = new Date(iso + "T00:00:00")
    return date.toLocaleDateString("pt-BR")
  } catch {
    return iso
  }
}

function formatarCEP(cep: string): string {
  const limpo = cep.replace(/\D/g, "")
  if (limpo.length === 8) {
    return `${limpo.slice(0, 5)}-${limpo.slice(5)}`
  }
  return cep
}

function getInitials(nome: string): string {
  return nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("")
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function InfoItem({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string | null
  icon?: React.ElementType
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-portal-text-muted uppercase tracking-wide flex items-center gap-1.5">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </p>
      <p className="text-sm text-foreground">{value || "—"}</p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

interface PerfilContentProps {
  perfil?: PerfilPortal
  error?: string
}

export function PerfilContent({ perfil, error }: PerfilContentProps) {
  if (error) {
    return (
      <div className="space-y-6">
        <PortalSectionHeader title="Meu Perfil" />
        <div className="text-center py-12 text-portal-text-muted">
          <p>{error}</p>
        </div>
      </div>
    )
  }

  if (!perfil) {
    return (
      <div className="space-y-6">
        <PortalSectionHeader title="Meu Perfil" />
        <EmptyState
          icon={User}
          title="Perfil nao encontrado"
          description="Nao foi possivel carregar os dados do seu perfil."
        />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <PortalSectionHeader title="Meu Perfil" />

      <div className="space-y-6">
        {/* Header with avatar */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xl font-bold">
                {getInitials(perfil.nome)}
              </div>
              <div className="min-w-0">
                <h2 className="text-xl font-semibold text-foreground truncate">
                  {perfil.nome}
                </h2>
                <p className="text-sm text-portal-text-muted">
                  CPF: {mascaraCPF(perfil.cpf)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dados Pessoais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4" />
              Dados Pessoais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <InfoItem label="Nome" value={perfil.nome} icon={User} />
              <InfoItem label="E-mail" value={perfil.email} icon={Mail} />
              <InfoItem label="Celular" value={perfil.celular} icon={Phone} />
              <InfoItem
                label="Telefone Residencial"
                value={perfil.telefoneResidencial}
                icon={Phone}
              />
              <InfoItem
                label="Data de Nascimento"
                value={formatarData(perfil.dataNascimento)}
              />
              <InfoItem label="Estado Civil" value={perfil.estadoCivil} />
              <InfoItem label="RG" value={perfil.rg} icon={FileText} />
            </div>
          </CardContent>
        </Card>

        {/* Endereco */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-4 w-4" />
              Endereco
            </CardTitle>
          </CardHeader>
          <CardContent>
            {perfil.endereco ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <InfoItem
                  label="Logradouro"
                  value={
                    perfil.endereco.numero
                      ? `${perfil.endereco.logradouro}, ${perfil.endereco.numero}`
                      : perfil.endereco.logradouro
                  }
                />
                <InfoItem
                  label="Complemento"
                  value={perfil.endereco.complemento}
                />
                <InfoItem label="Bairro" value={perfil.endereco.bairro} />
                <InfoItem
                  label="Cidade / Estado"
                  value={
                    perfil.endereco.cidade && perfil.endereco.estado
                      ? `${perfil.endereco.cidade} / ${perfil.endereco.estado}`
                      : perfil.endereco.cidade || perfil.endereco.estado || null
                  }
                />
                <InfoItem
                  label="CEP"
                  value={
                    perfil.endereco.cep
                      ? formatarCEP(perfil.endereco.cep)
                      : null
                  }
                />
              </div>
            ) : (
              <p className="text-sm text-portal-text-muted">
                Endereco nao cadastrado.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Processos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Scale className="h-4 w-4" />
              Processos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {perfil.totalProcessos}
                </p>
                <p className="text-sm text-portal-text-muted">
                  {perfil.totalProcessos === 1
                    ? "processo vinculado"
                    : "processos vinculados"}
                </p>
              </div>
              {perfil.totalProcessos > 0 && (
                <Link
                  href="/portal/processos"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Ver processos
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
