"use client";

import {
  cn } from '@/lib/utils';
import { useState,
  useEffect,
  useTransition } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { actionCriarSala } from "../actions/chat-actions";
import { actionListarUsuarios } from "@/app/(authenticated)/usuarios";
import { TipoSalaChat, type ChatItem } from "../domain";
import useChatStore from "../hooks/use-chat-store";

interface NovoChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChatCreated?: (chat: ChatItem) => void;
}

interface UsuarioOption {
  id: number;
  nome: string;
}

export function NovoChatDialog({ open, onOpenChange, onChatCreated }: NovoChatDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [usuarios, setUsuarios] = useState<UsuarioOption[]>([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);
  const [selectedUsuarioId, setSelectedUsuarioId] = useState<string>("");
  const { setSelectedChat, adicionarSala } = useChatStore();

  // Carregar usuários quando o dialog abrir
  useEffect(() => {
    if (!open || usuarios.length > 0) return;

    let cancelled = false;

    const loadUsers = async () => {
      try {
        const result = await actionListarUsuarios({ ativo: true, limite: 100 });
        if (cancelled) return;

        if (result.success && result.data) {
          const usuariosList = result.data.usuarios?.map((u: { id: number; nomeCompleto: string }) => ({
            id: u.id,
            nome: u.nomeCompleto,
          })) || [];
          setUsuarios(usuariosList);
        }
      } catch {
        if (!cancelled) {
          toast.error("Erro ao carregar usuários");
        }
      } finally {
        if (!cancelled) {
          setLoadingUsuarios(false);
        }
      }
    };

    setLoadingUsuarios(true);
    loadUsers();

    return () => {
      cancelled = true;
    };
  }, [open, usuarios.length]);

  // Handle dialog close - reset selection
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSelectedUsuarioId("");
    }
    onOpenChange(newOpen);
  };

  const handleSubmit = () => {
    if (!selectedUsuarioId) {
      toast.error("Selecione uma pessoa para conversar");
      return;
    }

    const usuarioSelecionado = usuarios.find(u => u.id.toString() === selectedUsuarioId);
    if (!usuarioSelecionado) return;

    const formData = new FormData();
    // Nome será o nome da pessoa (para exibição na lista do criador)
    formData.append("nome", usuarioSelecionado.nome);
    formData.append("tipo", TipoSalaChat.Privado);
    formData.append("participanteId", selectedUsuarioId);

    startTransition(async () => {
      const result = await actionCriarSala(null, formData);

      if (result.success) {
        toast.success("Conversa iniciada!");
        handleOpenChange(false);

        if (result.data) {
          // O service retorna SalaChat (sem name/image/usuario).
          // Precisamos montar o ChatItem completo para exibição correta.
          const salaBase = result.data as ChatItem;
          const novoChat: ChatItem = {
            ...salaBase,
            name: usuarioSelecionado.nome,
            usuario: {
              id: Number(selectedUsuarioId),
              nomeCompleto: usuarioSelecionado.nome,
              nomeExibicao: null,
              emailCorporativo: null,
            },
          };
          adicionarSala(novoChat);
          setSelectedChat(novoChat);
          onChatCreated?.(novoChat);
        }
      } else {
        if ("error" in result) {
          toast.error(result.error || "Erro ao iniciar conversa");
        }
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-sm  overflow-hidden p-0 gap-0 max-h-[90vh] flex flex-col"
      >
        <DialogHeader className="px-6 py-4 border-b border-border/20 shrink-0">
          <DialogTitle>Nova Conversa</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-4 [scrollbar-width:thin]">
      <div className={cn("flex flex-col stack-tight px-6 py-4")}>
        <Label>Com quem você quer conversar?</Label>
        <Select
          onValueChange={setSelectedUsuarioId}
          value={selectedUsuarioId}
        >
          <SelectTrigger>
            <SelectValue placeholder={loadingUsuarios ? "Carregando..." : "Selecione uma pessoa"} />
          </SelectTrigger>
          <SelectContent>
            {usuarios.map((usuario) => (
              <SelectItem key={usuario.id} value={usuario.id.toString()}>
                {usuario.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
        </div>
        <div className="px-6 py-4 border-t border-border/20 shrink-0 flex items-center justify-between gap-2">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>Cancelar</Button>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleSubmit}
              disabled={isPending || !selectedUsuarioId}
            >
              {isPending ? "Iniciando..." : "Iniciar Conversa"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
