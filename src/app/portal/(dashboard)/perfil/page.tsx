import { actionObterPerfilPortal } from "./actions"
import { PerfilContent } from "./perfil-content"

export default async function PerfilPage() {
  const result = await actionObterPerfilPortal()
  return <PerfilContent perfil={result.data} error={result.error} />
}
