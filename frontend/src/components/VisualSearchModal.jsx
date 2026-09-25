import { useEffect, useMemo, useRef, useState } from 'react';
import { fmt } from '../utils/format';
import { CloseIcon, CameraIcon } from './icons';
import SafeImage from './SafeImage';
import { visualSearchApi } from '../services/api';

export default function VisualSearchModal({
  open,
  onClose,
  preview: initialPreview,
  searching: initialSearching,
  results: initialResults,
  error: initialError,
  onPerformSearch,
}) {
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [internalSearching, setInternalSearching] = useState(false);
  const [internalResults, setInternalResults] = useState(null);
  const [internalError, setInternalError] = useState(null);
  const [internalPreview, setInternalPreview] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);
  const panelRef = useRef(null);

  const preview = internalPreview || initialPreview;
  const searching = internalSearching || initialSearching;
  const error = internalError || initialError;
  const rawResults = internalResults || initialResults;

  const products = useMemo(() => {
    if (!rawResults) return [];
    if (Array.isArray(rawResults)) return rawResults;
    if (Array.isArray(rawResults.results)) return rawResults.results;
    if (Array.isArray(rawResults.products)) return rawResults.products;
    return [];
  }, [rawResults]);

  // Clean up camera stream
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    setCameraError(null);
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera is not supported on this browser or device.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err) {
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Camera permission was denied. Please allow camera access in your browser settings.'
          : err.message || 'Unable to access camera.'
      );
      setCameraActive(false);
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      async (blob) => {
        if (!blob) return;
        stopCamera();
        const objUrl = URL.createObjectURL(blob);
        setInternalPreview(objUrl);
        setInternalSearching(true);
        setInternalError(null);
        setInternalResults(null);

        try {
          const res = await visualSearchApi.search(blob);
          setInternalResults(res);
        } catch (err) {
          setInternalError(err.message || 'Visual search failed. Please try again.');
        } finally {
          setInternalSearching(false);
        }
      },
      'image/jpeg',
      0.92
    );
  };

  const handleModalFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    stopCamera();
    const objUrl = URL.createObjectURL(file);
    setInternalPreview(objUrl);
    setInternalSearching(true);
    setInternalError(null);
    setInternalResults(null);

    try {
      const res = await visualSearchApi.search(file);
      setInternalResults(res);
    } catch (err) {
      setInternalError(err.message || 'Visual search failed. Please try again.');
    } finally {
      setInternalSearching(false);
    }
  };

  const handleClose = () => {
    stopCamera();
    setInternalPreview(null);
    setInternalSearching(false);
    setInternalResults(null);
    setInternalError(null);
    onClose();
  };

  useEffect(() => {
    if (!open) {
      stopCamera();
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div
        ref={panelRef}
        className="modal-panel"
        style={{ maxWidth: 840, width: '92%' }}
        role="dialog"
        aria-modal="true"
        aria-label="Visual search results"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <div className="eyebrow" style={{ color: 'var(--color-gold)' }}>
              Stylio Vision AI
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', marginTop: 4 }}>
              Visual Match & Discovery
            </h2>
          </div>
          <button className="icon-btn" onClick={handleClose} aria-label="Close visual search">
            <CloseIcon />
          </button>
        </div>

        <div style={{ padding: 'var(--space-6)' }}>
          {/* Quick Action Bar (Take Snapshot or Upload New) */}
          <div
            style={{
              display: 'flex',
              gap: 10,
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 20,
              paddingBottom: 16,
              borderBottom: '1px solid var(--color-line)',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              {!cameraActive ? (
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={startCamera}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.82rem' }}
                >
                  <CameraIcon size={16} />
                  <span>Snap Live Photo 📸</span>
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-dark"
                  onClick={capturePhoto}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.82rem' }}
                >
                  <span>Capture & Search Look ✨</span>
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleModalFile}
              />
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                style={{ fontSize: '0.82rem' }}
              >
                Upload Photo 🖼️
              </button>

              {cameraActive && (
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={stopCamera}
                  style={{ fontSize: '0.82rem' }}
                >
                  Cancel Camera
                </button>
              )}
            </div>

            {preview && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="text-muted" style={{ fontSize: '0.78rem' }}>
                  Analyzed Photo:
                </span>
                <img
                  src={preview}
                  alt="Searched look"
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 'var(--radius-sm)',
                    objectFit: 'cover',
                    border: '1px solid var(--color-gold)',
                  }}
                />
              </div>
            )}
          </div>

          {/* Camera Viewfinder if Camera Active */}
          {cameraActive && (
            <div
              style={{
                position: 'relative',
                width: '100%',
                maxHeight: 340,
                background: '#000',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                marginBottom: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ width: '100%', maxHeight: 340, objectFit: 'cover' }}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: 24,
                  border: '2px dashed rgba(255,255,255,0.6)',
                  borderRadius: 12,
                  pointerEvents: 'none',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: 12,
                  background: 'rgba(0,0,0,0.65)',
                  color: '#fff',
                  padding: '4px 12px',
                  borderRadius: 20,
                  fontSize: '0.76rem',
                }}
              >
                Point camera at clothing item and tap "Capture & Search Look"
              </div>
            </div>
          )}
          <canvas ref={canvasRef} style={{ display: 'none' }} />

          {cameraError && (
            <div className="alert alert-error" style={{ marginBottom: 16 }}>
              <span>{cameraError}</span>
            </div>
          )}

          {/* Search Spinner */}
          {searching && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div className="spinner" />
              <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: 12 }}>
                Analysing silhouette, palette and fabric texture…
              </p>
            </div>
          )}

          {/* Errors */}
          {!searching && error && (
            <div className="empty-state">
              <h3>We couldn't complete that search</h3>
              <p>{error}</p>
            </div>
          )}

          {/* Empty Results */}
          {!searching && !error && !cameraActive && products.length === 0 && (
            <div className="empty-state">
              <h3>No matches found</h3>
              <p>Try taking or uploading a clearer, well-lit photo of the outfit.</p>
            </div>
          )}

          {/* Results Grid */}
          {!searching && !error && products.length > 0 && (
            <div>
              <div
                style={{
                  fontSize: '0.82rem',
                  color: 'var(--color-ink-muted)',
                  marginBottom: 14,
                }}
              >
                Found <strong>{products.length} matching pieces</strong> with similar drape and tone:
              </div>
              <div
                className="product-grid"
                style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}
              >
                {products.map((p) => {
                  const id = p.product_id || p._id || p.id;
                  const image = p.image_url || p.imageUrl || p.image;
                  const price = Number(p.price);
                  return (
                    <a
                      key={id}
                      href={`/product/${id}`}
                      onClick={handleClose}
                      className="product-card"
                    >
                      <div className="product-card__image-wrap" style={{ aspectRatio: '3/4' }}>
                        <SafeImage
                          className="product-card__image"
                          src={image}
                          alt={p.name || 'Product'}
                          loading="lazy"
                        />
                      </div>
                      <div className="product-card__body">
                        <span
                          className="text-muted"
                          style={{ fontSize: '0.72rem', textTransform: 'uppercase' }}
                        >
                          {p.brand || 'STYLIO'}
                        </span>
                        <h4
                          className="product-card__name"
                          style={{
                            fontSize: '0.85rem',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {p.name || 'Untitled'}
                        </h4>
                        <div className="product-card__price">
                          {Number.isFinite(price) ? fmt(price) : '—'}
                        </div>
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}