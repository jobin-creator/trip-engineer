# Trip Engineer — Command Reference

All commands run from `~/Documents/trip-engineer` unless noted.

---

## Local Development

```bash
# Install dependencies (first time or after adding packages)
npm install

# Start dev server → http://localhost:3000
npm run dev

# Type-check without building
npx tsc --noEmit

# Production build (test before deploying)
npm run build

# Run the production build locally
npm start
```

---

## Package Management

```bash
# Packages installed so far
npm install @anthropic-ai/sdk
npm install react-markdown

# Future: Upstash Redis rate limiter
npm install @upstash/ratelimit @upstash/redis
```

---

## Git

```bash
# One-time setup (if not already done)
git init
git remote add origin https://github.com/YOUR_USERNAME/trip-engineer.git

# Check what's changed
git status
git diff

# Stage and commit
git add .
git commit -m "your message here"

# Push to GitHub
git push origin main

# Pull latest from GitHub
git pull origin main

# View commit history (compact)
git log --oneline

# Create a branch (e.g. before a risky change)
git checkout -b feature/my-feature

# Switch back to main
git checkout main

# Merge a branch into main
git merge feature/my-feature
```

### Recommended commit messages for this project
```bash
git commit -m "feat: add travel info tab with dates and stay area"
git commit -m "fix: correct rate limiter window reset logic"
git commit -m "chore: swap in-memory rate limiter for Upstash Redis"
git commit -m "deploy: add vercel.json with fra1 region lock"
```

---

## Vercel

```bash
# Install Vercel CLI (one-time, global)
npm install -g vercel

# Login to Vercel
vercel login

# First deploy (interactive — links project to Vercel)
vercel

# Deploy to production
vercel --prod

# Check deployment logs
vercel logs

# List all deployments
vercel ls

# Pull env vars from Vercel to local .env.local
vercel env pull .env.local

# Add an environment variable to Vercel (e.g. API key)
vercel env add ANTHROPIC_API_KEY

# Inspect a specific deployment
vercel inspect <deployment-url>
```

---

## Environment Variables

```bash
# View your local env file (never commit this)
cat .env.local

# Confirm .env.local is gitignored
grep ".env" .gitignore
```

### `.env.local` should contain:
```
ANTHROPIC_API_KEY=sk-ant-...
```

### For Upstash (when added):
```
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

---

## `vercel.json` (to be created — fra1 region lock)

Place this file at the project root `~/Documents/trip-engineer/vercel.json`:

```json
{
  "regions": ["fra1"],
  "functions": {
    "src/app/api/**": {
      "maxDuration": 30
    }
  }
}
```

- `fra1` = Frankfurt — keeps data in the EU for GDPR
- `maxDuration: 30` = allows up to 30s for long itinerary streams (default is 10s)

---

## Useful One-Liners

```bash
# Check Node and npm versions
node -v && npm -v

# See what's installed in the project
npm list --depth=0

# Clear Next.js build cache (fixes most strange build errors)
rm -rf .next

# Check which port is using 3000 (if dev server won't start)
lsof -i :3000

# Kill whatever is on port 3000
kill -9 $(lsof -t -i :3000)
```

---

## Project File Map

```
~/Documents/trip-engineer/
├── src/
│   └── app/
│       ├── api/
│       │   └── generate-itinerary/
│       │       └── route.ts        ← API route (server-side, streaming)
│       ├── page.tsx                ← UI (tabs, form, result)
│       ├── layout.tsx              ← Root layout (Next.js default)
│       └── globals.css             ← Global styles (Next.js default)
├── .env.local                      ← API key (gitignored)
├── .gitignore
├── next.config.ts
├── package.json
├── tsconfig.json
└── vercel.json                     ← To be created (fra1 region lock)
```
