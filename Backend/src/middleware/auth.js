const { createClerkClient, verifyToken } = require('@clerk/backend')

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY })

const requireAuth = async (req, res, next) => {
  try {
    // Strategy 1: x-clerk-user-id header (direct userId)
    const headerUserId = req.headers['x-clerk-user-id']
    if (headerUserId) {
      req.auth = { userId: headerUserId }
      return next()
    }

    // Strategy 2: Bearer token
    const authHeader = req.headers['authorization']
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1]
      try {
        const payload = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY })
        req.auth = { userId: payload.sub }
        return next()
      } catch {}

      // Strategy 3: Clerk session token via API
      try {
        const { isSignedIn, toAuth } = await clerkClient.authenticateRequest(req, {
          secretKey: process.env.CLERK_SECRET_KEY,
        })
        if (isSignedIn) {
          req.auth = { userId: toAuth().userId }
          return next()
        }
      } catch {}
    }

    return res.status(401).json({ error: 'Unauthorized' })
  } catch (err) {
    console.error('Auth error:', err.message)
    return res.status(401).json({ error: 'Auth failed' })
  }
}

module.exports = { requireAuth }
