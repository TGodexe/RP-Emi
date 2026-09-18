# Emi & Mark — AI Roleplay

A small AI-powered roleplay website. The frontend is static, while `/api/chat` is a Vercel serverless function that calls the OpenAI Responses API.

## Why Vercel instead of GitHub Pages only?

GitHub Pages is static hosting. An OpenAI API key must not be exposed in browser JavaScript, so this project keeps the key in a server-side environment variable.

You can still keep the entire project in GitHub and connect that repository to Vercel.

## Features

- AI-generated Emi replies based on recent conversation context
- Slow-burn relationship state
- Emi, Daniel, Mia, and Ryan
- Local chat saving with `localStorage`
- Editable scene and affection value
- Mobile-friendly UI
- No API key in client-side code
- OpenAI Responses API

## Deploy

### 1. Push this folder to GitHub

Create a repository, then upload/push all project files.

### 2. Import the repository into Vercel

Create a new Vercel project and import your GitHub repository.

### 3. Add environment variables

In Vercel:

`Project Settings -> Environment Variables`

Add:

- `OPENAI_API_KEY` = your OpenAI API key
- Optional: `OPENAI_MODEL` = `gpt-5.6-luna`

### 4. Deploy

Deploy the project. Vercel will host the frontend and `/api/chat` together.

## Local development

Install Vercel CLI dependencies:

```bash
npm install
```

Create `.env.local`:

```env
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-5.6-luna
```

Then:

```bash
npm run dev
```

Open the localhost URL shown by Vercel.

## Important security note

Never put `OPENAI_API_KEY` in `public/app.js`, `index.html`, a GitHub Pages configuration file, or any browser-side JavaScript.

## Customize Emi

Edit `BASE_CHARACTER_PROMPT` inside:

`api/chat.js`

You can change her personality, side characters, style, relationship logic, and story rules there.
