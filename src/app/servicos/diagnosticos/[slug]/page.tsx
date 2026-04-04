import dynamic from "next/dynamic"
import { notFound } from "next/navigation"

const DIAGNOSTICOS: Record<string, () => Promise<{ default: React.ComponentType }>> = {
  "direitos-demissao": () => import("@/app/portal/(dashboard)/servicos/diagnosticos/direitos-demissao/page"),
  "verificador-prazos": () => import("@/app/portal/(dashboard)/servicos/diagnosticos/verificador-prazos/page"),
  "analise-jornada": () => import("@/app/portal/(dashboard)/servicos/diagnosticos/analise-jornada/page"),
  "elegibilidade-beneficios": () => import("@/app/portal/(dashboard)/servicos/diagnosticos/elegibilidade-beneficios/page"),
  "simulador-acao": () => import("@/app/portal/(dashboard)/servicos/diagnosticos/simulador-acao/page"),
}

export default async function DiagnosticoPublicoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const loader = DIAGNOSTICOS[slug]
  if (!loader) notFound()

  const Component = dynamic(loader)
  return <Component />
}

export function generateStaticParams() {
  return Object.keys(DIAGNOSTICOS).map((slug) => ({ slug }))
}
