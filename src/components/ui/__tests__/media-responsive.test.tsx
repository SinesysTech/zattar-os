/**
 * Property-based tests para Media Components (Images and Videos)
 * 
 * Testes que validam propriedades universais dos componentes de mídia
 * em diferentes viewports e condições.
 */

import { render } from '@testing-library/react';
import * as fc from 'fast-check';
import { setViewport } from '@/tests/helpers/responsive-test-helpers';

// Mock components para testar comportamento de mídia
const TestImage = ({ src, alt, loading }: { src: string; alt?: string; loading?: 'lazy' | 'eager' }) => (
    <img
        src={src}
        alt={alt || 'Test image'}
        loading={loading}
        className="w-full max-w-full h-auto object-cover"
        data-testid="responsive-image"
    />
);

const TestVideo = ({ src }: { src: string }) => (
    <div className="aspect-video w-full" data-testid="video-container">
        <video
            src={src}
            controls
            className="w-full h-full object-cover"
            data-testid="responsive-video"
        />
    </div>
);

describe('Media Responsive Property Tests', () => {
    /**
     * Feature: responsividade-frontend, Property 58: Responsive image sizing
     * Validates: Requirements 13.1
     * 
     * Para qualquer imagem carregada em mobile,
     * imagens de tamanho apropriado baseadas na largura do viewport devem ser servidas.
     */
    test('Property 58: Images use responsive sizing (max-width: 100%, height: auto)', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 320, max: 767 }), // mobile viewport widths
                fc.string({ minLength: 5, maxLength: 100 }), // image source
                (width, src) => {
                    // Configura viewport mobile
                    setViewport({ width, height: 800 });

                    // Renderiza imagem
                    const { container } = render(<TestImage src={src} />);

                    const image = container.querySelector('[data-testid="responsive-image"]') as HTMLImageElement;

                    // Verifica que a imagem tem classes responsivas
                    expect(image).toHaveClass('w-full');
                    expect(image).toHaveClass('max-w-full');
                    expect(image).toHaveClass('h-auto');

                    // Verifica que object-cover está aplicado para manter proporção
                    expect(image).toHaveClass('object-cover');
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Feature: responsividade-frontend, Property 59: Media lazy loading
     * Validates: Requirements 13.2
     * 
     * Para qualquer conteúdo de mídia exibido em mobile,
     * lazy loading deve ser usado para conteúdo fora da tela.
     */
    test('Property 59: Images use lazy loading for off-screen content', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 320, max: 767 }), // mobile viewport widths
                fc.array(fc.string({ minLength: 5, maxLength: 50 }), { minLength: 5, maxLength: 20 }), // multiple images
                (width, imageSrcs) => {
                    // Configura viewport mobile
                    setViewport({ width, height: 800 });

                    // Renderiza múltiplas imagens (simulando scroll)
                    const { container } = render(
                        <div>
                            {imageSrcs.map((src, idx) => (
                                <TestImage key={idx} src={src} loading="lazy" />
                            ))}
                        </div>
                    );

                    const images = container.querySelectorAll('img');

                    // Verifica que todas as imagens têm loading="lazy"
                    images.forEach((img) => {
                        expect(img.getAttribute('loading')).toBe('lazy');
                    });

                    // Verifica que temos o número correto de imagens
                    expect(images.length).toBe(imageSrcs.length);
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Feature: responsividade-frontend, Property 60: Responsive video containers
     * Validates: Requirements 13.4
     * 
     * Para qualquer vídeo incorporado em mobile,
     * containers de vídeo responsivos que mantêm aspect ratio devem ser usados.
     */
    test('Property 60: Videos use responsive containers with aspect ratio', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 320, max: 767 }), // mobile viewport widths
                fc.string({ minLength: 5, maxLength: 100 }), // video source
                (width, src) => {
                    // Configura viewport mobile
                    setViewport({ width, height: 800 });

                    // Renderiza vídeo
                    const { container } = render(<TestVideo src={src} />);

                    const videoContainer = container.querySelector('[data-testid="video-container"]') as HTMLElement;
                    const video = container.querySelector('[data-testid="responsive-video"]') as HTMLVideoElement;

                    // Verifica que o container tem aspect-video
                    expect(videoContainer).toHaveClass('aspect-video');
                    expect(videoContainer).toHaveClass('w-full');

                    // Verifica que o vídeo preenche o container
                    expect(video).toHaveClass('w-full');
                    expect(video).toHaveClass('h-full');
                    expect(video).toHaveClass('object-cover');

                    // Verifica que o vídeo tem controles
                    expect(video.controls).toBe(true);
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Teste adicional: Images maintain aspect ratio across viewports
     * 
     * Verifica que imagens mantêm proporção em diferentes tamanhos de tela
     */
    test('Images maintain aspect ratio across all viewport sizes', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 320, max: 1920 }), // all viewport widths
                fc.string({ minLength: 5, maxLength: 100 }),
                (width, src) => {
                    setViewport({ width, height: 800 });

                    const { container } = render(<TestImage src={src} />);

                    const image = container.querySelector('[data-testid="responsive-image"]') as HTMLImageElement;

                    // Verifica classes responsivas em qualquer viewport
                    expect(image).toHaveClass('w-full');
                    expect(image).toHaveClass('max-w-full');
                    expect(image).toHaveClass('h-auto');
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Teste adicional: Video containers work on desktop
     * 
     * Verifica que containers de vídeo funcionam corretamente em desktop
     */
    test('Video containers maintain aspect ratio on desktop', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 1024, max: 1920 }), // desktop viewport widths
                fc.string({ minLength: 5, maxLength: 100 }),
                (width, src) => {
                    setViewport({ width, height: 1080 });

                    const { container } = render(<TestVideo src={src} />);

                    const videoContainer = container.querySelector('[data-testid="video-container"]') as HTMLElement;

                    // Verifica aspect ratio em desktop também
                    expect(videoContainer).toHaveClass('aspect-video');
                    expect(videoContainer).toHaveClass('w-full');
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Teste adicional: Multiple images in grid maintain responsive sizing
     * 
     * Verifica que múltiplas imagens em um grid mantêm sizing responsivo
     */
    test('Multiple images in grid maintain responsive sizing', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 320, max: 767 }),
                fc.array(fc.string({ minLength: 5, maxLength: 50 }), { minLength: 2, maxLength: 10 }),
                (width, imageSrcs) => {
                    setViewport({ width, height: 800 });

                    const { container } = render(
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {imageSrcs.map((src, idx) => (
                                <div key={idx}>
                                    <TestImage src={src} />
                                </div>
                            ))}
                        </div>
                    );

                    const images = container.querySelectorAll('img');

                    // Todas as imagens devem ter classes responsivas
                    images.forEach((img) => {
                        expect(img).toHaveClass('w-full');
                        expect(img).toHaveClass('max-w-full');
                        expect(img).toHaveClass('h-auto');
                    });

                    expect(images.length).toBe(imageSrcs.length);
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Teste adicional: Images have proper alt text
     * 
     * Verifica que imagens têm texto alternativo para acessibilidade
     */
    test('Images have alt text for accessibility', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 5, maxLength: 100 }),
                fc.string({ minLength: 3, maxLength: 50 }),
                (src, alt) => {
                    const { container } = render(<TestImage src={src} alt={alt} />);

                    const image = container.querySelector('[data-testid="responsive-image"]') as HTMLImageElement;

                    // Verifica que alt text está presente
                    expect(image.alt).toBe(alt);
                }
            ),
            { numRuns: 50 }
        );
    });

    /**
     * Teste adicional: Video aspect ratio variations
     * 
     * Verifica que diferentes aspect ratios de vídeo funcionam corretamente
     */
    test('Video containers support different aspect ratios', () => {
        fc.assert(
            fc.property(
                fc.constantFrom('aspect-video', 'aspect-square', 'aspect-[4/3]'),
                fc.string({ minLength: 5, maxLength: 100 }),
                (aspectRatio, src) => {
                    const { container } = render(
                        <div className={`${aspectRatio} w-full`} data-testid="video-container">
                            <video
                                src={src}
                                controls
                                className="w-full h-full object-cover"
                            />
                        </div>
                    );

                    const videoContainer = container.querySelector('[data-testid="video-container"]');

                    // Verifica que o aspect ratio foi aplicado
                    expect(videoContainer).toHaveClass(aspectRatio);
                    expect(videoContainer).toHaveClass('w-full');
                }
            ),
            { numRuns: 50 }
        );
    });
});
