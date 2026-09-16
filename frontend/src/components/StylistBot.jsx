import { useEffect, useRef, useState } from 'react'
import { stylistApi } from '../services/api'
import { SendIcon, CloseIcon, SparkIcon } from './icons'

const SUGGESTIONS = [
  'Recommend a gift under ₹3,000',
  'Oversized fits',
  'Formal outfit'
]

export default function StylistBot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const scrollRef = useRef(null)

  const hasMessages = messages.length > 0

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, typing, open])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const fallbackReply = (userText) =>
    `Thanks for asking about "${userText.trim() || 'that'}". ` +
    `I'm temporarily offline, but you can browse the Shop or use Visual Search ` +
    `(camera icon) in the navbar to find something you love.`

  const send = async (text) => {
    const clean = (text || '').trim()
    if (!clean || typing) return

    const userMsg = { role: 'user', content: clean }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setTyping(true)

    try {
      const history = messages.slice(-10).map((m) => ({
        role: m.role === 'bot' ? 'assistant' : 'user',
        content: m.content
      }))
      const data = await stylistApi.chat(clean, history)
      const reply =
        (typeof data === 'string' && data) ||
        (data && (data.reply || data.message || data.response)) ||
        fallbackReply(clean)
      setMessages((prev) => [...prev, { role: 'bot', content: reply }])
    } catch (err) {
      const friendly =
        err && err.message
          ? `${fallbackReply(clean)} (${err.message})`
          : fallbackReply(clean)
      setMessages((prev) => [...prev, { role: 'bot', content: friendly }])
    } finally {
      setTyping(false)
    }
  }

  return (
    <>
      {open && (
        <div className="stylist-panel" role="dialog" aria-modal="true" aria-label="Stylio stylist chat">
          <div className="stylist-panel__header">
            <div>
              <h3>Ask Stylio</h3>
              <div className="stylist-panel__status">
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: 'var(--color-success)',
                    display: 'inline-block'
                  }}
                />
                Your personal stylist
              </div>
            </div>
            <button
              className="icon-btn"
              onClick={() => setOpen(false)}
              style={{ color: 'var(--color-paper)' }}
              aria-label="Close chat"
            >
              <CloseIcon />
            </button>
          </div>

          <div className="stylist-panel__messages" ref={scrollRef}>
            {!hasMessages && !typing && (
              <div style={{ fontSize: '0.9rem', color: 'var(--color-ink-muted)', textAlign: 'center', padding: '12px 0' }}>
                <p className="serif" style={{ fontSize: '1.05rem', color: 'var(--color-ink)' }}>
                  Hi, I'm Stylio.
                </p>
                <p style={{ marginTop: 6 }}>
                  Tell me the occasion, your budget or your style and I'll curate looks for you.
                </p>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`chat-msg ${m.role === 'bot' ? 'chat-msg--bot' : 'chat-msg--user'}`}>
                {m.content}
              </div>
            ))}

            {typing && (
              <div className="typing-indicator" aria-label="Stylio is typing">
                <span />
                <span />
                <span />
              </div>
            )}
          </div>

          <div className="chat-chips">
            {SUGGESTIONS.map((s) => (
              <button key={s} className="chat-chip" onClick={() => send(s)}>
                {s}
              </button>
            ))}
          </div>

          <form
            className="chat-input-row"
            onSubmit={(e) => {
              e.preventDefault()
              send(input)
            }}
          >
            <input
              type="text"
              placeholder="Ask me anything about fashion…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              aria-label="Message Stylio"
            />
            <button type="submit" className="chat-send" aria-label="Send message">
              <SendIcon />
            </button>
          </form>
        </div>
      )}

      <button
        className="stylist-fab"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close Stylio chat' : 'Open Stylio chat'}
      >
        <SparkIcon size={22} />
        <span className="stylist-fab__label">Ask Stylio</span>
      </button>
    </>
  )
}