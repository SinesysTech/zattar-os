/**
 * COMPONENT TESTS — ExpedienteDialog (criação de novo expediente)
 *
 * Cobre os bugs historicamente encontrados:
 *   1. `/api/usuarios` não existe → deve usar Server Action actionListarUsuarios
 *   2. `numeroProcesso` é obrigatório no schema mas o form não enviava
 *   3. `dataPrazoLegalParte` precisa ser construído a partir de data + hora
 *   4. Submit não deve ser habilitado sem prazo completo + descrição
 */

/**
 * @jest-environment jest-environment-jsdom
 */

import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExpedienteDialog } from '../../components/expediente-dialog';
import { GrauTribunal } from '../../domain';

// ---------------------------------------------------------------------------
// Mocks de server actions
// ---------------------------------------------------------------------------
const mockActionCriarExpediente = jest.fn();
jest.mock('../../actions', () => ({
  actionCriarExpediente: (
    prev: unknown,
    formData: FormData,
  ) => mockActionCriarExpediente(prev, formData),
}));

const mockActionListarUsuarios = jest.fn();
jest.mock('@/app/(authenticated)/usuarios', () => ({
  actionListarUsuarios: (...args: unknown[]) =>
    mockActionListarUsuarios(...args),
}));

const mockActionListarTiposExpedientes = jest.fn();
jest.mock('@/app/(authenticated)/tipos-expedientes', () => ({
  actionListarTiposExpedientes: (...args: unknown[]) =>
    mockActionListarTiposExpedientes(...args),
}));

const mockActionListarAcervoPaginado = jest.fn();
jest.mock('@/app/(authenticated)/acervo', () => ({
  actionListarAcervoPaginado: (...args: unknown[]) =>
    mockActionListarAcervoPaginado(...args),
}));

// Silence toast
jest.mock('sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

// ---------------------------------------------------------------------------
// Lightweight UI mocks (avoid Radix portals + async animations)
// ---------------------------------------------------------------------------

jest.mock('@/components/shared/dialog-shell', () => ({
  DialogFormShell: ({
    open,
    children,
    footer,
    title,
  }: {
    open: boolean;
    children: React.ReactNode;
    footer: React.ReactNode;
    title: string;
  }) =>
    open ? (
      <div data-testid="dialog" role="dialog" aria-label={title}>
        <h2>{title}</h2>
        {children}
        <div data-testid="dialog-footer">{footer}</div>
      </div>
    ) : null,
  DialogSection: ({
    title,
    children,
  }: {
    title?: React.ReactNode;
    children?: React.ReactNode;
  }) => (
    <section data-testid="dialog-section">
      {title && <h3>{title}</h3>}
      {children}
    </section>
  ),
}));

jest.mock('@/components/shared/glass-panel', () => ({
  GlassPanel: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => <div className={className}>{children}</div>,
}));

jest.mock('@/components/ui/select', () => ({
  Select: ({
    value,
    onValueChange,
    children,
    disabled,
  }: {
    value: string;
    onValueChange: (v: string) => void;
    children: React.ReactNode;
    disabled?: boolean;
  }) => (
    <select
      data-testid="select"
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
      disabled={disabled}
    >
      <option value="">(empty)</option>
      {children}
    </select>
  ),
  SelectContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SelectItem: ({
    value,
    children,
  }: {
    value: string;
    children: React.ReactNode;
  }) => <option value={value}>{children}</option>,
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SelectValue: () => null,
}));

jest.mock('@/components/ui/combobox', () => ({
  Combobox: ({
    options,
    value,
    onValueChange,
    placeholder,
    disabled,
  }: {
    options: Array<{ value: string; label: string }>;
    value: string[];
    onValueChange: (values: string[]) => void;
    placeholder?: string;
    disabled?: boolean;
  }) => (
    <select
      data-testid="combobox"
      aria-label={placeholder}
      value={value[0] || ''}
      onChange={(e) =>
        onValueChange(e.target.value ? [e.target.value] : [])
      }
      disabled={disabled}
    >
      <option value="">(empty)</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  ),
}));

jest.mock('@/components/ui/form-date-picker', () => ({
  FormDatePicker: ({
    id,
    value,
    onChange,
  }: {
    id?: string;
    value?: string;
    onChange: (v: string | undefined) => void;
  }) => (
    <input
      id={id}
      data-testid="form-date-picker"
      type="date"
      value={value || ''}
      onChange={(e) => onChange(e.target.value || undefined)}
    />
  ),
}));

jest.mock('@/components/ui/label', () => ({
  Label: ({
    children,
    ...rest
  }: React.LabelHTMLAttributes<HTMLLabelElement>) => (
    <label {...rest}>{children}</label>
  ),
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    ...rest
  }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...rest}>{children}</button>
  ),
}));

