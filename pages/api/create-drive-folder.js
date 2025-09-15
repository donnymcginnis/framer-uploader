import { google } from 'googleapis'

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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    })

    const drive = google.drive({ version: 'v3', auth })

    // Create a new folder for reimbursement receipts
    const folderMetadata = {
      name: 'Reimbursement Receipts',
      mimeType: 'application/vnd.google-apps.folder',
    }

    const folder = await drive.files.create({
      resource: folderMetadata,
      fields: 'id,name,webViewLink',
    })

    // Make the folder accessible to anyone with the link
    await drive.permissions.create({
      fileId: folder.data.id,
      resource: {
        role: 'reader',
        type: 'anyone',
      },
    })

    res.status(200).json({
      success: true,
      folder: {
        id: folder.data.id,
        name: folder.data.name,
        link: folder.data.webViewLink,
      },
      message: 'Google Drive folder created successfully',
      instruction: `Update your .env.local file with: GOOGLE_DRIVE_FOLDER_ID=${folder.data.id}`
    })

  } catch (error) {
    console.error('Drive folder creation error:', error)
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to create Google Drive folder'
    })
  }
}
