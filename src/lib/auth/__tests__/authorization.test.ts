import { describe, it, expect, jest, beforeEach, afterEach } from "@jest/globals";
import {
  checkPermission,
  checkMultiplePermissions,
  invalidarCacheUsuario,
  limparCacheExpirado,
  getCacheStats,
} from '../authorization';
import { createServiceClient } from '@/lib/supabase/service-client';
import { isPermissaoValida } from '@/app/(authenticated)/usuarios';

jest.mock('@/lib/supabase/service-client');
jest.mock('@/app/(authenticated)/usuarios', () => ({
  isPermissaoValida: jest.fn(),
}));

const mockCreateServiceClient = createServiceClient as jest.MockedFunction<any>;
const mockIsPermissaoValida = isPermissaoValida as jest.MockedFunction<any>;

// Helper function to mock the Supabase chain
const createSupabaseMock = (userResult: any, permissionResult: any = null) => {
  const singlePermissoes = jest.fn().mockResolvedValue(permissionResult);
  // permissions query chains 3 .eq() calls before .single()
  const eq3 = jest.fn().mockReturnValue({ single: singlePermissoes });
  const eq2 = jest.fn().mockReturnValue({ eq: eq3 });
  const eq1 = jest.fn().mockReturnValue({ eq: eq2 });
  const selectPermissoes = jest.fn().mockReturnValue({ eq: eq1 });

  const singleUsuarios = jest.fn().mockResolvedValue(userResult);
  const eqUsuario = jest.fn().mockReturnValue({ single: singleUsuarios });
  const selectUsuarios = jest.fn().mockReturnValue({ eq: eqUsuario });

  const from = jest.fn((table: string) => {
    if (table === 'usuarios') return { select: selectUsuarios };
    if (table === 'permissoes') return { select: selectPermissoes };
    return {};
  });

  return { from };
};

