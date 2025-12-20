import { create, StateCreator } from "zustand";
import type { ChatItem, MensagemComUsuario } from "../domain";

interface UseChatStore {
  selectedChat: ChatItem | null;
  mensagens: MensagemComUsuario[];
  showProfileSheet: boolean;
  
  // Actions
  setSelectedChat: (chat: ChatItem | null) => void;
  setMensagens: (mensagens: MensagemComUsuario[]) => void;
  adicionarMensagem: (mensagem: MensagemComUsuario) => void;
  atualizarMensagem: (id: number, updates: Partial<MensagemComUsuario>) => void;
  toggleProfileSheet: (value: boolean) => void;
}

const chatStore: StateCreator<UseChatStore> = (set) => ({
  selectedChat: null,
  mensagens: [],
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

  toggleProfileSheet: (value) => set({ showProfileSheet: value })
});

const useChatStore = create(chatStore);

export default useChatStore;