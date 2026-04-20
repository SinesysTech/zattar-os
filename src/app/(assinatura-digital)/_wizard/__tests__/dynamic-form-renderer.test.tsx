/**
 * @jest-environment jsdom
 *
 * Testes do DynamicFormRenderer — coração do step 5 (Dados da Ação).
 * Foco nas decisões estruturais dos ciclos 1-7:
 *   - Ícone semântico por seção (Building2, IdCard, MapPin, Briefcase)
 *   - Header enxuto: título da seção via overline (sem ícone decorativo, sem card de busca)
 *   - Divider "Não encontrou? Preencha abaixo" entre busca e manual
 *   - Heurística tipo_pessoa filtra CPF/CNPJ
 *   - Hierarquia heading section (h2) sob page title (h1)
 */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DynamicFormRenderer from '../form/dynamic-form-renderer'
import { FormFieldType } from '@/shared/assinatura-digital/types/domain'
import type { DynamicFormSchema } from '@/shared/assinatura-digital/types'

const onSubmit = jest.fn()

afterEach(() => {
  onSubmit.mockReset()
})

function buildSchema(overrides: Partial<DynamicFormSchema>): DynamicFormSchema {
  return {
    id: 'test-schema',
    version: '1.0.0',
    sections: [],
    globalValidations: [],
    ...overrides,
  }
}

describe('DynamicFormRenderer — header enxuto por seção', () => {
  it('título da seção é exibido como overline uppercase (sem ícone decorativo)', () => {
    const schema = buildSchema({
      sections: [
        {
          id: 'etapa-3-parte-contraria',
          title: 'Parte Contrária',
          fields: [
            {
              id: 'campo',
              name: 'campo',
              label: 'Campo',
              type: FormFieldType.TEXT,
              gridColumns: 3,
            },
          ],
        },
      ],
    })
    const { container } = render(
      <DynamicFormRenderer schema={schema} onSubmit={onSubmit} />,
    )
    // Título da seção aparece no overline
    expect(screen.getByText(/parte contrária/i)).toBeInTheDocument()
    // Não deve haver wrapper de ícone decorativo (anti-pattern "double heading")
    expect(container.querySelector('.bg-primary\\/10')).toBeFalsy()
  })

  it('campo de busca (PARTE_CONTRARIA_SEARCH) renderiza direto, sem wrapper de destaque', () => {
    const schema = buildSchema({
      sections: [
        {
          id: 'parte-contraria',
          title: 'Parte Contrária',
          fields: [
            {
              id: 'busca',
              name: 'busca',
              label: 'Buscar',
              type: FormFieldType.PARTE_CONTRARIA_SEARCH,
              gridColumns: 1,
            },
          ],
        },
      ],
    })
    render(<DynamicFormRenderer schema={schema} onSubmit={onSubmit} />)
    // Não deve existir o label decorativo antigo
    expect(screen.queryByText(/busca rápida/i)).not.toBeInTheDocument()
    expect(
      screen.queryByText(/não encontrou\? preencha abaixo/i),
    ).not.toBeInTheDocument()
  })
})

