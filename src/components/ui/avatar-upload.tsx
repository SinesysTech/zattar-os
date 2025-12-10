'use client';

// Componente de upload de avatar com preview, crop, zoom e posicionamento
// Permite fazer upload, ajustar a imagem e remover avatar

import * as React from 'react';
import Cropper, { Area, Point } from 'react-easy-crop';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Camera, Loader2, Trash2, Upload, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

// Tipos de imagem permitidos
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Tamanho máximo: 2MB
const MAX_FILE_SIZE = 2 * 1024 * 1024;

interface AvatarUploadProps {
  /** URL atual do avatar */
  avatarUrl?: string | null;
  /** Iniciais para fallback (quando não há avatar) */
  fallbackInitials: string;
  /** Callback quando um arquivo é selecionado (recebe o arquivo cropado) */
  onFileSelect: (file: File) => void;
  /** Callback quando o usuário clica em remover */
  onRemove?: () => void;
  /** Se está carregando (upload em progresso) */
  isLoading?: boolean;
  /** Se o upload está desabilitado */
  disabled?: boolean;
  /** Tamanho do avatar */
  size?: 'sm' | 'md' | 'lg';
  /** Classe CSS adicional */
  className?: string;
}

const sizeClasses = {
  sm: 'h-16 w-16',
  md: 'h-24 w-24',
  lg: 'h-32 w-32',
};

const iconSizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};

/**
 * Cria uma imagem a partir de uma URL
 */
function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });
}

/**
 * Gera o blob da imagem cropada
 */
async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  rotation = 0
): Promise<Blob | null> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return null;
  }

  // Tamanho do canvas baseado no crop
  const maxSize = Math.max(image.width, image.height);
  const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

  // Configurar canvas para rotação
  canvas.width = safeArea;
  canvas.height = safeArea;

  // Transformações
  ctx.translate(safeArea / 2, safeArea / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.translate(-safeArea / 2, -safeArea / 2);

  // Desenhar imagem no centro
  ctx.drawImage(
    image,
    safeArea / 2 - image.width * 0.5,
    safeArea / 2 - image.height * 0.5
  );

  // Extrair dados do crop
  const data = ctx.getImageData(0, 0, safeArea, safeArea);

  // Redimensionar canvas para o tamanho do crop
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // Colocar dados cropados no canvas
  ctx.putImageData(
    data,
    Math.round(0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x),
    Math.round(0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y)
  );

  // Retornar como Blob
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        resolve(blob);
      },
      'image/jpeg',
      0.95
    );
  });
}

