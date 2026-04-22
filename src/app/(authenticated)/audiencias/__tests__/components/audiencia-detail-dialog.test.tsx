/**
 * COMPONENT TESTS — AudienciaDetailDialog
 *
 * Cobre os invariantes do dialog:
 *   1. Edição inline atualiza o estado local sem fechar o dialog
 *   2. Audiências capturadas do PJe (idPje > 0) escondem botões de edição
 *      de modalidade, URL e endereço, e exibem banner informativo
 *   3. Modalidade alterna a visibilidade dos blocos Virtual / Presencial / Híbrida
 *   4. Hint visual "Obrigatório" aparece quando campo condicional está vazio
 */

/**
 * @jest-environment jest-environment-jsdom
 */

import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AudienciaDetailDialog } from '../../components/audiencia-detail-dialog';
import {
  ModalidadeAudiencia,
  PresencaHibrida,
  StatusAudiencia,
  GrauTribunal,
  type Audiencia,
} from '../../domain';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockAtualizarObservacoes = jest.fn();
const mockAtualizarUrlVirtual = jest.fn();
const mockAtualizarEnderecoPresencial = jest.fn();
const mockAtualizarAudienciaPayload = jest.fn();
const mockBuscarAudienciaPorId = jest.fn();

jest.mock('../../actions', () => ({
  actionAtualizarObservacoes: (...args: unknown[]) =>
    mockAtualizarObservacoes(...args),
  actionAtualizarUrlVirtual: (...args: unknown[]) =>
    mockAtualizarUrlVirtual(...args),
  actionAtualizarEnderecoPresencial: (...args: unknown[]) =>
    mockAtualizarEnderecoPresencial(...args),
  actionAtualizarAudienciaPayload: (...args: unknown[]) =>
    mockAtualizarAudienciaPayload(...args),
  actionBuscarAudienciaPorId: (...args: unknown[]) =>
    mockBuscarAudienciaPorId(...args),
}));

jest.mock('@/app/(authenticated)/usuarios', () => ({
  useUsuarios: () => ({ usuarios: [] }),
}));

jest.mock('@/providers/user-provider', () => ({
  usePermissoes: () => ({
    temPermissao: () => true,
    permissoes: [],
    isLoading: false,
  }),
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('../../components/audiencia-timeline', () => ({
  AudienciaTimeline: () => <div data-testid="audiencia-timeline" />,
}));

jest.mock('../../components/audiencia-indicador-badges', () => ({
  AudienciaIndicadorBadges: () => <div data-testid="indicador-badges" />,
}));

jest.mock('../../components/audiencia-status-badge', () => ({
  AudienciaStatusBadge: ({ status }: { status: string }) => (
    <span data-testid="status-badge">{status}</span>
  ),
}));

jest.mock('../../components/audiencia-responsavel-popover', () => ({
  AudienciaResponsavelPopover: ({ children }: { children: React.ReactNode }) => (
    <button type="button" data-testid="responsavel-popover">
      {children}
    </button>
  ),
  ResponsavelTriggerContent: () => <span>Responsável</span>,
}));

// Radix Dialog sem portal — renderiza content inline quando open
jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ open, children }: { open: boolean; children: React.ReactNode }) =>
    open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="dialog-content" className={className}>
      {children}
    </div>
  ),
  DialogTitle: ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) =>
    asChild ? <>{children}</> : <h2>{children}</h2>,
  DialogDescription: ({ children }: { children: React.ReactNode }) => (
    <span>{children}</span>
  ),
}));

jest.mock('@/components/ui/popover', () => ({
  Popover: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  PopoverTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  PopoverContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="popover-content">{children}</div>
  ),
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    onClick,
    disabled,
    ...rest
  }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button onClick={onClick} disabled={disabled} {...rest}>
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui/input', () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
}));

jest.mock('@/components/ui/textarea', () => ({
  Textarea: (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
    <textarea {...props} />
  ),
}));

jest.mock('@/components/ui/typography', () => ({
  Heading: ({ children, ...rest }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 {...rest}>{children}</h3>
  ),
  Text: ({ children, ...rest }: React.HTMLAttributes<HTMLSpanElement>) => (
    <span {...rest}>{children}</span>
  ),
}));

jest.mock('@/components/ui/loading-state', () => ({
  LoadingSpinner: () => <span data-testid="loading-spinner" />,
}));

