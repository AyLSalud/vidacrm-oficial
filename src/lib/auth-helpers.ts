import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function getAuthUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions)
  return (session?.user as Record<string, unknown>)?.id as string | null || null
}

export async function requireAuth(): Promise<string> {
  const userId = await getAuthUserId()
  if (!userId) {
    throw new Error('No autorizado')
  }
  return userId
}