jest.mock('@/components/ui/input', () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input {...props} />
  ),
}));

jest.mock('@/components/ui/textarea', () => ({
  Textarea: (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
    <textarea {...props} />
  ),
}));

jest.mock('@/components/ui/typography', () => ({
  Heading: ({
    children,
    ...rest
  }: React.HTMLAttributes<HTMLHeadingElement>) => <h3 {...rest}>{children}</h3>,
  Text: ({
    children,
    as: Tag = 'span',
    ...rest
  }: React.HTMLAttributes<HTMLElement> & {
    as?: React.ElementType;
    variant?: string;
  }) => <Tag {...rest}>{children}</Tag>,
}));

jest.mock('@/components/ui/loading-state', () => ({
  LoadingSpinner: () => <span data-testid="loading-spinner" />,
}));

jest.mock('@/components/ui/alert', () => ({
  Alert: ({ children }: { children: React.ReactNode }) => (
    <div role="alert">{children}</div>
  ),
  AlertDescription: ({ children }: { children: React.ReactNode }) => (
    <p>{children}</p>
  ),
}));

jest.mock('lucide-react', () => new Proxy({}, { get: () => () => null }));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const dadosIniciais = {
  processoId: 42,
  trt: 'TRT1' as const,
  grau: GrauTribunal.PRIMEIRO_GRAU,
  numeroProcesso: '0001234-56.2025.5.01.0001',
  nomeParteAutora: 'José da Silva',
  nomeParteRe: 'Empresa ACME',
};

const usuariosFixture = [
  { id: 1, nomeExibicao: 'Dra. Carolina' },
  { id: 2, nomeExibicao: 'Dr. Rafael' },
];

const tiposFixture = [
  { id: 10, tipoExpediente: 'Intimação' },
  { id: 11, tipoExpediente: 'Citação' },
];

