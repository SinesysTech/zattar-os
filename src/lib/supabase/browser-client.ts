import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/lib/supabase/database.types';

let client: ReturnType<typeof createBrowserClient<Database>> | undefined;

export function getSupabaseBrowserClient() {
    if (client) {
        return client;
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY;

    if (!url || !anonKey) {
        throw new Error(
            'Supabase URL e Anon Key são obrigatórios. ' +
            'Verifique as variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY.'
        );
    }

    client = createBrowserClient<Database>(url, anonKey);
    return client;
}
