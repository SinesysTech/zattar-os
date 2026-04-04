import dynamic from "next/dynamic"
import { notFound } from "next/navigation"

const CALCULADORAS: Record<string, () => Promise<{ default: React.ComponentType }>> = {
  "rescisao": () => import("@/app/portal/(dashboard)/servicos/calculadoras/rescisao/page"),
  "salario-liquido": () => import("@/app/portal/(dashboard)/servicos/calculadoras/salario-liquido/page"),
  "horas-extras": () => import("@/app/portal/(dashboard)/servicos/calculadoras/horas-extras/page"),
  "ferias": () => import("@/app/portal/(dashboard)/servicos/calculadoras/ferias/page"),
  "13-salario": () => import("@/app/portal/(dashboard)/servicos/calculadoras/13-salario/page"),
  "seguro-desemprego": () => import("@/app/portal/(dashboard)/servicos/calculadoras/seguro-desemprego/page"),
  "adicional-noturno": () => import("@/app/portal/(dashboard)/servicos/calculadoras/adicional-noturno/page"),
  "insalubridade-periculosidade": () => import("@/app/portal/(dashboard)/servicos/calculadoras/insalubridade-periculosidade/page"),
  "fgts-acumulado": () => import("@/app/portal/(dashboard)/servicos/calculadoras/fgts-acumulado/page"),
  "correcao-monetaria": () => import("@/app/portal/(dashboard)/servicos/calculadoras/correcao-monetaria/page"),
}

export default async function CalculadoraPublicaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const loader = CALCULADORAS[slug]
  if (!loader) notFound()

  const Component = dynamic(loader)
  return <Component />
}

export function generateStaticParams() {
  return Object.keys(CALCULADORAS).map((slug) => ({ slug }))
}
