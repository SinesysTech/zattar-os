'use server';

import { publicAction } from '@/lib/safe-action';
import { finalizarPrestacaoContasSchema } from '../domain';
import { finalizarPrestacaoContas } from '../service';

export const actionFinalizarPrestacaoContas = publicAction(
  finalizarPrestacaoContasSchema,
  async (data) => {
    const result = await finalizarPrestacaoContas({
      token: data.token,
      cpfConfirmado: data.cpfConfirmado,
      dadosBancarios: data.dadosBancarios,
      assinaturaBase64: data.assinaturaBase64,
      termosAceiteVersao: data.termosAceiteVersao ?? 'v1.0-MP2200-2',
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      geolocation: data.geolocation,
      dispositivoFingerprint: data.dispositivoFingerprint,
    });
    return result;
  },
);
