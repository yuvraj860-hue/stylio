import React, { useState, useEffect } from 'react';
import { useSignIn } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';

export default function PhoneOtpLogin({ onSuccess }) {
  const navigate = useNavigate();
  const { isLoaded, signIn, setActive } = useSignIn();

  const [step, setStep] = useState('phone'); // 'phone' | 'otp'
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    let interval = null;
    if (resendTimer > 0) {
      interval = setInterval(() => setResendTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setSuccessMsg('');

    const cleanNumber = phone.replace(/\D/g, '').slice(-10);
    if (cleanNumber.length !== 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/phone/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanNumber }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to send OTP. Please try again.');
      }

      setSuccessMsg(data.message || 'OTP sent successfully!');
      if (data.devOtp) {
        setDevOtp(data.devOtp);
      }
      setStep('otp');
      setResendTimer(30);
    } catch (err) {
      setError(err.message || 'Network error while sending OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    setError('');

    const cleanNumber = phone.replace(/\D/g, '').slice(-10);
    if (!otp || otp.trim().length < 4) {
      setError('Please enter the verification code.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/phone/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: cleanNumber,
          otp: otp.trim(),
          name: name.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Invalid OTP code.');
      }

      // Store fallback token
      if (data.jwtToken) {
        localStorage.setItem('stylio_auth_token', data.jwtToken);
      }
      if (data.user) {
        localStorage.setItem('stylio_user', JSON.stringify(data.user));
      }

      // Complete Clerk sign in if ticket token available
      if (data.signInToken && isLoaded && signIn && setActive) {
        try {
          const clerkRes = await signIn.create({
            strategy: 'ticket',
            ticket: data.signInToken,
          });
          if (clerkRes.status === 'complete') {
            await setActive({ session: clerkRes.createdSessionId });
          }
        } catch (clerkErr) {
          console.warn('[PhoneOtp] Clerk ticket sign-in warning:', clerkErr);
        }
      }

      if (onSuccess) {
        onSuccess(data.user);
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="phone-otp-box">
      <div className="phone-otp-header">
        <h2 className="phone-otp-title">
          {step === 'phone' ? 'Sign In with Mobile' : 'Enter Verification Code'}
        </h2>
        <p className="phone-otp-sub">
          {step === 'phone'
            ? 'Enter your mobile number to receive a secure login OTP'
            : `We sent a 6-digit code to +91 ${phone.replace(/\D/g, '').slice(-10)}`}
        </p>
      </div>

      {error && <div className="phone-otp-alert phone-otp-alert--error">{error}</div>}
      {successMsg && <div className="phone-otp-alert phone-otp-alert--success">{successMsg}</div>}

      {devOtp && step === 'otp' && (
        <div className="phone-otp-dev-banner">
          <span>Dev Mode OTP: <strong>{devOtp}</strong></span>
          <button
            type="button"
            className="phone-otp-dev-fill"
            onClick={() => setOtp(devOtp)}
          >
            Auto-fill
          </button>
        </div>
      )}

      {step === 'phone' ? (
        <form onSubmit={handleSendOtp} className="phone-otp-form">
          <div className="phone-otp-field">
            <label htmlFor="user-phone">Mobile Number</label>
            <div className="phone-input-group">
              <span className="phone-country-code">🇮🇳 +91</span>
              <input
                id="user-phone"
                type="tel"
                inputMode="numeric"
                maxLength={10}
                placeholder="98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                required
                autoFocus
              />
            </div>
          </div>

          <div className="phone-otp-field">
            <label htmlFor="user-name">Your Name (Optional)</label>
            <input
              id="user-name"
              type="text"
              placeholder="e.g. Yuvraj Singh"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="btn btn-dark btn-block phone-otp-submit"
            disabled={loading || phone.replace(/\D/g, '').length !== 10}
          >
            {loading ? 'Sending OTP…' : 'Get Login OTP →'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="phone-otp-form">
          <div className="phone-otp-field">
            <div className="phone-otp-row">
              <label htmlFor="user-otp">6-Digit OTP</label>
              <button
                type="button"
                className="phone-otp-change-link"
                onClick={() => {
                  setStep('phone');
                  setOtp('');
                  setError('');
                }}
              >
                Change Number
              </button>
            </div>
            <input
              id="user-otp"
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="• • • • • •"
              className="phone-otp-code-input"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              required
              autoFocus
            />
          </div>

          <button
            type="submit"
            className="btn btn-dark btn-block phone-otp-submit"
            disabled={loading || otp.length < 4}
          >
            {loading ? 'Verifying…' : 'Verify & Sign In'}
          </button>

          <div className="phone-otp-resend-row">
            {resendTimer > 0 ? (
              <span className="phone-otp-timer">Resend code in {resendTimer}s</span>
            ) : (
              <button
                type="button"
                className="phone-otp-resend-btn"
                onClick={handleSendOtp}
                disabled={loading}
              >
                Resend OTP
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
