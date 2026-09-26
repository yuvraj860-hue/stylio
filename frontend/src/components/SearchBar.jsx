import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SearchIcon, CameraIcon, CloseIcon } from './icons'
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
  const inputRef = useRef(null)

  const submitText = (e) => {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
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
        <button
          type="button"
          className="upload-btn"
          onClick={() => inputRef.current && inputRef.current.click()}
          title="Visual search — upload an outfit image"
          aria-label="Upload image for visual search"
        >
          <CameraIcon />
        </button>
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