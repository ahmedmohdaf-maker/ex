import React, { useEffect, useState } from 'react'
import { Exchange } from './pages/Exchange'
import { appKit } from './config/appkit. config'
import './styles/exchange.css'

function App() {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // Initialize AppKit
    const initAppKit = async () => {
      try {
        setIsReady(true)
      } catch (err) {
        console.error('AppKit init error:', err)
        setIsReady(true) // Still render even if init fails
      }
    }
    initAppKit()
  }, [])

  if (!isReady) return <div>Loading...</div>

  return <Exchange />
}

export default App
