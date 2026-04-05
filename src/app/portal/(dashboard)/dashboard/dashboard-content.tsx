"use client"

import type { DashboardData } from "@/app/portal/feature"
import { PortalBadge } from "@/app/portal/feature"
import { EmptyState } from "@/components/shared/empty-state"
import Link from "next/link"
import {
  Scale,
  Calendar,
  CreditCard,
  Calculator,
  FileText,
  AlertCircle,
  Clock,
  ChevronRight,
  ArrowUpRight,
} from "lucide-react"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DashboardContentProps {
  data: DashboardData | null
  error?: string
}

// ---------------------------------------------------------------------------
// Nav card
// ---------------------------------------------------------------------------

interface NavCardProps {
  href: string
  icon: React.ReactNode
  label: string
  count: number
  subtitle?: string
  accent?: string
}

function NavCard({ href, icon, label, count, subtitle, accent = "bg-primary/10 text-primary" }: NavCardProps) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 rounded-2xl border border-border/60 bg-card p-4 transition-all duration-200 active:scale-[0.98] hover:border-primary/30 hover:shadow-md cursor-pointer"
    >
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${accent}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-2xl font-semibold tabular-nums text-foreground leading-none">{count}</p>
        <p className="text-sm text-portal-text-muted mt-0.5">{label}</p>
        {subtitle && (
          <p className="text-xs text-portal-text-subtle mt-0.5">{subtitle}</p>
        )}
      </div>
      <ChevronRight className="h-5 w-5 text-muted-foreground/40 shrink-0" />
    </Link>
  )
}

// ---------------------------------------------------------------------------
// Activity item
// ---------------------------------------------------------------------------

