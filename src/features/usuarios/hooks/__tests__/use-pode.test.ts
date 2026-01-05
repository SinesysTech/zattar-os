/**
 * Tests for usePode hook - simplified permission checking
 *
 * Tests permission verification, super admin handling, loading states, and SSR safety
 */

import { renderHook, waitFor as _waitFor } from '@testing-library/react';
import { usePode } from '../use-pode';
import { useMinhasPermissoes } from '../use-minhas-permissoes';
import type { MinhasPermissoesData } from '../use-minhas-permissoes';

// Mock useMinhasPermissoes
jest.mock('../use-minhas-permissoes');
const mockUseMinhasPermissoes = useMinhasPermissoes as jest.MockedFunction<
  typeof useMinhasPermissoes
>;

describe('usePode hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Permission Checking', () => {
    it('should return true when user has the specific permission', () => {
      const mockData: MinhasPermissoesData = {
        usuarioId: 1,
        isSuperAdmin: false,
        permissoes: [
          { id: 1, recurso: 'processos', operacao: 'criar', permitido: true },
          { id: 2, recurso: 'processos', operacao: 'editar', permitido: true },
        ],
      };

      mockUseMinhasPermissoes.mockReturnValue({
        data: mockData,
        isLoading: false,
        error: null,
        temPermissao: jest.fn(),
        refetch: jest.fn(),
      });

      const { result } = renderHook(() => usePode('processos', 'criar'));
      expect(result.current).toBe(true);
    });

    it('should return false when user does not have the specific permission', () => {
      const mockData: MinhasPermissoesData = {
        usuarioId: 1,
        isSuperAdmin: false,
        permissoes: [
          { id: 1, recurso: 'processos', operacao: 'visualizar', permitido: true },
        ],
      };

      mockUseMinhasPermissoes.mockReturnValue({
        data: mockData,
        isLoading: false,
        error: null,
        temPermissao: jest.fn(),
        refetch: jest.fn(),
      });

      const { result } = renderHook(() => usePode('processos', 'criar'));
      expect(result.current).toBe(false);
    });

    it('should return false when permission exists but is not permitido', () => {
      const mockData: MinhasPermissoesData = {
        usuarioId: 1,
        isSuperAdmin: false,
        permissoes: [
          { id: 1, recurso: 'processos', operacao: 'criar', permitido: false },
        ],
      };

      mockUseMinhasPermissoes.mockReturnValue({
        data: mockData,
        isLoading: false,
        error: null,
        temPermissao: jest.fn(),
        refetch: jest.fn(),
      });

      const { result } = renderHook(() => usePode('processos', 'criar'));
      expect(result.current).toBe(false);
    });

    it('should return false for non-existent resource', () => {
      const mockData: MinhasPermissoesData = {
        usuarioId: 1,
        isSuperAdmin: false,
        permissoes: [
          { id: 1, recurso: 'processos', operacao: 'criar', permitido: true },
        ],
      };

      mockUseMinhasPermissoes.mockReturnValue({
        data: mockData,
        isLoading: false,
        error: null,
        temPermissao: jest.fn(),
        refetch: jest.fn(),
      });

      const { result } = renderHook(() => usePode('usuarios', 'criar'));
      expect(result.current).toBe(false);
    });

    it('should return false for non-existent operation', () => {
      const mockData: MinhasPermissoesData = {
        usuarioId: 1,
        isSuperAdmin: false,
        permissoes: [
          { id: 1, recurso: 'processos', operacao: 'criar', permitido: true },
        ],
      };

      mockUseMinhasPermissoes.mockReturnValue({
        data: mockData,
        isLoading: false,
        error: null,
        temPermissao: jest.fn(),
        refetch: jest.fn(),
      });

      const { result } = renderHook(() => usePode('processos', 'excluir'));
      expect(result.current).toBe(false);
    });
  });

  describe('Super Admin Handling', () => {
    it('should return true for any permission when user is super admin', () => {
      const mockData: MinhasPermissoesData = {
        usuarioId: 1,
        isSuperAdmin: true,
        permissoes: [], // Sem permissões explícitas
      };

      mockUseMinhasPermissoes.mockReturnValue({
        data: mockData,
        isLoading: false,
        error: null,
        temPermissao: jest.fn(),
        refetch: jest.fn(),
      });

      const { result: result1 } = renderHook(() => usePode('processos', 'criar'));
      expect(result1.current).toBe(true);

      const { result: result2 } = renderHook(() => usePode('usuarios', 'excluir'));
      expect(result2.current).toBe(true);

      const { result: result3 } = renderHook(() =>
        usePode('any-resource', 'any-operation')
      );
      expect(result3.current).toBe(true);
    });

    it('should prioritize super admin over explicit permissions', () => {
      const mockData: MinhasPermissoesData = {
        usuarioId: 1,
        isSuperAdmin: true,
        permissoes: [
          // Mesmo com permissão negada explícita, super admin passa
          { id: 1, recurso: 'processos', operacao: 'criar', permitido: false },
        ],
      };

      mockUseMinhasPermissoes.mockReturnValue({
        data: mockData,
        isLoading: false,
        error: null,
        temPermissao: jest.fn(),
        refetch: jest.fn(),
      });

      const { result } = renderHook(() => usePode('processos', 'criar'));
      expect(result.current).toBe(true);
    });
  });

  describe('Loading States', () => {
    it('should return false when loading', () => {
      mockUseMinhasPermissoes.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
        temPermissao: jest.fn(),
        refetch: jest.fn(),
      });

      const { result } = renderHook(() => usePode('processos', 'criar'));
      expect(result.current).toBe(false);
    });

    it('should return false when data is null', () => {
      mockUseMinhasPermissoes.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
        temPermissao: jest.fn(),
        refetch: jest.fn(),
      });

      const { result } = renderHook(() => usePode('processos', 'criar'));
      expect(result.current).toBe(false);
    });

    it('should transition from false to true when loading completes', async () => {
      // Start with loading state
      mockUseMinhasPermissoes.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
        temPermissao: jest.fn(),
        refetch: jest.fn(),
      });

      const { result, rerender } = renderHook(() => usePode('processos', 'criar'));
      expect(result.current).toBe(false);

      // Complete loading with permission
      const mockData: MinhasPermissoesData = {
        usuarioId: 1,
        isSuperAdmin: false,
        permissoes: [
          { id: 1, recurso: 'processos', operacao: 'criar', permitido: true },
        ],
      };

      mockUseMinhasPermissoes.mockReturnValue({
        data: mockData,
        isLoading: false,
        error: null,
        temPermissao: jest.fn(),
        refetch: jest.fn(),
      });

      rerender();
      expect(result.current).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should return false when there is an error', () => {
      mockUseMinhasPermissoes.mockReturnValue({
        data: null,
        isLoading: false,
        error: 'Failed to fetch permissions',
        temPermissao: jest.fn(),
        refetch: jest.fn(),
      });

      const { result } = renderHook(() => usePode('processos', 'criar'));
      expect(result.current).toBe(false);
    });

    it('should return to normal after error is cleared', () => {
      // Start with error
      mockUseMinhasPermissoes.mockReturnValue({
        data: null,
        isLoading: false,
        error: 'Error',
        temPermissao: jest.fn(),
        refetch: jest.fn(),
      });

      const { result, rerender } = renderHook(() => usePode('processos', 'criar'));
      expect(result.current).toBe(false);

      // Clear error and provide data
      const mockData: MinhasPermissoesData = {
        usuarioId: 1,
        isSuperAdmin: false,
        permissoes: [
          { id: 1, recurso: 'processos', operacao: 'criar', permitido: true },
        ],
      };

      mockUseMinhasPermissoes.mockReturnValue({
        data: mockData,
        isLoading: false,
        error: null,
        temPermissao: jest.fn(),
        refetch: jest.fn(),
      });

      rerender();
      expect(result.current).toBe(true);
    });
  });

  describe('Multiple Permissions', () => {
    it('should correctly check permissions among multiple permissions', () => {
      const mockData: MinhasPermissoesData = {
        usuarioId: 1,
        isSuperAdmin: false,
        permissoes: [
          { id: 1, recurso: 'processos', operacao: 'criar', permitido: true },
          { id: 2, recurso: 'processos', operacao: 'editar', permitido: true },
          { id: 3, recurso: 'processos', operacao: 'visualizar', permitido: true },
          { id: 4, recurso: 'usuarios', operacao: 'criar', permitido: true },
          { id: 5, recurso: 'usuarios', operacao: 'excluir', permitido: false },
        ],
      };

      mockUseMinhasPermissoes.mockReturnValue({
        data: mockData,
        isLoading: false,
        error: null,
        temPermissao: jest.fn(),
        refetch: jest.fn(),
      });

      // Should find existing allowed permissions
      expect(renderHook(() => usePode('processos', 'criar')).result.current).toBe(
        true
      );
      expect(renderHook(() => usePode('processos', 'editar')).result.current).toBe(
        true
      );
      expect(renderHook(() => usePode('usuarios', 'criar')).result.current).toBe(
        true
      );

      // Should reject non-allowed permission
      expect(renderHook(() => usePode('usuarios', 'excluir')).result.current).toBe(
        false
      );

      // Should reject non-existent permission
      expect(renderHook(() => usePode('clientes', 'criar')).result.current).toBe(
        false
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty permissions array', () => {
      const mockData: MinhasPermissoesData = {
        usuarioId: 1,
        isSuperAdmin: false,
        permissoes: [],
      };

      mockUseMinhasPermissoes.mockReturnValue({
        data: mockData,
        isLoading: false,
        error: null,
        temPermissao: jest.fn(),
        refetch: jest.fn(),
      });

      const { result } = renderHook(() => usePode('processos', 'criar'));
      expect(result.current).toBe(false);
    });

    it('should be case-sensitive for resource and operation', () => {
      const mockData: MinhasPermissoesData = {
        usuarioId: 1,
        isSuperAdmin: false,
        permissoes: [
          { id: 1, recurso: 'processos', operacao: 'criar', permitido: true },
        ],
      };

      mockUseMinhasPermissoes.mockReturnValue({
        data: mockData,
        isLoading: false,
        error: null,
        temPermissao: jest.fn(),
        refetch: jest.fn(),
      });

      // Exact match should work
      expect(renderHook(() => usePode('processos', 'criar')).result.current).toBe(
        true
      );

      // Different case should fail
      expect(renderHook(() => usePode('Processos', 'criar')).result.current).toBe(
        false
      );
      expect(renderHook(() => usePode('processos', 'Criar')).result.current).toBe(
        false
      );
    });

    it('should handle different usuarios without interference', () => {
      const mockData1: MinhasPermissoesData = {
        usuarioId: 1,
        isSuperAdmin: false,
        permissoes: [
          { id: 1, recurso: 'processos', operacao: 'criar', permitido: true },
        ],
      };

      mockUseMinhasPermissoes.mockReturnValue({
        data: mockData1,
        isLoading: false,
        error: null,
        temPermissao: jest.fn(),
        refetch: jest.fn(),
      });

      const { result: result1 } = renderHook(() => usePode('processos', 'criar'));
      expect(result1.current).toBe(true);

      // Change to different user with different permissions
      const mockData2: MinhasPermissoesData = {
        usuarioId: 2,
        isSuperAdmin: false,
        permissoes: [
          { id: 1, recurso: 'usuarios', operacao: 'visualizar', permitido: true },
        ],
      };

      mockUseMinhasPermissoes.mockReturnValue({
        data: mockData2,
        isLoading: false,
        error: null,
        temPermissao: jest.fn(),
        refetch: jest.fn(),
      });

      const { result: result2 } = renderHook(() => usePode('processos', 'criar'));
      expect(result2.current).toBe(false);

      const { result: result3 } = renderHook(() =>
        usePode('usuarios', 'visualizar')
      );
      expect(result3.current).toBe(true);
    });
  });

  describe('SSR Safety', () => {
    it('should handle SSR environment gracefully', () => {
      // Simulate SSR by having data be null and isLoading false
      mockUseMinhasPermissoes.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
        temPermissao: jest.fn(),
        refetch: jest.fn(),
      });

      const { result } = renderHook(() => usePode('processos', 'criar'));
      expect(result.current).toBe(false);
    });
  });
});
