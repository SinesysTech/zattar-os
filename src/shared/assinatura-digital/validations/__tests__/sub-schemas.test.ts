/**
 * @jest-environment node
 *
 * Testes dos schemas Zod segregados do sub-wizard Dados Pessoais.
 * Garante que cada substep valida só sua fatia e o merge final é consistente
 * com o schema pleno.
 */

import {
  identidadeSchema,
  contatosSchema,
  enderecoSchema,
} from '../dados-pessoais-sub.schemas'
import { dadosPessoaisSchema } from '../dados-pessoais.schema'

describe('identidadeSchema', () => {
  it('aceita payload mínimo válido', () => {
    const result = identidadeSchema.safeParse({
      name: 'João Teste',
      cpf: '11144477735',
      rg: undefined,
      dataNascimento: '01/01/1990',
      genero: '1',
      nacionalidade: '30',
      estadoCivil: '1',
    })
    expect(result.success).toBe(true)
  })

  it('rejeita nome vazio', () => {
    const result = identidadeSchema.safeParse({
      name: '',
      cpf: '11144477735',
      dataNascimento: '01/01/1990',
      genero: '1',
      nacionalidade: '30',
      estadoCivil: '1',
    })
    expect(result.success).toBe(false)
  })

  it('não valida campos fora do seu escopo (email, celular, endereço)', () => {
    // Valida que o schema picked NÃO exige email/celular/cep
    const result = identidadeSchema.safeParse({
      name: 'João',
      cpf: '11144477735',
      dataNascimento: '01/01/1990',
      genero: '1',
      nacionalidade: '30',
      estadoCivil: '1',
    })
    expect(result.success).toBe(true)
  })
})

describe('contatosSchema', () => {
  it('aceita email e celular válidos', () => {
    const result = contatosSchema.safeParse({
      email: 'test@example.com',
      celular: '11987654321',
      telefone: undefined,
    })
    expect(result.success).toBe(true)
  })

  it('rejeita email inválido', () => {
    const result = contatosSchema.safeParse({
      email: 'nao-email',
      celular: '11987654321',
    })
    expect(result.success).toBe(false)
  })

  it('rejeita celular muito curto', () => {
    const result = contatosSchema.safeParse({
      email: 'a@b.com',
      celular: '119',
    })
    expect(result.success).toBe(false)
  })
})

describe('enderecoSchema', () => {
  it('aceita endereço completo (todos opcionais passam)', () => {
    const result = enderecoSchema.safeParse({
      cep: '01310100',
      logradouro: 'Av Paulista',
      numero: '1000',
      complemento: '',
      bairro: 'Bela Vista',
      cidade: 'São Paulo',
      estado: 'SP',
    })
    expect(result.success).toBe(true)
  })

  it('aceita endereço vazio (campos são opcionais no schema base)', () => {
    // O schema base tem todos os campos como optional; a obrigatoriedade real
    // acontece na submissão via validações customizadas e no schema pleno.
    const result = enderecoSchema.safeParse({})
    expect(result.success).toBe(true)
  })
})

describe('merge dos 3 substeps gera payload válido para dadosPessoaisSchema', () => {
  it('combinando identidade + contatos + endereço passa no schema pleno', () => {
    const identidade = {
      name: 'João Teste Silva',
      cpf: '11144477735',
      rg: '123456789',
      dataNascimento: '01/01/1990',
      genero: '1',
      nacionalidade: '30',
      estadoCivil: '1',
    }
    const contatos = {
      email: 'joao@test.com',
      celular: '11987654321',
      telefone: '',
    }
    const endereco = {
      cep: '01310100',
      logradouro: 'Av Paulista',
      numero: '1000',
      complemento: '',
      bairro: 'Bela Vista',
      cidade: 'São Paulo',
      estado: 'SP',
    }

    const merged = { ...identidade, ...contatos, ...endereco }
    const result = dadosPessoaisSchema.safeParse(merged)
    expect(result.success).toBe(true)
  })

  it('merge parcial (faltando contatos) falha no schema pleno', () => {
    const merged = {
      name: 'João',
      cpf: '11144477735',
      dataNascimento: '01/01/1990',
      // email e celular ausentes
    }
    const result = dadosPessoaisSchema.safeParse(merged)
    expect(result.success).toBe(false)
  })
})
