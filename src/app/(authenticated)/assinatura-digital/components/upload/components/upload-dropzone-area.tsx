'use client';

import { CloudUpload, X, CheckCircle2, AlertCircle, Upload, FileText, Lock, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Heading, Text } from '@/components/ui/typography';
import { cn } from '@/lib/utils';
import { getFileTypeIcon, getFileTypeBgColor } from './file-type-indicators';
import type { UploadedFile } from '../types';

interface UploadDropzoneAreaProps {
  isDragActive: boolean;
  hasError: boolean;
  errorMessage?: string;
  selectedFile: File | null;
  uploadedFile: UploadedFile | null;
  isUploading: boolean;
  progress: number;
  onRemoveFile: () => void;
  getRootProps: () => Record<string, unknown>;
  getInputProps: () => Record<string, unknown>;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * UploadDropzoneArea — Dropzone glass alinhada ao Design System.
 *
 * Estados:
 * - empty (idle): border dashed, icon-tile primary, CTA "Selecionar arquivo"
 * - drag-active: border-primary/55 + bg-primary/5
 * - error: border-destructive/50 + texto destrutivo
 * - selected/uploading: card glass-kpi com progress + botão remover
 * - completed: card glass-kpi com check success
 */
export function UploadDropzoneArea({
  isDragActive,
  hasError,
  errorMessage,
  selectedFile,
  uploadedFile,
  isUploading,
  progress,
  onRemoveFile,
  getRootProps,
  getInputProps,
}: UploadDropzoneAreaProps) {
  const hasFile = selectedFile || uploadedFile;
  const isCompleted = uploadedFile !== null;

  return (
    <div
      {...getRootProps()}
      className={cn(
        'group relative flex min-h-110 w-full flex-col items-center justify-center',
        /* design-system-escape: p-8 → usar <Inset>; lg:p-12 sem equivalente DS */ 'cursor-pointer rounded-[20px] border-2 border-dashed inset-extra-loose lg:p-12 text-center',
        'backdrop-blur-xl transition-all duration-200',
        !hasFile && !hasError && !isDragActive && 'border-border/80 bg-card/55 hover:border-primary/45 hover:bg-primary/5',
        isDragActive && 'border-primary/55 bg-primary/5 scale-[1.005]',
        hasError && 'border-destructive/50 bg-destructive/5',
        hasFile && !hasError && !isCompleted && 'border-primary/40 bg-primary/5',
        isCompleted && 'border-success/40 bg-success/5',
      )}
    >
      <input {...getInputProps()} />

      {hasFile ? (
        <FilePreviewCard
          file={selectedFile}
          uploadedFile={uploadedFile}
          isUploading={isUploading}
          progress={progress}
          onRemove={onRemoveFile}
          isCompleted={isCompleted}
        />
      ) : hasError ? (
        <ErrorState message={errorMessage} />
      ) : (
        <EmptyState isDragActive={isDragActive} />
      )}
    </div>
  );
}

// ─── Empty state (idle / drag) ────────────────────────────────────────

function EmptyState({ isDragActive }: { isDragActive: boolean }) {
  return (
    <div className={cn("flex flex-col items-center inline-default-plus")}>
      {/* Icon tile grande estilo POC */}
      <div
        className={cn(
          'inline-flex size-16 items-center justify-center rounded-[20px] bg-primary/8 transition-transform duration-200',
          'group-hover:scale-105',
          isDragActive && 'scale-110 bg-primary/12',
        )}
      >
        <CloudUpload className={cn(
          'size-8 text-primary/75 transition-colors',
          isDragActive && 'text-primary',
        )} />
      </div>

      <div className={cn("flex flex-col stack-snug max-w-sm")}>
        <Heading level="section" as="h3">
          {isDragActive ? 'Solte o arquivo aqui' : 'Arraste o PDF aqui'}
        </Heading>
        <p className={cn("text-body-sm text-muted-foreground")}>
          Ou clique para selecionar do computador. Tamanho máximo{' '}
          <span className={cn( "font-medium text-foreground")}>10 MB</span>.
        </p>
      </div>

      {!isDragActive && (
        <Button
          type="button"
          size="sm"
          className={cn("flex pointer-events-none inline-snug mt-1")}
        >
          <Upload className="size-3.5" />
          Selecionar arquivo
        </Button>
      )}

      {/* Meta restrictions — row inline com icon-tiles discretos */}
      <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] text-muted-foreground">
        <span className={cn("inline-flex items-center inline-snug")}>
          <FileText className="size-3" />
          PDF apenas
        </span>
        <span className="h-3 w-px bg-border" aria-hidden />
        <span className={cn("inline-flex items-center inline-snug")}>
          <Layers className="size-3" />
          Até 100 páginas
        </span>
        <span className="h-3 w-px bg-border" aria-hidden />
        <span className={cn("inline-flex items-center inline-snug")}>
          <Lock className="size-3" />
          Upload criptografado
        </span>
      </div>
    </div>
  );
}

