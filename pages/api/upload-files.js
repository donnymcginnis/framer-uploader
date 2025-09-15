import { google } from 'googleapis'
import formidable from 'formidable'
import fs from 'fs'

// Disable body parser for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
}

// OAuth client for Google Drive
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_OAUTH_CLIENT_ID,
  process.env.GOOGLE_OAUTH_CLIENT_SECRET,
  process.env.GOOGLE_OAUTH_REDIRECT_URI
)

if (process.env.GOOGLE_OAUTH_REFRESH_TOKEN) {
  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_OAUTH_REFRESH_TOKEN
  })
}

async function uploadToGoogleDrive(file, folderId = null) {
  try {
    // Get fresh access token for OAuth
    const { credentials } = await oauth2Client.refreshAccessToken()
    oauth2Client.setCredentials(credentials)

    const drive = google.drive({ version: 'v3', auth: oauth2Client })

    const fileMetadata = {
      name: file.originalFilename,
      parents: folderId ? [folderId] : [process.env.GOOGLE_DRIVE_FOLDER_ID],
    }

    const media = {
      mimeType: file.mimetype,
      body: fs.createReadStream(file.filepath),
    }

    const response = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id,name,webViewLink,size,createdTime',
    })

    // Make the file publicly viewable
    await drive.permissions.create({
      fileId: response.data.id,
      resource: {
        role: 'reader',
        type: 'anyone',
      },
    })

    return {
      success: true,
      file: {
        id: response.data.id,
        name: response.data.name,
        size: response.data.size,
        createdTime: response.data.createdTime,
        viewLink: response.data.webViewLink,
        directLink: `https://drive.google.com/uc?id=${response.data.id}`
      }
    }
  } catch (error) {
    console.error('Error uploading to Drive:', error)
    
    return {
      success: false,
      error: error.message,
      file: {
        name: file.originalFilename,
        error: error.message
      }
    }
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    // Parse the form data
    const form = formidable({
      uploadDir: './tmp',
      keepExtensions: true,
      maxFileSize: 20 * 1024 * 1024, // 20MB per file
      maxTotalFileSize: 100 * 1024 * 1024, // 100MB total
      maxFiles: 20, // Maximum 20 files
    })

    const [fields, files] = await form.parse(req)

    // Extract folder ID if provided
    const folderId = Array.isArray(fields.folderId) ? fields.folderId[0] : fields.folderId

    // Upload files to Google Drive
    const uploadResults = []

    for (const [key, fileArray] of Object.entries(files)) {
      const fileList = Array.isArray(fileArray) ? fileArray : [fileArray]
      
      for (const file of fileList) {
        try {
          const uploadResult = await uploadToGoogleDrive(file, folderId)
          uploadResults.push(uploadResult)
          
          // Clean up temporary file
          fs.unlinkSync(file.filepath)
        } catch (error) {
          console.error('Error processing file:', error)
          uploadResults.push({
            success: false,
            error: error.message,
            file: {
              name: file.originalFilename,
              error: error.message
            }
          })
          
          // Clean up temporary file even on error
          try {
            fs.unlinkSync(file.filepath)
          } catch (cleanupError) {
            console.error('Error cleaning up file:', cleanupError)
          }
        }
      }
    }

    const successfulUploads = uploadResults.filter(result => result.success)
    const failedUploads = uploadResults.filter(result => !result.success)

    res.status(200).json({
      success: true,
      message: `${successfulUploads.length} file(s) uploaded successfully`,
      results: uploadResults,
      summary: {
        total: uploadResults.length,
        successful: successfulUploads.length,
        failed: failedUploads.length
      },
      files: successfulUploads.map(result => result.file)
    })

  } catch (error) {
    console.error('Upload error:', error)
    
    // Handle specific formidable errors
    if (error.code === 1009) {
      return res.status(413).json({ 
        success: false,
        message: 'File size too large. Please reduce file sizes and try again.',
        error: 'File size limit exceeded'
      })
    }
    
    if (error.code === 1008) {
      return res.status(413).json({ 
        success: false,
        message: 'Too many files uploaded. Maximum 20 files allowed.',
        error: 'File count limit exceeded'
      })
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Error processing upload',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    })
  }
}
