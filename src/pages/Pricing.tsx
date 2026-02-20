import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../i18n';
import { useAuth } from '../contexts/AuthContext';

interface PolarPrice {
  id:                 string;
  price_amount:       number;
  price_currency:     string;
  type:               'one_time' | 'recurring';
  recurring_interval?: 'month' | 'year';
  is_archived:        boolean;
}

interface PolarProduct {
  id:          string;
  name:        string;
  description: string | null;
  prices:      PolarPrice[];
}

function formatPrice(price: PolarPrice, t: (k: string) => string): string {
  const amount = (price.price_amount / 100).toLocaleString('en-US', {
    style:    'currency',
    currency: price.price_currency.toUpperCase(),
    maximumFractionDigits: 0,
  });
  if (price.type === 'recurring') {
    return `${amount}${price.recurring_interval === 'year' ? t('pricing_yearly') : t('pricing_per_month')}`;
  }
  return `${amount} ${t('pricing_one_time')}`;
}

function getActivePrice(product: PolarProduct): PolarPrice | undefined {
  return product.prices.find(p => !p.is_archived);
}

// ─── Plan card ────────────────────────────────────────────────────────────────
function PlanCard({
  product,
  index,
  onBuy,
  busy,
}: {
  product: PolarProduct;
  index:   number;
  onBuy:   (productId: string) => void;
  busy:    string | null;
}) {
  const { t } = useLang();
  const price  = getActivePrice(product);
  const accents = ['badge-violet', 'badge-teal', 'badge-gold'];
  const accent  = accents[index % accents.length];

  return (
    <div className={`plan-card animate-fade-up`} style={{ animationDelay: `${index * 80}ms` }}>
      <div className="plan-card__header">
        <span className={`badge ${accent}`}>{product.name}</span>
      </div>

      {price && (
        <div className="plan-card__price">
          {formatPrice(price, t as (k: string) => string)}
        </div>
      )}

      {product.description && (
        <p className="plan-card__desc">{product.description}</p>
      )}

      <button
        type="button"
        className="btn btn-teal btn-lg plan-card__cta"
        onClick={() => onBuy(product.id)}
        disabled={!!busy}
      >
        {busy === product.id ? '🌀 …' : t('pricing_cta')}
      </button>
    </div>
  );
}

// ─── Skeleton card ────────────────────────────────────────────────────────────
function SkeletonCard({ delay }: { delay: number }) {
  return (
    <div className="plan-card plan-card--skeleton animate-fade-up" style={{ animationDelay: `${delay}ms` }}>
      <div className="skeleton skeleton--badge" />
      <div className="skeleton skeleton--price" />
      <div className="skeleton skeleton--line" />
      <div className="skeleton skeleton--line skeleton--line-short" />
      <div className="skeleton skeleton--btn" />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Pricing() {
  const { t }    = useLang();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [products, setProducts] = useState<PolarProduct[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [busy,     setBusy]     = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/products')
      .then(r => r.json())
      .then((data: unknown) => {
        if (Array.isArray(data)) {
          setProducts(data as PolarProduct[]);
        } else {
          setError(t('pricing_error'));
        }
      })
      .catch(() => setError(t('pricing_error')))
      .finally(() => setLoading(false));
  }, [t]);

  async function handleBuy(productId: string) {
    setBusy(productId);
    try {
      const res = await fetch('/api/checkout', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          customerEmail: user?.email,
        }),
      });

      const data = await res.json() as { url?: string; error?: string };

      if (!res.ok || !data.url) {
        alert(data.error ?? t('pricing_error'));
        return;
      }

      window.location.href = data.url;
    } catch {
      alert(t('pricing_error'));
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

      {loading && (
        <div className="plan-grid">
          {[0, 1, 2].map(i => <SkeletonCard key={i} delay={i * 80} />)}
        </div>
      )}

      {error && !loading && (
        <div className="card animate-fade-up" style={{ textAlign: 'center', color: 'var(--rose)' }}>
          <p>{error}</p>
          <button className="btn btn-ghost btn-sm" style={{ marginTop: '1rem' }} onClick={() => navigate(0)}>
            ↺ Retry
          </button>
        </div>
      )}

      {!loading && !error && (
        <div className="plan-grid">
          {products.map((p, i) => (
            <PlanCard key={p.id} product={p} index={i} onBuy={handleBuy} busy={busy} />
          ))}
        </div>
      )}

      <p className="pricing-note animate-fade-up">
        🐱 &nbsp;Nutrients power LoreCraft, LoreCheck, and Simulator. They never expire.
      </p>

    </div>
  );
}
