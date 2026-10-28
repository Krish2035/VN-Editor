import React, { useState } from 'react';
import { useEditorStore } from '../store/editorStore';
import { apiLogin, apiRegister } from '../services/api';
import {
  X,
  Lock,
  Mail,
  User,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { showAuthModal, setShowAuthModal, setUser, saveProjectToCloud } = useEditorStore();
  const [mode, setMode] = useState<'login' | 'register'>('login');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!showAuthModal) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const { user, token } = await apiLogin({ email, password });
        setUser(user, token);
        setSuccess(`Welcome back, ${user.name}!`);
        // Auto sync project on login
        setTimeout(() => {
          saveProjectToCloud();
          setShowAuthModal(false);
        }, 800);
      } else {
        if (!name.trim()) throw new Error('Please enter your full name');
        const { user, token } = await apiRegister({ email, password, name });
        setUser(user, token);
        setSuccess(`Account created! Welcome to VN Pro, ${user.name}!`);
        setTimeout(() => {
          saveProjectToCloud();
          setShowAuthModal(false);
        }, 800);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication request failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setEmail('creator@vneditor.pro');
    setPassword('Password123!');
    setName('Alex Chen');
    setError(null);
    setLoading(true);

    try {
      try {
        const { user, token } = await apiLogin({
          email: 'creator@vneditor.pro',
          password: 'Password123!'
        });
        setUser(user, token);
        setSuccess('Logged in as Alex Chen (Pro Creator)');
      } catch {
        const { user, token } = await apiRegister({
          email: 'creator@vneditor.pro',
          password: 'Password123!',
          name: 'Alex Chen'
        });
        setUser(user, token);
        setSuccess('Demo account created and signed in!');
      }

      setTimeout(() => {
        saveProjectToCloud();
        setShowAuthModal(false);
      }, 700);
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="vn-auth-dialog">
        {/* Header */}
        <div className="auth-header">
          <div className="auth-brand">
            <div className="vn-logo-icon">
              <Sparkles size={16} className="cyan-glow-icon" />
            </div>
            <div>
              <h3 className="auth-title">VN Cloud Account</h3>
              <p className="auth-subtitle">PostgreSQL Sync • S3 Cloud Storage • BullMQ Export</p>
            </div>
          </div>
          <button
            onClick={() => setShowAuthModal(false)}
            className="btn-icon close-btn"
            title="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab-btn ${mode === 'login' ? 'active' : ''}`}
            onClick={() => {
              setMode('login');
              setError(null);
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`auth-tab-btn ${mode === 'register' ? 'active' : ''}`}
            onClick={() => {
              setMode('register');
              setError(null);
            }}
          >
            Create Account
          </button>
        </div>

        {/* Feedback Messages */}
        {error && (
          <div className="auth-alert error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="auth-alert success">
            <CheckCircle2 size={16} />
            <span>{success}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          {mode === 'register' && (
            <div className="input-group">
              <label>Full Name</label>
              <div className="input-wrapper">
                <User size={15} className="input-icon" />
                <input
                  type="text"
                  placeholder="e.g. Alex Chen"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          <div className="input-group">
            <label>Email Address</label>
            <div className="input-wrapper">
              <Mail size={15} className="input-icon" />
              <input
                type="email"
                placeholder="you@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label>Password</label>
            <div className="input-wrapper">
              <Lock size={15} className="input-icon" />
              <input
                type="password"
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary auth-submit-btn"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="spin-anim" />
                <span>Authenticating...</span>
              </>
            ) : mode === 'login' ? (
              <span>Sign In to VN Cloud</span>
            ) : (
              <span>Create Pro Account</span>
            )}
          </button>
        </form>

        {/* Demo Fast Login */}
        <div className="demo-login-box">
          <div className="demo-divider">
            <span>OR 1-CLICK DEMO ACCESS</span>
          </div>
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={loading}
            className="btn-demo-quick"
          >
            <ShieldCheck size={15} className="cyan-icon" />
            <span>Sign in as Demo Creator (Instant)</span>
          </button>
        </div>

        {/* Security & Multi-tenancy badge */}
        <div className="auth-footer-security">
          <ShieldCheck size={13} className="text-muted" />
          <span>Multi-Tenant IDOR Protected • SHA-256 JWT Encrypted</span>
        </div>
      </div>

      <style>{`
        .modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(4, 6, 10, 0.75);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.18s ease-out;
        }

        .vn-auth-dialog {
          width: 440px;
          background: var(--bg-surface);
          border: 1px solid var(--border-medium);
          border-radius: var(--radius-lg);
          padding: 24px;
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.6), 0 0 40px rgba(0, 242, 254, 0.08);
          animation: scaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .auth-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 20px;
        }

        .auth-brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .vn-logo-icon {
          width: 38px;
          height: 38px;
          border-radius: var(--radius-md);
          background: rgba(0, 242, 254, 0.12);
          border: 1px solid rgba(0, 242, 254, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .cyan-glow-icon {
          color: var(--accent-cyan);
          filter: drop-shadow(0 0 6px var(--accent-cyan));
        }

        .auth-title {
          font-family: var(--font-display);
          font-size: 16px;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }

        .auth-subtitle {
          font-size: 11px;
          color: var(--text-muted);
          margin: 3px 0 0 0;
          letter-spacing: 0.2px;
        }

        .auth-tabs {
          display: grid;
          grid-template-columns: 1fr 1fr;
          background: var(--bg-base);
          padding: 4px;
          border-radius: var(--radius-md);
          gap: 4px;
          margin-bottom: 18px;
        }

        .auth-tab-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          padding: 8px 12px;
          font-size: 12px;
          font-weight: 600;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .auth-tab-btn.active {
          background: var(--bg-surface-elevated);
          color: var(--accent-cyan);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
        }

        .auth-alert {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          border-radius: var(--radius-md);
          font-size: 12px;
          font-weight: 500;
          margin-bottom: 16px;
        }

        .auth-alert.error {
          background: rgba(255, 68, 68, 0.12);
          border: 1px solid rgba(255, 68, 68, 0.3);
          color: #FF5E5E;
        }

        .auth-alert.success {
          background: rgba(0, 242, 254, 0.12);
          border: 1px solid rgba(0, 242, 254, 0.3);
          color: var(--accent-cyan);
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .input-group label {
          display: block;
          font-size: 11px;
          font-weight: 600;
          color: var(--text-secondary);
          margin-bottom: 6px;
          letter-spacing: 0.3px;
        }

        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon {
          position: absolute;
          left: 12px;
          color: var(--text-muted);
        }

        .input-wrapper input {
          width: 100%;
          background: var(--bg-base);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          padding: 9px 12px 9px 36px;
          color: var(--text-primary);
          font-size: 13px;
          outline: none;
          transition: all 0.2s ease;
        }

        .input-wrapper input:focus {
          border-color: var(--accent-cyan);
          box-shadow: 0 0 0 2px rgba(0, 242, 254, 0.15);
        }

        .auth-submit-btn {
          width: 100%;
          height: 40px;
          margin-top: 4px;
          font-size: 13px;
          letter-spacing: 0.5px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .demo-login-box {
          margin-top: 18px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .demo-divider {
          display: flex;
          align-items: center;
          text-align: center;
          color: var(--text-muted);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.6px;
        }

        .demo-divider::before, .demo-divider::after {
          content: '';
          flex: 1;
          border-bottom: 1px solid var(--border-subtle);
        }

        .demo-divider span {
          padding: 0 8px;
        }

        .btn-demo-quick {
          background: var(--bg-surface-elevated);
          border: 1px solid var(--border-medium);
          color: var(--text-secondary);
          padding: 9px 14px;
          border-radius: var(--radius-md);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s ease;
        }

        .btn-demo-quick:hover {
          background: var(--bg-surface-hover);
          color: var(--text-primary);
          border-color: var(--accent-cyan);
        }

        .auth-footer-security {
          margin-top: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 10px;
          color: var(--text-muted);
        }

        .spin-anim {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          100% { transform: rotate(360deg); }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes scaleUp {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};
