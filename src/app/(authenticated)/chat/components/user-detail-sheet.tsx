'use client';

/**
 * UserDetailSheet — Dialog de perfil do usuário no chat.
 * ============================================================================
 * Migrado de Sheet para Dialog (política do projeto: "Sem Sheet, usar Dialog").
 * Nome mantido por compatibilidade com store (showProfileSheet).
 * ============================================================================
 */

import Link from 'next/link';
import Image from 'next/image';
import { FileText } from 'lucide-react';

import {
  DialogClose,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  AvatarIndicator,
} from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { generateAvatarFallback } from '@/lib/avatar-url';
import { Heading, Text } from '@/components/ui/typography';
import useChatStore from '../hooks/use-chat-store';
import { UsuarioChat } from '../domain';

const ONLINE_STATUS_COLOR: Record<string, string> = {
  online: 'text-success',
  away: 'text-warning',
  offline: 'text-muted-foreground',
};

function getOnlineStatusColor(status: string): string {
  return ONLINE_STATUS_COLOR[status.toLowerCase()] ?? 'text-muted-foreground';
}

export function UserDetailSheet({ user }: { user?: UsuarioChat }) {
  const { showProfileSheet, toggleProfileSheet } = useChatStore();

  if (!user) return null;

  return (
    <Dialog open={showProfileSheet} onOpenChange={toggleProfileSheet}>
      <DialogContent className={cn(/* design-system-escape: p-0 → usar <Inset> */ " max-w-lg max-h-[90vh] p-0 flex flex-col")}>
        <DialogHeader className={cn(/* design-system-escape: px-6 padding direcional sem Inset equiv.; pt-6 padding direcional sem Inset equiv.; pb-2 padding direcional sem Inset equiv. */ "px-6 pt-6 pb-2 shrink-0")}>
          <DialogTitle className="text-page-title">Perfil</DialogTitle>
          <DialogDescription className="sr-only">
            Informacoes de perfil, presenca e midias compartilhadas do usuario.
          </DialogDescription>
        </DialogHeader>

        <div className={cn(/* design-system-escape: px-6 padding direcional sem Inset equiv.; pb-6 padding direcional sem Inset equiv. */ "flex-1 overflow-y-auto px-6 pb-6")}>
          <div className={cn(/* design-system-escape: my-4 margin sem primitiva DS */ "my-4 flex flex-col items-center justify-end")}>
            <Avatar className="mb-4 size-32 overflow-visible">
              <AvatarImage src={user.avatar} alt="avatar image" />
              <AvatarIndicator
                variant={user.onlineStatus || 'offline'}
                className="h-6 w-6 border-4"
              />
              <AvatarFallback>
                {generateAvatarFallback(user.nomeCompleto)}
              </AvatarFallback>
            </Avatar>
            <Heading level="card" as="h4" className="mb-2">{user.nomeCompleto}</Heading>
            <Text variant="caption">
              Último acesso:{' '}
              {user.onlineStatus === 'online' ? (
                <span className={getOnlineStatusColor('online')}>Online</span>
              ) : (
                <span className="text-muted-foreground">
                  {user.lastSeen
                    ? new Date(user.lastSeen).toLocaleString()
                    : 'Offline'}
                </span>
              )}
            </Text>
          </div>

          <div className={cn(/* design-system-escape: space-y-2 → migrar para <Stack gap="tight"> */ "space-y-2 divide-y divide-border/20")}>
            {user.about && (
              <div className={cn(/* design-system-escape: space-y-3 sem token DS; py-4 padding direcional sem Inset equiv. */ "space-y-3 py-4")}>
                <Text variant="overline" as="h5">Sobre</Text>
                <div className="text-muted-foreground">{user.about}</div>
              </div>
            )}
            {user.phone && (
              <div className={cn(/* design-system-escape: space-y-3 sem token DS; py-4 padding direcional sem Inset equiv. */ "space-y-3 py-4")}>
                <Text variant="overline" as="h5">Telefone</Text>
                <div className="text-muted-foreground">{user.phone}</div>
              </div>
            )}
            {user.country && (
              <div className={cn(/* design-system-escape: space-y-3 sem token DS; py-4 padding direcional sem Inset equiv. */ "space-y-3 py-4")}>
                <Text variant="overline" as="h5">País</Text>
                <div className="text-muted-foreground">{user.country}</div>
              </div>
            )}
            {user.medias?.length && (
              <div className={cn(/* design-system-escape: space-y-3 sem token DS; py-4 padding direcional sem Inset equiv. */ "space-y-3 py-4")}>
                <Text variant="overline" as="h5">Mídia</Text>
                <div>
                  <ScrollArea className="w-full">
                    <div className={cn(/* design-system-escape: gap-4 → migrar para <Inline gap="default"> */ "flex gap-4 *:shrink-0")}>
                      {user.medias.map(
                        (item: { type: string; url: string }, i) => (
                          <div key={i}>
                            {item.type === 'image' && (
                              <Image
                                width={40}
                                height={40}
                                className="size-20 rounded-lg object-cover"
                                src={item.url}
                                alt="media"
                                unoptimized
                              />
                            )}
                          </div>
                        ),
                      )}
                    </div>
                    <ScrollBar orientation="horizontal" />
                  </ScrollArea>
                </div>
              </div>
            )}
            {user.website && (
              <div className={cn(/* design-system-escape: space-y-3 sem token DS; py-4 padding direcional sem Inset equiv. */ "space-y-3 py-4")}>
                <Text variant="overline" as="h5">Website</Text>
                <div>
                  <a
                    href={user.website}
                    target="_blank"
                    className="text-muted-foreground hover:text-primary hover:underline"
                    rel="noreferrer"
                  >
                    {user.website}
                  </a>
                </div>
              </div>
            )}
            {user.socialLinks?.length && (
              <div className={cn(/* design-system-escape: space-y-3 sem token DS; py-4 padding direcional sem Inset equiv. */ "space-y-3 py-4")}>
                <Text variant="overline" as="h5">
                  Redes Sociais
                </Text>
                <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex flex-wrap items-center gap-2 *:shrink-0")}>
                  {user.socialLinks.map(
                    (item: { icon: string; link: string }, key) => (
                      <Button
                        key={key}
                        variant="outline"
                        className="size-12 rounded-full"
                        size="icon"
                        aria-label="Documento"
                        asChild
                      >
                        <Link
                          href={item.link || '#'}
                          target="_blank"
                          className="flex items-center justify-center rounded-full *:h-5 *:w-5"
                        >
                          <FileText />
                        </Link>
                      </Button>
                    ),
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="shrink-0 border-t border-border/20 px-6 py-4">
          <DialogClose asChild>
            <Button variant="outline">Fechar</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
