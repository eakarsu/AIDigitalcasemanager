import React, { useState } from 'react';
import { auth } from '../services/api';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await auth.login({ email, password });
      const { user, token } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      onLogin(user, token);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = () => {
    setEmail(process.env.REACT_APP_DEMO_EMAIL || '');
    setPassword(process.env.REACT_APP_DEMO_PASSWORD || '');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 30%, #4f46e5 60%, #818cf8 100%)',
      padding: '20px',
    }}>
      {/* Decorative background shapes */}
      <div style={{
        position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none',
      }}>
        <div style={{
          position: 'absolute', top: '-10%', right: '-5%',
          width: '500px', height: '500px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(129,140,248,0.2) 0%, transparent 70%)',
        }} />
        <div style={{
          position: 'absolute', bottom: '-15%', left: '-10%',
          width: '600px', height: '600px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(79,70,229,0.15) 0%, transparent 70%)',
        }} />
      </div>

      <div className="card fade-in" style={{
        width: '100%', maxWidth: '440px', position: 'relative', zIndex: 1,
        borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4)',
      }}>
        <div style={{
          padding: '40px 36px 0',
          textAlign: 'center',
        }}>
          {/* Logo / Icon */}
          <div style={{
            width: '64px', height: '64px', borderRadius: '16px',
            background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px', boxShadow: '0 4px 14px rgba(79,70,229,0.4)',
          }}>
            <span style={{ fontSize: '28px', color: 'white', fontWeight: '700' }}>AI</span>
          </div>

          <h1 style={{
            fontSize: '24px', fontWeight: '700', color: '#1a1a2e', marginBottom: '6px',
          }}>
            AI Case Manager
          </h1>
          <p style={{
            fontSize: '14px', color: '#6b7280', marginBottom: '32px', lineHeight: '1.5',
          }}>
            AI-Powered Nonprofit Case Management Platform
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '0 36px 36px' }}>
          {error && (
            <div style={{
              padding: '10px 14px', borderRadius: '8px', marginBottom: '16px',
              background: '#fef2f2', color: '#dc2626', fontSize: '13px', fontWeight: '500',
              border: '1px solid #fecaca',
            }}>
              {error}
            </div>
          )}

          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{
              width: '100%', justifyContent: 'center', padding: '12px',
              fontSize: '15px', fontWeight: '600', marginTop: '8px',
              background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            margin: '20px 0',
          }}>
            <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
            <span style={{ fontSize: '12px', color: '#9ca3af', fontWeight: '500' }}>OR</span>
            <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
          </div>

          <button
            type="button"
            aria-label="Auto Fill Demo Credentials"
            className="btn btn-outline"
            onClick={handleQuickLogin}
            style={{
              width: '100%', justifyContent: 'center', padding: '10px',
              fontSize: '13px', color: '#6b7280',
            }}
          >
            <span style={{ fontSize: '16px' }}>&#9889;</span>
            Auto Fill Demo Credentials
          </button>
        </form>
      </div>
    </div>
  );
}
