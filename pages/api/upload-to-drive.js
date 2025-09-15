import { google } from 'googleapis';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

// Disable Next.js body parser to handle multipart/form-data
export const config = {
  api: {
    bodyParser: false,
    sizeLimit: '4.5mb',
  },
};

// Simple CORS configuration - allow all origins for debugging

// Initialize Google Drive API
const initializeDrive = () => {
  try {
    // Handle private key formatting - multiple approaches for different formats
    let privateKey = process.env.GOOGLE_PRIVATE_KEY;
    
    // Remove outer quotes if present
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.slice(1, -1);
    }
    if (privateKey.startsWith("'") && privateKey.endsWith("'")) {
      privateKey = privateKey.slice(1, -1);
    }
    
    // Replace escaped newlines with actual newlines
    privateKey = privateKey.replace(/\\n/g, '\n');
    
    // Ensure proper PEM format
    if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
      throw new Error('Private key does not contain proper PEM headers');
    }

    console.log('Private key format check - starts with:', privateKey.substring(0, 50));
    console.log('Private key format check - ends with:', privateKey.substring(privateKey.length - 50));

    const credentials = {
      type: 'service_account',
      project_id: process.env.GOOGLE_PROJECT_ID,
      private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
      private_key: privateKey,
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      client_id: process.env.GOOGLE_CLIENT_ID,
      auth_uri: 'https://accounts.google.com/o/oauth2/auth',
      token_uri: 'https://oauth2.googleapis.com/token',
      auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
      client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.GOOGLE_CLIENT_EMAIL}`,
    };

    console.log('Initializing Google Auth with credentials...');
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });

    return google.drive({ version: 'v3', auth });
  } catch (error) {
    console.error('Error initializing Google Drive:', error);
    throw error;
  }
};

// Upload file to Google Drive
const uploadToDrive = async (filePath, fileName, mimeType) => {
  const drive = initializeDrive();
  
  const fileMetadata = {
    name: fileName,
    parents: [process.env.GOOGLE_DRIVE_FOLDER_ID],
  };

  const media = {
    mimeType: mimeType,
    body: fs.createReadStream(filePath),
  };

  try {
    const response = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id',
    });

    // Make file publicly accessible
    await drive.permissions.create({
      fileId: response.data.id,
      resource: {
        role: 'reader',
        type: 'anyone',
      },
    });

    // Return the public URL
    const publicUrl = `https://drive.google.com/file/d/${response.data.id}/view`;
    const directUrl = `https://drive.google.com/uc?id=${response.data.id}`;
    
    return {
      fileId: response.data.id,
      publicUrl: publicUrl,
      directUrl: directUrl,
    };
  } catch (error) {
    console.error('Error uploading to Google Drive:', error);
    throw error;
  }
};

export default async function handler(req, res) {
  // Set CORS headers immediately for all requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    console.log('OPTIONS request from origin:', req.headers.origin);
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Starting file upload process...');
    
    // Check environment variables
    const requiredEnvVars = ['GOOGLE_PROJECT_ID', 'GOOGLE_PRIVATE_KEY', 'GOOGLE_CLIENT_EMAIL', 'GOOGLE_DRIVE_FOLDER_ID'];
    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        console.error(`Missing environment variable: ${envVar}`);
        return res.status(500).json({ error: `Missing environment variable: ${envVar}` });
      }
    }
    
    // Parse the incoming form data
    const form = formidable({
      uploadDir: '/tmp',
      keepExtensions: true,
      maxFileSize: 4.5 * 1024 * 1024, // 4.5MB (Vercel limit)
      allowEmptyFiles: true,
      minFileSize: 1, // Allow files with at least 1 byte
    });

    console.log('Parsing form data...');
    const [fields, files] = await form.parse(req);
    
    console.log('Files received:', Object.keys(files));
    
    if (!files.file || files.file.length === 0) {
      console.log('No files found in request');
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    console.log('Processing file:', file.originalFilename, 'Size:', file.size);
    
    // Validate file size
    if (!file.size || file.size === 0) {
      console.log('File has zero size:', file.originalFilename);
      return res.status(400).json({ error: 'File is empty or corrupted' });
    }
    
    // Upload to Google Drive
    console.log('Uploading to Google Drive...');
    const result = await uploadToDrive(file.filepath, file.originalFilename, file.mimetype);
    
    // Clean up temporary file
    if (fs.existsSync(file.filepath)) {
      fs.unlinkSync(file.filepath);
    }
    
    console.log('Upload successful:', result.fileId);
    res.status(200).json(result);
  } catch (error) {
    console.error('Upload error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Upload failed', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
