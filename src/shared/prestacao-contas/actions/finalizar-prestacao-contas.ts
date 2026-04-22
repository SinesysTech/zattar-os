'use server';

import { publicTokenAction } from '@/lib/safe-action';
import { finalizarPrestacaoContasSchema } from '../domain';
import { finalizarPrestacaoContas } from '../service';

export const actionFinalizarPrestacaoContas = publicTokenAction(
  finalizarPrestacaoContasSchema,
  async (data, { token }) => {
    return await finalizarPrestacaoContas({
      token,
      cpfConfirmado: data.cpfConfirmado,
      dadosBancarios: data.dadosBancarios,
      assinaturaBase64: data.assinaturaBase64,
      termosAceiteVersao: data.termosAceiteVersao ?? 'v1.0-MP2200-2',
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      geolocation: data.geolocation,
      dispositivoFingerprint: data.dispositivoFingerprint,
    });
  },
);
