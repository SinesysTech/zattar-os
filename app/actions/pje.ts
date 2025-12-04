export async function listAdvogadosAction(_: unknown): Promise<{ success: boolean; data?: Array<{ id: string; nome: string; oabNumero?: string | number; oabUf?: string }>; error?: string }>{
  return { success: true, data: [] }
}
