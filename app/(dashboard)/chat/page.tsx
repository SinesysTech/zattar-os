/**
 * Página de Chat Interno Global
 * /chat
 */

import { Suspense } from 'react';
import { Metadata } from 'next';
import { ChatInterface } from '@/components/chat/chat-interface';
import { ChatSkeleton } from '@/components/chat/chat-skeleton';

export const metadata: Metadata = {
  title: 'Chat Interno | Sinesys',
  description: 'Chat interno do escritório',
};

export default function ChatPage() {
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center px-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Chat Interno</h1>
            <p className="text-sm text-muted-foreground">
              Converse com sua equipe em tempo real
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 overflow-hidden">
        <Suspense fallback={<ChatSkeleton />}>
          <ChatInterface />
        </Suspense>
      </div>
    </div>
  );
}
