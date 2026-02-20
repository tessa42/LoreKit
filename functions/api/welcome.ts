/**
 * POST /api/welcome
 *
 * Sends a welcome email to a newly registered user.
 * Called from the frontend immediately after a successful Supabase signUp().
 *
 * Body
 * ────
 * { email: string }
 *
 * Response (200)
 * ──────────────
 * { sent: true }
 */

import { sendEmail, welcomeEmail } from '../_shared/email';

interface Env {
  RESEND_API_KEY: string;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.RESEND_API_KEY) {
    console.warn('[welcome] RESEND_API_KEY not set — skipping welcome email');
    return json({ sent: false, reason: 'not configured' });
  }

  let body: { email?: string };
  try {
    body = await request.json() as typeof body;
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const { email } = body;
  if (!email || !email.includes('@')) {
    return json({ error: 'Valid email required' }, 400);
  }

  try {
    const { subject, html } = welcomeEmail(email);
    await sendEmail({ to: email, subject, html, apiKey: env.RESEND_API_KEY });
    console.log(`[welcome] sent to ${email}`);
    return json({ sent: true });
  } catch (err) {
    console.error('[welcome] failed:', err);
    // Don't fail the signup flow if email fails
    return json({ sent: false });
  }
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
