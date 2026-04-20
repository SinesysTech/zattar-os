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
  Dialog,
  DialogContent,
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
import { generateAvatarFallback } from '@/lib/utils';
import {
  getSemanticBadgeVariant,
  type BadgeVisualVariant,
} from '@/lib/design-system';

import useChatStore from '../hooks/use-chat-store';
import { UsuarioChat } from '../domain';

/**
 * Maps online status to semantic text color classes.
 */
function getOnlineStatusColor(status: string): string {
  const variant = getSemanticBadgeVariant('online_status', status);

  const colorMap: Record<BadgeVisualVariant, string> = {
    success: 'text-success',
    warning: 'text-warning',
    neutral: 'text-muted-foreground',
    destructive: 'text-destructive',
    info: 'text-info',
    default: 'text-muted-foreground',
    secondary: 'text-muted-foreground',
    outline: 'text-muted-foreground',
    accent: 'text-primary',
  };

  return colorMap[variant] || 'text-muted-foreground';
}

export function UserDetailSheet({ user }: { user?: UsuarioChat }) {
  const { showProfileSheet, toggleProfileSheet } = useChatStore();

  if (!user) return null;

  return (
    <Dialog open={showProfileSheet} onOpenChange={toggleProfileSheet}>
      <DialogContent className="glass-dialog max-w-lg max-h-[90vh] p-0 flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-2 shrink-0">
          <DialogTitle className="text-2xl">Perfil</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <div className="my-4 flex flex-col items-center justify-end">
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
            <h4 className="mb-2 text-xl font-semibold">{user.nomeCompleto}</h4>
            <div className="text-xs">
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
            </div>
          </div>

          <div className="space-y-2 divide-y divide-border/20">
            {user.about && (
              <div className="space-y-3 py-4">
                <h5 className="text-xs font-semibold uppercase">Sobre</h5>
                <div className="text-muted-foreground">{user.about}</div>
              </div>
            )}
            {user.phone && (
              <div className="space-y-3 py-4">
                <h5 className="text-xs font-semibold uppercase">Telefone</h5>
                <div className="text-muted-foreground">{user.phone}</div>
              </div>
            )}
            {user.country && (
              <div className="space-y-3 py-4">
                <h5 className="text-xs font-semibold uppercase">País</h5>
                <div className="text-muted-foreground">{user.country}</div>
              </div>
            )}
            {user.medias?.length && (
              <div className="space-y-3 py-4">
                <h5 className="text-xs font-semibold uppercase">Mídia</h5>
                <div>
                  <ScrollArea className="w-full">
                    <div className="flex gap-4 *:shrink-0">
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
              <div className="space-y-3 py-4">
                <h5 className="text-xs font-semibold uppercase">Website</h5>
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
              <div className="space-y-3 py-4">
                <h5 className="text-xs font-semibold uppercase">
                  Redes Sociais
                </h5>
                <div className="flex flex-wrap items-center gap-2 *:shrink-0">
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
      </DialogContent>
    </Dialog>
  );
}
