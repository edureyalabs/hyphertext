import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

// For use in Server Components and Route Handlers that have access to next/headers
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from Server Component — middleware handles session refresh
          }
        },
      },
    }
  );
}

// For use in Route Handlers where we want to forward Set-Cookie back in the response
export function createSupabaseRequestClient(request: NextRequest) {
  const response = new Headers();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            const cookie = `${name}=${value}; Path=${options?.path ?? '/'}; SameSite=${options?.sameSite ?? 'Lax'}${options?.httpOnly ? '; HttpOnly' : ''}${options?.secure ? '; Secure' : ''}${options?.maxAge ? `; Max-Age=${options.maxAge}` : ''}`;
            response.append('Set-Cookie', cookie);
          });
        },
      },
    }
  );

  return { supabase, responseHeaders: response };
}