/**
 * Shared environment bindings.
 * Every Cloudflare Pages Function must type its `env` parameter with this interface.
 * Secrets are injected by Cloudflare at runtime — never hardcoded.
 *
 * Local dev: set values in .dev.vars (git-ignored)
 * Production: set in Cloudflare Pages dashboard → Settings → Environment Variables
 */
export interface Env {
  /** OpenAI secret key — required for LoreCraft, LoreCheck, and Simulator endpoints */
  OPENAI_API_KEY:    string;
  /** Supabase project URL — required for seeds spending */
  SUPABASE_URL:      string;
  /** Supabase service role key — required for seeds spending */
  SUPABASE_SERVICE_KEY: string;
}
