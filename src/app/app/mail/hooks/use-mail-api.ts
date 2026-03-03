"use client";

import { useCallback, useEffect, useRef } from "react";
import { useMailStore } from "../use-mail";

export function useMailFolders() {
  const { setFolders, setError, setServiceUnavailable } = useMailStore();
  const fetched = useRef(false);

  const fetchFolders = useCallback(async () => {
    try {
      const res = await fetch("/api/mail/folders");
      if (res.status === 503 || res.status === 422) {
        setServiceUnavailable(true);
        return;
      }
      if (!res.ok) throw new Error("Erro ao carregar pastas");
      const data = await res.json();
      setFolders(data.folders);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar pastas");
    }
  }, [setFolders, setError, setServiceUnavailable]);

  useEffect(() => {
    if (!fetched.current) {
      fetched.current = true;
      fetchFolders();
    }
  }, [fetchFolders]);

  return { refetchFolders: fetchFolders };
}

export function useMailMessages() {
  const {
    selectedFolder,
    setMessages,
    setTotalMessages,
    setHasMore,
    setIsLoading,
    setError,
    setServiceUnavailable,
  } = useMailStore();

  const fetchMessages = useCallback(
    async (folder?: string, page: number = 1) => {
      const targetFolder = folder ?? selectedFolder;
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/mail/messages?folder=${encodeURIComponent(targetFolder)}&page=${page}&limit=50`
        );
        if (res.status === 503 || res.status === 422) {
          setServiceUnavailable(true);
          return;
        }
        if (!res.ok) throw new Error("Erro ao carregar mensagens");
        const data = await res.json();
        setMessages(data.data);
        setTotalMessages(data.total);
        setHasMore(data.hasMore);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar mensagens");
      } finally {
        setIsLoading(false);
      }
    },
    [selectedFolder, setMessages, setTotalMessages, setHasMore, setIsLoading, setError, setServiceUnavailable]
  );

  useEffect(() => {
    fetchMessages();
  }, [selectedFolder]); // eslint-disable-line react-hooks/exhaustive-deps

  return { refetchMessages: fetchMessages };
}

export function useMailActions() {
  const { selectedFolder, setMessages, setTotalMessages, setHasMore, setError } =
    useMailStore();

  const refreshMessages = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/mail/messages?folder=${encodeURIComponent(selectedFolder)}&page=1&limit=50`
      );
      if (!res.ok) return;
      const data = await res.json();
      setMessages(data.data);
      setTotalMessages(data.total);
      setHasMore(data.hasMore);
    } catch {
      // Silent refresh failure
    }
  }, [selectedFolder, setMessages, setTotalMessages, setHasMore]);

  const deleteMessage = useCallback(
    async (uid: number, folder: string) => {
      try {
        const res = await fetch(`/api/mail/messages/${uid}?folder=${encodeURIComponent(folder)}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error("Erro ao deletar mensagem");
        await refreshMessages();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao deletar");
      }
    },
    [refreshMessages, setError]
  );

  const moveMessage = useCallback(
    async (uid: number, fromFolder: string, toFolder: string) => {
      try {
        const res = await fetch(`/api/mail/messages/${uid}/move`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fromFolder, toFolder }),
        });
        if (!res.ok) throw new Error("Erro ao mover mensagem");
        await refreshMessages();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao mover");
      }
    },
    [refreshMessages, setError]
  );

  const markRead = useCallback(
    async (uid: number, folder: string) => {
      try {
        await fetch(`/api/mail/messages/${uid}/flags`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ folder, add: ["\\Seen"] }),
        });
        await refreshMessages();
      } catch {
        // Silent
      }
    },
    [refreshMessages]
  );

  const markUnread = useCallback(
    async (uid: number, folder: string) => {
      try {
        await fetch(`/api/mail/messages/${uid}/flags`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ folder, remove: ["\\Seen"] }),
        });
        await refreshMessages();
      } catch {
        // Silent
      }
    },
    [refreshMessages]
  );

  const starMessage = useCallback(
    async (uid: number, folder: string) => {
      try {
        await fetch(`/api/mail/messages/${uid}/flags`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ folder, add: ["\\Flagged"] }),
        });
        await refreshMessages();
      } catch {
        // Silent
      }
    },
    [refreshMessages]
  );

  const reply = useCallback(
    async (uid: number, folder: string, text: string, replyAll: boolean = false) => {
      try {
        const res = await fetch("/api/mail/messages/reply", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uid, folder, text, replyAll }),
        });
        if (!res.ok) throw new Error("Erro ao enviar resposta");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao responder");
        throw err;
      }
    },
    [setError]
  );

  const searchMessages = useCallback(
    async (query: string, folder?: string) => {
      try {
        const targetFolder = folder ?? selectedFolder;
        const res = await fetch(
          `/api/mail/messages/search?q=${encodeURIComponent(query)}&folder=${encodeURIComponent(targetFolder)}`
        );
        if (!res.ok) throw new Error("Erro na busca");
        const data = await res.json();
        setMessages(data.messages);
        setTotalMessages(data.total);
        setHasMore(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro na busca");
      }
    },
    [selectedFolder, setMessages, setTotalMessages, setHasMore, setError]
  );

  return {
    deleteMessage,
    moveMessage,
    markRead,
    markUnread,
    starMessage,
    reply,
    searchMessages,
    refreshMessages,
  };
}
