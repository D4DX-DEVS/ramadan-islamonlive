// Upload public/uploads/** to the R2 bucket as `uploads/**` (S3-compatible API). Safe to re-run:
// objects that already exist with the same size are skipped.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'

const { R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME } = process.env
if (!R2_ENDPOINT || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
  throw new Error('Set R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY and R2_BUCKET_NAME in .env')
}

const s3 = new S3Client({ region: 'auto', endpoint: R2_ENDPOINT, credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY } })
const TYPES = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif' }
const walk = (d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]))
const files = walk('public/uploads')

let done = 0, skipped = 0, failed = 0, next = 0
await Promise.all(
  Array.from({ length: 6 }, async () => {
    while (next < files.length) {
      const file = files[next++]
      const key = file.replaceAll('\\', '/').replace(/^public\//, '')
      const body = readFileSync(file)
      try {
        const head = await s3.send(new HeadObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key })).catch(() => null)
        if (head?.ContentLength === body.length) { skipped++; continue }
        await s3.send(new PutObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: key,
          Body: body,
          ContentType: TYPES[key.split('.').pop().toLowerCase()] ?? 'application/octet-stream',
          CacheControl: 'public, max-age=31536000, immutable',
        }))
        done++
      } catch (e) {
        failed++
        console.warn('FAILED', key.slice(-50), e.name)
      }
    }
  }),
)
console.log(`${files.length} files: ${done} uploaded, ${skipped} already there, ${failed} failed`)
if (failed) process.exitCode = 1
