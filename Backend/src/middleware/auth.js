const { createClerkClient } = require('@clerk/backend')

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY })

const requireAuth = async (req, res, next) => {
  try {
    const userId = req.headers['x-clerk-user-id']
    if (!userId) return res.status(401).json({ error: 'No user id provided' })

    const user = await clerkClient.users.getUser(userId)
    if (!user?.id) return res.status(401).json({ error: 'Invalid user' })

    req.auth = { userId: user.id }
    return next()
  } catch (err) {
    console.error('Auth error:', err.message)
    return res.status(401).json({ error: 'Auth failed' })
  }
}

module.exports = { requireAuth }
