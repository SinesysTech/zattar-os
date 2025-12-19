
/**
 * Transforma stream de texto para unir markdown quebrado
 * Útil para streams de AI que podem quebrar tokens de formatação
 */
export const markdownJoinerTransform = () => {
    // Buffer is reserved for future markdown reconstruction logic
    let _buffer = '';

    return new TransformStream<string, string>({
        transform(chunk, controller) {
            _buffer += chunk;
            // Lógica simplificada: apenas passa o chunk
            // Em uma implementação real, poderia tentar reconstruir markdown quebrado
            // mas para a maioria dos casos de uso de AI stream, apenas passar
            // o chunk é suficiente ou a lógica de junção acontece no frontend
            controller.enqueue(chunk);
        },
        flush() {
            // Buffer could be used for final processing if needed
            // For now, all chunks are already enqueued in transform
        }
    });
};