describe('Authorization Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default valid permission
    mockIsPermissaoValida.mockReturnValue(true);

    // Hard reset cache to avoid state leaking between tests
    const originalDateNow = Date.now;
    Date.now = jest.fn(() => originalDateNow() + 24 * 60 * 60 * 1000);
    limparCacheExpirado();
    Date.now = originalDateNow;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Cache Management', () => {
    it('invalidarCacheUsuario deve remover apenas o cache do usuario especificado', async () => {
      // Setup mock to return true for everyone
      mockCreateServiceClient.mockReturnValue(createSupabaseMock({ data: { is_super_admin: true }, error: null }));

      // Populate cache
      await checkPermission(1, 'contratos', 'criar');
      await checkPermission(2, 'contratos', 'criar');

      let stats = getCacheStats();
      expect(stats.total).toBe(2);

      invalidarCacheUsuario(1);

      stats = getCacheStats();
      expect(stats.total).toBe(1);

      // Verify user 2 is still cached
      mockCreateServiceClient.mockClear();
      await checkPermission(2, 'contratos', 'criar');
      expect(mockCreateServiceClient).not.toHaveBeenCalled();
    });

    it('limparCacheExpirado deve remover apenas as entradas expiradas', async () => {
      mockCreateServiceClient.mockReturnValue(createSupabaseMock({ data: { is_super_admin: true }, error: null }));

      const realDateNow = Date.now.bind(global.Date);
      let currentTime = realDateNow();

      // Mock Date.now to control time
      const dateSpy = jest.spyOn(global.Date, 'now').mockImplementation(() => currentTime);

      // Add entry that will expire
      await checkPermission(1, 'contratos', 'criar');

      // Move time forward by 3 minutes (cache TTL is 5 min)
      currentTime += 3 * 60 * 1000;

      // Add entry that will not expire soon
      await checkPermission(2, 'contratos', 'criar');

      let stats = getCacheStats();
      expect(stats.total).toBe(2);
      expect(stats.ativas).toBe(2);

      // Move time forward by another 3 minutes (total 6 mins for first entry)
      currentTime += 3 * 60 * 1000;

      stats = getCacheStats();
      expect(stats.expiradas).toBe(1);
      expect(stats.ativas).toBe(1);

      limparCacheExpirado();

      stats = getCacheStats();
      expect(stats.total).toBe(1);
      expect(stats.ativas).toBe(1);
      expect(stats.expiradas).toBe(0);

      dateSpy.mockRestore();
    });

    it('getCacheStats deve retornar contagens precisas', async () => {
      mockCreateServiceClient.mockReturnValue(createSupabaseMock({ data: { is_super_admin: true }, error: null }));

      const realDateNow = Date.now.bind(global.Date);
      let currentTime = realDateNow();
      const dateSpy = jest.spyOn(global.Date, 'now').mockImplementation(() => currentTime);

      await checkPermission(1, 'contratos', 'criar');
      await checkPermission(2, 'contratos', 'criar');

      currentTime += 6 * 60 * 1000; // Move past TTL

      await checkPermission(3, 'contratos', 'criar');

      const stats = getCacheStats();
      expect(stats.total).toBe(3);
      expect(stats.ativas).toBe(1);
      expect(stats.expiradas).toBe(2);

      dateSpy.mockRestore();
    });
  });

  describe('checkPermission', () => {
    it('deve retornar false se a permissao for invalida', async () => {
      mockIsPermissaoValida.mockReturnValue(false);

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await checkPermission(1, 'invalid_resource', 'invalid_action');

      expect(result).toBe(false);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Tentativa de verificar permissão inválida: invalid_resource.invalid_action'
      );
      expect(mockCreateServiceClient).not.toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });

    it('deve retornar true se o usuario for super_admin (e fazer cache)', async () => {
      mockCreateServiceClient.mockReturnValue(
        createSupabaseMock({ data: { is_super_admin: true }, error: null })
      );

      const result = await checkPermission(1, 'contratos', 'criar');

      expect(result).toBe(true);
      expect(mockCreateServiceClient).toHaveBeenCalledTimes(1);

      // Second call should hit cache
      mockCreateServiceClient.mockClear();
      const cachedResult = await checkPermission(1, 'contratos', 'criar');

      expect(cachedResult).toBe(true);
      expect(mockCreateServiceClient).not.toHaveBeenCalled();
    });

    it('deve consultar a tabela de permissoes para usuarios comuns', async () => {
      const supabaseMock = createSupabaseMock(
        { data: { is_super_admin: false }, error: null },
        { data: { permitido: true }, error: null }
      );
      mockCreateServiceClient.mockReturnValue(supabaseMock);

      const result = await checkPermission(1, 'contratos', 'criar');

      expect(result).toBe(true);

      // Verify the queries were made correctly (from users then permissions)
      expect(supabaseMock.from).toHaveBeenCalledWith('usuarios');
      expect(supabaseMock.from).toHaveBeenCalledWith('permissoes');
    });

    it('deve retornar false e fazer cache se permissao nao encontrada (PGRST116)', async () => {
       const supabaseMock = createSupabaseMock(
        { data: { is_super_admin: false }, error: null },
        { data: null, error: { code: 'PGRST116' } }
      );
      mockCreateServiceClient.mockReturnValue(supabaseMock);

      const result = await checkPermission(1, 'contratos', 'criar');

      expect(result).toBe(false);

      // Verify it was cached
      mockCreateServiceClient.mockClear();
      const cachedResult = await checkPermission(1, 'contratos', 'criar');
      expect(cachedResult).toBe(false);
      expect(mockCreateServiceClient).not.toHaveBeenCalled();
    });

    it('deve retornar false em caso de erro ao buscar permissao (e nao fazer cache)', async () => {
      const supabaseMock = createSupabaseMock(
        { data: { is_super_admin: false }, error: null },
        { data: null, error: { message: 'Some database error' } }
      );
      mockCreateServiceClient.mockReturnValue(supabaseMock);
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const result = await checkPermission(1, 'contratos', 'criar');

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalled();

      // Verify it was NOT cached
      mockCreateServiceClient.mockClear();
      await checkPermission(1, 'contratos', 'criar');
      expect(mockCreateServiceClient).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('deve prosseguir normalmente se a coluna is_super_admin nao existir (PGRST204)', async () => {
       const supabaseMock = createSupabaseMock(
        { data: null, error: { code: 'PGRST204' } },
        { data: { permitido: true }, error: null }
      );
      mockCreateServiceClient.mockReturnValue(supabaseMock);
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await checkPermission(1, 'contratos', 'criar');

      expect(result).toBe(true);
      expect(consoleWarnSpy).toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });
  });

  describe('checkMultiplePermissions', () => {
    it('deve retornar true quando requireAll=true e tem todas', async () => {
      // Setup: user 1 is superadmin, has everything
      mockCreateServiceClient.mockReturnValue(
        createSupabaseMock({ data: { is_super_admin: true }, error: null })
      );

      const result = await checkMultiplePermissions(1, [
        ['contratos', 'criar'],
        ['audiencias', 'editar']
      ], true);

      expect(result).toBe(true);
    });

    it('deve retornar false quando requireAll=true e falta pelo menos uma', async () => {
       // Setup to return false for the second check
       const mockSupabase = {
           from: jest.fn((table: string) => {
              if (table === 'usuarios') {
                  return {
                     select: () => ({ eq: () => ({ single: async () => ({ data: { is_super_admin: false }, error: null }) }) })
                  }
              }
              if (table === 'permissoes') {
                  return {
                     select: () => ({ eq: () => ({ eq: (_col: any, recurso: string) => ({ eq: (_col: any, _operacao: string) => ({
                         single: async () => {
                            if (recurso === 'contratos') return { data: { permitido: true }, error: null };
                            return { data: null, error: { code: 'PGRST116' } }; // Not permitted for others
                         }
                     }) }) }) })
                  }
              }
           })
       };
       mockCreateServiceClient.mockReturnValue(mockSupabase);

       const result = await checkMultiplePermissions(1, [
        ['contratos', 'criar'],
        ['audiencias', 'editar']
      ], true);

      expect(result).toBe(false);
    });

    it('deve retornar true quando requireAll=false e tem pelo menos uma', async () => {
        // Setup to return false for the second check, true for first
       const mockSupabase = {
           from: jest.fn((table: string) => {
              if (table === 'usuarios') {
                  return {
                     select: () => ({ eq: () => ({ single: async () => ({ data: { is_super_admin: false }, error: null }) }) })
                  }
              }
              if (table === 'permissoes') {
                  return {
                     select: () => ({ eq: () => ({ eq: (_col: any, recurso: string) => ({ eq: (_col: any, _operacao: string) => ({
                         single: async () => {
                            if (recurso === 'contratos') return { data: { permitido: true }, error: null };
                            return { data: null, error: { code: 'PGRST116' } }; // Not permitted for others
                         }
                     }) }) }) })
                  }
              }
           })
       };
       mockCreateServiceClient.mockReturnValue(mockSupabase);

       const result = await checkMultiplePermissions(1, [
        ['audiencias', 'editar'], // Will fail
        ['contratos', 'criar'],   // Will succeed
      ], false);

      expect(result).toBe(true);
    });
  });
});
