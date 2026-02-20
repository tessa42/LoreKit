import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../i18n';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { fetchReports, deleteReport, type SavedReport, type ReportType } from '../lib/library';

type Tab = 'library' | 'info' | 'account';

// ─── Type badge ───────────────────────────────────────────────────────────────
function TypeBadge({ type }: { type: ReportType }) {
  const map: Record<ReportType, { icon: string; cls: string; label: string }> = {
    lorecraft: { icon: '🔮', cls: 'badge-violet', label: 'LoreCraft'  },
    lorecheck: { icon: '📜', cls: 'badge-teal',   label: 'LoreCheck'  },
    simulator: { icon: '✨', cls: 'badge-gold',   label: 'Simulator'  },
  };
  const { icon, cls, label } = map[type];
  return <span className={`badge ${cls}`}>{icon} {label}</span>;
}

// ─── Expanded content per type ────────────────────────────────────────────────
function LibraryItemContent({ item }: { item: SavedReport }) {
  const data = item.data as Record<string, unknown>;

  if (item.type === 'lorecraft') {
    const overview = (data['overview'] as string | undefined) ?? '';
    const sections = (data['sections'] as Array<{ title: string }> | undefined) ?? [];
    return (
      <div className="library-item__body">
        <p className="library-item__excerpt">{overview.slice(0, 400)}{overview.length > 400 ? '…' : ''}</p>
        {sections.length > 0 && (
          <div className="library-item__sections">
            {sections.map((s, i) => (
              <span key={i} className="library-item__section-chip">{s.title}</span>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (item.type === 'lorecheck') {
    const report = (data['report'] as Record<string, unknown> | undefined) ?? data;
    const impression = (report['overallImpression'] as string | undefined) ?? '';
    const stability  = (report['stability']         as string | undefined) ?? '';
    const eyebrow    = (report['eyebrowRaiseRisk']  as string | undefined) ?? '';
    const worldText  = (data['worldText']           as string | undefined) ?? '';
    return (
      <div className="library-item__body">
        {worldText && (
          <p className="library-item__excerpt library-item__excerpt--muted">
            {worldText.slice(0, 120)}{worldText.length > 120 ? '…' : ''}
          </p>
        )}
        <p className="library-item__excerpt">{impression}</p>
        {stability && (
          <div className="library-item__meta-row">
            <span>Stability: <strong>{stability}</strong></span>
            <span>Eyebrow risk: <strong>{eyebrow}</strong></span>
          </div>
        )}
      </div>
    );
  }

  if (item.type === 'simulator') {
    const role  = (data['roleArchetype']  as string | undefined) ?? '';
    const world = (data['assignedWorld']  as string | undefined) ?? '';
    const quote = (data['fateQuote']      as string | undefined) ?? '';
    const hooks = (data['storyHookLines'] as string[] | undefined) ?? [];
    return (
      <div className="library-item__body">
        {(role || world) && (
          <p className="library-item__role">
            {role}{role && world ? ' · ' : ''}{world}
          </p>
        )}
        {hooks.length > 0 && (
          <p className="library-item__excerpt">{hooks.join(' ')}</p>
        )}
        {quote && (
          <blockquote className="library-item__quote">"{quote}"</blockquote>
        )}
      </div>
    );
  }

  return null;
}

// ─── Library Tab ──────────────────────────────────────────────────────────────
function LibraryTab({ userId }: { userId: string }) {
  const { t } = useLang();
  const [reports,  setReports]  = useState<SavedReport[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState<ReportType | 'all'>('all');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await fetchReports(userId);
    setReports(data ?? []);
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  function toggleExpand(id: string) {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function handleDelete(id: string) {
    if (!confirm(t('mypage_library_delete_confirm'))) return;
    setDeleting(prev => new Set(prev).add(id));
    await deleteReport(id);
    setReports(prev => prev.filter(r => r.id !== id));
    setDeleting(prev => { const s = new Set(prev); s.delete(id); return s; });
  }

  const filtered = filter === 'all' ? reports : reports.filter(r => r.type === filter);

  if (loading) {
    return (
      <div className="spinner-wrap" style={{ minHeight: '8rem' }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="mypage-section">
      <div className="library-filter">
        {(['all', 'lorecraft', 'lorecheck', 'simulator'] as const).map(f => (
          <button
            key={f}
            className={`btn btn-ghost btn-sm${filter === f ? ' btn-ghost--active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? t('mypage_library_filter_all') : f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', color: 'var(--muted)', padding: '2.5rem 1.5rem' }}>
          <p style={{ margin: 0 }}>🌱 {t('mypage_library_empty')}</p>
        </div>
      ) : (
        <div className="library-list">
          {filtered.map(item => {
            const isExpanded = expanded.has(item.id);
            const date = new Date(item.created_at).toLocaleDateString();
            return (
              <div key={item.id} className={`library-item${isExpanded ? ' library-item--expanded' : ''}`}>
                <div className="library-item__header">
                  <TypeBadge type={item.type} />
                  <span className="library-item__title">{item.title}</span>
                  <span className="library-item__date">{date}</span>
                  <div className="library-item__actions">
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => toggleExpand(item.id)}
                      aria-label={isExpanded ? 'Collapse' : 'Expand'}
                    >
                      {isExpanded ? '▲' : '▼'}
                    </button>
                    <button
                      className="btn btn-ghost btn-sm library-item__delete-btn"
                      onClick={() => handleDelete(item.id)}
                      disabled={deleting.has(item.id)}
                      aria-label={t('mypage_library_delete')}
                    >
                      ✕
                    </button>
                  </div>
                </div>
                {isExpanded && <LibraryItemContent item={item} />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Info Tab ─────────────────────────────────────────────────────────────────
function InfoTab() {
  const { t } = useLang();
  const { user, seeds, signOut } = useAuth();
  const navigate = useNavigate();

  const joinDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString()
    : '—';

  async function handleSignOut() {
    await signOut();
    navigate('/');
  }

  return (
    <div className="mypage-section">
      <div className="card">
        <div className="mypage-info-row">
          <span className="mypage-info-label">{t('mypage_info_email')}</span>
          <span className="mypage-info-value">{user?.email}</span>
        </div>
        <div className="mypage-info-row">
          <span className="mypage-info-label">{t('mypage_info_seeds')}</span>
          <span className="mypage-info-value">🌱 {seeds}</span>
        </div>
        <div className="mypage-info-row">
          <span className="mypage-info-label">{t('mypage_info_member_since')}</span>
          <span className="mypage-info-value">{joinDate}</span>
        </div>
        <div style={{ marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border)' }}>
          <button className="btn btn-ghost btn-sm" onClick={handleSignOut}>
            {t('mypage_info_signout')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Account Tab ──────────────────────────────────────────────────────────────
function AccountTab() {
  const { t } = useLang();
  const { user, session, signOut } = useAuth();
  const navigate = useNavigate();

  const [resetSent,    setResetSent]    = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [deleteInput,  setDeleteInput]  = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError,  setDeleteError]  = useState<string | null>(null);

  const confirmPhrase = t('mypage_delete_confirm_placeholder');

  async function handleResetPassword() {
    if (!user?.email) return;
    setResetLoading(true);
    await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/mypage`,
    });
    setResetSent(true);
    setResetLoading(false);
  }

  async function handleDeleteAccount() {
    if (deleteInput !== confirmPhrase || deleteLoading) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      const res = await fetch('/api/delete-account', {
        method:  'DELETE',
        headers: { 'Authorization': `Bearer ${session?.access_token ?? ''}` },
      });
      if (res.ok) {
        await signOut();
        navigate('/');
      } else {
        const data = await res.json() as { error?: string };
        setDeleteError(data.error ?? t('err_generic'));
      }
    } catch {
      setDeleteError(t('err_server'));
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className="mypage-section">

      {/* ── Password Reset ────────────────────────────────────────────── */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <h3 className="mypage-section-title">{t('mypage_reset_pw_title')}</h3>
        <p style={{ color: 'var(--muted)', margin: '0.5rem 0 1.25rem' }}>
          {t('mypage_reset_pw_desc')}
        </p>
        {resetSent ? (
          <p style={{ color: 'var(--teal)', margin: 0 }}>✓ {t('mypage_reset_pw_sent')}</p>
        ) : (
          <button
            className="btn btn-ghost btn-sm"
            onClick={handleResetPassword}
            disabled={resetLoading}
          >
            {resetLoading ? '…' : t('mypage_reset_pw_btn')}
          </button>
        )}
      </div>

      {/* ── Delete Account ────────────────────────────────────────────── */}
      <div className="card mypage-danger-card">
        <h3 className="mypage-section-title mypage-section-title--danger">
          {t('mypage_delete_title')}
        </h3>
        <p style={{ color: 'var(--muted)', margin: '0.5rem 0 1.25rem' }}>
          {t('mypage_delete_desc')}
        </p>
        <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem' }}>
          {t('mypage_delete_confirm_label')}
        </label>
        <input
          type="text"
          className="form-input"
          placeholder={confirmPhrase}
          value={deleteInput}
          onChange={e => setDeleteInput(e.target.value)}
          style={{ marginBottom: '1rem' }}
        />
        {deleteError && (
          <p style={{ color: 'var(--rose)', margin: '0 0 0.75rem' }}>{deleteError}</p>
        )}
        <button
          className="btn btn-sm mypage-delete-btn"
          onClick={handleDeleteAccount}
          disabled={deleteInput !== confirmPhrase || deleteLoading}
        >
          {deleteLoading ? t('mypage_delete_ing') : t('mypage_delete_btn')}
        </button>
      </div>

    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function MyPage() {
  const { t }  = useLang();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('library');

  useEffect(() => {
    if (!loading && !user) navigate('/login');
  }, [user, loading, navigate]);

  if (loading || !user) return null;

  const TABS: { id: Tab; label: string }[] = [
    { id: 'library', label: t('mypage_tab_library') },
    { id: 'info',    label: t('mypage_tab_info')    },
    { id: 'account', label: t('mypage_tab_account') },
  ];

  return (
    <div className="page-wrapper">

      <section className="section-header animate-fade-up">
        <h1>{t('mypage_title')}</h1>
      </section>

      {/* ── Tabs ──────────────────────────────────────────────────────── */}
      <div className="mypage-tabs animate-fade-up" style={{ animationDelay: '40ms' }}>
        {TABS.map(tab_ => (
          <button
            key={tab_.id}
            className={`mypage-tab${tab === tab_.id ? ' mypage-tab--active' : ''}`}
            onClick={() => setTab(tab_.id)}
          >
            {tab_.label}
          </button>
        ))}
      </div>

      {/* ── Content ───────────────────────────────────────────────────── */}
      {tab === 'library' && <LibraryTab userId={user.id} />}
      {tab === 'info'    && <InfoTab />}
      {tab === 'account' && <AccountTab />}

    </div>
  );
}
