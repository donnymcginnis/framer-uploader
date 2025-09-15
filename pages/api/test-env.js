export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    // Check which environment variables are missing
    const requiredEnvVars = [
      'GOOGLE_PROJECT_ID',
      'GOOGLE_PRIVATE_KEY_ID', 
      'GOOGLE_PRIVATE_KEY',
      'GOOGLE_CLIENT_EMAIL',
      'GOOGLE_CLIENT_ID',
      'GOOGLE_DRIVE_FOLDER_ID',
      'GOOGLE_SHEETS_ID',
      'GOOGLE_OAUTH_CLIENT_ID',
      'GOOGLE_OAUTH_CLIENT_SECRET',
      'GOOGLE_OAUTH_REDIRECT_URI',
      'GOOGLE_OAUTH_REFRESH_TOKEN'
    ]

    const envStatus = {}
    const missingVars = []

    requiredEnvVars.forEach(varName => {
      const value = process.env[varName]
      if (!value) {
        envStatus[varName] = 'MISSING'
        missingVars.push(varName)
      } else {
        envStatus[varName] = 'SET (' + value.substring(0, 10) + '...)'
      }
    })

    res.status(200).json({
      message: 'Environment variables check',
      totalRequired: requiredEnvVars.length,
      totalSet: requiredEnvVars.length - missingVars.length,
      missingCount: missingVars.length,
      missingVars,
      envStatus,
      nodeEnv: process.env.NODE_ENV
    })

  } catch (error) {
    console.error('Environment check error:', error)
    res.status(500).json({ 
      message: 'Error checking environment',
      error: error.message
    })
  }
}
