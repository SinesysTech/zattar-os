"use client"

import { useState } from "react"
import {
  AlertTriangle,
  CreditCard,
  Landmark,
  Receipt,
  Smartphone,
} from "lucide-react"
import {
  PortalSectionHeader,
  PortalBadge,
  PortalFilterBar,
} from "@/app/portal/feature"
import type { PagamentoPortal, ResumoFinanceiroPortal, StatusPagamentoPortal } from "../financeiro/domain"

// ============================================================================
// Helpers
// ============================================================================

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
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

function getMetodoIcon(metodo?: string) {
  if (!metodo) return null
  if (metodo.includes("Transferência")) return <Landmark className="w-4 h-4" />
  if (metodo.includes("Judicial")) return <Receipt className="w-4 h-4" />
  if (metodo.includes("Recursal")) return <CreditCard className="w-4 h-4" />
  // Fallback for Pix-like or unknown
  return <Smartphone className="w-4 h-4" />
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

// ============================================================================
// Props
// ============================================================================

interface PagamentosContentProps {
  pagamentos: PagamentoPortal[]
  resumo?: ResumoFinanceiroPortal
  error?: string
}

// ============================================================================
// Component
// ============================================================================

export function PagamentosContent({ pagamentos, resumo, error }: PagamentosContentProps) {
  const [activeFilter, setActiveFilter] = useState("Todos")

  if (error) {
    return (
      <div className="bg-card rounded-xl border border-border p-8 text-center">
        <AlertTriangle className="w-8 h-8 text-portal-warning mx-auto mb-3" />
        <p className="text-portal-text-muted text-sm">{error}</p>
      </div>
    )
  }

  const filterStatus = FILTER_MAP[activeFilter]
  const filtered = filterStatus
    ? pagamentos.filter((p) => p.status === filterStatus)
    : pagamentos

  const totalFiltered = filtered.reduce((acc, p) => acc + p.valor, 0)

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <PortalSectionHeader
          title="Pagamentos"
          description="Histórico completo de parcelas e obrigações financeiras."
        />
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {/* Toolbar */}
        <div className="px-6 py-4 border-b border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-sm text-portal-text-muted">
            {pagamentos.length} parcela{pagamentos.length !== 1 ? "s" : ""} encontrada{pagamentos.length !== 1 ? "s" : ""}
          </p>
          <PortalFilterBar
            filters={FILTER_OPTIONS.map((o) => ({ label: o.label, value: o.value }))}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
          />
        </div>

        {/* Table header */}
        <div className="bg-portal-surface px-6 py-3 grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 items-center border-b border-border/50">
          <span className="text-xs font-medium tracking-wider text-portal-text-muted uppercase">
            Descricao
          </span>
          <span className="text-xs font-medium tracking-wider text-portal-text-muted uppercase w-28 text-right">
            Vencimento
          </span>
          <span className="text-xs font-medium tracking-wider text-portal-text-muted uppercase w-32 text-right">
            Valor
          </span>
          <span className="text-xs font-medium tracking-wider text-portal-text-muted uppercase w-36 text-center">
            Metodo
          </span>
          <span className="text-xs font-medium tracking-wider text-portal-text-muted uppercase w-24 text-center">
            Status
          </span>
        </div>

        {/* Rows */}
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
                className="px-6 py-4 grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 items-center hover:bg-portal-card-hover transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {pagamento.descricao}
                  </p>
                  {pagamento.processoNumero && (
                    <p className="text-xs text-portal-text-muted mt-0.5 truncate font-mono">
                      {pagamento.processoNumero}
                    </p>
                  )}
                </div>

                <p className="text-sm text-portal-text-muted w-28 text-right shrink-0 tabular-nums">
                  {pagamento.dataVencimento ?? pagamento.data}
                </p>

                <p className="text-sm font-semibold text-foreground w-32 text-right shrink-0 tabular-nums">
                  {formatCurrency(pagamento.valor)}
                </p>

                <div className="w-36 flex items-center justify-center gap-1.5 shrink-0">
                  {pagamento.metodo ? (
                    <>
                      <span className="text-portal-text-muted">
                        {getMetodoIcon(pagamento.metodo)}
                      </span>
                      <span className="text-sm text-portal-text-muted truncate">
                        {pagamento.metodo}
                      </span>
                    </>
                  ) : (
                    <span className="text-sm text-portal-text-subtle">—</span>
                  )}
                </div>

                <div className="w-24 flex justify-center shrink-0">
                  <PortalBadge variant={getStatusBadgeVariant(pagamento.status)}>
                    {pagamento.status}
                  </PortalBadge>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer summary */}
        <div className="bg-portal-surface px-6 py-4 border-t border-border/50 flex items-center justify-between">
          <p className="text-xs text-portal-text-muted">
            {filtered.length} de {pagamentos.length} registros
            {filterStatus && (
              <span className="ml-1">
                — Total: <span className="font-semibold text-foreground tabular-nums">{formatCurrency(totalFiltered)}</span>
              </span>
            )}
          </p>
          {resumo && (
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
          )}
        </div>
      </div>
    </>
  )
}
