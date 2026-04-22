/**
 * Testes das Server Actions de Audiências
 *
 * Cobre o contrato de autorização granular: cada action exige
 * authenticateRequest() + checkPermission(recurso, operacao).
 *
 * Para actionAtualizarAudienciaPayload e actionAtualizarAudiencia,
 * a permissão é resolvida dinamicamente conforme o payload (atribuir vs
 * transferir vs desatribuir responsável; editar_url_virtual vs editar).
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// ─── Mocks de infra ────────────────────────────────────────────────────────

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  })),
}));

const mockUser = {
  id: 42,
  nomeCompleto: 'Teste Audiências',
  emailCorporativo: 'teste@zattar.com',
};

jest.mock('@/lib/auth/session', () => ({
  authenticateRequest: jest.fn(async () => mockUser),
}));

jest.mock('@/lib/auth/authorization', () => ({
  checkPermission: jest.fn(async () => true),
}));

jest.mock('../../service', () => ({
  criarAudiencia: jest.fn(),
  buscarAudiencia: jest.fn(),
  listarAudiencias: jest.fn(),
  atualizarAudiencia: jest.fn(),
  atualizarStatusAudiencia: jest.fn(),
  atualizarObservacoesAudiencia: jest.fn(),
  atualizarUrlVirtualAudiencia: jest.fn(),
  atualizarEnderecoPresencialAudiencia: jest.fn(),
}));

import { authenticateRequest as getCurrentUser } from '@/lib/auth/session';
import { checkPermission } from '@/lib/auth/authorization';
import * as service from '../../service';

import {
  actionListarAudiencias,
  actionBuscarAudienciaPorId,
  actionAtualizarUrlVirtual,
  actionAtualizarObservacoes,
  actionAtualizarEnderecoPresencial,
  actionAtualizarStatusAudiencia,
  actionAtualizarAudienciaPayload,
  actionCriarAudienciaPayload,
} from '../../actions/audiencias-actions';

import { ModalidadeAudiencia, StatusAudiencia } from '../../domain';

// ─── Fixtures ──────────────────────────────────────────────────────────────

const baseAudiencia = {
  id: 1,
  idPje: 0,
  processoId: 100,
  numeroProcesso: '0001234-56.2024.5.02.0001',
  trt: 'TRT2',
  grau: 'PRIMEIRO_GRAU',
  dataInicio: '2026-05-10T14:00:00Z',
  dataFim: '2026-05-10T15:00:00Z',
  status: StatusAudiencia.Agendada,
  modalidade: ModalidadeAudiencia.Virtual,
  responsavelId: null as number | null,
  urlAudienciaVirtual: null as string | null,
  observacoes: null as string | null,
  enderecoPresencial: null,
  createdAt: '2026-04-01T00:00:00Z',
  updatedAt: '2026-04-01T00:00:00Z',
} as unknown as Parameters<typeof service.atualizarAudiencia>[1] & { id: number; responsavelId: number | null; urlAudienciaVirtual: string | null };

const okResult = <T>(data: T) => ({ success: true as const, data });
const okListResult = {
  success: true as const,
  data: { audiencias: [baseAudiencia], total: 1, pagina: 1, limite: 100, totalPaginas: 1 },
};

beforeEach(() => {
  jest.clearAllMocks();
  (getCurrentUser as jest.Mock).mockResolvedValue(mockUser);
  (checkPermission as jest.Mock).mockResolvedValue(true);
});

// ─── Casos comuns: não-autenticado ──────────────────────────────────────────

describe('Audiências actions — autenticação', () => {
  it('actionListarAudiencias retorna "Não autenticado" se sem user', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValueOnce(null);
    const r = await actionListarAudiencias({});
    expect(r.success).toBe(false);
    expect((r as { error: string }).error).toBe('Não autenticado');
  });

  it('actionAtualizarUrlVirtual retorna "Não autenticado" se sem user', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValueOnce(null);
    const r = await actionAtualizarUrlVirtual(1, 'https://meet.example.com/x');
    expect(r.success).toBe(false);
    expect((r as { error: string }).error).toBe('Não autenticado');
  });
});

// ─── Permissões granulares estáticas ────────────────────────────────────────

describe('Audiências actions — permissões granulares estáticas', () => {
  it('actionListarAudiencias exige audiencias.listar', async () => {
    (service.listarAudiencias as jest.Mock).mockResolvedValueOnce(okListResult);
    await actionListarAudiencias({});
    expect(checkPermission).toHaveBeenCalledWith(mockUser.id, 'audiencias', 'listar');
  });

  it('actionBuscarAudienciaPorId exige audiencias.visualizar', async () => {
    (service.buscarAudiencia as jest.Mock).mockResolvedValueOnce(okResult(baseAudiencia));
    await actionBuscarAudienciaPorId(1);
    expect(checkPermission).toHaveBeenCalledWith(mockUser.id, 'audiencias', 'visualizar');
  });

  it('actionAtualizarUrlVirtual exige audiencias.editar_url_virtual', async () => {
    (service.atualizarUrlVirtualAudiencia as jest.Mock).mockResolvedValueOnce(okResult(baseAudiencia));
    await actionAtualizarUrlVirtual(1, 'https://meet.example.com/sala');
    expect(checkPermission).toHaveBeenCalledWith(mockUser.id, 'audiencias', 'editar_url_virtual');
  });

  it('actionAtualizarObservacoes exige audiencias.editar', async () => {
    (service.atualizarObservacoesAudiencia as jest.Mock).mockResolvedValueOnce(okResult(baseAudiencia));
    await actionAtualizarObservacoes(1, 'qualquer obs');
    expect(checkPermission).toHaveBeenCalledWith(mockUser.id, 'audiencias', 'editar');
  });

  it('actionAtualizarEnderecoPresencial exige audiencias.editar', async () => {
    (service.atualizarEnderecoPresencialAudiencia as jest.Mock).mockResolvedValueOnce(okResult(baseAudiencia));
    await actionAtualizarEnderecoPresencial(1, null);
    expect(checkPermission).toHaveBeenCalledWith(mockUser.id, 'audiencias', 'editar');
  });

  it('actionAtualizarStatusAudiencia exige audiencias.editar', async () => {
    (service.atualizarStatusAudiencia as jest.Mock).mockResolvedValueOnce(okResult(baseAudiencia));
    await actionAtualizarStatusAudiencia(1, StatusAudiencia.Cancelada);
    expect(checkPermission).toHaveBeenCalledWith(mockUser.id, 'audiencias', 'editar');
  });

  it('actionCriarAudienciaPayload exige audiencias.editar', async () => {
    (service.criarAudiencia as jest.Mock).mockResolvedValueOnce(okResult(baseAudiencia));
    const payload = {
      processoId: 100,
      dataInicio: '2026-05-10T14:00:00Z',
      dataFim: '2026-05-10T15:00:00Z',
      modalidade: ModalidadeAudiencia.Virtual,
      urlAudienciaVirtual: 'https://meet.example.com/x',
    };
    await actionCriarAudienciaPayload(payload);
    expect(checkPermission).toHaveBeenCalledWith(mockUser.id, 'audiencias', 'editar');
  });

  it('quando checkPermission retorna false, action retorna "Sem permissão"', async () => {
    (checkPermission as jest.Mock).mockResolvedValueOnce(false);
    const r = await actionAtualizarUrlVirtual(1, 'https://meet.example.com/x');
    expect(r.success).toBe(false);
    expect((r as { error: string }).error).toContain('Sem permissão');
    expect((r as { error: string }).error).toContain('editar_url_virtual');
  });
});

// ─── Permissões dinâmicas do payload ────────────────────────────────────────

describe('actionAtualizarAudienciaPayload — resolução dinâmica de permissão', () => {
  beforeEach(() => {
    (service.atualizarAudiencia as jest.Mock).mockResolvedValue(okResult(baseAudiencia));
  });

  it('responsavelId null → numérico exige audiencias.atribuir_responsavel', async () => {
    (service.buscarAudiencia as jest.Mock).mockResolvedValueOnce(
      okResult({ ...baseAudiencia, responsavelId: null }),
    );

    await actionAtualizarAudienciaPayload(1, { responsavelId: 99 });

    expect(checkPermission).toHaveBeenCalledWith(mockUser.id, 'audiencias', 'atribuir_responsavel');
    expect(checkPermission).not.toHaveBeenCalledWith(mockUser.id, 'audiencias', 'transferir_responsavel');
    expect(checkPermission).not.toHaveBeenCalledWith(mockUser.id, 'audiencias', 'desatribuir_responsavel');
  });

  it('responsavelId numérico → null exige audiencias.desatribuir_responsavel', async () => {
    (service.buscarAudiencia as jest.Mock).mockResolvedValueOnce(
      okResult({ ...baseAudiencia, responsavelId: 99 }),
    );

    await actionAtualizarAudienciaPayload(1, { responsavelId: null });

    expect(checkPermission).toHaveBeenCalledWith(mockUser.id, 'audiencias', 'desatribuir_responsavel');
    expect(checkPermission).not.toHaveBeenCalledWith(mockUser.id, 'audiencias', 'atribuir_responsavel');
  });

  it('responsavelId numérico → outro numérico exige audiencias.transferir_responsavel', async () => {
    (service.buscarAudiencia as jest.Mock).mockResolvedValueOnce(
      okResult({ ...baseAudiencia, responsavelId: 99 }),
    );

    await actionAtualizarAudienciaPayload(1, { responsavelId: 100 });

    expect(checkPermission).toHaveBeenCalledWith(mockUser.id, 'audiencias', 'transferir_responsavel');
  });

  it('responsavelId mantém igual: NÃO chama checkPermission para responsavel', async () => {
    (service.buscarAudiencia as jest.Mock).mockResolvedValueOnce(
      okResult({ ...baseAudiencia, responsavelId: 99 }),
    );

    await actionAtualizarAudienciaPayload(1, { responsavelId: 99 });

    expect(checkPermission).not.toHaveBeenCalledWith(mockUser.id, 'audiencias', 'atribuir_responsavel');
    expect(checkPermission).not.toHaveBeenCalledWith(mockUser.id, 'audiencias', 'transferir_responsavel');
    expect(checkPermission).not.toHaveBeenCalledWith(mockUser.id, 'audiencias', 'desatribuir_responsavel');
  });

  it('alterar urlAudienciaVirtual exige audiencias.editar_url_virtual (não editar genérico)', async () => {
    (service.buscarAudiencia as jest.Mock).mockResolvedValueOnce(
      okResult({ ...baseAudiencia, urlAudienciaVirtual: 'https://old.example.com' }),
    );

    await actionAtualizarAudienciaPayload(1, { urlAudienciaVirtual: 'https://new.example.com' });

    expect(checkPermission).toHaveBeenCalledWith(mockUser.id, 'audiencias', 'editar_url_virtual');
    expect(checkPermission).not.toHaveBeenCalledWith(mockUser.id, 'audiencias', 'editar');
  });

  it('alterar campo genérico (modalidade) exige audiencias.editar', async () => {
    (service.buscarAudiencia as jest.Mock).mockResolvedValueOnce(okResult(baseAudiencia));

    await actionAtualizarAudienciaPayload(1, { modalidade: ModalidadeAudiencia.Presencial });

    expect(checkPermission).toHaveBeenCalledWith(mockUser.id, 'audiencias', 'editar');
  });

  it('payload combinado (responsavelId + URL + obs) exige todas as ops', async () => {
    (service.buscarAudiencia as jest.Mock).mockResolvedValueOnce(
      okResult({ ...baseAudiencia, responsavelId: null, urlAudienciaVirtual: null }),
    );

    await actionAtualizarAudienciaPayload(1, {
      responsavelId: 50,
      urlAudienciaVirtual: 'https://meet.example.com/y',
      observacoes: 'mudou tudo',
    });

    expect(checkPermission).toHaveBeenCalledWith(mockUser.id, 'audiencias', 'atribuir_responsavel');
    expect(checkPermission).toHaveBeenCalledWith(mockUser.id, 'audiencias', 'editar_url_virtual');
    expect(checkPermission).toHaveBeenCalledWith(mockUser.id, 'audiencias', 'editar');
  });

  it('falha se uma das permissões dinâmicas estiver ausente', async () => {
    (service.buscarAudiencia as jest.Mock).mockResolvedValueOnce(
      okResult({ ...baseAudiencia, urlAudienciaVirtual: null }),
    );
    (checkPermission as jest.Mock).mockImplementation(async (_id, _r, op) => op !== 'editar_url_virtual');

    const r = await actionAtualizarAudienciaPayload(1, {
      urlAudienciaVirtual: 'https://meet.example.com/x',
    });

    expect(r.success).toBe(false);
    expect((r as { error: string }).error).toContain('editar_url_virtual');
    expect(service.atualizarAudiencia).not.toHaveBeenCalled();
  });

  it('retorna NOT_FOUND se audiência atual não existe', async () => {
    (service.buscarAudiencia as jest.Mock).mockResolvedValueOnce({ success: true, data: null });

    const r = await actionAtualizarAudienciaPayload(999, { observacoes: 'x' });

    expect(r.success).toBe(false);
    expect((r as { error: string }).error).toContain('não encontrada');
    expect(service.atualizarAudiencia).not.toHaveBeenCalled();
  });
});
