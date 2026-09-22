import { betterAuth } from 'better-auth'
import { phoneNumber } from 'better-auth/plugins'
import { pool } from './db'

const hasGoogleOAuth = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)

export const auth = betterAuth({
  database: pool,
  emailAndPassword: {
    enabled: true,
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
        // Dev mock: log OTP instead of sending SMS (plug a real SMS provider here)
        console.log(`[auth] mock SMS to ${phoneNumber}: code ${code}`)
      },
    }),
  ],
})
