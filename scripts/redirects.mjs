// Writes public/_redirects (Cloudflare Pages) from redirects.txt: "from to status" per line, the old WordPress URLs.
import fs from 'node:fs'
const lines = fs.readFileSync('redirects.txt', 'utf8').split(/\r?\n/).filter((l) => l.trim())
fs.writeFileSync('public/_redirects', lines.join('\n') + '\n')
console.log('public/_redirects:', lines.filter((l) => !l.startsWith('#')).length, 'rules')
