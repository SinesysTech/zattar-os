import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AppBadge } from "@/components/ui/app-badge";
import { PencilIcon } from "lucide-react";
import { HeaderConfig } from "../../configs/types";

interface ProfileHeaderProps {
  config: HeaderConfig;
  data: Record<string, unknown>;
  onEdit?: () => void;
}

const getNestedValue = (obj: Record<string, unknown>, path: string): unknown => {
  return path.split('.').reduce<unknown>((acc, part) => (acc && typeof acc === 'object' ? (acc as Record<string, unknown>)[part] : undefined), obj);
};

export function ProfileHeader({ config, data, onEdit }: ProfileHeaderProps) {
  const title = getNestedValue(data, config.titleField) as string;

  // Basic avatar fallback logic
  const initials = title ? title.substring(0, 2).toUpperCase() : '??';
  const avatarUrl = (data.avatar_url || data.foto) as string; // common patterns

  // Cover/Banner URL - check multiple common patterns (banner_url, cover_url, coverUrl)
  const coverUrl = (data.banner_url || data.cover_url || data.coverUrl) as string | undefined;

  return (
    <div className="relative mb-8">
      {config.showBanner && (
        <div className="relative aspect-video w-full rounded-t-lg bg-muted md:max-h-[200px] lg:max-h-[240px] overflow-hidden">
          {coverUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={coverUrl} alt="Profile Banner" className="w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20" />
          )}

          {onEdit && (
            <div className="absolute end-4 top-4">
              <Button size="icon-sm" className="bg-background/50 backdrop-blur-sm rounded-full" variant="ghost" onClick={onEdit}>
                <PencilIcon className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      <div className={`${config.showBanner ? '-mt-10 lg:-mt-14' : ''} px-4 pb-4 text-center`}>
        {config.showAvatar && (
          <Avatar className="border-background mx-auto size-20 border-4 lg:size-28 shadow-sm bg-background">
            <AvatarImage src={avatarUrl} alt={title} />
            <AvatarFallback className="text-xl lg:text-3xl">{initials}</AvatarFallback>
          </Avatar>
        )}

        <div className="mt-4 space-y-2">
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">{title}</h1>

          {config.subtitleFields && config.subtitleFields.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 text-muted-foreground">
              {config.subtitleFields.map((field, idx) => {
                const val = getNestedValue(data, field) as React.ReactNode;
                return val ? <span key={idx} className="flex items-center gap-2">{idx > 0 && <span>•</span>}{val}</span> : null;
              })}
            </div>
          )}

          {config.badges && (
            <div className="flex flex-wrap justify-center gap-2 mt-2">
              {config.badges.map((badge, idx) => {
                const rawVal = getNestedValue(data, badge.field);
                if (!rawVal) return null;

                const displayVal = badge.map ? (badge.map[String(rawVal).toLowerCase()] || rawVal) : rawVal;

                // Handle specific badge logic e.g. status colors if needed, otherwise use variant
                return (
                  <AppBadge key={idx} variant={badge.variant || "secondary"}>
                    {displayVal as React.ReactNode}
                  </AppBadge>
                );
              })}
            </div>
          )}

          {config.metadata && (
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground mt-4">
              {config.metadata.map((meta, idx) => {
                const val = getNestedValue(data, meta.valuePath);
                if (!val) return null;
                const Icon = meta.icon;
                return (
                  <div key={idx} className="flex items-center gap-1.5">
                    {Icon && <Icon className="h-4 w-4" />}
                    <span>{val as React.ReactNode}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
