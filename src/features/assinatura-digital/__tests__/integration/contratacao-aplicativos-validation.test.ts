/**
 * Validação do Formulário "Contratação - Aplicativos"
 *
 * Testa a estrutura e validação do schema sem depender de conexão Supabase
 */

import { describe, it, expect } from '@jest/globals';
import { validateFormSchema } from '../../utils/form-schema-validation';
import type { DynamicFormSchema } from '../../types/domain';
import contratacaoSchema from '../../examples/contratacao-aplicativos-schema.json';

describe('Formulário "Contratação - Aplicativos" - Validação de Schema', () => {
  const schema = contratacaoSchema as DynamicFormSchema;

  describe('Estrutura Básica', () => {
    it('deve ter ID e versão corretos', () => {
      expect(schema.id).toBe('contratacao-aplicativos');
      expect(schema.version).toBe('1.0.0');
    });

    it('deve ter 4 seções', () => {
      expect(schema.sections).toHaveLength(4);
    });

    it('deve validar o schema sem erros', () => {
      const validation = validateFormSchema(schema);
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });
  });

  describe('Seção 1: Busca de Cliente', () => {
    const secao = schema.sections[0];

    it('deve ter ID e título corretos', () => {
      expect(secao.id).toBe('etapa-1-busca-cliente');
      expect(secao.title).toBe('Etapa 1: Busca de Cliente');
    });

    it('deve ter campo de busca de cliente', () => {
      expect(secao.fields).toHaveLength(1);
      const campo = secao.fields[0];

      expect(campo.id).toBe('busca_cliente');
      expect(campo.type).toBe('client_search');
      expect(campo.label).toBe('Buscar Cliente por CPF');
    });

    it('deve ter entitySearch configurado', () => {
      const campo = secao.fields[0];
      expect(campo.entitySearch).toBeDefined();
      expect(campo.entitySearch?.entityType).toBe('cliente');
      expect(campo.entitySearch?.searchBy).toContain('cpf');
    });

    it('deve ter autoFill configurado corretamente', () => {
      const campo = secao.fields[0];
      const autoFill = campo.entitySearch?.autoFill;

      expect(autoFill).toBeDefined();
      expect(autoFill?.['nome']).toBe('cliente_nome');
      expect(autoFill?.['cpf']).toBe('cliente_cpf');
      expect(autoFill?.['emails[0]']).toBe('cliente_email');
      expect(autoFill?.['ddd_celular']).toBe('cliente_ddd_celular');
      expect(autoFill?.['numero_celular']).toBe('cliente_numero_celular');
    });
  });

  describe('Seção 2: Dados do Cliente', () => {
    const secao = schema.sections[1];

    it('deve ter ID e título corretos', () => {
      expect(secao.id).toBe('etapa-2-dados-cliente');
      expect(secao.title).toBe('Etapa 2: Dados do Cliente');
    });

    it('deve ter 9 campos', () => {
      expect(secao.fields.length).toBeGreaterThanOrEqual(9);
    });

    it('deve ter campos obrigatórios marcados', () => {
      const clienteNome = secao.fields.find((f) => f.id === 'cliente_nome');
      const clienteCPF = secao.fields.find((f) => f.id === 'cliente_cpf');
      const clienteEmail = secao.fields.find((f) => f.id === 'cliente_email');

      expect(clienteNome?.validation?.required).toBe(true);
      expect(clienteCPF?.validation?.required).toBe(true);
      expect(clienteEmail?.validation?.required).toBe(true);
    });

    it('deve ter todos os campos esperados', () => {
      const fieldIds = secao.fields.map((f) => f.id);
      const expectedFields = [
        'cliente_nome',
        'cliente_cpf',
        'cliente_email',
        'cliente_ddd_celular',
        'cliente_numero_celular',
        'cliente_data_nascimento',
        'cliente_rg',
        'cliente_estado_civil',
        'cliente_nome_genitora',
      ];

      expectedFields.forEach((fieldId) => {
        expect(fieldIds).toContain(fieldId);
      });
    });
  });

  describe('Seção 3: Parte Contrária', () => {
    const secao = schema.sections[2];

    it('deve ter ID e título corretos', () => {
      expect(secao.id).toBe('etapa-3-parte-contraria');
      expect(secao.title).toBe('Etapa 3: Parte Contrária');
    });

    it('deve ter campo de busca de parte contrária', () => {
      const campoBusca = secao.fields.find(
        (f) => f.type === 'parte_contraria_search'
      );

      expect(campoBusca).toBeDefined();
      expect(campoBusca?.id).toBe('busca_parte_contraria');
      expect(campoBusca?.entitySearch?.entityType).toBe('parte_contraria');
      expect(campoBusca?.entitySearch?.searchBy).toContain('cpf');
      expect(campoBusca?.entitySearch?.searchBy).toContain('cnpj');
      expect(campoBusca?.entitySearch?.searchBy).toContain('nome');
    });

    it('deve ter mapeamento de autoFill para parte contrária', () => {
      const campoBusca = secao.fields.find(
        (f) => f.type === 'parte_contraria_search'
      );
      const autoFill = campoBusca?.entitySearch?.autoFill;

      expect(autoFill?.['nome']).toBe('parte_contraria_nome');
      expect(autoFill?.['cnpj']).toBe('parte_contraria_cnpj');
      expect(autoFill?.['cpf']).toBe('parte_contraria_cpf');
    });
  });

  describe('Seção 4: Dados da Ação', () => {
    const secao = schema.sections[3];

    it('deve ter ID e título corretos', () => {
      expect(secao.id).toBe('etapa-4-dados-acao');
      expect(secao.title).toBe('Etapa 4: Dados da Ação Trabalhista');
    });

    it('deve ter campo condicional data_termino', () => {
      const campoDataTermino = secao.fields.find(
        (f) => f.id === 'data_termino'
      );

      expect(campoDataTermino).toBeDefined();
      expect(campoDataTermino?.conditional).toBeDefined();
      expect(campoDataTermino?.conditional?.field).toBe('trabalhando_atualmente');
      expect(campoDataTermino?.conditional?.operator).toBe('=');
      expect(campoDataTermino?.conditional?.value).toBe(false);
    });

    it('deve ter campo hidden tipo_contrato', () => {
      const campoTipoContrato = secao.fields.find(
        (f) => f.id === 'tipo_contrato'
      );

      expect(campoTipoContrato).toBeDefined();
      expect(campoTipoContrato?.hidden).toBe(true);
      expect(campoTipoContrato?.defaultValue).toBe('ajuizamento');
    });

    it('deve ter campo objeto_acao com validação min', () => {
      const campoObjeto = secao.fields.find((f) => f.id === 'objeto_acao');

      expect(campoObjeto).toBeDefined();
      expect(campoObjeto?.validation?.required).toBe(true);
      expect(campoObjeto?.validation?.min).toBe(10);
    });
  });

  describe('Tipos de Campo', () => {
    it('deve ter campos client_search e parte_contraria_search', () => {
      const allFields = schema.sections.flatMap((s) => s.fields);
      const tipos = allFields.map((f) => f.type);

      expect(tipos).toContain('client_search');
      expect(tipos).toContain('parte_contraria_search');
    });

    it('deve ter campos de diferentes tipos', () => {
      const allFields = schema.sections.flatMap((s) => s.fields);
      const tipos = [...new Set(allFields.map((f) => f.type))];

      expect(tipos).toContain('text');
      expect(tipos).toContain('cpf');
      expect(tipos).toContain('cnpj');
      expect(tipos).toContain('email');
      expect(tipos).toContain('phone');
      expect(tipos).toContain('date');
      expect(tipos).toContain('select');
      expect(tipos).toContain('checkbox');
      expect(tipos).toContain('textarea');
    });
  });
});
