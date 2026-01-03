// @ts-nocheck
import { renderHook, waitFor, act } from '@testing-library/react';
import { useUsuarioPermissoes } from '../use-usuario-permissoes';
import { actionListarPermissoes, actionSalvarPermissoes } from '../../actions/permissoes-actions';

jest.mock('../../actions/permissoes-actions', () => ({
  actionListarPermissoes: jest.fn(),
  actionSalvarPermissoes: jest.fn(),
}));

const mockActionListarPermissoes = actionListarPermissoes as jest.Mock;
const mockActionSalvarPermissoes = actionSalvarPermissoes as jest.Mock;

describe('useUsuarioPermissoes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should fetch permissions on mount', async () => {
    const mockPermissoes = [
      { recurso: 'processos', operacao: 'criar', permitido: true },
      { recurso: 'processos', operacao: 'editar', permitido: false },
    ];

    mockActionListarPermissoes.mockResolvedValueOnce({
      success: true,
      data: mockPermissoes,
    });

    const { result } = renderHook(() => useUsuarioPermissoes(1));

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockActionListarPermissoes).toHaveBeenCalledWith(1);
  });

  it('should format permissions into matriz correctly', async () => {
    const mockPermissoes = [
      { recurso: 'processos', operacao: 'criar', permitido: true },
      { recurso: 'processos', operacao: 'editar', permitido: false },
      { recurso: 'financeiro', operacao: 'criar', permitido: true },
    ];

    mockActionListarPermissoes.mockResolvedValueOnce({
      success: true,
      data: mockPermissoes,
    });

    const { result } = renderHook(() => useUsuarioPermissoes(1));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.matriz).toEqual([
      { recurso: 'processos', operacao: 'criar', permitido: true },
      { recurso: 'processos', operacao: 'editar', permitido: false },
      { recurso: 'financeiro', operacao: 'criar', permitido: true },
    ]);
  });

  it('should toggle permission correctly', async () => {
    const mockPermissoes = [
      { recurso: 'processos', operacao: 'criar', permitido: true },
      { recurso: 'processos', operacao: 'editar', permitido: false },
    ];

    mockActionListarPermissoes.mockResolvedValueOnce({
      success: true,
      data: mockPermissoes,
    });

    const { result } = renderHook(() => useUsuarioPermissoes(1));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.togglePermissao('processos', 'criar');
    });

    const updatedMatriz = result.current.matriz.find(
      p => p.recurso === 'processos' && p.operacao === 'criar'
    );
    expect(updatedMatriz?.permitido).toBe(false);
  });

  it('should save permissions correctly', async () => {
    const mockPermissoes = [
      { recurso: 'processos', operacao: 'criar', permitido: true },
    ];

    mockActionListarPermissoes.mockResolvedValueOnce({
      success: true,
      data: mockPermissoes,
    });

    mockActionSalvarPermissoes.mockResolvedValueOnce({
      success: true,
    });

    const { result } = renderHook(() => useUsuarioPermissoes(1));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.togglePermissao('processos', 'criar');
    });

    await act(async () => {
      await result.current.save();
    });

    await waitFor(() => {
      expect(mockActionSalvarPermissoes).toHaveBeenCalledWith(1, [
        { recurso: 'processos', operacao: 'criar', permitido: false },
      ]);
    });
  });

  it('should set isSaving during save operation', async () => {
    const mockPermissoes = [
      { recurso: 'processos', operacao: 'criar', permitido: true },
    ];

    mockActionListarPermissoes.mockResolvedValueOnce({
      success: true,
      data: mockPermissoes,
    });

    mockActionSalvarPermissoes.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
    );

    const { result } = renderHook(() => useUsuarioPermissoes(1));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.save();
    });

    expect(result.current.isSaving).toBe(true);

    await waitFor(() => {
      expect(result.current.isSaving).toBe(false);
    });
  });

  it('should reset matriz to original state', async () => {
    const mockPermissoes = [
      { recurso: 'processos', operacao: 'criar', permitido: true },
    ];

    mockActionListarPermissoes.mockResolvedValueOnce({
      success: true,
      data: mockPermissoes,
    });

    const { result } = renderHook(() => useUsuarioPermissoes(1));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const originalMatriz = [...result.current.matriz];

    act(() => {
      result.current.togglePermissao('processos', 'criar');
    });

    expect(result.current.matriz).not.toEqual(originalMatriz);

    act(() => {
      result.current.resetar();
    });

    expect(result.current.matriz).toEqual(originalMatriz);
  });

  it('should detect changes correctly with hasChanges', async () => {
    const mockPermissoes = [
      { recurso: 'processos', operacao: 'criar', permitido: true },
    ];

    mockActionListarPermissoes.mockResolvedValueOnce({
      success: true,
      data: mockPermissoes,
    });

    const { result } = renderHook(() => useUsuarioPermissoes(1));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hasChanges).toBe(false);

    act(() => {
      result.current.togglePermissao('processos', 'criar');
    });

    expect(result.current.hasChanges).toBe(true);

    act(() => {
      result.current.resetar();
    });

    expect(result.current.hasChanges).toBe(false);
  });

  it('should handle fetch error', async () => {
    mockActionListarPermissoes.mockResolvedValueOnce({
      success: false,
      error: 'Erro ao buscar permissões',
    });

    const { result } = renderHook(() => useUsuarioPermissoes(1));

    await waitFor(() => {
      expect(result.current.error).toBe('Erro ao buscar permissões');
    });

    expect(result.current.isLoading).toBe(false);
  });

  it('should handle save error', async () => {
    const mockPermissoes = [
      { recurso: 'processos', operacao: 'criar', permitido: true },
    ];

    mockActionListarPermissoes.mockResolvedValueOnce({
      success: true,
      data: mockPermissoes,
    });

    mockActionSalvarPermissoes.mockResolvedValueOnce({
      success: false,
      error: 'Erro ao salvar permissões',
    });

    const { result } = renderHook(() => useUsuarioPermissoes(1));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.togglePermissao('processos', 'criar');
    });

    await act(async () => {
      await result.current.save();
    });

    await waitFor(() => {
      expect(result.current.error).toBe('Erro ao salvar permissões');
      expect(result.current.isSaving).toBe(false);
    });
  });

  it('should handle multiple toggles', async () => {
    const mockPermissoes = [
      { recurso: 'processos', operacao: 'criar', permitido: true },
      { recurso: 'processos', operacao: 'editar', permitido: false },
      { recurso: 'financeiro', operacao: 'criar', permitido: true },
    ];

    mockActionListarPermissoes.mockResolvedValueOnce({
      success: true,
      data: mockPermissoes,
    });

    const { result } = renderHook(() => useUsuarioPermissoes(1));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.togglePermissao('processos', 'criar');
      result.current.togglePermissao('processos', 'editar');
      result.current.togglePermissao('financeiro', 'criar');
    });

    expect(result.current.matriz).toEqual([
      { recurso: 'processos', operacao: 'criar', permitido: false },
      { recurso: 'processos', operacao: 'editar', permitido: true },
      { recurso: 'financeiro', operacao: 'criar', permitido: false },
    ]);
  });

  it('should convert matriz to permissoes array correctly on save', async () => {
    const mockPermissoes = [
      { recurso: 'processos', operacao: 'criar', permitido: true },
      { recurso: 'processos', operacao: 'editar', permitido: false },
    ];

    mockActionListarPermissoes.mockResolvedValueOnce({
      success: true,
      data: mockPermissoes,
    });

    mockActionSalvarPermissoes.mockResolvedValueOnce({
      success: true,
    });

    const { result } = renderHook(() => useUsuarioPermissoes(1));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.togglePermissao('processos', 'criar');
    });

    await act(async () => {
      await result.current.save();
    });

    await waitFor(() => {
      expect(mockActionSalvarPermissoes).toHaveBeenCalledWith(1, [
        { recurso: 'processos', operacao: 'criar', permitido: false },
        { recurso: 'processos', operacao: 'editar', permitido: false },
      ]);
    });
  });

  it('should reset hasChanges after successful save', async () => {
    const mockPermissoes = [
      { recurso: 'processos', operacao: 'criar', permitido: true },
    ];

    mockActionListarPermissoes.mockResolvedValueOnce({
      success: true,
      data: mockPermissoes,
    });

    mockActionSalvarPermissoes.mockResolvedValueOnce({
      success: true,
    });

    const { result } = renderHook(() => useUsuarioPermissoes(1));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.togglePermissao('processos', 'criar');
    });

    expect(result.current.hasChanges).toBe(true);

    await act(async () => {
      await result.current.save();
    });

    await waitFor(() => {
      expect(result.current.hasChanges).toBe(false);
    });
  });
});
