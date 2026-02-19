# 🐱 LoreKit — Worldbuilding Assistant

LoreKit is your enchanted companion for worldbuilding. Built for hackers, writers, and world-crafters.

**Stack:** React + Vite + TypeScript (frontend) · Cloudflare Pages Functions (backend) · OpenAI GPT-4o (AI)

---

## Features

| Feature | Description |
|---|---|
| **LoreCraft** | Generate a deep worldbuilding verification report from structured inputs |
| **LoreCheck** | Paste any lore and get a Quick Scan of plausibility tensions |
| **Simulator** | Get a character card from a preset magical world — free, viral, shareable |

---

## Local Development

### Prerequisites
- Node.js 20.19+ (or 22.12+)
- A Cloudflare account (free) and Wrangler CLI
- An OpenAI API key

### 1. Install dependencies
```bash
npm install
```

### 2. Set up local secrets
```bash
cp .dev.vars.example .dev.vars
# edit .dev.vars and set your OPENAI_API_KEY
```

### 3. Run the dev servers (two terminals)

**Terminal 1 — Vite frontend:**
```bash
npm run dev
# http://localhost:5173
```

**Terminal 2 — Cloudflare Pages Functions (with API proxy):**
```bash
npm run dev:cf
# http://localhost:8788  ← use this URL in the browser
```

The Vite dev server proxies `/api/*` requests to wrangler on port 8788, which handles the Cloudflare Functions.

---

## Production Deploy

### Cloudflare Pages

```bash
npm run deploy
```

Then in the Cloudflare Pages dashboard:
- **Settings → Environment Variables**
- Add `OPENAI_API_KEY` = your production OpenAI key

---

## Project Structure

```
lorekit/
├── src/
│   ├── pages/
│   │   ├── Home.tsx          Landing page
│   │   ├── LoreCraft.tsx     Worldbuilding report generator
│   │   ├── LoreCheck.tsx     Lore consistency checker
│   │   └── Simulator.tsx     Character card generator
│   ├── components/
│   │   ├── Header.tsx
│   │   └── MarkdownResult.tsx
│   ├── App.tsx               React Router root
│   └── index.css             Design system
├── functions/
│   └── api/
│       ├── lorecraft.ts      CF Pages Function — POST /api/lorecraft
│       ├── lorecheck.ts      CF Pages Function — POST /api/lorecheck
│       └── simulator.ts      CF Pages Function — POST /api/simulator
├── wrangler.toml
└── .dev.vars.example
```

---

## LoreCraft ↔ LoreCheck Cross-links

- From a **LoreCraft** result: click **"📜 Check this world"** → sends the world summary to LoreCheck
- From a **LoreCheck** result: click **"🔮 Refine with LoreCraft"** → sends the flagged issues back to LoreCraft

---

*"Every world has a logic. My job is to find where yours bends." — LoreKit 🐱*
