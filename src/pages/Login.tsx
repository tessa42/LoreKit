import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../i18n';

export default function Login() {
  const { signIn, loading } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState<string | null>(null);
  const [busy,     setBusy]     = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);

    const err = await signIn(email, password);
    if (err) {
      setError(err.message);
      setBusy(false);
    } else {
      navigate('/');
    }
  }

  // Prevent flash while session is being restored
  if (loading) return null;

  return (
    <div className="page-wrapper">
      <div className="auth-page animate-fade-up">

        <div className="section-header">
          <span className="eyebrow">{t('auth_eyebrow')}</span>
          <h1>{t('auth_login_title')}</h1>
          <p>{t('auth_login_desc')}</p>
        </div>

        <div className="card auth-card">
          <form onSubmit={handleSubmit} noValidate>

            <div className="form-group">
              <label className="form-label" htmlFor="login-email">
                {t('auth_email_label')}
              </label>
              <input
                id="login-email"
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
              <label className="form-label" htmlFor="login-password">
                {t('auth_password_label')}
              </label>
              <input
                id="login-password"
                type="password"
                className="form-input"
                placeholder={t('auth_password_placeholder')}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
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
                disabled={busy || !email || !password}
              >
                {busy ? t('auth_logging_in') : t('auth_login_btn')}
              </button>
            </div>

          </form>

          <div className="auth-card__footer">
            <p>
              {t('auth_no_account')}{' '}
              <Link to="/signup">{t('auth_go_signup')}</Link>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
