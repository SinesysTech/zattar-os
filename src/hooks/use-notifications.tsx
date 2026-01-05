'use client';

import * as React from 'react';
import { createClient } from '@/lib/supabase/client';

export interface NotificationData {
  id: string;
  roomId: string;
  roomName: string;
  userName: string;
  message: string;
  timestamp: string;
  type: 'message' | 'mention' | 'system';
  isRead: boolean;
}

export interface UnreadCounts {
  [roomId: string]: number;
}

interface NotificationContextType {
  notifications: NotificationData[];
  unreadCounts: UnreadCounts;
  totalUnread: number;
  markAsRead: (notificationId: string) => void;
  markRoomAsRead: (roomId: string) => void;
  addNotification: (notification: Omit<NotificationData, 'id' | 'timestamp' | 'isRead'>) => void;
  removeNotification: (notificationId: string) => void;
  clearAllNotifications: () => void;
  requestPermission: () => Promise<boolean>;
  showBrowserNotification: (title: string, body: string, icon?: string) => void;
}

export const NotificationContext = React.createContext<NotificationContextType | null>(null);

export function useNotifications() {
  const context = React.useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

interface NotificationProviderProps {
  children: React.ReactNode;
  currentUserId?: number;
  currentUserName?: string;
}

export function NotificationProvider({
  children,
  currentUserId,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- parâmetro reservado para uso futuro em notificações
  currentUserName
}: NotificationProviderProps) {
  const [notifications, setNotifications] = React.useState<NotificationData[]>([]);
  const [unreadCounts, setUnreadCounts] = React.useState<UnreadCounts>({});
  const supabase = createClient();

  // Calcular total de não lidas
  const totalUnread = React.useMemo(() => {
    return Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);
  }, [unreadCounts]);

  // Helper para obter informações da sala (memoizado para estabilidade)
  const getRoomInfo = React.useCallback(async (roomId: string) => {
    try {
      const { data, error } = await supabase
        .from('salas_chat')
        .select('id, nome')
        .eq('id', roomId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao obter informações da sala:', error);
      return null;
    }
  }, [supabase]);

  // Refs para evitar re-subscriptions quando callbacks mudam
  const addNotificationRef = React.useRef<(notificationData: Omit<NotificationData, 'id' | 'timestamp' | 'isRead'>) => void>(
    () => { /* será atualizado no useEffect */ }
  );

  const showBrowserNotificationRef = React.useRef<(title: string, body: string, icon?: string) => void>(
    () => { /* será atualizado no useEffect */ }
  );

  // Carregar notificações do localStorage na inicialização
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedNotifications = localStorage.getItem('chat-notifications');
      const savedUnreadCounts = localStorage.getItem('chat-unread-counts');

      if (savedNotifications) {
        try {
          setNotifications(JSON.parse(savedNotifications));
        } catch (error) {
          console.error('Erro ao carregar notificações salvas:', error);
        }
      }

      if (savedUnreadCounts) {
        try {
          setUnreadCounts(JSON.parse(savedUnreadCounts));
        } catch (error) {
          console.error('Erro ao carregar contadores salvos:', error);
        }
      }
    }
  }, []);

  // Salvar no localStorage quando houver mudanças
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('chat-notifications', JSON.stringify(notifications));
    }
  }, [notifications]);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('chat-unread-counts', JSON.stringify(unreadCounts));
    }
  }, [unreadCounts]);

  // Escutar mudanças no banco de dados para novas mensagens
  React.useEffect(() => {
    if (!supabase) return;

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mensagens_chat'
        },
        (payload) => {
          const newMessage = payload.new;

          // Ignorar mensagens do usuário atual
          if (currentUserId && newMessage.user_id === currentUserId) {
            return;
          }

          // Obter informações da sala usando getRoomInfo memoizado
          getRoomInfo(newMessage.room_id).then(roomInfo => {
            if (roomInfo) {
              // Usar ref para evitar re-subscription
              addNotificationRef.current({
                roomId: newMessage.room_id,
                roomName: roomInfo.nome,
                userName: newMessage.user_name || 'Usuário desconhecido',
                message: newMessage.content,
                type: 'message'
              });

              // Mostrar notificação do navegador se permitido
              if (Notification.permission === 'granted') {
                showBrowserNotificationRef.current(
                  `${roomInfo.nome}`,
                  `${newMessage.user_name || 'Usuário'}: ${newMessage.content.substring(0, 50)}${newMessage.content.length > 50 ? '...' : ''}`,
                  '/favicon.ico'
                );
              }
            }
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, currentUserId, getRoomInfo]);

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, isRead: true }
          : notif
      )
    );

    // Atualizar contador de não lidas
    setUnreadCounts(prev => {
      const notification = notifications.find(n => n.id === notificationId);
      if (notification) {
        const newCounts = { ...prev };
        const currentCount = newCounts[notification.roomId] || 0;
        if (currentCount > 0) {
          newCounts[notification.roomId] = currentCount - 1;
        }
        return newCounts;
      }
      return prev;
    });
  };

  const markRoomAsRead = (roomId: string) => {
    // Marcar todas as notificações da sala como lidas
    setNotifications(prev => 
      prev.map(notif => 
        notif.roomId === roomId 
          ? { ...notif, isRead: true }
          : notif
      )
    );

    // Zerar contador da sala
    setUnreadCounts(prev => ({
      ...prev,
      [roomId]: 0
    }));
  };

  const addNotification = React.useCallback((notificationData: Omit<NotificationData, 'id' | 'timestamp' | 'isRead'>) => {
    addNotificationRef.current(notificationData);
  }, []);

  // Atualizar ref quando a função de fato muda (devido a mudanças em setters)
  React.useEffect(() => {
    addNotificationRef.current = (notificationData: Omit<NotificationData, 'id' | 'timestamp' | 'isRead'>) => {
      const notification: NotificationData = {
        ...notificationData,
        id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        isRead: false,
      };

      setNotifications(prev => [notification, ...prev]);

      // Incrementar contador da sala
      setUnreadCounts(prev => ({
        ...prev,
        [notification.roomId]: (prev[notification.roomId] || 0) + 1
      }));
    };
  });

  const removeNotification = (notificationId: string) => {
    const notification = notifications.find(n => n.id === notificationId);
    if (notification) {
      setNotifications(prev => prev.filter(n => n.id !== notificationId));

      // Atualizar contador se a notificação não foi lida
      if (!notification.isRead) {
        setUnreadCounts(prev => {
          const newCounts = { ...prev };
          const currentCount = newCounts[notification.roomId] || 0;
          if (currentCount > 0) {
            newCounts[notification.roomId] = currentCount - 1;
          }
          return newCounts;
        });
      }
    }
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    setUnreadCounts({});
  };

  const requestPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      console.warn('Este navegador não suporta notificações');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Erro ao solicitar permissão de notificação:', error);
      return false;
    }
  };

  const showBrowserNotification = React.useCallback((title: string, body: string, icon?: string) => {
    showBrowserNotificationRef.current(title, body, icon);
  }, []);

  // Atualizar ref da função showBrowserNotification
  React.useEffect(() => {
    showBrowserNotificationRef.current = (title: string, body: string, icon?: string) => {
      if (Notification.permission === 'granted') {
        const notification = new Notification(title, {
          body,
          icon: icon || '/favicon.ico',
          tag: 'chat-message',
          requireInteraction: false,
        });

        // Fechar automaticamente após 5 segundos
        setTimeout(() => {
          notification.close();
        }, 5000);

        // Clique na notificação
        notification.onclick = () => {
          window.focus();
          notification.close();
        };
      }
    };
  });

  const value: NotificationContextType = {
    notifications,
    unreadCounts,
    totalUnread,
    markAsRead,
    markRoomAsRead,
    addNotification,
    removeNotification,
    clearAllNotifications,
    requestPermission,
    showBrowserNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}