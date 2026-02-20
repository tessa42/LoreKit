export default function Privacy() {
  return (
    <div className="page-wrapper">
      <div className="legal-page animate-fade-up">
        <h1>Privacy Policy</h1>
        <p className="legal-page__updated">Last updated: February 20, 2026</p>

        <section>
          <h2>1. Introduction</h2>
          <p>
            This Privacy Policy explains how LoreKit collects, uses, and protects your personal
            information when you use our service. We are committed to handling your data
            responsibly and transparently. By using LoreKit, you agree to the practices
            described in this policy.
          </p>
        </section>

        <section>
          <h2>2. Information We Collect</h2>

          <h3>Account Data</h3>
          <ul>
            <li>
              <strong>Email address</strong> — collected when you create an account, used for
              authentication, account recovery, and service communications.
            </li>
            <li>
              <strong>Encrypted password</strong> — stored securely via Supabase. We never
              have access to your plaintext password.
            </li>
          </ul>

          <h3>Usage Data</h3>
          <ul>
            <li>
              <strong>Nutrients balance</strong> — the current and historical count of AI
              credits associated with your account.
            </li>
            <li>
              <strong>Feature usage logs</strong> — which AI features you used and when, to
              calculate credit consumption and provide support.
            </li>
          </ul>

          <h3>AI Input Data</h3>
          <ul>
            <li>
              <strong>LoreCraft / LoreCheck inputs</strong> — text you submit is sent to
              OpenAI's API to generate responses. This content is transmitted to OpenAI and
              subject to{' '}
              <a href="https://openai.com/policies/privacy-policy" target="_blank" rel="noopener noreferrer">
                OpenAI's Privacy Policy
              </a>.
              We do not link your submitted text to your account identity when sending to OpenAI.
            </li>
            <li>
              <strong>Simulator inputs</strong> — your name and vibe selection are sent to
              OpenAI for character card generation. Portrait images are processed{' '}
              <strong>entirely within your browser</strong> and are never transmitted to
              our servers or OpenAI.
            </li>
          </ul>

          <h3>Payment Data</h3>
          <p>
            LoreKit does not collect or store payment card details. All payment information
            is handled exclusively by <strong>Polar</strong>, our payment processor and
            Merchant of Record. When you make a purchase, Polar may share with us your email
            address and order details (product purchased, amount, transaction ID) for the
            purpose of crediting Nutrients to your account. See{' '}
            <a href="https://polar.sh/legal/privacy" target="_blank" rel="noopener noreferrer">
              Polar's Privacy Policy
            </a>.
          </p>

          <h3>Technical Data</h3>
          <ul>
            <li>
              <strong>Server logs</strong> — Cloudflare automatically logs request metadata
              (IP address, timestamp, requested URL, response status). These logs are retained
              by Cloudflare per their data retention policies and are not used by LoreKit for
              profiling.
            </li>
          </ul>
        </section>

        <section>
          <h2>3. What We Do Not Collect</h2>
          <ul>
            <li>Portrait images — processed in-browser only, never transmitted to our servers</li>
            <li>Payment card numbers, CVV, or bank account details</li>
            <li>Device identifiers, advertising IDs, or tracking cookies for marketing purposes</li>
            <li>Precise location data</li>
          </ul>
          <p>
            We do not sell, rent, or share your personal data with third parties for marketing
            or advertising purposes.
          </p>
        </section>

        <section>
          <h2>4. How We Use Your Information</h2>
          <ul>
            <li>To authenticate you and manage your account</li>
            <li>To deliver AI-generated responses via our features</li>
            <li>To track and credit Nutrients (AI usage credits) to your account</li>
            <li>To process and verify purchases via Polar webhooks</li>
            <li>To respond to support requests and refund inquiries</li>
            <li>To notify you of material changes to our Terms or this Privacy Policy</li>
          </ul>
          <p>
            We do not use your data to train AI models or for any purpose beyond operating LoreKit.
          </p>
        </section>

        <section>
          <h2>5. Third-Party Services</h2>
          <ul>
            <li>
              <strong>Supabase</strong> — Authentication and account data storage.
              Your email and encrypted password are stored on Supabase infrastructure.{' '}
              <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer">
                Supabase Privacy Policy →
              </a>
            </li>
            <li>
              <strong>OpenAI</strong> — AI content generation for LoreCraft, LoreCheck, and
              Simulator. Text inputs are processed by OpenAI. OpenAI's API data usage policy
              applies.{' '}
              <a href="https://openai.com/policies/privacy-policy" target="_blank" rel="noopener noreferrer">
                OpenAI Privacy Policy →
              </a>
            </li>
            <li>
              <strong>Polar</strong> — Payment processing and Merchant of Record. Polar handles
              all billing, tax collection, and payment data.{' '}
              <a href="https://polar.sh/legal/privacy" target="_blank" rel="noopener noreferrer">
                Polar Privacy Policy →
              </a>
            </li>
            <li>
              <strong>Cloudflare</strong> — Hosting, content delivery, and DDoS protection.
              Cloudflare processes requests to LoreKit as part of its infrastructure.{' '}
              <a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener noreferrer">
                Cloudflare Privacy Policy →
              </a>
            </li>
          </ul>
        </section>

        <section>
          <h2>6. Data Retention</h2>
          <p>
            We retain your account data (email, Nutrients balance, usage logs) for as long as
            your account is active. If you delete your account, we will remove your personal
            data within <strong>30 days</strong>, except where we are required to retain certain
            records for legal or tax compliance purposes (typically up to 7 years for financial
            records, retained by Polar as MoR).
          </p>
        </section>

        <section>
          <h2>7. Children's Privacy</h2>
          <p>
            LoreKit is not directed at children under 13. We do not knowingly collect personal
            information from children under 13. If you are a parent or guardian and believe
            your child has provided us with personal data, please contact us at{' '}
            <a href="mailto:tessaxlii@gmail.com">tessaxlii@gmail.com</a> and we will promptly
            delete the information and terminate the account.
          </p>
        </section>

        <section>
          <h2>8. Your Rights</h2>
          <p>
            Depending on your location, you may have the following rights regarding your
            personal data:
          </p>
          <ul>
            <li><strong>Access</strong> — Request a copy of the personal data we hold about you.</li>
            <li><strong>Correction</strong> — Request correction of inaccurate data.</li>
            <li><strong>Deletion</strong> — Request deletion of your account and associated data.</li>
            <li><strong>Portability</strong> — Request your data in a structured, machine-readable format.</li>
            <li><strong>Objection</strong> — Object to certain processing of your data.</li>
          </ul>
          <p>
            To exercise any of these rights, contact us at{' '}
            <a href="mailto:tessaxlii@gmail.com">tessaxlii@gmail.com</a>. We will respond
            within 30 days.
          </p>
          <p>
            If you are in the EU/EEA and believe your data is being processed unlawfully, you
            have the right to lodge a complaint with your local data protection authority.
          </p>
        </section>

        <section>
          <h2>9. International Data Transfers</h2>
          <p>
            LoreKit and its service providers (Supabase, OpenAI, Cloudflare, Polar) operate
            globally. Your data may be processed in countries outside your own, including the
            United States. These transfers are governed by the data protection policies of our
            respective service providers.
          </p>
        </section>

        <section>
          <h2>10. Security</h2>
          <p>
            We take reasonable technical and organizational measures to protect your data,
            including encrypted connections (HTTPS), hashed password storage, and access
            controls. However, no system is completely secure; we cannot guarantee the absolute
            security of your information.
          </p>
        </section>

        <section>
          <h2>11. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify registered
            users of material changes by email at least 14 days before the changes take effect.
            The "Last updated" date at the top of this page reflects the most recent revision.
          </p>
        </section>

        <section>
          <h2>12. Contact</h2>
          <p>
            For privacy-related inquiries, data requests, or to report a concern, please
            contact us at{' '}
            <a href="mailto:tessaxlii@gmail.com">tessaxlii@gmail.com</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
