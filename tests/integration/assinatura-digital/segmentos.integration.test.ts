/**
 * Testes de Integração - API de Segmentos de Assinatura Digital
 *
 * Testa operações CRUD de segmentos via serviços.
 */

import { describe, it, expect, afterAll } from '@jest/globals';
import {
  listSegmentos,
  getSegmento,
  getSegmentoBySlug,
  createSegmento,
  updateSegmento,
  deleteSegmento,
} from '@/backend/assinatura-digital/services/segmentos.service';

describe('Segmentos de Assinatura Digital - Integração', () => {
  let testSegmentoId: number | null = null;
  const testSlug = `test-seg-${Date.now()}`;

  afterAll(async () => {
    // Limpar segmento de teste
    if (testSegmentoId) {
      try {
        await deleteSegmento(testSegmentoId);
      } catch {
        // Ignorar se já foi deletado
      }
    }
  });

  describe('Criar Segmento', () => {
    it('deve criar um segmento com dados válidos', async () => {
      const input = {
        nome: 'Segmento de Teste Integração',
        slug: testSlug,
        descricao: 'Descrição do segmento de teste',
        ativo: true,
      };

      const segmento = await createSegmento(input);

      expect(segmento).toBeDefined();
      expect(segmento.id).toBeDefined();
      expect(segmento.nome).toBe('Segmento de Teste Integração');
      expect(segmento.slug).toBe(testSlug);
      expect(segmento.descricao).toBe('Descrição do segmento de teste');
      expect(segmento.ativo).toBe(true);

      testSegmentoId = segmento.id;
    });

    it('deve criar segmento sem descrição', async () => {
      const slug = `test-nodesc-${Date.now()}`;
      const input = {
        nome: 'Segmento Sem Descrição',
        slug,
      };

      const segmento = await createSegmento(input);

      expect(segmento).toBeDefined();
      expect(segmento.descricao).toBeNull();

      // Limpar
      await deleteSegmento(segmento.id);
    });

    it('deve criar segmento inativo', async () => {
      const slug = `test-inativo-${Date.now()}`;
      const input = {
        nome: 'Segmento Inativo',
        slug,
        ativo: false,
      };

      const segmento = await createSegmento(input);

      expect(segmento).toBeDefined();
      expect(segmento.ativo).toBe(false);

      // Limpar
      await deleteSegmento(segmento.id);
    });
  });

  describe('Listar Segmentos', () => {
    it('deve listar todos os segmentos', async () => {
      const result = await listSegmentos();

      expect(result).toBeDefined();
      expect(Array.isArray(result.segmentos)).toBe(true);
      expect(typeof result.total).toBe('number');
    });

    it('deve listar apenas segmentos ativos', async () => {
      const result = await listSegmentos({ ativo: true });

      expect(result).toBeDefined();
      expect(Array.isArray(result.segmentos)).toBe(true);
      result.segmentos.forEach((s) => {
        expect(s.ativo).toBe(true);
      });
    });

    it('deve buscar segmentos por nome', async () => {
      if (!testSegmentoId) {
        console.log('Pulando teste - segmento não criado');
        return;
      }

      const result = await listSegmentos({ search: 'Teste Integração' });

      expect(result).toBeDefined();
      expect(result.segmentos.length).toBeGreaterThan(0);
      expect(result.segmentos.some((s) => s.id === testSegmentoId)).toBe(true);
    });

    it('deve incluir contagem de formulários', async () => {
      const result = await listSegmentos();

      expect(result).toBeDefined();
      result.segmentos.forEach((s) => {
        expect(typeof s.formularios_count).toBe('number');
      });
    });
  });

  describe('Buscar Segmento', () => {
    it('deve buscar segmento por ID', async () => {
      if (!testSegmentoId) {
        console.log('Pulando teste - segmento não criado');
        return;
      }

      const segmento = await getSegmento(testSegmentoId);

      expect(segmento).toBeDefined();
      expect(segmento?.id).toBe(testSegmentoId);
    });

    it('deve buscar segmento por slug', async () => {
      if (!testSegmentoId) {
        console.log('Pulando teste - segmento não criado');
        return;
      }

      const segmento = await getSegmentoBySlug(testSlug);

      expect(segmento).toBeDefined();
      expect(segmento?.slug).toBe(testSlug);
    });

    it('deve retornar null para ID inexistente', async () => {
      const segmento = await getSegmento(999999999);

      expect(segmento).toBeNull();
    });

    it('deve retornar null para slug inexistente', async () => {
      const segmento = await getSegmentoBySlug('slug-inexistente-12345');

      expect(segmento).toBeNull();
    });
  });

  describe('Atualizar Segmento', () => {
    it('deve atualizar nome do segmento', async () => {
      if (!testSegmentoId) {
        console.log('Pulando teste - segmento não criado');
        return;
      }

      const updated = await updateSegmento(testSegmentoId, {
        nome: 'Segmento Atualizado',
      });

      expect(updated.nome).toBe('Segmento Atualizado');
    });

    it('deve atualizar descrição do segmento', async () => {
      if (!testSegmentoId) {
        console.log('Pulando teste - segmento não criado');
        return;
      }

      const updated = await updateSegmento(testSegmentoId, {
        descricao: 'Nova descrição',
      });

      expect(updated.descricao).toBe('Nova descrição');
    });

    it('deve desativar segmento', async () => {
      if (!testSegmentoId) {
        console.log('Pulando teste - segmento não criado');
        return;
      }

      const updated = await updateSegmento(testSegmentoId, {
        ativo: false,
      });

      expect(updated.ativo).toBe(false);

      // Restaurar para ativo
      await updateSegmento(testSegmentoId, { ativo: true });
    });
  });

  describe('Deletar Segmento', () => {
    it('deve deletar segmento existente', async () => {
      // Criar segmento para deletar
      const slug = `test-delete-${Date.now()}`;
      const segmento = await createSegmento({
        nome: 'Segmento para Deletar',
        slug,
      });

      expect(segmento.id).toBeDefined();

      // Deletar
      await deleteSegmento(segmento.id);

      // Verificar que foi deletado
      const deleted = await getSegmento(segmento.id);
      expect(deleted).toBeNull();
    });
  });
});
