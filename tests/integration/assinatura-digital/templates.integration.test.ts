/**
 * Testes de Integração - API de Templates de Assinatura Digital
 *
 * Testa operações CRUD de templates via serviços.
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { randomUUID } from 'crypto';
import {
  listTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} from '@/backend/assinatura-digital/services/templates.service';

describe('Templates de Assinatura Digital - Integração', () => {
  let testTemplateId: number | null = null;
  const testUuid = `test-${randomUUID()}`;

  afterAll(async () => {
    // Limpar template de teste
    if (testTemplateId) {
      try {
        await deleteTemplate(String(testTemplateId));
      } catch {
        // Ignorar se já foi deletado
      }
    }
  });

  describe('Criar Template', () => {
    it('deve criar um template com dados válidos', async () => {
      const input = {
        template_uuid: testUuid,
        nome: 'Template de Teste Integração',
        descricao: 'Descrição do template de teste',
        arquivo_original: 'https://example.com/test.pdf',
        arquivo_nome: 'test.pdf',
        arquivo_tamanho: 1024,
        status: 'ativo' as const,
        ativo: true,
        campos: '[]',
      };

      const template = await createTemplate(input);

      expect(template).toBeDefined();
      expect(template.id).toBeDefined();
      expect(template.template_uuid).toBe(testUuid);
      expect(template.nome).toBe('Template de Teste Integração');
      expect(template.descricao).toBe('Descrição do template de teste');
      expect(template.ativo).toBe(true);

      testTemplateId = template.id;
    });

    it('deve criar template sem descrição', async () => {
      const uuid = `test-nodesc-${randomUUID()}`;
      const input = {
        template_uuid: uuid,
        nome: 'Template Sem Descrição',
        arquivo_original: 'https://example.com/test2.pdf',
        arquivo_nome: 'test2.pdf',
        arquivo_tamanho: 512,
      };

      const template = await createTemplate(input);

      expect(template).toBeDefined();
      expect(template.descricao).toBeNull();

      // Limpar
      await deleteTemplate(String(template.id));
    });

    it('deve criar template com campos mapeados', async () => {
      const uuid = `test-campos-${randomUUID()}`;
      const campos = JSON.stringify([
        { nome: 'Nome', variavel: 'cliente.nome', tipo: 'texto', posicao: { x: 100, y: 200, width: 200, height: 20, pagina: 1 } },
        { nome: 'CPF', variavel: 'cliente.cpf', tipo: 'texto', posicao: { x: 100, y: 230, width: 150, height: 20, pagina: 1 } },
      ]);

      const input = {
        template_uuid: uuid,
        nome: 'Template com Campos',
        arquivo_original: 'https://example.com/test3.pdf',
        arquivo_nome: 'test3.pdf',
        arquivo_tamanho: 2048,
        campos,
      };

      const template = await createTemplate(input);

      expect(template).toBeDefined();
      expect(template.campos).toBe(campos);

      // Limpar
      await deleteTemplate(String(template.id));
    });
  });

  describe('Listar Templates', () => {
    it('deve listar todos os templates', async () => {
      const result = await listTemplates();

      expect(result).toBeDefined();
      expect(Array.isArray(result.templates)).toBe(true);
      expect(typeof result.total).toBe('number');
    });

    it('deve listar apenas templates ativos', async () => {
      const result = await listTemplates({ ativo: true });

      expect(result).toBeDefined();
      expect(Array.isArray(result.templates)).toBe(true);
      result.templates.forEach((t) => {
        expect(t.ativo).toBe(true);
      });
    });

    it('deve buscar templates por nome', async () => {
      if (!testTemplateId) {
        console.log('Pulando teste - template não criado');
        return;
      }

      const result = await listTemplates({ search: 'Teste Integração' });

      expect(result).toBeDefined();
      expect(result.templates.length).toBeGreaterThan(0);
      expect(result.templates.some((t) => t.id === testTemplateId)).toBe(true);
    });

    it('deve filtrar por status', async () => {
      const result = await listTemplates({ status: 'ativo' });

      expect(result).toBeDefined();
      result.templates.forEach((t) => {
        expect(t.status).toBe('ativo');
      });
    });
  });

  describe('Buscar Template', () => {
    it('deve buscar template por ID numérico', async () => {
      if (!testTemplateId) {
        console.log('Pulando teste - template não criado');
        return;
      }

      const template = await getTemplate(String(testTemplateId));

      expect(template).toBeDefined();
      expect(template?.id).toBe(testTemplateId);
    });

    it('deve buscar template por UUID', async () => {
      if (!testTemplateId) {
        console.log('Pulando teste - template não criado');
        return;
      }

      const template = await getTemplate(testUuid);

      expect(template).toBeDefined();
      expect(template?.template_uuid).toBe(testUuid);
    });

    it('deve retornar null para ID inexistente', async () => {
      const template = await getTemplate('999999999');

      expect(template).toBeNull();
    });

    it('deve retornar null para UUID inexistente', async () => {
      const template = await getTemplate('uuid-inexistente-12345');

      expect(template).toBeNull();
    });
  });

  describe('Atualizar Template', () => {
    it('deve atualizar nome do template', async () => {
      if (!testTemplateId) {
        console.log('Pulando teste - template não criado');
        return;
      }

      const updated = await updateTemplate(String(testTemplateId), {
        nome: 'Template Atualizado',
      });

      expect(updated.nome).toBe('Template Atualizado');
    });

    it('deve atualizar descrição do template', async () => {
      if (!testTemplateId) {
        console.log('Pulando teste - template não criado');
        return;
      }

      const updated = await updateTemplate(String(testTemplateId), {
        descricao: 'Nova descrição',
      });

      expect(updated.descricao).toBe('Nova descrição');
    });

    it('deve desativar template', async () => {
      if (!testTemplateId) {
        console.log('Pulando teste - template não criado');
        return;
      }

      const updated = await updateTemplate(String(testTemplateId), {
        ativo: false,
      });

      expect(updated.ativo).toBe(false);

      // Restaurar para ativo
      await updateTemplate(String(testTemplateId), { ativo: true });
    });

    it('deve atualizar campos do template', async () => {
      if (!testTemplateId) {
        console.log('Pulando teste - template não criado');
        return;
      }

      const novosCampos = JSON.stringify([
        { nome: 'Assinatura', variavel: 'assinatura.imagem', tipo: 'assinatura', posicao: { x: 100, y: 500, width: 200, height: 60, pagina: 1 } },
      ]);

      const updated = await updateTemplate(String(testTemplateId), {
        campos: novosCampos,
      });

      expect(updated.campos).toBe(novosCampos);
    });
  });

  describe('Deletar Template', () => {
    it('deve deletar template existente', async () => {
      // Criar template para deletar
      const uuid = `test-delete-${randomUUID()}`;
      const template = await createTemplate({
        template_uuid: uuid,
        nome: 'Template para Deletar',
        arquivo_original: 'https://example.com/delete.pdf',
        arquivo_nome: 'delete.pdf',
        arquivo_tamanho: 100,
      });

      expect(template.id).toBeDefined();

      // Deletar
      await deleteTemplate(String(template.id));

      // Verificar que foi deletado
      const deleted = await getTemplate(String(template.id));
      expect(deleted).toBeNull();
    });
  });
});
