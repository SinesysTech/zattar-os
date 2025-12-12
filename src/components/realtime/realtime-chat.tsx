'use client';

import * as React from 'react';

import { useRealtimeChat } from '@/hooks/use-realtime-chat';

type Props = {
  roomName: string;
  username: string;
  userId?: number;
  onSend?: (message: string) => void;
};

export function RealtimeChat({ roomName, username, userId }: Props) {
  const { messages, sendMessage, isConnected, startTyping, stopTyping } = useRealtimeChat({
    roomName,
    username,
    userId,
  });

  const [value, setValue] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    sendMessage(trimmed);
    setValue('');
  };

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="text-xs text-muted-foreground">
        {isConnected ? 'Conectado' : 'Desconectado'}
      </div>

      <div className="flex-1 space-y-2 overflow-auto rounded-md border p-3">
        {messages.map((m) => (
          <div key={m.id} className="text-sm">
            <span className="font-medium">{m.user.name}:</span> {m.content}
          </div>
        ))}
        {messages.length === 0 && (
          <div className="text-sm text-muted-foreground">Sem mensagens ainda.</div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          className="flex-1 rounded-md border bg-background px-3 py-2 text-sm"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => startTyping()}
          onBlur={() => stopTyping()}
          placeholder="Digite uma mensagem…"
        />
        <button
          type="submit"
          className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-50"
          disabled={!value.trim()}
        >
          Enviar
        </button>
      </form>
    </div>
  );
}


