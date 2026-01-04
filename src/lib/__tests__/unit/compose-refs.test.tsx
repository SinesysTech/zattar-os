/**
 * Testes Unitários para Compose Refs
 *
 * Valida hook useComposedRefs para compor múltiplos refs React
 */

import { renderHook } from '@testing-library/react';
import { useRef, createRef, MutableRefObject, type Ref } from 'react';
import { useComposedRefs } from '@/lib/compose-refs';

describe('Compose Refs - Unit Tests', () => {
  describe('useComposedRefs', () => {
    describe('Ref Callback', () => {
      it('deve chamar ref callback com node', () => {
        const callback = jest.fn();
        const { result } = renderHook(() => useComposedRefs(callback));

        const node = document.createElement('div');
        result.current(node);

        expect(callback).toHaveBeenCalledWith(node);
        expect(callback).toHaveBeenCalledTimes(1);
      });

      it('deve chamar ref callback com null', () => {
        const callback = jest.fn();
        const { result } = renderHook(() => useComposedRefs(callback));

        result.current(null);

        expect(callback).toHaveBeenCalledWith(null);
      });

      it('deve chamar múltiplos callbacks', () => {
        const callback1 = jest.fn();
        const callback2 = jest.fn();
        const callback3 = jest.fn();
        const { result } = renderHook(() =>
          useComposedRefs(callback1, callback2, callback3)
        );

        const node = document.createElement('div');
        result.current(node);

        expect(callback1).toHaveBeenCalledWith(node);
        expect(callback2).toHaveBeenCalledWith(node);
        expect(callback3).toHaveBeenCalledWith(node);
      });
    });

    describe('Ref Object', () => {
      it('deve atualizar ref object', () => {
        const ref = { current: null } as MutableRefObject<HTMLDivElement | null>;
        const { result } = renderHook(() => useComposedRefs(ref));

        const node = document.createElement('div');
        result.current(node);

        expect(ref.current).toBe(node);
      });

      it('deve atualizar ref criado com createRef', () => {
        const ref = createRef<HTMLDivElement>();
        const { result } = renderHook(() => useComposedRefs(ref as Ref<HTMLDivElement>));

        const node = document.createElement('div');
        result.current(node);

        expect(ref.current).toBe(node);
      });

      it('deve atualizar ref criado com useRef', () => {
        const { result: refResult } = renderHook(() => useRef<HTMLDivElement>(null));
        const { result } = renderHook(() => useComposedRefs(refResult.current));

        const node = document.createElement('div');
        result.current(node);

        expect(refResult.current.current).toBe(node);
      });

      it('deve limpar ref object quando node é null', () => {
        const ref = { current: document.createElement('div') } as MutableRefObject<HTMLDivElement | null>;
        const { result } = renderHook(() => useComposedRefs(ref));

        result.current(null);

        expect(ref.current).toBeNull();
      });
    });

    describe('Múltiplos Refs', () => {
      it('deve chamar callback e atualizar object', () => {
        const callback = jest.fn();
        const ref = { current: null } as MutableRefObject<HTMLDivElement | null>;
        const { result } = renderHook(() => useComposedRefs(callback, ref));

        const node = document.createElement('div');
        result.current(node);

        expect(callback).toHaveBeenCalledWith(node);
        expect(ref.current).toBe(node);
      });

      it('deve lidar com múltiplos refs de tipos diferentes', () => {
        const callback1 = jest.fn();
        const callback2 = jest.fn();
        const ref1 = { current: null } as MutableRefObject<HTMLDivElement | null>;
        const ref2 = { current: null } as MutableRefObject<HTMLDivElement | null>;

        const { result } = renderHook(() =>
          useComposedRefs(callback1, ref1, callback2, ref2)
        );

        const node = document.createElement('div');
        result.current(node);

        expect(callback1).toHaveBeenCalledWith(node);
        expect(callback2).toHaveBeenCalledWith(node);
        expect(ref1.current).toBe(node);
        expect(ref2.current).toBe(node);
      });
    });

    describe('Valores Null/Undefined', () => {
      it('deve lidar com ref undefined', () => {
        const { result } = renderHook(() => useComposedRefs(undefined));

        const node = document.createElement('div');
        expect(() => result.current(node)).not.toThrow();
      });

      it('deve lidar com ref null', () => {
        const { result } = renderHook(() => useComposedRefs(null));

        const node = document.createElement('div');
        expect(() => result.current(node)).not.toThrow();
      });

      it('deve lidar com mix de refs válidos e null', () => {
        const callback = jest.fn();
        const ref = { current: null } as MutableRefObject<HTMLDivElement | null>;

        const { result } = renderHook(() =>
          useComposedRefs(callback, null, ref, undefined)
        );

        const node = document.createElement('div');
        result.current(node);

        expect(callback).toHaveBeenCalledWith(node);
        expect(ref.current).toBe(node);
      });
    });

    describe('Re-renders', () => {
      it('deve atualizar quando ref muda', () => {
        const callback1 = jest.fn();
        const callback2 = jest.fn();

        const { result, rerender } = renderHook(
          ({ ref }) => useComposedRefs(ref),
          { initialProps: { ref: callback1 } }
        );

        const node1 = document.createElement('div');
        result.current(node1);
        expect(callback1).toHaveBeenCalledWith(node1);

        rerender({ ref: callback2 });

        const node2 = document.createElement('span');
        result.current(node2);
        expect(callback2).toHaveBeenCalledWith(node2);
      });

      it('deve manter referência estável quando refs não mudam', () => {
        const callback = jest.fn();
        const { result, rerender } = renderHook(() => useComposedRefs(callback));

        const composedRef1 = result.current;
        rerender();
        const composedRef2 = result.current;

        // Função composta deve ser a mesma
        expect(composedRef1).toBe(composedRef2);
      });
    });

    describe('Casos de Uso Real', () => {
      it('deve funcionar com refs de componentes React', () => {
        const parentRef = { current: null } as MutableRefObject<HTMLDivElement | null>;
        const internalCallback = jest.fn();

        const { result } = renderHook(() =>
          useComposedRefs(parentRef, internalCallback)
        );

        const divElement = document.createElement('div');
        divElement.id = 'test-div';
        result.current(divElement);

        expect(parentRef.current).toBe(divElement);
        expect(internalCallback).toHaveBeenCalledWith(divElement);
        expect(parentRef.current?.id).toBe('test-div');
      });

      it('deve lidar com forwarded refs', () => {
        const forwardedRef = createRef<HTMLButtonElement>();
        const internalRef = { current: null } as MutableRefObject<HTMLButtonElement | null>;

        const { result } = renderHook(() =>
          useComposedRefs(forwardedRef as Ref<HTMLButtonElement>, internalRef)
        );

        const button = document.createElement('button');
        button.textContent = 'Click me';
        result.current(button);

        expect(forwardedRef.current).toBe(button);
        expect(internalRef.current).toBe(button);
        expect(forwardedRef.current?.textContent).toBe('Click me');
      });

      it('deve funcionar com medições de DOM', () => {
        const measurements: { width: number; height: number } = { width: 0, height: 0 };

        const measureCallback = jest.fn((node: HTMLDivElement | null) => {
          if (node) {
            // Simula medição do elemento
            measurements.width = 100;
            measurements.height = 50;
          }
        });

        const { result } = renderHook(() => useComposedRefs(measureCallback));

        const div = document.createElement('div');
        result.current(div);

        expect(measureCallback).toHaveBeenCalledWith(div);
        expect(measurements.width).toBe(100);
        expect(measurements.height).toBe(50);
      });

      it('deve limpar refs ao desmontar', () => {
        const callback = jest.fn();
        const ref = { current: document.createElement('div') } as MutableRefObject<HTMLDivElement | null>;

        const { result } = renderHook(() => useComposedRefs(callback, ref));

        // Simula desmontagem
        result.current(null);

        expect(callback).toHaveBeenCalledWith(null);
        expect(ref.current).toBeNull();
      });
    });

    describe('Edge Cases', () => {
      it('deve lidar com refs passados em ordem diferente', () => {
        const callback = jest.fn();
        const ref = { current: null } as MutableRefObject<HTMLDivElement | null>;

        // Ordem 1: callback, ref
        const { result: result1 } = renderHook(() => useComposedRefs(callback, ref));
        // Ordem 2: ref, callback
        const { result: result2 } = renderHook(() => useComposedRefs(ref, callback));

        const node = document.createElement('div');

        result1.current(node);
        expect(callback).toHaveBeenCalledTimes(1);

        result2.current(node);
        expect(callback).toHaveBeenCalledTimes(2); // Chamado novamente
      });

      it('deve lidar com array vazio de refs', () => {
        const { result } = renderHook(() => useComposedRefs());

        const node = document.createElement('div');
        expect(() => result.current(node)).not.toThrow();
      });

      it('deve ignorar refs duplicados', () => {
        const callback = jest.fn();
        const { result } = renderHook(() =>
          useComposedRefs(callback, callback, callback)
        );

        const node = document.createElement('div');
        result.current(node);

        // Deve chamar 3 vezes (não deduplica)
        expect(callback).toHaveBeenCalledTimes(3);
      });
    });
  });
});
