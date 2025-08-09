import { createBrowserClient } from '@supabase/ssr';
 
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
      heartbeatIntervalMs: 30000,
      reconnectAfterMs: (tries: number) => {
        return Math.min(tries * 1000, 30000);
      },
    },
    global: {
      headers: {
        'X-Client-Info': 'dwu-src-web-app',
      },
    },
  }
); 