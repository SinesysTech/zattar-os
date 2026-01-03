import { renderHook, act } from '@testing-library/react';
import { useDisclosure } from '../use-disclosure';

describe('useDisclosure', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return initial state as false by default', () => {
    const { result } = renderHook(() => useDisclosure());
    expect(result.current.isOpen).toBe(false);
  });

  it('should respect defaultIsOpen option', () => {
    const { result } = renderHook(() => useDisclosure({ defaultIsOpen: true }));
    expect(result.current.isOpen).toBe(true);
  });

  it('should open when onOpen is called', () => {
    const { result } = renderHook(() => useDisclosure());

    expect(result.current.isOpen).toBe(false);

    act(() => {
      result.current.onOpen();
    });

    expect(result.current.isOpen).toBe(true);
  });

  it('should close when onClose is called', () => {
    const { result } = renderHook(() => useDisclosure({ defaultIsOpen: true }));

    expect(result.current.isOpen).toBe(true);

    act(() => {
      result.current.onClose();
    });

    expect(result.current.isOpen).toBe(false);
  });

  it('should toggle state when onToggle is called', () => {
    const { result } = renderHook(() => useDisclosure());

    expect(result.current.isOpen).toBe(false);

    act(() => {
      result.current.onToggle();
    });

    expect(result.current.isOpen).toBe(true);

    act(() => {
      result.current.onToggle();
    });

    expect(result.current.isOpen).toBe(false);
  });

  it('should handle multiple operations in sequence', () => {
    const { result } = renderHook(() => useDisclosure());

    expect(result.current.isOpen).toBe(false);

    act(() => {
      result.current.onOpen();
    });
    expect(result.current.isOpen).toBe(true);

    act(() => {
      result.current.onToggle();
    });
    expect(result.current.isOpen).toBe(false);

    act(() => {
      result.current.onToggle();
    });
    expect(result.current.isOpen).toBe(true);

    act(() => {
      result.current.onClose();
    });
    expect(result.current.isOpen).toBe(false);
  });

  it('should maintain state when onOpen is called multiple times', () => {
    const { result } = renderHook(() => useDisclosure());

    act(() => {
      result.current.onOpen();
    });
    expect(result.current.isOpen).toBe(true);

    act(() => {
      result.current.onOpen();
    });
    expect(result.current.isOpen).toBe(true);
  });

  it('should maintain state when onClose is called multiple times', () => {
    const { result } = renderHook(() => useDisclosure({ defaultIsOpen: true }));

    act(() => {
      result.current.onClose();
    });
    expect(result.current.isOpen).toBe(false);

    act(() => {
      result.current.onClose();
    });
    expect(result.current.isOpen).toBe(false);
  });

  it('should handle edge case: defaultIsOpen false', () => {
    const { result } = renderHook(() => useDisclosure({ defaultIsOpen: false }));
    expect(result.current.isOpen).toBe(false);
  });

  it('should provide all methods in return object', () => {
    const { result } = renderHook(() => useDisclosure());

    expect(result.current).toHaveProperty('isOpen');
    expect(result.current).toHaveProperty('onOpen');
    expect(result.current).toHaveProperty('onClose');
    expect(result.current).toHaveProperty('onToggle');
    expect(typeof result.current.onOpen).toBe('function');
    expect(typeof result.current.onClose).toBe('function');
    expect(typeof result.current.onToggle).toBe('function');
  });
});
