import { describe, it } from '@jest/globals';

export function hasSupabaseServiceEnv(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function describeIf(condition: boolean): typeof describe {
  return condition ? describe : describe.skip;
}

export function itIf(condition: boolean): typeof it {
  return condition ? it : it.skip;
}


