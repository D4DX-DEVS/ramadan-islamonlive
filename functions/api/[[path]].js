// Admin API as a Cloudflare Pages Function: bindings DB (D1) and secret ADMIN_PASSWORD, see wrangler.toml.
// Secrets GITHUB_TOKEN (fine-grained token, Actions: read and write) + GITHUB_REPO ("owner/name") make every admin
// write start the Build and deploy workflow, so the static site is rebuilt from D1 and goes live by itself.
import { onRequest as handle } from '../../lib/admin-api.js'

async function rebuild(env) {
  if (!env.GITHUB_TOKEN || !env.GITHUB_REPO) return // saved in D1 anyway; the next deploy picks it up
  await fetch(`https://api.github.com/repos/${env.GITHUB_REPO}/actions/workflows/deploy.yml/dispatches`, {
    method: 'POST',
    headers: { authorization: `Bearer ${env.GITHUB_TOKEN}`, accept: 'application/vnd.github+json', 'user-agent': 'ramadan-admin' },
    body: JSON.stringify({ ref: 'main' }),
  }).catch(() => {})
}

export const onRequest = ({ request, env, params }) =>
  handle({ request, params, env: { DB: env.DB, ADMIN_PASSWORD: env.ADMIN_PASSWORD, onChange: () => rebuild(env) } })
