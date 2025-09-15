# Framer Google Drive File Uploader

A secure file uploader component for Framer that uploads images to Google Drive via a hosted API endpoint.

## 🚀 Quick Setup

### 1. Deploy to Vercel

1. Push this project to a GitHub repository
2. Connect your GitHub repo to Vercel
3. In Vercel dashboard, go to your project settings → Environment Variables
4. Add the following environment variables:

```
GOOGLE_PROJECT_ID=upload-472215
GOOGLE_PRIVATE_KEY_ID=d876ddbbcfa02c27aad850391d8f3da7029b12f0
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCvcO94/XuxiGEa
LJuNp9DpkNGHCeaOT93lqVoJ+GJk3oNgXpVdFqA7GzYlCQo2kKBKA8C8Bs01ALjh
pBtvMsSfdJAUEvxzn8u0slEfm030O26TWJHuEZ9hU7dt7Xe9M37XV7gYll4uYuoS
wcJY7iTd1DqdDgdUT2XLC0fXbb11O2gJV28yt+4jdgLmokyJ1Mn0wCXwVcM5cwI2
zqp4KynSJgTn7zr2MeK8Tv96h58WCcC0DkucboHmMdjzty7+JEB9jUFvSg//tJQQ
WgjbKOGunIgF/ukORifaHcVstXwIoQej/4KjDBTPMyqBD3RPRIm3sGykCvBffXz2
xuvoh8Z9AgMBAAECggEATofPccmJTjj9OiGgiYKGVZ5g48DvRmGCspQhPRhFNuCR
TxhXZIFFvN9b160ZuL35Odg/NAsZXPHTUBFMxHQlpjifa5TqEvmCzgIJpQu4E6xs
vSDmxXl27bJzB45FzFeaHdtiiQL56mqVW0sG6xbCQteGWxnV9wvJRV9py4kQRsJQ
SZGOkW41Nkei4iQthJCcnlyQoJm0fICFa+w/Iakd1jw0Mf0D6APLKSUaLvWMlhG1
guYevlFRxzsUlB8l2Xcn0xGpqOu2aYM+NC04uHV++nWXG5FE4cCrhgzvZMn8TUgd
LeK9Qee8f+bKHWLlmqzTo94tv+gi8P8sBTzr+t0eswKBgQDeLf8XXgwQXfMjeREd
f7pOsKYqn/giuW4C9ZZ7ZPpD8eMfiCZyhNfvvzqI4gZ/JDHRku5785n/DXDRX6zu
3ejM4ifGbU7/hOLiDKgOXnLOfQCKSRYklcSmO215a1VW4UXd+ibxWqCsX+8CBn44
lO8VSgU35ieLfcJEfCJ/qNcMiwKBgQDKJZwsib37RaHt7eIHu4ywjRFNm+RMxUhf
JvSI2vaS1JJW5svnVtIXbDzIIwUnZovl9gxpH0WQUfa4yuKKTAFExO0x7QU9t3WI
FE6Ync83iUWnV8pfgOIL7j7Nn9ftELupgjFgjVjNuTD8TrLOAv8maj2kZfE6Izgl
ghdJAheyFwKBgFk+1qm3QFdOtby5A9P6m4bCVGzoxw6Dt5n+tkyomhKy1g2zbeYw
UGDgSo3zZLKrgktxntQxXNljt76SlO96Oeoaqel9vO7MnSo59UOYUrt44L+rbfaS
JmSzmFzebXAxmxP4SK5IPiQfgO0qWIc34/WEPyZeD+JrSJ6j0mO/GWrTAoGAf2ak
vw0wxyRjoejDA8yYJs1BkoAlqpzLt+x9QaN+s5t1f3+GEw8M6eY1iI1JukNO+GfR
+o7S8No3fM+hZzfvtL/IHicbnoH5eQITZuxOpNnHJGiYCwjXbl2BB2cuVyKso3CC
Xi+3QDDvRpTy7BPHaxaaMvpsxg9cW4dZ1ZGUDZECgYAnyx05Xc5mhlgd09ZujsFJ
7JaDEuRj2qi6ihJQxr3IkaJgaQR2Xm8gU/86ByJ9+1QeIaxYVRLXTIw1pQjO7H4E
IJTWYdDDOzV6TpjzThgSBq2wPeEc3QE3hmLNDYRrSp/SzzoLcRmhHoVYWdFQK4KC
wkbGMTXBxzYRjttDupWHrQ==
-----END PRIVATE KEY-----"
GOOGLE_CLIENT_EMAIL=framer-uploader-534@upload-472215.iam.gserviceaccount.com
GOOGLE_CLIENT_ID=111665074470528445815
GOOGLE_DRIVE_FOLDER_ID=1CdHChTMdg3aG3liIpE3PwEVG8YsT_n0f
```

