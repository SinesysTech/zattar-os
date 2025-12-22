"use client";

import React, { useRef, useState } from "react";
import { Mic, Paperclip, PlusCircleIcon, SendIcon, SmileIcon, X, FileIcon, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { actionUploadFile, actionDeleteFile } from "../../actions/file-actions";
import { ChatMessageData } from "../../domain";

interface ChatFooterProps {
  salaId: number;
  onEnviarMensagem: (conteudo: string, tipo?: string, data?: ChatMessageData | null) => Promise<void>;
  onTyping?: () => void;
  typingIndicatorText?: string | null;
}

export function ChatFooter({ salaId, onEnviarMensagem, onTyping, typingIndicatorText }: ChatFooterProps) {
  const [message, setMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<ChatMessageData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const result = await actionUploadFile(salaId, formData);
      if (result.success && result.data) {
        setUploadedFile({
          fileUrl: result.data.fileUrl,
          fileKey: result.data.fileKey,
          fileName: result.data.fileName,
          mimeType: result.data.mimeType,
          size: result.data.fileSize,
        });
        if (!message) {
          setMessage(result.data.fileName);
        }
      } else {
        console.error("Upload failed:", result.error);
        alert("Falha no upload: " + (result.message || "Erro desconhecido"));
      }
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveFile = async () => {
    if (uploadedFile?.fileKey) {
      await actionDeleteFile(uploadedFile.fileKey);
    }
    setUploadedFile(null);
  };

  const handleSend = async () => {
    if ((!message.trim() && !uploadedFile) || isUploading) return;

    const conteudo = message;
    let tipo = 'texto';
    let data = undefined;

    if (uploadedFile) {
      tipo = uploadedFile.mimeType?.startsWith('image/') ? 'imagem' : 
             uploadedFile.mimeType?.startsWith('video/') ? 'video' :
             uploadedFile.mimeType?.startsWith('audio/') ? 'audio' : 'arquivo';
      data = uploadedFile;
    }

    setMessage("");
    setUploadedFile(null);

    await onEnviarMensagem(conteudo, tipo, data);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    onTyping?.();
  };

  return (
    <div className="lg:px-4 pb-4">
      {/* Typing Indicator */}
      {typingIndicatorText && (
        <div className="text-xs text-muted-foreground ml-4 mb-1 animate-pulse">
          {typingIndicatorText}
        </div>
      )}

      {/* File Preview Area */}
      {uploadedFile && (
        <div className="mb-2 p-2 bg-gray-100 rounded-md flex items-center justify-between mx-4 lg:mx-0">
          <div className="flex items-center gap-2 overflow-hidden">
            <FileIcon className="h-5 w-5 text-blue-500 flex-shrink-0" />
            <span className="text-sm truncate max-w-[200px]">{uploadedFile.fileName}</span>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleRemoveFile}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="bg-muted relative flex items-center rounded-md border">
        <Input
          type="text"
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={isUploading}
          className="h-14 border-transparent bg-white pe-32 text-base! shadow-transparent! ring-transparent! lg:pe-56"
          placeholder={isUploading ? "Enviando arquivo..." : "Digite uma mensagem..."}
        />
        
        {/* Hidden File Input */}
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          onChange={handleFileSelect}
        />

        <div className="absolute end-4 flex items-center">
          <div className="block lg:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="size-11 rounded-full p-0">
                  <PlusCircleIcon className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>Emoji</DropdownMenuItem>
                <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                  Anexar Arquivo
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="hidden lg:block">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <SmileIcon />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">Emoji</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="rounded-full"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? <Loader2 className="animate-spin" /> : <Paperclip />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">Anexar Arquivo</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Mic />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">Audio</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Button 
            variant="outline" 
            className="ms-3" 
            onClick={handleSend}
            disabled={(!message && !uploadedFile) || isUploading}
          >
            <span className="hidden lg:inline">Enviar</span> <SendIcon className="inline lg:hidden" />
          </Button>
        </div>
      </div>
    </div>
  );
}
