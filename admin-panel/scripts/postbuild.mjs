// GitHub Pages is static hosting: /admin/login would 404 because there is no
// such file. After the build we copy index.html into a folder for every route,
// so /admin/login, /admin/dashboard ... all load the React app.
import { copyFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'admin')
const source = join(outDir, 'index.html')

if (!existsSync(source)) {
  console.error('admin/index.html not found - did the build fail?')
  process.exit(1)
}

const routes = [
  'login',
  'dashboard',
  'users',
  'transactions',
  'issues',
  'feedback',
  'announcements',
  'earnings',
  'website',
  'app-controls',
  'settings',
]

for (const route of routes) {
  const dir = join(outDir, route)
  mkdirSync(dir, { recursive: true })
  copyFileSync(source, join(dir, 'index.html'))
}

console.log(`Created route entry points for: ${routes.map((r) => '/admin/' + r).join(', ')}`)
