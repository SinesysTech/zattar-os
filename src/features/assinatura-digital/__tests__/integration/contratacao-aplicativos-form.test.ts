/**
 * Teste de Integração - Formulário "Contratação - Aplicativos"
 *
 * Valida o formulário completo com campos de busca e auto-fill
 */

import { describe, it, expect } from '@jest/globals';
import {
  getFormularioBySlugAndSegmentoId,
  getFormulario,
} from '../../services/formularios.service';
import { validateFormSchema } from '../../utils/form-schema-validation';
import type { DynamicFormSchema } from '../../types/domain';

describe('Formulário "Contratação - Aplicativos" - Validação', () => {
  const FORMULARIO_SLUG = 'contratacao-aplicativos';
  const SEGMENTO_ID = 1; // Trabalhista

  describe('Busca e Validação do Formulário', () => {
    it('deve encontrar o formulário pelo slug e segmento', async () => {
      const formulario = await getFormularioBySlugAndSegmentoId(
        FORMULARIO_SLUG,
        SEGMENTO_ID
      );

      expect(formulario).toBeDefined();
      expect(formulario?.nome).toBe('Contratação - Aplicativos');
      expect(formulario?.slug).toBe(FORMULARIO_SLUG);
      expect(formulario?.segmento_id).toBe(SEGMENTO_ID);
      expect(formulario?.ativo).toBe(true);
    });

    it('deve ter o schema completo com 4 seções', async () => {
      const formulario = await getFormularioBySlugAndSegmentoId(
        FORMULARIO_SLUG,
        SEGMENTO_ID
      );

      expect(formulario?.form_schema).toBeDefined();
      const schema = formulario?.form_schema as DynamicFormSchema;

      expect(schema.id).toBe('contratacao-aplicativos');
      expect(schema.version).toBe('1.0.0');
      expect(schema.sections).toHaveLength(4);

      // Verificar títulos das seções
      const sectionTitles = schema.sections.map((s) => s.title);
      expect(sectionTitles).toContain('Etapa 1: Busca de Cliente');
      expect(sectionTitles).toContain('Etapa 2: Dados do Cliente');
      expect(sectionTitles).toContain('Etapa 3: Parte Contrária');
      expect(sectionTitles).toContain('Etapa 4: Dados da Ação Trabalhista');
    });

    it('deve validar o schema sem erros', async () => {
      const formulario = await getFormularioBySlugAndSegmentoId(
        FORMULARIO_SLUG,
        SEGMENTO_ID
      );

      const schema = formulario?.form_schema as DynamicFormSchema;
      const validation = validateFormSchema(schema);

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });
  });

  describe('Campos de Busca', () => {
    it('deve ter campo de busca de cliente na primeira seção', async () => {
      const formulario = await getFormularioBySlugAndSegmentoId(
        FORMULARIO_SLUG,
        SEGMENTO_ID
      );

      const schema = formulario?.form_schema as DynamicFormSchema;
      const primeiraSecao = schema.sections[0];

      expect(primeiraSecao.id).toBe('etapa-1-busca-cliente');
      expect(primeiraSecao.fields).toHaveLength(1);

      const campoBusca = primeiraSecao.fields[0];
      expect(campoBusca.id).toBe('busca_cliente');
      expect(campoBusca.type).toBe('client_search');
      expect(campoBusca.entitySearch).toBeDefined();
      expect(campoBusca.entitySearch?.entityType).toBe('cliente');
      expect(campoBusca.entitySearch?.searchBy).toContain('cpf');
      expect(campoBusca.entitySearch?.autoFill).toBeDefined();
    });

    it('deve ter campo de busca de parte contrária na terceira seção', async () => {
      const formulario = await getFormularioBySlugAndSegmentoId(
        FORMULARIO_SLUG,
        SEGMENTO_ID
      );

      const schema = formulario?.form_schema as DynamicFormSchema;
      const terceiraSecao = schema.sections[2];

      expect(terceiraSecao.id).toBe('etapa-3-parte-contraria');
      const campoBusca = terceiraSecao.fields.find(
        (f) => f.type === 'parte_contraria_search'
      );

      expect(campoBusca).toBeDefined();
      expect(campoBusca?.id).toBe('busca_parte_contraria');
      expect(campoBusca?.entitySearch?.entityType).toBe('parte_contraria');
      expect(campoBusca?.entitySearch?.searchBy).toContain('cpf');
      expect(campoBusca?.entitySearch?.searchBy).toContain('cnpj');
      expect(campoBusca?.entitySearch?.searchBy).toContain('nome');
    });

    it('deve ter mapeamento de auto-fill configurado corretamente', async () => {
      const formulario = await getFormularioBySlugAndSegmentoId(
        FORMULARIO_SLUG,
        SEGMENTO_ID
      );

      const schema = formulario?.form_schema as DynamicFormSchema;
      const campoBuscaCliente = schema.sections[0].fields[0];

      expect(campoBuscaCliente.entitySearch?.autoFill).toBeDefined();
      const autoFill = campoBuscaCliente.entitySearch?.autoFill || {};

      // Verificar mapeamentos esperados
      expect(autoFill['nome']).toBe('cliente_nome');
      expect(autoFill['cpf']).toBe('cliente_cpf');
      expect(autoFill['emails[0]']).toBe('cliente_email');
      expect(autoFill['ddd_celular']).toBe('cliente_ddd_celular');
      expect(autoFill['numero_celular']).toBe('cliente_numero_celular');
    });
  });

  describe('Campos Condicionais e Hidden', () => {
    it('deve ter campo condicional data_termino', async () => {
      const formulario = await getFormularioBySlugAndSegmentoId(
        FORMULARIO_SLUG,
        SEGMENTO_ID
      );

      const schema = formulario?.form_schema as DynamicFormSchema;
      const quartaSecao = schema.sections[3];
      const campoDataTermino = quartaSecao.fields.find(
        (f) => f.id === 'data_termino'
      );

      expect(campoDataTermino).toBeDefined();
      expect(campoDataTermino?.conditional).toBeDefined();
      expect(campoDataTermino?.conditional?.field).toBe('trabalhando_atualmente');
      expect(campoDataTermino?.conditional?.operator).toBe('=');
      expect(campoDataTermino?.conditional?.value).toBe(false);
    });

    it('deve ter campo hidden tipo_contrato', async () => {
      const formulario = await getFormularioBySlugAndSegmentoId(
        FORMULARIO_SLUG,
        SEGMENTO_ID
      );

      const schema = formulario?.form_schema as DynamicFormSchema;
      const quartaSecao = schema.sections[3];
      const campoTipoContrato = quartaSecao.fields.find(
        (f) => f.id === 'tipo_contrato'
      );

      expect(campoTipoContrato).toBeDefined();
      expect(campoTipoContrato?.hidden).toBe(true);
      expect(campoTipoContrato?.defaultValue).toBe('ajuizamento');
    });
  });

  describe('Estrutura de Campos', () => {
    it('deve ter todos os campos esperados na seção de dados do cliente', async () => {
      const formulario = await getFormularioBySlugAndSegmentoId(
        FORMULARIO_SLUG,
        SEGMENTO_ID
      );

      const schema = formulario?.form_schema as DynamicFormSchema;
      const secaoDadosCliente = schema.sections[1];

      const fieldIds = secaoDadosCliente.fields.map((f) => f.id);
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

    it('deve ter campos obrigatórios marcados corretamente', async () => {
      const formulario = await getFormularioBySlugAndSegmentoId(
        FORMULARIO_SLUG,
        SEGMENTO_ID
      );

      const schema = formulario?.form_schema as DynamicFormSchema;

      // Cliente nome deve ser obrigatório
      const clienteNome = schema.sections[1].fields.find(
        (f) => f.id === 'cliente_nome'
      );
      expect(clienteNome?.validation?.required).toBe(true);

      // Cliente CPF deve ser obrigatório
      const clienteCPF = schema.sections[1].fields.find(
        (f) => f.id === 'cliente_cpf'
      );
      expect(clienteCPF?.validation?.required).toBe(true);

      // Objeto da ação deve ser obrigatório
      const objetoAcao = schema.sections[3].fields.find(
        (f) => f.id === 'objeto_acao'
      );
      expect(objetoAcao?.validation?.required).toBe(true);
      expect(objetoAcao?.validation?.min).toBe(10);
    });
  });

  describe('Acesso por ID', () => {
    it('deve encontrar o formulário pelo ID', async () => {
      const formulario = await getFormulario('1');

      expect(formulario).toBeDefined();
      expect(formulario?.nome).toBe('Contratação - Aplicativos');
      expect(formulario?.slug).toBe(FORMULARIO_SLUG);
    });
  });
});
