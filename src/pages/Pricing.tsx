import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../i18n';
import { useAuth } from '../contexts/AuthContext';

// ─── Product catalogue (production Polar) ─────────────────────────────────────
const PLANS = [
  {
    id:          'b297051d-b196-4c47-8d1d-438b2f625d58',
    nameKo:      '세계수 씨앗 5개',
    nameEn:      '5 World-Tree Seeds',
    price:       '$4.99',
    priceLabel:  'one-time',
    badge:       'badge-violet',
    highlight:   false,
  },
  {
    id:          'eb7df972-16ef-4d6f-8955-492eb8521a39',
    nameKo:      '세계수 씨앗 12개',
    nameEn:      '12 World-Tree Seeds',
    price:       '$9.99',
    priceLabel:  'one-time',
    badge:       'badge-teal',
    highlight:   true,
  },
  {
    id:          'ece78c7b-fb38-4c50-9338-2926a8ab2f8f',
    nameKo:      '세계수 씨앗 30개',
    nameEn:      '30 World-Tree Seeds',
    price:       '$23.99',
    priceLabel:  'one-time',
    badge:       'badge-gold',
    highlight:   false,
  },
] as const;

// ─── Plan card ────────────────────────────────────────────────────────────────
function PlanCard({
  plan,
  index,
  onBuy,
  busy,
}: {
  plan:  typeof PLANS[number];
  index: number;
  onBuy: (id: string) => void;
  busy:  string | null;
}) {
  const { t, lang } = useLang();
  const name = lang === 'ko-KR' ? plan.nameKo : plan.nameEn;

  return (
    <div
      className={`plan-card animate-fade-up${plan.highlight ? ' plan-card--highlight' : ''}`}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="plan-card__header">
        <span className={`badge ${plan.badge}`}>{name}</span>
        {plan.highlight && <span className="plan-card__popular">✦ Best value</span>}
      </div>

      <div className="plan-card__price">
        {plan.price}
        <span className="plan-card__price-label">&nbsp;{plan.priceLabel}</span>
      </div>

      <button
        type="button"
        className="btn btn-teal btn-lg plan-card__cta"
        onClick={() => onBuy(plan.id)}
        disabled={!!busy}
      >
        {busy === plan.id ? '🌀 …' : t('pricing_cta')}
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Pricing() {
  const { t }    = useLang();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleBuy(productId: string) {
    setBusy(productId);
    setError(null);
    try {
      const res = await fetch('/api/checkout', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, customerEmail: user?.email }),
      });

      const data = await res.json() as { url?: string; error?: string };

      if (!res.ok || !data.url) {
        setError(data.error ?? t('pricing_error'));
        return;
      }

      window.location.href = data.url;
    } catch {
      setError(t('pricing_error'));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="page-wrapper">

      <section className="section-header animate-fade-up">
        <span className="eyebrow">{t('pricing_eyebrow')}</span>
        <h1>{t('pricing_title')}</h1>
        <p>{t('pricing_desc')}</p>
      </section>

      <div className="plan-grid">
        {PLANS.map((p, i) => (
          <PlanCard key={p.id} plan={p} index={i} onBuy={handleBuy} busy={busy} />
        ))}
      </div>

      {error && (
        <div className="card animate-fade-up" style={{ textAlign: 'center', color: 'var(--rose)', marginTop: '1.5rem' }}>
          <p>{error}</p>
          <button className="btn btn-ghost btn-sm" style={{ marginTop: '0.75rem' }} onClick={() => { setError(null); navigate(0); }}>
            ↺ Retry
          </button>
        </div>
      )}

      <p className="pricing-note animate-fade-up">
        🌱 &nbsp;{t('pricing_seeds_note')}
      </p>

    </div>
  );
}
