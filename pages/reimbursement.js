import { useState } from 'react'
import Head from 'next/head'
import styles from '../styles/Reimbursement.module.css'

export default function Reimbursement() {
  const [formData, setFormData] = useState({
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

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files)
    setFormData(prev => ({
      ...prev,
      receiptFiles: [...prev.receiptFiles, ...files]
    }))
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    setFormData(prev => ({
      ...prev,
      receiptFiles: [...prev.receiptFiles, ...files]
    }))
  }

  const removeFile = (index) => {
    setFormData(prev => ({
      ...prev,
      receiptFiles: prev.receiptFiles.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      const formDataToSend = new FormData()
      
      // Add form fields
      Object.keys(formData).forEach(key => {
        if (key !== 'receiptFiles') {
          formDataToSend.append(key, formData[key])
        }
      })
      
      // Add files
      formData.receiptFiles.forEach((file, index) => {
        formDataToSend.append(`receipt_${index}`, file)
      })
      
      const response = await fetch('/api/submit-reimbursement', {
        method: 'POST',
        body: formDataToSend
      })
      
      if (response.ok) {
        setSubmitMessage('Reimbursement request submitted successfully!')
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
        setSubmitMessage('Error submitting request. Please try again.')
      }
    } catch (error) {
      setSubmitMessage('Error submitting request. Please try again.')
    }
    
    setIsSubmitting(false)
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Reimbursement - Gen Sales</title>
        <meta name="description" content="Gen Sales reimbursement form for expense submissions" />
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <header className={styles.header}>
        <nav className={styles.nav}>
          <div className={styles.logo}>
            <span>GEN SALES</span>
          </div>
          <button className={styles.menuButton}>Menu</button>
        </nav>
      </header>

      <main className={styles.main}>
        <div className={styles.formContainer}>
          <h1 className={styles.title}>reimbursement</h1>
          
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="name">Full Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className={styles.input}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="email">Email Address *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className={styles.input}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="phone">Phone Number</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className={styles.input}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="amount">Reimbursement Amount *</label>
              <input
                type="number"
                id="amount"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                required
                className={styles.input}
                placeholder="0.00"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="description">Description of Expense *</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                className={styles.textarea}
                rows="4"
                placeholder="Please describe what this expense was for..."
              />
            </div>

            <div className={styles.formGroup}>
              <label>Upload Receipts</label>
              <div
                className={styles.dropZone}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf"
                  onChange={handleFileUpload}
                  className={styles.fileInput}
                  id="receipts"
                />
                <label htmlFor="receipts" className={styles.dropZoneLabel}>
                  <div className={styles.dropZoneContent}>
                    <span>Drag & drop images here</span>
                    <span>or click to browse</span>
                  </div>
                </label>
              </div>
              
              {formData.receiptFiles.length > 0 && (
                <div className={styles.fileList}>
                  {formData.receiptFiles.map((file, index) => (
                    <div key={index} className={styles.fileItem}>
                      <span>{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className={styles.removeFile}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={styles.checkboxGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="agreeToContact"
                  checked={formData.agreeToContact}
                  onChange={handleInputChange}
                  className={styles.checkbox}
                />
                <span className={styles.checkboxText}>
                  From time to time, we would like to contact you about Gen Sales products and services and other content that may interest you. By clicking below, I authorize Gen Sales to call me and send pre-recorded messages and text messages to me about Gen Sales products and services at the telephone number I entered above, using an autodialer, even if I am on a national or state "Do Not Call" list. Message and data rates may apply. Maximum 10 texts per month. Consent for calls & texts is optional, and you can opt-out anytime. You also agree to our Terms of Service.
                </span>
              </label>
            </div>

            <div className={styles.checkboxGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onChange={handleInputChange}
                  required
                  className={styles.checkbox}
                />
                <span className={styles.checkboxText}>
                  I agree to receive other communications from Gen Sales*
                </span>
              </label>
            </div>

            <p className={styles.privacyText}>
              You can unsubscribe from these communications at any time. For more information on how to unsubscribe, our privacy practices, and how we are committed to protecting and respecting your privacy, please review our Privacy Policy.
            </p>

            <p className={styles.consentText}>
              By clicking submit below, you consent to allow Gen Sales to store and process the personal information submitted above to provide you the content requested.
            </p>

            <button
              type="submit"
              disabled={isSubmitting || !formData.agreeToTerms}
              className={styles.submitButton}
            >
              {isSubmitting ? 'SUBMITTING...' : 'SUBMIT Reimbursement'}
            </button>

            {submitMessage && (
              <div className={styles.message}>
                {submitMessage}
              </div>
            )}
          </form>
        </div>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerSection}>
            <h4>GEN SALES</h4>
            <p>401 S 850 E suite b3, Lehi, UT 84043</p>
            <p>SALES</p>
          </div>
          
          <div className={styles.footerLinks}>
            <a href="https://gensales.co/">culture</a>
            <a href="https://gensales.co/">Perks</a>
            <a href="https://gensales.co/">join us</a>
            <a href="https://gensales.co/">stories</a>
            <a href="https://gen-uni.teachable.com/p/gen-tv-u">Training</a>
            <a href="/reimbursement">Reimbursement</a>
            <a href="https://gensales.co/shop">Shop</a>
            <a href="https://docs.google.com/forms/d/e/1FAIpQLSdL51FHPnmIcwpn6BGPrZXopwHmwPHsJ0eaXwcAZLy_-B8IqA/viewform">Onboarding</a>
            <a href="https://gensales.co/privacy-policy">Privacy Policy</a>
            <a href="https://gensales.co/terms-of-service">Terms Of Service</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
