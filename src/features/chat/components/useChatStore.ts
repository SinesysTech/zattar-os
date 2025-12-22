import { create, StateCreator } from "zustand";
import type { ChatItem, MensagemComUsuario } from "../domain";

interface UseChatStore {
  selectedChat: ChatItem | null;
  mensagens: MensagemComUsuario[];
  salas: ChatItem[];
  showProfileSheet: boolean;

  // Actions
  setSelectedChat: (chat: ChatItem | null) => void;
  setMensagens: (mensagens: MensagemComUsuario[]) => void;
  adicionarMensagem: (mensagem: MensagemComUsuario) => void;
  atualizarMensagem: (id: number, updates: Partial<MensagemComUsuario>) => void;
  toggleProfileSheet: (value: boolean) => void;
  // Salas actions
  setSalas: (salas: ChatItem[]) => void;
  adicionarSala: (sala: ChatItem) => void;
  removerSala: (salaId: number) => void;
  atualizarSala: (salaId: number, updates: Partial<ChatItem>) => void;
}

const chatStore: StateCreator<UseChatStore> = (set) => ({
  selectedChat: null,
  mensagens: [],
  salas: [],
  showProfileSheet: false,

  setSelectedChat: (chat) => set(() => ({ selectedChat: chat })),

  setMensagens: (mensagens) => set(() => ({ mensagens })),

  adicionarMensagem: (mensagem) =>
    set((state) => ({
      mensagens: [...state.mensagens, mensagem]
    })),

  atualizarMensagem: (id, updates) =>
    set((state) => ({
      mensagens: state.mensagens.map((msg) =>
        msg.id === id ? { ...msg, ...updates } : msg
      ),
    })),

  toggleProfileSheet: (value) => set({ showProfileSheet: value }),

  // Salas actions
  setSalas: (salas) => set(() => ({ salas })),

  adicionarSala: (sala) =>
    set((state) => ({
      salas: [sala, ...state.salas],
    })),

  removerSala: (salaId) =>
    set((state) => ({
      salas: state.salas.filter((s) => s.id !== salaId),
      // Se a sala removida estava selecionada, limpar seleção
      selectedChat: state.selectedChat?.id === salaId ? null : state.selectedChat,
    })),

  atualizarSala: (salaId, updates) =>
    set((state) => ({
      salas: state.salas.map((s) =>
        s.id === salaId ? { ...s, ...updates } : s
      ),
    })),
});

const useChatStore = create(chatStore);

export default useChatStore;