import { revalidatePath, revalidateTag } from 'next/cache'
import { DB } from '@/lib/db'
import { onRequest } from '@/lib/admin-api'

export const dynamic = 'force-dynamic'

// Any admin write drops the cached content, so the next visit to each page shows the change.
const onChange = async () => {
  revalidateTag('content', { expire: 0 })
  revalidatePath('/', 'layout')
  revalidatePath('/sitemap.xml')
  revalidatePath('/feed.xml')
}

const handle = async (request: Request, { params }: { params: Promise<{ path: string[] }> }) =>
  onRequest({ request, params: await params, env: { DB, ADMIN_PASSWORD: process.env.ADMIN_PASSWORD, onChange } })

export { handle as GET, handle as POST, handle as PUT, handle as DELETE }
