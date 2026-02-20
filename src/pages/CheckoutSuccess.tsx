import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../i18n';
import { useAuth } from '../contexts/AuthContext';

export default function CheckoutSuccess() {
  const { t } = useLang();
  const navigate = useNavigate();
  const { refetchSeeds } = useAuth();

  // Poll until the Polar webhook has credited seeds to Supabase.
  // The webhook fires asynchronously after redirect, so a single fetch on
  // mount often reads the pre-purchase balance. We retry every 2 s for
  // up to ~24 s to catch the update.
  useEffect(() => {
    let count = 0;
    refetchSeeds();
    const id = setInterval(async () => {
      await refetchSeeds();
      if (++count >= 11) clearInterval(id);
    }, 2000);
    return () => clearInterval(id);
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
