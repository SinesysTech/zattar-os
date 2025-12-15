/**
 * Testes de Integração - API de Formulários de Assinatura Digital
 *
 * Testa operações CRUD de formulários via serviços.
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import {
  listFormularios,
  getFormulario,
  getFormularioBySlugAndSegmentoId,
  createFormulario,
  updateFormulario,
  deleteFormulario,
} from '../../services/formularios.service';
import {
  createSegmento,
  deleteSegmento,
} from '../../services/segmentos.service';

describe('Formulários de Assinatura Digital - Integração', () => {
  let testSegmentoId: number | null = null;
  let testFormularioId: number | null = null;
  const testSlug = `test-form-${Date.now()}`;

  beforeAll(async () => {
    // Criar segmento de teste para associar formulários
    const segmento = await createSegmento({
      nome: 'Segmento para Teste de Formulários',
      slug: `test-seg-form-${Date.now()}`,
      ativo: true,
    });
    testSegmentoId = segmento.id;
  });

  afterAll(async () => {
    // Limpar formulário de teste
    if (testFormularioId) {
      try {
        await deleteFormulario(String(testFormularioId));
      } catch {
        // Ignorar se já foi deletado
      }
    }

    // Limpar segmento de teste
    if (testSegmentoId) {
      try {
        await deleteSegmento(testSegmentoId);
      } catch {
        // Ignorar se já foi deletado
      }
    }
  });

  describe('Criar Formulário', () => {
    it('deve criar um formulário com dados válidos', async () => {
      if (!testSegmentoId) {
        console.log('Pulando teste - segmento não criado');
        return;
      }

      const input = {
        nome: 'Formulário de Teste Integração',
        slug: testSlug,
        segmento_id: testSegmentoId,
        descricao: 'Descrição do formulário de teste',
        ativo: true,
        foto_necessaria: true,
        geolocation_necessaria: false,
      };

      const formulario = await createFormulario(input);

      expect(formulario).toBeDefined();
      expect(formulario.id).toBeDefined();
      expect(formulario.nome).toBe('Formulário de Teste Integração');
      expect(formulario.slug).toBe(testSlug);
      expect(formulario.segmento_id).toBe(testSegmentoId);
      expect(formulario.descricao).toBe('Descrição do formulário de teste');
      expect(formulario.ativo).toBe(true);
      expect(formulario.foto_necessaria).toBe(true);
      expect(formulario.geolocation_necessaria).toBe(false);

      testFormularioId = formulario.id;
    });

    it('deve criar formulário com schema JSON', async () => {
      if (!testSegmentoId) {
        console.log('Pulando teste - segmento não criado');
        return;
      }

      const slug = `test-schema-${Date.now()}`;
      const formSchema = {
        fields: [
          { name: 'nome', type: 'text', required: true },
          { name: 'cpf', type: 'cpf', required: true },
        ],
      };

      const input = {
        nome: 'Formulário com Schema',
        slug,
        segmento_id: testSegmentoId,
        form_schema: formSchema,
        schema_version: '1.0.0',
      };

      const formulario = await createFormulario(input);

      expect(formulario).toBeDefined();
      expect(formulario.form_schema).toEqual(formSchema);
      expect(formulario.schema_version).toBe('1.0.0');

      // Limpar
      await deleteFormulario(String(formulario.id));
    });

    it('deve criar formulário com template_ids', async () => {
      if (!testSegmentoId) {
        console.log('Pulando teste - segmento não criado');
        return;
      }

      const slug = `test-templates-${Date.now()}`;
      const input = {
        nome: 'Formulário com Templates',
        slug,
        segmento_id: testSegmentoId,
        template_ids: [1, 2, 3],
      };

      const formulario = await createFormulario(input);

      expect(formulario).toBeDefined();
      expect(formulario.template_ids).toEqual([1, 2, 3]);

      // Limpar
      await deleteFormulario(String(formulario.id));
    });
  });

  describe('Listar Formulários', () => {
    it('deve listar todos os formulários', async () => {
      const result = await listFormularios();

      expect(result).toBeDefined();
      expect(Array.isArray(result.formularios)).toBe(true);
      expect(typeof result.total).toBe('number');
    });

    it('deve listar apenas formulários ativos', async () => {
      const result = await listFormularios({ ativo: true });

      expect(result).toBeDefined();
      expect(Array.isArray(result.formularios)).toBe(true);
      result.formularios.forEach((f) => {
        expect(f.ativo).toBe(true);
      });
    });

    it('deve filtrar por segmento_id', async () => {
      if (!testSegmentoId || !testFormularioId) {
        console.log('Pulando teste - segmento ou formulário não criado');
        return;
      }

      const result = await listFormularios({ segmento_id: testSegmentoId });

      expect(result).toBeDefined();
      expect(result.formularios.length).toBeGreaterThan(0);
      result.formularios.forEach((f) => {
        expect(f.segmento_id).toBe(testSegmentoId);
      });
    });

    it('deve filtrar por array de segmento_ids', async () => {
      if (!testSegmentoId) {
        console.log('Pulando teste - segmento não criado');
        return;
      }

      const result = await listFormularios({ segmento_id: [testSegmentoId] });

      expect(result).toBeDefined();
      result.formularios.forEach((f) => {
        expect(f.segmento_id).toBe(testSegmentoId);
      });
    });

    it('deve buscar formulários por nome', async () => {
      if (!testFormularioId) {
        console.log('Pulando teste - formulário não criado');
        return;
      }

      const result = await listFormularios({ search: 'Teste Integração' });

      expect(result).toBeDefined();
      expect(result.formularios.length).toBeGreaterThan(0);
      expect(result.formularios.some((f) => f.id === testFormularioId)).toBe(true);
    });

    it('deve filtrar por foto_necessaria', async () => {
      const result = await listFormularios({ foto_necessaria: true });

      expect(result).toBeDefined();
      result.formularios.forEach((f) => {
        expect(f.foto_necessaria).toBe(true);
      });
    });

    it('deve incluir dados do segmento relacionado', async () => {
      const result = await listFormularios();

      expect(result).toBeDefined();
      result.formularios.forEach((f) => {
        if (f.segmento) {
          expect(f.segmento).toHaveProperty('id');
          expect(f.segmento).toHaveProperty('nome');
          expect(f.segmento).toHaveProperty('slug');
        }
      });
    });
  });

  describe('Buscar Formulário', () => {
    it('deve buscar formulário por ID numérico', async () => {
      if (!testFormularioId) {
        console.log('Pulando teste - formulário não criado');
        return;
      }

      const formulario = await getFormulario(String(testFormularioId));

      expect(formulario).toBeDefined();
      expect(formulario?.id).toBe(testFormularioId);
    });

    it('deve buscar formulário por slug e segmento_id', async () => {
      if (!testFormularioId || !testSegmentoId) {
        console.log('Pulando teste - formulário ou segmento não criado');
        return;
      }

      const formulario = await getFormularioBySlugAndSegmentoId(testSlug, testSegmentoId);

      expect(formulario).toBeDefined();
      expect(formulario?.slug).toBe(testSlug);
      expect(formulario?.segmento_id).toBe(testSegmentoId);
    });

    it('deve retornar null para ID inexistente', async () => {
      const formulario = await getFormulario('999999999');

      expect(formulario).toBeNull();
    });

    it('deve retornar null para slug/segmento inexistente', async () => {
      const formulario = await getFormularioBySlugAndSegmentoId('slug-inexistente', 999999);

      expect(formulario).toBeNull();
    });
  });

  describe('Atualizar Formulário', () => {
    it('deve atualizar nome do formulário', async () => {
      if (!testFormularioId) {
        console.log('Pulando teste - formulário não criado');
        return;
      }

      const updated = await updateFormulario(String(testFormularioId), {
        nome: 'Formulário Atualizado',
      });

      expect(updated.nome).toBe('Formulário Atualizado');
    });

    it('deve atualizar descrição do formulário', async () => {
      if (!testFormularioId) {
        console.log('Pulando teste - formulário não criado');
        return;
      }

      const updated = await updateFormulario(String(testFormularioId), {
        descricao: 'Nova descrição',
      });

      expect(updated.descricao).toBe('Nova descrição');
    });

    it('deve desativar formulário', async () => {
      if (!testFormularioId) {
        console.log('Pulando teste - formulário não criado');
        return;
      }

      const updated = await updateFormulario(String(testFormularioId), {
        ativo: false,
      });

      expect(updated.ativo).toBe(false);

      // Restaurar para ativo
      await updateFormulario(String(testFormularioId), { ativo: true });
    });

    it('deve atualizar configurações de segurança', async () => {
      if (!testFormularioId) {
        console.log('Pulando teste - formulário não criado');
        return;
      }

      const updated = await updateFormulario(String(testFormularioId), {
        foto_necessaria: false,
        geolocation_necessaria: true,
        metadados_seguranca: '["ip","user_agent","geolocation"]',
      });

      expect(updated.foto_necessaria).toBe(false);
      expect(updated.geolocation_necessaria).toBe(true);
    });

    it('deve atualizar template_ids', async () => {
      if (!testFormularioId) {
        console.log('Pulando teste - formulário não criado');
        return;
      }

      const updated = await updateFormulario(String(testFormularioId), {
        template_ids: [10, 20],
      });

      expect(updated.template_ids).toEqual([10, 20]);
    });
  });

  describe('Deletar Formulário', () => {
    it('deve deletar formulário existente', async () => {
      if (!testSegmentoId) {
        console.log('Pulando teste - segmento não criado');
        return;
      }

      // Criar formulário para deletar
      const slug = `test-delete-${Date.now()}`;
      const formulario = await createFormulario({
        nome: 'Formulário para Deletar',
        slug,
        segmento_id: testSegmentoId,
      });

      expect(formulario.id).toBeDefined();

      // Deletar
      await deleteFormulario(String(formulario.id));

      // Verificar que foi deletado
      const deleted = await getFormulario(String(formulario.id));
      expect(deleted).toBeNull();
    });
  });
});
