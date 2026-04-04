import dynamic from "next/dynamic"
import { notFound } from "next/navigation"

const GERADORES: Record<string, () => Promise<{ default: React.ComponentType }>> = {
  "carta-demissao": () => import("@/app/portal/(dashboard)/servicos/geradores/carta-demissao/page"),
  "notificacao-extrajudicial": () => import("@/app/portal/(dashboard)/servicos/geradores/notificacao-extrajudicial/page"),
  "declaracao-hipossuficiencia": () => import("@/app/portal/(dashboard)/servicos/geradores/declaracao-hipossuficiencia/page"),
  "acordo-extrajudicial": () => import("@/app/portal/(dashboard)/servicos/geradores/acordo-extrajudicial/page"),
  "holerite": () => import("@/app/portal/(dashboard)/servicos/geradores/holerite/page"),
}

export default async function GeradorPublicoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const loader = GERADORES[slug]
  if (!loader) notFound()

  const Component = dynamic(loader)
  return <Component />
}

export function generateStaticParams() {
  return Object.keys(GERADORES).map((slug) => ({ slug }))
}
