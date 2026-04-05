"use client"

import { useState } from "react"
import {
  CircleDollarSign,
  Clock,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react"
import {
  PortalSectionHeader,
  PortalStatCard,
  PortalBadge,
  PortalFilterBar,
} from "@/app/portal/feature"
import type { PagamentoPortal, ResumoFinanceiroPortal, StatusPagamentoPortal } from "./domain"

// ============================================================================
// Helpers
// ============================================================================

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

const FILTER_OPTIONS = [
  { label: "Todos", value: "Todos" },
  { label: "Pagos", value: "Pagos" },
  { label: "Pendentes", value: "Pendentes" },
  { label: "Atrasados", value: "Atrasados" },
] as const

const FILTER_MAP: Record<string, StatusPagamentoPortal | null> = {
  Todos: null,
  Pagos: "Pago",
  Pendentes: "Pendente",
  Atrasados: "Atrasado",
}

function getStatusBadgeVariant(status: StatusPagamentoPortal): "success" | "warning" | "danger" {
  switch (status) {
    case "Pago":
      return "success"
    case "Pendente":
      return "warning"
    case "Atrasado":
      return "danger"
  }
}

// ============================================================================
// Props
// ============================================================================

interface FinanceiroContentProps {
  data?: {
    pagamentos: PagamentoPortal[]
    resumo: ResumoFinanceiroPortal
  }
  error?: string
}

// ============================================================================
// Component
// ============================================================================

export function FinanceiroContent({ data, error }: FinanceiroContentProps) {
  const [activeFilter, setActiveFilter] = useState("Todos")

  if (error) {
    return (
      <div className="bg-card rounded-xl border border-border p-8 text-center">
        <AlertTriangle className="w-8 h-8 text-portal-warning mx-auto mb-3" />
        <p className="text-portal-text-muted text-sm">{error}</p>
      </div>
    )
  }

  const pagamentos = data?.pagamentos ?? []
  const resumo = data?.resumo ?? {
    totalPago: 0,
    totalPendente: 0,
    totalAtrasado: 0,
    quantidadePagamentos: 0,
  }

  const filterStatus = FILTER_MAP[activeFilter]
  const filtered = filterStatus
    ? pagamentos.filter((p) => p.status === filterStatus)
    : pagamentos

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <PortalSectionHeader
          title="Painel Financeiro"
          description="Acompanhe seus pagamentos e obrigações financeiras."
        />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <PortalStatCard
          icon={<CheckCircle2 className="w-5 h-5" />}
          label="Total Pago"
          value={formatCurrency(resumo.totalPago)}
        />
        <PortalStatCard
          icon={<Clock className="w-5 h-5" />}
          label="Total Pendente"
          value={formatCurrency(resumo.totalPendente)}
        />
        <PortalStatCard
          icon={<AlertTriangle className="w-5 h-5" />}
          label="Total Atrasado"
          value={formatCurrency(resumo.totalAtrasado)}
        />
      </div>

      {/* Payments List */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {/* Header + Filters */}
        <div className="px-6 py-5 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <CircleDollarSign className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">
              Pagamentos
            </h2>
            <span className="text-xs text-portal-text-muted bg-muted px-2 py-0.5 rounded-full font-mono">
              {resumo.quantidadePagamentos}
            </span>
          </div>
          <PortalFilterBar
            filters={FILTER_OPTIONS.map((o) => ({ label: o.label, value: o.value }))}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
          />
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-portal-text-muted text-sm">
              Nenhum pagamento encontrado.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {filtered.map((pagamento) => (
              <div
                key={pagamento.id}
                className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-portal-card-hover transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">
                    {pagamento.descricao}
                  </p>
                  <p className="text-xs text-portal-text-muted mt-0.5">
                    {pagamento.status === "Pago" ? pagamento.data : `Vencimento: ${pagamento.dataVencimento}`}
                    {pagamento.metodo ? ` — ${pagamento.metodo}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <p className="text-sm font-semibold text-foreground tabular-nums">
                    {formatCurrency(pagamento.valor)}
                  </p>
                  <PortalBadge variant={getStatusBadgeVariant(pagamento.status)}>
                    {pagamento.status}
                  </PortalBadge>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="bg-portal-surface px-6 py-4 border-t border-border/50 flex items-center justify-between">
          <p className="text-xs text-portal-text-muted">
            {filtered.length} de {pagamentos.length} registros
          </p>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-xs text-portal-text-muted">Pago</p>
              <p className="text-sm font-semibold text-portal-success tabular-nums">
                {formatCurrency(resumo.totalPago)}
              </p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-right">
              <p className="text-xs text-portal-text-muted">Pendente</p>
              <p className="text-sm font-semibold text-portal-warning tabular-nums">
                {formatCurrency(resumo.totalPendente)}
              </p>
            </div>
            {resumo.totalAtrasado > 0 && (
              <>
                <div className="w-px h-8 bg-border" />
                <div className="text-right">
                  <p className="text-xs text-portal-text-muted">Atrasado</p>
                  <p className="text-sm font-semibold text-portal-danger tabular-nums">
                    {formatCurrency(resumo.totalAtrasado)}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
