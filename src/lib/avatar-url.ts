export function generateAvatarFallback(name: string | null | undefined): string {
  if (!name) return "??";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) {
    const chars = Array.from(parts[0]);
    if (chars.length === 0) return "??";
    return chars.slice(0, 2).join("").toUpperCase();
  }
  return (Array.from(parts[0])[0] + Array.from(parts[1])[0]).toUpperCase();
}

export function resolveAvatarUrl(avatarUrl: string | null | undefined): string | null {
  if (!avatarUrl) return null;

  if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://')) {
    return avatarUrl;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return null;

  return `${supabaseUrl}/storage/v1/object/public/avatar/${avatarUrl}`;
}