5. Deploy the project

### 2. Update Framer Component

1. Copy the code from `framer-component.tsx`
2. In the Framer component code, update the `API_BASE_URL` constant with your Vercel deployment URL:
   ```typescript
   const API_BASE_URL = "https://your-actual-deployment-url.vercel.app"
   ```

## 📁 Project Structure

```
framer-uploader/
├── .env.local                 # Environment variables (local development)
├── package.json              # Dependencies and scripts
├── next.config.js            # Next.js configuration with CORS
├── pages/
│   └── api/
│       └── upload-to-drive.js # Main upload API endpoint
├── framer-component.tsx      # Framer component code (copy to Framer)
└── README.md                # This file
```

## 🔧 How It Works

### Backend (Hosted on Vercel)
- **API Endpoint**: `/api/upload-to-drive`
- **Authentication**: Uses Google Service Account for secure server-side authentication
- **File Processing**: Handles multipart form uploads, validates file types and sizes
- **Google Drive Integration**: Uploads files to specified folder and makes them publicly accessible
- **CORS Handling**: Properly configured to allow requests from Framer domains

### Frontend (Framer Component)
- **File Selection**: Drag & drop or click to select files
- **Upload Progress**: Visual feedback during upload process
- **Error Handling**: User-friendly error messages
- **Form Integration**: Returns Google Drive URLs for form submission

## 🛡️ Security Features

- ✅ Server-side authentication (private keys never exposed to client)
- ✅ File type validation (images only)
- ✅ File size limits (configurable, default 10MB)
- ✅ CORS properly configured
- ✅ Temporary file cleanup after upload

## 🎨 Customization Options

The Framer component includes these customizable properties:
- **Accepted File Types**: Control which file types are allowed
- **Max File Size**: Set upload size limits
- **Button Text**: Customize button labels
- **Colors**: Primary, success, and error colors
- **Border Radius**: Adjust component styling

## 📝 Usage in Framer

1. Add the component to your Framer project
2. Configure the properties in the property panel
3. Use the `onUploadComplete` callback to handle successful uploads:
   ```typescript
   // The callback receives the Google Drive URL and filename
   onUploadComplete: (fileUrl: string, fileName: string) => {
     // Add to your form data
     console.log('File uploaded:', fileUrl, fileName)
   }
   ```

## 🔍 API Response Format

Successful upload returns:
```json
{
  "success": true,
  "file": {
    "name": "timestamp-filename.jpg",
    "originalName": "original-filename.jpg",
    "size": 1234567,
    "type": "image/jpeg",
    "fileId": "google-drive-file-id",
    "publicUrl": "https://drive.google.com/file/d/FILE_ID/view",
    "directUrl": "https://drive.google.com/uc?id=FILE_ID"
  }
}
```
## 🚨 Troubleshooting

### CORS Issues
- Ensure `next.config.js` is properly configured
- Check that your Vercel deployment includes the CORS headers
- Verify the API endpoint URL is correct in the Framer component

### Upload Failures
- Check Vercel function logs for detailed error messages
- Verify Google Drive folder permissions
- Ensure service account has access to the target folder

### File Not Appearing in Google Drive
- Check the folder ID is correct
- Verify service account permissions
- Look for errors in Vercel function logs

### Google Sheets not updating:
- Verify `GOOGLE_SHEETS_ID` is correct
- Check service account permissions
- Ensure sheet has proper headers

### File uploads failing:
- Check Google Drive folder permissions
- Verify `GOOGLE_DRIVE_FOLDER_ID` is set
- Ensure service account has Drive access

### Form validation errors:
- Check required fields are filled
- Verify email format is valid
- Ensure terms checkbox is checked

## 📞 Support

If you encounter issues:
1. Check Vercel function logs
2. Verify environment variables are set correctly
3. Test the API endpoint directly with a tool like Postman
4. Ensure Google Drive folder permissions are correct
