import type { CSSProperties } from "react";
import { Button } from "@/components/ui/button";
import { AppBadge } from "@/components/ui/app-badge";
import { Heading, Text } from "@/components/ui/typography";
import { PencilIcon } from "lucide-react";
import { HeaderConfig } from "../../configs/types";

type ProfileEntityType =
  | "cliente"
  | "parte_contraria"
  | "terceiro"
  | "representante"
  | "usuario";

interface ProfileHeaderProps {
  config: HeaderConfig;
  data: Record<string, unknown>;
  entityType?: ProfileEntityType;
  onEdit?: () => void;
}

const getNestedValue = (obj: Record<string, unknown>, path: string): unknown => {
  return path.split('.').reduce<unknown>(
    (acc, part) =>
      acc && typeof acc === 'object'
        ? (acc as Record<string, unknown>)[part]
        : undefined,
    obj,
  );
};

export function ProfileHeader({ config, data, entityType = 'cliente', onEdit }: ProfileHeaderProps) {
  void entityType; // A cor aplicada vem de --tipo-color injetada pelo ProfileShellClient.
  const title = (getNestedValue(data, config.titleField) as string) ?? '';

  const initials = title ? title.substring(0, 2).toUpperCase() : '??';
  const avatarUrl = (data.avatar_url || data.foto) as string | undefined;
  const coverUrl = (data.banner_url || data.cover_url || data.coverUrl) as string | undefined;

  const bannerStyle: CSSProperties = {
    background: [
      'radial-gradient(600px 200px at 20% 0%, color-mix(in oklch, var(--tipo-color, var(--primary)) 25%, transparent), transparent 70%)',
      'radial-gradient(500px 180px at 85% 80%, color-mix(in oklch, var(--tipo-color, var(--primary)) 18%, transparent), transparent 70%)',
      'linear-gradient(135deg, color-mix(in oklch, var(--tipo-color, var(--primary)) 10%, transparent), color-mix(in oklch, var(--info) 6%, transparent))',
    ].join(', '),
  };

  const avatarGlassStyle: CSSProperties = {
    background: 'color-mix(in oklch, var(--card) 78%, transparent)',
  };

  const initialsStyle: CSSProperties = {
    color: 'var(--tipo-color, var(--primary))',
  };

  return (
    <div className="relative">
      {config.showBanner && (
        <div
          className="relative h-44 md:h-48 lg:h-56 overflow-hidden rounded-t-2xl"
          style={bannerStyle}
        >
          {coverUrl && (

            <img
              src={coverUrl}
              alt="Banner do perfil"
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}
          {/* TODO POC grain overlay */}

          {onEdit && (
            <div className="absolute inset-e-4 top-4">
              <Button
                size="icon-sm"
                className="bg-background/50 backdrop-blur-sm rounded-full"
                variant="ghost"
                onClick={onEdit}
                aria-label="Editar perfil"
              >
                <PencilIcon className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      <div
        className={`relative px-4 sm:px-6 pb-4 ${
          config.showBanner ? '-mt-10 md:-mt-12 lg:-mt-16' : 'pt-6'
        }`}
      >
        {config.showAvatar && (
          <div
            className="size-20 md:size-24 lg:size-28 rounded-3xl flex items-center justify-center border border-border/40 shadow-lg backdrop-blur-xl overflow-hidden"
            style={avatarGlassStyle}
          >
            {avatarUrl ? (

              <img
                src={avatarUrl}
                alt={`Avatar de ${title}`}
                className="size-full rounded-3xl object-cover"
              />
            ) : (
              <span
                className="font-display text-3xl lg:text-4xl font-bold"
                style={initialsStyle}
              >
                {initials}
              </span>
            )}
          </div>
        )}

        <Heading level="page" className="mt-3">
          {title}
        </Heading>

        {config.subtitleFields && config.subtitleFields.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
            {config.subtitleFields
              .map((field, idx) => {
                const val = getNestedValue(data, field);
                if (val === null || val === undefined || val === '') return null;
                return (
                  <span key={idx} className="flex items-center gap-2">
                    {idx > 0 && (
                      <Text variant="meta-label" aria-hidden="true">
                        ·
                      </Text>
                    )}
                    <Text variant="meta-label">{val as React.ReactNode}</Text>
                  </span>
                );
              })
              .filter(Boolean)}
          </div>
        )}

        {config.metadata && config.metadata.length > 0 && (
          <div className="border-t border-border/40 pt-3 mt-4 flex flex-wrap gap-x-6 gap-y-2">
            {config.metadata.map((meta, idx) => {
              const val = getNestedValue(data, meta.valuePath);
              if (val === null || val === undefined || val === '') return null;
              const Icon = meta.icon;
              return (
                <div key={idx} className="flex items-center gap-1.5">
                  {Icon && <Icon className="size-3.5 text-muted-foreground/60" />}
                  <Text variant="meta-label">{val as React.ReactNode}</Text>
                </div>
              );
            })}
          </div>
        )}

        {config.badges && config.badges.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {config.badges.map((badge, idx) => {
              const rawVal = getNestedValue(data, badge.field);
              if (rawVal === null || rawVal === undefined || rawVal === '') return null;

              const displayVal = badge.map
                ? badge.map[String(rawVal).toLowerCase()] ?? rawVal
                : rawVal;

              return (
                <AppBadge key={idx} variant={badge.variant || 'secondary'}>
                  {displayVal as React.ReactNode}
                </AppBadge>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
