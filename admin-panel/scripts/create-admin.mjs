// Creates the admin login in Supabase Auth using the public (publishable) key.
// Reads ADMIN_EMAIL / ADMIN_PASSWORD from D:\onyx-policy\.env.
//   npm run create-admin
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const envFile = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '.env')
try {
  process.loadEnvFile(envFile)
} catch {
  console.error(`Could not read ${envFile}`)
  process.exit(1)
}

const { VITE_SUPABASE_URL: url, VITE_SUPABASE_PUBLISHABLE_KEY: key, ADMIN_EMAIL: email, ADMIN_PASSWORD: password } =
  process.env

if (!url || !key || !email || !password) {
  console.error('Missing VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY, ADMIN_EMAIL or ADMIN_PASSWORD in .env')
  process.exit(1)
}

const headers = { apikey: key, 'Content-Type': 'application/json' }

// 1) Does the account already work?
const login = await fetch(`${url}/auth/v1/token?grant_type=password`, {
  method: 'POST',
  headers,
  body: JSON.stringify({ email, password }),
})
if (login.ok) {
  console.log(`OK: ${email} already exists and the password in .env is correct. Nothing to do.`)
  process.exit(0)
}

// 2) Try to create it
const res = await fetch(`${url}/auth/v1/signup`, {
  method: 'POST',
  headers,
  body: JSON.stringify({ email, password, data: { name: 'Onyx Admin' } }),
})
const body = await res.json().catch(() => ({}))

if (!res.ok) {
  console.error('Sign-up failed:', body.msg || body.error_description || body.message || res.status)
  process.exit(1)
}

const identities = body.user?.identities ?? body.identities
if (Array.isArray(identities) && identities.length === 0) {
  console.log(
    `\nAn account for ${email} ALREADY EXISTS (probably created with Google sign-in) with a different password.\n` +
      'Fix: Supabase Dashboard -> Authentication -> Users -> open the user -> "Send password recovery"\n' +
      'or delete & re-add the user with the e-mail/password from .env (tick "Auto Confirm User").',
  )
  process.exit(0)
}

if (body.access_token) {
  console.log(`OK: admin account created and confirmed for ${email}.`)
} else {
  console.log(
    `OK: admin account created for ${email}.\n` +
      'Supabase e-mail confirmation is ON: open the confirmation e-mail sent to that inbox and click the link,\n' +
      'then you can log in at /admin/login.',
  )
}