function ActivityItem({
  title,
  meta,
  badge,
  href,
}: {
  title: string
  meta: string
  badge?: React.ReactNode
  href?: string
}) {
  const content = (
    <div className="flex items-start justify-between gap-3 py-3.5">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground leading-snug">{title}</p>
        <p className="text-xs text-portal-text-muted mt-0.5">{meta}</p>
      </div>
      <div className="shrink-0 flex items-center gap-2">
        {badge}
        {href && <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/40" />}
      </div>
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="block border-b border-border/40 last:border-0 hover:bg-muted/30 -mx-1 px-1 rounded-lg transition-colors">
        {content}
      </Link>
    )
  }
  return <div className="border-b border-border/40 last:border-0">{content}</div>
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export function DashboardContent({ data, error }: DashboardContentProps) {
  if (error || !data) {
    return (
      <EmptyState
        icon={AlertCircle}
        title={error ?? "Nenhum dado disponível"}
        description="Tente recarregar a página ou entre em contato com o escritório."
      />
    )
  }

  const { processos, contratos, audiencias, pagamentos } = data

  // Derived data
  const now = new Date()
  const audienciasFuturas = audiencias
    .filter((a) => a.status === "M" && new Date(a.dataInicio) > now)
    .sort((a, b) => new Date(a.dataInicio).getTime() - new Date(b.dataInicio).getTime())

  const pagamentosPendentes = pagamentos.filter(
    (p) => p.status === "pendente" || p.status === "atrasado"
  )

  const processosRecentes = [...processos]
    .sort((a, b) => {
      const dateA = a.ultima_movimentacao?.data ?? ""
      const dateB = b.ultima_movimentacao?.data ?? ""
      return dateB.localeCompare(dateA)
    })
    .slice(0, 4)

  const proximaAudiencia = audienciasFuturas[0] ?? null
  const firstName = data.cliente.nome?.split(" ")[0] ?? "Cliente"

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Olá, {firstName}
        </h1>
        <p className="text-sm text-portal-text-muted mt-1">
          Acompanhe seus processos e compromissos.
        </p>
      </div>

      {/* Partial errors banner */}
      {data.errors && (
        <div className="rounded-xl border border-portal-warning/30 bg-portal-warning-soft p-3 text-sm text-portal-warning">
          Alguns dados não puderam ser carregados.
        </div>
      )}

      {/* ── Navigation cards grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <NavCard
          href="/portal/processos"
          icon={<Scale className="h-5 w-5" />}
          label="Processos"
          count={processos.length}
          subtitle={processos.length === 1 ? "em acompanhamento" : "em acompanhamento"}
        />
        <NavCard
          href="/portal/agendamentos"
          icon={<Calendar className="h-5 w-5" />}
          label="Audiências"
          count={audienciasFuturas.length}
          subtitle={audienciasFuturas.length === 1 ? "agendada" : "agendadas"}
          accent="bg-portal-info-soft text-portal-info"
        />
        <NavCard
          href="/portal/financeiro"
          icon={<CreditCard className="h-5 w-5" />}
          label="Financeiro"
          count={pagamentosPendentes.length}
          subtitle={pagamentosPendentes.length === 1 ? "pendente" : "pendentes"}
          accent="bg-portal-warning-soft text-portal-warning"
        />
        <NavCard
          href="/portal/servicos"
          icon={<Calculator className="h-5 w-5" />}
          label="Serviços"
          count={0}
          subtitle="calculadoras e ferramentas"
          accent="bg-portal-success-soft text-portal-success"
        />
      </div>

      {/* ── Próxima audiência (highlight card) ── */}
      {proximaAudiencia && (
        <Link
          href="/portal/agendamentos"
          className="block rounded-2xl border border-primary/20 bg-portal-primary-soft p-4 transition-all hover:shadow-md"
        >
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-primary uppercase tracking-wider">
              Próximo compromisso
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <span className="text-xs font-medium leading-none uppercase">
                {formatMonth(proximaAudiencia.dataInicio)}
              </span>
              <span className="text-xl font-semibold leading-none mt-0.5">
                {formatDay(proximaAudiencia.dataInicio)}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-foreground truncate">
                {proximaAudiencia.tipoDescricao ?? "Audiência"}
              </p>
              <p className="text-sm text-portal-text-muted">
                {proximaAudiencia.horaInicio && `${proximaAudiencia.horaInicio} · `}
                {proximaAudiencia.modalidade}
              </p>
              <p className="text-xs text-portal-text-subtle font-mono mt-0.5">
                {proximaAudiencia.numeroProcesso}
              </p>
            </div>
            {daysUntil(proximaAudiencia.dataInicio) !== null && (
              <PortalBadge variant="info">
                em {daysUntil(proximaAudiencia.dataInicio)} dia{daysUntil(proximaAudiencia.dataInicio)! > 1 ? "s" : ""}
              </PortalBadge>
            )}
          </div>
        </Link>
      )}

      {/* ── Atividade recente ── */}
      {processosRecentes.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-foreground">Atividade recente</h2>
            <Link href="/portal/processos" className="text-xs text-primary font-medium hover:underline">
              Ver todos
            </Link>
          </div>
          <div className="rounded-2xl border border-border/60 bg-card px-4">
            {processosRecentes.map((processo) => (
              <ActivityItem
                key={processo.numero}
                title={`${processo.tipo} — ${processo.parte_contraria}`}
                meta={`${processo.tribunal} · ${processo.ultima_movimentacao ? formatDateBR(processo.ultima_movimentacao.data) : processo.papel_cliente}`}
                badge={
                  processo.ultima_movimentacao ? (
                    <span className="text-xs text-portal-text-subtle truncate max-w-32 hidden sm:inline">
                      {processo.ultima_movimentacao.evento}
                    </span>
                  ) : undefined
                }
                href="/portal/processos"
              />
            ))}
          </div>
        </section>
      )}

      {/* ── Contratos ── */}
      {contratos.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-foreground">Contratos</h2>
            <Link href="/portal/contratos" className="text-xs text-primary font-medium hover:underline">
              Ver todos
            </Link>
          </div>
          <div className="rounded-2xl border border-border/60 bg-card p-4">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-portal-text-muted" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  {contratos.length} {contratos.length === 1 ? "contrato" : "contratos"}
                </p>
                <p className="text-xs text-portal-text-muted">vinculados ao seu CPF</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground/40 ml-auto" />
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatMonth(isoDate: string): string {
  try {
    return new Date(isoDate).toLocaleString("pt-BR", { month: "short" }).replace(".", "")
  } catch { return "" }
}

function formatDay(isoDate: string): string {
  try {
    return String(new Date(isoDate).getDate())
  } catch { return "" }
}

function daysUntil(isoDate: string): number | null {
  try {
    const diff = Math.ceil((new Date(isoDate).getTime() - Date.now()) / 86400000)
    return diff > 0 ? diff : null
  } catch { return null }
}

function formatDateBR(isoDate: string): string {
  try {
    return new Date(isoDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })
  } catch { return isoDate }
}
