export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    console.log('Request received:', {
      method: req.method,
      contentType: req.headers['content-type'],
      contentLength: req.headers['content-length']
    })
    
    // Immediately respond without hanging
    res.status(200).json({
      message: 'Simple test successful - no hanging',
      method: req.method,
      contentType: req.headers['content-type'],
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Simple test error:', error)
    res.status(500).json({
      error: error.message
    })
  }
}
