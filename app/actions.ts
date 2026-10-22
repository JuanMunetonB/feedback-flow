'use server' // Obliga a esto a ejecutarse en Vercel, no en el navegador
import { redis } from '@/lib/redis'

export async function clearIdeasCache() {
  await redis.del('ideas_list') // Borra el caché instantáneamente
}