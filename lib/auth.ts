import { betterAuth } from 'better-auth'
import { admin, phoneNumber } from 'better-auth/plugins'
import { pool } from './db'

const hasGoogleOAuth = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)

// Max concurrent devices (sessions) per account.
// When a new session is created beyond the limit, the oldest one is revoked.
const MAX_SESSIONS_PER_USER = 2

export const auth = betterAuth({
  database: pool,
  emailAndPassword: {
    enabled: true,
  },
  advanced: {
    ipAddress: {
      // Behind Cloudflare -> Caddy -> app the x-forwarded-for chain has multiple
      // hops, which better-auth cannot resolve without trustedProxies (it stores
      // "" instead of an IP). Prefer the single-value client headers first.
      ipAddressHeaders: ['cf-connecting-ip', 'true-client-ip', 'x-real-ip', 'x-forwarded-for'],
    },
  },
  databaseHooks: {
    session: {
      create: {
        async before(session) {
          const active = await pool.query(
            'SELECT id FROM "session" WHERE "userId" = $1 AND "expiresAt" > NOW() ORDER BY "createdAt" ASC',
            [session.userId],
          )
          const excess = (active.rowCount ?? 0) - (MAX_SESSIONS_PER_USER - 1)
          if (excess > 0) {
            const ids = active.rows.slice(0, excess).map((row: { id: string }) => row.id)
            await pool.query('DELETE FROM "session" WHERE id = ANY($1)', [ids])
          }
        },
      },
    },
  },
  ...(hasGoogleOAuth
    ? {
        socialProviders: {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
          },
        },
      }
    : {}),
  plugins: [
    phoneNumber({
      sendOTP: ({ phoneNumber, code }) => {
        // Dev mock: log OTP instead of sending SMS.
        // In production, set SMS_PROVIDER env var and implement real provider (Twilio, Vonage, etc.).
        // This mock is only safe for single-instance dev environments.
        if (process.env.NODE_ENV === 'production' && !process.env.SMS_PROVIDER) {
          console.warn('[auth] SMS_PROVIDER not set in production — OTP will not be delivered')
        }
        console.log(`[auth] mock SMS to ${phoneNumber}: code ${code}`)
      },
    }),
    admin({
      defaultRole: 'user',
      adminRoles: ['admin'],
      // Optional bootstrap: seed the first admins from env (comma-separated user ids).
      adminUserIds: (process.env.ADMIN_USER_IDS ?? '').split(',').map((id) => id.trim()).filter(Boolean),
    }),
  ],
})
