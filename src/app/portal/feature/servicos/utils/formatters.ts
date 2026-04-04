// src/app/portal/feature/servicos/utils/formatters.ts

export const formatBRL = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)

export const formatBRLPrecise = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency", currency: "BRL",
    minimumFractionDigits: 2, maximumFractionDigits: 4,
  }).format(value)

export const formatPercent = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "percent", minimumFractionDigits: 2,
  }).format(value)

export const formatDateBR = (date: Date) =>
  date.toLocaleDateString("pt-BR")

export const formatNumber = (value: number, decimals = 2) =>
  new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: decimals, maximumFractionDigits: decimals,
  }).format(value)
