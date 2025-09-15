import { google } from 'googleapis'
import fs from 'fs'
import path from 'path'

const credentials = {
  type: 'service_account',
  project_id: process.env.GOOGLE_PROJECT_ID,
  private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
  private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.GOOGLE_CLIENT_EMAIL,
  client_id: process.env.GOOGLE_CLIENT_ID,
  auth_uri: 'https://accounts.google.com/o/oauth2/auth',
  token_uri: 'https://oauth2.googleapis.com/token',
  auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
  client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.GOOGLE_CLIENT_EMAIL}`,
}

function createTestFile() {
  const testContent = `Test Receipt - ${Date.now()}\nGenerated: ${new Date().toISOString()}`
  const filePath = path.join(process.cwd(), 'tmp', `test-${Date.now()}.txt`)
  
  const tmpDir = path.dirname(filePath)
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true })
  }
  
  fs.writeFileSync(filePath, testContent)
  return filePath
}

// Approach 1: Upload to root Drive (no folder)
async function testRootUpload() {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    })

    const drive = google.drive({ version: 'v3', auth })
    const testFilePath = createTestFile()
    
    const fileMetadata = {
      name: `test-root-${Date.now()}.txt`,
    }

    const media = {
      mimeType: 'text/plain',
      body: fs.createReadStream(testFilePath)
    }

    const response = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id,name,webViewLink',
    })

    fs.unlinkSync(testFilePath)

    return {
      success: true,
      approach: 'root-upload',
      file: response.data,
      message: 'Successfully uploaded to root Drive'
    }

  } catch (error) {
    return {
      success: false,
      approach: 'root-upload',
      error: error.message,
      code: error.code
    }
  }
}

// Approach 2: Upload with different scopes
async function testFullDriveScope() {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/drive'],
    })

    const drive = google.drive({ version: 'v3', auth })
    const testFilePath = createTestFile()
    
    const fileMetadata = {
      name: `test-full-scope-${Date.now()}.txt`,
    }

    const media = {
      mimeType: 'text/plain',
      body: fs.createReadStream(testFilePath)
    }

    const response = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id,name,webViewLink',
    })

    fs.unlinkSync(testFilePath)

    return {
      success: true,
      approach: 'full-drive-scope',
      file: response.data,
      message: 'Successfully uploaded with full Drive scope'
    }

  } catch (error) {
    return {
      success: false,
      approach: 'full-drive-scope',
      error: error.message,
      code: error.code
    }
  }
}

// Approach 3: Create shared drive first
async function testSharedDriveUpload() {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/drive'],
    })

    const drive = google.drive({ version: 'v3', auth })
    
    // Try to create a shared drive
    const sharedDriveMetadata = {
      name: `Reimbursement Shared Drive ${Date.now()}`
    }

    const sharedDrive = await drive.drives.create({
      resource: sharedDriveMetadata,
      requestId: `req-${Date.now()}`
    })

    // Upload to shared drive
    const testFilePath = createTestFile()
    const fileMetadata = {
      name: `test-shared-${Date.now()}.txt`,
      parents: [sharedDrive.data.id]
    }

    const media = {
      mimeType: 'text/plain',
      body: fs.createReadStream(testFilePath)
    }

    const response = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id,name,webViewLink',
      supportsAllDrives: true
    })

    fs.unlinkSync(testFilePath)

    return {
      success: true,
      approach: 'shared-drive',
      sharedDrive: sharedDrive.data,
      file: response.data,
      message: 'Successfully uploaded to shared drive'
    }

  } catch (error) {
    return {
      success: false,
      approach: 'shared-drive',
      error: error.message,
      code: error.code
    }
  }
}

// Approach 4: Upload as resumable media
async function testResumableUpload() {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    })

    const drive = google.drive({ version: 'v3', auth })
    const testFilePath = createTestFile()
    
    const fileMetadata = {
      name: `test-resumable-${Date.now()}.txt`,
    }

    const media = {
      mimeType: 'text/plain',
      body: fs.createReadStream(testFilePath),
      resumable: true
    }

    const response = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id,name,webViewLink',
    })

    fs.unlinkSync(testFilePath)

    return {
      success: true,
      approach: 'resumable-upload',
      file: response.data,
      message: 'Successfully uploaded with resumable media'
    }

  } catch (error) {
    return {
      success: false,
      approach: 'resumable-upload',
      error: error.message,
      code: error.code
    }
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    console.log('Testing multiple Google Drive upload approaches...')
    
    const results = []
    
    // Test all approaches
    const approaches = [
      testRootUpload,
      testFullDriveScope,
      testResumableUpload,
      testSharedDriveUpload
    ]

    for (const approach of approaches) {
      try {
        const result = await approach()
        results.push(result)
        console.log(`Approach ${result.approach}:`, result.success ? 'SUCCESS' : 'FAILED')
        
        // If we find a working approach, break
        if (result.success) {
          break
        }
      } catch (error) {
        results.push({
          success: false,
          approach: approach.name,
          error: error.message,
          code: error.code
        })
      }
    }

    const successfulApproach = results.find(r => r.success)

    res.status(200).json({
      timestamp: new Date().toISOString(),
      results,
      summary: {
        totalTested: results.length,
        successful: results.filter(r => r.success).length,
        workingApproach: successfulApproach?.approach || null,
        recommendation: successfulApproach ? 
          `Use ${successfulApproach.approach} for file uploads` : 
          'No working approach found - may need OAuth or different service account setup'
      }
    })

  } catch (error) {
    console.error('Drive approaches test error:', error)
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to test Drive upload approaches'
    })
  }
}
