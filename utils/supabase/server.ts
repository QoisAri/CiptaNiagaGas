'use server';

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { type CookieOptions } from '@supabase/ssr';

export const createClient = async () => {
  const cookieStore = await cookies(); // ✅ PENTING: pakai await
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // implementasi kalau perlu
        },
        remove(name: string, options: CookieOptions) {
          // implementasi kalau perlu
        },
      },
    }
  );

  return supabase;
};
