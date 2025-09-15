# Gen Sales Reimbursement Form - Deployment Guide

## 🎯 Overview
Production-ready Next.js reimbursement form with Google Sheets integration and OAuth-based Google Drive file uploads.

## ✅ Features
- Mobile-friendly responsive design with dark theme
- Drag & drop file upload interface
- Google Sheets data logging
- Google Drive file storage (OAuth-based)
- Form validation and error handling
- Automatic file permissions (publicly viewable)

## 🔧 Environment Variables Required

### Google Service Account (for Sheets)
```env
GOOGLE_PROJECT_ID=your_project_id_here
GOOGLE_PRIVATE_KEY_ID=your_private_key_id_here
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n[YOUR_PRIVATE_KEY]\n-----END PRIVATE KEY-----\n"
GOOGLE_CLIENT_EMAIL=your_service_account_email_here
GOOGLE_CLIENT_ID=your_client_id_here
```

### Google OAuth 2.0 (for Drive uploads)
```env
GOOGLE_OAUTH_CLIENT_ID=your_oauth_client_id_here
GOOGLE_OAUTH_CLIENT_SECRET=your_oauth_client_secret_here
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:3000/api/oauth-callback
GOOGLE_OAUTH_REFRESH_TOKEN=your_refresh_token_here
```

### Google Services Configuration
```env
GOOGLE_DRIVE_FOLDER_ID=your_drive_folder_id_here
GOOGLE_SHEETS_ID=your_sheets_id_here
```

## 🚀 Deployment Steps

### 1. Local Development
```bash
npm install
npm run dev
```

### 2. Production Deployment (Vercel)
1. Push code to GitHub repository
2. Connect repository to Vercel
3. Add all environment variables in Vercel dashboard
4. Update `GOOGLE_OAUTH_REDIRECT_URI` to production URL
5. Deploy

### 3. Update OAuth Redirect URI
For production, update in Google Cloud Console:
- Development: `http://localhost:3000/api/oauth-callback`
- Production: `https://your-domain.vercel.app/api/oauth-callback`

## 📊 Google Services Setup

### Google Sheets
- **Spreadsheet ID**: `1kgd56N2tuKQvysZTxufwt-KVIaF3rUN3UG3ImSRU7S0`
- **Sheet Name**: "Reimbursements"
- **Access**: [View Spreadsheet](https://docs.google.com/spreadsheets/d/1kgd56N2tuKQvysZTxufwt-KVIaF3rUN3UG3ImSRU7S0)

### Google Drive
- **Folder ID**: `1lYKch4JHf2QySYpgwpGW_DM9B2uhei8w`
- **Folder Name**: "Reimbursement Receipts (OAuth)"
- **Access**: [View Folder](https://drive.google.com/drive/folders/1lYKch4JHf2QySYpgwpGW_DM9B2uhei8w)

## 🔒 Security Notes

### OAuth vs Service Account
- **Google Sheets**: Uses service account (sufficient for data logging)
- **Google Drive**: Uses OAuth 2.0 (bypasses service account storage quota)

### File Permissions
- Uploaded files are automatically set to "anyone with link can view"
- Files are stored in a dedicated OAuth-managed folder
- No sensitive data should be uploaded

## 🧪 Testing Endpoints

### API Test Endpoints
- `POST /api/test-apis` - Test Google Sheets/Drive connections
- `POST /api/test-oauth-upload` - Test OAuth file upload
- `POST /api/setup-sheet` - Initialize Google Sheets structure
- `GET /api/oauth-upload` - Get OAuth authorization URL

### Form Testing
1. Visit: `http://localhost:3000`
2. Fill out the form with test data
3. Upload a test file (PDF or image)
4. Submit and verify:
   - Success message appears
   - Data appears in Google Sheets
   - File appears in Google Drive folder

## 📱 Browser Compatibility
- Chrome, Firefox, Safari, Edge (latest versions)
- Mobile responsive (iOS Safari, Chrome Mobile)
- File drag & drop supported on desktop
- Touch-friendly interface on mobile

## 🔧 Troubleshooting

### Common Issues
1. **"Storage quota exceeded"**: OAuth setup resolves this
2. **"Sheet not found"**: Run `/api/setup-sheet` endpoint
3. **"OAuth token expired"**: Refresh token automatically renews
4. **File upload fails**: Check file size (20MB limit per file)

### Debug Endpoints
- Check Google Sheets: `/api/test-apis`
- Check OAuth upload: `/api/test-oauth-upload`
- View form: `/oauth-test` (visual OAuth testing)

## 📈 Monitoring
- Form submissions logged to Google Sheets with timestamps
- File upload success/failure tracked
- Error messages logged to console (development mode)

## 🎨 Customization
- Styling: `styles/Reimbursement.module.css`
- Form fields: `pages/index.js`
- API logic: `pages/api/submit-reimbursement.js`
- Colors match Gen Sales branding (#4a9eff accent)
