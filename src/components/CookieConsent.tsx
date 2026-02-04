'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Cookie, Shield, X } from 'lucide-react'
import Link from 'next/link'

const COOKIE_CONSENT_KEY = 'eagleeye-cookie-consent'

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false)
  
  useEffect(() => {
    // Check if user has already consented
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY)
    if (!consent) {
      // Small delay before showing
      setTimeout(() => setShowBanner(true), 1500)
    }
  }, [])
  
  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({
      accepted: true,
      timestamp: new Date().toISOString(),
    }))
    setShowBanner(false)
  }
  
  const handleDecline = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({
      accepted: false,
      timestamp: new Date().toISOString(),
    }))
    setShowBanner(false)
  }
  
  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4"
        >
          <div className="max-w-4xl mx-auto bg-card border border-border rounded-2xl p-6 shadow-2xl backdrop-blur-xl">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
              {/* Icon & Message */}
              <div className="flex items-start gap-4 flex-1">
                <div className="p-3 bg-cyan-500/10 rounded-xl flex-shrink-0">
                  <Cookie className="h-6 w-6 text-cyan-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">
                    We respect your privacy 🔒
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    We use essential cookies to make EagleEye work. We don't use any 
                    tracking or advertising cookies. Your data stays private.{' '}
                    <Link href="/privacy" className="text-cyan-500 hover:underline">
                      Privacy Policy
                    </Link>
                  </p>
                </div>
              </div>
              
              {/* Buttons */}
              <div className="flex items-center gap-3 ml-auto">
                <button
                  onClick={handleDecline}
                  className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Essential only
                </button>
                <button
                  onClick={handleAccept}
                  className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Accept all
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
