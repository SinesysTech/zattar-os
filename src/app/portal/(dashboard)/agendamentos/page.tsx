import { actionListarAgendamentosPortal } from "./actions";
import { AgendamentosContent } from "./agendamentos-content";

export default async function AgendamentosPage() {
  const result = await actionListarAgendamentosPortal();

  return (
    <AgendamentosContent
      proximos={result.data?.proximos ?? []}
      passados={result.data?.passados ?? []}
      error={result.error}
    />
  );
}
