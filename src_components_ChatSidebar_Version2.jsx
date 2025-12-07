import React, { useState, useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_KEY
)

export const ChatSidebar = ({ isOpen, onToggle }) => {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [username, setUsername] = useState(localStorage.getItem('chatUser') || null)
  const [showUsernameModal, setShowUsernameModal] = useState(! username)
  const [lastId, setLastId] = useState(0)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (username) {
      loadHistory()
      const interval = setInterval(fetchNewMessages, 1500)
      return () => clearInterval(interval)
    }
  }, [username])

  const loadHistory = async () => {
    try {
      const { data } = await supabase
        . from('chat_messages')
        .select('id, user, text, created_at')
        .order('id', { ascending: true })
        .limit(200)

      if (data) {
        setMessages(data)
        if (data.length) setLastId(data[data.length - 1].id)
      }
    } catch (err) {
      console.error('Load history error:', err)
    }
  }

  const fetchNewMessages = async () => {
    try {
      const { data } = await supabase
        . from('chat_messages')
        .select('id, user, text, created_at')
        . gt('id', lastId)
        . order('id', { ascending: true })

      if (data?. length) {
        setMessages(prev => [...prev, ...data])
        setLastId(data[data.length - 1].id)
      }
    } catch (err) {
      console.error('Fetch new messages error:', err)
    }
  }

  const handleSend = async () => {
    const text = input.trim()
    if (! text || ! username) return

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({ user: username, text })
        .select()

      if (! error && data? .[0]) {
        setMessages(prev => [...prev, data[0]])
        setLastId(data[0].id)
        setInput('')
      }
    } catch (err) {
      console.error('Send message error:', err)
    }
  }

  const handleSetUsername = name => {
    const finalName = name.trim() || 'User' + Math.floor(Math.random() * 9999)
    setUsername(finalName)
    localStorage.setItem('chatUser', finalName)
    setShowUsernameModal(false)
  }

  return (
    <>
      <div className="chat-toggle" onClick={onToggle}>
        Public Chat🔘
      </div>

      <div className={`chat-sidebar ${isOpen ? 'open' : ''}`}>
        <h3 style={{ textAlign: 'center', marginBottom: '10px' }}>Chat</h3>

        <div style={{ overflowY: 'auto', flex: 1 }}>
          {messages.map(msg => (
            <div key={msg.id} className="chat-msg">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <b style={{ color: '#d15fff', fontWeight: 800 }}>{msg.user}</b>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginLeft: 'auto' }}>
                  {new Date(msg.created_at). toLocaleTimeString()}
                </span>
              </div>
              <div style={{ marginTop: '6px', whiteSpace: 'pre-wrap' }}>{msg.text}</div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input">
          <input
            placeholder="Drop your alpha..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && ! e.shiftKey && handleSend()}
          />
          <button onClick={handleSend}>NOLA</button>
        </div>
      </div>

      {showUsernameModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backdropFilter: 'blur(10px)',
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 3000,
          }}
        >
          <div
            style={{
              background: 'rgba(255,255,255,0.07)',
              padding: '25px',
              borderRadius: '20px',
              textAlign: 'center',
              width: '300px',
              boxShadow: '0 0 30px rgba(180,0,255,0.2)',
            }}
          >
            <h3>Choose a Username</h3>
            <input
              placeholder="Enter name"
              defaultValue={username || ''}
              onKeyDown={e => e.key === 'Enter' && handleSetUsername(e.target.value)}
              style={{
                width: '85%',
                padding: '10px',
                borderRadius: '12px',
                border: 'none',
                marginTop: '12px',
                background: 'rgba(255,255,255,0.06)',
                color: 'white',
              }}
            />
            <button
              onClick={e => handleSetUsername(e.target.previousElementSibling.value)}
              style={{
                marginTop: '15px',
                padding: '10px 20px',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg,#b445ff,#7013ff)',
                cursor: 'pointer',
                color: 'white',
              }}
            >
              Say NOLA
            </button>
          </div>
        </div>
      )}
    </>
  )
}