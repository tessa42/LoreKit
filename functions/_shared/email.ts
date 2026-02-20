/**
 * Resend email utility for Cloudflare Pages Functions.
 * Uses the Resend REST API directly (no npm package needed in Workers).
 */

const RESEND_API = 'https://api.resend.com/emails';

// ── Update this to your verified Resend sender domain ──────────────────────
export const FROM = 'LoreKit <hello@lorekit.cc>';

interface SendEmailOptions {
  to:      string;
  subject: string;
  html:    string;
  apiKey:  string;
}

export async function sendEmail({ to, subject, html, apiKey }: SendEmailOptions): Promise<void> {
  const res = await fetch(RESEND_API, {
    method:  'POST',
    headers: {
      Authorization:  `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM, to: [to], subject, html }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Resend ${res.status}: ${text}`);
  }
}

// ── Email templates ────────────────────────────────────────────────────────

function base(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#07050f;font-family:'Segoe UI',Arial,sans-serif;color:#e2e0f0;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#07050f;padding:40px 0;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#100d20;border-radius:12px;border:1px solid #2a2440;overflow:hidden;max-width:560px;width:100%;">
      <!-- Header -->
      <tr>
        <td style="background:linear-gradient(135deg,#1a1035 0%,#0f0a28 100%);padding:32px 40px;border-bottom:1px solid #2a2440;">
          <p style="margin:0;font-size:22px;font-weight:700;color:#e2e0f0;letter-spacing:-0.3px;">🐱 LoreKit</p>
        </td>
      </tr>
      <!-- Body -->
      <tr>
        <td style="padding:36px 40px;">
          ${body}
        </td>
      </tr>
      <!-- Footer -->
      <tr>
        <td style="padding:20px 40px 28px;border-top:1px solid #2a2440;">
          <p style="margin:0;font-size:12px;color:#6b6880;line-height:1.6;">
            You're receiving this because you have a LoreKit account.<br/>
            <a href="https://lorekit.cc" style="color:#2dd4bf;text-decoration:none;">lorekit.cc</a>
            &nbsp;·&nbsp;
            <a href="mailto:tessaxlii@gmail.com" style="color:#6b6880;text-decoration:none;">tessaxlii@gmail.com</a>
          </p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

export function welcomeEmail(email: string): { subject: string; html: string } {
  const subject = 'Welcome to LoreKit 🐱';
  const html = base('Welcome to LoreKit', `
    <h1 style="margin:0 0 12px;font-size:24px;font-weight:700;color:#e2e0f0;">Welcome, worldbuilder.</h1>
    <p style="margin:0 0 20px;font-size:15px;color:#a89ec0;line-height:1.7;">
      Your LoreKit account (<strong style="color:#e2e0f0;">${email}</strong>) is ready.
      A wise cat and three powerful tools are at your side.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
      <tr>
        <td style="padding:14px 16px;background:#0d0a1e;border-radius:8px;border-left:3px solid #7c3aed;margin-bottom:10px;">
          <p style="margin:0;font-size:14px;font-weight:600;color:#e2e0f0;">🔮 LoreCraft</p>
          <p style="margin:4px 0 0;font-size:13px;color:#a89ec0;">Build your world's DNA and get a deep verification report.</p>
        </td>
      </tr>
      <tr><td style="height:8px;"></td></tr>
      <tr>
        <td style="padding:14px 16px;background:#0d0a1e;border-radius:8px;border-left:3px solid #2dd4bf;">
          <p style="margin:0;font-size:14px;font-weight:600;color:#e2e0f0;">📜 LoreCheck</p>
          <p style="margin:4px 0 0;font-size:13px;color:#a89ec0;">Scan any passage for plausibility tensions before your readers find them.</p>
        </td>
      </tr>
      <tr><td style="height:8px;"></td></tr>
      <tr>
        <td style="padding:14px 16px;background:#0d0a1e;border-radius:8px;border-left:3px solid #f59e0b;">
          <p style="margin:0;font-size:14px;font-weight:600;color:#e2e0f0;">✨ Simulator</p>
          <p style="margin:4px 0 0;font-size:13px;color:#a89ec0;">Drop your name and a vibe. Receive a character card in a handcrafted world.</p>
        </td>
      </tr>
    </table>

    <table cellpadding="0" cellspacing="0">
      <tr>
        <td style="background:#2dd4bf;border-radius:8px;padding:12px 28px;">
          <a href="https://lorekit.cc" style="color:#07050f;font-size:14px;font-weight:700;text-decoration:none;">Start Building →</a>
        </td>
      </tr>
    </table>
  `);
  return { subject, html };
}

const PRODUCT_NAMES: Record<string, { en: string; seeds: number }> = {
  'b297051d-b196-4c47-8d1d-438b2f625d58': { en: '5 World-Tree Seeds',  seeds: 5  },
  'eb7df972-16ef-4d6f-8955-492eb8521a39': { en: '12 World-Tree Seeds', seeds: 12 },
  'ece78c7b-fb38-4c50-9338-2926a8ab2f8f': { en: '30 World-Tree Seeds', seeds: 30 },
};

export function purchaseEmail(
  email: string,
  productId: string,
  orderId: string,
): { subject: string; html: string } {
  const product  = PRODUCT_NAMES[productId] ?? { en: 'Nutrients Pack', seeds: 0 };
  const subject  = `Your Nutrients are ready! 🌱`;
  const html = base('Purchase Confirmed', `
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#e2e0f0;">Payment confirmed.</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#a89ec0;line-height:1.7;">
      Your <strong style="color:#2dd4bf;">${product.en}</strong> have been added to your account
      (<strong style="color:#e2e0f0;">${email}</strong>). Time to build worlds.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;background:#0d0a1e;border-radius:10px;border:1px solid #2a2440;overflow:hidden;">
      <tr>
        <td style="padding:20px 24px;">
          <p style="margin:0 0 4px;font-size:12px;color:#6b6880;text-transform:uppercase;letter-spacing:0.8px;">You received</p>
          <p style="margin:0;font-size:26px;font-weight:700;color:#2dd4bf;">🌱 ${product.en}</p>
          ${product.seeds > 0 ? `<p style="margin:6px 0 0;font-size:13px;color:#a89ec0;">${product.seeds} Seeds · AI usage credits for LoreCraft, LoreCheck & Simulator</p>` : ''}
        </td>
      </tr>
      <tr>
        <td style="padding:0 24px 20px;">
          <p style="margin:0;font-size:12px;color:#6b6880;">Order ID: <span style="color:#a89ec0;font-family:monospace;">${orderId}</span></p>
        </td>
      </tr>
    </table>

    <table cellpadding="0" cellspacing="0" style="margin:0 0 16px;">
      <tr>
        <td style="background:#2dd4bf;border-radius:8px;padding:12px 28px;">
          <a href="https://lorekit.cc/lorecraft" style="color:#07050f;font-size:14px;font-weight:700;text-decoration:none;">Start Building →</a>
        </td>
      </tr>
    </table>

    <p style="margin:0;font-size:12px;color:#6b6880;line-height:1.6;">
      Seeds never expire. Questions? Reply to this email or visit our <a href="https://lorekit.cc/refund" style="color:#2dd4bf;text-decoration:none;">Refund Policy</a>.
    </p>
  `);
  return { subject, html };
}

export function refundEmail(
  email: string,
  productId: string,
  orderId: string,
): { subject: string; html: string } {
  const product = PRODUCT_NAMES[productId] ?? { en: 'Nutrients Pack', seeds: 0 };
  const subject = 'Your refund has been processed';
  const html = base('Refund Processed', `
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#e2e0f0;">Refund processed.</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#a89ec0;line-height:1.7;">
      Your refund for <strong style="color:#e2e0f0;">${product.en}</strong> has been initiated
      for account <strong style="color:#e2e0f0;">${email}</strong>.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;background:#0d0a1e;border-radius:10px;border:1px solid #2a2440;overflow:hidden;">
      <tr>
        <td style="padding:20px 24px;">
          <p style="margin:0 0 12px;font-size:14px;color:#a89ec0;">The refund amount will appear on your original payment method within <strong style="color:#e2e0f0;">5–10 business days</strong>, depending on your bank.</p>
          <p style="margin:0;font-size:12px;color:#6b6880;">Order ID: <span style="color:#a89ec0;font-family:monospace;">${orderId}</span></p>
        </td>
      </tr>
    </table>

    <p style="margin:0;font-size:13px;color:#a89ec0;line-height:1.7;">
      If you have any questions about this refund, please contact us at
      <a href="mailto:tessaxlii@gmail.com" style="color:#2dd4bf;text-decoration:none;">tessaxlii@gmail.com</a>
      with your order ID.
    </p>
  `);
  return { subject, html };
}
