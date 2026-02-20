export default function Privacy() {
  return (
    <div className="page-wrapper">
      <div className="legal-page animate-fade-up">
        <h1>Privacy Policy</h1>
        <p className="legal-page__updated">Last updated: June 2025</p>

        <section>
          <h2>1. What We Collect</h2>
          <ul>
            <li>
              <strong>Account data:</strong> Email address and encrypted password, stored via
              Supabase (our authentication provider).
            </li>
            <li>
              <strong>Usage data:</strong> Nutrients (credit) balance and usage associated with
              your account.
            </li>
            <li>
              <strong>AI inputs:</strong> Text you submit to LoreCraft, LoreCheck, and Simulator
              is sent to OpenAI to generate responses. This content is not linked to your account
              when sent to OpenAI.
            </li>
          </ul>
        </section>

        <section>
          <h2>2. What We Do Not Collect</h2>
          <ul>
            <li>
              <strong>Portrait images:</strong> Images you upload in the Simulator are processed
              entirely in your browser and are never transmitted to our servers.
            </li>
            <li>We do not collect payment card details (handled by our payment processor).</li>
            <li>We do not sell or share your personal data with third parties for marketing.</li>
          </ul>
        </section>

        <section>
          <h2>3. Third-Party Services</h2>
          <ul>
            <li>
              <strong>Supabase</strong> — Authentication and account data storage.{' '}
              <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer">
                Supabase Privacy Policy
              </a>
            </li>
            <li>
              <strong>OpenAI</strong> — AI content generation (LoreCraft, LoreCheck, Simulator).{' '}
              <a href="https://openai.com/policies/privacy-policy" target="_blank" rel="noopener noreferrer">
                OpenAI Privacy Policy
              </a>
            </li>
            <li>
              <strong>Cloudflare</strong> — Hosting and content delivery.{' '}
              <a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener noreferrer">
                Cloudflare Privacy Policy
              </a>
            </li>
          </ul>
        </section>

        <section>
          <h2>4. Data Retention</h2>
          <p>
            Account data is retained for as long as your account is active. You may request
            deletion of your account and associated data at any time by contacting us.
          </p>
        </section>

        <section>
          <h2>5. Children's Privacy</h2>
          <p>
            LoreKit is not directed at children under 13. We do not knowingly collect personal
            information from children under 13. If you believe a child under 13 has provided us
            with personal data, please contact us for prompt removal.
          </p>
        </section>

        <section>
          <h2>6. Your Rights</h2>
          <p>
            Depending on your location, you may have the right to access, correct, or delete
            your personal data. To exercise these rights, contact us via the LoreKit support channel.
          </p>
        </section>

        <section>
          <h2>7. Changes</h2>
          <p>
            We may update this policy from time to time. We will notify registered users of
            material changes via email.
          </p>
        </section>

        <section>
          <h2>8. Contact</h2>
          <p>
            For privacy-related enquiries, please contact us via the LoreKit support channel.
          </p>
        </section>
      </div>
    </div>
  );
}
