'use client';

import * as React from 'react';
import { useCallback, useState } from 'react';
import { Upload, File, Image, Music, Video, X, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { createClient } from '@/core/app/_lib/supabase/client';

// Tipos de arquivo suportados
const SUPPORTED_FILE_TYPES = {
  // Documentos
  'application/pdf': { icon: File, label: 'PDF', category: 'document' },
  'application/msword': { icon: File, label: 'DOC', category: 'document' },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { icon: File, label: 'DOCX', category: 'document' },
  'application/vnd.ms-excel': { icon: File, label: 'XLS', category: 'document' },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { icon: File, label: 'XLSX', category: 'document' },
  'application/vnd.ms-powerpoint': { icon: File, label: 'PPT', category: 'document' },
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': { icon: File, label: 'PPTX', category: 'document' },
  
  // Imagens
  'image/jpeg': { icon: Image, label: 'JPG', category: 'image' },
  'image/png': { icon: Image, label: 'PNG', category: 'image' },
  'image/gif': { icon: Image, label: 'GIF', category: 'image' },
  'image/webp': { icon: Image, label: 'WEBP', category: 'image' },
  
  // Áudio
  'audio/mpeg': { icon: Music, label: 'MP3', category: 'audio' },
  'audio/wav': { icon: Music, label: 'WAV', category: 'audio' },
  'audio/ogg': { icon: Music, label: 'OGG', category: 'audio' },
  
  // Vídeo
  'video/mp4': { icon: Video, label: 'MP4', category: 'video' },
  'video/webm': { icon: Video, label: 'WEBM', category: 'video' },
  'video/ogg': { icon: Video, label: 'OGG', category: 'video' },
};

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

interface FileUploadItem {
  file: File;
  id: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
  url?: string;
}

interface ChatFileUploadProps {
  onFileUploaded: (fileInfo: {
    url: string;
    name: string;
    size: number;
    type: string;
    category: string;
  }) => void;
  className?: string;
}

export function ChatFileUpload({ onFileUploaded, className }: ChatFileUploadProps) {
  const [files, setFiles] = useState<FileUploadItem[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return `Arquivo muito grande. Tamanho máximo: ${MAX_FILE_SIZE / (1024 * 1024)}MB`;
    }

    if (!SUPPORTED_FILE_TYPES[file.type as keyof typeof SUPPORTED_FILE_TYPES]) {
      return 'Tipo de arquivo não suportado';
    }

    return null;
  };

  const addFiles = useCallback((fileList: FileList) => {
    const newFiles: FileUploadItem[] = [];
    
    Array.from(fileList).forEach(file => {
      const error = validateFile(file);
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      newFiles.push({
        file,
        id,
        status: error ? 'error' : 'pending',
        progress: 0,
        error: error || undefined,
      });
    });

    setFiles(prev => [...prev, ...newFiles]);

    // Upload files que não têm erro
    const validFiles = newFiles.filter(f => !f.error);
    if (validFiles.length > 0) {
      uploadFiles(validFiles);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- uploadFiles é chamado imediatamente, não precisa ser dependência
  }, []);

  const uploadFiles = async (filesToUpload: FileUploadItem[]) => {
    const supabase = createClient();

    for (const fileItem of filesToUpload) {
      setFiles(prev => prev.map(f => 
        f.id === fileItem.id 
          ? { ...f, status: 'uploading', progress: 0 }
          : f
      ));

      try {
        // Criar nome único para o arquivo
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(7);
        const extension = fileItem.file.name.split('.').pop();
        const uniqueName = `chat/${timestamp}-${randomId}.${extension}`;

        // Upload para Supabase Storage
        const { error } = await supabase.storage
          .from('chat-files')
          .upload(uniqueName, fileItem.file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (error) throw error;

        // Obter URL pública
        const { data: { publicUrl } } = supabase.storage
          .from('chat-files')
          .getPublicUrl(uniqueName);

        // Simular progresso
        for (let progress = 0; progress <= 100; progress += 10) {
          await new Promise(resolve => setTimeout(resolve, 50));
          setFiles(prev => prev.map(f => 
            f.id === fileItem.id 
              ? { ...f, progress }
              : f
          ));
        }

        setFiles(prev => prev.map(f => 
          f.id === fileItem.id 
            ? { ...f, status: 'success', progress: 100, url: publicUrl }
            : f
        ));

        // Notificar componente pai
        const fileType = SUPPORTED_FILE_TYPES[fileItem.file.type as keyof typeof SUPPORTED_FILE_TYPES];
        onFileUploaded({
          url: publicUrl,
          name: fileItem.file.name,
          size: fileItem.file.size,
          type: fileItem.file.type,
          category: fileType.category,
        });

      } catch (error) {
        console.error('Erro ao fazer upload:', error);
        setFiles(prev => prev.map(f => 
          f.id === fileItem.id 
            ? { ...f, status: 'error', error: 'Erro no upload' }
            : f
        ));
      }
    }
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      addFiles(droppedFiles);
    }
  }, [addFiles]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      addFiles(selectedFiles);
    }
    // Reset input
    e.target.value = '';
  }, [addFiles]);

  const getFileIcon = (fileType: string) => {
    const config = SUPPORTED_FILE_TYPES[fileType as keyof typeof SUPPORTED_FILE_TYPES];
    if (!config) return File;
    const IconComponent = config.icon;
    return IconComponent;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={cn('space-y-2', className)}>
      {/* Área de Drop */}
      <div
        className={cn(
          'relative border-2 border-dashed rounded-lg p-4 transition-colors',
          isDragOver 
            ? 'border-primary bg-primary/5' 
            : 'border-muted-foreground/25 hover:border-muted-foreground/50'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          multiple
          accept={Object.keys(SUPPORTED_FILE_TYPES).join(',')}
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        <div className="text-center">
          <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground mb-1">
            Arraste arquivos aqui ou clique para selecionar
          </p>
          <p className="text-xs text-muted-foreground">
            Suporta: PDF, DOCX, XLSX, PPTX, JPG, PNG, MP3, MP4 (max 50MB)
          </p>
        </div>
      </div>

      {/* Lista de Arquivos */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map(fileItem => {
            const IconComponent = getFileIcon(fileItem.file.type);
            
            return (
              <div
                key={fileItem.id}
                className="flex items-center gap-3 p-3 border rounded-lg"
              >
                <IconComponent className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium truncate">
                      {fileItem.file.name}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(fileItem.id)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(fileItem.file.size)}
                    </p>
                    {fileItem.status === 'uploading' && (
                      <Progress value={fileItem.progress} className="flex-1 h-1" />
                    )}
                  </div>
                  
                  {fileItem.error && (
                    <p className="text-xs text-red-500 mt-1">{fileItem.error}</p>
                  )}
                  
                  {fileItem.status === 'success' && fileItem.url && (
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-green-600">Upload concluído</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(fileItem.url, '_blank')}
                        className="h-5 w-5 p-0"
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}