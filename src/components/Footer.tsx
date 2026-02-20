import { Link } from 'react-router-dom';
import { useLang } from '../i18n';

export default function Footer() {
  const { t } = useLang();
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__links">
          <Link to="/terms">{t('footer_terms')}</Link>
          <span className="site-footer__sep" aria-hidden>·</span>
          <Link to="/refund">{t('footer_refund')}</Link>
          <span className="site-footer__sep" aria-hidden>·</span>
          <Link to="/privacy">{t('footer_privacy')}</Link>
        </div>
        <p className="site-footer__copy">© {year} LoreKit</p>
      </div>
    </footer>
  );
}
