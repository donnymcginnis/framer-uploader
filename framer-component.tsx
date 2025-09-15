import React, { useState, useRef } from "react"
import { addPropertyControls, ControlType } from "framer"

// Replace with your actual deployment URL
const API_BASE_URL = 'http://localhost:3000';

interface UploadedFile {
  id: string
  name: string
  size: string
  createdTime: string
  viewLink: string
  directLink: string
}

interface FileUploaderProps {
  onUploadComplete?: (files: UploadedFile[]) => void
  onSingleFileComplete?: (fileUrl: string, fileName: string) => void
  acceptedFileTypes?: string
  maxFileSize?: number
  maxFiles?: number
  buttonText?: string
  uploadingText?: string
  dragText?: string
  errorColor?: string
  successColor?: string
  primaryColor?: string
  borderRadius?: number
  allowMultiple?: boolean
}

export default function FileUploader(props: FileUploaderProps) {
  const {
    onUploadComplete = () => {},
    onSingleFileComplete = () => {},
    acceptedFileTypes = "image/*",
    maxFileSize = 10,
    maxFiles = 5,
    buttonText = "Choose Files",
    uploadingText = "Uploading...",
    dragText = "Drag & drop images here",
    errorColor = "#ff4444",
    successColor = "#44ff44",
    primaryColor = "#007AFF",
    borderRadius = 8,
    allowMultiple = true,
  } = props

  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<"idle" | "success" | "error" | "partial">("idle")
  const [statusMessage, setStatusMessage] = useState("")
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: boolean}>({})
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFilesSelect = (files: FileList) => {
    const fileArray = Array.from(files)
    
    // Validate file count
    if (allowMultiple && fileArray.length > maxFiles) {
      setUploadStatus("error")
      setStatusMessage(`Maximum ${maxFiles} files allowed`)
      return
    }
    
    // Validate file sizes
    for (const file of fileArray) {
      if (file.size > maxFileSize * 1024 * 1024) {
        setUploadStatus("error")
        setStatusMessage(`File "${file.name}" exceeds ${maxFileSize}MB limit`)
        return
      }
    }

    uploadFiles(fileArray)
  }

  const uploadFiles = async (files: File[]) => {
    setIsUploading(true)
    setUploadStatus("idle")
    setStatusMessage("")
    setUploadProgress({})

    try {
      const formData = new FormData()
      files.forEach((file, index) => {
        formData.append(`file_${index}`, file)
      })

      const response = await fetch(`${API_BASE_URL}/api/upload-files`, {
        method: "POST",
        body: formData,
        mode: 'cors',
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        const uploadedFiles = result.files || []
        setUploadedFiles(uploadedFiles)
        
        if (result.summary.failed > 0) {
          setUploadStatus("partial")
          setStatusMessage(`${result.summary.successful} files uploaded, ${result.summary.failed} failed`)
        } else {
          setUploadStatus("success")
          setStatusMessage(`${uploadedFiles.length} file${uploadedFiles.length > 1 ? 's' : ''} uploaded successfully!`)
        }
        
        // Call callbacks
        onUploadComplete(uploadedFiles)
        
        // For backward compatibility, call single file callback for first file
        if (uploadedFiles.length > 0) {
          onSingleFileComplete(uploadedFiles[0].directLink, uploadedFiles[0].name)
        }
      } else {
        throw new Error(result.error || "Upload failed")
      }
    } catch (error) {
      console.error('Upload error:', error)
      setUploadStatus("error")
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        setStatusMessage("Network error - please check your connection and try again")
      } else if (error instanceof Error) {
        setStatusMessage(error.message)
      } else {
        setStatusMessage("Upload failed - please try again")
      }
    } finally {
      setIsUploading(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      handleFilesSelect(files)
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFilesSelect(files)
    }
  }

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  const getStatusColor = () => {
    switch (uploadStatus) {
      case "success":
        return successColor
      case "error":
        return errorColor
      default:
        return "#666"
    }
  }

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "400px",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFileTypes}
        multiple={allowMultiple}
        onChange={handleFileInputChange}
        style={{ display: "none" }}
      />

      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${isDragging ? primaryColor : "#ddd"}`,
          borderRadius: `${borderRadius}px`,
          padding: "40px 20px",
          textAlign: "center",
          backgroundColor: isDragging ? `${primaryColor}10` : "#fafafa",
          transition: "all 0.2s ease",
          cursor: "pointer",
          marginBottom: "16px",
        }}
        onClick={handleButtonClick}
      >
        {isUploading ? (
          <div>
            <div
              style={{
                width: "24px",
                height: "24px",
                border: `3px solid ${primaryColor}30`,
                borderTop: `3px solid ${primaryColor}`,
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                margin: "0 auto 12px",
              }}
            />
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ 
                width: '80px', 
                height: '80px', 
                margin: '0 auto 20px',
                backgroundColor: '#f5f5f5',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '32px'
              }}>
                📁
              </div>
              <p style={{ 
                margin: '0 0 10px', 
                color: '#666',
                fontSize: '16px'
              }}>
                {dragText}
              </p>
              <p style={{ 
                margin: '0 0 20px', 
                color: '#999',
                fontSize: '12px'
              }}>
                Max file size: {maxFileSize}MB
              </p>
              <button
                style={{
                  backgroundColor: primaryColor,
                  color: "white",
                  border: "none",
                  padding: "12px 24px",
                  borderRadius: `${borderRadius}px`,
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor: "pointer",
                  transition: "opacity 0.2s ease",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.opacity = "0.9"
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.opacity = "1"
                }}
              >
                {buttonText}
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div
              style={{
                fontSize: "48px",
                marginBottom: "12px",
                color: isDragging ? primaryColor : "#ccc",
              }}
            >
              📁
            </div>
            <p style={{ margin: "0 0 8px", color: "#666", fontSize: "16px" }}>
              {dragText}
            </p>
            <button
              style={{
                backgroundColor: primaryColor,
                color: "white",
                border: "none",
                padding: "12px 24px",
                borderRadius: `${borderRadius}px`,
                fontSize: "14px",
                fontWeight: "500",
                cursor: "pointer",
                transition: "opacity 0.2s ease",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.opacity = "0.9"
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.opacity = "1"
              }}
            >
              {buttonText}
            </button>
          </div>
        )}
      </div>

      {/* Status message */}
      {statusMessage && (
        <div
          style={{
            padding: "12px",
            borderRadius: `${borderRadius}px`,
            backgroundColor: uploadStatus === "success" ? `${successColor}20` : `${errorColor}20`,
            border: `1px solid ${getStatusColor()}30`,
            marginBottom: "16px",
          }}
        >
          <p
            style={{
              margin: 0,
              color: getStatusColor(),
              fontSize: "14px",
              fontWeight: "500",
            }}
          >
            {statusMessage}
          </p>
          {(uploadStatus === "success" || uploadStatus === "partial") && uploadedFiles.length > 0 && (
            <div style={{ marginTop: "8px" }}>
              {uploadedFiles.map((file, index) => (
                <p
                  key={file.id}
                  style={{
                    margin: "2px 0",
                    color: "#666",
                    fontSize: "12px",
                  }}
                >
                  ✓ {file.name}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Preview for uploaded images */}
      {(uploadStatus === "success" || uploadStatus === "partial") && uploadedFiles.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: uploadedFiles.length === 1 ? "1fr" : "repeat(auto-fit, minmax(150px, 1fr))",
            gap: "8px",
            marginTop: "16px",
          }}
        >
          {uploadedFiles.map((file) => (
            <div
              key={file.id}
              style={{
                border: "1px solid #ddd",
                borderRadius: `${borderRadius}px`,
                overflow: "hidden",
              }}
            >
              <img
                src={file.directLink}
                alt={file.name}
                style={{
                  width: "100%",
                  height: "150px",
                  objectFit: "cover",
                }}
              />
              <div
                style={{
                  padding: "8px",
                  fontSize: "12px",
                  color: "#666",
                  backgroundColor: "#f9f9f9",
                  textAlign: "center",
                }}
              >
                {file.name}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CSS Animation */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  )
}

// Framer property controls
addPropertyControls(FileUploader, {
  allowMultiple: {
    type: ControlType.Boolean,
    title: "Allow Multiple Files",
    defaultValue: true,
  },
  maxFiles: {
    type: ControlType.Number,
    title: "Max Files",
    defaultValue: 5,
    min: 1,
    max: 20,
    step: 1,
    hidden: (props) => !props.allowMultiple,
  },
  acceptedFileTypes: {
    type: ControlType.String,
    title: "Accepted File Types",
    defaultValue: "image/*",
    description: "File types to accept (e.g., image/*, .jpg,.png)",
  },
  maxFileSize: {
    type: ControlType.Number,
    title: "Max File Size (MB)",
    defaultValue: 10,
    min: 1,
    max: 50,
    step: 1,
  },
  buttonText: {
    type: ControlType.String,
    title: "Button Text",
    defaultValue: "Choose Files",
  },
  uploadingText: {
    type: ControlType.String,
    title: "Uploading Text",
    defaultValue: "Uploading...",
  },
  dragText: {
    type: ControlType.String,
    title: "Drag Text",
    defaultValue: "Drag & drop images here",
  },
  primaryColor: {
    type: ControlType.Color,
    title: "Primary Color",
    defaultValue: "#007AFF",
  },
  successColor: {
    type: ControlType.Color,
    title: "Success Color",
    defaultValue: "#44ff44",
  },
  errorColor: {
    type: ControlType.Color,
    title: "Error Color",
    defaultValue: "#ff4444",
  },
  borderRadius: {
    type: ControlType.Number,
    title: "Border Radius",
    defaultValue: 8,
    min: 0,
    max: 20,
    step: 1,
  },
})
