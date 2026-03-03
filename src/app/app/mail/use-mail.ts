import { create } from "zustand";
import type { MailMessagePreview, MailFolder } from "@/lib/mail/types";

type MailStore = {
  selectedMail: MailMessagePreview | null;
  setSelectedMail: (mail: MailMessagePreview | null) => void;
  selectedFolder: string;
  setSelectedFolder: (folder: string) => void;
  messages: MailMessagePreview[];
  setMessages: (messages: MailMessagePreview[]) => void;
  folders: MailFolder[];
  setFolders: (folders: MailFolder[]) => void;
  totalMessages: number;
  setTotalMessages: (total: number) => void;
  hasMore: boolean;
  setHasMore: (hasMore: boolean) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  serviceUnavailable: boolean;
  setServiceUnavailable: (unavailable: boolean) => void;
};

export const useMailStore = create<MailStore>((set) => ({
  selectedMail: null,
  setSelectedMail: (mail) => set({ selectedMail: mail }),
  selectedFolder: "INBOX",
  setSelectedFolder: (folder) => set({ selectedFolder: folder, selectedMail: null }),
  messages: [],
  setMessages: (messages) => set({ messages }),
  folders: [],
  setFolders: (folders) => set({ folders }),
  totalMessages: 0,
  setTotalMessages: (total) => set({ totalMessages: total }),
  hasMore: false,
  setHasMore: (hasMore) => set({ hasMore }),
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
  error: null,
  setError: (error) => set({ error }),
  searchQuery: "",
  setSearchQuery: (query) => set({ searchQuery: query }),
  serviceUnavailable: false,
  setServiceUnavailable: (unavailable) => set({ serviceUnavailable: unavailable }),
}));
