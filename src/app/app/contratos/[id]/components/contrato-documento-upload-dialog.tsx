'use client';

import * as React from 'react';
import { FileUploadDialogUnified } from '@/features/documentos';
import { type Arquivo } from '@/features/documentos/domain';
import { actionVincularArquivoAoContrato } from '@/features/pecas-juridicas/actions';

interface ContratoDocumentoUploadDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    contratoId: number;
}

export function ContratoDocumentoUploadDialog({
    open,
    onOpenChange,
    contratoId,
}: ContratoDocumentoUploadDialogProps) {
    const handleFileUploaded = async (file: File, arquivo: Arquivo) => {
        // arquivo contains the Arquivo object returned by the upload action
        const arquivoId = arquivo?.id;
        if (!arquivoId) {
            console.error('Dados do arquivo inválidos:', arquivo);
            throw new Error('ID do arquivo não retornado após upload');
        }

        const vinculoResult = await actionVincularArquivoAoContrato({
            contratoId,
            arquivoId: arquivoId,
        });

        if (!vinculoResult.success) {
            throw new Error(vinculoResult.message || 'Erro ao vincular arquivo ao contrato');
        }
    };

    return (
        <FileUploadDialogUnified
            open={open}
            onOpenChange={onOpenChange}
            onFileUploaded={handleFileUploaded}
            onSuccess={() => {
                // A revalidação é feita na server action, mas podemos dar um feedback extra se necessário
                // O FileUploadDialogUnified já exibe toast de sucesso
            }}
            // Podemos definir uma pasta específica para contratos se desejado,
            // mas por enquanto deixaremos cair na raiz ou pasta padrão
            pastaId={null}
        />
    );
}
