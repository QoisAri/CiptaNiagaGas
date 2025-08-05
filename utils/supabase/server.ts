import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export const createClient = async () => {
  const cookieStore = await cookies(); // HARUS pakai await

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (key) => cookieStore.get(key)?.value,
        set: () => {},   // opsional: implement jika perlu
        remove: () => {},// opsional: implement jika perlu
      },
    }
  );
};