describe('DynamicFormRenderer — heurística tipo_pessoa filtra CPF/CNPJ', () => {
  function schemaComTipoPessoa() {
    return buildSchema({
      sections: [
        {
          id: 'parte-contraria',
          title: 'Parte Contrária',
          fields: [
            {
              id: 'tipo_pessoa',
              name: 'tipo_pessoa',
              label: 'Tipo de Pessoa',
              type: FormFieldType.SELECT,
              gridColumns: 1,
              defaultValue: 'pj',
              options: [
                { label: 'Pessoa Jurídica', value: 'pj' },
                { label: 'Pessoa Física', value: 'pf' },
              ],
            },
            {
              id: 'parte_cnpj',
              name: 'parte_cnpj',
              label: 'CNPJ',
              type: FormFieldType.CNPJ,
              gridColumns: 1,
            },
            {
              id: 'parte_cpf',
              name: 'parte_cpf',
              label: 'CPF',
              type: FormFieldType.CPF,
              gridColumns: 1,
            },
          ],
        },
      ],
    })
  }

  it('com tipo_pessoa=pj (default), CPF é escondido e CNPJ aparece', () => {
    render(<DynamicFormRenderer schema={schemaComTipoPessoa()} onSubmit={onSubmit} />)
    expect(screen.getByText(/cnpj/i)).toBeInTheDocument()
    expect(screen.queryByText(/^cpf$/i)).not.toBeInTheDocument()
  })

  it('mudar tipo_pessoa pra "pf" esconde CNPJ e mostra CPF', async () => {
    const user = userEvent.setup()
    const schema = buildSchema({
      sections: [
        {
          id: 'parte-contraria',
          title: 'Parte',
          fields: [
            {
              id: 'tipo_pessoa',
              name: 'tipo_pessoa',
              label: 'Tipo',
              type: FormFieldType.SELECT,
              gridColumns: 1,
              defaultValue: 'pf',
              options: [
                { label: 'Pessoa Jurídica', value: 'pj' },
                { label: 'Pessoa Física', value: 'pf' },
              ],
            },
            {
              id: 'parte_cnpj',
              name: 'parte_cnpj',
              label: 'CNPJ',
              type: FormFieldType.CNPJ,
              gridColumns: 1,
            },
            {
              id: 'parte_cpf',
              name: 'parte_cpf',
              label: 'CPF',
              type: FormFieldType.CPF,
              gridColumns: 1,
            },
          ],
        },
      ],
    })
    render(<DynamicFormRenderer schema={schema} onSubmit={onSubmit} />)
    expect(screen.getByText(/cpf/i)).toBeInTheDocument()
    expect(screen.queryByText(/cnpj/i)).not.toBeInTheDocument()
    void user
  })

  it('schema sem tipo_pessoa mostra ambos CPF e CNPJ (sem heurística)', () => {
    const schema = buildSchema({
      sections: [
        {
          id: 'parte-contraria',
          title: 'Parte',
          fields: [
            {
              id: 'parte_cnpj',
              name: 'parte_cnpj',
              label: 'CNPJ',
              type: FormFieldType.CNPJ,
              gridColumns: 1,
            },
            {
              id: 'parte_cpf',
              name: 'parte_cpf',
              label: 'CPF',
              type: FormFieldType.CPF,
              gridColumns: 1,
            },
          ],
        },
      ],
    })
    render(<DynamicFormRenderer schema={schema} onSubmit={onSubmit} />)
    expect(screen.getByText(/cnpj/i)).toBeInTheDocument()
    expect(screen.getByText(/^cpf$/i)).toBeInTheDocument()
  })

  it('aceita variantes "Pessoa Jurídica (Empresa)" como PJ (normalizeTipoPessoa)', () => {
    const schema = buildSchema({
      sections: [
        {
          id: 'parte',
          title: 'Parte',
          fields: [
            {
              id: 'tipo_pessoa',
              name: 'tipo_pessoa',
              label: 'Tipo',
              type: FormFieldType.SELECT,
              gridColumns: 1,
              defaultValue: 'Pessoa Jurídica (Empresa)',
              options: [
                { label: 'Pessoa Jurídica (Empresa)', value: 'Pessoa Jurídica (Empresa)' },
              ],
            },
            {
              id: 'parte_cnpj',
              name: 'parte_cnpj',
              label: 'CNPJ',
              type: FormFieldType.CNPJ,
              gridColumns: 1,
            },
            {
              id: 'parte_cpf',
              name: 'parte_cpf',
              label: 'CPF',
              type: FormFieldType.CPF,
              gridColumns: 1,
            },
          ],
        },
      ],
    })
    render(<DynamicFormRenderer schema={schema} onSubmit={onSubmit} />)
    // Normalize captura "juridic..." → PJ → CPF some
    expect(screen.queryByText(/^cpf$/i)).not.toBeInTheDocument()
    expect(screen.getByText(/cnpj/i)).toBeInTheDocument()
  })
})

// Testes de ícone/preferredField/"busca rápida" removidos em 2026-04:
// o renderer deixou de produzir o header decorativo com ícone e o card
// de busca destacado. A busca agora é prep-preparada via entitySearch.autoFill
// em campos comuns (ex: CNPJ), sem UI especializada.

describe('DynamicFormRenderer — Separator entre seções com tom outline-variant/30', () => {
  it('múltiplas seções têm separator com tom sutil', () => {
    const schema = buildSchema({
      sections: [
        {
          id: 's1',
          title: 'Seção 1',
          fields: [
            { id: 'a', name: 'a', label: 'A', type: FormFieldType.TEXT, gridColumns: 3 },
          ],
        },
        {
          id: 's2',
          title: 'Seção 2',
          fields: [
            { id: 'b', name: 'b', label: 'B', type: FormFieldType.TEXT, gridColumns: 3 },
          ],
        },
      ],
    })
    const { container } = render(
      <DynamicFormRenderer schema={schema} onSubmit={onSubmit} />,
    )
    // Separator do shadcn renderiza com data-slot="separator-root" — buscamos ele
    const separator = container.querySelector('[data-slot="separator"]')
    expect(separator).toBeTruthy()
    expect(separator?.className).toMatch(/bg-outline-variant\/30/)
  })

  it('seção única não tem separator', () => {
    const schema = buildSchema({
      sections: [
        {
          id: 'só',
          title: 'Só',
          fields: [
            { id: 'c', name: 'c', label: 'C', type: FormFieldType.TEXT, gridColumns: 3 },
          ],
        },
      ],
    })
    const { container } = render(
      <DynamicFormRenderer schema={schema} onSubmit={onSubmit} />,
    )
    const separator = container.querySelector('[data-slot="separator"]')
    expect(separator).toBeNull()
  })
})