// ─── Error state ──────────────────────────────────────────────────────

function ErrorState({ message }: { message?: string }) {
  return (
    <div className={cn("flex flex-col items-center stack-default")}>
      <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-destructive/10">
        <AlertCircle className="size-7 text-destructive" />
      </div>
      <div className={cn("flex flex-col stack-snug max-w-sm")}>
        <p className={cn( "font-heading text-body-lg font-semibold text-destructive")}>
          Erro no upload
        </p>
        <p className={cn("text-body-sm text-muted-foreground")}>
          {message || 'Ocorreu um erro ao processar o arquivo. Tente novamente.'}
        </p>
      </div>
    </div>
  );
}

// ─── File preview card ────────────────────────────────────────────────

function FilePreviewCard({
  file,
  uploadedFile,
  isUploading,
  progress,
  onRemove,
  isCompleted,
}: {
  file: File | null;
  uploadedFile: UploadedFile | null;
  isUploading: boolean;
  progress: number;
  onRemove: () => void;
  isCompleted: boolean;
}) {
  const displayFile = uploadedFile || file;
  if (!displayFile) return null;

  const fileName = 'name' in displayFile ? displayFile.name : '';
  const fileSize = 'size' in displayFile ? displayFile.size : 0;
  const fileType = 'type' in displayFile ? displayFile.type : '';

  const { icon: FileIcon, color: iconColor } = getFileTypeIcon(fileType);
  const bgColor = getFileTypeBgColor(fileType);

  return (
    <div
      className={cn(
        'w-full max-w-md rounded-2xl border inset-card-compact shadow-sm backdrop-blur-md',
        'glass-kpi border-border/40 bg-card/70 transition-all duration-200',
        isCompleted && 'border-success/30',
      )}
      onClick={(e) => e.stopPropagation()}
    >
      <div className={cn("flex items-start inline-medium")}>
        <div
          className={cn(
            'flex size-11 shrink-0 items-center justify-center rounded-xl',
            bgColor,
          )}
        >
          <FileIcon className={cn('size-5', iconColor)} />
        </div>

        <div className="min-w-0 flex-1 text-left">
          <p className={cn( "truncate text-body-sm font-medium text-foreground")}>{fileName}</p>
          <Text variant="caption" className="tabular-nums mt-0.5">
            {formatFileSize(fileSize)}
          </Text>

          {isUploading && (
            <div className={cn("flex flex-col mt-3 stack-micro")}>
              <Progress value={progress} className="h-1.5" />
              <p className={cn("text-overline text-muted-foreground tabular-nums")}>
                Enviando · {progress}%
              </p>
            </div>
          )}

          {isCompleted && (
            <div className={cn("mt-2 flex items-center inline-snug text-success")}>
              <CheckCircle2 className="size-4" strokeWidth={2.5} />
              <Text variant="caption" weight="medium">Upload concluído</Text>
            </div>
          )}
        </div>

        {!isUploading && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Remover arquivo"
            className="shrink-0 text-muted-foreground hover:text-destructive size-8"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
          >
            <X className="size-4" />
            <span className="sr-only">Remover arquivo</span>
          </Button>
        )}
      </div>
    </div>
  );
}
