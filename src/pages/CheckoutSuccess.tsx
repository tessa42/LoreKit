import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../i18n';
import { useAuth } from '../contexts/AuthContext';

export default function CheckoutSuccess() {
  const { t } = useLang();
  const navigate = useNavigate();
  const { refetchSeeds } = useAuth();

  useEffect(() => {
    refetchSeeds();
  }, [refetchSeeds]);

  return (
    <div className="page-wrapper">
      <div className="auth-page animate-fade-up">
        <div className="card auth-card auth-card--done">
          <div className="auth-done-icon">✦</div>
          <h2>{t('checkout_success_title')}</h2>
          <p>{t('checkout_success_desc')}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              className="btn btn-teal btn-lg"
              onClick={() => navigate('/lorecraft')}
            >
              {t('checkout_success_cta')}
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => navigate('/pricing')}
            >
              {t('checkout_success_orders')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
