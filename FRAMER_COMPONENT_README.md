# Framer File Uploader Component

## 🎯 Overview
A production-ready Framer component for uploading files directly to Google Drive using OAuth 2.0 authentication.

## ✅ Features
- **Drag & Drop Interface**: Modern file upload with visual feedback
- **Google Drive Integration**: Direct uploads using OAuth (no quota limits)
- **Multiple File Support**: Upload up to 20 files simultaneously
- **File Type Validation**: Configurable accepted file types
- **Size Limits**: Configurable max file size (up to 50MB per file)
- **Progress Feedback**: Real-time upload status and error handling
- **Image Previews**: Automatic preview generation for uploaded images
- **Responsive Design**: Works on desktop and mobile devices

## 🔧 Setup Instructions

### 1. Deploy Your Backend
Deploy this Next.js project to Vercel or your preferred hosting platform.

### 2. Update API URL
In `framer-component.tsx`, update the API_BASE_URL:
```typescript
const API_BASE_URL = 'https://your-domain.vercel.app';
```

### 3. Environment Variables
Ensure your deployment has all required environment variables:
- `GOOGLE_OAUTH_CLIENT_ID`
- `GOOGLE_OAUTH_CLIENT_SECRET`
- `GOOGLE_OAUTH_REDIRECT_URI`
- `GOOGLE_OAUTH_REFRESH_TOKEN`
- `GOOGLE_DRIVE_FOLDER_ID`

### 4. Add to Framer
1. Copy the entire `framer-component.tsx` file
2. Create a new Code Component in Framer
3. Paste the code
4. Configure the component properties

## 🎨 Component Properties

### File Settings
- **Allow Multiple Files**: Enable/disable multiple file selection
- **Max Files**: Maximum number of files (1-20)
- **Accepted File Types**: File types to accept (e.g., "image/*", ".pdf,.jpg")
- **Max File Size (MB)**: Maximum file size in megabytes (1-50)

### Text Customization
- **Button Text**: Text for the upload button
- **Uploading Text**: Text shown during upload
- **Drag Text**: Text shown in drag area

### Styling
- **Primary Color**: Main accent color
- **Success Color**: Color for success messages
- **Error Color**: Color for error messages
- **Border Radius**: Corner radius in pixels

## 📋 Callback Functions

### onUploadComplete
Called when all files finish uploading (success or failure):
```typescript
onUploadComplete: (files: UploadedFile[]) => void
```

### onSingleFileComplete
Called for the first uploaded file (backward compatibility):
```typescript
onSingleFileComplete: (fileUrl: string, fileName: string) => void
```

## 📊 Upload Response Structure

```typescript
interface UploadedFile {
  id: string              // Google Drive file ID
  name: string           // Original filename
  size: string           // File size in bytes
  createdTime: string    // Upload timestamp
  viewLink: string       // Google Drive view URL
  directLink: string     // Direct download URL
}
```

## 🔄 API Endpoint

The component uses `/api/upload-files` which:
- Accepts multipart form data
- Supports up to 20 files (100MB total)
- Returns detailed upload results
- Handles OAuth token refresh automatically

## 🧪 Testing

### Local Testing
1. Start your Next.js development server
2. Set `API_BASE_URL = 'http://localhost:3000'`
3. Test the component in Framer

### Production Testing
1. Deploy to your hosting platform
2. Update `API_BASE_URL` to your production URL
3. Test with real files

## 🔒 Security Features

- **OAuth 2.0**: Secure authentication with Google Drive
- **File Type Validation**: Client and server-side validation
- **Size Limits**: Prevents oversized uploads
- **Error Handling**: Graceful failure handling
- **CORS Support**: Cross-origin requests enabled

## 📱 Browser Compatibility

- **Desktop**: Chrome, Firefox, Safari, Edge (latest)
- **Mobile**: iOS Safari, Chrome Mobile
- **Features**: Drag & drop, file selection, progress feedback

## 🎯 Use Cases

- **Portfolio Uploads**: Let users upload images to your portfolio
- **Document Collection**: Collect PDFs, documents from users
- **Media Libraries**: Build user-generated content systems
- **File Sharing**: Create simple file sharing interfaces
- **Form Attachments**: Add file uploads to any Framer form

## 🔧 Customization Examples

### Image-Only Uploader
```typescript
acceptedFileTypes: "image/*"
maxFiles: 10
dragText: "Drop your images here"
```

### Document Uploader
```typescript
acceptedFileTypes: ".pdf,.doc,.docx"
maxFiles: 5
dragText: "Upload your documents"
```

### Single File Uploader
```typescript
allowMultiple: false
maxFiles: 1
buttonText: "Choose File"
```

## 📈 Monitoring

Files are uploaded to your configured Google Drive folder and can be monitored via:
- Google Drive folder: [View uploads](https://drive.google.com/drive/folders/YOUR_FOLDER_ID)
- Server logs for debugging upload issues
- Component callback functions for tracking usage

## 🚀 Production Deployment

1. Deploy Next.js backend to Vercel/hosting platform
2. Configure all environment variables
3. Update OAuth redirect URI for production domain
4. Update component API_BASE_URL
5. Test thoroughly before publishing Framer project

The component is now ready for production use with full Google Drive integration!
