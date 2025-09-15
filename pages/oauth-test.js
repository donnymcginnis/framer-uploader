import { useState } from 'react'

export default function OAuthTest() {
  const [code, setCode] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const response = await fetch('/api/oauth-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `code=${encodeURIComponent(code)}`
      })
      
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ success: false, error: error.message })
    }
    
    setLoading(false)
  }

  return (
    <div style={{ padding: '40px', fontFamily: 'Arial, sans-serif' }}>
      <h1>OAuth Token Exchange</h1>
      
      <div style={{ marginBottom: '30px' }}>
        <h3>Step 1: Get Authorization URL</h3>
        <a 
          href="/api/oauth-upload" 
          target="_blank"
          style={{ 
            background: '#007bff', 
            color: 'white', 
            padding: '10px 20px', 
            textDecoration: 'none', 
            borderRadius: '4px' 
          }}
        >
          Get Authorization URL
        </a>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h3>Step 2: Enter Authorization Code</h3>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Paste your authorization code here"
            style={{ 
              width: '400px', 
              padding: '10px', 
              marginRight: '10px',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
          />
          <button 
            type="submit" 
            disabled={!code || loading}
            style={{ 
              background: '#28a745', 
              color: 'white', 
              border: 'none',
              padding: '10px 20px', 
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {loading ? 'Exchanging...' : 'Get Refresh Token'}
          </button>
        </form>
      </div>

      {result && (
        <div style={{ 
          background: result.success ? '#d4edda' : '#f8d7da', 
          padding: '20px', 
          borderRadius: '4px',
          border: `1px solid ${result.success ? '#c3e6cb' : '#f5c6cb'}`
        }}>
          <h3>Result:</h3>
          <pre style={{ whiteSpace: 'pre-wrap' }}>
            {JSON.stringify(result, null, 2)}
          </pre>
          
          {result.success && result.refreshToken && (
            <div style={{ marginTop: '15px', background: '#fff3cd', padding: '15px', borderRadius: '4px' }}>
              <strong>Add this to your .env.local:</strong>
              <div style={{ 
                background: '#f8f9fa', 
                padding: '10px', 
                fontFamily: 'monospace',
                marginTop: '10px',
                borderRadius: '4px'
              }}>
                GOOGLE_OAUTH_REFRESH_TOKEN={result.refreshToken}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
