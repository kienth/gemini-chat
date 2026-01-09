# gemini-chat

## Setup

1. Install deps

`npm install`

2. Create `.env.local` (do not commit)

Example:

```
GEMINI_API_KEY=YOUR_KEY_HERE
GEMINI_MODEL=gemini-1.5-flash
```

3. Run

`npm run dev`

## Fixing 403: "Your API key was reported as leaked"

This error means the key has been revoked by Google and cannot be used again.

- Create a new Gemini API key in Google AI Studio / Google Cloud
- Replace `GEMINI_API_KEY` in `.env.local`
- Restart the dev server (`npm run dev`)

Tip: Make sure your key is only used server-side (this project calls Gemini from the Next.js route at `app/api/chat/route.ts`).
