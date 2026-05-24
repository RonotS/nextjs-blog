import { type NextRequest } from 'next/server'
import { requireApiKey } from '@/lib/apiAuth'
import { apiSuccess, apiError } from '@/lib/apiHelpers'
import { checkRateLimit } from '@/lib/rateLimit'
import { createServiceClient } from '@/lib/supabase/service'
import { hashApiKey } from '@/features/api-keys/apiKeyService'

export async function GET(req: NextRequest) {
  const auth = await requireApiKey(req)
  if (!auth.success) return apiError(auth.error, auth.status)

  const rawKey = req.headers.get('Authorization')!.slice(7).trim()
  const rl = checkRateLimit(hashApiKey(rawKey), 60, 60_000)
  if (!rl.allowed) {
    return apiError('Rate limit exceeded. Max 60 requests per minute.', 429, {
      retry_after: rl.retryAfter,
    })
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, slug')
    .order('name', { ascending: true })

  if (error) {
    console.error('[GET /api/categories] DB error:', error.message)
    return apiError('Failed to fetch categories.', 500)
  }

  return apiSuccess({ data: data ?? [] })
}
