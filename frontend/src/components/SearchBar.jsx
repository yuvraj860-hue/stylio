import { useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { SearchIcon, CameraIcon, MicIcon } from './icons'
import { visualSearchApi } from '../services/api'
import VisualSearchModal from './VisualSearchModal'

export default function SearchBar({ onSearch }) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [fileInput, setFileInput] = useState(null)
  const [preview, setPreview] = useState(null)
  const [searching, setSearching] = useState(false)
  const [visualResults, setVisualResults] = useState(null)
  const [visualError, setVisualError] = useState(null)
  const [isListening, setIsListening] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(true)
  const inputRef = useRef(null)
  const recognitionRef = useRef(null)

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setSpeechSupported(false)
      return
    }

    try {
      const recognition = new SpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = true
      recognition.lang = 'en-IN'

      recognition.onstart = () => {
        setIsListening(true)
        window.dispatchEvent(
          new CustomEvent('stylio:toast', {
            detail: { message: '🎙️ Listening... Speak what you desire (e.g. "Black silk dress")' }
          })
        )
      }

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((res) => res[0].transcript)
          .join('')
        setQuery(transcript)
      }

      recognition.onerror = (event) => {
        setIsListening(false)
        if (event.error !== 'no-speech') {
          window.dispatchEvent(
            new CustomEvent('stylio:toast', {
              detail: { message: `Voice input: ${event.error === 'not-allowed' ? 'Microphone permission denied' : 'Could not hear clearly'}` }
            })
          )
        }
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognitionRef.current = recognition
    } catch (e) {
      setSpeechSupported(false)
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort()
        } catch (e) {}
      }
    }
  }, [])

  const toggleVoiceSearch = () => {
    if (!speechSupported || !recognitionRef.current) {
      window.dispatchEvent(
        new CustomEvent('stylio:toast', {
          detail: { message: 'Voice search is not supported in this browser. Please type to search.' }
        })
      )
      return
    }

    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      try {
        recognitionRef.current.start()
      } catch (err) {
        // already started or busy
      }
    }
  }

  const submitText = (e) => {
    e?.preventDefault?.()
    const q = query.trim()
    if (!q) return
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop()
    }
    if (onSearch) {
      onSearch(q)
      return
    }
    navigate(`/shop?search=${encodeURIComponent(q)}`)
  }

  const handleFile = (e) => {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    setPreview(URL.createObjectURL(file))
    setVisualError(null)
    setSearching(true)
    setVisualResults(null)
    visualSearchApi
      .search(file)
      .then((data) => {
        setVisualResults(data)
      })
      .catch((err) => {
        setVisualError(
          err && err.message
            ? err.message
            : 'Visual search is unavailable right now. Please try again.'
        )
      })
      .finally(() => {
        setSearching(false)
        if (inputRef.current) inputRef.current.value = ''
      })
  }

  const closeModal = () => {
    setVisualResults(null)
    setVisualError(null)
    setSearching(false)
    setPreview(null)
    setFileInput(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <>
      <form className="search-bar" onSubmit={submitText} role="search">
        <span className="search-icon">
          <SearchIcon />
        </span>
        <input
          type="text"
          placeholder="Search pieces..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search products"
        />
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFile}
          id={`upload-${Math.random().toString(36).slice(2)}`}
          aria-hidden="true"
          tabIndex={-1}
        />
        <div className="search-bar__actions" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            type="button"
            className={`upload-btn ${isListening ? 'listening' : ''}`}
            onClick={toggleVoiceSearch}
            title={isListening ? 'Listening... click to stop' : 'Voice search — speak what you want'}
            aria-label={isListening ? 'Stop listening' : 'Voice search'}
            style={{
              color: isListening ? '#ef4444' : undefined,
              animation: isListening ? 'voice-pulse 1.2s infinite ease-in-out' : undefined,
              background: isListening ? 'rgba(239, 68, 68, 0.12)' : undefined,
              borderRadius: '50%'
            }}
          >
            <MicIcon />
          </button>
          <button
            type="button"
            className="upload-btn"
            onClick={() => inputRef.current && inputRef.current.click()}
            title="Visual search — upload an outfit image"
            aria-label="Upload image for visual search"
          >
            <CameraIcon />
          </button>
        </div>
      </form>

      <VisualSearchModal
        open={Boolean(preview || visualResults || searching || visualError)}
        onClose={closeModal}
        preview={preview}
        searching={searching}
        results={visualResults}
        error={visualError}
      />
    </>
  )
}