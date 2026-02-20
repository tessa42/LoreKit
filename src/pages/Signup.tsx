import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../i18n';

export default function Signup() {
  const { signUp, loading } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [error,    setError]    = useState<string | null>(null);
  const [done,     setDone]     = useState(false);
  const [busy,     setBusy]     = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;

    if (password !== confirm) {
      setError(t('auth_password_mismatch'));
      return;
    }

    setBusy(true);
    setError(null);

    const err = await signUp(email, password);
    if (err) {
      setError(err.message);
      setBusy(false);
    } else {
      setDone(true);
      setTimeout(() => navigate('/'), 4000);
    }
  }

  if (loading) return null;

  // Post-signup confirmation screen
  if (done) {
    return (
      <div className="page-wrapper">
        <div className="auth-page animate-fade-up">
          <div className="card auth-card auth-card--done">
            <div className="auth-done-icon">🐱</div>
            <h2>{t('auth_signup_done_title')}</h2>
            <p>{t('auth_signup_done_desc')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="auth-page animate-fade-up">

        <div className="section-header">
          <span className="eyebrow">{t('auth_eyebrow')}</span>
          <h1>{t('auth_signup_title')}</h1>
          <p>{t('auth_signup_desc')}</p>
        </div>

        <div className="card auth-card">
          <form onSubmit={handleSubmit} noValidate>

            <div className="form-group">
              <label className="form-label" htmlFor="signup-email">
                {t('auth_email_label')}
              </label>
              <input
                id="signup-email"
                type="email"
                className="form-input"
                placeholder={t('auth_email_placeholder')}
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group" style={{ marginTop: 'var(--sp-md)' }}>
              <label className="form-label" htmlFor="signup-password">
                {t('auth_password_label')}
              </label>
              <input
                id="signup-password"
                type="password"
                className="form-input"
                placeholder={t('auth_password_new_placeholder')}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                minLength={8}
              />
            </div>

            <div className="form-group" style={{ marginTop: 'var(--sp-md)' }}>
              <label className="form-label" htmlFor="signup-confirm">
                {t('auth_confirm_label')}
              </label>
              <input
                id="signup-confirm"
                type="password"
                className="form-input"
                placeholder={t('auth_confirm_placeholder')}
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>

            {error && (
              <div className="auth-error" style={{ marginTop: 'var(--sp-md)' }}>
                <span>⚠</span>
                <span>{error}</span>
              </div>
            )}

            <div className="form-actions" style={{ marginTop: 'var(--sp-lg)' }}>
              <button
                type="submit"
                className="btn btn-teal btn-lg"
                disabled={busy || !email || !password || !confirm}
              >
                {busy ? t('auth_signing_up') : t('auth_signup_btn')}
              </button>
            </div>

          </form>

          <div className="auth-card__footer">
            <p>
              {t('auth_have_account')}{' '}
              <Link to="/login">{t('auth_go_login')}</Link>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
