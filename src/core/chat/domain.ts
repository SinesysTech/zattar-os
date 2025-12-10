import { z } from 'zod';

// Enums
export enum TipoSalaChat {
  Geral = 'geral',
  Documento = 'documento',
  Privado = 'privado',
  Grupo = 'grupo',
}

export enum TipoMensagemChat {
  Texto = 'texto',
  Arquivo = 'arquivo',
  Sistema = 'sistema',
}

// Interfaces
export interface SalaChat {
  id: number;
  nome: string;
  tipo: TipoSalaChat;
  documentoId: number | null;
  participanteId: number | null;
  criadoPor: number;
  createdAt: string;
  updatedAt: string;
}

export interface MensagemChat {
  id: number;
  salaId: number;
  usuarioId: number;
  conteudo: string;
  tipo: TipoMensagemChat;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface MensagemComUsuario extends MensagemChat {
  usuario: {
    id: number;
    nomeCompleto: string;
    nomeExibicao: string | null;
    emailCorporativo: string | null;
  };
}

// Schemas de Validação
export const criarSalaChatSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(200),
  tipo: z.nativeEnum(TipoSalaChat),
  documentoId: z.number().optional().nullable(),
  participanteId: z.number().optional().nullable(),
}).refine(
  data => data.tipo !== TipoSalaChat.Documento || data.documentoId !== null,
  { message: 'documentoId é obrigatório para salas de documento', path: ['documentoId'] }
).refine(
  data => data.tipo !== TipoSalaChat.Privado || data.participanteId !== null,
  { message: 'participanteId é obrigatório para conversas privadas', path: ['participanteId'] }
);

export const criarMensagemChatSchema = z.object({
  salaId: z.number(),
  conteudo: z.string().min(1, 'Conteúdo é obrigatório'),
  tipo: z.nativeEnum(TipoMensagemChat).default(TipoMensagemChat.Texto),
});

// Tipos de Parâmetros
export type ListarSalasParams = {
  tipo?: TipoSalaChat;
  documentoId?: number;
  limite?: number;
  offset?: number;
};

export type ListarMensagensParams = {
  salaId: number;
  antesDe?: string;
  limite?: number;
};
