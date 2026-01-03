// @ts-nocheck
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AudienciasContent } from '../audiencias-content';
import { useAudiencias, useTiposAudiencias } from '@/features/audiencias';
import { useUsuarios } from '@/features/usuarios';
// Import enum diretamente do domain para evitar problemas de mock
import { ModalidadeAudiencia, StatusAudiencia, GrauTribunal } from '@/features/audiencias/domain';
import type { Audiencia } from '@/features/audiencias/domain';

// Mock apenas os hooks, não o módulo inteiro
jest.mock('@/features/audiencias', () => ({
  ...jest.requireActual('@/features/audiencias'),
  useAudiencias: jest.fn(),
  useTiposAudiencias: jest.fn(),
}));

jest.mock('@/features/usuarios');

const mockAudiencias: Audiencia[] = [
  {
    id: 1,
    idPje: null,
    advogadoId: null,
    processoId: 100,
    orgaoJulgadorId: null,
    trt: 'TRT1',
    grau: GrauTribunal.PrimeiroGrau,
    numeroProcesso: '0001234-56.2023.5.01.0001',
    dataInicio: '2025-03-15T10:00:00.000Z',
    dataFim: '2025-03-15T11:00:00.000Z',
    horaInicio: '10:00:00',
    horaFim: '11:00:00',
    modalidade: ModalidadeAudiencia.Virtual,
    presencaHibrida: null,
    salaAudienciaNome: 'Sala Virtual 1',
    salaAudienciaId: null,
    status: StatusAudiencia.Marcada,
    statusDescricao: null,
    tipoAudienciaId: 1,
    tipoDescricao: 'Inicial',
    classeJudicialId: null,
    designada: true,
    emAndamento: false,
    documentoAtivo: false,
    poloAtivoNome: 'Cliente Teste',
    poloPassivoNome: 'Reclamada Teste',
    urlAudienciaVirtual: 'https://zoom.us/j/1234567890',
    enderecoPresencial: null,
    responsavelId: null,
    observacoes: 'Observações de teste',
    dadosAnteriores: null,
    createdAt: '2025-03-10T09:00:00.000Z',
    updatedAt: '2025-03-10T09:00:00.000Z',
  },
];

const mockTiposAudiencia = [{ id: 1, descricao: 'Inicial' }];
const mockUsuarios = [{ id: 1, nome: 'João da Silva' }];

describe('AudienciasContent', () => {
  beforeEach(() => {
    (useAudiencias as jest.Mock).mockReturnValue({
      audiencias: mockAudiencias,
      paginacao: { currentPage: 1, pageSize: 10, totalCount: 1, totalPages: 1 },
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });
    (useTiposAudiencias as jest.Mock).mockReturnValue({
      tiposAudiencia: mockTiposAudiencia,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });
    (useUsuarios as jest.Mock).mockReturnValue({
      usuarios: mockUsuarios,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });
  });

  it('renders correctly with initial view "lista"', async () => {
    render(<AudienciasContent visualizacao="lista" />);

    expect(screen.getByText('Audiências')).toBeInTheDocument();
    expect(screen.getByText('Criar Audiência')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Buscar...')).toBeInTheDocument();
    expect(screen.getByText('Lista')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('0001234-56.2023.5.01.0001')).toBeInTheDocument();
      expect(screen.getByText('Virtual')).toBeInTheDocument();
    });
  });

  it('switches between views', async () => {
    render(<AudienciasContent visualizacao="lista" />);
    const user = userEvent.setup();

    // Switch to Semana view
    await user.click(screen.getByRole('tab', { name: /semana/i }));
    expect(screen.getByRole('button', { name: /anterior/i })).toBeInTheDocument();
    expect(screen.getByText(/Semana/i)).toBeInTheDocument();

    // Switch to Mês view
    await user.click(screen.getByRole('tab', { name: /mês/i }));
    expect(screen.getByText(/Mês/i)).toBeInTheDocument();

    // Switch to Ano view
    await user.click(screen.getByRole('tab', { name: /ano/i }));
    expect(screen.getByText(/Ano/i)).toBeInTheDocument();

    // Switch back to Lista view
    await user.click(screen.getByRole('tab', { name: /lista/i }));
    await waitFor(() => {
      expect(screen.getByText('0001234-56.2023.5.01.0001')).toBeInTheDocument();
    });
  });

  it('filters audiencias by search input', async () => {
    const refetchMock = jest.fn();
    (useAudiencias as jest.Mock).mockReturnValue({
      audiencias: mockAudiencias,
      paginacao: { currentPage: 1, pageSize: 10, totalCount: 1, totalPages: 1 },
      isLoading: false,
      error: null,
      refetch: refetchMock,
    });

    render(<AudienciasContent visualizacao="lista" />);
    const user = userEvent.setup();

    const searchInput = screen.getByPlaceholderText('Buscar...');
    await user.type(searchInput, '0001234');

    await waitFor(() => expect(refetchMock).toHaveBeenCalled());
    // Further assertions would depend on how the mock hook reacts to input changes
    // For now, just checking if refetch is called.
  });

  it('displays loading state', () => {
    (useAudiencias as jest.Mock).mockReturnValue({
      audiencias: [],
      paginacao: null,
      isLoading: true,
      error: null,
      refetch: jest.fn(),
    });

    render(<AudienciasContent visualizacao="lista" />);
    expect(screen.getByText('Carregando audiências...')).toBeInTheDocument();
  });

  it('displays error state', () => {
    (useAudiencias as jest.Mock).mockReturnValue({
      audiencias: [],
      paginacao: null,
      isLoading: false,
      error: 'Failed to load',
      refetch: jest.fn(),
    });

    render(<AudienciasContent visualizacao="lista" />);
    expect(screen.getByText(/Erro ao carregar audiências: Failed to load/i)).toBeInTheDocument();
  });

  it('handles date navigation in week view', async () => {
    const refetchMock = jest.fn();
    (useAudiencias as jest.Mock).mockReturnValue({
      audiencias: [],
      paginacao: null,
      isLoading: false,
      error: null,
      refetch: refetchMock,
    });
    render(<AudienciasContent visualizacao="semana" />);
    const user = userEvent.setup();

    const nextButton = screen.getByRole('button', { name: /próximo/i });
    await user.click(nextButton);
    // Expect the date to change, leading to refetch being called with updated params
    await waitFor(() => expect(refetchMock).toHaveBeenCalled());
  });
});
