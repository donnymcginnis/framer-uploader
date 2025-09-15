export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { code, error } = req.query

    if (error) {
      return res.status(400).json({
        success: false,
        error,
        message: 'OAuth authorization failed'
      })
    }

    if (code) {
      // Display the authorization code for easy copying
      return res.status(200).send(`
        <html>
          <head>
            <title>OAuth Authorization Code</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 40px; background: #f5f5f5; }
              .container { background: white; padding: 30px; border-radius: 8px; max-width: 600px; margin: 0 auto; }
              .code { background: #f0f0f0; padding: 15px; border-radius: 4px; font-family: monospace; word-break: break-all; }
              .copy-btn { background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; margin-top: 10px; }
              .instructions { background: #e7f3ff; padding: 15px; border-radius: 4px; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <h2>OAuth Authorization Successful!</h2>
              <p>Your authorization code is:</p>
              <div class="code" id="authCode">${code}</div>
              <button class="copy-btn" onclick="copyCode()">Copy Code</button>
              
              <div class="instructions">
                <h3>Next Step:</h3>
                <p>Now run this curl command in your terminal:</p>
                <div class="code">
curl -X POST http://localhost:3000/api/oauth-upload \\<br>
&nbsp;&nbsp;-H "Content-Type: application/x-www-form-urlencoded" \\<br>
&nbsp;&nbsp;-d "code=${code}"
                </div>
                <button class="copy-btn" onclick="copyCurl()">Copy Curl Command</button>
              </div>
            </div>
            
            <script>
              function copyCode() {
                navigator.clipboard.writeText('${code}');
                alert('Authorization code copied to clipboard!');
              }
              
              function copyCurl() {
                const curlCommand = \`curl -X POST http://localhost:3000/api/oauth-upload \\\\
  -H "Content-Type: application/x-www-form-urlencoded" \\\\
  -d "code=${code}"\`;
                navigator.clipboard.writeText(curlCommand);
                alert('Curl command copied to clipboard!');
              }
            </script>
          </body>
        </html>
      `)
    }

    return res.status(400).json({
      success: false,
      message: 'No authorization code received'
    })
  }

  res.status(405).json({ message: 'Method not allowed' })
}
