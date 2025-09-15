import React, { useState } from "react"

// Configuration - Update this to your production URL
const API_BASE_URL = "https://framer-uploader-ckth.vercel.app"

// Types
interface FormData {
  name: string
  email: string
  phone: string
  amount: string
  description: string
  receiptFiles: File[]
  agreeToContact: boolean
  agreeToTerms: boolean
}

interface ReimbursementFormProps {
  width?: number | string
  height?: number | string
  onSubmitSuccess?: (message: string) => void
  onSubmitError?: (error: string) => void
}

// Main Component - Complete Reimbursement Form
export default function ReimbursementForm({
  width = "100%",
  height = "auto",
  onSubmitSuccess = () => {},
  onSubmitError = () => {},
}: ReimbursementFormProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    amount: '',
    description: '',
    receiptFiles: [],
    agreeToContact: false,
    agreeToTerms: false
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState('')

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setFormData(prev => ({
      ...prev,
      receiptFiles: [...prev.receiptFiles, ...files]
    }))
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    setFormData(prev => ({
      ...prev,
      receiptFiles: [...prev.receiptFiles, ...files]
    }))
  }

  const removeFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      receiptFiles: prev.receiptFiles.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      const formDataToSend = new FormData()
      
      // Add form fields
      Object.keys(formData).forEach(key => {
        if (key !== 'receiptFiles') {
          formDataToSend.append(key, (formData as any)[key])
        }
      })
      
      // Add files
      formData.receiptFiles.forEach((file, index) => {
        formDataToSend.append(`receipt_${index}`, file)
      })
      
      const response = await fetch(`${API_BASE_URL}/api/submit-reimbursement`, {
        method: 'POST',
        body: formDataToSend
      })
      
      if (response.ok) {
        const successMessage = 'Reimbursement request submitted successfully!'
        setSubmitMessage(successMessage)
        onSubmitSuccess(successMessage)
        setFormData({
          name: '',
          email: '',
          phone: '',
          amount: '',
          description: '',
          receiptFiles: [],
          agreeToContact: false,
          agreeToTerms: false
        })
      } else {
        const errorData = await response.json()
        const errorMessage = errorData.message || 'Error submitting request. Please try again.'
        setSubmitMessage(errorMessage)
        onSubmitError(errorMessage)
      }
    } catch (error) {
      console.error('Submission error:', error)
      const errorMessage = 'Network error. Please check your connection and try again.'
      setSubmitMessage(errorMessage)
      onSubmitError(errorMessage)
    }
    
    setIsSubmitting(false)
  }

  const styles = {
    container: {
      width: typeof width === 'number' ? `${width}px` : width,
      height: typeof height === 'number' ? `${height}px` : height,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif',
      backgroundColor: '#0a0a0a',
      color: '#ffffff',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column' as const,
    },
    header: {
      backgroundColor: '#111111',
      borderBottom: '1px solid #333333',
      position: 'sticky' as const,
      top: 0,
      zIndex: 100,
    },
    nav: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '1rem 2rem',
      maxWidth: '1200px',
      margin: '0 auto',
    },
    logo: {
      fontWeight: 'bold',
      fontSize: '1.2rem',
      color: '#ffffff',
    },
    menuButton: {
      background: 'none',
      border: 'none',
      fontSize: '1rem',
      cursor: 'pointer',
      padding: '0.5rem 1rem',
      borderRadius: '4px',
      transition: 'background-color 0.2s',
      color: '#ffffff',
    },
    main: {
      flex: 1,
      padding: '2rem',
      maxWidth: '800px',
      margin: '0 auto',
      width: '100%',
    },
    formContainer: {
      backgroundColor: '#1a1a1a',
      padding: '2rem',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
      border: '1px solid #333333',
    },
    title: {
      fontSize: '2.5rem',
      fontWeight: 300,
      marginBottom: '2rem',
      color: '#ffffff',
      textAlign: 'center' as const,
    },
    form: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '1.5rem',
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '0.5rem',
    },
    label: {
      fontWeight: 500,
      color: '#ffffff',
      fontSize: '0.95rem',
    },
    input: {
      padding: '0.75rem',
      border: '2px solid #333333',
      borderRadius: '4px',
      fontSize: '1rem',
      transition: 'border-color 0.2s, box-shadow 0.2s',
      fontFamily: 'inherit',
      backgroundColor: '#222222',
      color: '#ffffff',
    },
    textarea: {
      padding: '0.75rem',
      border: '2px solid #333333',
      borderRadius: '4px',
      fontSize: '1rem',
      transition: 'border-color 0.2s, box-shadow 0.2s',
      fontFamily: 'inherit',
      backgroundColor: '#222222',
      color: '#ffffff',
      resize: 'vertical' as const,
      minHeight: '100px',
    },
    dropZone: {
      position: 'relative' as const,
      border: '2px dashed #444444',
      borderRadius: '8px',
      padding: '2rem',
      textAlign: 'center' as const,
      backgroundColor: '#1a1a1a',
      transition: 'border-color 0.2s, background-color 0.2s',
      cursor: 'pointer',
    },
    fileInput: {
      position: 'absolute' as const,
      opacity: 0,
      width: '100%',
      height: '100%',
      cursor: 'pointer',
    },
    dropZoneLabel: {
      cursor: 'pointer',
      display: 'block',
    },
    dropZoneContent: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '0.5rem',
      color: '#cccccc',
    },
    fileList: {
      marginTop: '1rem',
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '0.5rem',
    },
    fileItem: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '0.5rem',
      backgroundColor: '#2a2a2a',
      borderRadius: '4px',
      fontSize: '0.9rem',
      color: '#ffffff',
    },
    removeFile: {
      background: '#ff4444',
      color: 'white',
      border: 'none',
      borderRadius: '50%',
      width: '24px',
      height: '24px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '1.2rem',
      lineHeight: 1,
    },
    checkboxGroup: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '0.75rem',
      margin: '1rem 0',
    },
    checkboxLabel: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '0.75rem',
      cursor: 'pointer',
      lineHeight: 1.5,
    },
    checkbox: {
      marginTop: '0.25rem',
      width: '16px',
      height: '16px',
      flexShrink: 0,
    },
    checkboxText: {
      fontSize: '0.9rem',
      color: '#cccccc',
      lineHeight: 1.5,
    },
    privacyText: {
      fontSize: '0.85rem',
      color: '#aaaaaa',
      lineHeight: 1.5,
      margin: '1rem 0',
    },
    submitButton: {
      backgroundColor: formData.agreeToTerms && !isSubmitting ? '#4a9eff' : '#444444',
      color: formData.agreeToTerms && !isSubmitting ? '#ffffff' : '#888888',
      border: 'none',
      padding: '1rem 2rem',
      fontSize: '1.1rem',
      fontWeight: 600,
      borderRadius: '4px',
      cursor: formData.agreeToTerms && !isSubmitting ? 'pointer' : 'not-allowed',
      transition: 'background-color 0.2s, transform 0.1s',
      marginTop: '1rem',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.5px',
    },
    message: {
      padding: '1rem',
      borderRadius: '4px',
      marginTop: '1rem',
      textAlign: 'center' as const,
      fontWeight: 500,
      backgroundColor: submitMessage.includes('successfully') ? '#1a4a2a' : '#4a1a1a',
      color: submitMessage.includes('successfully') ? '#66ff99' : '#ff6666',
      border: `1px solid ${submitMessage.includes('successfully') ? '#2a5a3a' : '#5a2a2a'}`,
    },
    footer: {
      backgroundColor: '#111111',
      borderTop: '1px solid #333333',
      padding: '2rem',
      marginTop: 'auto',
    },
    footerContent: {
      maxWidth: '1200px',
      margin: '0 auto',
      display: 'grid',
      gridTemplateColumns: '1fr 2fr',
      gap: '2rem',
    },
    footerSection: {
      color: '#ffffff',
    },
    footerLinks: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
      gap: '0.5rem',
    },
    footerLink: {
      color: '#4a9eff',
      textDecoration: 'none',
      fontSize: '0.9rem',
      padding: '0.25rem 0',
      transition: 'color 0.2s',
    },
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <nav style={styles.nav}>
          <div style={styles.logo}>
            <span>GEN SALES</span>
          </div>
          <button style={styles.menuButton}>Menu</button>
        </nav>
      </header>

      <main style={styles.main}>
        <div style={styles.formContainer}>
          <h1 style={styles.title}>reimbursement</h1>
          
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.formGroup}>
              <label htmlFor="name" style={styles.label}>Full Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label htmlFor="email" style={styles.label}>Email Address *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label htmlFor="phone" style={styles.label}>Phone Number</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label htmlFor="amount" style={styles.label}>Reimbursement Amount *</label>
              <input
                type="number"
                id="amount"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                required
                style={styles.input}
                placeholder="0.00"
              />
            </div>

            <div style={styles.formGroup}>
              <label htmlFor="description" style={styles.label}>Description of Expense *</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                style={styles.textarea}
                rows={4}
                placeholder="Please describe what this expense was for..."
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Upload Receipts</label>
              <div
                style={styles.dropZone}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf"
                  onChange={handleFileUpload}
                  style={styles.fileInput}
                  id="receipts"
                />
                <label htmlFor="receipts" style={styles.dropZoneLabel}>
                  <div style={styles.dropZoneContent}>
                    <span>Drag & drop images here</span>
                    <span>or click to browse</span>
                  </div>
                </label>
              </div>
              
              {formData.receiptFiles.length > 0 && (
                <div style={styles.fileList}>
                  {formData.receiptFiles.map((file, index) => (
                    <div key={index} style={styles.fileItem}>
                      <span>{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        style={styles.removeFile}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={styles.checkboxGroup}>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="agreeToContact"
                  checked={formData.agreeToContact}
                  onChange={handleInputChange}
                  style={styles.checkbox}
                />
                <span style={styles.checkboxText}>
                  From time to time, we would like to contact you about Gen Sales products and services and other content that may interest you. By clicking below, I authorize Gen Sales to call me and send pre-recorded messages and text messages to me about Gen Sales products and services at the telephone number I entered above, using an autodialer, even if I am on a national or state "Do Not Call" list. Message and data rates may apply. Maximum 10 texts per month. Consent for calls & texts is optional, and you can opt-out anytime. You also agree to our Terms of Service.
                </span>
              </label>
            </div>

            <div style={styles.checkboxGroup}>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onChange={handleInputChange}
                  required
                  style={styles.checkbox}
                />
                <span style={styles.checkboxText}>
                  I agree to receive other communications from Gen Sales*
                </span>
              </label>
            </div>

            <p style={styles.privacyText}>
              You can unsubscribe from these communications at any time. For more information on how to unsubscribe, our privacy practices, and how we are committed to protecting and respecting your privacy, please review our Privacy Policy.
            </p>

            <p style={styles.privacyText}>
              By clicking submit below, you consent to allow Gen Sales to store and process the personal information submitted above to provide you the content requested.
            </p>

            <button
              type="submit"
              disabled={isSubmitting || !formData.agreeToTerms}
              style={styles.submitButton}
            >
              {isSubmitting ? 'SUBMITTING...' : 'SUBMIT Reimbursement'}
            </button>

            {submitMessage && (
              <div style={styles.message}>
                {submitMessage}
              </div>
            )}
          </form>
        </div>
      </main>

      <footer style={styles.footer}>
        <div style={styles.footerContent}>
          <div style={styles.footerSection}>
            <h4>GEN SALES</h4>
            <p>401 S 850 E suite b3, Lehi, UT 84043</p>
            <p>SALES</p>
          </div>
          
          <div style={styles.footerLinks}>
            <a href="https://gensales.co/" style={styles.footerLink}>culture</a>
            <a href="https://gensales.co/" style={styles.footerLink}>Perks</a>
            <a href="https://gensales.co/" style={styles.footerLink}>join us</a>
            <a href="https://gensales.co/" style={styles.footerLink}>stories</a>
            <a href="https://gen-uni.teachable.com/p/gen-tv-u" style={styles.footerLink}>Training</a>
            <a href="/reimbursement" style={styles.footerLink}>Reimbursement</a>
            <a href="https://gensales.co/shop" style={styles.footerLink}>Shop</a>
            <a href="https://gensales.co/privacy-policy" style={styles.footerLink}>Privacy Policy</a>
            <a href="https://gensales.co/terms-of-service" style={styles.footerLink}>Terms Of Service</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
