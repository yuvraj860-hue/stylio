import { useEffect, useRef, useState } from 'react';
import { CloseIcon } from './icons';

export default function ScratchCardModal({ isOpen, onClose, code = 'STYLIO25', discount = '25% OFF' }) {
  const canvasRef = useRef(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isScratching, setIsScratching] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setIsRevealed(false);
      setCopied(false);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Fill silver/gold metallic gradient
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#d4af37');
    grad.addColorStop(0.3, '#f5e7a1');
    grad.addColorStop(0.6, '#aa771c');
    grad.addColorStop(1, '#8a6218');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Overlay text & sparkle pattern
    ctx.fillStyle = '#1a1a1a';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('✨ SCRATCH WITH MOUSE / TOUCH ✨', width / 2, height / 2 - 8);
    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#333333';
    ctx.fillText('Reveal Your Secret Atelier Voucher', width / 2, height / 2 + 14);
  }, [isOpen]);

  const scratch = (clientX, clientY) => {
    const canvas = canvasRef.current;
    if (!canvas || isRevealed) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, Math.PI * 2, false);
    ctx.fill();

    checkScratchCompletion();
  };

  const checkScratchCompletion = () => {
    const canvas = canvasRef.current;
    if (!canvas || isRevealed) return;
    const ctx = canvas.getContext('2d');
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let transparentPixels = 0;
    const totalPixels = imgData.data.length / 4;

    for (let i = 3; i < imgData.data.length; i += 16) {
      if (imgData.data[i] === 0) {
        transparentPixels += 4;
      }
    }

    if (transparentPixels / totalPixels > 0.4) {
      setIsRevealed(true);
      if (window.dispatchEvent) {
        window.dispatchEvent(
          new CustomEvent('stylio:toast', {
            detail: { message: `🎉 Congratulations! Voucher unlocked: ${code} (${discount})` }
          })
        );
      }
    }
  };

  const handlePointerDown = (e) => {
    setIsScratching(true);
    scratch(e.clientX, e.clientY);
  };

  const handlePointerMove = (e) => {
    if (!isScratching) return;
    scratch(e.clientX, e.clientY);
  };

  const handlePointerUp = () => {
    setIsScratching(false);
  };

  const handleCopy = () => {
    navigator.clipboard?.writeText(code);
    setCopied(true);
    if (window.dispatchEvent) {
      window.dispatchEvent(
        new CustomEvent('stylio:toast', {
          detail: { message: `Voucher code ${code} copied to clipboard! ✂️` }
        })
      );
    }
    setTimeout(() => setCopied(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="scratch-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="scratch-modal-box" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={onClose}
          className="order-action-modal__close"
          style={{ position: 'absolute', top: 16, right: 16, color: '#ffffff' }}
          aria-label="Close"
        >
          <CloseIcon size={18} />
        </button>

        <div style={{ fontSize: '2rem', marginBottom: 6 }}>🎁</div>
        <div className="eyebrow" style={{ color: 'var(--color-gold-light)', marginBottom: 4 }}>
          VIP Client Reward
        </div>
        <h3 style={{ margin: '0 0 8px', fontSize: '1.4rem', color: '#ffffff' }}>
          Exclusive Scratch Card
        </h3>
        <p style={{ fontSize: '0.84rem', color: 'rgba(255, 255, 255, 0.75)', margin: '0 auto 12px', maxWidth: 300 }}>
          Scratch below to unlock an exclusive voucher code for your next order!
        </p>

        <div className="scratch-card-canvas-wrap">
          <div className="scratch-prize-reveal">
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#78350f', letterSpacing: '0.1em' }}>
              YOU UNLOCKED {discount}
            </span>
            <span className="scratch-prize-code">{code}</span>
            <span style={{ fontSize: '0.68rem', color: '#92400e', marginTop: 4 }}>
              Valid on all atelier collections
            </span>
          </div>

          {!isRevealed && (
            <canvas
              ref={canvasRef}
              width={280}
              height={140}
              className="scratch-canvas"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
            />
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={isRevealed ? handleCopy : () => setIsRevealed(true)}
            style={{ width: '100%', fontSize: '0.88rem' }}
          >
            {isRevealed ? (copied ? '✓ Copied to Clipboard!' : `Copy Code: ${code}`) : 'Auto Reveal Reward 🪄'}
          </button>
          <button
            type="button"
            className="btn btn-outline"
            onClick={onClose}
            style={{ width: '100%', fontSize: '0.82rem', borderColor: 'rgba(255, 255, 255, 0.2)', color: '#ffffff' }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
