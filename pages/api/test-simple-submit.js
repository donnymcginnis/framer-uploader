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
    console.log('Request headers:', req.headers)
    console.log('Request method:', req.method)
    
    // Try to read the body directly
    let body = ''
    req.on('data', chunk => {
      body += chunk.toString()
    })
    
    req.on('end', () => {
      console.log('Raw body:', body.substring(0, 500) + '...')
      
      res.status(200).json({
        message: 'Simple test successful',
        contentType: req.headers['content-type'],
        bodyLength: body.length,
        bodyPreview: body.substring(0, 200)
      })
    })

  } catch (error) {
    console.error('Simple test error:', error)
    res.status(500).json({
      error: error.message,
      stack: error.stack
    })
  }
}