export function AvatarUpload({
  avatarUrl,
  fallbackInitials,
  onFileSelect,
  onRemove,
  isLoading = false,
  disabled = false,
  size = 'lg',
  className,
}: AvatarUploadProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Estado do cropper
  const [cropDialogOpen, setCropDialogOpen] = React.useState(false);
  const [imageSrc, setImageSrc] = React.useState<string | null>(null);
  const [crop, setCrop] = React.useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = React.useState(1);
  const [rotation, setRotation] = React.useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = React.useState<Area | null>(null);
  const [isCropping, setIsCropping] = React.useState(false);

  // Limpar imageSrc quando componente desmontar ou dialog fechar
  React.useEffect(() => {
    return () => {
      if (imageSrc) {
        URL.revokeObjectURL(imageSrc);
      }
    };
  }, [imageSrc]);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return 'Formato não suportado. Use JPEG, PNG ou WebP.';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'Imagem muito grande. Tamanho máximo: 2MB.';
    }
    return null;
  };

  const handleFileChange = (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);

    // Criar URL para o cropper
    const url = URL.createObjectURL(file);
    setImageSrc(url);

    // Reset estados do cropper
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setCroppedAreaPixels(null);

    // Abrir dialog de crop
    setCropDialogOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileChange(file);
    }
    // Reset input para permitir selecionar o mesmo arquivo novamente
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isLoading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled || isLoading) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileChange(file);
    }
  };

  const handleClick = () => {
    if (!disabled && !isLoading) {
      fileInputRef.current?.click();
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setError(null);
    onRemove?.();
  };

  const onCropComplete = React.useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCropConfirm = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    setIsCropping(true);

    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);

      if (croppedBlob) {
        // Converter Blob para File
        const croppedFile = new File([croppedBlob], 'avatar.jpg', {
          type: 'image/jpeg',
        });

        // Fechar dialog
        setCropDialogOpen(false);

        // Limpar imageSrc
        if (imageSrc) {
          URL.revokeObjectURL(imageSrc);
        }
        setImageSrc(null);

        // Notificar parent com o arquivo cropado
        onFileSelect(croppedFile);
      }
    } catch (err) {
      console.error('Erro ao cropar imagem:', err);
      setError('Erro ao processar imagem. Tente novamente.');
    } finally {
      setIsCropping(false);
    }
  };

  const handleCropCancel = () => {
    setCropDialogOpen(false);

    // Limpar imageSrc
    if (imageSrc) {
      URL.revokeObjectURL(imageSrc);
    }
    setImageSrc(null);
  };

  const handleResetCrop = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
  };

  const hasAvatar = !!avatarUrl;

  return (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      {/* Avatar com overlay */}
      <div
        className={cn(
          'relative cursor-pointer rounded-full transition-all',
          isDragging && 'ring-2 ring-primary ring-offset-2',
          disabled && 'cursor-not-allowed opacity-50',
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <Avatar className={cn(sizeClasses[size], 'border-2 border-muted')}>
          <AvatarImage src={avatarUrl || undefined} alt="Avatar" />
          <AvatarFallback className="text-lg font-medium">
            {fallbackInitials}
          </AvatarFallback>
        </Avatar>

        {/* Overlay com ícone */}
        <div
          className={cn(
            'absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity',
            !disabled && !isLoading && 'group-hover:opacity-100 hover:opacity-100',
          )}
        >
          {isLoading ? (
            <Loader2 className={cn(iconSizeClasses[size], 'animate-spin text-white')} />
          ) : (
            <Camera className={cn(iconSizeClasses[size], 'text-white')} />
          )}
        </div>

        {/* Badge de loading */}
        {isLoading && (
          <div className="absolute -bottom-1 -right-1 rounded-full bg-primary p-1">
            <Loader2 className="h-3 w-3 animate-spin text-primary-foreground" />
          </div>
        )}
      </div>

      {/* Input de arquivo (escondido) */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_MIME_TYPES.join(',')}
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled || isLoading}
        aria-label="Selecionar arquivo de foto de perfil"
      />

      {/* Botões de ação */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleClick}
          disabled={disabled || isLoading}
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Upload className="mr-2 h-4 w-4" />
          )}
          {hasAvatar ? 'Trocar Foto' : 'Adicionar Foto'}
        </Button>

        {hasAvatar && onRemove && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRemove}
            disabled={disabled || isLoading}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Remover
          </Button>
        )}
      </div>

      {/* Mensagem de erro */}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {/* Dica */}
      <p className="text-xs text-muted-foreground">
        JPEG, PNG ou WebP. Máximo 2MB.
      </p>

      {/* Dialog de Crop */}
      <Dialog open={cropDialogOpen} onOpenChange={setCropDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Ajustar Foto</DialogTitle>
            <DialogDescription>
              Ajuste o zoom e a posição da imagem arrastando ou usando os controles abaixo.
            </DialogDescription>
          </DialogHeader>

          {/* Área de Crop */}
          <div className="relative h-72 w-full overflow-hidden rounded-lg bg-muted">
            {imageSrc && (
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            )}
          </div>

          {/* Controles */}
          <div className="space-y-4">
            {/* Zoom */}
            <div className="flex items-center gap-3">
              <ZoomOut className="h-4 w-4 text-muted-foreground shrink-0" />
              <Slider
                value={[zoom]}
                min={1}
                max={3}
                step={0.1}
                onValueChange={(values) => setZoom(values[0])}
                className="flex-1"
              />
              <ZoomIn className="h-4 w-4 text-muted-foreground shrink-0" />
            </div>

            {/* Reset */}
            <div className="flex justify-center">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleResetCrop}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Redefinir
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCropCancel}
              disabled={isCropping}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleCropConfirm}
              disabled={isCropping || !croppedAreaPixels}
            >
              {isCropping ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                'Confirmar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
