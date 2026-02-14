/**
 * Property-Based Tests - Avatar
 *
 * Testes de propriedades para o componente Avatar
 * usando fast-check para validar comportamentos universais.
 */

import * as fc from 'fast-check';
import { render } from '@testing-library/react';
import { Avatar, AvatarImage, AvatarFallback, AvatarIndicator } from '@/components/ui/avatar';
import {
    setViewport,
    COMMON_VIEWPORTS,
} from '@/testing/helpers/responsive-test-helpers';

describe('Avatar - Property-Based Tests', () => {
    beforeEach(() => {
        setViewport(COMMON_VIEWPORTS.desktop);
    });

    /**
     * Feature: avatar-image, Property 5: Valid image rendering
     * Validates: Requirements 2.1
     *
     * Para qualquer Avatar com imagem válida,
     * deve renderizar AvatarImage
     */
    test('Property 5: Avatar with valid image renders AvatarImage', () => {
        fc.assert(
            fc.property(
                fc.webUrl(),
                (src) => {
                    const { container } = render(
                        <Avatar>
                            <AvatarImage src={src} alt="User avatar" />
                            <AvatarFallback>UN</AvatarFallback>
                        </Avatar>
                    );

                    const avatar = container.querySelector('[data-slot="avatar"]');
                    expect(avatar).toBeInTheDocument();

                    // Verifica presença de AvatarImage
                    const avatarImage = container.querySelector('[data-slot="avatar-image"]');
                    expect(avatarImage).toBeInTheDocument();
                    expect(avatarImage).toHaveAttribute('src', src);
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Feature: avatar-fallback, Property 6: Fallback with initials
     * Validates: Requirements 2.2
     *
     * Para qualquer Avatar sem imagem,
     * deve renderizar AvatarFallback com iniciais
     */
    test('Property 6: Avatar without image renders AvatarFallback', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 1, maxLength: 2 }),
                (initials) => {
                    const { container } = render(
                        <Avatar>
                            <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                    );

                    const avatar = container.querySelector('[data-slot="avatar"]');
                    expect(avatar).toBeInTheDocument();

                    // Verifica presença de AvatarFallback
                    const fallback = container.querySelector('[data-slot="avatar-fallback"]');
                    expect(fallback).toBeInTheDocument();
                    expect(fallback).toHaveTextContent(initials);

                    // Verifica classes de fallback
                    expect(fallback?.classList.contains('bg-muted')).toBe(true);
                    expect(fallback?.classList.contains('flex')).toBe(true);
                    expect(fallback?.classList.contains('items-center')).toBe(true);
                    expect(fallback?.classList.contains('justify-center')).toBe(true);
                    expect(fallback?.classList.contains('rounded-full')).toBe(true);
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Feature: avatar-indicator, Property 7: Status indicator variants
     * Validates: Requirements 2.3
     *
     * Para qualquer AvatarIndicator,
     * deve renderizar com variante correta (online/away/offline/success)
     */
    test('Property 7: AvatarIndicator renders with correct variant', () => {
        fc.assert(
            fc.property(
                fc.constantFrom('online', 'away', 'offline', 'success') as fc.Arbitrary<'online' | 'away' | 'offline' | 'success'>,
                (variant) => {
                    const { container } = render(
                        <Avatar>
                            <AvatarFallback>UN</AvatarFallback>
                            <AvatarIndicator variant={variant} />
                        </Avatar>
                    );

                    const indicator = container.querySelector('.absolute.bottom-0.right-0');
                    expect(indicator).toBeInTheDocument();

                    // Verifica classes base do indicador
                    expect(indicator?.classList.contains('rounded-full')).toBe(true);
                    expect(indicator?.classList.contains('border-2')).toBe(true);

                    // Verifica cor baseada na variante
                    const className = indicator?.className || '';
                    if (variant === 'online' || variant === 'success') {
                        expect(className).toMatch(/bg-green-500/);
                    } else if (variant === 'away') {
                        expect(className).toMatch(/bg-orange-500/);
                    } else if (variant === 'offline') {
                        expect(className).toMatch(/bg-slate-400/);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Feature: avatar-size, Property 8: Default size and shape
     * Validates: Requirements 2.4
     *
     * Para qualquer Avatar,
     * deve ter tamanho size-8 e formato circular
     */
    test('Property 8: Avatar has correct default size and circular shape', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 1, maxLength: 2 }),
                (fallbackText) => {
                    const { container } = render(
                        <Avatar>
                            <AvatarFallback>{fallbackText}</AvatarFallback>
                        </Avatar>
                    );

                    const avatar = container.querySelector('[data-slot="avatar"]');
                    expect(avatar).toBeInTheDocument();

                    // Verifica tamanho size-8
                    expect(avatar?.classList.contains('size-8')).toBe(true);

                    // Verifica formato circular
                    expect(avatar?.classList.contains('rounded-full')).toBe(true);

                    // Verifica outras classes essenciais
                    expect(avatar?.classList.contains('overflow-hidden')).toBe(true);
                    expect(avatar?.classList.contains('relative')).toBe(true);
                    expect(avatar?.classList.contains('flex')).toBe(true);
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Feature: avatar-custom-size, Property 9: Custom sizes maintain aspect ratio
     * Validates: Requirements 2.5
     *
     * Para qualquer Avatar em diferentes tamanhos customizados,
     * deve manter aspect ratio
     */
    test('Property 9: Avatar with custom size maintains aspect ratio', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 24, max: 128 }),
                (size) => {
                    const { container } = render(
                        <Avatar className={`size-[${size}px]`}>
                            <AvatarImage src="https://example.com/avatar.jpg" alt="Avatar" />
                        </Avatar>
                    );

                    const avatar = container.querySelector('[data-slot="avatar"]');
                    expect(avatar).toBeInTheDocument();

                    // Verifica que mantém forma circular independente do tamanho
                    expect(avatar?.classList.contains('rounded-full')).toBe(true);

                    // Verifica AvatarImage com aspect-square
                    const avatarImage = container.querySelector('[data-slot="avatar-image"]');
                    if (avatarImage) {
                        expect(avatarImage.classList.contains('aspect-square')).toBe(true);
                        expect(avatarImage.classList.contains('size-full')).toBe(true);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });
});