function setupMocks(
  overrides: {
    usuariosSuccess?: boolean;
    tiposSuccess?: boolean;
  } = {},
) {
  const { usuariosSuccess = true, tiposSuccess = true } = overrides;

  mockActionListarUsuarios.mockResolvedValue(
    usuariosSuccess
      ? { success: true, data: { usuarios: usuariosFixture } }
      : { success: false, error: 'Falha de permissão' },
  );

  mockActionListarTiposExpedientes.mockResolvedValue(
    tiposSuccess
      ? { success: true, data: { data: tiposFixture } }
      : { success: false, error: 'Falha ao listar' },
  );

  mockActionListarAcervoPaginado.mockResolvedValue({
    success: true,
    data: { processos: [] },
  });

  mockActionCriarExpediente.mockResolvedValue({
    success: true,
    data: { id: 99 },
    message: 'Expediente criado com sucesso',
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('ExpedienteDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupMocks();
  });

  it('carrega usuários via actionListarUsuarios (Server Action), não via fetch /api/usuarios', async () => {
    render(
      <ExpedienteDialog
        open
        onOpenChange={jest.fn()}
        onSuccess={jest.fn()}
        dadosIniciais={dadosIniciais}
      />,
    );

    await waitFor(() => {
      expect(mockActionListarUsuarios).toHaveBeenCalledWith({
        ativo: true,
        limite: 1000,
      });
    });
    expect(mockActionListarTiposExpedientes).toHaveBeenCalledWith({
      limite: 100,
    });
  });

  it('renderiza processo vinculado quando dadosIniciais é fornecido', async () => {
    render(
      <ExpedienteDialog
        open
        onOpenChange={jest.fn()}
        onSuccess={jest.fn()}
        dadosIniciais={dadosIniciais}
      />,
    );

    await waitFor(() => {
      expect(
        screen.getByText('0001234-56.2025.5.01.0001'),
      ).toBeInTheDocument();
    });
    expect(screen.getByText('José da Silva')).toBeInTheDocument();
    expect(screen.getByText('Empresa ACME')).toBeInTheDocument();
  });

  it('desabilita o submit enquanto descrição ou prazo não estiverem completos', async () => {
    const user = userEvent.setup();
    render(
      <ExpedienteDialog
        open
        onOpenChange={jest.fn()}
        onSuccess={jest.fn()}
        dadosIniciais={dadosIniciais}
      />,
    );

    const submit = await screen.findByRole('button', {
      name: /criar expediente/i,
    });
    expect(submit).toBeDisabled();

    // Apenas descrição → ainda desabilitado
    const descricao = screen.getByLabelText(/descrição/i);
    await user.type(descricao, 'Intimar para audiência');
    expect(submit).toBeDisabled();

    // + data → ainda desabilitado
    const data = screen.getByTestId('form-date-picker');
    await user.type(data, '2026-05-10');
    expect(submit).toBeDisabled();

    // + hora → deve habilitar
    const hora = screen.getByLabelText(/hora/i);
    await user.type(hora, '14:30');
    expect(submit).not.toBeDisabled();
  });

  it('envia numeroProcesso derivado do processo selecionado ao submeter (regressão crítica)', async () => {
    const user = userEvent.setup();
    const onSuccess = jest.fn();
    const onOpenChange = jest.fn();

    render(
      <ExpedienteDialog
        open
        onOpenChange={onOpenChange}
        onSuccess={onSuccess}
        dadosIniciais={dadosIniciais}
      />,
    );

    await user.type(
      screen.getByLabelText(/descrição/i),
      'Intimação para audiência',
    );
    await user.type(screen.getByTestId('form-date-picker'), '2026-05-10');
    await user.type(screen.getByLabelText(/hora/i), '14:30');

    await user.click(
      screen.getByRole('button', { name: /criar expediente/i }),
    );

    await waitFor(() => {
      expect(mockActionCriarExpediente).toHaveBeenCalled();
    });

    const [, formData] = mockActionCriarExpediente.mock.calls[0] as [
      unknown,
      FormData,
    ];

    // Bug histórico: numeroProcesso não era enviado e o schema rejeitava
    expect(formData.get('numeroProcesso')).toBe(
      '0001234-56.2025.5.01.0001',
    );
    expect(formData.get('trt')).toBe('TRT1');
    expect(formData.get('grau')).toBe(GrauTribunal.PRIMEIRO_GRAU);
    expect(formData.get('processoId')).toBe('42');
    expect(formData.get('origem')).toBe('manual');
    expect(formData.get('descricao')).toBe('Intimação para audiência');
    expect(formData.get('dataPrazoLegalParte')).toBe('2026-05-10T14:30:00');
  });

  it('envia tipoExpedienteId e responsavelId quando selecionados', async () => {
    const user = userEvent.setup();
    render(
      <ExpedienteDialog
        open
        onOpenChange={jest.fn()}
        onSuccess={jest.fn()}
        dadosIniciais={dadosIniciais}
      />,
    );

    // Aguardar combobox de usuários aparecer (loading finaliza)
    await waitFor(() => {
      const combos = screen.getAllByTestId('combobox');
      expect(combos.length).toBeGreaterThan(0);
    });

    // Tipo de expediente (primeiro select dentro do form)
    const form = screen.getByRole('dialog');
    const selects = within(form).getAllByTestId('select');
    // Primeiro select = "tipo de expediente"
    await user.selectOptions(selects[0], '10');

    // Responsável (combobox)
    const combos = within(form).getAllByTestId('combobox');
    await user.selectOptions(combos[0], '1');

    await user.type(
      screen.getByLabelText(/descrição/i),
      'Intimação',
    );
    await user.type(screen.getByTestId('form-date-picker'), '2026-05-10');
    await user.type(screen.getByLabelText(/hora/i), '14:30');

    await user.click(
      screen.getByRole('button', { name: /criar expediente/i }),
    );

    await waitFor(() => {
      expect(mockActionCriarExpediente).toHaveBeenCalled();
    });

    const [, formData] = mockActionCriarExpediente.mock.calls[0] as [
      unknown,
      FormData,
    ];
    expect(formData.get('tipoExpedienteId')).toBe('10');
    expect(formData.get('responsavelId')).toBe('1');
  });

  it('propaga erros de validação da Server Action para alerts com role="alert"', async () => {
    mockActionCriarExpediente.mockResolvedValue({
      success: false,
      error: 'Erro de validação',
      errors: {
        descricao: ['Descrição é obrigatória'],
      },
      message: 'Erro de validação',
    });

    const user = userEvent.setup();
    render(
      <ExpedienteDialog
        open
        onOpenChange={jest.fn()}
        onSuccess={jest.fn()}
        dadosIniciais={dadosIniciais}
      />,
    );

    await user.type(screen.getByLabelText(/descrição/i), 'X');
    await user.type(screen.getByTestId('form-date-picker'), '2026-05-10');
    await user.type(screen.getByLabelText(/hora/i), '14:30');

    await user.click(
      screen.getByRole('button', { name: /criar expediente/i }),
    );

    await waitFor(() => {
      expect(
        screen.getByText('Descrição é obrigatória'),
      ).toBeInTheDocument();
    });
  });

  it('modo manual: não renderiza seleção de tribunal sem dadosIniciais pré-preenchidos', async () => {
    render(
      <ExpedienteDialog
        open
        onOpenChange={jest.fn()}
        onSuccess={jest.fn()}
      />,
    );

    await waitFor(() => {
      expect(mockActionListarUsuarios).toHaveBeenCalled();
    });

    expect(
      screen.getByText(/selecione o tribunal e grau/i),
    ).toBeInTheDocument();

    // Submit deve iniciar desabilitado (nenhum processo selecionado)
    expect(
      screen.getByRole('button', { name: /criar expediente/i }),
    ).toBeDisabled();
  });

  it('modo manual: exibe partes ao selecionar processo (regressão do mapeamento nome_parte_autora/nome_parte_re)', async () => {
    mockActionListarAcervoPaginado.mockResolvedValueOnce({
      success: true,
      data: {
        processos: [
          {
            id: 7,
            numero_processo: '0010249-69.2026.5.03.0105',
            // Os campos devem ter EXATAMENTE os nomes retornados pelo
            // repositório (snake_case alinhado com a tabela acervo). Antes do
            // fix o dialog fazia cast para polo_ativo_nome/polo_passivo_nome
            // e recebia undefined → partes renderizadas como '—'.
            nome_parte_autora: 'Raphael Lucas Nogueira da Costa',
            nome_parte_re: 'Uber do Brasil Tecnologia Ltda.',
            trt: 'TRT3',
            grau: GrauTribunal.PRIMEIRO_GRAU,
          },
        ],
      },
    });

    const user = userEvent.setup();
    render(
      <ExpedienteDialog
        open
        onOpenChange={jest.fn()}
        onSuccess={jest.fn()}
      />,
    );

    // Passo 1: selecionar TRT + Grau para disparar o fetch
    const form = screen.getByRole('dialog');
    const selects = within(form).getAllByTestId('select');
    await user.selectOptions(selects[0], 'TRT3');
    await user.selectOptions(selects[1], GrauTribunal.PRIMEIRO_GRAU);

    await waitFor(() => {
      expect(mockActionListarAcervoPaginado).toHaveBeenCalledWith({
        trt: 'TRT3',
        grau: GrauTribunal.PRIMEIRO_GRAU,
        limite: 100,
      });
    });

    // Aguardar a option do processo aparecer no combobox (estado populado
    // após o fetch resolver).
    await waitFor(() => {
      const combos = within(form).getAllByTestId('combobox');
      expect(
        within(combos[0]).queryByText('0010249-69.2026.5.03.0105'),
      ).toBeInTheDocument();
    });
    const combos = within(form).getAllByTestId('combobox');
    await user.selectOptions(combos[0], '7');

    // As partes devem estar visíveis na seção "Processo vinculado"
    // (antes do fix aparecia '—' por causa do mapeamento incorreto)
    await waitFor(() => {
      expect(
        screen.getByText('Raphael Lucas Nogueira da Costa'),
      ).toBeInTheDocument();
    });
    expect(
      screen.getByText('Uber do Brasil Tecnologia Ltda.'),
    ).toBeInTheDocument();

    // Número do processo aparece em dois lugares: option do combobox (label)
    // e seção "Processo vinculado". Ambos devem existir.
    expect(
      screen.getAllByText('0010249-69.2026.5.03.0105').length,
    ).toBeGreaterThanOrEqual(2);
  });
});
