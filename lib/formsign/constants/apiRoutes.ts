export const API_ROUTES = {
  verificarCpf: '/api/assinatura-digital/forms/verificar-cpf',
  saveClient: '/api/assinatura-digital/forms/save-client',
  getClientIp: '/api/assinatura-digital/utils/get-client-ip',
  preview: '/api/assinatura-digital/signature/preview',
  finalize: '/api/assinatura-digital/signature/finalizar',
} as const;