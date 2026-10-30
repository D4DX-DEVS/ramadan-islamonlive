import { getCloudflareContext } from '@opennextjs/cloudflare'
import { DB, purgePages } from '@/lib/db'
import { onRequest } from '@/lib/admin-api'

export const dynamic = 'force-dynamic'

const handle = async (request: Request, { params }: { params: Promise<{ path: string[] }> }) =>
  onRequest({
    request,
    params: await params,
    env: { DB, ADMIN_PASSWORD: getCloudflareContext().env.ADMIN_PASSWORD, SITE_ORIGIN: getCloudflareContext().env.SITE_URL, onChange: purgePages },
  })

export { handle as GET, handle as POST, handle as PUT, handle as DELETE }
