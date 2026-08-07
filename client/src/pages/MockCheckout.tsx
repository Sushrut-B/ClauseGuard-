import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { mockWebhook } from '../api/billing'
import styles from './MockCheckout.module.css'

export default function MockCheckout() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  
  const planId = searchParams.get('plan')

  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!planId) {
      navigate('/billing')
    }
  }, [planId, navigate])

  const planName = planId?.includes('enterprise') ? 'Enterprise' : 'Pro'
  const price = planName === 'Enterprise' ? '$199.00 / month' : '$29.00 / month'

  const handlePay = async () => {
    setLoading(true)
    setError('')
    try {
      await mockWebhook(planId || 'pro')
      // Simulate Stripe loading redirect
      setTimeout(() => {
        window.location.href = '/billing?success=true'
      }, 1500)
    } catch (err) {
      setError('Payment failed to process.')
      setLoading(false)
    }
  }

  return (
    <div className={styles.checkoutPage}>
      <div className={styles.stripeContainer}>
        <div className={styles.leftCol}>
          <div className={styles.brand}>ClauseGuard</div>
          <div className={styles.subscribeText}>Subscribe to {planName}</div>
          <div className={styles.price}>{price}</div>
          
          <div className={styles.orderSummary}>
            <div className={styles.summaryItem}>
              <span>{planName} Plan (Billed Monthly)</span>
              <span>{price}</span>
            </div>
            <div className={styles.divider} />
            <div className={styles.summaryItem}>
              <strong>Total due today</strong>
              <strong>{price}</strong>
            </div>
          </div>
        </div>
        
        <div className={styles.rightCol}>
          <h3>Payment Details</h3>
          {error && <div className={styles.error}>{error}</div>}
          
          <div className={styles.mockForm}>
            <div className={styles.inputGroup}>
              <label>Email</label>
              <input type="email" value="admin@clauseguard.com" disabled />
            </div>
            
            <div className={styles.inputGroup}>
              <label>Card Information</label>
              <div className={styles.cardInputMock}>
                <div className={styles.cardHeader}>
                  <span>💳</span>
                  <span>4242 4242 4242 4242</span>
                </div>
                <div className={styles.cardFooter}>
                  <span>12/30</span>
                  <span>123</span>
                </div>
              </div>
              <small className={styles.hint}>This is a mock checkout since no live Stripe keys are configured.</small>
            </div>
            
            <div className={styles.inputGroup}>
              <label>Name on card</label>
              <input type="text" value="Jane Doe" disabled />
            </div>

            <button 
              className={styles.payBtn} 
              onClick={handlePay} 
              disabled={loading}
            >
              {loading ? 'Processing...' : `Pay ${price}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
