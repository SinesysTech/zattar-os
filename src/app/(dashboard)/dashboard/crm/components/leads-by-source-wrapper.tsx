import { actionContarClientesPorEstado } from "@/features/partes";
import { LeadBySourceCard } from "./leads-by-source";

export async function LeadBySourceCardWrapper() {
  const result = await actionContarClientesPorEstado(4);

  return (
    <LeadBySourceCard 
      data={result.success ? result.data : undefined}
      error={result.success ? undefined : result.error}
    />
  );
}

