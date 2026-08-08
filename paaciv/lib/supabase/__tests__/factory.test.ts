import { createBrowserClient } from '@/lib/supabase/client'

test('le client navigateur expose une API "from"', () => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://x.supabase.co'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon'
  const c = createBrowserClient()
  expect(typeof c.from).toBe('function')
})