jest.mock('lucide-react', () => new Proxy({}, { get: () => () => null }));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function audienciaFixture(overrides: Partial<Audiencia> = {}): Audiencia {
  return {
    id: 1,
    idPje: 0,
    advogadoId: 1,
    processoId: 100,
    orgaoJulgadorId: null,
    trt: 'TRT3',
    grau: GrauTribunal.PrimeiroGrau,
    numeroProcesso: '0010801-78.2024.5.03.0113',
    dataInicio: '2026-04-22T08:33:00Z',
    dataFim: '2026-04-22T09:03:00Z',
    horaInicio: null,
    horaFim: null,
    modalidade: ModalidadeAudiencia.Virtual,
    presencaHibrida: null,
    salaAudienciaNome: null,
    salaAudienciaId: null,
    status: StatusAudiencia.Marcada,
    statusDescricao: null,
    tipoAudienciaId: null,
    tipoDescricao: 'Conciliação em Execução',
    classeJudicialId: null,
    designada: true,
    emAndamento: false,
    documentoAtivo: true,
    segredoJustica: false,
    juizoDigital: true,
    poloAtivoNome: 'FABIO DE JESUS SOUZA SILVA',
    poloPassivoNome: 'HELIO MOISE RODRIGUES VIANA LTDA',
    poloAtivoRepresentaVarios: false,
    poloPassivoRepresentaVarios: false,
    urlAudienciaVirtual: 'https://trt3-jus-br.zoom.us/my/lilianec',
    enderecoPresencial: null,
    responsavelId: null,
    observacoes: null,
    dadosAnteriores: null,
    ataAudienciaId: null,
    urlAtaAudiencia: null,
    createdAt: '2026-04-01T00:00:00Z',
    updatedAt: '2026-04-01T00:00:00Z',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('AudienciaDetailDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('render básico', () => {
    it('exibe título com polo ativo × polo passivo', () => {
      render(
        <AudienciaDetailDialog
          audiencia={audienciaFixture()}
          open
          onOpenChange={() => {}}
        />
      );

      expect(screen.getByText(/FABIO DE JESUS SOUZA SILVA/)).toBeInTheDocument();
      expect(screen.getByText(/HELIO MOISE RODRIGUES VIANA LTDA/)).toBeInTheDocument();
      expect(screen.getByText(/Conciliação em Execução/)).toBeInTheDocument();
    });

    it('não renderiza nada quando open=false', () => {
      const { queryByTestId } = render(
        <AudienciaDetailDialog
          audiencia={audienciaFixture()}
          open={false}
          onOpenChange={() => {}}
        />
      );
      expect(queryByTestId('dialog')).not.toBeInTheDocument();
    });
  });

  describe('edição inline de observações', () => {
    it('mantém o dialog aberto após salvar e atualiza o texto exibido', async () => {
      const user = userEvent.setup();
      const onOpenChange = jest.fn();
      const audienciaAtualizada = audienciaFixture({
        observacoes: 'Nova anotação',
      });
      mockAtualizarObservacoes.mockResolvedValue({
        success: true,
        data: audienciaAtualizada,
      });

      render(
        <AudienciaDetailDialog
          audiencia={audienciaFixture()}
          open
          onOpenChange={onOpenChange}
        />
      );

      await user.click(screen.getByText('Adicionar'));
      const textarea = screen.getByPlaceholderText(/Anotações sobre a audiência/i);
      await user.type(textarea, 'Nova anotação');
      await user.click(screen.getByRole('button', { name: 'Salvar' }));

      // Dialog continua aberto: onOpenChange nunca foi chamado com false
      expect(onOpenChange).not.toHaveBeenCalled();
      expect(mockAtualizarObservacoes).toHaveBeenCalledWith(1, 'Nova anotação');

      // Novo texto aparece em read-mode
      expect(await screen.findByText('Nova anotação')).toBeInTheDocument();
    });

    it('mantém o dialog aberto ao falhar o save', async () => {
      const user = userEvent.setup();
      const onOpenChange = jest.fn();
      mockAtualizarObservacoes.mockResolvedValue({
        success: false,
        error: 'rede caiu',
      });

      render(
        <AudienciaDetailDialog
          audiencia={audienciaFixture({
            observacoes: 'existente',
            // remove URL para só haver um botão "Editar" (o de observações)
            modalidade: ModalidadeAudiencia.Presencial,
            urlAudienciaVirtual: null,
            enderecoPresencial: null,
          })}
          open
          onOpenChange={onOpenChange}
        />
      );

      await user.click(screen.getByText('Editar'));
      await user.click(screen.getByRole('button', { name: 'Salvar' }));

      expect(onOpenChange).not.toHaveBeenCalled();
    });
  });

  describe('modalidade alterna blocos condicionais', () => {
    it('Virtual: mostra link da sala, esconde endereço e presença híbrida', () => {
      render(
        <AudienciaDetailDialog
          audiencia={audienciaFixture({ modalidade: ModalidadeAudiencia.Virtual })}
          open
          onOpenChange={() => {}}
        />
      );
      expect(screen.getByText('Link da sala virtual')).toBeInTheDocument();
      expect(screen.queryByText('Endereço presencial')).not.toBeInTheDocument();
      expect(
        screen.queryByText(/Quem participa presencialmente/)
      ).not.toBeInTheDocument();
    });

    it('Presencial: mostra endereço, esconde link e presença híbrida', () => {
      render(
        <AudienciaDetailDialog
          audiencia={audienciaFixture({
            modalidade: ModalidadeAudiencia.Presencial,
            urlAudienciaVirtual: null,
          })}
          open
          onOpenChange={() => {}}
        />
      );
      expect(screen.getByText('Endereço presencial')).toBeInTheDocument();
      expect(screen.queryByText('Link da sala virtual')).not.toBeInTheDocument();
      expect(
        screen.queryByText(/Quem participa presencialmente/)
      ).not.toBeInTheDocument();
    });

    it('Híbrida: mostra link, endereço e toggle de presença', () => {
      render(
        <AudienciaDetailDialog
          audiencia={audienciaFixture({
            modalidade: ModalidadeAudiencia.Hibrida,
            presencaHibrida: PresencaHibrida.Advogado,
          })}
          open
          onOpenChange={() => {}}
        />
      );
      expect(screen.getByText('Link da sala virtual')).toBeInTheDocument();
      expect(screen.getByText('Endereço presencial')).toBeInTheDocument();
      expect(
        screen.getByText(/Quem participa presencialmente/)
      ).toBeInTheDocument();
    });
  });

  describe('hint visual "Obrigatório" por modalidade', () => {
    it('Virtual sem URL: badge Obrigatório aparece', () => {
      render(
        <AudienciaDetailDialog
          audiencia={audienciaFixture({
            modalidade: ModalidadeAudiencia.Virtual,
            urlAudienciaVirtual: null,
          })}
          open
          onOpenChange={() => {}}
        />
      );
      expect(screen.getByText('Obrigatório')).toBeInTheDocument();
    });

    it('Presencial sem endereço: badge Obrigatório aparece', () => {
      render(
        <AudienciaDetailDialog
          audiencia={audienciaFixture({
            modalidade: ModalidadeAudiencia.Presencial,
            urlAudienciaVirtual: null,
            enderecoPresencial: null,
          })}
          open
          onOpenChange={() => {}}
        />
      );
      expect(screen.getByText('Obrigatório')).toBeInTheDocument();
    });

    it('Híbrida com os dois vazios: badge aparece duas vezes', () => {
      render(
        <AudienciaDetailDialog
          audiencia={audienciaFixture({
            modalidade: ModalidadeAudiencia.Hibrida,
            urlAudienciaVirtual: null,
            enderecoPresencial: null,
          })}
          open
          onOpenChange={() => {}}
        />
      );
      expect(screen.getAllByText('Obrigatório')).toHaveLength(2);
    });

    it('Virtual com URL preenchida: badge não aparece', () => {
      render(
        <AudienciaDetailDialog
          audiencia={audienciaFixture({
            modalidade: ModalidadeAudiencia.Virtual,
            urlAudienciaVirtual: 'https://sala.com/x',
          })}
          open
          onOpenChange={() => {}}
        />
      );
      expect(screen.queryByText('Obrigatório')).not.toBeInTheDocument();
    });
  });

  describe('audiência capturada do PJe (idPje > 0)', () => {
    const pjeAudiencia = audienciaFixture({
      idPje: 9999,
      modalidade: ModalidadeAudiencia.Virtual,
    });

    it('exibe banner "Sincronizada do PJe"', () => {
      render(
        <AudienciaDetailDialog
          audiencia={pjeAudiencia}
          open
          onOpenChange={() => {}}
        />
      );
      expect(screen.getByText(/Sincronizada do PJe/i)).toBeInTheDocument();
    });

    it('esconde botão Editar do link virtual', () => {
      render(
        <AudienciaDetailDialog
          audiencia={pjeAudiencia}
          open
          onOpenChange={() => {}}
        />
      );
      // Há vários "Editar" no fluxo manual — em PJe apenas Observações permanece editável.
      // Verificamos via escopo da seção Link da sala virtual: não deve ter Editar/Adicionar.
      const linkSection = screen
        .getByText('Link da sala virtual')
        .closest('div');
      expect(linkSection).not.toBeNull();
      if (linkSection) {
        expect(linkSection.querySelector('button')).toBeNull();
      }
    });

    it('não exibe badge Obrigatório mesmo com URL vazia (fonte de verdade é PJe)', () => {
      render(
        <AudienciaDetailDialog
          audiencia={audienciaFixture({
            idPje: 9999,
            modalidade: ModalidadeAudiencia.Virtual,
            urlAudienciaVirtual: null,
          })}
          open
          onOpenChange={() => {}}
        />
      );
      expect(screen.queryByText('Obrigatório')).not.toBeInTheDocument();
    });

    it('edição de observações continua permitida em PJe (whitelist)', async () => {
      const user = userEvent.setup();
      mockAtualizarObservacoes.mockResolvedValue({
        success: true,
        data: { ...pjeAudiencia, observacoes: 'Nota' },
      });

      render(
        <AudienciaDetailDialog
          audiencia={pjeAudiencia}
          open
          onOpenChange={() => {}}
        />
      );

      await user.click(screen.getByText('Adicionar'));
      const textarea = screen.getByPlaceholderText(/Anotações sobre a audiência/i);
      await user.type(textarea, 'Nota');
      await user.click(screen.getByRole('button', { name: 'Salvar' }));

      // action recebe audiencia.id (PK do registro), não idPje
      expect(mockAtualizarObservacoes).toHaveBeenCalledWith(1, 'Nota');
    });
  });
});
