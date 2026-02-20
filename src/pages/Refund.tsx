export default function Refund() {
  return (
    <div className="page-wrapper">
      <div className="legal-page animate-fade-up">
        <h1>Refund Policy</h1>
        <p className="legal-page__updated">Last updated: February 20, 2026</p>

        <section>
          <h2>1. Overview</h2>
          <p>
            LoreKit sells Nutrients (AI usage credits) as one-time digital purchases.
            All transactions are processed by <strong>Polar</strong>{' '}
            (<a href="https://polar.sh" target="_blank" rel="noopener noreferrer">polar.sh</a>),
            which serves as the <strong>Merchant of Record</strong> for all LoreKit purchases.
            This means Polar is the legal seller, handles payment processing, and manages
            refund disbursements on LoreKit's behalf.
          </p>
        </section>

        <section>
          <h2>2. Refund Eligibility</h2>

          <h3>Unused Nutrients</h3>
          <p>
            If you have purchased a Nutrients pack and have <strong>not consumed any credits</strong>
            from that purchase, you are eligible for a full refund within <strong>14 days</strong>{' '}
            of the original transaction date.
          </p>

          <h3>Partially Consumed Nutrients</h3>
          <p>
            If you have used some but not all of the Nutrients from a purchase, you may be
            eligible for a <strong>partial refund</strong> proportional to the unused portion,
            at LoreKit's discretion, within 14 days of purchase. We evaluate these requests
            individually.
          </p>

          <h3>Fully Consumed Nutrients</h3>
          <p>
            Credits that have been fully consumed through use of LoreKit's AI features
            (LoreCraft, LoreCheck, Simulator) are <strong>non-refundable</strong>, as the
            digital service has been delivered in full.
          </p>

          <h3>EU / EEA Consumers</h3>
          <p>
            If you are a consumer in the European Union or European Economic Area, you have the
            right to withdraw from a digital content purchase within <strong>14 days</strong> of
            the transaction, unless you have expressly consented to the immediate supply of
            digital content and acknowledged that you lose your right of withdrawal upon supply.
            By using LoreKit's AI features after purchase, you acknowledge that the digital
            content has been supplied and your right of withdrawal may be limited to the unused
            portion of your credits.
          </p>
        </section>

        <section>
          <h2>3. Non-Refundable Situations</h2>
          <p>Refunds will <strong>not</strong> be issued in the following cases:</p>
          <ul>
            <li>Nutrients fully consumed through normal use of AI features</li>
            <li>Requests submitted more than 14 days after the original purchase date</li>
            <li>Accounts terminated for violations of our <a href="/terms">Terms of Service</a></li>
            <li>Claims of dissatisfaction with AI-generated creative output quality (AI outputs are subjective and non-deterministic)</li>
            <li>Technical issues on your device, browser, or internet connection that are outside LoreKit's control</li>
          </ul>
        </section>

        <section>
          <h2>4. How to Request a Refund</h2>
          <p>
            To request a refund, please email us at{' '}
            <a href="mailto:tessaxlii@gmail.com">tessaxlii@gmail.com</a> with the following
            information:
          </p>
          <ul>
            <li>The email address associated with your LoreKit account</li>
            <li>Your Polar order ID (found in your purchase confirmation email)</li>
            <li>The reason for your refund request</li>
          </ul>
          <p>
            We will review your request and respond within <strong>3 business days</strong>.
            Approved refunds are processed through Polar and typically appear on your original
            payment method within <strong>5–10 business days</strong>, depending on your bank
            or card issuer.
          </p>
        </section>

        <section>
          <h2>5. Dispute Resolution</h2>
          <p>
            If you believe a charge was made in error or you did not authorize a transaction,
            please contact us at{' '}
            <a href="mailto:tessaxlii@gmail.com">tessaxlii@gmail.com</a> before initiating a
            chargeback with your bank. Chargebacks that are later found to be unwarranted may
            result in account suspension.
          </p>
          <p>
            For unresolved payment disputes, you may also contact Polar directly at{' '}
            <a href="https://polar.sh" target="_blank" rel="noopener noreferrer">polar.sh</a>.
          </p>
        </section>

        <section>
          <h2>6. Changes to This Policy</h2>
          <p>
            We may update this Refund Policy from time to time. Material changes will be
            communicated to registered users by email. Continued use of LoreKit after an
            update constitutes acceptance of the revised policy.
          </p>
        </section>

        <section>
          <h2>7. Contact</h2>
          <p>
            For refund requests or billing questions, contact us at{' '}
            <a href="mailto:tessaxlii@gmail.com">tessaxlii@gmail.com</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
