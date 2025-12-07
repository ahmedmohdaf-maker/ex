import React, { useState, useEffect } from 'react'

let toastQueue = []
let isVisible = false

export const Toast = () => {
  const [toast, setToast] = useState(null)

  useEffect(() => {
    if (toastQueue.length && ! isVisible) {
      isVisible = true
      const item = toastQueue.shift()
      setToast(item)
      setTimeout(() => {
        setToast(null)
        isVisible = false
      }, item.ttl || 4000)
    }
  }, [toast])

  if (! toast) return null

  return (
    <div
      style={{
        position: 'fixed',
        right: '18px',
        bottom: '90px',
        zIndex: 9999,
        padding: '12px 18px',
        borderRadius: '12px',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
        backdropFilter: 'blur(8px)',
        boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
        color: '#fff',
        pointerEvents: 'auto',
        animation: 'fadeInUp 0.3s ease',
      }}
    >
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <div style={{ flex: 1 }}>{toast.msg}</div>
        {toast.txHash && (
          <a
            href={`https://polygonscan.com/tx/${toast.txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: '12px', color: '#fff', fontWeight: 900, textDecoration: 'underline' }}
          >
            View
          </a>
        )}
      </div>
    </div>
  )
}

export const showToast = (msg, opts = {}) => {
  toastQueue.push({ msg, ... opts })
}
